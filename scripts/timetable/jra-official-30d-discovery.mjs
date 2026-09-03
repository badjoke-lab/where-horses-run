import { parseJraProgrammePage } from './jra-programme-parser.mjs';

const JRA_HEADERS = {
  'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)',
  accept: 'text/html',
  'accept-language': 'ja,en;q=.7',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function jraProgrammeUrl(date) {
  const [year, month, day] = date.split('-');
  return `https://www.jra.go.jp/keiba/calendar${year}/${year}/${Number(month)}/${month}${day}.html`;
}

function decodeHtml(bytes) {
  return ['shift_jis', 'utf-8']
    .map((encoding) => new TextDecoder(encoding).decode(bytes))
    .sort((a, b) => (b.match(/[競馬発走開催]/g)?.length ?? 0) - (a.match(/[競馬発走開催]/g)?.length ?? 0))[0];
}

async function fetchProgramme(date, fetchImpl) {
  const url = jraProgrammeUrl(date);
  const response = await fetchImpl(url, {
    redirect: 'follow',
    headers: JRA_HEADERS,
  });

  // JRA returns HTTP 403 for guessed calendar dates that have no daily programme.
  // The same GitHub-hosted runner returns HTTP 200 for an existing programme page.
  if (response.status === 403 || response.status === 404) return { status: 'not_published', url };
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);

  const body = decodeHtml(await response.arrayBuffer());
  const meetings = parseJraProgrammePage(body, date, response.url || url);
  if (!meetings.length) throw new Error(`JRA programme page parsed zero meetings: ${url}`);
  return { status: 'ok', meetings };
}

export async function discoverJraOfficial30d({ dates, fetchImpl = fetch, delayMs = 80 }) {
  const found = [];
  let successfulProgrammeDays = 0;

  for (const date of dates) {
    const result = await fetchProgramme(date, fetchImpl);
    if (result.status === 'ok') {
      successfulProgrammeDays += 1;
      found.push(...result.meetings);
    }
    if (delayMs) await sleep(delayMs);
  }

  if (!successfulProgrammeDays) {
    throw new Error('JRA official 30-day discovery found no programme days; refusing to treat blanket 403/404 responses as an empty schedule');
  }

  return [...new Map(found.map((meeting) => [meeting.meeting_id, meeting])).values()];
}
