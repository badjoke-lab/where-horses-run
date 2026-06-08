import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const configPath = path.join(root, 'data/sources/timetable/hkjc-racecard-route.json');
const outputPath = path.join(root, 'data/generated/timetable/hkjc-racecard-source-snapshot.json');
const reportPath = path.join(root, 'data/generated/timetable/hkjc-refresh-report.json');
const timeoutMs = 15000;
const maxRaceNumber = 14;

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
    if (month === 13) { year += 1; month = 1; }
  }
  return months;
}

function formatDateParts(date) {
  const [yyyy, mm, dd] = date.split('-');
  return { yyyy, mm, dd };
}

function racecardUrl(template, meeting, raceNumber) {
  const { yyyy, mm, dd } = formatDateParts(meeting.meeting_date);
  return template
    .replace('{race_number}', String(raceNumber))
    .replace('{fixture_code}', meeting.fixture_code)
    .replace('{yyyy}', yyyy)
    .replace('{mm}', mm)
    .replace('{dd}', dd);
}

function fixtureUrl(month) {
  return `https://racing.hkjc.com/en-us/local/information/fixture?calmonth=${String(month.month).padStart(2, '0')}&calyear=${month.year}`;
}

function decodeEntities(value) {
  return value
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
    .replace(/<img\b[^>]*(?:alt|title)=["']?([^"'>]+)["']?[^>]*>/gi, ' Image: $1 ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
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

function parseFixtureHtml(html, month, sourceUrl) {
  const text = stripHtml(html);
  const meetings = [];
  const pattern = /(?:^|\s|\|)(\d{1,2})\s+Image:\s*(ST|HV)\s+Image:\s*([DTN])\b/gi;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const day = Number(match[1]);
    const code = match[2].toUpperCase();
    const date = `${month.year}-${String(month.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const racecourseName = code === 'ST' ? 'Sha Tin' : 'Happy Valley';
    meetings.push({
      meeting_date: date,
      racecourse_name: racecourseName,
      racecourse_id: racecourseSlug(racecourseName),
      fixture_code: code,
      session_type: sessionType(match[3]),
      official_fixture_url: sourceUrl,
    });
  }
  return meetings;
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'WhereHorsesRunBot/0.1 (+https://wherehorsesrun.com; public-safe timetable source verification)',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    const body = await response.text();
    return { ok: response.ok, status: response.status, body };
  } finally {
    clearTimeout(timer);
  }
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
    try {
      const result = await fetchWithTimeout(url);
      if (!result.ok) throw new Error(`HTTP ${result.status}`);
      meetings.push(...parseFixtureHtml(result.body, month, url));
    } catch (error) {
      failures.push({ url, error_message: String(error?.message ?? error) });
    }
  }

  if (failures.length > 0) {
    const fallback = (config.meetings ?? []).filter((meeting) => meeting.meeting_date >= range.from && meeting.meeting_date <= range.to);
    if (fallback.length === 0) {
      throw new Error(`Unable to fetch HKJC fixture and no route-config fallback exists for ${range.from}..${range.to}: ${failures.map((f) => `${f.url} ${f.error_message}`).join('; ')}`);
    }
    return fallback.map((meeting) => ({ ...meeting, official_fixture_url: meeting.official_fixture_url ?? config.official_sources.fixture_source_url, fixture_fetch_warning: failures }));
  }

  return meetings
    .filter((meeting) => meeting.meeting_date >= range.from && meeting.meeting_date <= range.to)
    .sort((left, right) => `${left.meeting_date}:${left.fixture_code}`.localeCompare(`${right.meeting_date}:${right.fixture_code}`));
}

function extractTitle(text) {
  const titlePatterns = [
    /Race\s*\d+\s*[-–—:]\s*([^|]{4,120}?)(?:\s{2,}|\s+(?:\d{3,4}M|Turf|All Weather|Course|Class)|$)/i,
    /(?:HANDICAP|CUP|STAKES|TROPHY|SPRINT|CHALLENGE)[A-Z0-9 '\-&()]{0,90}/i,
  ];
  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match?.[1]) return normalizeText(match[1]).toUpperCase();
    if (match?.[0]) return normalizeText(match[0]).toUpperCase();
  }
  return null;
}

function extractDistance(text) {
  const match = text.match(/\b(\d{3,4})\s*M\b/i) ?? text.match(/\b(\d{3,4})\s*metres?\b/i);
  return match ? Number(match[1]) : null;
}

function extractSurface(text) {
  if (/All\s*Weather|A\.W\.T\.|AWT/i.test(text)) return 'All Weather Track';
  if (/\bTurf\b/i.test(text)) return 'Turf';
  if (/\bDirt\b/i.test(text)) return 'Dirt';
  return null;
}

function extractCourseLabel(text) {
  const match = text.match(/\b([ABC])(?:\+\d+)?\s+Course\b/i) ?? text.match(/\bCourse\s+([ABC])(?:\+\d+)?\b/i);
  return match ? `${match[1].toUpperCase()} Course` : null;
}

function extractPublicSafeObservation(html, config, meeting, raceNumber) {
  const text = stripHtml(html);
  const datePattern = meeting.meeting_date.replaceAll('-', '[/-]');
  const headerPatterns = [
    new RegExp(`(?:${meeting.racecourse_name}|${meeting.fixture_code})[^0-9]{0,120}(\\d{1,2}:\\d{2})`, 'i'),
    new RegExp(`${datePattern}[^0-9]{0,200}(\\d{1,2}:\\d{2})`, 'i'),
    /(?:Race\s*\d+|RaceNo\s*\d+)[^0-9]{0,140}(\d{1,2}:\d{2})/i,
  ];
  const matched = headerPatterns.map((pattern) => text.match(pattern)).find(Boolean);
  const raceTime = matched?.[1] ?? null;
  const raceName = extractTitle(text);
  const distanceM = extractDistance(text);
  const surface = extractSurface(text);
  const courseLabel = extractCourseLabel(text);
  const hasAPlusMetadata = Boolean(raceTime && raceName && distanceM && (surface || courseLabel));

  return {
    race_number: raceNumber,
    source_url: racecardUrl(config.official_sources.racecard_url_template, meeting, raceNumber),
    fetch_status: raceTime ? 'time_extracted' : 'fetched_no_time',
    race_time_local: raceTime,
    race_name: raceName,
    distance_m: distanceM,
    surface,
    course_label: courseLabel,
    metadata_status: hasAPlusMetadata ? 'verified' : raceTime ? 'partial' : 'pending',
    public_safe_text_sample: raceTime ? `${meeting.meeting_date} ${meeting.racecourse_name} Race ${raceNumber} ${raceTime}` : null,
  };
}

function reportRow(meeting, raceNumber, fields, sourceUrl, reason, status) {
  return {
    meeting_date: meeting.meeting_date,
    racecourse_id: meeting.racecourse_id,
    race_number: raceNumber,
    missing_fields: fields,
    official_source_url: sourceUrl,
    failure_reason: reason,
    status,
  };
}

async function fetchMeetingRaces(config, meeting, reportRows) {
  const races = [];
  let foundRaceCount = 0;
  for (let raceNumber = 1; raceNumber <= (config.max_race_number_to_probe ?? maxRaceNumber); raceNumber += 1) {
    const url = racecardUrl(config.official_sources.racecard_url_template, meeting, raceNumber);
    try {
      const result = await fetchWithTimeout(url);
      if (!result.ok) {
        if (raceNumber === 1) reportRows.push(reportRow(meeting, raceNumber, ['post_time_local', 'race_name', 'distance_m', 'surface_or_course_label'], url, `HTTP ${result.status}`, 'racecard_not_published'));
        break;
      }
      const observation = extractPublicSafeObservation(result.body, config, meeting, raceNumber);
      if (!observation.race_time_local) {
        if (raceNumber === 1) reportRows.push(reportRow(meeting, raceNumber, ['post_time_local'], url, 'Racecard fetched but no post time was extractable.', 'racecard_not_published'));
        break;
      }
      foundRaceCount += 1;
      races.push(observation);
      const missing = [];
      if (!observation.race_name) missing.push('race_name');
      if (observation.distance_m == null) missing.push('distance_m');
      if (!observation.surface && !observation.course_label) missing.push('surface_or_course_label');
      if (missing.length > 0) reportRows.push(reportRow(meeting, raceNumber, missing, url, 'Required A+ public-safe metadata was not extractable.', 'race_metadata_missing'));
    } catch (error) {
      reportRows.push(reportRow(meeting, raceNumber, ['post_time_local', 'race_name', 'distance_m', 'surface_or_course_label'], url, String(error?.message ?? error), 'racecard_fetch_failed'));
      if (raceNumber === 1 || foundRaceCount > 0) break;
    }
  }
  if (races.length > 0) {
    reportRows.push(reportRow(meeting, null, [], racecardUrl(config.official_sources.racecard_url_template, meeting, 1), `Fetched contiguous Race 1..${races.length}.`, 'fixture_found'));
  }
  return races;
}

const range = parseArgs(process.argv.slice(2));
const config = readJson(configPath);
const fetchedAt = new Date().toISOString();
const meetings = await fetchFixtureMeetings(config, range);
const reportRows = [];
const observations = [];

for (const meeting of meetings) {
  const races = await fetchMeetingRaces(config, meeting, reportRows);
  observations.push({
    meeting_date: meeting.meeting_date,
    racecourse_id: meeting.racecourse_id,
    racecourse_name: meeting.racecourse_name,
    fixture_code: meeting.fixture_code,
    session_type: meeting.session_type,
    official_fixture_url: meeting.official_fixture_url,
    races,
  });
}

const nextConfig = {
  ...config,
  rolling_refresh: true,
  refresh_window: range ? { from: range.from, to: range.to, mode: range.mode } : config.refresh_window ?? null,
  official_sources: {
    ...config.official_sources,
    fixture_source_url: range ? `HKJC official fixture pages for ${range.from}..${range.to}` : config.official_sources.fixture_source_url,
  },
  meetings,
  max_race_number_to_probe: config.max_race_number_to_probe ?? maxRaceNumber,
};
delete nextConfig.month;
delete nextConfig.race_numbers_to_probe;
writeJson(configPath, nextConfig);

writeJson(outputPath, {
  schema_version: 'hkjc-racecard-source-snapshot-v0',
  generated_at: fetchedAt,
  country_id: config.country_id,
  authority_id: config.authority_id,
  timezone: config.timezone,
  source_config: 'data/sources/timetable/hkjc-racecard-route.json',
  storage_policy: 'public_safe_extracted_fields_only_no_raw_html',
  official_source_url_template: config.official_sources.racecard_url_template,
  refresh_window: range,
  observations,
});

writeJson(reportPath, {
  schema_version: 'hkjc-refresh-report-v0',
  generated_at: fetchedAt,
  refresh_window: range,
  fixture_meeting_count: meetings.length,
  statuses: reportRows,
});

console.log(`[fetch-hkjc-racecards] wrote ${path.relative(root, outputPath)} fixture_meetings=${meetings.length}`);
