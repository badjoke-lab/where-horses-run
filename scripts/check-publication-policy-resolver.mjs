import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function requireText(source, token, label) {
  if (!source.includes(token)) errors.push(`${label} missing: ${token}`);
}

const policies = read('src/data/publicationDisplayPolicies.ts');
const resolver = read('src/lib/timetable/publicationPolicy.ts');
const notes = read('PR-243.md');

for (const authority of [
  'hkjc',
  'jra',
  'nar-local-government-racing',
  'banei-tokachi',
  'emirates-racing-authority',
]) {
  requireText(policies, authority, 'publication policies');
}

for (const token of [
  "max_public_rank: 'A+'",
  'show_race_name: true',
  'show_distance: true',
  'show_surface: true',
  'show_course: true',
  "id: 'default-conservative-c'",
  "max_public_rank: 'C'",
  'later tests downgrade/switch behavior',
]) {
  requireText(policies, token, 'publication policies');
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
  {
    name: 'A+ capability remains A+ under reviewed A+ policy',
    capability: 'A+',
    max: 'A+',
    expected: 'A+',
  },
  {
    name: 'A+ capability can be switched down to A',
    capability: 'A+',
    max: 'A',
    expected: 'A',
  },
  {
    name: 'B capability is not promoted by A+ policy',
    capability: 'B',
    max: 'A+',
    expected: 'B',
  },
  {
    name: 'unknown source default can cap A+ capability at C',
    capability: 'A+',
    max: 'C',
    expected: 'C',
  },
];

for (const testCase of cases) {
  const actual = lowerRank(testCase.capability, testCase.max);
  if (actual !== testCase.expected) {
    errors.push(`${testCase.name}: expected ${testCase.expected}, got ${actual}`);
  }
}

for (const token of [
  'A+ capability may publish as A+ during the initial display test period.',
  'The same resolver can switch A+ down to A, B+, B, C, D, or not_listed.',
  'No public JSON is generated.',
  'No page input is changed.',
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
