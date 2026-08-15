import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildCandidateDiff, renderCandidateDiffHtml } from './timetable/candidate-diff-page.mjs';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (!arg.startsWith('--')) throw new Error(`Unexpected argument: ${arg}`);
  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
  args.set(arg.slice(2), value);
  index += 1;
}

const candidatePath = args.get('candidate');
const baselinePath = args.get('baseline') ?? 'data/generated/timetable/canonical/meetings.json';
const baselineDetailsPath = args.get('baseline-details') ?? 'data/generated/timetable/canonical/meeting-details.json';
const outputPath = args.get('output');

if (!candidatePath || !outputPath) {
  console.error('Usage: node scripts/render-m5-candidate-diff-page.mjs --candidate <candidate.json> [--baseline <meetings.json>] [--baseline-details <meeting-details.json>] --output artifacts/<name>.html');
  process.exit(1);
}

function assertRepositoryRelative(value, field) {
  if (path.isAbsolute(value) || value.split(/[\\/]/).includes('..')) throw new Error(`${field} must be repository-relative and must not escape the repository`);
}

for (const [field, value] of [['candidate', candidatePath], ['baseline', baselinePath], ['baseline-details', baselineDetailsPath], ['output', outputPath]]) {
  assertRepositoryRelative(value, field);
}

const normalizedOutput = outputPath.replaceAll('\\', '/');
if (!normalizedOutput.startsWith('artifacts/') || !normalizedOutput.endsWith('.html')) {
  throw new Error('output must be an HTML review artifact under artifacts/');
}
if (normalizedOutput.startsWith('public/') || normalizedOutput.startsWith('src/pages/') || normalizedOutput.startsWith('dist/')) {
  throw new Error('candidate diff output must not target a public site path');
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.resolve(relativePath), 'utf8'));
}

const candidate = readJson(candidatePath);
const baseline = readJson(baselinePath);
const baselineDetails = readJson(baselineDetailsPath);
const diff = buildCandidateDiff(candidate, baseline, baselineDetails);
const html = renderCandidateDiffHtml(diff, { title: `Candidate review diff — ${diff.country_id} / ${diff.authority_id}` });
const absoluteOutput = path.resolve(outputPath);
mkdirSync(path.dirname(absoluteOutput), { recursive: true });
writeFileSync(absoluteOutput, html);

console.log(`Wrote review-only candidate diff page: ${outputPath}`);
console.log(`changed=${diff.counts.changed} candidate_only=${diff.counts.candidate_only} baseline_only=${diff.counts.baseline_only} unchanged=${diff.counts.unchanged}`);
console.log('publication_effect=none approval_effect=none');
