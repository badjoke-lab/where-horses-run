import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const timeoutMs = 20000;
const snapshotPath = 'data/generated/timetable/jra-race-time-snapshot.json';
const normalizedPath = 'data/generated/timetable/jra-normalized-timetable.json';
const detailsPath = 'data/generated/timetable/jra-normalized-meeting-details.json';
const reportPath = 'data/generated/timetable/jra-refresh-report.json';
const canonicalMeetingsPath = 'data/generated/timetable/canonical/meetings.json';
const canonicalDetailsPath = 'data/generated/timetable/canonical/meeting-details.json';

const racecourses = {
  '札幌': { id: 'sapporo-racecourse', name: 'Sapporo' },
  '函館': { id: 'hakodate-racecourse', name: 'Hakodate' },
  '福島': { id: 'fukushima-racecourse', name: 'Fukushima' },
  '新潟': { id: 'niigata-racecourse', name: 'Niigata' },
  '東京': { id: 'tokyo-racecourse', name: 'Tokyo' },
  '中山': { id: 'nakayama-racecourse', name: 'Nakayama' },
  '中京': { id: 'chukyo-racecourse', name: 'Chukyo' },
  '京都': { id: 'kyoto-racecourse', name: 'Kyoto' },
  '阪神': { id: 'hanshin-racecourse', name: 'Hanshin' },
  '小倉': { id: 'kokura-racecourse', name: 'Kokura' },
};

function parseArgs(argv) {
  const values = {};
  for (const arg of argv) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) values[match[1]] = match[2];
  }
  if (!values.from || !values.to) {
    throw new Error('Usage: node scripts/timetable/refresh-jra.mjs --from=YYYY-MM-DD --to=YYYY-MM-DD');
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

function officialUrl(date) {
  const [year, month, day] = date.split('-');
  return `https://jra.jp/keiba/calendar${year}/${year}/${Number(month)}/${month}${day}.html`;
}

function decodeEntities(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x2F;|&#47;/gi, '/')
    .replace(/&#x3A;|&#58;/gi, ':');
}

function decodeBody(buffer) {
  const encodings = ['shift_jis', 'utf-8'];
  const candidates = encodings.map((encoding) => {
    try {
      const text = new TextDecoder(encoding).decode(buffer);
      const score = ['発走時刻', 'レース', ...Object.keys(racecourses)]
        .reduce((total, token) => total + (text.split(token).length - 1), 0);
      return { encoding, text, score };
    } catch {
      return { encoding, text: '', score: -1 };
    }
  });
  candidates.sort((left, right) => right.score - left.score);
  return candidates[0];
}

function stripHtml(html) {
  return decodeEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:div|section|article|table|thead|tbody|tr|td|th|li|ul|ol|p|h[1-6]|dl|dt|dd)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t\u3000]+/g, ' ')
    .replace(/\r/g, '')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
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
    const buffer = await response.arrayBuffer();
    const decoded = decodeBody(buffer);
    return {
      ok: response.ok,
      http_status: response.status,
      final_url: response.url,
      content_type: response.headers.get('content-type'),
      body_size: buffer.byteLength,
      encoding: decoded.encoding,
      body: decoded.text,
      network_error: null,
    };
  } catch (error) {
    return {
      ok: false,
      http_status: null,
      final_url: url,
      content_type: null,
      body_size: 0,
      encoding: null,
      body: '',
      network_error: String(error?.cause?.code ?? error?.message ?? error),
    };
  } finally {
    clearTimeout(timer);
  }
}

function normalizeTime(hour, minute) {
  return `${String(Number(hour)).padStart(2, '0')}:${String(Number(minute)).padStart(2, '0')}`;
}

function extractRaceRows(block) {
  const rows = new Map();
  const patterns = [
    /(\d{1,2})\s*(?:レース|R)\b[\s\S]{0,600}?発走時刻\s*(\d{1,2})\s*時\s*(\d{1,2})\s*分/gi,
    /(\d{1,2})\s*(?:レース|R)\b[\s\S]{0,600}?(\d{1,2})\s*時\s*(\d{1,2})\s*分/gi,
    /(\d{1,2})\s*(?:レース|R)\b[\s\S]{0,300}?(\d{1,2})\s*[:：]\s*(\d{2})/gi,
  ];

  for (const pattern of patterns) {
    for (const match of block.matchAll(pattern)) {
      const raceNumber = Number(match[1]);
      const hour = Number(match[2]);
      const minute = Number(match[3]);
      if (raceNumber < 1 || raceNumber > 30 || hour > 23 || minute > 59) continue;
      if (!rows.has(raceNumber)) {
        rows.set(raceNumber, {
          race_number: raceNumber,
          label: `Race ${raceNumber}`,
          post_time_local: normalizeTime(hour, minute),
        });
      }
    }
  }

  return [...rows.values()].sort((left, right) => left.race_number - right.race_number);
}

function isContinuous(rows) {
  return rows.length >= 2 && rows.every((row, index) => row.race_number === index + 1);
}

function parseMeetings(date, html, sourceUrl) {
  const text = stripHtml(html);
  const headingPattern = /(\d+)\s*回\s*(札幌|函館|福島|新潟|東京|中山|中京|京都|阪神|小倉)\s*(\d+)\s*日/g;
  const headings = [...text.matchAll(headingPattern)];
  const meetings = [];

  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    const next = headings[index + 1];
    const block = text.slice(heading.index, next?.index ?? text.length);
    const venue = racecourses[heading[2]];
    const rows = extractRaceRows(block);
    if (rows.length === 0) continue;

    const continuous = isContinuous(rows);
    const rank = continuous ? 'A' : rows.length >= 2 ? 'B+' : 'B';
    meetings.push({
      meeting_id: `jra-${venue.id}-${date}`,
      country_id: 'japan',
      authority_id: 'jra',
      racecourse_id: venue.id,
      racecourse_name: venue.name,
      meeting_label_ja: `${heading[1]}回${heading[2]}${heading[3]}日`,
      date,
      timezone: 'Asia/Tokyo',
      capability_rank: rank,
      first_race_time_local: rows[0]?.post_time_local ?? null,
      last_race_time_local: rows.length >= 2 ? rows.at(-1)?.post_time_local ?? null : null,
      official_source_url: sourceUrl,
      continuous_from_one: continuous,
      timetable_rows: rows.map((row) => ({
        label: row.label,
        post_time_local: row.post_time_local,
        race_name: null,
        distance_m: null,
        surface: null,
        course_label: null,
        metadata_status: 'verified',
      })),
    });
  }

  const unique = new Map();
  for (const meeting of meetings) {
    const existing = unique.get(meeting.meeting_id);
    if (!existing || meeting.timetable_rows.length > existing.timetable_rows.length) {
      unique.set(meeting.meeting_id, meeting);
    }
  }
  return [...unique.values()];
}

function mergeIntoCanonical(records, details, generatedAt) {
  execFileSync(process.execPath, ['scripts/timetable/build-canonical-timetable.mjs'], {
    cwd: root,
    stdio: 'inherit',
  });

  const canonical = readJson(canonicalMeetingsPath);
  const canonicalDetails = readJson(canonicalDetailsPath);
  const rankOrder = ['not_listed', 'D', 'C', 'B', 'B+', 'A', 'A+'];
  const meetingMap = new Map((canonical.meetings ?? []).map((meeting) => [meeting.meeting_id, meeting]));

  for (const record of records) {
    const candidate = {
      meeting_id: record.meeting_id,
      country_id: record.country_id,
      authority_id: record.authority_id,
      racecourse_id: record.racecourse_id,
      date: record.date,
      timezone: record.timezone,
      capability_rank: record.capability_rank,
      display_status: 'displayable',
      first_race_time_local: record.first_race_time_local,
      last_race_time_local: record.last_race_time_local,
      source_trace: {
        source_id: 'jra-calendar-date-program',
        route_id: 'jra-calendar-date-page',
        source_status: 'verified',
        official_source_url: record.official_source_url,
        source_label: 'JRA official calendar/program page',
        extraction_method: 'live_fetch_parser',
        source_snapshot_path: snapshotPath,
        normalized_from_path: normalizedPath,
      },
      freshness: {
        last_checked_date: generatedAt.slice(0, 10),
        generated_at: generatedAt,
        stale_after_date: null,
        freshness_note: 'Live JRA official date-page extraction.',
      },
      notes: 'JRA official date-page race times. No runners, odds, results, payouts, predictions, or raw HTML are stored.',
    };
    const existing = meetingMap.get(record.meeting_id);
    if (!existing || rankOrder.indexOf(candidate.capability_rank) >= rankOrder.indexOf(existing.capability_rank)) {
      meetingMap.set(record.meeting_id, candidate);
    }
  }

  const detailMap = new Map((canonicalDetails.details ?? []).map((detail) => [detail.meeting_id, detail]));
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

  execFileSync(process.execPath, ['scripts/timetable/merge-hkjc-normalized-into-canonical.mjs'], {
    cwd: root,
    stdio: 'inherit',
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

for (const date of enumerateDates(range.from, range.to)) {
  const url = officialUrl(date);
  console.log(`[refresh-jra] ${date} ${url}`);
  const response = await fetchPage(url);
  if (!response.ok) {
    reportRows.push({
      date,
      official_source_url: url,
      status: response.http_status === 404 ? 'no_racing_page' : response.network_error ? 'network_error' : 'http_error',
      http_status: response.http_status,
      final_url: response.final_url,
      content_type: response.content_type,
      body_size: response.body_size,
      encoding: response.encoding,
      network_error: response.network_error,
    });
    continue;
  }

  const meetings = parseMeetings(date, response.body, url);
  observations.push({
    date,
    official_source_url: url,
    http_status: response.http_status,
    final_url: response.final_url,
    content_type: response.content_type,
    body_size: response.body_size,
    encoding: response.encoding,
    meetings,
  });
  reportRows.push({
    date,
    official_source_url: url,
    status: meetings.length > 0 ? 'meetings_extracted' : 'no_meetings_extracted',
    http_status: response.http_status,
    final_url: response.final_url,
    content_type: response.content_type,
    body_size: response.body_size,
    encoding: response.encoding,
    meeting_count: meetings.length,
    ranks: meetings.reduce((counts, meeting) => {
      counts[meeting.capability_rank] = (counts[meeting.capability_rank] ?? 0) + 1;
      return counts;
    }, {}),
  });
}

const meetings = observations.flatMap((observation) => observation.meetings);
const publishable = meetings.filter((meeting) => ['B', 'B+', 'A', 'A+'].includes(meeting.capability_rank));
const details = publishable
  .filter((meeting) => meeting.capability_rank === 'A' || meeting.capability_rank === 'A+')
  .map((meeting) => ({
    meeting_id: meeting.meeting_id,
    country_id: meeting.country_id,
    authority_id: meeting.authority_id,
    racecourse_id: meeting.racecourse_id,
    date: meeting.date,
    timezone: meeting.timezone,
    capability_rank: meeting.capability_rank,
    source_trace: {
      source_id: 'jra-calendar-date-program',
      route_id: 'jra-calendar-date-page',
      source_status: 'verified',
      official_source_url: meeting.official_source_url,
      source_label: 'JRA official calendar/program page',
      extraction_method: 'live_fetch_parser',
      source_snapshot_path: snapshotPath,
      normalized_from_path: detailsPath,
    },
    freshness: {
      last_checked_date: generatedAt.slice(0, 10),
      generated_at: generatedAt,
      stale_after_date: null,
      freshness_note: 'Live JRA official date-page extraction.',
    },
    timetable_rows: meeting.timetable_rows,
    summary_note: 'Public-safe JRA race labels and scheduled post times only.',
  }));

writeJson(snapshotPath, {
  schema_version: 'jra-race-time-snapshot-v0',
  generated_at: generatedAt,
  refresh_window: range,
  storage_policy: 'public_safe_extracted_fields_only_no_raw_html',
  observations,
});
writeJson(normalizedPath, {
  schema_version: 'jra-normalized-timetable-v0',
  generated_at: generatedAt,
  refresh_window: range,
  records: publishable.map(({ timetable_rows, ...meeting }) => meeting),
});
writeJson(detailsPath, {
  schema_version: 'jra-normalized-meeting-details-v0',
  generated_at: generatedAt,
  refresh_window: range,
  details,
});
writeJson(reportPath, {
  schema_version: 'jra-refresh-report-v0',
  generated_at: generatedAt,
  refresh_window: range,
  dates_checked: reportRows.length,
  meetings_extracted: meetings.length,
  publishable_meetings: publishable.length,
  a_level_meetings: details.length,
  statuses: reportRows,
});

mergeIntoCanonical(publishable, details, generatedAt);
console.log(`[refresh-jra] complete meetings=${meetings.length} publishable=${publishable.length} A=${details.length}`);
