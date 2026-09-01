import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const timeoutMs = 15000;

function parseArgs(argv) {
  const args = Object.fromEntries(argv.map((arg) => {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    return match ? [match[1], match[2]] : [arg.replace(/^--/, ''), true];
  }));
  const date = String(args.date ?? '');
  const racecourse = String(args.racecourse ?? '').toUpperCase();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('--date=YYYY-MM-DD is required');
  if (!['ST', 'HV'].includes(racecourse)) throw new Error('--racecourse=ST|HV is required');
  const output = String(args.output ?? `data/generated/timetable/hkjc-entries-programme-${date}-${racecourse.toLowerCase()}.json`);
  return { date, racecourse, output };
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
    .replace(/<\/(div|span|td|tr|p|li|h[1-6]|a)>/gi, '\n')
    .replace(/<img\b[^>]*(?:alt|title)=["']?([^"'>]+)["']?[^>]*>/gi, ' Image: $1 ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n+/g, '\n')
    .trim();
}

function normalize(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function entriesUrl(date, racecourse) {
  return `https://racing.hkjc.com/en-us/local/information/entries?Racecourse=${racecourse}&View=All&racedate=${encodeURIComponent(date.replaceAll('-', '/'))}`;
}

async function fetchHtml(url) {
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
    if (!response.ok) throw new Error(`HKJC Entries HTTP ${response.status}`);
    const finalHost = new URL(response.url).hostname.toLowerCase();
    if (finalHost !== 'racing.hkjc.com') throw new Error(`Unexpected redirect to ${response.url}`);
    return body;
  } finally {
    clearTimeout(timer);
  }
}

function extractMeetingMetadata(text) {
  const course = text.match(/Course\s*:\s*"?([A-Z](?:\+\d+)?)"?\s*Course/i)?.[1] ?? null;
  const track = text.match(/Track\s*:\s*(Turf|All Weather Track|All Weather|Dirt)/i)?.[1] ?? null;
  return {
    surface: track === 'All Weather' ? 'All Weather Track' : track,
    course_label: course ? `${course.toUpperCase()} Course` : null,
  };
}

function extractOverviewRows(text, meeting) {
  const marker = text.search(/Entries Overview/i);
  const overview = marker >= 0 ? text.slice(marker) : text;
  const end = overview.search(/Jackpot information|Horse \(Brand No\)|Trainer\s+Wt\./i);
  const body = end > 0 ? overview.slice(0, end) : overview;
  const rows = [];
  const re = /(?:Image:\s*[•‣]?\s*)?((?:Group\s+(?:One|Two|Three)|Class\s+\d+))\s+(\d{3,4})m\s+Section\s+(\d+)\s+(.+?)(?=(?:Image:\s*[•‣]?\s*)?(?:Group\s+(?:One|Two|Three)|Class\s+\d+)\s+\d{3,4}m\s+Section\s+\d+|Jackpot information|$)/gis;
  let match;
  while ((match = re.exec(body)) !== null) {
    const raceClass = normalize(match[1]);
    const distance = Number(match[2]);
    const section = Number(match[3]);
    const raceName = normalize(match[4])
      .replace(/\s*\(Ratings\s+[^)]+\)\s*$/i, '')
      .replace(/^[-–—•‣\s]+/, '')
      .trim();
    if (!raceName) continue;
    rows.push({
      programme_index: rows.length + 1,
      race_number: null,
      race_name: raceName.toUpperCase(),
      distance_m: distance,
      race_class: raceClass,
      section_number: section,
      surface: meeting.surface,
      course_label: meeting.course_label,
      post_time_local: null,
      source_stage: 'entries',
    });
  }
  return rows;
}

const args = parseArgs(process.argv.slice(2));
const url = entriesUrl(args.date, args.racecourse);
const html = await fetchHtml(url);
const text = stripHtml(html);
if (/No Entries|Entries are not available|not yet available/i.test(text)) throw new Error('HKJC Entries are not published for this meeting');
const meeting = extractMeetingMetadata(text);
const rows = extractOverviewRows(text, meeting);
if (rows.length === 0) throw new Error('No HKJC Entries programme rows extracted');

const racecourseId = args.racecourse === 'ST' ? 'sha-tin-racecourse' : 'happy-valley-racecourse';
const out = {
  schema_version: 'hkjc-entries-programme-v0',
  generated_at: new Date().toISOString(),
  country_id: 'hong-kong',
  authority_id: 'hkjc',
  meeting_date: args.date,
  racecourse_id: racecourseId,
  racecourse_code: args.racecourse,
  official_source_url: url,
  storage_policy: 'public_safe_extracted_fields_only_no_raw_html',
  publication_state: 'programme_available_times_pending',
  merge_key_strategy: 'match later racecard rows by race_name and distance_m; do not invent race_number before official racecard ordering is available',
  programme_rows: rows,
};

const outputPath = path.isAbsolute(args.output) ? args.output : path.join(root, args.output);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(out, null, 2)}\n`);
console.log(`HKJC_ENTRIES_PROGRAMME: date=${args.date} racecourse=${args.racecourse} rows=${rows.length} output=${args.output}`);