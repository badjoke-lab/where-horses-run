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
  // That can mean either a genuine non-racing date or a future programme that is
  // not published yet, so it is never sufficient negative evidence by itself.
  if (response.status === 403 || response.status === 404) return { status: 'not_published', url };
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);

  const body = decodeHtml(await response.arrayBuffer());
  const meetings = parseJraProgrammePage(body, date, response.url || url);
  if (!meetings.length) throw new Error(`JRA programme page parsed zero meetings: ${url}`);
  return { status: 'ok', meetings, url: response.url || url };
}

export async function discoverJraOfficial30dWithCompleteness({ dates, fetchImpl = fetch, delayMs = 80 }) {
  const found = [];
  const successfulDates = [];
  const notPublishedDates = [];

  for (const date of dates) {
    const result = await fetchProgramme(date, fetchImpl);
    if (result.status === 'ok') {
      successfulDates.push(date);
      found.push(...result.meetings);
    } else if (result.status === 'not_published') {
      notPublishedDates.push(date);
    }
    if (delayMs) await sleep(delayMs);
  }

  if (!successfulDates.length) {
    throw new Error('JRA official 30-day discovery found no programme days; refusing to treat blanket 403/404 responses as an empty schedule');
  }

  const meetings = [...new Map(found.map((meeting) => [meeting.meeting_id, meeting])).values()];
  const sourceVisibleHorizon = successfulDates.at(-1);
  const requestedHorizon = dates.at(-1);
  const completeness = sourceVisibleHorizon === requestedHorizon ? 'complete' : 'partial';
  return {
    meetings,
    completeness: {
      source_id: 'jra-racing-calendar-programme',
      role: 'mother_set',
      requested_window: { start: dates[0], end: requestedHorizon },
      result: completeness,
      completeness,
      parsed_meeting_count: meetings.length,
      parsed_detail_count: 0,
      pending_count: notPublishedDates.filter((date) => date > sourceVisibleHorizon).length,
      failure_count: 0,
      not_published_count: notPublishedDates.length,
      not_published_dates: notPublishedDates,
      successful_programme_dates: successfulDates,
      source_visible_horizon: sourceVisibleHorizon,
      source_urls: dates.map(jraProgrammeUrl),
      failures: [],
    },
  };
}

export async function discoverJraOfficial30d(options) {
  return (await discoverJraOfficial30dWithCompleteness(options)).meetings;
}
