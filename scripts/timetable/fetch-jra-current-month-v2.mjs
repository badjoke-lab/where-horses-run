import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputPath = path.join(root, 'data/generated/timetable/public/jra-current-month.json');
const requestedMonth = process.argv.find((arg) => arg.startsWith('--month='))?.slice('--month='.length) ?? null;
const dryRun = process.argv.includes('--dry-run');
const checkOnly = process.argv.includes('--check');
if (dryRun && checkOnly) throw new Error('--dry-run and --check are mutually exclusive.');

const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
const monthKey = requestedMonth ?? `${jstNow.getUTCFullYear()}-${String(jstNow.getUTCMonth() + 1).padStart(2, '0')}`;
if (!/^\d{4}-\d{2}$/.test(monthKey)) throw new Error(`Invalid month: ${monthKey}`);
const [yearText, monthText] = monthKey.split('-');
const year = Number(yearText);
const month = Number(monthText);
const monthSegment = String(month);
const monthSlugs = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const calendarRoot = `https://www.jra.go.jp/keiba/calendar${year}/`;
const monthIndexUrl = new URL(`${monthSlugs[month - 1]}.html`, calendarRoot).toString();

const venueIds = new Map([
  ['札幌', 'sapporo-racecourse'],
  ['函館', 'hakodate-racecourse'],
  ['福島', 'fukushima-racecourse'],
  ['新潟', 'niigata-racecourse'],
  ['東京', 'tokyo-racecourse'],
  ['中山', 'nakayama-racecourse'],
  ['中京', 'chukyo-racecourse'],
  ['京都', 'kyoto-racecourse'],
  ['阪神', 'hanshin-racecourse'],
  ['小倉', 'kokura-racecourse']
]);

function decode(buffer, contentType = '') {
  const head = Buffer.from(buffer).subarray(0, 2048).toString('latin1').toLowerCase();
  const charset = /shift[_-]?jis|windows-31j|x-sjis/.test(`${contentType} ${head}`) ? 'shift_jis' : 'utf-8';
  return new TextDecoder(charset).decode(buffer);
}

function entities(text) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return text
    .replace(/&#(\d+);/g, (_, value) => String.fromCodePoint(Number(value)))
    .replace(/&#x([0-9a-f]+);/gi, (_, value) => String.fromCodePoint(Number.parseInt(value, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match);
}

function visibleLines(html) {
  return entities(html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(?:p|div|li|h1|h2|h3|h4|tr|td|th|table|section|article|ul|ol|dl|dt|dd|caption|a)>/gi, '\n')
    .replace(/<[^>]+>/g, ''))
    .split(/\r?\n/)
    .map((line) => line.replace(/[\t\u3000 ]+/g, ' ').trim())
    .filter(Boolean);
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'WhereHorsesRun/1.0 (+https://github.com/badjoke-lab/where-horses-run)',
        'accept-language': 'ja,en;q=0.8'
      }
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
    return decode(await response.arrayBuffer(), response.headers.get('content-type') ?? '');
  } finally {
    clearTimeout(timer);
  }
}

function discoverDateUrls(monthHtml) {
  const pattern = new RegExp(`/calendar${year}/${year}/${monthSegment}/${monthText}\\d{2}\\.html$`);
  const urls = [...monthHtml.matchAll(/href=["']([^"']+\.html)["']/gi)]
    .map((match) => new URL(match[1], monthIndexUrl).toString())
    .filter((url) => pattern.test(new URL(url).pathname));
  const unique = [...new Set(urls)].sort();
  if (unique.length === 0) throw new Error(`No JRA date pages found on ${monthIndexUrl}.`);
  return unique;
}

function dateFromUrl(url) {
  const match = new URL(url).pathname.match(/\/(\d{4})\/(\d{1,2})\/(\d{4})\.html$/);
  if (!match) throw new Error(`Cannot parse date: ${url}`);
  return `${match[1]}-${String(Number(match[2])).padStart(2, '0')}-${match[3].slice(2)}`;
}

function postTime(line) {
  const match = line.match(/^(\d{1,2})時(\d{2})分$/);
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : null;
}

function distanceSurface(line) {
  const match = line.match(/([\d,]+)（(芝(?:・外)?|ダ)）/);
  if (!match) return null;
  const token = match[2];
  return {
    distance_m: Number(match[1].replaceAll(',', '')),
    surface: token.startsWith('芝') ? 'Turf' : 'Dirt',
    course_label: token === '芝・外' ? 'Turf Outer Course' : token.startsWith('芝') ? 'Turf Course' : 'Dirt Course'
  };
}

function parsePage(html, url) {
  const lines = visibleLines(html);
  const date = dateFromUrl(url);
  const venues = [];
  lines.forEach((line, index) => {
    const match = line.match(/^\d+回(.+?)(\d+)日$/);
    if (match && venueIds.has(match[1])) venues.push({ index, name: match[1] });
  });
  if (venues.length === 0) throw new Error(`No venue sections found: ${url}`);

  return venues.map((venue, venueIndex) => {
    const section = lines.slice(venue.index + 1, venues[venueIndex + 1]?.index ?? lines.length);
    const starts = [];
    section.forEach((line, index) => {
      const match = line.match(/^(\d{1,2})\s*レース$/);
      if (match) starts.push({ index, number: Number(match[1]) });
    });
    const timetable_rows = starts.map((start, raceIndex) => {
      const chunk = section.slice(start.index + 1, starts[raceIndex + 1]?.index ?? section.length);
      const timeIndex = chunk.findIndex((line) => postTime(line));
      const distanceIndex = chunk.slice(0, timeIndex).findIndex((line) => distanceSurface(line));
      if (timeIndex < 0 || distanceIndex < 0) throw new Error(`${url} ${venue.name} Race ${start.number}: incomplete row.`);
      const race_name = [...new Set(chunk.slice(0, distanceIndex).filter((line) => !/^(レース 番号|レース名・条件|発走時刻)$/.test(line)))].join(' ').trim();
      if (!race_name) throw new Error(`${url} ${venue.name} Race ${start.number}: race name missing.`);
      return {
        label: `Race ${start.number}`,
        post_time_local: postTime(chunk[timeIndex]),
        race_name,
        ...distanceSurface(chunk[distanceIndex])
      };
    });
    if (timetable_rows.length !== 12) throw new Error(`${url} ${venue.name}: expected 12 races, found ${timetable_rows.length}.`);
    return {
      date,
      racecourse_id: venueIds.get(venue.name),
      official_source_url: url,
      timetable_rows
    };
  });
}

function makeDataset(programmes) {
  const generated_at = new Date().toISOString();
  const last_checked_date = generated_at.slice(0, 10);
  const meetings = [];
  const details = [];
  for (const programme of programmes) {
    const meeting_id = `jra-${programme.racecourse_id}-${programme.date}`;
    meetings.push({
      meeting_id,
      country_id: 'japan', authority_id: 'jra', racecourse_id: programme.racecourse_id,
      date: programme.date, timezone: 'Asia/Tokyo', capability_rank: 'A+', max_public_rank: 'A+', effective_public_rank: 'A+',
      first_race_time_local: programme.timetable_rows[0].post_time_local,
      last_race_time_local: programme.timetable_rows.at(-1).post_time_local,
      policy_id: 'jra-reviewed-a-plus', source_status: 'verified', official_source_url: programme.official_source_url,
      last_checked_date, detail_path: `/timetable/meetings/${meeting_id}/`, show_live_label: false, show_replay_label: false
    });
    details.push({
      meeting_id,
      country_id: 'japan', authority_id: 'jra', racecourse_id: programme.racecourse_id,
      date: programme.date, timezone: 'Asia/Tokyo', capability_rank: 'A+', max_public_rank: 'A+', effective_public_rank: 'A+',
      policy_id: 'jra-reviewed-a-plus', source_status: 'verified', official_source_url: programme.official_source_url,
      last_checked_date, show_race_name: true, show_distance: true, show_surface: true, show_course: true,
      show_live_label: false, show_replay_label: false, timetable_rows: programme.timetable_rows
    });
  }
  meetings.sort((a, b) => `${a.date}:${a.racecourse_id}`.localeCompare(`${b.date}:${b.racecourse_id}`));
  details.sort((a, b) => `${a.date}:${a.racecourse_id}`.localeCompare(`${b.date}:${b.racecourse_id}`));
  return {
    schema_version: 'jra-current-month-public-v1', status: 'fetched_official_programme', month: monthKey, generated_at,
    source_notice: 'JRA programme pages are advance schedules. Race order, surface, distance and post time may change; the official racecard remains final.',
    source_pages: [...new Set(programmes.map((programme) => programme.official_source_url))].sort(),
    meetings, details
  };
}

const monthHtml = await fetchHtml(monthIndexUrl);
const dateUrls = discoverDateUrls(monthHtml);
const programmes = [];
for (const url of dateUrls) programmes.push(...parsePage(await fetchHtml(url), url));
const dataset = makeDataset(programmes);
if (dataset.meetings.length < 6) throw new Error(`Unexpected meeting count: ${dataset.meetings.length}`);
const serialized = `${JSON.stringify(dataset, null, 2)}\n`;

if (dryRun) {
  console.log(JSON.stringify({ month: dataset.month, date_pages: dateUrls.length, meetings: dataset.meetings.length, rows: dataset.details.reduce((sum, detail) => sum + detail.timetable_rows.length, 0) }, null, 2));
  process.exit(0);
}
if (checkOnly) {
  const committed = JSON.parse(readFileSync(outputPath, 'utf8'));
  const comparable = { ...dataset, generated_at: committed.generated_at };
  if (JSON.stringify(comparable) !== JSON.stringify(committed)) throw new Error('Committed JRA current-month dataset differs from official programme pages.');
  console.log(`JRA_CURRENT_MONTH: current month=${dataset.month} meetings=${dataset.meetings.length}`);
  process.exit(0);
}
mkdirSync(path.dirname(outputPath), { recursive: true });
const temporary = `${outputPath}.tmp`;
writeFileSync(temporary, serialized);
renameSync(temporary, outputPath);
console.log(`JRA_CURRENT_MONTH: wrote month=${dataset.month} meetings=${dataset.meetings.length}`);
