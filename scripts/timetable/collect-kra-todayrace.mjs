import { buildKraMeetingObservation, parseKraTodayRacePages } from './kra-todayrace-core.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  return [key, rest.join('=')];
}));

const RACECOURSES = Object.freeze({
  'seoul-racecourse': { meet_code: '1', label: 'Seoul', weekly_column: 1 },
  'jeju-racecourse': { meet_code: '2', label: 'Jeju', weekly_column: 3 },
  'busan-gyeongnam-racecourse': { meet_code: '3', label: 'Busan-Gyeongnam', weekly_column: 2 },
});
const WEEKDAY_TABLE_INDEX = Object.freeze({
  5: 0,
  6: 1,
  0: 2,
});
const CIRCLED_RACE_NUMBER = new Map([
  ['①', 1], ['②', 2], ['③', 3], ['④', 4], ['⑤', 5], ['⑥', 6], ['⑦', 7],
  ['⑧', 8], ['⑨', 9], ['⑩', 10], ['⑪', 11], ['⑫', 12], ['⑬', 13], ['⑭', 14],
]);

if (!args.date || !/^\d{4}-\d{2}-\d{2}$/.test(args.date)) throw new Error('--date=YYYY-MM-DD is required');
if (!args['racecourse-id'] || !RACECOURSES[args['racecourse-id']]) throw new Error('--racecourse-id=<known KRA racecourse> is required');

const dateCompact = args.date.replaceAll('-', '');
const racecourse = RACECOURSES[args['racecourse-id']];
const meetingId = `kra-${args['racecourse-id']}-${args.date}`;
const checkedAt = new Date().toISOString();
const endpoints = [
  { source: 'main-post', url: 'https://todayrace.kra.co.kr/main.do', method: 'POST' },
  { source: 'simple-post', url: 'https://todayrace.kra.co.kr/racing/info/selectSimpleInfoList.do', method: 'POST' },
  { source: 'info-post', url: 'https://todayrace.kra.co.kr/racing/info/selectInfoList.do', method: 'POST' },
  { source: 'weekly-start-times', url: 'https://race.kra.co.kr/thisweekrace/ThisWeekBaljuTime.do', method: 'GET' },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function stripHtml(value) {
  return String(value ?? '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function currentSeoulWeekBounds(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  const localDate = `${values.year}-${values.month}-${values.day}`;
  const dayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(values.weekday);
  const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;
  const monday = new Date(`${localDate}T00:00:00Z`);
  monday.setUTCDate(monday.getUTCDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  return { monday: monday.toISOString().slice(0, 10), sunday: sunday.toISOString().slice(0, 10) };
}

function targetWeekday(date) {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

function parseCells(rowHtml) {
  return [...String(rowHtml).matchAll(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/gi)]
    .map((match) => stripHtml(match[1]));
}

function weeklyScheduleTables(html) {
  return [...String(html).matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)]
    .map((match) => match[0])
    .filter((table) => {
      const text = stripHtml(table);
      return /시간/.test(text) && /서울/.test(text) && /(부경|부산경남)/.test(text) && /제주/.test(text);
    });
}

function parseWeeklyStartTimeRows(html, date, weeklyColumn) {
  const { monday, sunday } = currentSeoulWeekBounds();
  if (date < monday || date > sunday) return [];
  const tableIndex = WEEKDAY_TABLE_INDEX[targetWeekday(date)];
  if (tableIndex == null) return [];
  const tables = weeklyScheduleTables(html);
  const table = tables[tableIndex];
  if (!table) return [];

  const rows = [];
  for (const match of table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = parseCells(match[1]);
    if (cells.length < 4) continue;
    const hourMatch = cells[0].match(/(\d{1,2})\s*시/);
    if (!hourMatch) continue;
    const hour = Number(hourMatch[1]);
    const cell = cells[weeklyColumn] ?? '';
    for (const token of cell.matchAll(/([0-5]?\d)\s*분\s*([①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭])/g)) {
      const raceNumber = CIRCLED_RACE_NUMBER.get(token[2]);
      if (!raceNumber) continue;
      rows.push({
        race_number: raceNumber,
        post_time_local: `${String(hour).padStart(2, '0')}:${String(Number(token[1])).padStart(2, '0')}`,
        sources: ['weekly-start-times'],
      });
    }
  }
  return rows.sort((left, right) => left.race_number - right.race_number);
}

function mergeRows(baseRows, supplementalRows) {
  const merged = new Map(baseRows.map((row) => [row.race_number, structuredClone(row)]));
  for (const row of supplementalRows) {
    const prior = merged.get(row.race_number) ?? { race_number: row.race_number, sources: [] };
    merged.set(row.race_number, {
      ...prior,
      ...(prior.post_time_local ? {} : { post_time_local: row.post_time_local }),
      sources: [...new Set([...(prior.sources ?? []), ...(row.sources ?? [])])],
    });
  }
  return [...merged.values()].sort((left, right) => left.race_number - right.race_number);
}

async function fetchPage(endpoint) {
  const params = new URLSearchParams({
    rcDate: dateCompact,
    meets: racecourse.meet_code,
    meet: racecourse.meet_code,
  });
  const statuses = [];
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (attempt > 1) await sleep(750 * (attempt - 1));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          ...(endpoint.method === 'POST' ? { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' } : {}),
          'user-agent': 'WhereHorsesRun/1.0 (+https://wherehorsesrun.com; public timetable acquisition)',
          accept: 'text/html,application/xhtml+xml',
          'accept-language': 'ko-KR,ko;q=0.9,en;q=0.6',
        },
        ...(endpoint.method === 'POST' ? { body: params } : {}),
        redirect: 'follow',
        signal: controller.signal,
      });
      const html = await response.text();
      if (!response.ok) {
        statuses.push({ source: endpoint.source, attempt, status: 'http_error', http_status: response.status, body_size: html.length });
        if ((response.status === 429 || response.status >= 500) && attempt < maxAttempts) continue;
        return { source: endpoint.source, html: '', status: statuses.at(-1) };
      }
      if (html.length < 500) {
        statuses.push({ source: endpoint.source, attempt, status: 'short_response', http_status: response.status, body_size: html.length });
        if (attempt < maxAttempts) continue;
      } else {
        const status = { source: endpoint.source, attempt, status: 'success', http_status: response.status, body_size: html.length };
        return { source: endpoint.source, html, status };
      }
    } catch (error) {
      statuses.push({ source: endpoint.source, attempt, status: error?.name === 'AbortError' ? 'timeout' : 'network_error', message: String(error?.message ?? error).slice(0, 300) });
      if (attempt < maxAttempts) continue;
    } finally {
      clearTimeout(timeout);
    }
  }
  return { source: endpoint.source, html: '', status: statuses.at(-1) ?? { source: endpoint.source, status: 'network_error' } };
}

const fetched = [];
for (const endpoint of endpoints) fetched.push(await fetchPage(endpoint));
const successfulPages = fetched.filter((entry) => entry.status.status === 'success');
if (!successfulPages.length) {
  console.log(JSON.stringify({
    schema_version: 'kra-today-race-collection-v1',
    meeting_id: meetingId,
    date: args.date,
    racecourse_id: args['racecourse-id'],
    meet_code: racecourse.meet_code,
    source_statuses: fetched.map((entry) => entry.status),
    source_error: true,
    raw_html_stored: false,
  }, null, 2));
  process.exitCode = 2;
} else {
  const todayRacePages = successfulPages.filter((entry) => entry.source !== 'weekly-start-times');
  let rows = parseKraTodayRacePages(todayRacePages);
  const weeklyPage = successfulPages.find((entry) => entry.source === 'weekly-start-times');
  if (weeklyPage) rows = mergeRows(rows, parseWeeklyStartTimeRows(weeklyPage.html, args.date, racecourse.weekly_column));
  const observation = buildKraMeetingObservation({
    meetingId,
    date: args.date,
    racecourseId: args['racecourse-id'],
    meetCode: racecourse.meet_code,
    rows,
    checkedAt,
    sourceStatuses: fetched.map((entry) => entry.status),
  });
  observation.source.official_url = weeklyPage
    ? 'https://race.kra.co.kr/thisweekrace/ThisWeekBaljuTime.do'
    : observation.source.official_url;
  console.log(JSON.stringify(observation, null, 2));
}
