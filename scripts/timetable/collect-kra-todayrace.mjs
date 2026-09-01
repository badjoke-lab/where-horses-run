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
const WEEKDAY_BLOCK_INDEX = Object.freeze({
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

function decodeHtmlEntities(value) {
  return String(value ?? '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function stripHtml(value) {
  return decodeHtmlEntities(String(value ?? '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
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

function parseHourCell(value) {
  const normalized = String(value ?? '').replace(/\s+/g, ' ').trim();
  const match = normalized.match(/(?:^|\s)([01]?\d|2[0-3])\s*(?:시)?(?:\s|$)/);
  return match ? Number(match[1]) : null;
}

function weeklyHourBlocks(html) {
  const blocks = [];
  let current = [];
  for (const match of String(html).matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = parseCells(match[1]);
    const hour = cells.length >= 2 ? parseHourCell(cells[0]) : null;
    if (hour != null) {
      current.push({ cells, hour });
    } else if (current.length) {
      blocks.push(current);
      current = [];
    }
  }
  if (current.length) blocks.push(current);
  return blocks.filter((block) => block.length >= 2);
}

function targetWeeklyBlock(html, date) {
  const blockIndex = WEEKDAY_BLOCK_INDEX[targetWeekday(date)];
  return blockIndex == null ? null : (weeklyHourBlocks(html)[blockIndex] ?? null);
}

function parseWeeklyStartTimeRows(html, date, weeklyColumn) {
  const { monday, sunday } = currentSeoulWeekBounds();
  if (date < monday || date > sunday) return [];
  const block = targetWeeklyBlock(html, date);
  if (!block) return [];

  const explicitRows = [];
  const sequentialTimes = [];
  for (const { cells, hour } of block) {
    const cell = cells[weeklyColumn] ?? '';
    for (const token of cell.matchAll(/([0-5]?\d)\s*분\s*([①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭])?/g)) {
      const postTime = `${String(hour).padStart(2, '0')}:${String(Number(token[1])).padStart(2, '0')}`;
      const explicitRaceNumber = token[2] ? CIRCLED_RACE_NUMBER.get(token[2]) : null;
      if (explicitRaceNumber) {
        explicitRows.push({ race_number: explicitRaceNumber, post_time_local: postTime, sources: ['weekly-start-times'] });
      } else {
        sequentialTimes.push(postTime);
      }
    }
  }

  if (explicitRows.length) return explicitRows.sort((left, right) => left.race_number - right.race_number);
  return sequentialTimes.map((postTime, index) => ({
    race_number: index + 1,
    post_time_local: postTime,
    sources: ['weekly-start-times'],
  }));
}

function weeklyParserDiagnostics(html, date) {
  const block = targetWeeklyBlock(html, date);
  if (!block) return { block_found: false };
  return {
    block_found: true,
    rows: block.slice(0, 8).map(({ hour, cells }) => ({
      hour,
      cell_count: cells.length,
      cells: cells.map((cell) => cell.slice(0, 80)),
    })),
  };
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

function normalizeCharset(label) {
  const value = String(label ?? '').trim().toLowerCase().replace(/["']/g, '');
  if (!value) return null;
  if (['euc-kr', 'euckr', 'ks_c_5601-1987', 'ks-c-5601-1987', 'cp949', 'ms949', 'windows-949'].includes(value)) return 'euc-kr';
  if (['utf8', 'utf-8'].includes(value)) return 'utf-8';
  return value;
}

function detectCharset(response, bytes, endpoint) {
  const header = response.headers.get('content-type') ?? '';
  const headerMatch = header.match(/charset\s*=\s*([^;\s]+)/i);
  if (headerMatch) return normalizeCharset(headerMatch[1]);

  const asciiProbe = new TextDecoder('windows-1252').decode(bytes.slice(0, Math.min(bytes.length, 8192)));
  const metaMatch = asciiProbe.match(/charset\s*=\s*["']?([^"'\s;/>]+)/i);
  if (metaMatch) return normalizeCharset(metaMatch[1]);

  if (endpoint.source === 'weekly-start-times') return 'euc-kr';
  return 'utf-8';
}

function decodeResponseBody(response, bytes, endpoint) {
  const charset = detectCharset(response, bytes, endpoint) ?? 'utf-8';
  try {
    return { html: new TextDecoder(charset).decode(bytes), charset };
  } catch {
    return { html: new TextDecoder('utf-8').decode(bytes), charset: 'utf-8-fallback' };
  }
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
      const bytes = new Uint8Array(await response.arrayBuffer());
      const decoded = decodeResponseBody(response, bytes, endpoint);
      const html = decoded.html;
      if (!response.ok) {
        statuses.push({ source: endpoint.source, attempt, status: 'http_error', http_status: response.status, body_size: bytes.length, charset: decoded.charset });
        if ((response.status === 429 || response.status >= 500) && attempt < maxAttempts) continue;
        return { source: endpoint.source, html: '', status: statuses.at(-1) };
      }
      if (bytes.length < 500) {
        statuses.push({ source: endpoint.source, attempt, status: 'short_response', http_status: response.status, body_size: bytes.length, charset: decoded.charset });
        if (attempt < maxAttempts) continue;
      } else {
        const status = { source: endpoint.source, attempt, status: 'success', http_status: response.status, body_size: bytes.length, charset: decoded.charset };
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
  if (weeklyPage && args['racecourse-id'] === 'jeju-racecourse') {
    observation.weekly_parser_diagnostics = weeklyParserDiagnostics(weeklyPage.html, args.date);
  }
  console.log(JSON.stringify(observation, null, 2));
}
