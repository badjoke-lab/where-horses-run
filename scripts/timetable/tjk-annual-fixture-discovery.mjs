import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { TJK_STATIC_CALENDAR_URL, parseTjkStaticCalendarItems } from './tjk-static-calendar-core.mjs';
import { ENTRY_URL, parseTjkDate } from './tjk-current-future-candidates.mjs';

export const ANNUAL_PAGE_URL = 'https://www.tjk.org/TR/YarisSever/Query/Page/YillikYarisProgramiCoklu';
export const ANNUAL_DATA_URL = 'https://www.tjk.org/TR/YarisSever/Query/Data/YillikYarisProgramiCoklu';
export const ANNUAL_ROWS_URL = 'https://www.tjk.org/TR/YarisSever/Query/DataRows/YillikYarisProgramiCoklu';
export const DOMESTIC_TJK_VENUES = new Map([
  ['1', 'Adana'],
  ['2', 'İzmir'],
  ['3', 'İstanbul'],
  ['4', 'Bursa'],
  ['5', 'Ankara'],
  ['6', 'Şanlıurfa'],
  ['7', 'Elazığ'],
  ['8', 'Diyarbakır'],
  ['9', 'Kocaeli'],
  ['10', 'Antalya'],
]);

function decodeHtml(value) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function dateForQuery(iso) {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

function buildQueryUrl(baseUrl, startDate, endDateInclusive, pageNumber = null) {
  const url = new URL(baseUrl);
  url.searchParams.set('QueryParameter_Tarih_Start', dateForQuery(startDate));
  url.searchParams.set('QueryParameter_Tarih_End', dateForQuery(endDateInclusive));
  for (const id of DOMESTIC_TJK_VENUES.keys()) url.searchParams.append('QueryParameter_SehirId', id);
  if (pageNumber !== null) {
    url.searchParams.set('PageNumber', String(pageNumber));
    url.searchParams.set('Sort', '');
  }
  return url.href;
}

async function fetchStaticAnnualCalendar(startDate, endDateExclusive, fetchImpl) {
  const response = await fetchImpl(TJK_STATIC_CALENDAR_URL, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      accept: 'application/pdf,*/*;q=0.8',
      'user-agent': 'WhereHorsesRun-source-verification/1.0',
    },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`TJK static annual calendar fetch failed: HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length < 4 || String.fromCharCode(...bytes.slice(0, 4)) !== '%PDF') {
    throw new Error('TJK static annual calendar response is not a PDF');
  }
  const pdf = await getDocument({ data: bytes, disableWorker: true }).promise;
  if (pdf.numPages !== 1) throw new Error(`TJK static annual calendar page count changed: ${pdf.numPages}`);
  const page = await pdf.getPage(1);
  const text = await page.getTextContent();
  const parsed = parseTjkStaticCalendarItems(text.items);
  if (parsed.month_count !== 12 || parsed.unmatched_codes.length !== 0 || parsed.fixtures.length !== 758) {
    throw new Error(
      `TJK static annual calendar integrity failed: months=${parsed.month_count} fixtures=${parsed.fixtures.length} unmatched=${parsed.unmatched_codes.length}`,
    );
  }
  return {
    fixtures: parsed.fixtures.filter((fixture) => fixture.date >= startDate && fixture.date < endDateExclusive),
    annual_fixture_count: parsed.fixtures.length,
  };
}

async function fetchHtml(url, fetchImpl, { allowNotFound = false, timeoutMs = 20_000 } = {}) {
  const response = await fetchImpl(url, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'WhereHorsesRun-source-verification/1.0',
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (allowNotFound && response.status === 404) return null;
  if (!response.ok) throw new Error(`TJK annual programme fetch failed: HTTP ${response.status} ${url}`);
  return response.text();
}

export function extractAnnualFixtures(html, { startDate, endDateExclusive } = {}) {
  const fixtures = [];
  const pattern = /<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/giu;
  for (const match of html.matchAll(pattern)) {
    const href = decodeHtml(match[2].trim());
    let url;
    try {
      url = new URL(href, ANNUAL_PAGE_URL);
    } catch {
      continue;
    }
    if (url.hostname.toLowerCase() !== 'www.tjk.org') continue;
    if (!/\/TR\/YarisSever\/Info\/Page\/GunlukYarisProgrami$/iu.test(url.pathname)) continue;
    const sourceVenueId = url.searchParams.get('SehirId');
    const sourceVenueLabel = url.searchParams.get('SehirAdi');
    const date = parseTjkDate(url.searchParams.get('QueryParameter_Tarih'));
    if (!sourceVenueId || !DOMESTIC_TJK_VENUES.has(sourceVenueId) || !sourceVenueLabel || !date) continue;
    if (startDate && date < startDate) continue;
    if (endDateExclusive && date >= endDateExclusive) continue;
    fixtures.push({
      candidate_id: `tjk-${date}-${sourceVenueId}`,
      source: 'tjk',
      country: 'Turkey',
      date,
      racecourse: sourceVenueLabel,
      racecourse_source_id: sourceVenueId,
      source_url: url.href,
      capability_rank: 'C',
      publication_ceiling: 'A',
      first_race_time_local: null,
      last_race_time_local: null,
      timetable_rows: [],
      detail_observation: { status: 'not_published', race_count: 0, conflicts: [] },
      provenance: {
        discovered_from: ANNUAL_PAGE_URL,
        discovered_href: href,
        discovery_method: 'official_annual_programme_fixture',
      },
    });
  }
  const byId = new Map();
  for (const fixture of fixtures) if (!byId.has(fixture.candidate_id)) byId.set(fixture.candidate_id, fixture);
  return [...byId.values()].sort((a, b) => a.date.localeCompare(b.date) || Number(a.racecourse_source_id) - Number(b.racecourse_source_id));
}

export async function discoverAnnualFixtures({ startDate, endDateExclusive, fetchImpl = fetch, maxPages = 20 } = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate || '') || !/^\d{4}-\d{2}-\d{2}$/.test(endDateExclusive || '')) {
    throw new Error('startDate and endDateExclusive must be YYYY-MM-DD');
  }
  const endDate = new Date(`${endDateExclusive}T00:00:00Z`);
  endDate.setUTCDate(endDate.getUTCDate() - 1);
  const endDateInclusive = endDate.toISOString().slice(0, 10);
  const all = new Map();
  const pages = [];

  const firstUrl = buildQueryUrl(ANNUAL_DATA_URL, startDate, endDateInclusive);
  let firstHtml = null;
  try {
    firstHtml = await fetchHtml(firstUrl, fetchImpl);
    pages.push({ page_number: 0, url: firstUrl, status: 'ok' });
  } catch (error) {
    pages.push({
      page_number: 0,
      url: firstUrl,
      status: 'fetch_failed',
      error_code: error?.name === 'TimeoutError' ? 'timeout' : 'fetch_error',
    });

    try {
      const staticCalendar = await fetchStaticAnnualCalendar(startDate, endDateExclusive, fetchImpl);
      pages.push({
        page_number: null,
        url: TJK_STATIC_CALENDAR_URL,
        status: 'static_calendar_ok',
        annual_fixture_count: staticCalendar.annual_fixture_count,
        window_fixture_count: staticCalendar.fixtures.length,
      });
      return {
        fixtures: staticCalendar.fixtures,
        pages,
        source_url: TJK_STATIC_CALENDAR_URL,
        schedule_source_id: 'tjk-static-annual-calendar',
        daily_entry_url: ENTRY_URL,
        dynamic_route_failure: {
          stage: 'annual_dynamic_route',
          source_url: firstUrl,
          error_code: error?.name === 'TimeoutError' ? 'timeout' : 'fetch_error',
        },
      };
    } catch (staticError) {
      pages.push({
        page_number: null,
        url: TJK_STATIC_CALENDAR_URL,
        status: 'static_calendar_failed',
        error_code: staticError?.name === 'TimeoutError' ? 'timeout' : 'fetch_error',
      });
    }

    const cursor = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDateExclusive}T00:00:00Z`);
    const fallbackDays = [];
    while (cursor < end) {
      const day = cursor.toISOString().slice(0, 10);
      const nextDay = new Date(cursor.valueOf() + 86_400_000).toISOString().slice(0, 10);
      fallbackDays.push({ day, nextDay, url: buildQueryUrl(ANNUAL_PAGE_URL, day, day) });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    const fallbackConcurrency = 4;
    for (let offset = 0; offset < fallbackDays.length; offset += fallbackConcurrency) {
      const batch = fallbackDays.slice(offset, offset + fallbackConcurrency);
      const results = await Promise.all(batch.map(async ({ day, nextDay, url }) => {
        try {
          const fallbackHtml = await fetchHtml(url, fetchImpl, { timeoutMs: 10_000 });
          return {
            page: { page_number: null, date: day, url, status: 'fallback_page_ok' },
            fixtures: extractAnnualFixtures(fallbackHtml, { startDate: day, endDateExclusive: nextDay }),
          };
        } catch (fallbackError) {
          return {
            page: {
              page_number: null,
              date: day,
              url,
              status: 'fallback_page_failed',
              error_code: fallbackError?.name === 'TimeoutError' ? 'timeout' : 'fetch_error',
            },
            fixtures: [],
          };
        }
      }));
      for (const result of results) {
        pages.push(result.page);
        for (const fixture of result.fixtures) all.set(fixture.candidate_id, fixture);
      }
    }
    return {
      fixtures: [...all.values()].sort((a, b) => a.date.localeCompare(b.date) || Number(a.racecourse_source_id) - Number(b.racecourse_source_id)),
      pages,
      source_url: ANNUAL_PAGE_URL,
      schedule_source_id: 'tjk-annual-programme-page-fallback',
      daily_entry_url: ENTRY_URL,
    };
  }
  for (const fixture of extractAnnualFixtures(firstHtml, { startDate, endDateExclusive })) all.set(fixture.candidate_id, fixture);

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    const pageUrl = buildQueryUrl(ANNUAL_ROWS_URL, startDate, endDateInclusive, pageNumber);
    const html = await fetchHtml(pageUrl, fetchImpl, { allowNotFound: true });
    if (html === null) {
      pages.push({ page_number: pageNumber, url: pageUrl, status: 'not_found_end' });
      break;
    }
    const pageFixtures = extractAnnualFixtures(html, { startDate, endDateExclusive });
    pages.push({ page_number: pageNumber, url: pageUrl, status: 'ok' });
    let added = 0;
    for (const fixture of pageFixtures) {
      if (!all.has(fixture.candidate_id)) added += 1;
      all.set(fixture.candidate_id, fixture);
    }
    const hasMore = /class\s*=\s*["'][^"']*show-more[^"']*["']/iu.test(html) || /name\s*=\s*["']PageNumber["']/iu.test(html);
    if (pageFixtures.length === 0 || (!hasMore && added === 0)) break;
    if (added === 0 && pageNumber > 1) break;
  }

  return {
    fixtures: [...all.values()].sort((a, b) => a.date.localeCompare(b.date) || Number(a.racecourse_source_id) - Number(b.racecourse_source_id)),
    pages,
    source_url: ANNUAL_PAGE_URL,
    schedule_source_id: 'tjk-annual-programme',
    daily_entry_url: ENTRY_URL,
  };
}
