import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function requireText(source, token, label) {
  if (!source.includes(token)) errors.push(`${label} missing: ${token}`);
}

const policyData = readJson('src/data/publicationDisplayPolicies.json');
const policyModule = read('src/data/publicationDisplayPolicies.ts');
const resolver = read('src/lib/timetable/publicationPolicy.ts');
const notes = read('PR-243.md');

if (policyData.schema_version !== 'publication-display-policies-v0') {
  errors.push('Unexpected publication policy schema version.');
}

const policyAuthorities = new Set(
  policyData.policies.flatMap((policy) => policy.match.authority_ids ?? []),
);
for (const authority of [
  'hkjc',
  'jra',
  'nar-local-government-racing',
  'banei-tokachi',
  'emirates-racing-authority',
]) {
  if (!policyAuthorities.has(authority)) {
    errors.push(`publication policies missing authority: ${authority}`);
  }
}

for (const policy of policyData.policies) {
  if (policy.max_public_rank !== 'A+') {
    errors.push(`${policy.id} must initially allow A+.`);
  }
  for (const field of [
    'show_race_name',
    'show_distance',
    'show_surface',
    'show_course',
  ]) {
    if (policy.a_plus_fields[field] !== true) {
      errors.push(`${policy.id} must enable ${field}.`);
    }
  }
}

if (policyData.default_policy.max_public_rank !== 'C') {
  errors.push('Default publication policy must remain capped at C.');
}

for (const token of [
  "import policyData from './publicationDisplayPolicies.json'",
  'typedPolicyData.default_policy',
  'typedPolicyData.policies',
]) {
  requireText(policyModule, token, 'publication policy module');
}

for (const token of [
  'export function lowerRank',
  'export function matchesPublicationPolicy',
  'export function findPublicationPolicy',
  'export function resolvePublicationDecision',
  "const showAPlus = effectiveRank === 'A+'",
  "effectiveRank !== 'not_listed'",
  "effectiveRank !== 'D'",
  'show_race_name: showAPlus',
  'show_distance: showAPlus',
  'show_surface: showAPlus',
  'show_course: showAPlus',
]) {
  requireText(resolver, token, 'publication resolver');
}

const rankOrder = ['not_listed', 'D', 'C', 'B', 'B+', 'A', 'A+'];
const lowerRank = (capabilityRank, maxPublicRank) =>
  rankOrder.indexOf(capabilityRank) <= rankOrder.indexOf(maxPublicRank)
    ? capabilityRank
    : maxPublicRank;

const cases = [
  ['A+', 'A+', 'A+'],
  ['A+', 'A', 'A'],
  ['B', 'A+', 'B'],
  ['A+', 'C', 'C'],
];
for (const [capability, maximum, expected] of cases) {
  const actual = lowerRank(capability, maximum);
  if (actual !== expected) {
    errors.push(`${capability}/${maximum}: expected ${expected}, got ${actual}`);
  }
}

for (const token of [
  'A+ capability may publish as A+ during the initial display test period.',
  'The same resolver can switch A+ down to A, B+, B, C, D, or not_listed.',
  'Next roadmap item is PR-6 public view generation.',
]) {
  requireText(notes, token, 'PR note');
}

if (errors.length > 0) {
  console.error('Publication policy resolver check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Publication policy resolver check passed.');
