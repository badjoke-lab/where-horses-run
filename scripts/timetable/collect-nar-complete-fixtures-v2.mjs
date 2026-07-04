import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const matrixPath = 'data/static/nar-flat-racecourse-compatibility-v1.json';
const fixtureDir = 'data/fixtures/timetable/nar/complete-meetings';
const reportPath = 'data/generated/timetable/nar-complete-fixture-report.json';
const timeoutMs = 25_000;
const delayMs = 180;

function parseArgs(argv) {
  const args = { all: false, dryRun: false, venueCode: null };
  for (const value of argv) {
    if (value === '--all') args.all = true;
    else if (value === '--dry-run') args.dryRun = true;
    else if (value.startsWith('--venue-code=')) args.venueCode = value.slice('--venue-code='.length);
    else throw new Error(`Unknown argument: ${value}`);
  }
  if (args.all === Boolean(args.venueCode)) {
    throw new Error('Use exactly one of --all or --venue-code=NN.');
  }
  if (args.venueCode && !/^\d{2}$/.test(args.venueCode)) {
    throw new Error('--venue-code must contain two digits.');
  }
  return args;
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function writeJson(relativePath, value) {
  const absolute = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`);
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

function text(value) {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:tr|td|th|div|section|article|p|li|h[1-6]|a)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t\u3000]+/g, ' ')
    .replace(/\r/g, '')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function compact(value) {
  return text(value).replace(/\s+/g, ' ').trim();
}

function decodeBody(buffer, venueName) {
  const tokens = ['競馬', '発走', '競走', '距離', venueName];
  return ['utf-8', 'shift_jis']
    .map((encoding) => {
      try {
        const body = new TextDecoder(encoding).decode(buffer);
        const score = tokens.reduce((sum, token) => sum + body.split(token).length - 1, 0);
        return { encoding, body, score };
      } catch {
        return { encoding, body: '', score: -1 };
      }
    })
    .sort((a, b) => b.score - a.score)[0];
}

async function fetchPage(url, venueName) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; review-controlled fixture collector)',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'ja,en-US;q=0.8,en;q=0.6',
      },
    });
    const buffer = await response.arrayBuffer();
    const decoded = decodeBody(buffer, venueName);
    return {
      ok: response.ok,
      status: response.status,
      finalUrl: response.url,
      contentType: response.headers.get('content-type'),
      bodySize: buffer.byteLength,
      encoding: decoded.encoding,
      body: decoded.body,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      finalUrl: url,
      contentType: null,
      bodySize: 0,
      encoding: null,
      body: '',
      error: String(error?.cause?.code ?? error?.message ?? error),
    };
  } finally {
    clearTimeout(timer);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeTime(value) {
  const match = String(value ?? '').match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function detailUrl(record, raceNumber) {
  const params = new URLSearchParams({
    k_babaCode: record.venue_code,
    k_raceDate: record.official_race_list_date.replaceAll('-', '/'),
    k_raceNo: String(raceNumber),
  });
  return `https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/DebaTable?${params}`;
}

function discoverRaceNumbers(html) {
  const found = new Set();
  for (const match of html.matchAll(/[?&]k_raceNo=(\d{1,2})(?:&|["'])/gi)) {
    const value = Number(match[1]);
    if (value >= 1 && value <= 30) found.add(value);
  }
  for (const match of text(html).matchAll(/(?:^|\s)(\d{1,2})\s*R(?:\s|$)/gi)) {
    const value = Number(match[1]);
    if (value >= 1 && value <= 30) found.add(value);
  }
  return [...found].sort((a, b) => a - b);
}

function continuousFromOne(numbers) {
  return numbers.length >= 2 && numbers.every((value, index) => value === index + 1);
}

function raceName(block, raceNumber) {
  for (const match of block.matchAll(/<a\b[^>]*href=["'][^"']*(?:D[ea]baTable|S_DebaTable)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const value = compact(match[1]);
    if (value && !/(出馬表|詳細|オッズ|結果)/.test(value)) return value;
  }
  const lines = text(block)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) => !new RegExp(`^${raceNumber}\s*R$`, 'i').test(line))
    .filter((line) => !/^\d{1,2}:\d{2}$/.test(line))
    .filter((line) => !/^(?:ダート|芝)?\s*[右左]\s*\d{3,4}\s*[mｍＭ]$/.test(line))
    .filter((line) => !/(出馬表|オッズ|結果|払戻|映像|予想|投票|変更情報|頭数)/.test(line));
  return lines.find((line) => line.length >= 2 && line.length <= 120) ?? null;
}

function parseListRows(html, record) {
  const rows = new Map();
  const blocks = [...html.matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)].map((match) => match[0]);
  for (const block of blocks) {
    const plain = compact(block);
    const hrefRace = block.match(/[?&]k_raceNo=(\d{1,2})(?:&|["'])/i);
    const raceMatch = hrefRace ?? plain.match(/(?:^|\s)(\d{1,2})\s*R(?:\s|$)/i);
    const timeMatch = plain.match(/(?:^|\s)(\d{1,2}:\d{2})(?:\s|$)/);
    const courseMatch = plain.match(/(?:(ダート|芝))?\s*([右左])?\s*(\d{3,4})\s*[mｍＭ]/);
    if (!raceMatch || !timeMatch || !courseMatch) continue;
    const raceNumber = Number(raceMatch[1]);
    const distance = Number(courseMatch[3]);
    if (raceNumber < 1 || raceNumber > 30 || distance < 600 || distance > 6000) continue;
    const name = raceName(block, raceNumber);
    if (!name) continue;
    rows.set(raceNumber, {
      race_number: raceNumber,
      label: `Race ${raceNumber}`,
      post_time_local: normalizeTime(timeMatch[1]),
      race_name: name,
      distance_m: distance,
      list_surface_raw: courseMatch[1] ?? null,
      list_direction_raw: courseMatch[2] ?? null,
      detail_url: detailUrl(record, raceNumber),
    });
  }
  return [...rows.values()].sort((a, b) => a.race_number - b.race_number);
}

function courseLabel(surface, direction) {
  const labels = [surface === 'Turf' ? 'Turf Course' : 'Dirt Course'];
  if (direction === 'right') labels.push('Right');
  if (direction === 'left') labels.push('Left');
  return labels.join(' / ');
}

function surfaceFromRaw(raw) {
  if (raw === '芝') return 'Turf';
  if (raw === 'ダート') return 'Dirt';
  return null;
}

function directionFromRaw(raw) {
  if (raw === '右') return 'right';
  if (raw === '左') return 'left';
  return null;
}

function directionFromRecord(record) {
  if (record.course_direction === 'left') return 'left';
  if (record.course_direction === 'right') return 'right';
  return null;
}

function safeRaceListFallback(row, record) {
  const surface = surfaceFromRaw(row.list_surface_raw)
    ?? (record.surfaces?.length === 1 && record.surfaces.includes('dirt') ? 'Dirt' : null);
  const direction = directionFromRaw(row.list_direction_raw) ?? directionFromRecord(record);
  if (!surface || !direction) return null;
  if (surface === 'Turf' && !record.surfaces?.includes('turf')) return null;
  if (surface === 'Dirt' && !record.surfaces?.includes('dirt')) return null;
  if (!Number.isInteger(row.distance_m)) return null;
  return {
    surface,
    distance_m: row.distance_m,
    course_label: courseLabel(surface, direction),
    source: 'race_list_and_racecourse_matrix',
  };
}

function parseDetail(html) {
  const plain = compact(html);
  const patterns = [
    /(ダート|芝)\s*(\d{3,4})\s*[mｍＭ]\s*[（(]([^）)]+)[）)]/,
    /([右左])\s*(ダート|芝)\s*(\d{3,4})\s*[mｍＭ]/,
    /(ダート|芝)\s*([右左])\s*(\d{3,4})\s*[mｍＭ]/,
  ];
  let surfaceRaw = null;
  let distance = null;
  let courseRaw = '';
  for (const [index, pattern] of patterns.entries()) {
    const match = plain.match(pattern);
    if (!match) continue;
    if (index === 0) [surfaceRaw, distance, courseRaw] = [match[1], Number(match[2]), match[3]];
    else if (index === 1) [courseRaw, surfaceRaw, distance] = [match[1], match[2], Number(match[3])];
    else [surfaceRaw, courseRaw, distance] = [match[1], match[2], Number(match[3])];
    break;
  }
  if (!surfaceRaw || !distance) return null;
  const surface = surfaceRaw === '芝' ? 'Turf' : 'Dirt';
  const labels = [surface === 'Turf' ? 'Turf Course' : 'Dirt Course'];
  if (/内/.test(courseRaw)) labels.push('Inner');
  if (/外/.test(courseRaw)) labels.push('Outer');
  if (/右/.test(courseRaw)) labels.push('Right');
  if (/左/.test(courseRaw)) labels.push('Left');
  return { surface, distance_m: distance, course_label: [...new Set(labels)].join(' / '), source: 'deba_table' };
}

function missingFields(row) {
  return [
    !row.label && 'label',
    !row.post_time_local && 'post_time_local',
    !row.race_name && 'race_name',
    !Number.isInteger(row.distance_m) && 'distance_m',
    !row.surface && 'surface',
    !row.course_label && 'course_label',
  ].filter(Boolean);
}

async function collect(record) {
  const list = await fetchPage(record.official_race_list_url, record.name_ja);
  if (!list.ok) return { record, status: list.error ? 'network_error' : 'http_error', list, rows: [] };

  const expected = discoverRaceNumbers(list.body);
  const parsed = parseListRows(list.body, record);
  if (!continuousFromOne(expected)) {
    return { record, status: 'race_number_discovery_incomplete', list, expected, rows: parsed };
  }
  if (JSON.stringify(parsed.map((row) => row.race_number)) !== JSON.stringify(expected)) {
    return { record, status: 'list_parser_incomplete', list, expected, rows: parsed };
  }

  const rows = [];
  for (const row of parsed) {
    await sleep(delayMs);
    const detail = await fetchPage(row.detail_url, record.name_ja);
    const detailMetadata = detail.ok ? parseDetail(detail.body) : null;
    const metadata = detailMetadata ?? safeRaceListFallback(row, record);
    rows.push({
      race_number: row.race_number,
      label: row.label,
      post_time_local: row.post_time_local,
      race_name: row.race_name,
      distance_m: metadata?.distance_m ?? row.distance_m,
      surface: metadata?.surface ?? null,
      course_label: metadata?.course_label ?? null,
      source_trace: {
        list_url: record.official_race_list_url,
        detail_url: row.detail_url,
        detail_http_status: detail.status,
        detail_encoding: detail.encoding,
        detail_parsed: Boolean(detailMetadata),
        course_metadata_source: metadata?.source ?? null,
      },
    });
  }

  const incomplete = rows
    .map((row) => ({ race_number: row.race_number, missing_fields: missingFields(row) }))
    .filter((row) => row.missing_fields.length);
  if (incomplete.length) return { record, status: 'meeting_incomplete', list, expected, rows, incomplete };

  return {
    record,
    status: 'meeting_complete',
    list,
    expected,
    rows,
    fixture: {
      schema_version: 'nar-complete-meeting-fixture-v1',
      fixture_id: `nar-${record.racecourse_id}-${record.official_race_list_date}`,
      work_id: 'WHR-CAL-JAPAN-NAR-A-PLUS',
      country_id: 'japan',
      authority_id: 'nar-local-government-racing',
      racing_system_id: 'japan-nar-system',
      racecourse_id: record.racecourse_id,
      racecourse_name_en: record.name_en,
      racecourse_name_ja: record.name_ja,
      venue_code: record.venue_code,
      date: record.official_race_list_date,
      timezone: 'Asia/Tokyo',
      source: {
        source_id: 'nar-official-race-list-and-deba-table',
        official_race_list_url: record.official_race_list_url,
        list_http_status: list.status,
        list_encoding: list.encoding,
        storage_policy: 'public_safe_extracted_fields_only_no_raw_html',
      },
      meeting_completeness: {
        expected_race_numbers: expected,
        expected_race_count: expected.length,
        observed_race_count: rows.length,
        continuous_race_numbers: true,
        all_a_plus_fields_complete: true,
      },
      timetable_rows: rows,
      review: {
        status: 'needs_review',
        promotion_eligible: false,
        reason: 'Complete fixture evidence requires human review before candidate generation.',
      },
    },
  };
}

const options = parseArgs(process.argv.slice(2));
const matrix = readJson(matrixPath);
const selected = options.all ? matrix.records : matrix.records.filter((row) => row.venue_code === options.venueCode);
if (!selected.length) throw new Error(`No matrix record matched venue code ${options.venueCode}.`);

const results = [];
for (const record of selected) {
  console.log(`[nar-fixture-v2] ${record.name_en} ${record.official_race_list_date}`);
  const result = await collect(record);
  results.push(result);
  if (result.fixture && !options.dryRun) {
    writeJson(`${fixtureDir}/${record.racecourse_id}-${record.official_race_list_date}.json`, result.fixture);
  }
}

const report = {
  schema_version: 'nar-complete-fixture-report-v2',
  generated_at: new Date().toISOString(),
  work_id: 'WHR-CAL-JAPAN-NAR-A-PLUS',
  matrix_path: matrixPath,
  collector: 'scripts/timetable/collect-nar-complete-fixtures-v2.mjs',
  mode: options.all ? 'all_14' : 'single_venue',
  dry_run: options.dryRun,
  racecourses_checked: results.length,
  complete_meetings: results.filter((row) => row.status === 'meeting_complete').length,
  failed_meetings: results.filter((row) => row.status !== 'meeting_complete').length,
  statuses: results.map((result) => ({
    venue_code: result.record.venue_code,
    racecourse_id: result.record.racecourse_id,
    date: result.record.official_race_list_date,
    status: result.status,
    expected_race_numbers: result.expected ?? [],
    race_count: result.rows.length,
    incomplete_rows: result.incomplete ?? [],
    list_http_status: result.list.status,
    list_final_url: result.list.finalUrl,
    list_encoding: result.list.encoding,
    list_network_error: result.list.error,
  })),
};

if (!options.dryRun) writeJson(reportPath, report);
console.log(JSON.stringify(report, null, 2));
if (report.complete_meetings !== results.length) process.exit(1);
