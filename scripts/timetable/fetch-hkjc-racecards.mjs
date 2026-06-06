import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const configPath = path.join(root, 'data/sources/timetable/hkjc-racecard-route.json');
const outputPath = path.join(root, 'data/generated/timetable/hkjc-racecard-source-snapshot.json');
const timeoutMs = 15000;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
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

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x2F;|&#47;/gi, '/');
}

function stripHtml(value) {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeText(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
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
  const match = text.match(/\b([ABC])\s+Course\b/i) ?? text.match(/\bCourse\s+([ABC])\b/i);
  return match ? `${match[1].toUpperCase()} Course` : null;
}

function extractPublicSafeObservation(html, meeting, raceNumber) {
  const text = stripHtml(html);
  const datePattern = meeting.meeting_date.replaceAll('-', '[/-]');
  const headerPatterns = [
    new RegExp(`(?:${meeting.racecourse_name}|${meeting.fixture_code})[^0-9]{0,80}(\\d{1,2}:\\d{2})`, 'i'),
    new RegExp(`${datePattern}[^0-9]{0,160}(\\d{1,2}:\\d{2})`, 'i'),
    /(?:Race\s*\d+|RaceNo\s*\d+)[^0-9]{0,100}(\d{1,2}:\d{2})/i,
  ];

  const matched = headerPatterns.map((pattern) => text.match(pattern)).find(Boolean);
  const raceTime = matched?.[1] ?? null;
  const raceName = extractTitle(text);
  const distanceM = extractDistance(text);
  const surface = extractSurface(text);
  const courseLabel = extractCourseLabel(text);
  const hasAPlusMetadata = Boolean(raceTime && raceName && distanceM && surface);

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

const config = readJson(configPath);
const fetchedAt = new Date().toISOString();
const observations = [];

for (const meeting of config.meetings) {
  const races = [];
  for (const raceNumber of config.race_numbers_to_probe) {
    const url = racecardUrl(config.official_sources.racecard_url_template, meeting, raceNumber);
    try {
      const result = await fetchWithTimeout(url);
      if (!result.ok) {
        races.push({
          race_number: raceNumber,
          source_url: url,
          fetch_status: `http_${result.status}`,
          race_time_local: null,
          race_name: null,
          distance_m: null,
          surface: null,
          course_label: null,
          metadata_status: 'pending',
          public_safe_text_sample: null,
        });
        continue;
      }
      races.push(extractPublicSafeObservation(result.body, meeting, raceNumber));
    } catch (error) {
      races.push({
        race_number: raceNumber,
        source_url: url,
        fetch_status: 'fetch_error',
        error_message: String(error?.message ?? error),
        race_time_local: null,
        race_name: null,
        distance_m: null,
        surface: null,
        course_label: null,
        metadata_status: 'pending',
        public_safe_text_sample: null,
      });
    }
  }
  observations.push({
    meeting_date: meeting.meeting_date,
    racecourse_id: meeting.racecourse_id,
    racecourse_name: meeting.racecourse_name,
    fixture_code: meeting.fixture_code,
    races,
  });
}

writeJson(outputPath, {
  schema_version: 'hkjc-racecard-source-snapshot-v0',
  generated_at: fetchedAt,
  country_id: config.country_id,
  authority_id: config.authority_id,
  timezone: config.timezone,
  source_config: 'data/sources/timetable/hkjc-racecard-route.json',
  storage_policy: 'public_safe_extracted_fields_only_no_raw_html',
  official_source_url_template: config.official_sources.racecard_url_template,
  observations,
});

console.log(`[fetch-hkjc-racecards] wrote ${path.relative(root, outputPath)}`);
