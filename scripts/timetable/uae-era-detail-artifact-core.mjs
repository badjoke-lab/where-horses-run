const TIMEZONE = 'Asia/Dubai';
const SYSTEM_ID = 'uae-national-racing-system';
const COUNTRY_ID = 'united-arab-emirates';
const AUTHORITY_ID = 'emirates-racing-authority';
const SOURCE_ID = 'era-racecard-public-timetable';
const ADAPTER_ID = 'uae-era-racecard-detail-artifact-v1';
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const RACECOURSE_BY_NAME = new Map([
  ['meydan', 'meydan-racecourse'],
  ['abu dhabi turf club', 'abu-dhabi-turf-club'],
  ['abu dhabi', 'abu-dhabi-turf-club'],
  ['al ain', 'al-ain-racecourse'],
  ['jebel ali', 'jebel-ali-racecourse'],
  ['sharjah', 'sharjah-racecourse'],
]);

function decodeEntities(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

export function uaeEraDetailText(value) {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:tr|td|th|div|section|article|p|li|h[1-6]|a)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function validDate(value) {
  if (!DATE_PATTERN.test(String(value ?? ''))) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function normalizeTime(value) {
  const match = String(value ?? '').match(/(?:^|\D)(\d{1,2}):(\d{2})(?:\D|$)/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function officialRacecardRoute(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'emiratesracing.com') return null;
    const match = url.pathname.match(/^\/racecard\/(\d{4}-\d{2}-\d{2})\/(\d{1,2})(?:\/(?:entries|declarations|results))?\/?$/i);
    if (!match || !validDate(match[1])) return null;
    return { date: match[1], race_number: Number(match[2]) };
  } catch {
    return null;
  }
}

function racecourseFromText(text) {
  const lower = text.toLowerCase();
  for (const [name, racecourseId] of RACECOURSE_BY_NAME) {
    if (new RegExp(`(?:^|\\n)${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\n|$)`, 'i').test(lower)) {
      return { racecourse_id: racecourseId, racecourse_name: name };
    }
  }
  return { racecourse_id: null, racecourse_name: null };
}

function raceSection(text, raceNumber) {
  const marker = new RegExp(`(?:^|\\n)Race\\s+${raceNumber}(?:\\s*[-–—:]\\s*[^\\n]+)?(?:\\n|$)`, 'i');
  const match = marker.exec(text);
  if (!match) return text;
  return text.slice(match.index, Math.min(text.length, match.index + 2400));
}

function raceNameFromSection(section, raceNumber) {
  const named = section.match(new RegExp(`Race\\s+${raceNumber}\\s*[-–—:]\\s*([^\\n]+)`, 'i'));
  return named?.[1] ? named[1].replace(/\s+/g, ' ').trim().slice(0, 180) : null;
}

function classLabelFromSection(section) {
  const lines = section.split('\n').map((line) => line.trim()).filter(Boolean);
  const ignored = [
    /^Race\s+\d+/i,
    /^\d{1,2}:\d{2}$/,
    /^For\b/i,
    /^(?:Purebred Arabian|Thoroughbred)$/i,
    /^(?:DIRT|TURF)$/i,
    /^AED\b/i,
    /^(?:Rail Position|Track Condition|Safety Limit|Track Record|Prize Breakdown)/i,
    /^\d{3,4}m$/i,
  ];
  return lines.find((line) => !ignored.some((pattern) => pattern.test(line)) && /[A-Za-z]/.test(line))?.slice(0, 120) ?? null;
}

export function discoverUaeEraRaceNumbers(html, date) {
  if (!validDate(date)) throw new Error('date must be YYYY-MM-DD');
  const escaped = date.replace(/-/g, '\\-');
  const pattern = new RegExp(`/racecard/${escaped}/(\\d{1,2})(?:/|["'?#])`, 'gi');
  const numbers = new Set();
  for (const match of String(html ?? '').matchAll(pattern)) {
    const value = Number(match[1]);
    if (Number.isInteger(value) && value >= 1 && value <= 30) numbers.add(value);
  }
  return [...numbers].sort((left, right) => left - right);
}

export function parseUaeEraPublicSafeRacecardHtml(html, { sourceUrl }) {
  const route = officialRacecardRoute(sourceUrl);
  if (!route) throw new Error('sourceUrl must be an official emiratesracing.com racecard HTTPS route');
  if (route.race_number < 1 || route.race_number > 30) throw new Error('race number must be from 1 through 30');

  const text = uaeEraDetailText(html);
  const section = raceSection(text, route.race_number);
  const racecourse = racecourseFromText(text);
  const postTime = normalizeTime(section.match(/(?:^|\n)(\d{1,2}:\d{2})(?:\n|$)/)?.[1]);
  const distanceMatch = section.match(/(?:^|\n)(\d{3,4})m(?:\n|$)/i);
  const surfaceMatch = section.match(/(?:^|\n)(DIRT|TURF)(?:\n|$)/i);
  const raceName = raceNameFromSection(section, route.race_number);

  return {
    schema_version: 'calendar-uae-era-detail-observation-v1',
    country_id: COUNTRY_ID,
    authority_id: AUTHORITY_ID,
    system_id: SYSTEM_ID,
    source_id: SOURCE_ID,
    adapter_id: ADAPTER_ID,
    date: route.date,
    timezone: TIMEZONE,
    racecourse_id: racecourse.racecourse_id,
    race_number: route.race_number,
    label: `Race ${route.race_number}`,
    post_time_local: postTime,
    race_name: raceName,
    race_class: classLabelFromSection(section),
    distance_m: distanceMatch ? Number(distanceMatch[1]) : null,
    surface: surfaceMatch ? surfaceMatch[1].toUpperCase() : null,
    source_url: sourceUrl,
    missing_fields: [
      ...(!racecourse.racecourse_id ? ['racecourse_id'] : []),
      ...(!postTime ? ['post_time_local'] : []),
      ...(distanceMatch ? [] : ['distance_m']),
      ...(surfaceMatch ? [] : ['surface']),
    ],
  };
}

function continuousFromOne(numbers) {
  return numbers.length > 0 && numbers.every((value, index) => value === index + 1);
}

export function classifyUaeEraDetailMeeting({ observations, meeting_complete: meetingComplete }) {
  const unique = new Map();
  for (const observation of observations ?? []) {
    if (Number.isInteger(observation?.race_number)) unique.set(observation.race_number, observation);
  }
  const rows = [...unique.values()].sort((left, right) => left.race_number - right.race_number);
  const timed = rows.filter((row) => row.post_time_local);
  const timedNumbers = timed.map((row) => row.race_number);
  const continuous = continuousFromOne(timedNumbers);
  const publicRows = timed.map((row) => ({
    label: row.label,
    post_time_local: row.post_time_local,
    race_name: row.race_name,
    distance_m: row.distance_m,
    surface: row.surface,
  }));

  if (meetingComplete === true && continuous && timed.length >= 2
    && timed.every((row) => row.race_name && row.distance_m != null && row.surface)) {
    return {
      rank: 'A+',
      first_race_time_local: timed[0].post_time_local,
      last_race_time_local: timed.at(-1).post_time_local,
      timetable_rows: publicRows,
    };
  }
  if (meetingComplete === true && continuous && timed.length >= 2) {
    return {
      rank: 'A',
      first_race_time_local: timed[0].post_time_local,
      last_race_time_local: timed.at(-1).post_time_local,
      timetable_rows: publicRows.map(({ label, post_time_local }) => ({ label, post_time_local })),
    };
  }
  if (meetingComplete === true && timed.length >= 2 && timed.some((row) => row.race_number === 1)) {
    return {
      rank: 'B+',
      first_race_time_local: timed.find((row) => row.race_number === 1).post_time_local,
      last_race_time_local: timed.at(-1).post_time_local,
      timetable_rows: [],
    };
  }
  const first = timed.find((row) => row.race_number === 1);
  if (first) {
    return {
      rank: 'B',
      first_race_time_local: first.post_time_local,
      last_race_time_local: null,
      timetable_rows: [],
    };
  }
  return {
    rank: 'C',
    first_race_time_local: null,
    last_race_time_local: null,
    timetable_rows: [],
  };
}

export const uaeEraDetailContractV1 = Object.freeze({
  timezone: TIMEZONE,
  system_id: SYSTEM_ID,
  country_id: COUNTRY_ID,
  authority_id: AUTHORITY_ID,
  source_id: SOURCE_ID,
  adapter_id: ADAPTER_ID,
  official_hostname: 'emiratesracing.com',
  public_ceiling: 'A',
});
