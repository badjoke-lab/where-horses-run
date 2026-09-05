import {
  baneiDebaTableUrl,
  baneiRaceListUrl,
  discoverBaneiRaceNumbers,
  parseBaneiDebaMetadata,
  parseBaneiRaceList,
} from './banei-detail-core.mjs';

const JRA_VENUES = {
  '札幌': 'sapporo', '函館': 'hakodate', '福島': 'fukushima', '新潟': 'niigata', '東京': 'tokyo',
  '中山': 'nakayama', '中京': 'chukyo', '京都': 'kyoto', '阪神': 'hanshin', '小倉': 'kokura',
};
const NAR_VENUES = {
  '01': ['北見', 'kitami'], '02': ['岩見沢', 'iwamizawa'], '03': ['帯広ば', 'obihiro'], '04': ['門別', 'mombetsu'],
  '10': ['盛岡', 'morioka'], '11': ['水沢', 'mizusawa'], '18': ['浦和', 'urawa'], '19': ['船橋', 'funabashi'],
  '20': ['大井', 'oi'], '21': ['川崎', 'kawasaki'], '22': ['金沢', 'kanazawa'], '23': ['笠松', 'kasamatsu'],
  '24': ['名古屋', 'nagoya'], '27': ['園田', 'sonoda'], '28': ['姫路', 'himeji'], '31': ['高知', 'kochi'], '32': ['佐賀', 'saga'],
};
const NAR_NAME_TO_CODE = new Map(Object.entries(NAR_VENUES).map(([code, [name]]) => [name, code]));

const entities = (value) => String(value ?? '')
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&#x2f;|&#47;/gi, '/');
const plain = (value) => entities(value)
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/[\s\u3000]+/g, ' ')
  .trim();
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
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function get(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)',
      accept: 'text/html',
      'accept-language': 'ja,en;q=.7',
    },
  });
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}: ${url}`);
    error.status = response.status;
    throw error;
  }
  const bytes = await response.arrayBuffer();
  const decoded = ['shift_jis', 'utf-8']
    .map((encoding) => new TextDecoder(encoding).decode(bytes))
    .sort((a, b) => (b.match(/[競馬発走開催]/g)?.length ?? 0) - (a.match(/[競馬発走開催]/g)?.length ?? 0))[0];
  return { body: decoded, url: response.url };
}

function months(dates) { return [...new Set(dates.map((date) => date.slice(0, 7)))]; }
function daysInMonth(year, month) { return new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate(); }
function narRaceListUrl(date, code) {
  const params = new URLSearchParams({ k_babaCode: code, k_raceDate: date.replaceAll('-', '/') });
  return `https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList?${params}`;
}
function narDebaTableUrl(date, code, raceNumber) {
  const params = new URLSearchParams({ k_babaCode: code, k_raceDate: date.replaceAll('-', '/'), k_raceNo: String(raceNumber) });
  return `https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/DebaTable?${params}`;
}
function normalizeTime(hour, minute) {
  return `${String(Number(hour)).padStart(2, '0')}:${String(Number(minute)).padStart(2, '0')}`;
}
function surfaceLabel(token) {
  if (/^芝/.test(token)) return 'Turf';
  if (/^(?:ダ|ダート)$/.test(token)) return 'Dirt';
  return null;
}
function courseLabel(surfaceToken, turn = null) {
  const parts = [];
  if (/^芝/.test(surfaceToken)) parts.push(surfaceToken === '芝・外' ? 'Turf Outer' : 'Turf');
  else if (/^(?:ダ|ダート)$/.test(surfaceToken)) parts.push('Dirt');
  if (turn === '右') parts.push('Right-handed');
  else if (turn === '左') parts.push('Left-handed');
  else if (turn === '直') parts.push('Straight');
  return parts.join(' ') || null;
}

function parseJraRaceSegment(segment) {
  const compact = segment.replace(/\s+/g, ' ').trim();
  const markers = [...compact.matchAll(/(?:^|\s)(\d{1,2})\s*レース(?:\s|$)/g)];
  const rows = [];
  for (let index = 0; index < markers.length; index += 1) {
    const raceNumber = Number(markers[index][1]);
    const start = markers[index].index + markers[index][0].length;
    const end = markers[index + 1]?.index ?? compact.length;
    const chunk = compact.slice(start, end).trim();
    const time = chunk.match(/(\d{1,2})\s*時\s*(\d{2})\s*分/);
    if (!time) continue;
    const course = chunk.match(/(\d{1,2}(?:,\d{3})?|\d{3,4})\s*[（(]\s*(芝(?:・外)?|ダ)\s*[）)]/);
    const beforeTime = chunk.slice(0, time.index).trim();
    const raceName = course ? beforeTime.slice(0, beforeTime.indexOf(course[0])).trim() : beforeTime;
    rows.push({
      race_number: raceNumber,
      label: `Race ${raceNumber}`,
      post_time_local: normalizeTime(time[1], time[2]),
      race_name: raceName || null,
      distance_m: course ? Number(course[1].replace(',', '')) : null,
      surface: course ? surfaceLabel(course[2]) : null,
      course_label: course ? courseLabel(course[2]) : null,
    });
  }
  return rows.sort((a, b) => a.race_number - b.race_number);
}

export function parseJraProgrammePage(html, date, sourceUrl) {
  const text = lined(html);
  const venuePattern = new RegExp(`(?:第?\\s*\\d+\\s*回\\s*)?(${Object.keys(JRA_VENUES).join('|')})(?:競馬)?\\s*(?:第?\\s*\\d+\\s*日)?`, 'g');
  const headings = [];
  for (const match of text.matchAll(venuePattern)) {
    const nearby = text.slice(Math.max(0, match.index - 12), Math.min(text.length, match.index + match[0].length + 12));
    if (!/\d+\s*回|\d+\s*日/.test(nearby)) continue;
    if (headings.some((row) => row.index === match.index)) continue;
    headings.push({ index: match.index, venueJa: match[1] });
  }
  const meetings = [];
  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    const end = headings[index + 1]?.index ?? text.length;
    const timetableRows = parseJraRaceSegment(text.slice(heading.index, end));
    if (!timetableRows.length && meetings.some((row) => row.venue_ja === heading.venueJa)) continue;
    const venue = JRA_VENUES[heading.venueJa];
    meetings.push({
      meeting_id: `jra-${venue}-racecourse-${date}`,
      date,
      authority_id: 'jra',
      racing_system_id: 'japan-jra-system',
      racecourse_id: `${venue}-racecourse`,
      venue_ja: heading.venueJa,
      source_id: 'jra-racing-calendar-programme',
      source_label: 'Japan Racing Association',
      official_source_url: sourceUrl,
      programme_rows: timetableRows,
    });
  }
  return [...new Map(meetings.map((meeting) => [meeting.meeting_id, meeting])).values()];
}

function monthlyHrefMeetings(html, dates, baseUrl) {
  const allowed = new Set(dates);
  const found = [];
  for (const match of html.matchAll(/href=["']([^"']*RaceList[^"']*k_babaCode=(\d{1,2})[^"']*k_raceDate=([^&"']+)[^"']*)["']/gi)) {
    const code = match[2].padStart(2, '0');
    const date = decodeURIComponent(match[3]).replaceAll('/', '-');
    if (!allowed.has(date) || code === '03') continue;
    const venue = NAR_VENUES[code]?.[1] ?? `venue-${code}`;
    found.push({
      meeting_id: `nar-${venue}-racecourse-${date}`,
      date,
      authority_id: 'nar-local-government-racing',
      racing_system_id: 'japan-nar-system',
      racecourse_id: `${venue}-racecourse`,
      venue_code: code,
      source_id: 'nar-monthly-schedule-racelist',
      source_label: '地方競馬全国協会',
      official_source_url: new URL(entities(match[1]), baseUrl).toString(),
    });
  }
  return found;
}

export function parseNarMonthlySchedule(html, year, month, dates, baseUrl) {
  const allowed = new Set(dates);
  const found = monthlyHrefMeetings(html, dates, baseUrl);
  const totalDays = daysInMonth(year, month);
  for (const rowMatch of String(html).matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)) {
    const cells = [...rowMatch[0].matchAll(/<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi)].map((match) => plain(match[1]));
    if (cells.length < 2) continue;
    const venueName = [...NAR_NAME_TO_CODE.keys()].find((name) => cells[0].includes(name));
    if (!venueName) continue;
    const code = NAR_NAME_TO_CODE.get(venueName);
    if (code === '03') continue;
    for (let day = 1; day <= totalDays && day < cells.length; day += 1) {
      if (!/[●☆Ｄ△]/.test(cells[day])) continue;
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (!allowed.has(date)) continue;
      const venue = NAR_VENUES[code]?.[1] ?? `venue-${code}`;
      found.push({
        meeting_id: `nar-${venue}-racecourse-${date}`,
        date,
        authority_id: 'nar-local-government-racing',
        racing_system_id: 'japan-nar-system',
        racecourse_id: `${venue}-racecourse`,
        venue_code: code,
        source_id: 'nar-monthly-schedule-racelist',
        source_label: '地方競馬全国協会',
        official_source_url: narRaceListUrl(date, code),
      });
    }
  }
  return [...new Map(found.map((meeting) => [meeting.meeting_id, meeting])).values()];
}

function narRaceNameFromBlock(block, raceNumber) {
  for (const match of block.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const hrefMatch = match[1].match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const href = hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3] ?? '';
    if (!/(?:DebaTable|S_DebaTable)/i.test(href)) continue;
    const value = plain(match[2]);
    if (value && !new RegExp(`^${raceNumber}\\s*R$`, 'i').test(value) && !/(出馬表|詳細)/.test(value)) return value;
  }
  return null;
}

function discoverNarRaceNumbers(html) {
  const found = new Set();
  for (const match of String(html).matchAll(/[?&]k_raceNo=(\d{1,2})(?:&|["'])/gi)) {
    const value = Number(match[1]);
    if (value >= 1 && value <= 30) found.add(value);
  }
  for (const match of lined(html).matchAll(/(?:^|\s)(\d{1,2})\s*R(?:\s|$)/gi)) {
    const value = Number(match[1]);
    if (value >= 1 && value <= 30) found.add(value);
  }
  return [...found].sort((a, b) => a - b);
}

export function parseNarRaceListPage(html) {
  const rows = new Map();
  for (const blockMatch of String(html).matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)) {
    const block = blockMatch[0];
    const text = plain(block);
    const raceNumber = Number(block.match(/[?&]k_raceNo=(\d{1,2})(?:&|["'])/i)?.[1] ?? text.match(/(?:^|\s)(\d{1,2})\s*R(?:\s|$)/i)?.[1]);
    const time = text.match(/(?:^|\s)(\d{1,2}):(\d{2})(?:\s|$)/);
    if (!raceNumber || !time) continue;
    const course = text.match(/(?:^|\s)(右|左|直)\s*(\d{3,4})\s*[mｍＭ](?:\s|$)/);
    rows.set(raceNumber, {
      race_number: raceNumber,
      label: `Race ${raceNumber}`,
      post_time_local: normalizeTime(time[1], time[2]),
      race_name: narRaceNameFromBlock(block, raceNumber),
      distance_m: course ? Number(course[2]) : null,
      surface: null,
      course_label: course ? courseLabel('', course[1]) : null,
    });
  }
  return [...rows.values()].sort((a, b) => a.race_number - b.race_number);
}

function parseNarDebaMetadata(html) {
  const text = plain(html);
  const match = text.match(/(ダート|芝)\s*(\d{3,4})\s*[mｍＭ]\s*[（(]\s*(右|左|直)\s*[）)]/);
  if (!match) return null;
  return {
    surface: surfaceLabel(match[1]),
    distance_m: Number(match[2]),
    course_label: courseLabel(match[1], match[3]),
  };
}

const finish = (meeting, timetableRows, url) => {
  if (!timetableRows.length) return { status: 'scheduled_pending_details', reason: 'official_detail_not_published' };
  const continuous = timetableRows.every((row, index) => row.label === `Race ${index + 1}`);
  if (!continuous) return { status: 'race_number_discovery_incomplete', reason: 'non_continuous_official_race_numbers' };
  const rich = timetableRows.every((row) => row.race_name && row.distance_m && row.surface && row.course_label);
  return {
    status: 'ok',
    meeting: {
      ...meeting,
      capability_rank: rich ? 'A+' : 'A',
      timetable_rows: timetableRows,
      official_source_url: url,
    },
  };
};

async function discoverJra({ dates }) {
  const found = [];
  for (const date of dates) {
    const [year, month, day] = date.split('-');
    const url = `https://www.jra.go.jp/keiba/calendar${year}/${year}/${Number(month)}/${month}${day}.html`;
    let page;
    try { page = await get(url); }
    catch (error) { if (error.status === 404) continue; throw error; }
    found.push(...parseJraProgrammePage(page.body, date, page.url));
    await sleep(80);
  }
  return [...new Map(found.map((meeting) => [meeting.meeting_id, meeting])).values()];
}

async function discoverNar({ dates }) {
  const found = [];
  for (const monthKey of months(dates)) {
    const [year, month] = monthKey.split('-');
    const url = `https://www.keiba.go.jp/KeibaWeb/MonthlyConveneInfo/MonthlyConveneInfoTop?k_month=${Number(month)}&k_year=${year}`;
    const page = await get(url);
    found.push(...parseNarMonthlySchedule(page.body, year, month, dates, page.url));
  }
  return [...new Map(found.map((meeting) => [meeting.meeting_id, meeting])).values()];
}

async function discoverBanei({ dates }) {
  const allowed = new Set(dates);
  const found = [];
  for (const month of months(dates)) {
    const epoch = Math.floor(Date.parse(`${month}-01T00:00:00+09:00`) / 1000);
    const url = `https://www.banei-keiba.or.jp/race_schedule.php?c=mon&d=${epoch}`;
    const page = await get(url);
    for (const match of page.body.matchAll(/k_raceDate=(\d{4})[/%-](\d{1,2})[/%-](\d{1,2})/gi)) {
      const date = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      if (!allowed.has(date)) continue;
      found.push({
        meeting_id: `banei-obihiro-racecourse-${date}`,
        date,
        authority_id: 'banei-tokachi',
        racing_system_id: 'japan-banei-system',
        racecourse_id: 'obihiro-racecourse',
        source_id: 'banei-official-schedule-nar-detail',
        source_label: 'ばんえい十勝',
        official_source_url: url,
      });
    }
  }
  return [...new Map(found.map((meeting) => [meeting.meeting_id, meeting])).values()];
}

async function inspectNar(meeting) {
  const page = await get(meeting.official_source_url);
  const numbers = discoverNarRaceNumbers(page.body);
  if (!numbers.length) return { status: 'scheduled_pending_details', reason: 'scheduled_pending_details' };
  const parsed = parseNarRaceListPage(page.body);
  if (parsed.length !== numbers.length || !numbers.every((number, index) => number === index + 1)) {
    return { status: 'race_number_discovery_incomplete', reason: 'race_number_discovery_incomplete' };
  }

  const enriched = [];
  for (const row of parsed) {
    let metadata = null;
    try {
      const detail = await get(narDebaTableUrl(meeting.date, meeting.venue_code, row.race_number));
      metadata = parseNarDebaMetadata(detail.body);
    } catch (error) {
      if (error.status !== 404) throw error;
    }
    if (metadata && row.distance_m && metadata.distance_m !== row.distance_m) {
      return { status: 'conflict', reason: `official_distance_mismatch_race_${row.race_number}` };
    }
    enriched.push({
      label: row.label,
      post_time_local: row.post_time_local,
      race_name: row.race_name,
      distance_m: metadata?.distance_m ?? row.distance_m,
      surface: metadata?.surface ?? null,
      course_label: metadata?.course_label ?? row.course_label,
    });
  }
  return finish(meeting, enriched, page.url);
}

async function inspectBanei(meeting) {
  const url = baneiRaceListUrl(meeting.date);
  const page = await get(url);
  const numbers = discoverBaneiRaceNumbers(page.body);
  if (!numbers.length) return { status: 'scheduled_pending_details', reason: 'scheduled_pending_details' };
  const parsed = parseBaneiRaceList(page.body, meeting.date);
  if (parsed.length !== numbers.length || !numbers.every((number, index) => number === index + 1)) {
    return { status: 'race_number_discovery_incomplete', reason: 'race_number_discovery_incomplete' };
  }

  const enriched = [];
  for (const row of parsed) {
    let metadata = null;
    try {
      const detail = await get(baneiDebaTableUrl(meeting.date, row.race_number));
      metadata = parseBaneiDebaMetadata(detail.body);
    } catch (error) {
      if (error.status !== 404) throw error;
    }
    if (metadata && metadata.distance_m !== row.list_distance_m) {
      return { status: 'conflict', reason: `official_distance_mismatch_race_${row.race_number}` };
    }
    enriched.push({
      label: row.label,
      post_time_local: row.post_time_local,
      race_name: row.race_name,
      distance_m: metadata?.distance_m ?? row.list_distance_m,
      surface: metadata?.surface ?? null,
      course_label: metadata?.course_label ?? 'Banei Straight Course',
    });
  }
  return finish(meeting, enriched, page.url);
}

export const japanOfficial30dAdapters = {
  jra: {
    discover: discoverJra,
    inspect: async (meeting) => finish(meeting, meeting.programme_rows ?? [], meeting.official_source_url),
  },
  'nar-standard': { discover: discoverNar, inspect: inspectNar },
  banei: { discover: discoverBanei, inspect: inspectBanei },
};
