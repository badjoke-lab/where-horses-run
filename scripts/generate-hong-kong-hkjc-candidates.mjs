import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputPath = path.join(root, 'data/candidates/hong-kong-hkjc-candidates.json');
const checkOnly = process.argv.includes('--check');

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
}

function addDays(dateText, days) {
  const date = new Date(`${dateText}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function normalizeRacecourseId(record) {
  if (record.racecourse_id) return record.racecourse_id;
  if (record.racecourse_name === 'Happy Valley') return 'happy-valley-racecourse';
  throw new Error(`Missing racecourse_id for ${record.racecourse_name}`);
}

function candidateIdFor(record) {
  return `hong-kong-hkjc-${record.date}-${normalizeRacecourseId(record).replace(/-racecourse$/, '')}`;
}

function buildCandidateFile() {
  const timetables = readJson('data/generated/timetables.json');
  const generatedAt = timetables.generated_at;
  const startDate = generatedAt.slice(0, 10);
  const records = (timetables.records ?? [])
    .filter((record) => record.country_id === 'hong-kong')
    .filter((record) => record.source_id === 'hong-kong-hkjc-home')
    .map((record) => ({
      candidate_id: candidateIdFor(record),
      country_id: 'hong-kong',
      racing_system_id: 'hkjc',
      racecourse_id: normalizeRacecourseId(record),
      racecourse_name: record.racecourse_name,
      date: record.date,
      start_time_local: record.start_time_local,
      timezone: record.timezone,
      racing_type: record.racing_type,
      source_id: record.source_id,
      source_url: record.source_url,
      source_checked_at: record.last_checked_at,
      extraction_method: 'adapter_dry_run',
      status: 'candidate',
      confidence: record.confidence,
      review_status: 'needs_review',
      notes: 'HKJC meeting-level candidate generated from the existing safe timetable seed. Official source remains final confirmation.'
    }))
    .sort((a, b) => `${a.date}:${a.racecourse_id}`.localeCompare(`${b.date}:${b.racecourse_id}`));

  return {
    schema_version: 'timetable-candidates-v0',
    generated_at: generatedAt,
    source_adapter_id: 'hong-kong-hkjc-dry-run-adapter',
    country_id: 'hong-kong',
    candidate_window: {
      start_date: startDate,
      end_date_exclusive: addDays(startDate, 30),
      timezone: 'Asia/Hong_Kong'
    },
    records,
    review: {
      review_status: 'needs_review',
      reviewed_at: null,
      reviewer: null,
      summary: 'Dry-run candidate file generated from existing safe HKJC meeting-level timetable seed. It is not published coverage until reviewed and promoted.',
      promotion_target: null
    }
  };
}

const candidateFile = buildCandidateFile();
const serialized = `${JSON.stringify(candidateFile, null, 2)}\n`;

if (checkOnly) {
  if (!existsSync(outputPath)) process.exit(1);
  if (readFileSync(outputPath, 'utf8') !== serialized) process.exit(1);
  console.log('Hong Kong HKJC candidate output is up to date.');
} else {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, serialized);
  console.log(`Wrote ${path.relative(root, outputPath)} with ${candidateFile.records.length} records.`);
}
