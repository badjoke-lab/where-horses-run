import crypto from 'node:crypto';
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';

export const KANAZAWA_SOURCE_ID = 'kanazawa-keiba-official-calendar';
export const KANAZAWA_SOURCE_LABEL = '金沢競馬';
export const KANAZAWA_OFFICIAL_ANNUAL_PDF_URL = 'https://www.kanazawakeiba.com/wp-content/uploads/2026/01/R8nenkan.pdf';
export const KANAZAWA_FISCAL_YEAR_WINDOW = Object.freeze({ start: '2026-04-01', end: '2027-03-31' });
export const KANAZAWA_OFFICIAL_SCHEDULE_URL = 'https://www.kanazawakeiba.com/schedule/';

const ANNUAL_MONTH_ORDER = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
const ANNUAL_MEETING_COLORS = new Set(['#f7c7a7', '#b4c6e7']);
const FULLWIDTH_DIGITS = '０１２３４５６７８９';
const MIN_REQUIRED_DAY_GRID = 28;

function normalizeDigits(value) {
  return String(value ?? '').replace(/[０-９]/g, (char) => String(FULLWIDTH_DIGITS.indexOf(char)));
}

function fiscalYearForMonth(month) {
  return month >= 4 ? 2026 : 2027;
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function dateFor(year, month, day) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function withinFiscalYear(date) {
  return date >= KANAZAWA_FISCAL_YEAR_WINDOW.start && date <= KANAZAWA_FISCAL_YEAR_WINDOW.end;
}

function meetingRow(date, sourceUrl, basis = 'annual_pdf') {
  return {
    meeting_id: `nar-kanazawa-racecourse-${date}`,
    date,
    authority_id: 'nar-local-government-racing',
    racing_system_id: 'japan-nar-system',
    racecourse_id: 'kanazawa-racecourse',
    venue_code: '22',
    source_id: KANAZAWA_SOURCE_ID,
    source_label: KANAZAWA_SOURCE_LABEL,
    official_source_url: sourceUrl,
    official_schedule_basis: basis,
  };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function multiplyTransform(a, b) {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}

function transformPoint(matrix, x, y) {
  return [
    matrix[0] * x + matrix[2] * y + matrix[4],
    matrix[1] * x + matrix[3] * y + matrix[5],
  ];
}

function transformedBoundingBox(matrix, bounds) {
  const points = [
    transformPoint(matrix, bounds[0], bounds[1]),
    transformPoint(matrix, bounds[0], bounds[3]),
    transformPoint(matrix, bounds[2], bounds[1]),
    transformPoint(matrix, bounds[2], bounds[3]),
  ];
  const xs = points.map((row) => row[0]);
  const ys = points.map((row) => row[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

function validateRequestedMonths(months) {
  const requested = [...new Set(months ?? ANNUAL_MONTH_ORDER)];
  if (!requested.length || requested.some((month) => !ANNUAL_MONTH_ORDER.includes(month))) {
    throw new Error(`Kanazawa annual PDF requested month set invalid: ${requested.join(',')}`);
  }
  return requested.sort((left, right) => ANNUAL_MONTH_ORDER.indexOf(left) - ANNUAL_MONTH_ORDER.indexOf(right));
}

export function decodeKanazawaAnnualScheduleGeometry({ textItems, bars, months = ANNUAL_MONTH_ORDER }) {
  const requestedMonths = validateRequestedMonths(months);
  const normalizedText = (textItems ?? []).map((item) => ({
    str: String(item.str ?? '').trim(),
    x: Number(item.x),
    y: Number(item.y),
    w: Number(item.w ?? 0),
  })).filter((item) => item.str && Number.isFinite(item.x) && Number.isFinite(item.y));

  const monthMarkers = normalizedText.filter((item) => item.x < 40).map((item) => ({
    ...item,
    month: Number(normalizeDigits(item.str)),
  })).filter((item) => requestedMonths.includes(item.month) && normalizedText.some((other) => (
    other.str === '月' && other.x < 40 && Math.abs(other.y - (item.y - 13.32)) < 2
  )));

  const uniqueMonthMarkers = new Map();
  for (const marker of monthMarkers) {
    if (uniqueMonthMarkers.has(marker.month)) throw new Error(`Kanazawa annual PDF duplicate month marker: ${marker.month}`);
    uniqueMonthMarkers.set(marker.month, marker);
  }
  for (const month of requestedMonths) {
    if (!uniqueMonthMarkers.has(month)) throw new Error(`Kanazawa annual PDF missing month marker: ${month}`);
  }

  const output = [];
  const monthDiagnostics = [];
  for (const month of requestedMonths) {
    const year = fiscalYearForMonth(month);
    const marker = uniqueMonthMarkers.get(month);
    const expectedDays = daysInMonth(year, month);
    const dayLineY = marker.y - 31.8;
    const dayItems = normalizedText.filter((item) => {
      if (Math.abs(item.y - dayLineY) > 1.5 || item.x < 40) return false;
      const day = Number(normalizeDigits(item.str));
      return Number.isInteger(day) && day >= 1 && day <= expectedDays;
    }).map((item) => ({
      ...item,
      day: Number(normalizeDigits(item.str)),
      center: item.x + item.w / 2,
    })).sort((a, b) => a.day - b.day);

    const uniqueDays = new Map(dayItems.map((item) => [item.day, item]));
    const missingRequired = Array.from({ length: MIN_REQUIRED_DAY_GRID }, (_, index) => index + 1)
      .filter((day) => !uniqueDays.has(day));
    if (missingRequired.length) {
      throw new Error(`Kanazawa annual PDF day grid invalid for ${year}-${pad2(month)}: missing ${missingRequired.join(',')}`);
    }
    const centers = Array.from({ length: MIN_REQUIRED_DAY_GRID }, (_, index) => uniqueDays.get(index + 1).center);
    const step = median(centers.slice(1).map((center, index) => center - centers[index]));
    if (!Number.isFinite(step) || step < 20 || step > 30) throw new Error(`Kanazawa annual PDF day grid spacing invalid for ${year}-${pad2(month)}`);
    const firstBoundary = centers[0] - step / 2;
    const targetBarY = marker.y - 16.68;
    const monthBars = (bars ?? []).filter((bar) => (
      ANNUAL_MEETING_COLORS.has(bar.color)
      && Math.abs(Number(bar.y0) - targetBarY) <= 1.6
      && Number(bar.h) >= 8
      && Number(bar.h) <= 9
    ));

    const monthDates = new Set();
    for (const bar of monthBars) {
      const startDay = Math.round((Number(bar.x0) - firstBoundary) / step) + 1;
      const endDay = Math.round((Number(bar.x1) - firstBoundary) / step);
      if (startDay < 1 || endDay > expectedDays || endDay < startDay) {
        throw new Error(`Kanazawa annual PDF meeting bar outside day grid for ${year}-${pad2(month)}: ${startDay}-${endDay}`);
      }
      for (let day = startDay; day <= endDay; day += 1) monthDates.add(dateFor(year, month, day));
    }
    output.push(...monthDates);
    monthDiagnostics.push({
      year,
      month,
      bar_count: monthBars.length,
      meeting_count: monthDates.size,
      printed_day_count: uniqueDays.size,
    });
  }

  return {
    dates: [...new Set(output)].sort(),
    months: monthDiagnostics,
  };
}

function extractPdfGeometry(page, textContent, operatorList) {
  const textItems = textContent.items.filter((item) => item.str?.trim()).map((item) => ({
    str: item.str.trim(),
    x: Number(item.transform[4]),
    y: Number(item.transform[5]),
    w: Number(item.width ?? 0),
  }));
  const opNames = new Map(Object.entries(OPS).map(([name, value]) => [value, name]));
  let ctm = [1, 0, 0, 1, 0, 0];
  let fill = null;
  const stack = [];
  const bars = [];
  for (let index = 0; index < operatorList.fnArray.length; index += 1) {
    const name = opNames.get(operatorList.fnArray[index]) ?? String(operatorList.fnArray[index]);
    const args = operatorList.argsArray[index];
    if (name === 'save') {
      stack.push({ ctm: [...ctm], fill });
      continue;
    }
    if (name === 'restore') {
      const state = stack.pop();
      if (state) ({ ctm, fill } = state);
      continue;
    }
    if (name === 'transform') {
      ctm = multiplyTransform(ctm, args);
      continue;
    }
    if (name === 'setFillRGBColor') {
      fill = args;
      continue;
    }
    if (name !== 'constructPath') continue;
    const rawBounds = args?.[2];
    if (!rawBounds || rawBounds.length < 4) continue;
    const bounds = transformedBoundingBox(ctm, Array.from(rawBounds));
    const width = bounds[2] - bounds[0];
    const height = bounds[3] - bounds[1];
    const color = Array.isArray(fill) && fill.length === 1 ? fill[0] : null;
    if (!ANNUAL_MEETING_COLORS.has(color)) continue;
    if (width < 20 || width > 210 || height < 8 || height > 9) continue;
    bars.push({
      color,
      x0: bounds[0],
      y0: bounds[1],
      x1: bounds[2],
      y1: bounds[3],
      w: width,
      h: height,
    });
  }
  return { pageView: page.view, textItems, bars };
}

export async function parseKanazawaAnnualPdf(bytes, months = ANNUAL_MONTH_ORDER) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (data.byteLength < 100000 || String.fromCharCode(...data.slice(0, 4)) !== '%PDF') {
    throw new Error(`Kanazawa annual PDF payload invalid: ${data.byteLength} bytes`);
  }
  const document = await getDocument({ data, useWorkerFetch: false, isEvalSupported: false }).promise;
  if (document.numPages !== 1) throw new Error(`Kanazawa annual PDF page count changed: ${document.numPages}`);
  const page = await document.getPage(1);
  const [textContent, operatorList] = await Promise.all([page.getTextContent(), page.getOperatorList()]);
  const geometry = extractPdfGeometry(page, textContent, operatorList);
  const decoded = decodeKanazawaAnnualScheduleGeometry({ ...geometry, months });
  return {
    ...decoded,
    page_view: geometry.pageView,
  };
}

export function parseKanazawaOfficialMonthlySchedule(html, year, month) {
  const body = String(html ?? '');
  const table = body.match(/<table\b[^>]*id=["']table_honba["'][^>]*>[\s\S]*?<\/table>/i)?.[0];
  if (!table) throw new Error('Kanazawa monthly official table_honba marker missing');
  const expectedDays = daysInMonth(year, month);
  const seenDays = new Set();
  const dates = [];
  for (const match of table.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)) {
    const cell = match[1];
    const dayMatch = cell.match(/<span\b[^>]*class=["'][^"']*day[^"']*["'][^>]*>\s*(\d{1,2})/i);
    if (!dayMatch) continue;
    const day = Number(dayMatch[1]);
    if (!Number.isInteger(day) || day < 1 || day > expectedDays || seenDays.has(day)) {
      throw new Error(`Kanazawa monthly official day cell invalid: ${dayMatch[1]}`);
    }
    seenDays.add(day);
    if (/<p\b[^>]*class=["'][^"']*kanazawa[^"']*["'][^>]*>\s*本場開催\s*<\/p>/i.test(cell)) {
      dates.push(dateFor(year, month, day));
    }
  }
  if (seenDays.size !== expectedDays) {
    throw new Error(`Kanazawa monthly official day grid invalid: expected ${expectedDays}, got ${seenDays.size}`);
  }
  return [...new Set(dates)].sort();
}

function monthKeys(dates) {
  return [...new Set(dates.map((date) => date.slice(0, 7)))].sort();
}

function monthlyScheduleUrl(year, month) {
  return `${KANAZAWA_OFFICIAL_SCHEDULE_URL}?s_year=${year}&s_month=${pad2(month)}&mode=honba`;
}

async function officialFetch(url, fetchImpl, accept) {
  const response = await fetchImpl(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)',
      accept,
      'accept-language': 'ja,en;q=.7',
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  const finalUrl = new URL(response.url || url);
  if (finalUrl.protocol !== 'https:' || finalUrl.hostname !== 'www.kanazawakeiba.com') {
    throw new Error(`unexpected Kanazawa official redirect: ${finalUrl.toString()}`);
  }
  return { response, finalUrl: finalUrl.toString() };
}

async function fetchAnnualBaseline(fetchImpl, months) {
  const { response, finalUrl } = await officialFetch(KANAZAWA_OFFICIAL_ANNUAL_PDF_URL, fetchImpl, 'application/pdf');
  const bytes = new Uint8Array(await response.arrayBuffer());
  const parsed = await parseKanazawaAnnualPdf(bytes, months);
  return {
    ...parsed,
    url: finalUrl,
    bytes: bytes.byteLength,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
  };
}

export async function discoverKanazawaOfficial30d({ dates, fetchImpl = fetch }) {
  if (!Array.isArray(dates) || !dates.length) throw new Error('Kanazawa official discovery requires dates');
  const requested = [...dates].sort();
  const requestedSet = new Set(requested);
  const failures = [];
  const supportedDates = requested.filter(withinFiscalYear);
  const unsupportedDates = requested.filter((date) => !withinFiscalYear(date));
  if (unsupportedDates.length) {
    failures.push({
      source_url: KANAZAWA_OFFICIAL_ANNUAL_PDF_URL,
      reason: `outside_kanazawa_fiscal_year_window:${unsupportedDates[0]}..${unsupportedDates.at(-1)}`,
    });
  }

  const requestedMonthKeys = monthKeys(supportedDates);
  const requestedMonths = requestedMonthKeys.map((monthKey) => Number(monthKey.slice(5, 7)));
  let annual = null;
  try {
    annual = await fetchAnnualBaseline(fetchImpl, requestedMonths);
  } catch (error) {
    failures.push({ source_url: KANAZAWA_OFFICIAL_ANNUAL_PDF_URL, reason: String(error?.message ?? error) });
  }

  const annualByMonth = new Map();
  for (const date of annual?.dates ?? []) {
    const monthKey = date.slice(0, 7);
    const rows = annualByMonth.get(monthKey) ?? [];
    rows.push(date);
    annualByMonth.set(monthKey, rows);
  }

  const resolvedDates = new Map();
  const monthlyUrls = [];
  const monthlyComparisons = [];
  for (const monthKey of requestedMonthKeys) {
    const [yearText, monthText] = monthKey.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    const url = monthlyScheduleUrl(year, month);
    monthlyUrls.push(url);
    const annualMonthDates = (annualByMonth.get(monthKey) ?? []).sort();
    let monthlyDates = null;
    let finalUrl = url;
    try {
      const fetched = await officialFetch(url, fetchImpl, 'text/html');
      finalUrl = fetched.finalUrl;
      monthlyDates = parseKanazawaOfficialMonthlySchedule(await fetched.response.text(), year, month);
    } catch (error) {
      failures.push({ source_url: url, reason: String(error?.message ?? error) });
    }

    const useMonthly = Array.isArray(monthlyDates) && monthlyDates.length > 0;
    const selected = useMonthly ? monthlyDates : annualMonthDates;
    for (const date of selected) {
      if (!requestedSet.has(date)) continue;
      resolvedDates.set(date, {
        sourceUrl: useMonthly ? finalUrl : (annual?.url ?? KANAZAWA_OFFICIAL_ANNUAL_PDF_URL),
        basis: useMonthly ? 'monthly_html' : 'annual_pdf',
      });
    }
    monthlyComparisons.push({
      month: monthKey,
      annual_dates: annualMonthDates,
      monthly_dates: monthlyDates,
      selected_basis: useMonthly ? 'monthly_html' : 'annual_pdf',
      agrees_with_annual: Array.isArray(monthlyDates) && monthlyDates.length > 0
        ? JSON.stringify(monthlyDates) === JSON.stringify(annualMonthDates)
        : null,
    });
  }

  const meetings = [...resolvedDates.entries()].sort(([left], [right]) => left.localeCompare(right))
    .map(([date, evidence]) => meetingRow(date, evidence.sourceUrl, evidence.basis));
  const completeness = failures.length === 0 && annual ? 'complete' : meetings.length ? 'partial' : 'failed';
  return {
    meetings,
    completeness: {
      source_id: KANAZAWA_SOURCE_ID,
      role: 'mother_set',
      requested_window: { start: requested[0], end: requested.at(-1) },
      result: completeness,
      completeness,
      parsed_meeting_count: meetings.length,
      parsed_detail_count: 0,
      pending_count: unsupportedDates.length,
      failure_count: failures.length,
      source_visible_horizon: completeness === 'complete' ? requested.at(-1) : null,
      source_urls: [annual?.url ?? KANAZAWA_OFFICIAL_ANNUAL_PDF_URL, ...monthlyUrls],
      annual_calendar_sha256: annual?.sha256 ?? null,
      annual_calendar_bytes: annual?.bytes ?? null,
      annual_meeting_count: annual?.dates?.length ?? 0,
      annual_parsed_months: requestedMonthKeys,
      fiscal_year_window: KANAZAWA_FISCAL_YEAR_WINDOW,
      monthly_comparisons: monthlyComparisons,
      failures,
    },
  };
}
