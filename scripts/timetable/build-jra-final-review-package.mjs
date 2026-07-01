import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildJraFinalReviewPackage } from './jra-final-review-package-core.mjs';

const root = process.cwd();
const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const valueOf = (name) => {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : null;
};

function repoJson(file) {
  return JSON.parse(readFileSync(path.join(root, file), 'utf8'));
}

function isInsideRepo(absolutePath) {
  const relative = path.relative(root, absolutePath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

const finalArg = valueOf('--final');
const outputArg = valueOf('--output');
if (!finalArg) throw new Error('--final is required.');
if (!dryRun && !outputArg) throw new Error('--output is required unless --dry-run is used.');

const finalPath = path.resolve(finalArg);
if (!existsSync(finalPath)) throw new Error(`Missing JSON input: ${finalArg}`);
if (isInsideRepo(finalPath)) throw new Error('JRA final fixture input must be outside the repository.');

const finalText = readFileSync(finalPath, 'utf8');
const reviewPackage = buildJraFinalReviewPackage({
  planned: repoJson('data/generated/timetable/jra-planned-program-intake.json'),
  final: JSON.parse(finalText),
  control: repoJson('data/static/jra-pilot-control.json'),
  readinessRegistry: repoJson('data/static/calendar-readiness-registry.json'),
  authorityInventory: repoJson('data/static/authority-source-inventory.json'),
  finalFixtureSha256: createHash('sha256').update(finalText).digest('hex'),
  finalFixtureLabel: path.basename(finalPath)
});

if (dryRun) {
  console.log(JSON.stringify({
    generated_at: reviewPackage.generated_at,
    input: reviewPackage.input,
    decision: reviewPackage.decision,
    next_actions: reviewPackage.next_actions
  }, null, 2));
  process.exit(0);
}

const outputPath = path.resolve(outputArg);
if (isInsideRepo(outputPath)) throw new Error('JRA final review package output must be outside the repository.');
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(reviewPackage, null, 2)}\n`);
console.log(`JRA_FINAL_REVIEW_PACKAGE: wrote ${outputPath}`);
console.log(`CANDIDATE_HANDOFF_READY: ${reviewPackage.decision.candidate_handoff_ready}`);
console.log(`BLOCKERS: ${reviewPackage.decision.blockers.join(',') || 'none'}`);
console.log('REPOSITORY_WRITE_PERFORMED: false');
