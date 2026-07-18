import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = [
  'data/static/countries.json',
  'data/static/racecourses.json',
  'data/static/racecourses-extensions.json',
  'data/static/sources.json',
  'data/static/glossary.json',
  'data/static/archive.json',
  'data/static/i18n/en.json',
  'data/static/i18n/ja.json',
  'data/generated/latest.json',
  'data/generated/today.json',
  'data/generated/tomorrow.json',
  'data/generated/calendar-30d.json',
  'data/generated/fetch-status.json',
];

const staticPublicFiles = new Set(files.filter((file) => file.startsWith('data/static/')));
const forbiddenKeyTokens = new Set([
  'horse', 'horses', 'horse_name', 'horse_names', 'jockey', 'jockeys', 'trainer', 'trainers',
  'draw', 'draws', 'gate', 'gates', 'post_position', 'weight', 'weights', 'body_weight',
  'odds', 'result', 'results', 'payout', 'payouts', 'dividend', 'dividends', 'prediction',
  'predictions', 'tip', 'tips', 'pick', 'picks', 'bet', 'bets', 'betting', 'entries',
  'participants', 'racecard', 'racecards',
]);
const restrictedPatterns = [
  /\bearly candidate\b/i,
  /\bcandidate for\b/i,
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
];

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
  for (const key of ['meetings', 'records', 'items', 'sources', 'entries']) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
}

function summarizeFile(file, data) {
  const rows = topRows(data);
  const ids = rows.map((row) => row?.id);
  const slugs = rows.map((row) => row?.slug);
  const statusCounts = {};
  const meetingStatusCounts = {};
  const rankCounts = {};
  const urlErrors = [];
  const forbiddenKeys = [];
  const restrictedText = [];
  const notes = [];
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
    if (key === 'notes' && typeof value === 'string' && value.trim()) {
      notes.push({ pointer, value: value.trim().slice(0, 300) });
    }
    if (typeof value === 'string') {
      if (key === 'status') statusCounts[value] = (statusCounts[value] ?? 0) + 1;
      if (key === 'meeting_status') meetingStatusCounts[value] = (meetingStatusCounts[value] ?? 0) + 1;
      if (['rank', 'publication_rank', 'auto_level'].includes(key)) rankCounts[value] = (rankCounts[value] ?? 0) + 1;
      if (/url$/i.test(key) || key === 'href') {
        urlValues += 1;
        try {
          const url = new URL(value);
          if (!['http:', 'https:'].includes(url.protocol)) urlErrors.push({ pointer, value });
        } catch {
          urlErrors.push({ pointer, value });
        }
      }
      if (staticPublicFiles.has(file)) {
        for (const pattern of restrictedPatterns) {
          if (pattern.test(value)) {
            restrictedText.push({ pointer, pattern: pattern.source, value: value.trim().slice(0, 300) });
            break;
          }
        }
      }
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
    meetingStatusCounts,
    rankCounts,
    forbiddenKeys,
    notes,
    restrictedText,
  };
}

const parsed = Object.fromEntries(files.map((file) => [file, readJson(file)]));
const summaries = files.map((file) => summarizeFile(file, parsed[file]));
const sitemap = fs.readFileSync(path.join(root, 'dist/sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

const report = {
  schemaVersion: 'v1-data-audit-discovery-v1',
  generatedAt: new Date().toISOString(),
  files: files.length,
  staticFiles: files.filter((file) => file.startsWith('data/static/')).length,
  generatedFiles: files.filter((file) => file.startsWith('data/generated/')).length,
  sitemapUrls: sitemapUrls.length,
  totalTopLevelRows: summaries.reduce((sum, item) => sum + item.topLevelRows, 0),
  duplicateIdGroups: summaries.reduce((sum, item) => sum + item.duplicateIds.length, 0),
  duplicateSlugGroups: summaries.reduce((sum, item) => sum + item.duplicateSlugs.length, 0),
  invalidUrls: summaries.reduce((sum, item) => sum + item.urlErrors.length, 0),
  forbiddenPublicDataKeys: summaries.reduce((sum, item) => sum + item.forbiddenKeys.length, 0),
  publicNotesFields: summaries.reduce((sum, item) => sum + item.notes.length, 0),
  restrictedPublicTextMatches: summaries.reduce((sum, item) => sum + item.restrictedText.length, 0),
  placeholderValues: summaries.reduce((sum, item) => sum + item.placeholderValues, 0),
  summaries,
};

fs.writeFileSync(path.join(root, 'v1-data-audit-discovery.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
