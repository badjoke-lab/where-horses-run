import { buildKraMeetingObservation, parseKraTodayRacePages } from './kra-todayrace-core.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  return [key, rest.join('=')];
}));

const RACECOURSES = Object.freeze({
  'seoul-racecourse': { meet_code: '1', label: 'Seoul' },
  'jeju-racecourse': { meet_code: '2', label: 'Jeju' },
  'busan-gyeongnam-racecourse': { meet_code: '3', label: 'Busan-Gyeongnam' },
});

if (!args.date || !/^\d{4}-\d{2}-\d{2}$/.test(args.date)) throw new Error('--date=YYYY-MM-DD is required');
if (!args['racecourse-id'] || !RACECOURSES[args['racecourse-id']]) throw new Error('--racecourse-id=<known KRA racecourse> is required');

const dateCompact = args.date.replaceAll('-', '');
const racecourse = RACECOURSES[args['racecourse-id']];
const meetingId = `kra-${args['racecourse-id']}-${args.date}`;
const checkedAt = new Date().toISOString();
const endpoints = [
  { source: 'main-post', url: 'https://todayrace.kra.co.kr/main.do' },
  { source: 'simple-post', url: 'https://todayrace.kra.co.kr/racing/info/selectSimpleInfoList.do' },
  { source: 'info-post', url: 'https://todayrace.kra.co.kr/racing/info/selectInfoList.do' },
];

async function fetchPage(endpoint, raceNumber = null) {
  const bodyValues = { rcDate: dateCompact, meets: racecourse.meet_code, meet: racecourse.meet_code };
  if (raceNumber != null) bodyValues.rcNo = String(raceNumber);
  const body = new URLSearchParams(bodyValues);
  const source = raceNumber == null ? endpoint.source : `${endpoint.source}:rcNo=${raceNumber}`;
  const statuses = [];
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'user-agent': 'WhereHorsesRun/1.0 (+https://wherehorsesrun.com; public timetable acquisition)',
          accept: 'text/html,application/xhtml+xml',
          'accept-language': 'ko-KR,ko;q=0.9,en;q=0.6',
        },
        body,
        redirect: 'follow',
        signal: controller.signal,
      });
      const html = await response.text();
      if (!response.ok) {
        statuses.push({ source, attempt, status: 'http_error', http_status: response.status, body_size: html.length });
        if (response.status >= 500 && attempt < 2) continue;
        return { source, html: '', status: statuses.at(-1) };
      }
      if (html.length < 500) {
        statuses.push({ source, attempt, status: 'short_response', http_status: response.status, body_size: html.length });
        if (attempt < 2) continue;
      } else {
        const status = { source, attempt, status: 'success', http_status: response.status, body_size: html.length };
        return { source, html, status };
      }
    } catch (error) {
      statuses.push({ source, attempt, status: error?.name === 'AbortError' ? 'timeout' : 'network_error', message: String(error?.message ?? error).slice(0, 300) });
      if (attempt < 2) continue;
    } finally {
      clearTimeout(timeout);
    }
  }
  return { source, html: '', status: statuses.at(-1) ?? { source, status: 'network_error' } };
}

const fetched = [];
for (const endpoint of endpoints) fetched.push(await fetchPage(endpoint));
const baseSuccessfulPages = fetched.filter((entry) => entry.status.status === 'success');
if (!baseSuccessfulPages.length) {
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
  const baseRows = parseKraTodayRacePages(baseSuccessfulPages);
  const raceNumbers = baseRows
    .map((row) => row.race_number)
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= 30)
    .sort((a, b) => a - b);

  for (const raceNumber of raceNumbers) {
    let capturedTime = false;
    for (const endpoint of [endpoints[2], endpoints[1], endpoints[0]]) {
      const detail = await fetchPage(endpoint, raceNumber);
      fetched.push(detail);
      if (detail.status.status !== 'success') continue;
      const parsed = parseKraTodayRacePages([detail]);
      const matching = parsed.find((row) => row.race_number === raceNumber);
      if (matching?.post_time_local) {
        capturedTime = true;
        break;
      }
    }
    if (!capturedTime) continue;
  }

  const successfulPages = fetched.filter((entry) => entry.status.status === 'success');
  const rows = parseKraTodayRacePages(successfulPages);
  const observation = buildKraMeetingObservation({
    meetingId,
    date: args.date,
    racecourseId: args['racecourse-id'],
    meetCode: racecourse.meet_code,
    rows,
    checkedAt,
    sourceStatuses: fetched.map((entry) => entry.status),
  });
  console.log(JSON.stringify(observation, null, 2));
}
