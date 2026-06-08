import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

const displayRoots = [
  'src/pages',
  'src/components',
  'src/layouts',
  'src/lib',
  'src/data',
];

const allowedDisplayFiles = new Set([
  'src/lib/timetable/publicTimetableViewModel.ts',
  'src/lib/timetable/publicTimetableFilters.ts',
  'src/data/publicationDisplayPolicies.ts',
  'src/data/publicationDisplayPolicies.json',
]);

const legacyTokens = [
  'data/generated/timetables.json',
  'data/generated/japan-active-timetable-records.json',
  'data/generated/normalized-timetable.json',
  'hkjc-normalized-timetable.sample.json',
  'hkjc-normalized-meeting-details.sample.json',
  'hkjc-racecard-source-snapshot.json',
  'normalizedTimetableCalendarPreview',
  'normalizedTimetableMeetingDetails',
  'current-integrated.json',
  'manual-june-2026',
  'june-2026-calendar',
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.astro') continue;
      results.push(...walk(fullPath));
    } else if (/\.(astro|ts|tsx|js|jsx|mjs|json)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = displayRoots.flatMap((relativeRoot) => walk(path.join(root, relativeRoot)));

for (const filePath of files) {
  const relativePath = path.relative(root, filePath).replaceAll('\\', '/');
  if (allowedDisplayFiles.has(relativePath)) continue;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const token of legacyTokens) {
    if (content.includes(token)) {
      errors.push(`${relativePath} directly references legacy timetable token: ${token}`);
    }
  }
}

const canonicalBuilder = fs.readFileSync(path.join(root, 'scripts/timetable/build-canonical-timetable.mjs'), 'utf8');
for (const required of [
  'data/generated/timetables.json',
  'data/generated/japan-active-timetable-records.json',
  'data/generated/normalized-timetable.json',
  'hkjc-normalized-meeting-details.sample.json',
]) {
  if (!canonicalBuilder.includes(required)) {
    errors.push(`canonical builder no longer documents/uses expected upstream input: ${required}`);
  }
}

const publicViewModel = fs.readFileSync(path.join(root, 'src/lib/timetable/publicTimetableViewModel.ts'), 'utf8');
for (const required of [
  'data/generated/timetable/public/meeting-list.json',
  'data/generated/timetable/public/meeting-details.json',
]) {
  if (!publicViewModel.includes(required)) {
    errors.push(`public timetable view model missing public source: ${required}`);
  }
}

const runbook = fs.readFileSync(path.join(root, 'docs/runbooks/timetable-legacy-inputs.md'), 'utf8');
for (const required of [
  'Pages, components, and display-facing libraries must read timetable display data from the public view only',
  'These files are not deleted in this PR',
  'canonical builder',
  'public view builder',
]) {
  if (!runbook.includes(required)) {
    errors.push(`legacy input runbook missing: ${required}`);
  }
}

const notes = fs.readFileSync(path.join(root, 'PR-268.md'), 'utf8');
for (const required of [
  'No legacy input file is deleted.',
  'Display-facing code must not directly read legacy timetable inputs.',
  'Legacy inputs remain allowed as upstream canonical builder inputs.',
  'Next roadmap item is PR-12 country timetable section preparation or defer if country page specs are not ready.',
]) {
  if (!notes.includes(required)) {
    errors.push(`PR note missing: ${required}`);
  }
}

if (errors.length > 0) {
  console.error('Legacy timetable import isolation check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Legacy timetable import isolation check passed.');
