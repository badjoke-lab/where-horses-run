import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

export const IWATE_OFFICIAL_PROGRAM_INDEX_URL = 'https://www.iwatekeiba.or.jp/category/program';
const IWATE_HOST = 'www.iwatekeiba.or.jp';
const FULLWIDTH_DIGITS = '０１２３４５６７８９';
const defaultCacheByFetch = new WeakMap();

const normalizeDigits = (value) => String(value ?? '').replace(/[０-９]/g, (char) => String(FULLWIDTH_DIGITS.indexOf(char)));
const normalizeWide = (value) => normalizeDigits(value)
  .replace(/[：﹕]/g, ':')
  .replace(/[（]/g, '(')
  .replace(/[）]/g, ')')
  .replace(/[～〜]/g, '~')
  .replace(/[　\s]+/g, ' ')
  .trim();

const entities = (value) => String(value ?? '')
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>');

const plain = (value) => normalizeWide(entities(value)
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' '));

function hrefFromAttributes(attributes) {
  const match = String(attributes).match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

function safeOfficialUrl(href, baseUrl, pathPattern) {
  if (!href) return null;
  try {
    const url = new URL(entities(href), baseUrl);
    if (url.protocol !== 'https:' || url.hostname !== IWATE_HOST || !pathPattern.test(url.pathname)) return null;
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

function fiscalYearForDate(date) {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  return month >= 4 ? year : year - 1;
}

function reiwaToGregorian(value) {
  const year = Number(value);
  return Number.isInteger(year) && year > 0 ? 2018 + year : null;
}

function monthDayValue(month, day) {
  return Number(month) * 100 + Number(day);
}

function rangeContainsTarget(startMonth, startDay, endMonth, endDay, targetDate) {
  const target = monthDayValue(targetDate.slice(5, 7), targetDate.slice(8, 10));
  const start = monthDayValue(startMonth, startDay);
  const end = monthDayValue(endMonth, endDay);
  return start <= end ? target >= start && target <= end : target >= start || target <= end;
}

function programmeTitle(value) {
  const text = normalizeWide(value);
  const match = /令和\s*(\d+)年度\s*第\s*(\d+)回\s*(水沢|盛岡)競馬\s*(改定|概定)番組\s*\(\s*(\d{1,2})月\s*(\d{1,2})日\s*~\s*(\d{1,2})月\s*(\d{1,2})日\s*\)/.exec(text);
  if (!match) return null;
  return {
    fiscal_year: reiwaToGregorian(match[1]),
    meeting_number: Number(match[2]),
    venue: match[3],
    programme_kind: match[4],
    start_month: Number(match[5]),
    start_day: Number(match[6]),
    end_month: Number(match[7]),
    end_day: Number(match[8]),
  };
}

function venueForMeeting(meeting) {
  if (meeting?.venue_code === '11' || meeting?.racecourse_id === 'mizusawa-racecourse') return '水沢';
  if (meeting?.venue_code === '10' || meeting?.racecourse_id === 'morioka-racecourse') return '盛岡';
  return null;
}

export function parseIwateProgrammeArticleLinks(html, targetDate, venue) {
  const rows = [];
  const fiscalYear = fiscalYearForDate(targetDate);
  for (const match of String(html).matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const titleText = plain(match[2]);
    const title = programmeTitle(titleText);
    if (!title || title.venue !== venue || title.fiscal_year !== fiscalYear) continue;
    if (!rangeContainsTarget(title.start_month, title.start_day, title.end_month, title.end_day, targetDate)) continue;
    const url = safeOfficialUrl(hrefFromAttributes(match[1]), IWATE_OFFICIAL_PROGRAM_INDEX_URL, /^\/news\/[A-Za-z0-9_-]+\/?$/);
    if (!url) continue;
    rows.push({ url, programme_kind: title.programme_kind, meeting_number: title.meeting_number });
  }
  const byUrl = new Map();
  for (const row of rows) {
    const prior = byUrl.get(row.url);
    if (!prior || (prior.programme_kind !== '改定' && row.programme_kind === '改定')) byUrl.set(row.url, row);
  }
  return [...byUrl.values()]
    .sort((left, right) => Number(right.programme_kind === '改定') - Number(left.programme_kind === '改定') || right.meeting_number - left.meeting_number)
    .map((row) => row.url);
}

export function parseIwateProgrammePdfLinks(html, baseUrl) {
  const links = [];
  for (const match of String(html).matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const url = safeOfficialUrl(hrefFromAttributes(match[1]), baseUrl, /^\/dir\/wp-content\/uploads\/\d{4}\/\d{2}\/.+\.pdf$/i);
    if (!url) continue;
    const value = `${plain(match[2])} ${url}`;
    if (!/PDFファイル|(?:mizusawa|morioka)_(?:kaitei|gaitei)\.pdf/i.test(value)) continue;
    links.push(url);
  }
  return [...new Set(links)];
}

function timeLine(value) {
  const normalized = normalizeWide(value);
  if (!/^(?:\d{1,2}:\d{2})(?:\s+\d{1,2}:\d{2})+$/.test(normalized)) return null;
  const values = normalized.split(/\s+/).map((time) => {
    const [hour, minute] = time.split(':').map(Number);
    if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  });
  if (values.some((value) => value == null) || values.length < 8 || values.length > 14) return null;
  const minutes = values.map((time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5)));
  if (!minutes.every((value, index) => index === 0 || value > minutes[index - 1])) return null;
  return values;
}

function dateMarker(value, year) {
  const normalized = normalizeWide(value).replace(/\s+/g, '');
  const match = /^(\d{1,2})月(\d{1,2})日(?:・(\d{1,2})日)?$/.exec(normalized);
  if (!match) return [];
  const month = Number(match[1]);
  const days = [Number(match[2]), match[3] ? Number(match[3]) : null].filter((day) => day != null);
  const dates = [];
  for (const day of days) {
    const valueDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const parsed = new Date(`${valueDate}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== valueDate) return [];
    dates.push(valueDate);
  }
  return dates;
}

export function decodeIwateProgrammeTextItems(textItems, year, venue = null) {
  const items = (textItems ?? [])
    .map((item) => ({ str: String(item.str ?? '').trim(), x: Number(item.x), y: Number(item.y) }))
    .filter((item) => item.str && Number.isFinite(item.x) && Number.isFinite(item.y));
  const joined = normalizeWide(items.map((item) => item.str).join(' '));
  if (!/発走時刻/.test(joined)) throw new Error('Iwate programme PDF start-time marker missing');
  if (venue && !new RegExp(`${venue}競馬`).test(joined)) throw new Error(`Iwate programme PDF venue marker missing: ${venue}`);

  const sectionIndex = items.findIndex((item) => /発走時刻/.test(normalizeWide(item.str)));
  if (sectionIndex < 0) throw new Error('Iwate programme PDF start-time section missing');
  const section = items.slice(sectionIndex);
  const markers = [];
  for (let index = 0; index < section.length; index += 1) {
    const dates = dateMarker(section[index].str, year);
    if (dates.length) markers.push({ index, dates });
  }
  if (!markers.length) throw new Error('Iwate programme PDF date markers missing');

  const rows = new Map();
  for (let markerIndex = 0; markerIndex < markers.length; markerIndex += 1) {
    const marker = markers[markerIndex];
    const end = markers[markerIndex + 1]?.index ?? section.length;
    const timeRows = section.slice(marker.index + 1, end).map((item) => timeLine(item.str)).filter(Boolean);
    if (timeRows.length !== 2) throw new Error(`Iwate programme PDF timing-row count changed for ${marker.dates.join(',')}: ${timeRows.length}`);
    if (timeRows[0].length !== timeRows[1].length) throw new Error(`Iwate programme PDF timing-row width changed for ${marker.dates.join(',')}`);
    const assembly = timeRows[0].map((time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5)));
    const starts = timeRows[1].map((time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5)));
    if (!starts.every((value, index) => value > assembly[index] && value - assembly[index] >= 20 && value - assembly[index] <= 90)) {
      throw new Error(`Iwate programme PDF assembly/start ordering invalid for ${marker.dates.join(',')}`);
    }
    const timing = {
      first_race_time_local: timeRows[1][0],
      last_race_time_local: timeRows[1][timeRows[1].length - 1],
    };
    for (const date of marker.dates) rows.set(date, timing);
  }
  return rows;
}

export async function parseIwateProgrammePdf(bytes, year, venue = null) {
  const original = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (original.byteLength < 50000 || String.fromCharCode(...original.slice(0, 4)) !== '%PDF') {
    throw new Error(`Iwate programme PDF payload invalid: ${original.byteLength} bytes`);
  }
  const data = new Uint8Array(original);
  const document = await getDocument({ data, useWorkerFetch: false, isEvalSupported: false }).promise;
  if (document.numPages !== 1) throw new Error(`Iwate programme PDF page count changed: ${document.numPages}`);
  const page = await document.getPage(1);
  const text = await page.getTextContent();
  const items = text.items.filter((item) => item.str?.trim()).map((item) => ({
    str: item.str.trim(),
    x: Number(item.transform[4]),
    y: Number(item.transform[5]),
  }));
  return decodeIwateProgrammeTextItems(items, year, venue);
}

async function fetchOfficial(url, fetchImpl, accept) {
  const response = await fetchImpl(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)',
      accept,
      'accept-language': 'ja,en;q=.7',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  const finalUrl = new URL(response.url || url);
  if (finalUrl.protocol !== 'https:' || finalUrl.hostname !== IWATE_HOST) throw new Error(`unexpected Iwate redirect: ${finalUrl}`);
  return { response, url: finalUrl.toString() };
}

function createProgrammeCache() {
  return { html: new Map(), pdf: new Map() };
}

function cacheFor(fetchImpl, parsePdfImpl) {
  let byParser = defaultCacheByFetch.get(fetchImpl);
  if (!byParser) {
    byParser = new WeakMap();
    defaultCacheByFetch.set(fetchImpl, byParser);
  }
  let cache = byParser.get(parsePdfImpl);
  if (!cache) {
    cache = createProgrammeCache();
    byParser.set(parsePdfImpl, cache);
  }
  return cache;
}

function cachedPromise(map, key, factory) {
  const existing = map.get(key);
  if (existing) return existing;
  const pending = Promise.resolve().then(factory);
  map.set(key, pending);
  pending.catch(() => {
    if (map.get(key) === pending) map.delete(key);
  });
  return pending;
}

async function fetchOfficialHtmlCached(url, fetchImpl, cache) {
  return cachedPromise(cache.html, url, async () => {
    const page = await fetchOfficial(url, fetchImpl, 'text/html');
    return { body: await page.response.text(), url: page.url };
  });
}

async function fetchOfficialPdfRowsCached(pdfUrl, year, venue, fetchImpl, parsePdfImpl, cache) {
  const key = `${pdfUrl}\u0000${year}\u0000${venue}`;
  return cachedPromise(cache.pdf, key, async () => {
    const pdf = await fetchOfficial(pdfUrl, fetchImpl, 'application/pdf');
    const contentType = pdf.response.headers?.get?.('content-type') ?? '';
    if (contentType && !/^application\/pdf(?:\s*;|$)/i.test(contentType)) return null;
    const bytes = new Uint8Array(await pdf.response.arrayBuffer());
    return {
      rows: await parsePdfImpl(bytes, year, venue),
      url: pdf.url,
    };
  });
}

export async function fetchIwateOfficialProgrammeTiming(meeting, {
  fetchImpl = fetch,
  parsePdfImpl = parseIwateProgrammePdf,
  cache = null,
} = {}) {
  const venue = venueForMeeting(meeting);
  if (!venue || !/^\d{4}-\d{2}-\d{2}$/.test(String(meeting?.date ?? ''))) return null;

  const requestCache = cache ?? cacheFor(fetchImpl, parsePdfImpl);
  const index = await fetchOfficialHtmlCached(IWATE_OFFICIAL_PROGRAM_INDEX_URL, fetchImpl, requestCache);
  const articles = parseIwateProgrammeArticleLinks(index.body, meeting.date, venue);
  for (const articleUrl of articles) {
    try {
      const article = await fetchOfficialHtmlCached(articleUrl, fetchImpl, requestCache);
      const pdfLinks = parseIwateProgrammePdfLinks(article.body, article.url);
      for (const pdfUrl of pdfLinks) {
        try {
          const parsed = await fetchOfficialPdfRowsCached(
            pdfUrl,
            Number(meeting.date.slice(0, 4)),
            venue,
            fetchImpl,
            parsePdfImpl,
            requestCache,
          );
          if (!parsed) continue;
          const timing = parsed.rows.get(meeting.date);
          if (!timing) continue;
          return {
            status: 'ok',
            meeting: {
              ...meeting,
              source_id: 'iwatekeiba-official-programme-pdf-fallback',
              source_label: '岩手競馬',
              capability_rank: 'B+',
              first_race_time_local: timing.first_race_time_local,
              last_race_time_local: timing.last_race_time_local,
              timetable_rows: [],
              official_source_url: parsed.url,
            },
          };
        } catch {
          // Try another official PDF from the same programme article. Failed cache entries are evicted so a later meeting can retry.
        }
      }
    } catch {
      // Try the next matching official programme article. Failed cache entries are evicted so a later meeting can retry.
    }
  }
  return null;
}
