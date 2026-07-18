import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dataModulePath = 'src/lib/data.ts';
const dataModule = fs.readFileSync(path.join(root, dataModulePath), 'utf8');
const importedFiles = [...dataModule.matchAll(/from ['"]\.\.\/\.\.\/(data\/(?:static|generated)\/[^'"]+\.json)['"]/g)]
  .map((match) => match[1]);
const files = [...new Set([
  ...importedFiles,
  'data/static/i18n/en.json',
  'data/static/i18n/ja.json',
])].sort();

const staticPublicFiles = new Set(files.filter((file) => file.startsWith('data/static/')));
const forbiddenKeyTokens = new Set([
  'horse', 'horses', 'horse_name', 'horse_names', 'jockey', 'jockeys', 'trainer', 'trainers',
  'draw', 'draws', 'gate', 'gates', 'post_position', 'weight', 'weights', 'body_weight',
  'odds', 'result', 'results', 'payout', 'payouts', 'dividend', 'dividends', 'prediction',
  'predictions', 'tip', 'tips', 'pick', 'picks', 'bet', 'bets', 'betting', 'entries',
  'participants', 'racecard', 'racecards',
]);
const internalFieldTokens = new Set([
  'notes', 'note', 'm3_notes', 'internal_notes', 'parser_notes', 'candidate_notes',
  'implementation_notes', 'acquisition_notes', 'next_step', 'next_steps', 'follow_up',
]);
const restrictedPatterns = [
  /\bearly candidate\b/i,
  /\bcandidate for\b/i,
  /\bcandidate generation\b/i,
  /\bparser work\b/i,
  /\bparser\b/i,
  /\bautomation\b/i,
  /\bautomate\b/i,
  /\binternally\b/i,
  /\binternal\b/i,
  /\bscrap(?:e|ing)\b/i,
  /\bacquisition\b/i,
  /\brisk posture\b/i,
  /\btarget for\b/i,
  /\bpriority candidate\b/i,
  /\bm3\b/i,
  /\bpr[- ]?\d+\b/i,
  /\bnext step\b/i,
];
const renderedTextKeys = new Set([
  'name_en', 'name_ja', 'name_local', 'summary_en', 'summary_ja', 'description_en',
  'description_ja', 'definition_en', 'definition_ja', 'label_en', 'label_ja', 'title_en',
  'title_ja', 'status_label_en', 'status_label_ja', 'coverage_note_en', 'coverage_note_ja',
  'source_note_en', 'source_note_ja', 'seasonality_en', 'seasonality_ja', 'notes_en', 'notes_ja',
]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
}

function normalizeKey(key) {
  return key.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function uniqueDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values.filter((item) => typeof item === 'string' && item)) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
}

function walk(value, visit, pointer = '$') {
  visit(value, pointer);
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, visit, `${pointer}[${index}]`));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) walk(child, visit, `${pointer}.${key}`);
  }
}

function keyWalk(value, visit, pointer = '$') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => keyWalk(item, visit, `${pointer}[${index}]`));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      visit(key, child, `${pointer}.${key}`);
      keyWalk(child, visit, `${pointer}.${key}`);
    }
  }
}

function topRows(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  for (const key of ['meetings', 'records', 'items', 'sources', 'entries', 'countries', 'racecourses']) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
}

function summarizeFile(file, data) {
  const rows = topRows(data);
  const ids = rows.map((row) => row?.id ?? row?.country_id ?? row?.source_id);
  const slugs = rows.map((row) => row?.slug);
  const statusCounts = {};
  const rankCounts = {};
  const urlErrors = [];
  const forbiddenKeys = [];
  const internalFields = [];
  const restrictedText = [];
  const restrictedRenderedText = [];
  let objectCount = 0;
  let arrayCount = 0;
  let stringCount = 0;
  let nullCount = 0;
  let placeholderValues = 0;
  let urlValues = 0;

  walk(data, (value) => {
    if (Array.isArray(value)) arrayCount += 1;
    else if (value === null) nullCount += 1;
    else if (typeof value === 'object') objectCount += 1;
    else if (typeof value === 'string') {
      stringCount += 1;
      if (value.toLowerCase() === 'placeholder') placeholderValues += 1;
    }
  });

  keyWalk(data, (key, value, pointer) => {
    const normalized = normalizeKey(key);
    if (forbiddenKeyTokens.has(normalized)) forbiddenKeys.push({ pointer, key: normalized });
    if (internalFieldTokens.has(normalized) && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)) {
      internalFields.push({ pointer, key: normalized, value: typeof value === 'string' ? value.trim().slice(0, 300) : value });
    }
    if (typeof value !== 'string') return;
    if (key === 'status' || key.endsWith('_status')) statusCounts[value] = (statusCounts[value] ?? 0) + 1;
    if (['rank', 'publication_rank', 'auto_level', 'coverage_rank'].includes(key)) rankCounts[value] = (rankCounts[value] ?? 0) + 1;
    if (/url$/i.test(key) || key === 'href') {
      urlValues += 1;
      try {
        const url = new URL(value);
        if (!['http:', 'https:'].includes(url.protocol)) urlErrors.push({ pointer, value });
      } catch {
        urlErrors.push({ pointer, value });
      }
    }
    if (!staticPublicFiles.has(file)) return;
    for (const pattern of restrictedPatterns) {
      if (!pattern.test(value)) continue;
      const finding = { pointer, key: normalized, pattern: pattern.source, value: value.trim().slice(0, 300) };
      restrictedText.push(finding);
      if (renderedTextKeys.has(normalized)) restrictedRenderedText.push(finding);
      break;
    }
  });

  return {
    file,
    rootType: Array.isArray(data) ? 'array' : typeof data,
    topLevelRows: rows.length,
    ids: ids.filter(Boolean).length,
    duplicateIds: uniqueDuplicates(ids),
    slugs: slugs.filter(Boolean).length,
    duplicateSlugs: uniqueDuplicates(slugs),
    objectCount,
    arrayCount,
    stringCount,
    nullCount,
    placeholderValues,
    urlValues,
    urlErrors,
    statusCounts,
    rankCounts,
    forbiddenKeys,
    internalFields,
    restrictedText,
    restrictedRenderedText,
  };
}

function rowsFromFiles(parsed, predicate) {
  return Object.entries(parsed)
    .filter(([file]) => predicate(file))
    .flatMap(([file, data]) => topRows(data).map((row, index) => ({ file, index, row })));
}

function mergedSummary(name, entries, idKeys, slugKey = 'slug') {
  const identifiers = entries.map(({ row }) => idKeys.map((key) => row?.[key]).find((value) => typeof value === 'string' && value));
  const slugs = entries.map(({ row }) => row?.[slugKey]);
  const duplicateIds = uniqueDuplicates(identifiers);
  const duplicateSlugs = uniqueDuplicates(slugs);
  const locations = {};
  for (const id of [...duplicateIds, ...duplicateSlugs]) {
    locations[id] = entries
      .filter(({ row }) => idKeys.some((key) => row?.[key] === id) || row?.[slugKey] === id)
      .map(({ file, index }) => `${file}#${index}`);
  }
  return {
    name,
    records: entries.length,
    identifiers: identifiers.filter(Boolean).length,
    slugs: slugs.filter(Boolean).length,
    duplicateIds,
    duplicateSlugs,
    duplicateLocations: locations,
  };
}

const parsed = Object.fromEntries(files.map((file) => [file, readJson(file)]));
const summaries = files.map((file) => summarizeFile(file, parsed[file]));

const countryEntries = rowsFromFiles(parsed, (file) => /data\/static\/(?:countries\.json|country-page-countries-[^/]+\.json)$/.test(file));
const profileEntries = rowsFromFiles(parsed, (file) => /data\/static\/country-profiles-v2(?:-[^/]+)?\.json$/.test(file));
const racecourseEntries = rowsFromFiles(parsed, (file) => /data\/static\/(?:racecourses\.json|racecourses-extensions\.json|racecourses-public-timetable-identities-v1\.json|country-page-racecourses-[^/]+\.json)$/.test(file));
const sourceEntries = rowsFromFiles(parsed, (file) => /data\/static\/(?:sources\.json|country-page-sources-[^/]+\.json)$/.test(file));
const amendmentSources = parsed['data/static/racecourse-link-amendments-v1.json']?.source_records ?? [];
amendmentSources.forEach((row, index) => sourceEntries.push({ file: 'data/static/racecourse-link-amendments-v1.json#source_records', index, row }));

const mergedCollections = [
  mergedSummary('countries', countryEntries, ['id']),
  mergedSummary('countryProfiles', profileEntries, ['country_id', 'id']),
  mergedSummary('racecourses', racecourseEntries, ['id']),
  mergedSummary('sources', sourceEntries, ['id', 'source_id']),
];

const sitemap = fs.readFileSync(path.join(root, 'dist/sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const report = {
  schemaVersion: 'v1-data-audit-discovery-v2',
  generatedAt: new Date().toISOString(),
  dataModulePath,
  importedJsonFiles: importedFiles.length,
  uniqueImportedJsonFiles: new Set(importedFiles).size,
  files: files.length,
  staticFiles: files.filter((file) => file.startsWith('data/static/')).length,
  generatedFiles: files.filter((file) => file.startsWith('data/generated/')).length,
  sitemapUrls: sitemapUrls.length,
  totalTopLevelRows: summaries.reduce((sum, item) => sum + item.topLevelRows, 0),
  duplicateIdGroupsWithinFiles: summaries.reduce((sum, item) => sum + item.duplicateIds.length, 0),
  duplicateSlugGroupsWithinFiles: summaries.reduce((sum, item) => sum + item.duplicateSlugs.length, 0),
  duplicateIdGroupsAcrossMergedCollections: mergedCollections.reduce((sum, item) => sum + item.duplicateIds.length, 0),
  duplicateSlugGroupsAcrossMergedCollections: mergedCollections.reduce((sum, item) => sum + item.duplicateSlugs.length, 0),
  invalidUrls: summaries.reduce((sum, item) => sum + item.urlErrors.length, 0),
  forbiddenPublicDataKeys: summaries.reduce((sum, item) => sum + item.forbiddenKeys.length, 0),
  internalMetadataFields: summaries.reduce((sum, item) => sum + item.internalFields.length, 0),
  restrictedPublicTextMatches: summaries.reduce((sum, item) => sum + item.restrictedText.length, 0),
  restrictedRenderedTextMatches: summaries.reduce((sum, item) => sum + item.restrictedRenderedText.length, 0),
  placeholderValues: summaries.reduce((sum, item) => sum + item.placeholderValues, 0),
  mergedCollections,
  summaries,
};

fs.writeFileSync(path.join(root, 'v1-data-audit-discovery.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
