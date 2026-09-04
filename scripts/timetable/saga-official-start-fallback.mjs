import { fetchNankanOfficialProgramme } from './nankan-official-programme-fallback.mjs';

const SAGA_OFFICIAL_START_URL = 'https://www.sagakeiba.net/raceinfo/start/';
const MONBETSU_OFFICIAL_RACEINFO_URL = 'https://www.hokkaidokeiba.net/raceinfo/syuso.php';

const entities = (value) => String(value ?? '')
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>');

const lined = (value) => entities(value)
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/(?:tr|td|th|div|section|article|p|li|h[1-6]|table)>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/[\t\u3000 ]+/g, ' ')
  .replace(/\r/g, '')
  .replace(/\n\s+/g, '\n')
  .replace(/\n{2,}/g, '\n')
  .trim();

const plain = (value) => lined(value).replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
const asciiDigits = (value) => String(value ?? '').replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0));

function dateSection(text, date) {
  const [year, month, day] = date.split('-');
  const pattern = new RegExp(`${year}年\\s*${Number(month)}月\\s*${Number(day)}日`);
  const match = pattern.exec(text);
  if (!match) return null;
  const afterStart = match.index + match[0].length;
  const remainder = text.slice(afterStart);
  const next = /\d{4}年\s*\d{1,2}月\s*\d{1,2}日/.exec(remainder);
  return text.slice(match.index, next ? afterStart + next.index : text.length);
}

export function parseSagaOfficialStartPage(html, date) {
  const section = dateSection(lined(html), date);
  if (!section) return [];
  const lines = section.split('\n').map((line) => line.trim()).filter(Boolean);
  const raceHeader = lines.findIndex((line) => line === 'R');
  const postHeader = lines.findIndex((line, index) => index > raceHeader && line === '発走');
  if (raceHeader < 0 || postHeader < 0) return [];

  const columns = lines
    .slice(raceHeader + 1, postHeader)
    .filter((line) => line === 'JRA' || /^\d{1,2}$/.test(line));
  if (!columns.length) return [];

  const times = lines
    .slice(postHeader + 1)
    .filter((line) => /^\d{1,2}:\d{2}$/.test(line))
    .slice(0, columns.length);
  if (times.length !== columns.length) return [];

  const rows = [];
  for (let index = 0; index < columns.length; index += 1) {
    if (!/^\d{1,2}$/.test(columns[index])) continue;
    const raceNumber = Number(columns[index]);
    rows.push({
      label: `Race ${raceNumber}`,
      post_time_local: times[index],
      race_name: null,
      distance_m: null,
      surface: null,
      course_label: null,
    });
  }
  if (!rows.length || !rows.every((row, index) => row.label === `Race ${index + 1}`)) return [];
  return rows;
}

export function parseMonbetsuOfficialRaceInfoPage(html, date, expectedRaceNumber = null) {
  const normalized = asciiDigits(plain(html));
  const [year, month, day] = date.split('-');
  if (!new RegExp(`${year}年\\s*${Number(month)}月\\s*${Number(day)}日`).test(normalized)) return [];

  const raceMatch = /第\s*(\d{1,2})\s*競走/.exec(normalized);
  if (!raceMatch) return [];
  const raceNumber = Number(raceMatch[1]);
  if (expectedRaceNumber != null && raceNumber !== expectedRaceNumber) return [];

  const contextStart = Math.max(0, raceMatch.index - 400);
  const context = normalized.slice(contextStart, raceMatch.index + raceMatch[0].length + 600);
  const time = /発走時刻[^0-9]{0,24}(\d{1,2})\s*[:：]\s*(\d{2})/.exec(context);
  if (!time) return [];
  const distance = /(\d{3,4})\s*[mMｍＭ](?:\s*[（(](外|内)[）)])?/.exec(context);

  return [{
    label: `Race ${raceNumber}`,
    post_time_local: `${String(Number(time[1])).padStart(2, '0')}:${time[2]}`,
    race_name: null,
    distance_m: distance ? Number(distance[1]) : null,
    surface: null,
    course_label: null,
  }];
}

function monbetsuRaceNumbers(html) {
  const numbers = new Set();
  for (const match of String(html).matchAll(/[?&](?:amp;)?p_rno=(\d{1,3})/gi)) {
    const value = Number(match[1]);
    if (value >= 1 && value <= 14) numbers.add(value);
  }
  const ordered = [...numbers].sort((left, right) => left - right);
  if (!ordered.length || !ordered.every((number, index) => number === index + 1)) return [];
  return ordered;
}

async function decodePage(response, preferred = ['utf-8', 'shift_jis']) {
  const bytes = await response.arrayBuffer();
  return preferred
    .map((encoding) => new TextDecoder(encoding).decode(bytes))
    .sort((a, b) => (b.match(/[競馬発走]/g)?.length ?? 0) - (a.match(/[競馬発走]/g)?.length ?? 0))[0];
}

async function fetchSagaStartPage(fetchImpl) {
  const response = await fetchImpl(SAGA_OFFICIAL_START_URL, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)',
      accept: 'text/html',
      'accept-language': 'ja,en;q=.7',
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${SAGA_OFFICIAL_START_URL}`);
  return { body: await decodePage(response), url: response.url || SAGA_OFFICIAL_START_URL };
}

function monbetsuRaceInfoUrl(date, raceNumber) {
  const url = new URL(MONBETSU_OFFICIAL_RACEINFO_URL);
  url.searchParams.set('bid', 'nittei');
  url.searchParams.set('bk_nd', '');
  url.searchParams.set('p_day', date.replaceAll('-', ''));
  url.searchParams.set('p_rno', String(raceNumber).padStart(3, '0'));
  return url;
}

async function fetchMonbetsuRaceInfoPage(fetchImpl, date, raceNumber) {
  const url = monbetsuRaceInfoUrl(date, raceNumber);
  const response = await fetchImpl(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)',
      accept: 'text/html',
      'accept-language': 'ja,en;q=.7',
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return { body: await decodePage(response), url: response.url || url.toString() };
}

async function collectMonbetsuRaceInfo(fetchImpl, date) {
  const firstPage = await fetchMonbetsuRaceInfoPage(fetchImpl, date, 1);
  const firstRows = parseMonbetsuOfficialRaceInfoPage(firstPage.body, date, 1);
  if (firstRows.length !== 1) return null;

  const raceNumbers = monbetsuRaceNumbers(firstPage.body);
  if (!raceNumbers.length) return null;

  const rows = [firstRows[0]];
  for (const raceNumber of raceNumbers.slice(1)) {
    const page = await fetchMonbetsuRaceInfoPage(fetchImpl, date, raceNumber);
    const parsed = parseMonbetsuOfficialRaceInfoPage(page.body, date, raceNumber);
    if (parsed.length !== 1) return null;
    rows.push(parsed[0]);
  }
  if (rows.length !== raceNumbers.length || !rows.every((row, index) => row.label === `Race ${index + 1}`)) return null;
  return { rows, url: firstPage.url };
}

function canFallback(primary) {
  return ['race_number_discovery_incomplete', 'scheduled_pending_details'].includes(primary.status);
}

function canNankanFallback(primary) {
  return ['race_number_discovery_incomplete', 'scheduled_pending_details', 'details_pending'].includes(primary?.status);
}

export function withSagaOfficialStartFallback(baseInspect, fetchImpl = fetch) {
  return async (meeting, context) => {
    const requestFetch = context?.fetchImpl ?? fetchImpl;
    const primary = await baseInspect(meeting, context);

    if (canNankanFallback(primary) && ['18', '19', '20', '21'].includes(meeting.venue_code)) {
      try {
        const nankan = await fetchNankanOfficialProgramme(meeting, { fetchImpl: requestFetch });
        if (nankan) return nankan;
      } catch {
        // Preserve the primary NAR state when South Kanto detail is unavailable or malformed.
      }
    }

    if (!canFallback(primary)) return primary;

    if (meeting.venue_code === '32') {
      try {
        const page = await fetchSagaStartPage(requestFetch);
        const rows = parseSagaOfficialStartPage(page.body, meeting.date);
        if (rows.length) {
          return {
            status: 'ok',
            meeting: {
              ...meeting,
              source_id: 'saga-official-start-times-fallback',
              source_label: '佐賀競馬',
              capability_rank: 'A',
              timetable_rows: rows,
              official_source_url: page.url,
            },
          };
        }
      } catch {
        return primary;
      }
    }

    if (meeting.venue_code === '04') {
      try {
        const collected = await collectMonbetsuRaceInfo(requestFetch, meeting.date);
        if (collected?.rows.length) {
          return {
            status: 'ok',
            meeting: {
              ...meeting,
              source_id: 'monbetsu-official-raceinfo-fallback',
              source_label: 'ホッカイドウ競馬',
              capability_rank: 'A',
              timetable_rows: collected.rows,
              official_source_url: collected.url,
            },
          };
        }
      } catch {
        return primary;
      }
    }

    return primary;
  };
}

export { SAGA_OFFICIAL_START_URL, MONBETSU_OFFICIAL_RACEINFO_URL };
