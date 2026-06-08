import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const configPath = path.join(root, 'data/sources/timetable/hkjc-racecard-route.json');
const outputPath = path.join(root, 'data/generated/timetable/hkjc-racecard-source-snapshot.json');
const reportPath = path.join(root, 'data/generated/timetable/hkjc-refresh-report.json');
const timeoutMs = 15000;
const maxRaceNumber = 14;
const defaultLocale = 'en-us';

const reportStatus = {
  A_PLUS_READY: 'a_plus_ready',
  BLOCKED_OR_BOT_PAGE: 'blocked_or_bot_page',
  EMPTY_RESPONSE: 'empty_response',
  FIXTURE_FOUND: 'fixture_found',
  HTTP_STATUS_ERROR: 'http_status_error',
  NETWORK_ERROR: 'network_error',
  NO_RACE_STOP_CANDIDATE: 'no_race_stop_candidate',
  PARSER_FAILED: 'parser_failed',
  RACECARD_NOT_PUBLISHED: 'racecard_not_published',
  REDIRECT_UNEXPECTED: 'redirect_unexpected',
  UNSUPPORTED_PAGE_STRUCTURE: 'unsupported_page_structure',
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function parseArgs(argv) {
  const args = Object.fromEntries(argv.map((arg) => {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    return match ? [match[1], match[2]] : [arg.replace(/^--/, ''), true];
  }));

  if (args.from || args.to) {
    if (!args.from || !args.to) throw new Error('--from and --to must be provided together.');
    return { from: args.from, to: args.to, mode: 'range' };
  }

  if (args.month) {
    const [year, month] = String(args.month).split('-').map(Number);
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return { from: `${args.month}-01`, to: `${args.month}-${String(lastDay).padStart(2, '0')}`, mode: 'month' };
  }

  if (args['window-days']) {
    const days = Number(args['window-days']);
    if (!Number.isInteger(days) || days < 1) throw new Error('--window-days must be a positive integer.');
    const start = new Date();
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + days - 1);
    return { from: isoDate(start), to: isoDate(end), mode: 'window-days' };
  }

  return null;
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function assertDate(value, name) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${name} must use YYYY-MM-DD.`);
}

function enumerateMonths(from, to) {
  const [startYear, startMonth] = from.split('-').map(Number);
  const [endYear, endMonth] = to.split('-').map(Number);
  const months = [];
  let year = startYear;
  let month = startMonth;
  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push({ year, month });
    month += 1;
    if (month === 13) {
      year += 1;
      month = 1;
    }
  }
  return months;
}

function formatDateParts(date) {
  const [yyyy, mm, dd] = date.split('-');
  return { yyyy, mm, dd };
}

function hkjcRaceDate(date) {
  const { yyyy, mm, dd } = formatDateParts(date);
  return `${yyyy}/${mm}/${dd}`;
}

function racecourseCode(meeting) {
  if (meeting.racecourse_code) return String(meeting.racecourse_code).toUpperCase();
  if (meeting.fixture_code) return String(meeting.fixture_code).toUpperCase();
  if (meeting.racecourse_id === 'happy-valley-racecourse' || meeting.racecourse_name === 'Happy Valley') return 'HV';
  if (meeting.racecourse_id === 'sha-tin-racecourse' || meeting.racecourse_name === 'Sha Tin') return 'ST';
  throw new Error(`Unsupported HKJC racecourse: ${meeting.racecourse_id ?? meeting.racecourse_name ?? 'unknown'}`);
}

function hkjcLocale(locale = defaultLocale) {
  const normalized = String(locale).toLowerCase();
  if (normalized === 'zh-hk' || normalized === 'zh-cn') return normalized;
  return 'en-us';
}

function racecourseName(code) {
  return String(code).toUpperCase() === 'HV' ? 'Happy Valley' : 'Sha Tin';
}

function racecourseSlug(name) {
  if (name === 'Sha Tin') return 'sha-tin-racecourse';
  if (name === 'Happy Valley') return 'happy-valley-racecourse';
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-racecourse`;
}

function sessionType(token) {
  const value = String(token ?? '').toUpperCase();
  if (value === 'N') return 'night';
  if (value === 'T') return 'twilight';
  if (value === 'D') return 'day';
  return 'unknown';
}

function localRacecardUrl({ meeting, raceNumber, locale = defaultLocale }) {
  return `https://racing.hkjc.com/${hkjcLocale(locale)}/local/information/racecard?racedate=${hkjcRaceDate(meeting.meeting_date)}&Racecourse=${racecourseCode(meeting)}&RaceNo=${raceNumber}`;
}

function legacyRacecardUrl({ meeting, raceNumber }) {
  const params = new URLSearchParams({
    RaceDate: hkjcRaceDate(meeting.meeting_date),
    Racecourse: racecourseCode(meeting),
    RaceNo: String(raceNumber),
  });
  return `https://racing.hkjc.com/racing/information/English/Racing/RaceCard.aspx?${params.toString()}`;
}

function racecardUrl(config, meeting, raceNumber, locale = defaultLocale) {
  const template = config.official_sources?.racecard_url_template;
  if (!template) return localRacecardUrl({ meeting, raceNumber, locale });
  const { yyyy, mm, dd } = formatDateParts(meeting.meeting_date);
  return template
    .replace('{race_number}', String(raceNumber))
    .replace('{racecourse_code}', racecourseCode(meeting))
    .replace('{fixture_code}', racecourseCode(meeting))
    .replace('{locale}', hkjcLocale(locale))
    .replace('{race_date}', hkjcRaceDate(meeting.meeting_date))
    .replace('{yyyy}', yyyy)
    .replace('{mm}', mm)
    .replace('{dd}', dd);
}

function racecardUrlCandidates({ config, meeting, raceNumber, locale = defaultLocale }) {
  return [...new Set([
    racecardUrl(config, meeting, raceNumber, locale),
    localRacecardUrl({ meeting, raceNumber, locale }),
    legacyRacecardUrl({ meeting, raceNumber }),
  ])];
}

function fixtureUrl(month) {
  return `https://racing.hkjc.com/en-us/local/information/fixture?CalMonth=${String(month.month).padStart(2, '0')}&CalYear=${month.year}`;
}

function decodeEntities(value) {
  return String(value ?? '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x2F;|&#47;/gi, '/')
    .replace(/&#x3A;|&#58;/gi, ':');
}

function stripHtml(value) {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|span|td|tr|p|li|h[1-6])>/gi, '\n')
    .replace(/<img\b[^>]*(?:alt|title)=["']?([^"'>]+)["']?[^>]*>/gi, ' Image: $1 ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n+/g, '\n')
    .trim();
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function parseFixtureHtml(html, month, sourceUrl) {
  const text = stripHtml(html);
  const meetings = [];
  const pattern = /(?:^|\s|\|)(\d{1,2})\s+Image:\s*(ST|HV)\s+Image:\s*([DTN])\b/gi;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const day = Number(match[1]);
    const code = match[2].toUpperCase();
    const date = `${month.year}-${String(month.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const name = racecourseName(code);
    meetings.push({
      meeting_date: date,
      racecourse_name: name,
      racecourse_id: racecourseSlug(name),
      racecourse_code: code,
      fixture_code: code,
      session_type: sessionType(match[3]),
      official_fixture_url: sourceUrl,
    });
  }
  return meetings;
}

function classifyBody(body) {
  const text = stripHtml(body);
  if (!body || text.length === 0) return { status: reportStatus.EMPTY_RESPONSE, reason: 'Official response body was empty.' };
  if (/access\s*denied|captcha|robot|bot|forbidden|temporarily unavailable|akamai|request blocked/i.test(text)) {
    return { status: reportStatus.BLOCKED_OR_BOT_PAGE, reason: 'Official response appears to be an access-control or bot-protection page.' };
  }
  if (/No race card|not available|not yet available|will be available|Race Card is not available/i.test(text)) {
    return { status: reportStatus.RACECARD_NOT_PUBLISHED, reason: 'Official page indicates the racecard is not published yet.' };
  }
  return null;
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'user-agent': 'Mozilla/5.0',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
      },
    });
    const body = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      body,
      final_url: response.url,
      content_type: response.headers.get('content-type'),
      body_size: Buffer.byteLength(body, 'utf8'),
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      body: '',
      final_url: url,
      content_type: null,
      body_size: 0,
      network_error: String(error?.cause?.code ?? error?.message ?? error),
      network_error_detail: String(error?.cause?.message ?? error?.message ?? error),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchOfficialPage(url, expectedHost = 'racing.hkjc.com') {
  const result = await fetchWithTimeout(url);
  if (result.network_error) {
    return {
      ...result,
      failure_status: reportStatus.NETWORK_ERROR,
      failure_reason: `Network error while requesting HKJC official page: ${result.network_error_detail ?? result.network_error}`,
    };
  }
  if (!result.ok) {
    if ([401, 403, 429].includes(result.status)) {
      return { ...result, failure_status: reportStatus.BLOCKED_OR_BOT_PAGE, failure_reason: `Official host returned access-control HTTP ${result.status}` };
    }
    return { ...result, failure_status: reportStatus.HTTP_STATUS_ERROR, failure_reason: `HTTP ${result.status}` };
  }
  const finalHost = new URL(result.final_url).hostname.toLowerCase();
  if (finalHost !== expectedHost) {
    return { ...result, failure_status: reportStatus.REDIRECT_UNEXPECTED, failure_reason: `Unexpected redirect to ${result.final_url}` };
  }
  const bodyClassification = classifyBody(result.body);
  if (bodyClassification) return { ...result, failure_status: bodyClassification.status, failure_reason: bodyClassification.reason };
  return result;
}

async function fetchFixtureMeetings(config, range) {
  if (!range) return config.meetings ?? [];
  assertDate(range.from, '--from');
  assertDate(range.to, '--to');
  if (range.from > range.to) throw new Error('--from must be on or before --to.');

  const meetings = [];
  const failures = [];
  for (const month of enumerateMonths(range.from, range.to)) {
    const url = fixtureUrl(month);
    const result = await fetchOfficialPage(url);
    if (result.failure_status) {
      failures.push({
        url,
        status: result.failure_status,
        failure_reason: result.failure_reason,
        http_status: result.status,
        final_url: result.final_url,
        content_type: result.content_type,
        body_size: result.body_size,
        network_error: result.network_error ?? null,
        network_error_detail: result.network_error_detail ?? null,
      });
      continue;
    }
    meetings.push(...parseFixtureHtml(result.body, month, url));
  }

  if (failures.length > 0) {
    const fallbackSource = config.known_meetings ?? config.meetings ?? [];
    const fallback = fallbackSource.filter((meeting) => meeting.meeting_date >= range.from && meeting.meeting_date <= range.to);
    if (fallback.length === 0) {
      throw new Error(`Unable to fetch HKJC fixture and no route-config fallback exists for ${range.from}..${range.to}: ${failures.map((f) => `${f.url} ${f.status} ${f.failure_reason}`).join('; ')}`);
    }
    return fallback.map((meeting) => ({
      ...meeting,
      racecourse_code: racecourseCode(meeting),
      fixture_code: racecourseCode(meeting),
      official_fixture_url: meeting.official_fixture_url ?? config.official_sources.fixture_source_url,
      fixture_fetch_warning: failures,
    }));
  }

  return meetings
    .filter((meeting) => meeting.meeting_date >= range.from && meeting.meeting_date <= range.to)
    .sort((left, right) => `${left.meeting_date}:${left.fixture_code}`.localeCompare(`${right.meeting_date}:${right.fixture_code}`));
}

function extractRaceName(text, raceNumber) {
  const specific = text.match(new RegExp(`Race\\s*${raceNumber}\\s*[-–—:]\\s*([^\\n]+)`, 'i'));
  if (specific?.[1]) return normalizeText(specific[1]).toUpperCase();
  const collapsed = normalizeText(text);
  const fallback = collapsed.match(new RegExp(`Race\\s*${raceNumber}\\s*[-–—:]\\s*(.+?)(?=\\s+(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\\s+[A-Za-z]+\\s+\\d{1,2},\\s+\\d{4}|\\s+(?:Turf|All Weather Track|All Weather|Dirt),|$)`, 'i'));
  return fallback?.[1] ? normalizeText(fallback[1]).toUpperCase() : null;
}

function extractPostTime(text) {
  const match = text.match(/(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+[A-Za-z]+\s+\d{1,2},\s+\d{4},\s+[^,\n]+,\s+(\d{1,2}:\d{2})/i);
  return match?.[1] ?? null;
}

function extractSurfaceCourseDistance(text) {
  const surfaceLine = text.match(/\b(Turf|All Weather Track|All Weather|Dirt)\b,\s*"?([ABC](?:\+\d+)?)"?\s+Course,\s*(\d{3,4})M/i);
  if (surfaceLine) {
    return {
      surface: surfaceLine[1] === 'All Weather' ? 'All Weather Track' : surfaceLine[1],
      course_label: `${surfaceLine[2].toUpperCase()} Course`,
      distance_m: Number(surfaceLine[3]),
    };
  }

  const distance = text.match(/\b(\d{3,4})M\b/i);
  const surface = text.match(/\b(Turf|All Weather Track|All Weather|Dirt)\b/i);
  const course = text.match(/"?([ABC](?:\+\d+)?)"?\s+Course/i);
  return {
    surface: surface?.[1] ? (surface[1] === 'All Weather' ? 'All Weather Track' : surface[1]) : null,
    course_label: course?.[1] ? `${course[1].toUpperCase()} Course` : null,
    distance_m: distance?.[1] ? Number(distance[1]) : null,
  };
}

function missingAPlusFields(observation) {
  const missing = [];
  if (!observation.race_time_local) missing.push('post_time_local');
  if (!observation.race_name) missing.push('race_name');
  if (observation.distance_m == null) missing.push('distance_m');
  if (!observation.surface && !observation.course_label) missing.push('surface_or_course_label');
  return missing;
}

function isNoRaceStopCandidate(observation) {
  return !observation.race_time_local
    && !observation.race_name
    && observation.distance_m == null
    && !observation.surface
    && !observation.course_label;
}

function extractPublicSafeObservation(html, config, meeting, raceNumber, sourceUrl) {
  const text = stripHtml(html);
  const surfaceCourseDistance = extractSurfaceCourseDistance(text);
  const observation = {
    race_number: raceNumber,
    source_url: sourceUrl ?? racecardUrl(config, meeting, raceNumber),
    fetch_status: 'fetched_no_time',
    race_time_local: extractPostTime(text),
    race_name: extractRaceName(text, raceNumber),
    distance_m: surfaceCourseDistance.distance_m,
    surface: surfaceCourseDistance.surface,
    course_label: surfaceCourseDistance.course_label,
    metadata_status: 'pending',
    missing_fields: [],
    public_safe_text_sample: null,
  };
  observation.missing_fields = missingAPlusFields(observation);
  observation.metadata_status = observation.missing_fields.length === 0 ? 'verified' : observation.race_time_local ? 'partial' : 'pending';
  observation.fetch_status = observation.race_time_local ? 'time_extracted' : 'fetched_no_time';
  observation.public_safe_text_sample = observation.race_time_local ? `${meeting.meeting_date} ${meeting.racecourse_name} Race ${raceNumber} ${observation.race_time_local}` : null;
  return observation;
}

function reportRow({ meeting, raceNumber, fields, sourceUrl, reason, status, httpStatus = null, attempts = [] }) {
  const lastAttempt = attempts.at(-1) ?? {};
  return {
    meeting_date: meeting.meeting_date,
    racecourse_id: meeting.racecourse_id,
    racecourse_code: racecourseCode(meeting),
    race_number: raceNumber,
    official_source_url: sourceUrl,
    attempted_urls: attempts.map((attempt) => attempt.url).filter(Boolean),
    http_status: httpStatus,
    final_url: lastAttempt.final_url ?? null,
    content_type: lastAttempt.content_type ?? null,
    body_size: lastAttempt.body_size ?? null,
    failure_status: status,
    failure_reason: reason,
    network_error: lastAttempt.network_error ?? null,
    network_error_detail: lastAttempt.network_error_detail ?? null,
    missing_fields: fields,
    status,
  };
}

async function fetchRacecardObservation(config, meeting, raceNumber, locale = defaultLocale) {
  const uniqueCandidates = racecardUrlCandidates({ config, meeting, raceNumber, locale });
  const attempts = [];
  for (const url of uniqueCandidates) {
    const result = await fetchOfficialPage(url);
    attempts.push({
      url,
      status: result.failure_status ?? 'fetched',
      failure_reason: result.failure_reason ?? null,
      http_status: result.status,
      final_url: result.final_url,
      content_type: result.content_type,
      body_size: result.body_size,
      network_error: result.network_error ?? null,
      network_error_detail: result.network_error_detail ?? null,
    });

    if (result.failure_status) {
      if (result.failure_status === reportStatus.HTTP_STATUS_ERROR && result.status === 404) break;
      continue;
    }

    const observation = extractPublicSafeObservation(result.body, config, meeting, raceNumber, url);
    const missing = missingAPlusFields(observation);
    return { observation, attempts, http_status: result.status, missing_fields: missing };
  }

  const lastAttempt = attempts.at(-1) ?? { url: uniqueCandidates[0], status: reportStatus.NETWORK_ERROR, failure_reason: 'No fetch attempt completed.', http_status: null };
  return {
    attempts,
    failure_status: lastAttempt.status,
    failure_reason: lastAttempt.failure_reason,
    http_status: lastAttempt.http_status,
  };
}

async function fetchMeetingRaces(config, meeting, reportRows) {
  const races = [];
  for (let raceNumber = 1; raceNumber <= (config.max_race_number_to_probe ?? maxRaceNumber); raceNumber += 1) {
    const sourceUrl = racecardUrl(config, meeting, raceNumber);
    const result = await fetchRacecardObservation(config, meeting, raceNumber);

    if (result.failure_status) {
      reportRows.push(reportRow({
        meeting,
        raceNumber,
        fields: ['post_time_local', 'race_name', 'distance_m', 'surface_or_course_label'],
        sourceUrl,
        reason: result.failure_reason,
        status: result.failure_status,
        httpStatus: result.http_status,
        attempts: result.attempts ?? [],
      }));
      break;
    }

    const observation = result.observation;
    const missing = missingAPlusFields(observation);

    if (isNoRaceStopCandidate(observation) && races.length > 0) {
      reportRows.push(reportRow({
        meeting,
        raceNumber,
        fields: [],
        sourceUrl,
        reason: `Race ${raceNumber} returned no public-safe racecard fields after contiguous Race 1..${races.length}; stop probing this meeting.`,
        status: reportStatus.NO_RACE_STOP_CANDIDATE,
        httpStatus: result.http_status,
        attempts: result.attempts ?? [],
      }));
      break;
    }

    if (isNoRaceStopCandidate(observation)) {
      reportRows.push(reportRow({
        meeting,
        raceNumber,
        fields: ['post_time_local', 'race_name', 'distance_m', 'surface_or_course_label'],
        sourceUrl,
        reason: 'Race 1 had no public-safe racecard fields; racecard may be unpublished or parser may need review.',
        status: reportStatus.RACECARD_NOT_PUBLISHED,
        httpStatus: result.http_status,
        attempts: result.attempts ?? [],
      }));
      break;
    }

    races.push(observation);

    if (missing.length > 0) {
      reportRows.push(reportRow({
        meeting,
        raceNumber,
        fields: missing,
        sourceUrl,
        reason: 'Required A+ public-safe metadata was not extractable.',
        status: reportStatus.PARSER_FAILED,
        httpStatus: result.http_status,
        attempts: result.attempts ?? [],
      }));
    }
  }

  if (races.length > 0) {
    const meetingReady = races.every((race) => missingAPlusFields(race).length === 0);
    reportRows.push(reportRow({
      meeting,
      raceNumber: null,
      fields: [],
      sourceUrl: racecardUrl(config, meeting, 1),
      reason: `Fetched contiguous Race 1..${races.length}.`,
      status: meetingReady ? reportStatus.A_PLUS_READY : reportStatus.FIXTURE_FOUND,
      httpStatus: 200,
      attempts: [],
    }));
  }

  return races;
}

function summarizeReport(meetings, reportRows) {
  const meetingKey = (row) => `${row.meeting_date}:${row.racecourse_id}`;
  const byStatus = (statuses) => [...new Set(reportRows.filter((row) => statuses.includes(row.status)).map(meetingKey))].sort();
  return {
    pending_meetings: byStatus([reportStatus.RACECARD_NOT_PUBLISHED, reportStatus.HTTP_STATUS_ERROR, reportStatus.NETWORK_ERROR, reportStatus.BLOCKED_OR_BOT_PAGE, reportStatus.EMPTY_RESPONSE, reportStatus.REDIRECT_UNEXPECTED]),
    missing_meetings: byStatus([reportStatus.PARSER_FAILED, reportStatus.UNSUPPORTED_PAGE_STRUCTURE]),
    parser_failed_meetings: byStatus([reportStatus.PARSER_FAILED, reportStatus.UNSUPPORTED_PAGE_STRUCTURE]),
    a_plus_ready_meetings: byStatus([reportStatus.A_PLUS_READY]),
    stopped_probe_meetings: byStatus([reportStatus.NO_RACE_STOP_CANDIDATE]),
    untouched_fixture_meetings: meetings
      .map((meeting) => `${meeting.meeting_date}:${meeting.racecourse_id}`)
      .filter((key) => !reportRows.some((row) => meetingKey(row) === key))
      .sort(),
  };
}

const range = parseArgs(process.argv.slice(2));
const config = readJson(configPath);
const fetchedAt = new Date().toISOString();
const meetings = await fetchFixtureMeetings(config, range);
const reportRows = [];
const observations = [];

for (const meeting of meetings) {
  const normalizedMeeting = {
    ...meeting,
    racecourse_code: racecourseCode(meeting),
    fixture_code: racecourseCode(meeting),
  };
  const races = await fetchMeetingRaces(config, normalizedMeeting, reportRows);
  observations.push({
    meeting_date: normalizedMeeting.meeting_date,
    racecourse_id: normalizedMeeting.racecourse_id,
    racecourse_name: normalizedMeeting.racecourse_name,
    racecourse_code: racecourseCode(normalizedMeeting),
    fixture_code: racecourseCode(normalizedMeeting),
    session_type: normalizedMeeting.session_type,
    official_fixture_url: normalizedMeeting.official_fixture_url,
    races,
  });
}

const existingKnownMeetings = config.known_meetings ?? config.meetings ?? [];
const knownMeetingMap = new Map(existingKnownMeetings.map((meeting) => [`${meeting.meeting_date}:${racecourseCode(meeting)}`, meeting]));
for (const meeting of meetings) {
  knownMeetingMap.set(`${meeting.meeting_date}:${racecourseCode(meeting)}`, {
    ...meeting,
    racecourse_code: racecourseCode(meeting),
    fixture_code: racecourseCode(meeting),
  });
}
const known_meetings = [...knownMeetingMap.values()].sort((left, right) => `${left.meeting_date}:${racecourseCode(left)}`.localeCompare(`${right.meeting_date}:${racecourseCode(right)}`));

const nextConfig = {
  ...config,
  rolling_refresh: true,
  refresh_window: range ? { from: range.from, to: range.to, mode: range.mode } : config.refresh_window ?? null,
  official_sources: {
    ...config.official_sources,
    fixture_source_url: range ? `HKJC official fixture pages for ${range.from}..${range.to}` : config.official_sources.fixture_source_url,
    racecard_url_template: 'https://racing.hkjc.com/{locale}/local/information/racecard?racedate={race_date}&Racecourse={racecourse_code}&RaceNo={race_number}',
  },
  meetings: meetings.map((meeting) => ({
    ...meeting,
    racecourse_code: racecourseCode(meeting),
    fixture_code: racecourseCode(meeting),
  })),
  known_meetings,
  max_race_number_to_probe: config.max_race_number_to_probe ?? maxRaceNumber,
};
delete nextConfig.month;
delete nextConfig.race_numbers_to_probe;
delete nextConfig.smoke_targets;
writeJson(configPath, nextConfig);

writeJson(outputPath, {
  schema_version: 'hkjc-racecard-source-snapshot-v0',
  generated_at: fetchedAt,
  country_id: config.country_id,
  authority_id: config.authority_id,
  timezone: config.timezone,
  source_config: 'data/sources/timetable/hkjc-racecard-route.json',
  storage_policy: 'public_safe_extracted_fields_only_no_raw_html',
  official_source_url_template: nextConfig.official_sources.racecard_url_template,
  refresh_window: range,
  observations,
});

writeJson(reportPath, {
  schema_version: 'hkjc-refresh-report-v0',
  generated_at: fetchedAt,
  refresh_window: range,
  fixture_meeting_count: meetings.length,
  statuses: reportRows,
  ...summarizeReport(meetings, reportRows),
});

console.log(`[fetch-hkjc-racecards] wrote ${path.relative(root, outputPath)} fixture_meetings=${meetings.length}`);
