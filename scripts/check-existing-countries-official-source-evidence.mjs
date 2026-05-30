import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const evidencePath = resolve(root, 'docs/runbooks/existing-countries-official-source-evidence.md');
const prPath = resolve(root, 'docs/runbooks/pr-082.md');

const failures = [];

function fail(message) {
  failures.push(message);
}

function readRequired(path, label) {
  if (!existsSync(path)) {
    fail(`${label} is missing: ${path}`);
    return '';
  }
  return readFileSync(path, 'utf8');
}

const evidence = readRequired(evidencePath, 'Evidence document');
const pr = readRequired(prPath, 'PR-082 runbook');
const packageJson = JSON.parse(readRequired(resolve(root, 'package.json'), 'package.json') || '{}');

function includesRequired(text, needle, label) {
  if (!text.includes(needle)) {
    fail(`${label} must include: ${needle}`);
  }
}

function hasHeading(text, heading) {
  return new RegExp(`^#{2,4}\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm').test(text);
}

function sectionBetween(text, startHeading, nextHeadingPattern = /^##\s+/m) {
  const start = text.search(new RegExp(`^##\\s+${startHeading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm'));
  if (start === -1) return '';
  const rest = text.slice(start + 1);
  const next = rest.search(nextHeadingPattern);
  return next === -1 ? rest : rest.slice(0, next);
}

includesRequired(evidence, 'official source evidence', 'Evidence document');
includesRequired(evidence, 'do not add new countries before existing-country source evidence is reviewed', 'Evidence document');

for (const status of [
  'source_found',
  'source_not_found',
  'source_needs_manual_review',
  'source_conflicts_with_inventory',
  'source_confirms_inventory',
]) {
  includesRequired(evidence, status, 'Evidence document');
}

for (const country of ['Japan', 'Hong Kong', 'UAE']) {
  if (!hasHeading(evidence, country)) {
    fail(`Evidence document must include a ${country} section`);
  }

  const section = sectionBetween(evidence, country);
  if (!section) continue;

  if (!/https?:\/\//.test(section) && !section.includes('source_not_found')) {
    fail(`${country} section must include source URLs or explicit source_not_found entries`);
  }

  if (!/Racecourse inventory comparison/i.test(section)) {
    fail(`${country} section must include a racecourse inventory comparison table`);
  }

  if (!/Fixture\/calendar source section/i.test(section)) {
    fail(`${country} section must include a fixture/calendar source section`);
  }

  if (!/Gaps still requiring source confirmation/i.test(section)) {
    fail(`${country} section must include a gaps section`);
  }
}

for (const subsystem of ['Japan — JRA', 'Japan — NAR', 'Japan — Banei']) {
  if (!hasHeading(evidence, subsystem)) {
    fail(`Japan section must distinguish ${subsystem}`);
  }
}

for (const column of [
  'Current repo inventory item',
  'Official source item',
  'Comparison',
  'Notes',
]) {
  includesRequired(evidence, column, 'Evidence inventory comparison tables');
}

const prohibitedClaims = [
  /\bJapan\s+(?:is\s+)?complete\b/i,
  /\bHong Kong\s+(?:is\s+)?complete\b/i,
  /\bUAE\s+(?:is\s+)?complete\b/i,
  /\bUnited Arab Emirates\s+(?:is\s+)?complete\b/i,
  /\bcomplete coverage\b/i,
  /\bpublic coverage is complete\b/i,
  /\bpublic coverage complete\b/i,
];

for (const pattern of prohibitedClaims) {
  const matches = evidence.match(pattern) ?? [];
  for (const match of matches) {
    const line = evidence.split('\n').find((candidate) => candidate.includes(match)) ?? '';
    const normalized = line.toLowerCase();
    const isAllowedNegative = normalized.includes('does not claim') || normalized.includes('must not claim') || normalized.includes('cannot be called') || normalized.includes('not claim');
    if (!isAllowedNegative) {
      fail(`Evidence document appears to claim complete/public coverage: ${line.trim()}`);
    }
  }
}

includesRequired(pr, 'User-facing outcome: documentation/evidence only', 'PR-082 runbook');
includesRequired(pr, 'Why South Korea is paused', 'PR-082 runbook');
includesRequired(pr, 'Official source evidence scope', 'PR-082 runbook');
includesRequired(pr, 'Validation commands', 'PR-082 runbook');
includesRequired(pr, 'Next PR: PR-083 Japan official source inventory correction', 'PR-082 runbook');

if (packageJson.scripts?.['validate:existing-countries-official-source-evidence'] !== 'node scripts/check-existing-countries-official-source-evidence.mjs') {
  fail('package.json must define validate:existing-countries-official-source-evidence');
}

const checkScript = packageJson.scripts?.check ?? '';
if (!checkScript.includes('validate:country-adapter-template && npm run validate:existing-countries-official-source-evidence')) {
  fail('npm run check must include validate:existing-countries-official-source-evidence after validate:country-adapter-template');
}

if (failures.length > 0) {
  console.error('Existing countries official source evidence validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Existing countries official source evidence validation passed.');
