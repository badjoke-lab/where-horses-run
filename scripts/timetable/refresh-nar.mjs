import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const timeoutMs = 20000;
const requestDelayMs = 120;

const snapshotPath = 'data/generated/timetable/nar-racecard-source-snapshot.json';
const normalizedPath = 'data/generated/timetable/nar-normalized-timetable.json';
const detailsPath = 'data/generated/timetable/nar-normalized-meeting-details.json';
const reportPath = 'data/generated/timetable/nar-refresh-report.json';
const canonicalMeetingsPath = 'data/generated/timetable/canonical/meetings.json';
const canonicalDetailsPath = 'data/generated/timetable/canonical/meeting-details.json';

const rankOrder = ['not_listed', 'D', 'C', 'B', 'B+', 'A', 'A+'];

const venues = [
  { code: '10', id: 'morioka-racecourse', name_ja: '盛岡', name_en: 'Morioka' },
  { code: '11', id: 'mizusawa-racecourse', name_ja: '水沢', name_en: 'Mizusawa' },
  { code: '18', id: 'urawa-racecourse', name_ja: '浦和', name_en: 'Urawa' },
  { code: '19', id: 'funabashi-racecourse', name_ja: '船橋', name_en: 'Funabashi' },
  { code: '20', id: 'oi-racecourse', name_ja: '大井', name_en: 'Oi' },
  { code: '21', id: 'kawasaki-racecourse', name_ja: '川崎', name_en: 'Kawasaki' },
  { code: '22', id: 'kanazawa-racecourse', name_ja: '金沢', name_en: 'Kanazawa' },
  { code: '23', id: 'kasamatsu-racecourse', name_ja: '笠松', name_en: 'Kasamatsu' },
  { code: '24', id: 'nagoya-racecourse', name_ja: '名古屋', name_en: 'Nagoya' },
  { code: '27', id: 'sonoda-racecourse', name_ja: '園田', name_en: 'Sonoda' },
  { code: '28', id: 'himeji-racecourse', name_ja: '姫路', name_en: 'Himeji' },
  { code: '31', id: 'kochi-racecourse', name_ja: '高知', name_en: 'Kochi' },
  { code: '32', id: 'saga-racecourse', name_ja: '佐賀', name_en: 'Saga' },
  { code: '36', id: 'monbetsu-racecourse', name_ja: '門別', name_en: 'Monbetsu' },
];

function parseArgs(argv) {
  const values = {};
  for (const arg of argv) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) values[match[1]] = match[2];
  }
  if (!values.from || !values.to) {
    throw new Error('Usage: node scripts/timetable/refresh-nar.mjs --from=YYYY-MM-DD --to=YYYY-MM-DD');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.from) || !/^\d{4}-\d{2}-\d{2}$/.test(values.to)) {
    throw new Error('--from and --to must use YYYY-MM-DD.');
  }
  if (values.from > values.to) throw new Error('--from must be on or before --to.');
  return { from: values.from, to: values.to };
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function writeJson(relativePath, value) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function enumerateDates(from, to) {
  const dates = [];
  const cursor = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function narDate(date) {
  return date.replaceAll('-', '/');
}

function listUrl(date, venueCode) {
  const params = new URLSearchParams({
    k_babaCode: venueCode,
    k_raceDate: narDate(date),
  });
  return `https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList?${params.toString()}`;
}

function detailUrl(date, venueCode, raceNumber) {
  const params = new URLSearchParams({
    k_babaCode: venueCode,
    k_raceDate: narDate(date),
    k_raceNo: String(raceNumber),
  });
  return `https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/DebaTable?${params.toString()}`;
}

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

function stripHtml(value) {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:tr|td|th|div|section|article|p|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t\u3000]+/g, ' ')
    .replace(/\r/g, '')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function compact(value) {
  return stripHtml(value).replace(/\s+/g, ' ').trim();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'ja,en-US;q=0.8,en;q=0.6',
      },
    });
    const body = await response.text();
    return {
      ok: response.ok,
      http_status: response.status,
      final_url: response.url,
      content_type: response.headers.get('content-type'),
      body_size: Buffer.byteLength(body),
      body,
      network_error: null,
    };
  } catch (error) {
    return {
      ok: false,
      http_status: null,
      final_url: url,
      content_type: null,
      body_size: 0,
      body: '',
      network_error: String(error?.cause?.code ?? error?.message ?? error),
    };
  } finally {
    clearTimeout(timer);
  }
}

function normalizeTime(value) {
  const match = String(value ?? '').match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function directionLabel(value) {
  if (value === '右') return 'Right';
  if (value === '左') return 'Left';
  if (value === '直') return 'Straight';
  return null;
}

function absoluteUrl(href, baseUrl) {
  return new URL(decodeEntities(href), baseUrl).toString();
}

function parseListRows(html, sourceUrl) {
  const rows = [];
  for (const match of html.matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)) {
    const rowHtml = match[0];
    const plain = compact(rowHtml);
    const raceMatch = plain.match(/(?:^|\s)(\d{1,2})R(?:\s|$)/);
    const timeMatch = plain.match(/(?:^|\s)(\d{1,2}:\d{2})(?:\s|$)/);
    const courseMatch = plain.match(/([右左直])\s*(\d{3,4})\s*[mｍＭ]/);
    const anchorMatch = rowHtml.match(/<a\b[^>]*href=["']([^"']*DebaTable[^"']*)["'][^>]*>([\s\S]*?)<\/a>/i);
    if (!raceMatch || !timeMatch || !courseMatch || !anchorMatch) continue;

    const raceNumber = Number(raceMatch[1]);
    const distance = Number(courseMatch[2]);
    const raceName = compact(anchorMatch[2]);
    if (raceNumber < 1 || raceNumber > 30 || !raceName || distance < 600 || distance > 6000) continue;

    rows.push({
      race_number: raceNumber,
      label: `Race ${raceNumber}`,
      post_time_local: normalizeTime(timeMatch[1]),
      race_name: raceName,
      distance_m: distance,
      list_direction: directionLabel(courseMatch[1]),
      list_course_label: `${directionLabel(courseMatch[1])} ${distance}m`,
      detail_url: absoluteUrl(anchorMatch[1], sourceUrl),
      surface: null,
      course_label: null,
      detail_fetch: null,
    });
  }

  const unique = new Map();
  for (const row of rows) unique.set(row.race_number, row);
  return [...unique.values()].sort((left, right) => left.race_number - right.race_number);
}

function parseDetailMetadata(html) {
  const plain = compact(html);
  const metadataMatch = plain.match(/(ダート|芝|障害)\s*(\d{3,4})\s*[mｍＭ]\s*[（(]([^）)]+)[）)]/);
  if (!metadataMatch) return null;

  const surfaceRaw = metadataMatch[1];
  const distance = Number(metadataMatch[2]);
  const courseRaw = metadataMatch[3].replace(/\s+/g, '');
  const surface = surfaceRaw === 'ダート' ? 'Dirt' : surfaceRaw === '芝' ? 'Turf' : 'Jump';
  const labels = [];
  if (surface === 'Dirt') labels.push('Dirt Course');
  if (surface === 'Turf') labels.push('Turf Course');
  if (surface === 'Jump') labels.push('Jump Course');
  if (/内コース|内回り|内/.test(courseRaw)) labels.push('Inner');
  if (/外コース|外回り|外/.test(courseRaw)) labels.push('Outer');
  if (/右/.test(courseRaw)) labels.push('Right');
  if (/左/.test(courseRaw)) labels.push('Left');
  if (/直/.test(courseRaw)) labels.push('Straight');

  return {
    surface,
    distance_m: distance,
    course_label: [...new Set(labels)].join(' / '),
    official_course_text: `${surfaceRaw} ${distance}m（${courseRaw}）`,
  };
}

async function enrichRows(rows) {
  const enriched = [];
  for (const row of rows) {
    await sleep(requestDelayMs);
    const response = await fetchPage(row.detail_url);
    const metadata = response.ok ? parseDetailMetadata(response.body) : null;
    enriched.push({
      ...row,
      distance_m: metadata?.distance_m ?? row.distance_m,
      surface: metadata?.surface ?? null,
      course_label: metadata?.course_label ?? null,
      official_course_text: metadata?.official_course_text ?? null,
      detail_fetch: {
        official_source_url: row.detail_url,
        http_status: response.http_status,
        final_url: response.final_url,
        content_type: response.content_type,
        body_size: response.body_size,
        network_error: response.network_error,
        parsed: Boolean(metadata),
      },
    });
  }
  return enriched;
}

function isContinuous(rows) {
  return rows.length >= 2 && rows.every((row, index) => row.race_number === index + 1);
}

function rowMissingFields(row) {
  return [
    !row.post_time_local ? 'post_time_local' : null,
    !row.race_name ? 'race_name' : null,
    !row.distance_m ? 'distance_m' : null,
    !row.surface ? 'surface' : null,
    !row.course_label ? 'course_label' : null,
  ].filter(Boolean);
}

function rankRows(rows) {
  if (!rows.length) return 'C';
  const continuous = isContinuous(rows);
  if (continuous && rows.every((row) => rowMissingFields(row).length === 0)) return 'A+';
  if (continuous) return 'A';
  if (rows.length >= 2) return 'B+';
  return 'B';
}

function meetingHeaderMatches(html, date, venue) {
  const plain = compact(html);
  const [year, month, day] = date.split('-').map(Number);
  return plain.includes(`${year}年${month}月${day}日`) && plain.includes(`${venue.name_ja}競馬`);
}

function mergeIntoCanonical(records, details, generatedAt) {
  const canonical = readJson(canonicalMeetingsPath);
  const canonicalDetails = readJson(canonicalDetailsPath);
  const meetingMap = new Map((canonical.meetings ?? []).map((meeting) => [meeting.meeting_id, meeting]));
  const detailMap = new Map((canonicalDetails.details ?? []).map((detail) => [detail.meeting_id, detail]));

  for (const record of records) {
    const candidate = {
      meeting_id: record.meeting_id,
      country_id: 'japan',
      authority_id: 'nar-local-government-racing',
      racecourse_id: record.racecourse_id,
      date: record.date,
      timezone: 'Asia/Tokyo',
      capability_rank: record.capability_rank,
      display_status: 'displayable',
      first_race_time_local: record.first_race_time_local,
      last_race_time_local: record.last_race_time_local,
      source_trace: {
        source_id: 'nar-official-race-list-and-deba-table',
        route_id: 'nar-race-list-detail',
        source_status: 'verified',
        official_source_url: record.official_source_url,
        source_label: 'NAR official race list and race detail pages',
        extraction_method: 'live_fetch_a_plus_first',
        source_snapshot_path: snapshotPath,
        normalized_from_path: normalizedPath,
      },
      freshness: {
        last_checked_date: generatedAt.slice(0, 10),
        generated_at: generatedAt,
        stale_after_date: null,
        freshness_note: 'Live NAR official race-list and race-detail extraction.',
      },
      notes: 'NAR public-safe race schedule metadata only. No runners, horses, jockeys, trainers, odds, results, payouts, predictions, or raw HTML are stored.',
    };
    const existing = meetingMap.get(record.meeting_id);
    if (!existing || rankOrder.indexOf(candidate.capability_rank) >= rankOrder.indexOf(existing.capability_rank)) {
      meetingMap.set(record.meeting_id, candidate);
    }
  }

  for (const detail of details) detailMap.set(detail.meeting_id, detail);

  writeJson(canonicalMeetingsPath, {
    ...canonical,
    generated_at: generatedAt,
    input_sources: [...new Set([...(canonical.input_sources ?? []), normalizedPath])],
    meetings: [...meetingMap.values()].sort((left, right) =>
      `${left.date}:${left.country_id}:${left.racecourse_id}`.localeCompare(`${right.date}:${right.country_id}:${right.racecourse_id}`),
    ),
  });

  writeJson(canonicalDetailsPath, {
    ...canonicalDetails,
    generated_at: generatedAt,
    input_sources: [...new Set([...(canonicalDetails.input_sources ?? []), detailsPath])],
    details: [...detailMap.values()].sort((left, right) => left.meeting_id.localeCompare(right.meeting_id)),
  });

  execFileSync(process.execPath, ['scripts/timetable/build-public-timetable-view.mjs'], {
    cwd: root,
    stdio: 'inherit',
  });
}

const range = parseArgs(process.argv.slice(2));
const generatedAt = new Date().toISOString();
const observations = [];
const reportRows = [];
const meetings = [];

for (const date of enumerateDates(range.from, range.to)) {
  for (const venue of venues) {
    const officialSourceUrl = listUrl(date, venue.code);
    console.log(`[refresh-nar] ${date} ${venue.name_en} ${officialSourceUrl}`);
    const response = await fetchPage(officialSourceUrl);

    if (!response.ok) {
      reportRows.push({
        date,
        racecourse_id: venue.id,
        racecourse_code: venue.code,
        official_source_url: officialSourceUrl,
        status: response.network_error ? 'network_error' : 'http_error',
        http_status: response.http_status,
        final_url: response.final_url,
        content_type: response.content_type,
        body_size: response.body_size,
        network_error: response.network_error,
      });
      continue;
    }

    const listRows = meetingHeaderMatches(response.body, date, venue)
      ? parseListRows(response.body, officialSourceUrl)
      : [];

    if (!listRows.length) {
      reportRows.push({
        date,
        racecourse_id: venue.id,
        racecourse_code: venue.code,
        official_source_url: officialSourceUrl,
        status: 'no_meeting',
        http_status: response.http_status,
        final_url: response.final_url,
        content_type: response.content_type,
        body_size: response.body_size,
        race_count: 0,
      });
      continue;
    }

    const rows = await enrichRows(listRows);
    const rank = rankRows(rows);
    const meeting = {
      meeting_id: `nar-${venue.id}-${date}`,
      country_id: 'japan',
      authority_id: 'nar-local-government-racing',
      racecourse_id: venue.id,
      racecourse_name: venue.name_en,
      date,
      timezone: 'Asia/Tokyo',
      capability_rank: rank,
      first_race_time_local: rows[0]?.post_time_local ?? null,
      last_race_time_local: rows.length >= 2 ? rows.at(-1)?.post_time_local ?? null : null,
      official_source_url: officialSourceUrl,
      continuous_from_one: isContinuous(rows),
      missing_fields: [...new Set(rows.flatMap(rowMissingFields))],
      timetable_rows: rows,
    };
    meetings.push(meeting);
    observations.push({
      date,
      racecourse_id: venue.id,
      racecourse_code: venue.code,
      official_source_url: officialSourceUrl,
      http_status: response.http_status,
      final_url: response.final_url,
      content_type: response.content_type,
      body_size: response.body_size,
      meeting,
    });
    reportRows.push({
      date,
      racecourse_id: venue.id,
      racecourse_code: venue.code,
      official_source_url: officialSourceUrl,
      status: 'meeting_extracted',
      http_status: response.http_status,
      final_url: response.final_url,
      content_type: response.content_type,
      body_size: response.body_size,
      rank,
      race_count: rows.length,
      missing_fields: meeting.missing_fields,
      incomplete_races: rows
        .map((row) => ({ race_number: row.race_number, missing_fields: rowMissingFields(row) }))
        .filter((row) => row.missing_fields.length),
    });
  }
}

const publishable = meetings.filter((meeting) => ['B', 'B+', 'A', 'A+'].includes(meeting.capability_rank));
const details = publishable
  .filter((meeting) => ['A', 'A+'].includes(meeting.capability_rank))
  .map((meeting) => ({
    meeting_id: meeting.meeting_id,
    country_id: meeting.country_id,
    authority_id: meeting.authority_id,
    racecourse_id: meeting.racecourse_id,
    date: meeting.date,
    timezone: meeting.timezone,
    capability_rank: meeting.capability_rank,
    source_trace: {
      source_id: 'nar-official-race-list-and-deba-table',
      route_id: 'nar-race-list-detail',
      source_status: 'verified',
      official_source_url: meeting.official_source_url,
      source_label: 'NAR official race list and race detail pages',
      extraction_method: 'live_fetch_a_plus_first',
      source_snapshot_path: snapshotPath,
      normalized_from_path: detailsPath,
    },
    freshness: {
      last_checked_date: generatedAt.slice(0, 10),
      generated_at: generatedAt,
      stale_after_date: null,
      freshness_note: 'Live NAR official race-list and race-detail extraction.',
    },
    timetable_rows: meeting.timetable_rows.map((row) => ({
      label: row.label,
      post_time_local: row.post_time_local,
      race_name: row.race_name,
      distance_m: row.distance_m,
      surface: row.surface,
      course_label: row.course_label,
      metadata_status: meeting.capability_rank === 'A+' ? 'verified' : 'partial',
    })),
    summary_note: 'Public-safe NAR race name, scheduled post time, distance, surface, and course layout.',
  }));

writeJson(snapshotPath, {
  schema_version: 'nar-racecard-source-snapshot-v0',
  generated_at: generatedAt,
  refresh_window: range,
  storage_policy: 'public_safe_extracted_fields_only_no_raw_html',
  observations,
});
writeJson(normalizedPath, {
  schema_version: 'nar-normalized-timetable-v0',
  generated_at: generatedAt,
  refresh_window: range,
  records: publishable.map(({ timetable_rows, ...meeting }) => meeting),
});
writeJson(detailsPath, {
  schema_version: 'nar-normalized-meeting-details-v0',
  generated_at: generatedAt,
  refresh_window: range,
  details,
});
writeJson(reportPath, {
  schema_version: 'nar-refresh-report-v0',
  generated_at: generatedAt,
  refresh_window: range,
  venue_dates_checked: reportRows.length,
  meetings_extracted: meetings.length,
  publishable_meetings: publishable.length,
  a_plus_meetings: details.filter((meeting) => meeting.capability_rank === 'A+').length,
  a_level_meetings: details.filter((meeting) => meeting.capability_rank === 'A').length,
  statuses: reportRows,
});

mergeIntoCanonical(publishable, details, generatedAt);
console.log(
  `[refresh-nar] complete meetings=${meetings.length} publishable=${publishable.length} A+=${details.filter((meeting) => meeting.capability_rank === 'A+').length} A=${details.filter((meeting) => meeting.capability_rank === 'A').length}`,
);
