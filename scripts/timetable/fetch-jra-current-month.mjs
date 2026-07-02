import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputPath = path.join(root, 'data/generated/timetable/public/jra-current-month.json');
const requestedMonth = process.argv.find((arg) => arg.startsWith('--month='))?.slice('--month='.length) ?? null;
const checkOnly = process.argv.includes('--check');
const dryRun = process.argv.includes('--dry-run');
if (checkOnly && dryRun) throw new Error('--check and --dry-run are mutually exclusive.');

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const now = new Date();
const jstNow = new Date(now.getTime() + JST_OFFSET_MS);
const currentMonth = requestedMonth ?? `${jstNow.getUTCFullYear()}-${String(jstNow.getUTCMonth() + 1).padStart(2, '0')}`;
if (!/^\d{4}-\d{2}$/.test(currentMonth)) throw new Error(`Invalid --month value: ${currentMonth}`);
const [yearText, monthText] = currentMonth.split('-');
const year = Number(yearText);
const month = Number(monthText);
const monthSegment = String(month);
const calendarRoot = `https://www.jra.go.jp/keiba/calendar${year}/`;
const monthPathPrefix = `/keiba/calendar${year}/${year}/${monthSegment}/`;

const venueMap = new Map([
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

function decodeHtml(buffer, contentType = '') {
  const asciiHead = Buffer.from(buffer).subarray(0, 2048).toString('latin1').toLowerCase();
  const label = /shift[_-]?jis|windows-31j|x-sjis/.test(`${contentType} ${asciiHead}`) ? 'shift_jis' : 'utf-8';
  return new TextDecoder(label).decode(buffer);
}

function decodeEntities(value) {
  const named = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' '
  };
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match);
}

function htmlToLines(html) {
  return decodeEntities(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*\/?\s*>/gi, '\n')
      .replace(/<\/(?:p|div|li|h1|h2|h3|h4|tr|td|th|table|section|article|ul|ol|dl|dt|dd|caption)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  )
    .split(/\r?\n/)
    .map((line) => line.replace(/[\t\u3000 ]+/g, ' ').trim())
    .filter(Boolean);
}

async function fetchText(url) {
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
    return decodeHtml(await response.arrayBuffer(), response.headers.get('content-type') ?? '');
  } finally {
    clearTimeout(timer);
  }
}

function discoverDateUrls(indexHtml) {
  const matches = [...indexHtml.matchAll(/href=["']([^"']+\.html)["']/gi)]
    .map((match) => match[1])
    .filter((href) => href.includes(monthPathPrefix));
  const urls = [...new Set(matches.map((href) => new URL(href, calendarRoot).toString()))]
    .filter((url) => new RegExp(`/${year}/${monthSegment}/${monthText}\\d{2}\\.html$`).test(url))
    .sort();
  if (urls.length === 0) throw new Error(`No JRA programme date pages found for ${currentMonth}.`);
  return urls;
}

function parseDateFromUrl(url) {
  const match = url.match(/\/(\d{4})\/(\d{1,2})\/(\d{4})\.html$/);
  if (!match) throw new Error(`Cannot parse JRA date URL: ${url}`);
  const [, y, m, mmdd] = match;
  return `${y}-${String(Number(m)).padStart(2, '0')}-${mmdd.slice(2)}`;
}

function parseDistanceSurface(line) {
  const match = line.match(/([\d,]+)（(芝(?:・外)?|ダ)）/);
  if (!match) return null;
  const distance_m = Number(match[1].replaceAll(',', ''));
  const token = match[2];
  return {
    distance_m,
    surface: token.startsWith('芝') ? 'Turf' : 'Dirt',
    course_label: token === '芝・外' ? 'Turf Outer Course' : token.startsWith('芝') ? 'Turf Course' : 'Dirt Course'
  };
}

function parseTime(line) {
  const match = line.match(/^(\d{1,2})時(\d{2})分$/);
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : null;
}

function parseProgrammePage(html, url) {
  const lines = htmlToLines(html);
  const date = parseDateFromUrl(url);
  const venueStarts = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^\d+回(.+?)(\d+)日$/);
    if (match && venueMap.has(match[1])) venueStarts.push({ index, venueName: match[1] });
  }
  if (venueStarts.length === 0) throw new Error(`No JRA venue sections found: ${url}`);

  return venueStarts.map((venue, venueIndex) => {
    const section = lines.slice(venue.index + 1, venueStarts[venueIndex + 1]?.index ?? lines.length);
    const raceStarts = [];
    for (let index = 0; index < section.length; index += 1) {
      const match = section[index].match(/^(\d{1,2})\s*レース$/);
      if (match) raceStarts.push({ index, raceNumber: Number(match[1]) });
    }
    const rows = raceStarts.map((race, raceIndex) => {
      const chunk = section.slice(race.index + 1, raceStarts[raceIndex + 1]?.index ?? section.length);
      const timeIndex = chunk.findIndex((line) => parseTime(line));
      if (timeIndex < 0) throw new Error(`${url} ${venue.venueName} Race ${race.raceNumber}: post time missing.`);
      const post_time_local = parseTime(chunk[timeIndex]);
      const distanceIndex = chunk.slice(0, timeIndex).findIndex((line) => parseDistanceSurface(line));
      if (distanceIndex < 0) throw new Error(`${url} ${venue.venueName} Race ${race.raceNumber}: distance/surface missing.`);
      const distance = parseDistanceSurface(chunk[distanceIndex]);
      const raceNameParts = chunk.slice(0, distanceIndex)
        .filter((line) => !/^(レース 番号|レース名・条件|発走時刻)$/.test(line));
      const race_name = [...new Set(raceNameParts)].join(' ').trim();
      if (!race_name) throw new Error(`${url} ${venue.venueName} Race ${race.raceNumber}: race name missing.`);
      return {
        label: `Race ${race.raceNumber}`,
        post_time_local,
        race_name,
        ...distance
      };
    });
    if (rows.length !== 12) throw new Error(`${url} ${venue.venueName}: expected 12 races, found ${rows.length}.`);
    return {
      date,
      venue_name_ja: venue.venueName,
      racecourse_id: venueMap.get(venue.venueName),
      official_source_url: url,
      rows
    };
  });
}

function buildDataset(programmes, generatedAt) {
  const lastCheckedDate = generatedAt.slice(0, 10);
  const meetings = [];
  const details = [];
  for (const programme of programmes) {
    const meeting_id = `jra-${programme.racecourse_id}-${programme.date}`;
    meetings.push({
      meeting_id,
      country_id: 'japan',
      authority_id: 'jra',
      racecourse_id: programme.racecourse_id,
      date: programme.date,
      timezone: 'Asia/Tokyo',
      capability_rank: 'A+',
      max_public_rank: 'A+',
      effective_public_rank: 'A+',
      first_race_time_local: programme.rows[0].post_time_local,
      last_race_time_local: programme.rows.at(-1).post_time_local,
      policy_id: 'jra-reviewed-a-plus',
      source_status: 'verified',
      official_source_url: programme.official_source_url,
      last_checked_date: lastCheckedDate,
      detail_path: `/timetable/meetings/${meeting_id}/`,
      show_live_label: false,
      show_replay_label: false
    });
    details.push({
      meeting_id,
      country_id: 'japan',
      authority_id: 'jra',
      racecourse_id: programme.racecourse_id,
      date: programme.date,
      timezone: 'Asia/Tokyo',
      capability_rank: 'A+',
      max_public_rank: 'A+',
      effective_public_rank: 'A+',
      policy_id: 'jra-reviewed-a-plus',
      official_source_url: programme.official_source_url,
      source_status: 'verified',
      last_checked_date: lastCheckedDate,
      show_race_name: true,
      show_distance: true,
      show_surface: true,
      show_course: true,
      show_live_label: false,
      show_replay_label: false,
      timetable_rows: programme.rows
    });
  }
  meetings.sort((a, b) => `${a.date}:${a.racecourse_id}`.localeCompare(`${b.date}:${b.racecourse_id}`));
  details.sort((a, b) => `${a.date}:${a.racecourse_id}`.localeCompare(`${b.date}:${b.racecourse_id}`));
  return {
    schema_version: 'jra-current-month-public-v1',
    status: 'fetched_official_programme',
    month: currentMonth,
    generated_at: generatedAt,
    source_notice: 'JRA programme pages are advance schedules. Race order, surface, distance and post time may change; the official racecard remains final.',
    source_pages: [...new Set(programmes.map((programme) => programme.official_source_url))].sort(),
    meetings,
    details
  };
}

const indexHtml = await fetchText(calendarRoot);
const dateUrls = discoverDateUrls(indexHtml);
const programmes = [];
for (const url of dateUrls) {
  const html = await fetchText(url);
  programmes.push(...parseProgrammePage(html, url));
}
const generatedAt = new Date().toISOString();
const dataset = buildDataset(programmes, generatedAt);
if (dataset.meetings.length < 6) throw new Error(`Unexpectedly small JRA current-month dataset: ${dataset.meetings.length} meetings.`);
const serialized = `${JSON.stringify(dataset, null, 2)}\n`;

if (dryRun) {
  console.log(JSON.stringify({
    month: dataset.month,
    source_pages: dataset.source_pages.length,
    meetings: dataset.meetings.length,
    details: dataset.details.length,
    timetable_rows: dataset.details.reduce((sum, detail) => sum + detail.timetable_rows.length, 0)
  }, null, 2));
  process.exit(0);
}
if (checkOnly) {
  if (!readFileSync(outputPath, 'utf8')) throw new Error(`Missing ${outputPath}.`);
  const committed = JSON.parse(readFileSync(outputPath, 'utf8'));
  const comparable = { ...dataset, generated_at: committed.generated_at };
  const committedComparable = { ...committed };
  if (JSON.stringify(comparable) !== JSON.stringify(committedComparable)) {
    throw new Error('Committed JRA current-month dataset differs from the current official programme pages.');
  }
  console.log(`JRA_CURRENT_MONTH: current month=${dataset.month} meetings=${dataset.meetings.length}`);
  process.exit(0);
}
mkdirSync(path.dirname(outputPath), { recursive: true });
const temporary = `${outputPath}.tmp`;
writeFileSync(temporary, serialized);
renameSync(temporary, outputPath);
console.log(`JRA_CURRENT_MONTH: wrote month=${dataset.month} meetings=${dataset.meetings.length} rows=${dataset.details.reduce((sum, detail) => sum + detail.timetable_rows.length, 0)}`);
