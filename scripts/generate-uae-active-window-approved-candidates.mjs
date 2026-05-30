import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputPath = path.join(root, 'data/candidates/uae-active-window-approved-candidates.json');
const checkOnly = process.argv.includes('--check');

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
}

function appendNote(notes) {
  const existingNotes = typeof notes === 'string' && notes.trim() ? `${notes.trim()} ` : '';
  return `${existingNotes}PR-077 approved active-window review bundle.`;
}

function notesFor(records) {
  if (records.length > 0) {
    return 'Reviewed UAE active-window bundle from ERA candidates.';
  }

  return 'Season gap: no active-window UAE ERA meetings are present in the source candidate window. This approved candidate bundle is not public coverage.';
}

const sourceFile = readJson('data/candidates/uae-era-candidates.json');
const generatedAt = sourceFile.generated_at;
const records = (sourceFile.records ?? [])
  .map((record) => ({
    ...record,
    status: 'source-reviewed',
    review_status: 'approved',
    notes: appendNote(record.notes)
  }))
  .sort((a, b) => `${a.date}:${a.racing_system_id}:${a.racecourse_id}`.localeCompare(`${b.date}:${b.racing_system_id}:${b.racecourse_id}`));

const candidateFile = {
  schema_version: 'timetable-candidates-v0',
  generated_at: generatedAt,
  source_adapter_id: 'uae-active-window-reviewed-bundle',
  country_id: 'united-arab-emirates',
  candidate_window: sourceFile.candidate_window,
  records,
  notes: notesFor(records),
  review: {
    review_status: 'approved',
    reviewed_at: generatedAt,
    reviewer: 'PR-077',
    summary: 'Reviewed UAE active-window bundle from ERA candidates. If records are absent, this remains a season gap and is not public coverage.',
    promotion_target: records.length > 0 ? 'data/generated/timetables.json' : null
  }
};

const serialized = `${JSON.stringify(candidateFile, null, 2)}\n`;

if (checkOnly) {
  if (!existsSync(outputPath)) {
    console.error(`Missing candidate output: ${path.relative(root, outputPath)}`);
    process.exit(1);
  }
  if (readFileSync(outputPath, 'utf8') !== serialized) {
    console.error('UAE active-window approved candidate output is stale. Run: node scripts/generate-uae-active-window-approved-candidates.mjs');
    process.exit(1);
  }
  console.log('UAE active-window approved candidate output is up to date.');
} else {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, serialized);
  console.log(`Wrote ${path.relative(root, outputPath)} with ${candidateFile.records.length} records.`);
}
