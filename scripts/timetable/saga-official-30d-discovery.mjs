import crypto from 'node:crypto';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

export const SAGA_SOURCE_ID = 'saga-keiba-official-calendar';
export const SAGA_SOURCE_LABEL = '佐賀競馬';
export const SAGA_OFFICIAL_SCHEDULE_URL = 'https://www.sagakeiba.net/race/schedule/';
export const SAGA_OFFICIAL_ANNUAL_PDF_URL = 'https://www.sagakeiba.net/wp-content/uploads/2026/02/R8kaisainittei.pdf';
export const SAGA_FISCAL_YEAR_WINDOW = Object.freeze({ start: '2026-04-01', end: '2027-03-31' });

const FISCAL_MONTH_ORDER = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
const FULLWIDTH_DIGITS = '０１２３４５６７８９';

function normalizeDigits(value) {
  return String(value ?? '').replace(/[０-９]/g, (char) => String(FULLWIDTH_DIGITS.indexOf(char)));
}

function plain(value) {
  return String(value ?? '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<br\s*\/?>/gi, ' | ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/[\s\u3000]+/g, ' ')
    .trim();
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function fiscalYearForMonth(month) {
  return month >= 4 ? 2026 : 2027;
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function dateFor(year, month, day) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function withinFiscalYear(date) {
  return date >= SAGA_FISCAL_YEAR_WINDOW.start && date <= SAGA_FISCAL_YEAR_WINDOW.end;
}

function requestedMonths(dates) {
  return [...new Set(dates.map((date) => `${date.slice(0, 4)}-${date.slice(5, 7)}`))];
}

function median(values) {
  const ordered = [...values].sort((a, b) => a - b);
  if (!ordered.length) return null;
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
}

function clusterByY(items, tolerance = 1) {
  const rows = [];
  for (const item of [...items].sort((a, b) => b.y - a.y || a.x - b.x)) {
    const row = rows.find((candidate) => Math.abs(candidate.y - item.y) <= tolerance);
    if (row) {
      row.items.push(item);
      row.y = row.items.reduce((sum, value) => sum + value.y, 0) / row.items.length;
    } else {
      rows.push({ y: item.y, items: [item] });
    }
  }
  return rows.sort((a, b) => b.y - a.y).map((row) => ({ ...row, items: row.items.sort((a, b) => a.x - b.x) }));
}

function normalizeTextItems(textItems) {
  return (textItems ?? []).map((item) => ({
    str: String(item.str ?? '').trim(),
    norm: normalizeDigits(String(item.str ?? '').trim()).replace(/\s+/g, ''),
    x: Number(item.x),
    y: Number(item.y),
    w: Number(item.w ?? 0),
  })).filter((item) => item.str && Number.isFinite(item.x) && Number.isFinite(item.y));
}

export function decodeSagaAnnualScheduleText(textItems) {
  const items = normalizeTextItems(textItems);
  const joined = items.map((item) => item.norm).join('');
  if (!joined.includes('令和8年度')) throw new Error('Saga annual PDF fiscal-year marker missing');
  if (!joined.includes('佐賀競馬')) throw new Error('Saga annual PDF authority marker missing');
  if (!joined.includes('開催日程')) throw new Error('Saga annual PDF schedule title marker missing');

  const rows = clusterByY(items);
  const dayRows = rows.filter((row) => {
    const values = row.items.map((item) => Number(item.norm)).filter((value) => Number.isInteger(value) && value >= 1 && value <= 31);
    return new Set(values).size >= 28;
  });
  if (dayRows.length !== FISCAL_MONTH_ORDER.length) {
    throw new Error(`Saga annual PDF day-row count changed: ${dayRows.length}`);
  }

  const dayRowGaps = dayRows.slice(1).map((row, index) => dayRows[index].y - row.y);
  const blockHeight = median(dayRowGaps);
  if (!Number.isFinite(blockHeight) || blockHeight < 35 || blockHeight > 90) {
    throw new Error(`Saga annual PDF month block spacing invalid: ${blockHeight}`);
  }

  const dates = [];
  const diagnostics = [];
  for (let index = 0; index < dayRows.length; index += 1) {
    const month = FISCAL_MONTH_ORDER[index];
    const year = fiscalYearForMonth(month);
    const expectedDays = daysInMonth(year, month);
    const dayRow = dayRows[index];
    const dayItems = dayRow.items.map((item) => ({ ...item, day: Number(item.norm), center: item.x + item.w / 2 }))
      .filter((item) => Number.isInteger(item.day) && item.day >= 1 && item.day <= expectedDays);
    const byDay = new Map();
    for (const item of dayItems) {
      if (byDay.has(item.day)) throw new Error(`Saga annual PDF duplicate day ${dateFor(year, month, item.day)}`);
      byDay.set(item.day, item);
    }
    if (byDay.size !== expectedDays) {
      const missing = Array.from({ length: expectedDays }, (_, offset) => offset + 1).filter((day) => !byDay.has(day));
      throw new Error(`Saga annual PDF day grid invalid for ${year}-${pad2(month)}: missing ${missing.join(',')}`);
    }
    const centers = [...byDay.values()].sort((a, b) => a.day - b.day).map((item) => item.center);
    const step = median(centers.slice(1).map((center, offset) => center - centers[offset]));
    if (!Number.isFinite(step) || step < 15 || step > 40) throw new Error(`Saga annual PDF day spacing invalid for ${year}-${pad2(month)}`);

    const lowerBound = dayRows[index + 1]?.y ?? dayRow.y - blockHeight;
    const bulletRows = clusterByY(items.filter((item) => item.norm === '●' && item.y < dayRow.y - 1 && item.y > lowerBound + 1));
    if (!bulletRows.length) throw new Error(`Saga annual PDF meeting row missing for ${year}-${pad2(month)}`);
    bulletRows.sort((left, right) => right.items.length - left.items.length || right.y - left.y);
    const meetingRow = bulletRows[0];
    if (meetingRow.items.length < 2 || meetingRow.items.length > 20) {
      throw new Error(`Saga annual PDF meeting marker count invalid for ${year}-${pad2(month)}: ${meetingRow.items.length}`);
    }
    const monthDates = new Set();
    for (const marker of meetingRow.items) {
      const center = marker.x + marker.w / 2;
      let nearest = null;
      for (const dayItem of byDay.values()) {
        const distance = Math.abs(dayItem.center - center);
        if (!nearest || distance < nearest.distance) nearest = { day: dayItem.day, distance };
      }
      if (!nearest || nearest.distance > step * 0.4) {
        throw new Error(`Saga annual PDF meeting marker does not map to day for ${year}-${pad2(month)} at x=${center}`);
      }
      monthDates.add(dateFor(year, month, nearest.day));
    }
    dates.push(...monthDates);
    diagnostics.push({
      year,
      month,
      printed_day_count: byDay.size,
      meeting_count: monthDates.size,
      day_step: Number(step.toFixed(3)),
      day_row_y: Number(dayRow.y.toFixed(3)),
      meeting_row_y: Number(meetingRow.y.toFixed(3)),
    });
  }
  return { dates: [...new Set(dates)].sort(), months: diagnostics };
}

export async function parseSagaAnnualPdf(bytes) {
  const original = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (original.byteLength < 100000 || String.fromCharCode(...original.slice(0, 4)) !== '%PDF') {
    throw new Error(`Saga annual PDF payload invalid: ${original.byteLength} bytes`);
  }
  const data = new Uint8Array(original);
  const document = await getDocument({ data, useWorkerFetch: false, isEvalSupported: false }).promise;
  if (document.numPages !== 1) throw new Error(`Saga annual PDF page count changed: ${document.numPages}`);
  const page = await document.getPage(1);
  const text = await page.getTextContent();
  const items = text.items.filter((item) => item.str?.trim()).map((item) => ({
    str: item.str.trim(),
    x: Number(item.transform[4]),
    y: Number(item.transform[5]),
    w: Number(item.width ?? 0),
  }));
  return decodeSagaAnnualScheduleText(items);
}

export function parseSagaMonthlyScheduleHtml(html, year, month) {
  const normalizedTitle = plain(String(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  if (!normalizedTitle.includes(`月別開催日程 ${year}年${month}月`)) {
    throw new Error(`Saga monthly title invalid for ${year}-${pad2(month)}: ${normalizedTitle}`);
  }
  const tables = [...String(html).matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)].map((match) => match[0]);
  if (tables.length !== 1) throw new Error(`Saga monthly schedule table count invalid for ${year}-${pad2(month)}: ${tables.length}`);
  const rows = [...tables[0].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map((match) => [...match[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => plain(cell[1])))
    .filter((row) => row.length);
  if (!rows.length || !/日付/.test(rows[0][0] ?? '') || !/本場/.test(rows[0][1] ?? '')) {
    throw new Error(`Saga monthly schedule header invalid for ${year}-${pad2(month)}`);
  }
  const expectedDays = daysInMonth(year, month);
  const dataRows = rows.slice(1);
  if (dataRows.length !== expectedDays) {
    throw new Error(`Saga monthly day-row count invalid for ${year}-${pad2(month)}: ${dataRows.length}`);
  }
  const seen = new Set();
  const dates = [];
  for (const row of dataRows) {
    const day = Number(normalizeDigits(row[0]));
    if (!Number.isInteger(day) || day < 1 || day > expectedDays || seen.has(day)) {
      throw new Error(`Saga monthly day identity invalid for ${year}-${pad2(month)}: ${row[0]}`);
    }
    seen.add(day);
    if ((row[2] ?? '') === '佐賀') dates.push(dateFor(year, month, day));
  }
  if (seen.size !== expectedDays) throw new Error(`Saga monthly day coverage invalid for ${year}-${pad2(month)}`);
  return dates;
}

function meetingRow(date, sourceUrl, basis) {
  return {
    meeting_id: `nar-saga-racecourse-${date}`,
    date,
    authority_id: 'nar-local-government-racing',
    racing_system_id: 'japan-nar-system',
    racecourse_id: 'saga-racecourse',
    venue_code: '32',
    source_id: SAGA_SOURCE_ID,
    source_label: SAGA_SOURCE_LABEL,
    official_source_url: sourceUrl,
    official_schedule_basis: basis,
  };
}

async function fetchText(fetchImpl, url, accept = 'text/html') {
  const response = await fetchImpl(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)',
      accept,
      'accept-language': 'ja,en;q=.7',
    },
  });
  return response;
}

async function resolveAnnualPdf(fetchImpl) {
  const response = await fetchText(fetchImpl, SAGA_OFFICIAL_SCHEDULE_URL);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${SAGA_OFFICIAL_SCHEDULE_URL}`);
  const finalUrl = new URL(response.url || SAGA_OFFICIAL_SCHEDULE_URL);
  if (finalUrl.protocol !== 'https:' || finalUrl.hostname !== 'www.sagakeiba.net') throw new Error(`unexpected Saga schedule redirect: ${finalUrl}`);
  const html = await response.text();
  const links = [...html.matchAll(/<a\b[^>]*href=["']([^"']+\.pdf(?:\?[^"']*)?)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => ({ href: match[1], text: plain(match[2]) }))
    .filter((row) => /令和\s*8年度年間開催日程|R8kaisainittei|2026/i.test(`${row.text} ${row.href}`));
  if (links.length !== 1) throw new Error(`Saga FY2026 annual PDF link count invalid: ${links.length}`);
  const pdfUrl = new URL(links[0].href, finalUrl);
  if (pdfUrl.protocol !== 'https:' || pdfUrl.hostname !== 'www.sagakeiba.net') throw new Error(`unexpected Saga annual PDF host: ${pdfUrl}`);
  return pdfUrl.toString();
}

async function fetchAnnualPdf(fetchImpl, url) {
  const response = await fetchText(fetchImpl, url, 'application/pdf');
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  const finalUrl = new URL(response.url || url);
  if (finalUrl.protocol !== 'https:' || finalUrl.hostname !== 'www.sagakeiba.net') throw new Error(`unexpected Saga PDF redirect: ${finalUrl}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength < 100000 || String.fromCharCode(...bytes.slice(0, 4)) !== '%PDF') throw new Error(`Saga annual PDF payload invalid: ${bytes.byteLength} bytes`);
  return { bytes, url: finalUrl.toString() };
}

function monthlyUrl(year, month) {
  return `https://www.sagakeiba.net/schedule/sch${year}${pad2(month)}/`;
}

export async function discoverSagaOfficial30d({ dates, fetchImpl = fetch }) {
  if (!Array.isArray(dates) || !dates.length) throw new Error('Saga official discovery requires dates');
  const requested = [...dates].sort();
  const requestedSet = new Set(requested);
  const failures = [];
  const unsupportedDates = requested.filter((date) => !withinFiscalYear(date));
  if (unsupportedDates.length) failures.push({
    source_url: SAGA_OFFICIAL_SCHEDULE_URL,
    reason: `outside_saga_fiscal_year_window:${unsupportedDates[0]}..${unsupportedDates.at(-1)}`,
  });

  let annualUrl = SAGA_OFFICIAL_ANNUAL_PDF_URL;
  let annualBytes = null;
  let annualSha256 = null;
  let annual = null;
  try {
    annualUrl = await resolveAnnualPdf(fetchImpl);
    const fetched = await fetchAnnualPdf(fetchImpl, annualUrl);
    annualUrl = fetched.url;
    annualBytes = fetched.bytes.byteLength;
    annualSha256 = crypto.createHash('sha256').update(fetched.bytes).digest('hex');
    annual = await parseSagaAnnualPdf(fetched.bytes);
  } catch (error) {
    failures.push({ source_url: annualUrl, reason: String(error?.message ?? error) });
  }

  const positiveDates = new Map();
  for (const date of annual?.dates ?? []) positiveDates.set(date, { url: annualUrl, basis: 'annual_pdf_published_plan' });
  const monthlyDiagnostics = [];
  for (const ym of requestedMonths(requested.filter(withinFiscalYear))) {
    const [yearText, monthText] = ym.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    const url = monthlyUrl(year, month);
    try {
      const response = await fetchText(fetchImpl, url);
      if (response.status === 404) {
        monthlyDiagnostics.push({ year, month, status: 'not_published', source_url: url, meeting_count: null });
        continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
      const finalUrl = new URL(response.url || url);
      if (finalUrl.protocol !== 'https:' || finalUrl.hostname !== 'www.sagakeiba.net') throw new Error(`unexpected Saga monthly redirect: ${finalUrl}`);
      const html = await response.text();
      const datesFromMonth = parseSagaMonthlyScheduleHtml(html, year, month);
      for (const date of datesFromMonth) positiveDates.set(date, { url: finalUrl.toString(), basis: 'monthly_official_home_schedule' });
      monthlyDiagnostics.push({ year, month, status: 'parsed', source_url: finalUrl.toString(), meeting_count: datesFromMonth.length });
    } catch (error) {
      failures.push({ source_url: url, reason: String(error?.message ?? error) });
      monthlyDiagnostics.push({ year, month, status: 'failed', source_url: url, meeting_count: null });
    }
  }

  const meetings = [...positiveDates.entries()]
    .filter(([date]) => requestedSet.has(date))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, evidence]) => meetingRow(date, evidence.url, evidence.basis));
  const completeness = failures.length === 0 ? 'complete' : meetings.length ? 'partial' : 'failed';
  return {
    meetings,
    completeness: {
      source_id: SAGA_SOURCE_ID,
      role: 'mother_set',
      requested_window: { start: requested[0], end: requested.at(-1) },
      result: completeness,
      completeness,
      parsed_meeting_count: meetings.length,
      parsed_detail_count: 0,
      pending_count: unsupportedDates.length,
      failure_count: failures.length,
      source_visible_horizon: completeness === 'complete' ? requested.at(-1) : null,
      source_urls: [SAGA_OFFICIAL_SCHEDULE_URL, annualUrl, ...monthlyDiagnostics.map((row) => row.source_url)],
      annual_calendar_sha256: annualSha256,
      annual_calendar_bytes: annualBytes,
      annual_parsed_months: annual?.months?.map((row) => `${row.year}-${pad2(row.month)}`) ?? [],
      annual_month_diagnostics: annual?.months ?? [],
      monthly_diagnostics: monthlyDiagnostics,
      fiscal_year_window: SAGA_FISCAL_YEAR_WINDOW,
      schedule_status: 'annual_official_plan_plus_published_monthly_positive_union',
      failures,
    },
  };
}
