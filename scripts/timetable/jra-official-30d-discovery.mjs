import { parseJraProgrammePage } from './jra-programme-parser.mjs';

const JRA_HEADERS = {
  'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)',
  accept: 'text/html,application/json;q=.9,*/*;q=.5',
  'accept-language': 'ja,en;q=.7',
};

const JRA_VENUES = {
  '札幌': 'sapporo', '函館': 'hakodate', '福島': 'fukushima', '新潟': 'niigata', '東京': 'tokyo',
  '中山': 'nakayama', '中京': 'chukyo', '京都': 'kyoto', '阪神': 'hanshin', '小倉': 'kokura',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function jraProgrammeUrl(date) {
  const [year, month, day] = date.split('-');
  return `https://www.jra.go.jp/keiba/calendar${year}/${year}/${Number(month)}/${month}${day}.html`;
}

export function jraCalendarJsonUrl(date) {
  const [year, month] = String(date).split('-');
  return `https://www.jra.go.jp/keiba/common/calendar/json/${year}${month}.json`;
}

function isoDate(year, month, day) {
  const value = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? null : value;
}

function decodeHtml(bytes) {
  return ['shift_jis', 'utf-8']
    .map((encoding) => new TextDecoder(encoding).decode(bytes))
    .sort((a, b) => (b.match(/[競馬発走開催]/g)?.length ?? 0) - (a.match(/[競馬発走開催]/g)?.length ?? 0))[0];
}

function calendarMeeting(venueJa, date, sourceUrl) {
  const venue = JRA_VENUES[venueJa];
  if (!venue) throw new Error(`unknown JRA calendar venue: ${venueJa}`);
  return {
    meeting_id: `jra-${venue}-racecourse-${date}`,
    date,
    authority_id: 'jra',
    racing_system_id: 'japan-jra-system',
    racecourse_id: `${venue}-racecourse`,
    venue_ja: venueJa,
    source_id: 'jra-racing-calendar-programme',
    source_label: 'Japan Racing Association',
    official_source_url: sourceUrl,
    programme_rows: [],
  };
}

export function parseJraCalendarMonthJson(payload, { year, month, allowedDates, sourceUrl }) {
  if (!Array.isArray(payload) || payload.length !== 1 || typeof payload[0] !== 'object' || payload[0] === null) {
    return { structural_valid: false, meetings: [], racing_dates: [], calendar_dates: [] };
  }
  const root = payload[0];
  if (String(root.month) !== String(Number(month)) || !Array.isArray(root.data)) {
    return { structural_valid: false, meetings: [], racing_dates: [], calendar_dates: [] };
  }

  const allowed = new Set(allowedDates);
  const seenDates = new Set();
  const meetings = [];
  let structuralValid = true;

  for (const day of root.data) {
    if (!day || typeof day !== 'object' || !/^\d{1,2}$/.test(String(day.date ?? '')) || !Array.isArray(day.info)) {
      structuralValid = false;
      continue;
    }
    const date = isoDate(year, month, Number(day.date));
    if (!date || seenDates.has(date)) {
      structuralValid = false;
      continue;
    }
    seenDates.add(date);

    for (const info of day.info) {
      if (!info || typeof info !== 'object') {
        structuralValid = false;
        continue;
      }
      const races = info.race == null ? [] : info.race;
      if (!Array.isArray(races)) {
        structuralValid = false;
        continue;
      }
      for (const race of races) {
        const name = String(race?.name ?? '').trim();
        const venueMatch = name.match(/\d+回(札幌|函館|福島|新潟|東京|中山|中京|京都|阪神|小倉)(?:競馬)?$/);
        if (!venueMatch) {
          structuralValid = false;
          continue;
        }
        if (allowed.has(date)) meetings.push(calendarMeeting(venueMatch[1], date, sourceUrl));
      }
    }
  }

  const deduped = [...new Map(meetings.map((meeting) => [meeting.meeting_id, meeting])).values()];
  return {
    structural_valid: structuralValid,
    meetings: deduped,
    racing_dates: [...new Set(deduped.map((meeting) => meeting.date))].sort(),
    calendar_dates: [...seenDates].sort(),
  };
}

async function fetchCalendarMonth(url, fetchImpl) {
  const response = await fetchImpl(url, { redirect: 'follow', headers: JRA_HEADERS });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  const finalUrl = new URL(response.url || url);
  if (finalUrl.protocol !== 'https:' || finalUrl.hostname !== 'www.jra.go.jp') {
    throw new Error(`unexpected JRA calendar redirect: ${finalUrl.toString()}`);
  }
  let payload;
  try {
    payload = JSON.parse(await response.text());
  } catch (error) {
    throw new Error(`invalid JRA calendar JSON: ${finalUrl.toString()}: ${String(error?.message ?? error)}`);
  }
  return { payload, url: finalUrl.toString() };
}

async function fetchProgramme(date, fetchImpl) {
  const url = jraProgrammeUrl(date);
  const response = await fetchImpl(url, {
    redirect: 'follow',
    headers: JRA_HEADERS,
  });

  // Daily programme pages are supplementary detail evidence. The official monthly
  // calendar JSON is the mother-set classifier, so an unavailable programme does
  // not negate a meeting already scheduled by the calendar.
  if (response.status === 403 || response.status === 404) return { status: 'not_published', url };
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);

  const body = decodeHtml(await response.arrayBuffer());
  const meetings = parseJraProgrammePage(body, date, response.url || url);
  if (!meetings.length) throw new Error(`JRA programme page parsed zero meetings: ${url}`);
  return { status: 'ok', meetings, url: response.url || url };
}

export async function discoverJraOfficial30dWithCompleteness({ dates, fetchImpl = fetch, delayMs = 80 }) {
  if (!Array.isArray(dates) || !dates.length) throw new Error('JRA official discovery requires dates');
  const allowed = new Set(dates);
  const calendarUrls = [...new Set(dates.map(jraCalendarJsonUrl))];
  const calendarMeetings = [];
  const calendarFailures = [];
  const calendarDiagnostics = [];

  for (const sourceUrl of calendarUrls) {
    const match = sourceUrl.match(/\/(\d{4})(\d{2})\.json$/);
    if (!match) throw new Error(`unexpected JRA calendar URL: ${sourceUrl}`);
    const year = Number(match[1]);
    const month = Number(match[2]);
    const allowedDates = dates.filter((date) => date.startsWith(`${match[1]}-${match[2]}`));
    try {
      const page = await fetchCalendarMonth(sourceUrl, fetchImpl);
      const parsed = parseJraCalendarMonthJson(page.payload, { year, month, allowedDates, sourceUrl: page.url });
      if (!parsed.structural_valid) {
        calendarFailures.push({ source_url: page.url, reason: 'calendar_json_structure_incomplete' });
      }
      calendarMeetings.push(...parsed.meetings);
      calendarDiagnostics.push({
        source_url: page.url,
        year,
        month,
        structural_valid: parsed.structural_valid,
        calendar_date_count: parsed.calendar_dates.length,
        racing_date_count: parsed.racing_dates.length,
        meeting_count: parsed.meetings.length,
      });
    } catch (error) {
      calendarFailures.push({ source_url: sourceUrl, reason: String(error?.message ?? error) });
      calendarDiagnostics.push({ source_url: sourceUrl, year, month, structural_valid: false });
    }
  }

  const calendarComplete = calendarFailures.length === 0 && calendarDiagnostics.length === calendarUrls.length
    && calendarDiagnostics.every((row) => row.structural_valid === true);
  // A structurally complete official calendar may legitimately prove that a short
  // requested window contains no JRA meetings. That empty set is authoritative
  // negative evidence, not a discovery failure. Only an incomplete calendar with
  // no positive meeting evidence remains a hard failure.
  if (!calendarMeetings.length && !calendarComplete) {
    throw new Error('JRA official calendar JSON discovery incomplete with no meetings in the requested window');
  }

  const meetingMap = new Map(calendarMeetings.map((meeting) => [meeting.meeting_id, meeting]));
  const scheduledDates = [...new Set(calendarMeetings.map((meeting) => meeting.date))].filter((date) => allowed.has(date)).sort();
  const successfulProgrammeDates = [];
  const programmeNotPublishedDates = [];
  const programmeFailures = [];

  for (const date of scheduledDates) {
    try {
      const result = await fetchProgramme(date, fetchImpl);
      if (result.status === 'ok') {
        successfulProgrammeDates.push(date);
        for (const meeting of result.meetings) {
          if (!meetingMap.has(meeting.meeting_id)) {
            programmeFailures.push({ source_url: result.url, reason: `programme_meeting_not_in_calendar:${meeting.meeting_id}` });
            continue;
          }
          meetingMap.set(meeting.meeting_id, meeting);
        }
      } else {
        programmeNotPublishedDates.push(date);
      }
    } catch (error) {
      programmeFailures.push({ source_url: jraProgrammeUrl(date), reason: String(error?.message ?? error) });
    }
    if (delayMs) await sleep(delayMs);
  }

  const meetings = [...meetingMap.values()].sort((a, b) => a.date.localeCompare(b.date) || a.meeting_id.localeCompare(b.meeting_id));
  const completeness = calendarComplete ? 'complete' : calendarDiagnostics.some((row) => row.structural_valid) ? 'partial' : 'failed';
  return {
    meetings,
    completeness: {
      source_id: 'jra-racing-calendar-programme',
      role: 'mother_set',
      requested_window: { start: dates[0], end: dates.at(-1) },
      result: completeness,
      completeness,
      parsed_meeting_count: meetings.length,
      parsed_detail_count: meetings.filter((meeting) => (meeting.programme_rows?.length ?? 0) > 0).length,
      pending_count: 0,
      failure_count: calendarFailures.length,
      source_visible_horizon: dates.at(-1),
      source_urls: calendarUrls,
      calendar_source_urls: calendarUrls,
      calendar_diagnostics: calendarDiagnostics,
      successful_programme_dates: successfulProgrammeDates,
      programme_not_published_count: programmeNotPublishedDates.length,
      programme_not_published_dates: programmeNotPublishedDates,
      programme_failure_count: programmeFailures.length,
      programme_failures: programmeFailures,
      programme_source_urls: scheduledDates.map(jraProgrammeUrl),
      failures: calendarFailures,
    },
  };
}

export async function discoverJraOfficial30d(options) {
  return (await discoverJraOfficial30dWithCompleteness(options)).meetings;
}
