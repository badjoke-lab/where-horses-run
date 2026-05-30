import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputPath = path.join(root, 'data/candidates/uae-era-candidates.json');
const checkOnly = process.argv.includes('--check');

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
}

function addDays(dateText, days) {
  const date = new Date(`${dateText}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function isInsideWindow(record, startDate, endDateExclusive) {
  return record.date >= startDate && record.date < endDateExclusive;
}

function candidateIdFor(record) {
  return `uae-era-${record.date}-${record.racecourse_id.replace(/-racecourse$/, '').replace(/-turf-club$/, '')}`;
}

function seasonGapNotes(records) {
  if (records.length > 0) return null;
  return 'Season gap: no active-window meetings were found in the existing safe UAE ERA data for this 30-day window. This candidate file is not public coverage.';
}

function buildCandidateFile() {
  const timetables = readJson('data/generated/timetables.json');
  const generatedAt = timetables.generated_at;
  const startDate = generatedAt.slice(0, 10);
  const endDateExclusive = addDays(startDate, 30);
  const records = (timetables.records ?? [])
    .filter((record) => record.country_id === 'united-arab-emirates')
    .filter((record) => record.source_id === 'uae-era-home')
    .filter((record) => record.timezone === 'Asia/Dubai')
    .filter((record) => isInsideWindow(record, startDate, endDateExclusive))
    .map((record) => ({
      candidate_id: candidateIdFor(record),
      country_id: 'united-arab-emirates',
      racing_system_id: 'era',
      racecourse_id: record.racecourse_id,
      racecourse_name: record.racecourse_name,
      date: record.date,
      start_time_local: record.start_time_local,
      timezone: 'Asia/Dubai',
      racing_type: record.racing_type,
      source_id: record.source_id,
      source_url: record.source_url,
      source_checked_at: record.last_checked_at,
      extraction_method: 'adapter_dry_run',
      status: 'candidate',
      confidence: record.confidence,
      review_status: 'needs_review',
      notes: 'UAE ERA meeting-level candidate generated from the existing safe timetable seed. Official source remains final confirmation.'
    }))
    .sort((a, b) => `${a.date}:${a.racecourse_id}`.localeCompare(`${b.date}:${b.racecourse_id}`));

  const gapNotes = seasonGapNotes(records);

  return {
    schema_version: 'timetable-candidates-v0',
    generated_at: generatedAt,
    source_adapter_id: 'uae-era-dry-run-adapter',
    country_id: 'united-arab-emirates',
    candidate_window: {
      start_date: startDate,
      end_date_exclusive: endDateExclusive,
      timezone: 'Asia/Dubai'
    },
    records,
    notes: gapNotes,
    review: {
      review_status: 'needs_review',
      reviewed_at: null,
      reviewer: null,
      summary: 'Dry-run UAE ERA candidate file generated from existing safe UAE data. If active-window meetings are absent, this represents a season gap and is not public coverage.',
      promotion_target: null
    }
  };
}

const candidateFile = buildCandidateFile();
const serialized = `${JSON.stringify(candidateFile, null, 2)}\n`;

if (checkOnly) {
  if (!existsSync(outputPath)) {
    console.error(`Missing candidate output: ${path.relative(root, outputPath)}`);
    process.exit(1);
  }
  const current = readFileSync(outputPath, 'utf8');
  if (current !== serialized) {
    console.error('UAE ERA candidate output is stale. Run: node scripts/generate-uae-era-candidates.mjs');
    process.exit(1);
  }
  console.log('UAE ERA candidate output is up to date.');
} else {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, serialized);
  console.log(`Wrote ${path.relative(root, outputPath)} with ${candidateFile.records.length} records.`);
}
