import { fetchNankanOfficialProgramme } from './nankan-official-programme-fallback.mjs';
import { fetchIwateOfficialProgrammeTiming } from './iwate-official-programme-fallback.mjs';

const SAGA_OFFICIAL_START_URL = 'https://www.sagakeiba.net/raceinfo/start/';
const MONBETSU_OFFICIAL_RACEINFO_URL = 'https://www.hokkaidokeiba.net/raceinfo/syuso.php';
const IWATE_OFFICIAL_HOME_URL = 'https://www.iwatekeiba.or.jp/';
const KASAMATSU_OFFICIAL_NEWS_URL = 'https://www.kasamatsu-keiba.com/news/1';
// Hokkaido Keiba's official Monbetsu racecards identify prior-course records as ダ and
// the venue operates the same dirt course for the current programme. Keep this stable
// venue fact separate from date/race-specific parsing; rank remains derived centrally.
const MONBETSU_SURFACE = 'Dirt';

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
const normalizeWide = (value) => asciiDigits(value).replace(/：/g, ':').replace(/／/g, '/');

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
  const normalized = normalizeWide(plain(html));
  const [year, month, day] = date.split('-');
  if (!new RegExp(`${year}年\\s*${Number(month)}月\\s*${Number(day)}日`).test(normalized)) return [];

  const raceMatch = /第\s*(\d{1,2})\s*競走/.exec(normalized);
  if (!raceMatch) return [];
  const raceNumber = Number(raceMatch[1]);
  if (expectedRaceNumber != null && raceNumber !== expectedRaceNumber) return [];

  const beforeRace = normalized.slice(Math.max(0, raceMatch.index - 500), raceMatch.index);
  const timeMatches = [...beforeRace.matchAll(/発走時刻[^0-9]{0,24}(\d{1,2})\s*:\s*(\d{2})/g)];
  const distanceMatches = [...beforeRace.matchAll(/(\d{3,4})\s*[mMｍＭ]\s*[（(](外|内)[）)]/g)];
  const time = timeMatches.at(-1);
  const distance = distanceMatches.at(-1);
  if (!time || !distance) return [];

  const afterRace = normalized.slice(raceMatch.index + raceMatch[0].length, raceMatch.index + raceMatch[0].length + 500);
  const raceName = afterRace.match(/^\s*(.+?)\s*[（(]サラ系/)?.[1]?.trim() ?? null;
  if (!raceName) return [];

  return [{
    label: `Race ${raceNumber}`,
    post_time_local: `${String(Number(time[1])).padStart(2, '0')}:${time[2]}`,
    race_name: raceName,
    distance_m: Number(distance[1]),
    surface: MONBETSU_SURFACE,
    course_label: distance[2] === '外' ? 'Outer' : 'Inner',
  }];
}

function isoDate(year, month, day) {
  const value = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? null : value;
}

function iwateTimingFromText(text, year) {
  const normalized = normalizeWide(plain(text));
  const dateMatch = /(?:水沢|盛岡|水|盛)?\s*(\d{1,2})\s*(?:\/|月)\s*(\d{1,2})(?:日)?(?:\s*[（(][^）)]*[）)])?/.exec(normalized);
  if (!dateMatch) return null;
  const date = isoDate(Number(year), Number(dateMatch[1]), Number(dateMatch[2]));
  if (!date) return null;
  const times = [...normalized.matchAll(/(\d{1,2}):(\d{2})/g)]
    .map((time) => `${String(Number(time[1])).padStart(2, '0')}:${time[2]}`);
  if (times.length < 4) return null;
  return {
    date,
    timing: {
      first_race_time_local: times[1],
      last_race_time_local: times[3],
    },
  };
}

export function parseIwateOfficialHomeTimes(html, year) {
  const rows = new Map();
  for (const match of String(html).matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)) {
    const parsed = iwateTimingFromText(match[0], year);
    if (parsed) rows.set(parsed.date, parsed.timing);
  }

  const pageText = normalizeWide(plain(html));
  const hasOfficialTimingHeader = /開催日/.test(pageText)
    && /本場入場開始/.test(pageText)
    && /第\s*1レース/.test(pageText)
    && /メインレース/.test(pageText)
    && /最終レース/.test(pageText);
  if (!hasOfficialTimingHeader) return rows;

  const datePattern = /(?:水沢|盛岡|水|盛)\s*(\d{1,2})\s*(?:\/|月)\s*(\d{1,2})(?:日)?(?:\s*[（(][^）)]*[）)])?/g;
  const matches = [...pageText.matchAll(datePattern)];
  for (let index = 0; index < matches.length; index += 1) {
    const start = matches[index].index ?? 0;
    const end = matches[index + 1]?.index ?? pageText.length;
    const parsed = iwateTimingFromText(pageText.slice(start, end), year);
    if (parsed) rows.set(parsed.date, parsed.timing);
  }
  return rows;
}

function hrefFromAttributes(attributes) {
  const match = String(attributes).match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

export function parseKasamatsuMeetingNoticeLinks(html, baseUrl = KASAMATSU_OFFICIAL_NEWS_URL) {
  const links = [];
  for (const match of String(html).matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const title = normalizeWide(plain(match[2]));
    if (!/第\s*\d+\s*回(?:\s*笠松)?競馬/.test(title) || !/開催/.test(title) || !/お知らせ/.test(title)) continue;
    const href = hrefFromAttributes(match[1]);
    if (!href) continue;
    let url;
    try { url = new URL(entities(href), baseUrl); }
    catch { continue; }
    if (url.protocol !== 'https:' || url.hostname !== 'www.kasamatsu-keiba.com' || !/^\/news\/detail\//.test(url.pathname)) continue;
    links.push(url.toString());
  }
  return [...new Set(links)];
}

export function parseKasamatsuFirstRaceTimes(html, year) {
  const text = normalizeWide(plain(html));
  const marker = /第\s*1\s*競走発走時刻/.exec(text);
  if (!marker) return new Map();
  const section = text.slice(marker.index + marker[0].length, marker.index + marker[0].length + 600);
  const rows = new Map();
  let currentMonth = null;
  const pattern = /(?:(\d{1,2})月)?\s*(\d{1,2})日(?:\s*[（(][^）)]*[）)])?\s*(\d{1,2}):(\d{2})/g;
  for (const match of section.matchAll(pattern)) {
    if (match[1]) currentMonth = Number(match[1]);
    if (!currentMonth) continue;
    const date = isoDate(Number(year), currentMonth, Number(match[2]));
    if (!date) continue;
    rows.set(date, `${String(Number(match[3])).padStart(2, '0')}:${match[4]}`);
  }
  return rows;
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

async function fetchOfficialText(url, fetchImpl, expectedHostname) {
  const response = await fetchImpl(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)',
      accept: 'text/html',
      'accept-language': 'ja,en;q=.7',
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  const finalUrl = new URL(response.url || url);
  if (finalUrl.protocol !== 'https:' || finalUrl.hostname !== expectedHostname) {
    throw new Error(`unexpected official redirect: ${finalUrl.toString()}`);
  }
  return { body: await decodePage(response), url: finalUrl.toString() };
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

async function collectKasamatsuFirstRaceTimes(fetchImpl, year) {
  const index = await fetchOfficialText(KASAMATSU_OFFICIAL_NEWS_URL, fetchImpl, 'www.kasamatsu-keiba.com');
  const links = parseKasamatsuMeetingNoticeLinks(index.body, index.url).slice(0, 12);
  const rows = new Map();
  for (const link of links) {
    try {
      const page = await fetchOfficialText(link, fetchImpl, 'www.kasamatsu-keiba.com');
      for (const [date, firstRaceTime] of parseKasamatsuFirstRaceTimes(page.body, year)) {
        rows.set(date, { first_race_time_local: firstRaceTime, source_url: page.url });
      }
    } catch {
      // A malformed or unavailable notice is not authoritative negative evidence.
    }
  }
  return rows;
}

function canFallback(primary) {
  return ['race_number_discovery_incomplete', 'scheduled_pending_details', 'details_pending'].includes(primary?.status);
}

function canNankanFallback(primary) {
  return ['race_number_discovery_incomplete', 'scheduled_pending_details', 'details_pending'].includes(primary?.status);
}

function iwateFreshHomeUrl(monthKey) {
  const url = new URL(IWATE_OFFICIAL_HOME_URL);
  url.searchParams.set('_whr_timetable', `${monthKey}-${Date.now()}`);
  return url.toString();
}

export function withSagaOfficialStartFallback(baseInspect, fetchImpl = fetch) {
  const iwateByMonth = new Map();
  const kasamatsuByYear = new Map();

  const iwateTimes = (date, requestFetch) => {
    const monthKey = date.slice(0, 7);
    const year = Number(date.slice(0, 4));
    if (!iwateByMonth.has(monthKey)) {
      iwateByMonth.set(monthKey, (async () => {
        try {
          const page = await fetchOfficialText(IWATE_OFFICIAL_HOME_URL, requestFetch, 'www.iwatekeiba.or.jp');
          const rows = parseIwateOfficialHomeTimes(page.body, year);
          if (rows.has(date)) return { rows, url: IWATE_OFFICIAL_HOME_URL };
        } catch {
          // A stale or unavailable canonical homepage is retried below with a cache-busting query.
        }
        const freshPage = await fetchOfficialText(iwateFreshHomeUrl(monthKey), requestFetch, 'www.iwatekeiba.or.jp');
        return {
          rows: parseIwateOfficialHomeTimes(freshPage.body, year),
          url: IWATE_OFFICIAL_HOME_URL,
        };
      })());
    }
    return iwateByMonth.get(monthKey);
  };

  const kasamatsuTimes = (year, requestFetch) => {
    if (!kasamatsuByYear.has(year)) kasamatsuByYear.set(year, collectKasamatsuFirstRaceTimes(requestFetch, year));
    return kasamatsuByYear.get(year);
  };

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

    if (['10', '11'].includes(meeting.venue_code) || ['morioka-racecourse', 'mizusawa-racecourse'].includes(meeting.racecourse_id)) {
      try {
        const programme = await fetchIwateOfficialProgrammeTiming(meeting, { fetchImpl: requestFetch });
        if (programme) return programme;
      } catch {
        // Fall through to the homepage timing table when the programme PDF path is unavailable or malformed.
      }
      try {
        const page = await iwateTimes(meeting.date, requestFetch);
        const timing = page.rows.get(meeting.date);
        if (timing?.first_race_time_local && timing?.last_race_time_local) {
          return {
            status: 'ok',
            meeting: {
              ...meeting,
              source_id: 'iwatekeiba-official-time-fallback',
              source_label: '岩手競馬',
              capability_rank: 'B+',
              first_race_time_local: timing.first_race_time_local,
              last_race_time_local: timing.last_race_time_local,
              timetable_rows: [],
              official_source_url: page.url,
            },
          };
        }
      } catch {
        // Preserve the primary NAR state when the regional timing table is unavailable or malformed.
      }
    }

    if (meeting.venue_code === '23' || meeting.racecourse_id === 'kasamatsu-racecourse') {
      try {
        const year = Number(meeting.date.slice(0, 4));
        const timing = (await kasamatsuTimes(year, requestFetch)).get(meeting.date);
        if (timing?.first_race_time_local) {
          return {
            status: 'ok',
            meeting: {
              ...meeting,
              source_id: 'kasamatsu-official-first-race-fallback',
              source_label: '笠松けいば',
              capability_rank: 'B',
              first_race_time_local: timing.first_race_time_local,
              last_race_time_local: null,
              timetable_rows: [],
              official_source_url: timing.source_url,
            },
          };
        }
      } catch {
        // Preserve the primary NAR state when the official meeting notice is unavailable or malformed.
      }
    }

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

    if (['04', '36'].includes(meeting.venue_code) || meeting.racecourse_id === 'monbetsu-racecourse') {
      try {
        const collected = await collectMonbetsuRaceInfo(requestFetch, meeting.date);
        if (collected?.rows.length) {
          return {
            status: 'ok',
            meeting: {
              ...meeting,
              source_id: 'monbetsu-official-raceinfo-fallback',
              source_label: 'ホッカイドウ競馬',
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

export {
  SAGA_OFFICIAL_START_URL,
  MONBETSU_OFFICIAL_RACEINFO_URL,
  IWATE_OFFICIAL_HOME_URL,
  KASAMATSU_OFFICIAL_NEWS_URL,
};