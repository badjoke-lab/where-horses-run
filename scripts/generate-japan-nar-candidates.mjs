import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputPath = path.join(root, 'data/candidates/japan-nar-candidates.json');
const checkOnly = process.argv.includes('--check');

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
}

function addDays(dateText, days) {
  const date = new Date(`${dateText}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function candidateIdFor(record) {
  return `japan-nar-${record.date}-${record.racecourse_id.replace(/-racecourse$/, '')}`;
}

function buildCandidateFile() {
  const overlay = readJson('data/generated/japan-active-timetable-records.json');
  const generatedAt = overlay.generated_at;
  const startDate = generatedAt.slice(0, 10);
  const records = (overlay.records ?? [])
    .filter((record) => record.country_id === 'japan')
    .filter((record) => record.source_id === 'japan-nar-home')
    .filter((record) => String(record.racing_type ?? '').includes('NAR'))
    .map((record) => ({
      candidate_id: candidateIdFor(record),
      country_id: 'japan',
      racing_system_id: 'nar',
      racecourse_id: record.racecourse_id,
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
      notes: 'NAR meeting-level candidate generated from the existing safe timetable overlay. Official source remains final confirmation.'
    }))
    .sort((a, b) => `${a.date}:${a.racecourse_id}`.localeCompare(`${b.date}:${b.racecourse_id}`));

  return {
    schema_version: 'timetable-candidates-v0',
    generated_at: generatedAt,
    source_adapter_id: 'japan-nar-dry-run-adapter',
    country_id: 'japan',
    candidate_window: {
      start_date: startDate,
      end_date_exclusive: addDays(startDate, 30),
      timezone: 'Asia/Tokyo'
    },
    records,
    review: {
      review_status: 'needs_review',
      reviewed_at: null,
      reviewer: null,
      summary: 'Dry-run candidate file generated from existing safe NAR meeting-level timetable overlay. It is not published coverage until reviewed and promoted.',
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
    console.error('Japan NAR candidate output is stale. Run: npm run generate:japan-nar-candidates');
    process.exit(1);
  }
  console.log('Japan NAR candidate output is up to date.');
} else {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, serialized);
  console.log(`Wrote ${path.relative(root, outputPath)} with ${candidateFile.records.length} records.`);
}
