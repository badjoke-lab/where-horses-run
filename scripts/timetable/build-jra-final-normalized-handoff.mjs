import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildJraFinalNormalizedHandoff } from './jra-final-normalized-handoff-core.mjs';

const root = process.cwd();
const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const valueOf = (name) => {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : null;
};

function readJson(file) {
  const absolute = path.isAbsolute(file) ? file : path.join(root, file);
  if (!existsSync(absolute)) throw new Error(`Missing JSON input: ${file}`);
  return JSON.parse(readFileSync(absolute, 'utf8'));
}

const finalPath = valueOf('--final');
const outputPath = valueOf('--output');
if (!finalPath) throw new Error('--final is required.');
if (!dryRun && !outputPath) throw new Error('--output is required unless --dry-run is used.');

const planned = readJson('data/generated/timetable/jra-planned-program-intake.json');
const final = readJson(finalPath);
const control = readJson('data/static/jra-pilot-control.json');
const readinessRegistry = readJson('data/static/calendar-readiness-registry.json');
const authorityInventory = readJson('data/static/authority-source-inventory.json');

const handoff = buildJraFinalNormalizedHandoff({
  planned,
  final,
  control,
  readinessRegistry,
  authorityInventory
});

if (dryRun) {
  console.log(JSON.stringify({
    generated_at: handoff.generated_at,
    meeting_count: handoff.normalized_meetings.records.length,
    detail_count: handoff.normalized_details.details.length,
    refresh_window: handoff.normalized_meetings.refresh_window,
    next_command: handoff.target_contract.next_command,
    candidate_review_state: handoff.target_contract.candidate_review_state
  }, null, 2));
  process.exit(0);
}

const absoluteOutput = path.resolve(outputPath);
const relativeToRoot = path.relative(root, absoluteOutput);
if (relativeToRoot && !relativeToRoot.startsWith('..') && !path.isAbsolute(relativeToRoot)) {
  throw new Error('JRA final normalized handoff output must be outside the repository.');
}

mkdirSync(path.dirname(absoluteOutput), { recursive: true });
writeFileSync(absoluteOutput, `${JSON.stringify(handoff, null, 2)}\n`);
console.log(`JRA_FINAL_NORMALIZED_HANDOFF: wrote ${absoluteOutput}`);
console.log(`MEETINGS: ${handoff.normalized_meetings.records.length}`);
console.log(`DETAILS: ${handoff.normalized_details.details.length}`);
console.log('REPOSITORY_WRITE_PERFORMED: false');
