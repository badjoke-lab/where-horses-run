import crypto from 'node:crypto';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

export const KOCHI_SOURCE_ID = 'kochi-keiba-official-calendar';
export const KOCHI_SOURCE_LABEL = '高知けいば';
export const KOCHI_OFFICIAL_ANNUAL_PDF_URL = 'https://www.keiba.or.jp/wp/wp-content/uploads/2026/02/c408d71a0237f46b0a96517eaac55217.pdf';
export const KOCHI_OFFICIAL_ANNOUNCEMENT_URL = 'https://www.keiba.or.jp/?p=120880';
export const KOCHI_FISCAL_YEAR_WINDOW = Object.freeze({ start: '2026-04-01', end: '2027-03-31' });
export const KOCHI_PUBLISHED_PLAN_AS_OF = '2026-02-26';

const MEETING_MARKERS = new Set(['☆', '◎']);
const FULLWIDTH_DIGITS = '０１２３４５６７８９';

function normalizeDigits(value) {
  return String(value ?? '').replace(/[０-９]/g, (char) => String(FULLWIDTH_DIGITS.indexOf(char)));
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

function withinFiscalYear(date) {
  return date >= KOCHI_FISCAL_YEAR_WINDOW.start && date <= KOCHI_FISCAL_YEAR_WINDOW.end;
}

function requestedMonthNumbers(dates) {
  return [...new Set(dates.map((date) => Number(date.slice(5, 7))))];
}

function dateFor(year, month, day) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function meetingRow(date, sourceUrl) {
  return {
    meeting_id: `nar-kochi-racecourse-${date}`,
    date,
    authority_id: 'nar-local-government-racing',
    racing_system_id: 'japan-nar-system',
    racecourse_id: 'kochi-racecourse',
    venue_code: '31',
    source_id: KOCHI_SOURCE_ID,
    source_label: KOCHI_SOURCE_LABEL,
    official_source_url: sourceUrl,
    official_schedule_basis: 'annual_pdf_published_plan',
  };
}

export function decodeKochiAnnualScheduleText(textItems, months) {
  const requestedMonths = [...new Set(months ?? [])];
  if (!requestedMonths.length) throw new Error('Kochi annual PDF decode requires requested months');
  const items = (textItems ?? []).map((item) => ({
    str: String(item.str ?? '').trim(),
    x: Number(item.x),
    y: Number(item.y),
    w: Number(item.w ?? 0),
  })).filter((item) => item.str && Number.isFinite(item.x) && Number.isFinite(item.y));

  if (!items.some((item) => item.str === '令和8年度')) throw new Error('Kochi annual PDF fiscal-year marker missing');
  if (!items.some((item) => item.str === '開催日程')) throw new Error('Kochi annual PDF schedule title marker missing');

  const dates = [];
  const diagnostics = [];
  for (const month of requestedMonths) {
    const year = fiscalYearForMonth(month);
    const monthText = `${month}月`;
    const markers = items.filter((item) => normalizeDigits(item.str) === monthText && item.x < 75);
    if (markers.length !== 1) throw new Error(`Kochi annual PDF month marker invalid for ${year}-${pad2(month)}: ${markers.length}`);
    const marker = markers[0];
    const expectedDays = daysInMonth(year, month);
    const dayLineY = marker.y + 18.5;
    const dayItems = items.filter((item) => {
      if (Math.abs(item.y - dayLineY) > 1.5 || item.x < 75) return false;
      const day = Number(normalizeDigits(item.str));
      return Number.isInteger(day) && day >= 1 && day <= expectedDays;
    }).map((item) => ({
      ...item,
      day: Number(normalizeDigits(item.str)),
      center: item.x + item.w / 2,
    }));
    const byDay = new Map();
    for (const item of dayItems) {
      if (byDay.has(item.day)) throw new Error(`Kochi annual PDF duplicate day ${year}-${pad2(month)}-${pad2(item.day)}`);
      byDay.set(item.day, item);
    }
    if (byDay.size !== expectedDays) {
      const missing = Array.from({ length: expectedDays }, (_, index) => index + 1).filter((day) => !byDay.has(day));
      throw new Error(`Kochi annual PDF day grid invalid for ${year}-${pad2(month)}: missing ${missing.join(',')}`);
    }
    const orderedCenters = [...byDay.values()].sort((a, b) => a.day - b.day).map((item) => item.center);
    const gaps = orderedCenters.slice(1).map((center, index) => center - orderedCenters[index]);
    if (!gaps.length || gaps.some((gap) => gap < 27 || gap > 31)) {
      throw new Error(`Kochi annual PDF day grid spacing invalid for ${year}-${pad2(month)}`);
    }

    const markerLineY = marker.y - 6.65;
    const meetingSymbols = items.filter((item) => MEETING_MARKERS.has(item.str) && Math.abs(item.y - markerLineY) <= 1.5);
    if (!meetingSymbols.length) throw new Error(`Kochi annual PDF has no meeting markers for ${year}-${pad2(month)}`);
    const monthDates = new Set();
    for (const symbol of meetingSymbols) {
      const center = symbol.x + symbol.w / 2;
      let nearest = null;
      for (const dayItem of byDay.values()) {
        const distance = Math.abs(dayItem.center - center);
        if (!nearest || distance < nearest.distance) nearest = { day: dayItem.day, distance };
      }
      if (!nearest || nearest.distance > 5) {
        throw new Error(`Kochi annual PDF meeting marker does not map to a day for ${year}-${pad2(month)} at x=${center}`);
      }
      const date = dateFor(year, month, nearest.day);
      if (monthDates.has(date)) throw new Error(`Kochi annual PDF duplicate meeting marker for ${date}`);
      monthDates.add(date);
    }
    dates.push(...monthDates);
    diagnostics.push({ year, month, meeting_count: monthDates.size });
  }

  return {
    dates: [...new Set(dates)].sort(),
    months: diagnostics,
  };
}

export async function parseKochiAnnualPdf(bytes, months) {
  const original = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (original.byteLength < 100000 || String.fromCharCode(...original.slice(0, 4)) !== '%PDF') {
    throw new Error(`Kochi annual PDF payload invalid: ${original.byteLength} bytes`);
  }
  const data = new Uint8Array(original);
  const document = await getDocument({ data, useWorkerFetch: false, isEvalSupported: false }).promise;
  if (document.numPages !== 1) throw new Error(`Kochi annual PDF page count changed: ${document.numPages}`);
  const page = await document.getPage(1);
  const text = await page.getTextContent();
  const items = text.items.filter((item) => item.str?.trim()).map((item) => ({
    str: item.str.trim(),
    x: Number(item.transform[4]),
    y: Number(item.transform[5]),
    w: Number(item.width ?? 0),
  }));
  return decodeKochiAnnualScheduleText(items, months);
}

async function officialFetch(fetchImpl) {
  const response = await fetchImpl(KOCHI_OFFICIAL_ANNUAL_PDF_URL, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)',
      accept: 'application/pdf',
      'accept-language': 'ja,en;q=.7',
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${KOCHI_OFFICIAL_ANNUAL_PDF_URL}`);
  const finalUrl = new URL(response.url || KOCHI_OFFICIAL_ANNUAL_PDF_URL);
  if (finalUrl.protocol !== 'https:' || finalUrl.hostname !== 'www.keiba.or.jp') {
    throw new Error(`unexpected Kochi official redirect: ${finalUrl.toString()}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength < 100000 || String.fromCharCode(...bytes.slice(0, 4)) !== '%PDF') {
    throw new Error(`Kochi annual PDF payload invalid: ${bytes.byteLength} bytes`);
  }
  return { bytes, finalUrl: finalUrl.toString() };
}

export async function discoverKochiOfficial30d({ dates, fetchImpl = fetch }) {
  if (!Array.isArray(dates) || !dates.length) throw new Error('Kochi official discovery requires dates');
  const requested = [...dates].sort();
  const requestedSet = new Set(requested);
  const unsupportedDates = requested.filter((date) => !withinFiscalYear(date));
  const failures = [];
  if (unsupportedDates.length) {
    failures.push({
      source_url: KOCHI_OFFICIAL_ANNUAL_PDF_URL,
      reason: `outside_kochi_fiscal_year_window:${unsupportedDates[0]}..${unsupportedDates.at(-1)}`,
    });
  }

  let sourceUrl = KOCHI_OFFICIAL_ANNUAL_PDF_URL;
  let bytesCount = null;
  let sha256 = null;
  let decoded = null;
  try {
    const fetched = await officialFetch(fetchImpl);
    sourceUrl = fetched.finalUrl;
    bytesCount = fetched.bytes.byteLength;
    sha256 = crypto.createHash('sha256').update(fetched.bytes).digest('hex');
    const months = requestedMonthNumbers(requested.filter(withinFiscalYear));
    decoded = await parseKochiAnnualPdf(fetched.bytes, months);
  } catch (error) {
    failures.push({ source_url: sourceUrl, reason: String(error?.message ?? error) });
  }

  const meetings = (decoded?.dates ?? [])
    .filter((date) => requestedSet.has(date))
    .map((date) => meetingRow(date, sourceUrl));
  const completeness = failures.length === 0 ? 'complete' : meetings.length ? 'partial' : 'failed';
  return {
    meetings,
    completeness: {
      source_id: KOCHI_SOURCE_ID,
      role: 'mother_set',
      requested_window: { start: requested[0], end: requested.at(-1) },
      result: completeness,
      completeness,
      parsed_meeting_count: meetings.length,
      parsed_detail_count: 0,
      pending_count: unsupportedDates.length,
      failure_count: failures.length,
      source_visible_horizon: completeness === 'complete' ? requested.at(-1) : null,
      source_urls: [sourceUrl, KOCHI_OFFICIAL_ANNOUNCEMENT_URL],
      annual_calendar_sha256: sha256,
      annual_calendar_bytes: bytesCount,
      annual_parsed_months: decoded?.months?.map((row) => `${row.year}-${pad2(row.month)}`) ?? [],
      annual_month_diagnostics: decoded?.months ?? [],
      fiscal_year_window: KOCHI_FISCAL_YEAR_WINDOW,
      published_plan_as_of: KOCHI_PUBLISHED_PLAN_AS_OF,
      schedule_status: 'official_published_plan_subject_to_change',
      failures,
    },
  };
}
