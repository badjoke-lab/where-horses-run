import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourceRoot = path.join(root, 'src');
const pageRoot = path.join(sourceRoot, 'pages');
const codeExtensions = ['.ts', '.tsx', '.js', '.mjs', '.astro', '.json'];
const forbiddenPaths = [
  'data/candidates/',
  'data/generated/timetable/canonical/',
  'data/generated/timetable/manual-',
  'data/generated/timetable/june-2026',
  'data/generated/timetable/current-integrated.json',
  'data/generated/timetable/real-calendar-all-countries.json',
  'data/generated/timetable/hkjc-normalized',
  'data/generated/timetable/jra-normalized',
  'data/generated/normalized-timetable.json',
  'data/generated/timetables.json',
  'data/generated/japan-active-timetable-records.json',
  'src/data/normalizedTimetableCalendarPreview.ts',
  'src/data/normalizedTimetableMeetingDetails.ts',
  'src/data/majorCountryPreviewTimetableSamples.ts',
  'src/components/NormalizedTimetableCalendarPreview.astro',
  'src/components/PreviewTimetableSamples.astro',
  'src/components/NormalizedMeetingDetailLinks.astro',
  'src/components/CurrentTimetableRecords.astro',
  'src/components/CurrentTimetableDimensions.astro'
];
const allowedPublicFiles = new Set([
  'data/generated/timetable/public/meeting-list.json',
  'data/generated/timetable/public/meeting-details.json'
]);

function toRepoPath(file) {
  return path.relative(root, file).replaceAll(path.sep, '/');
}

function walk(directory, result = []) {
  for (const entry of readdirSync(directory)) {
    const full = path.join(directory, entry);
    if (statSync(full).isDirectory()) walk(full, result);
    else result.push(full);
  }
  return result;
}

function importSpecifiers(text) {
  const found = new Set();
  const patterns = [
    /(?:import|export)\s+(?:[^'";]*?\s+from\s*)?['"]([^'"]+)['"]/gs,
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,
    /require\(\s*['"]([^'"]+)['"]\s*\)/g
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) found.add(match[1]);
  }
  return [...found];
}

function resolveLocalImport(importer, specifier) {
  if (!specifier.startsWith('.')) return null;
  const base = path.resolve(path.dirname(importer), specifier);
  const candidates = [base];
  for (const extension of codeExtensions) candidates.push(`${base}${extension}`);
  for (const extension of codeExtensions) candidates.push(path.join(base, `index${extension}`));
  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile()) ?? null;
}

function forbiddenReason(repoPath) {
  if (allowedPublicFiles.has(repoPath)) return null;
  const marker = forbiddenPaths.find((entry) => repoPath === entry || repoPath.startsWith(entry));
  return marker ? `forbidden runtime dependency ${marker}` : null;
}

const pages = walk(pageRoot).filter((file) => ['.astro', '.ts', '.tsx', '.js', '.mjs'].includes(path.extname(file)));
const violations = [];
const unresolved = [];
const visitedFromPage = new Map();

for (const page of pages) {
  const pagePath = toRepoPath(page);
  const stack = [{ file: page, chain: [pagePath] }];
  const visited = new Set();
  while (stack.length) {
    const current = stack.pop();
    if (visited.has(current.file)) continue;
    visited.add(current.file);
    const currentPath = toRepoPath(current.file);
    const directReason = forbiddenReason(currentPath);
    if (directReason) {
      violations.push({ page: pagePath, dependency: currentPath, reason: directReason, chain: current.chain });
      continue;
    }
    if (allowedPublicFiles.has(currentPath)) continue;

    const text = readFileSync(current.file, 'utf8');
    for (const marker of forbiddenPaths) {
      if (text.includes(marker)) {
        violations.push({
          page: pagePath,
          dependency: currentPath,
          reason: `source text references forbidden marker ${marker}`,
          chain: current.chain
        });
      }
    }

    for (const specifier of importSpecifiers(text)) {
      if (!specifier.startsWith('.')) continue;
      const resolved = resolveLocalImport(current.file, specifier);
      if (!resolved) {
        unresolved.push({ page: pagePath, importer: currentPath, specifier });
        continue;
      }
      const resolvedPath = toRepoPath(resolved);
      const reason = forbiddenReason(resolvedPath);
      const chain = [...current.chain, resolvedPath];
      if (reason) violations.push({ page: pagePath, dependency: resolvedPath, reason, chain });
      else stack.push({ file: resolved, chain });
    }
  }
  visitedFromPage.set(pagePath, visited.size);
}

const uniqueViolations = [...new Map(violations.map((item) => [`${item.page}|${item.dependency}|${item.reason}`, item])).values()]
  .sort((left, right) => `${left.page}|${left.dependency}`.localeCompare(`${right.page}|${right.dependency}`));
const uniqueUnresolved = [...new Map(unresolved.map((item) => [`${item.importer}|${item.specifier}`, item])).values()]
  .filter((item) => !item.specifier.endsWith('.css'))
  .sort((left, right) => `${left.importer}|${left.specifier}`.localeCompare(`${right.importer}|${right.specifier}`));

if (uniqueViolations.length || uniqueUnresolved.length) {
  console.error(`CALENDAR_RUNTIME_IMPORT_BOUNDARY: failed violations=${uniqueViolations.length} unresolved=${uniqueUnresolved.length}`);
  for (const item of uniqueViolations) {
    console.error(`- page=${item.page}`);
    console.error(`  dependency=${item.dependency}`);
    console.error(`  reason=${item.reason}`);
    console.error(`  chain=${item.chain.join(' -> ')}`);
  }
  for (const item of uniqueUnresolved) {
    console.error(`- unresolved importer=${item.importer} specifier=${item.specifier}`);
  }
  process.exit(1);
}

const totalVisited = [...visitedFromPage.values()].reduce((sum, value) => sum + value, 0);
console.log(`CALENDAR_RUNTIME_IMPORT_BOUNDARY: pass pages=${pages.length} traversed_dependencies=${totalVisited}`);
console.log('RUNTIME_TIMETABLE_INPUTS: public-projection-only');
console.log('CANDIDATE_CANONICAL_LEGACY_IMPORTS: 0');
