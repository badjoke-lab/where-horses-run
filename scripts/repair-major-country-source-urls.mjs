import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targetPaths = [
  path.join(root, 'data/static/major-country-acquisition-source-groups.json'),
  path.join(root, 'data/static/major-country-racing-inventory.json'),
];

const replacements = new Map([
  ['https://www.hri.ie/racing/fixture-list/', 'https://www.hri.ie/fixture-list'],
  ['https://www.hri.ie/racing/racecards/', 'https://www.hri.ie/racecards'],
  ['https://www.hri.ie/racing/race-results/', 'https://www.hri.ie/results'],
  ['https://loveracing.nz/RaceInfo/Calendar.aspx', 'https://loveracing.nz/RaceInfo.aspx#bm-meeting-calendar'],
  ['https://loveracing.nz/RaceInfo/Nominations.aspx', 'https://loveracing.nz/RaceInfo.aspx#bm-meeting-nom-fields'],
  ['https://emiratesracing.com/racecards', 'https://emiratesracing.com/season-calendar/current-season'],
  ['https://www.britishhorseracing.com/regulation/purebred-arabian-pa-horseracing/', 'https://www.britishhorseracing.com/regulation/arabian-racing/'],
]);

const requiredCurrentUrls = [
  'https://www.hri.ie/fixture-list',
  'https://www.hri.ie/racecards',
  'https://www.hri.ie/results',
  'https://loveracing.nz/RaceInfo.aspx#bm-meeting-calendar',
  'https://loveracing.nz/RaceInfo.aspx#bm-meeting-nom-fields',
  'https://emiratesracing.com/season-calendar/current-season',
  'https://www.britishhorseracing.com/regulation/arabian-racing/',
];

function replaceStrings(value, stats) {
  if (typeof value === 'string') {
    if (replacements.has(value)) {
      stats.replacements += 1;
      return replacements.get(value);
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => replaceStrings(entry, stats));
  }

  if (!value || typeof value !== 'object') return value;

  const next = {};
  for (const [key, child] of Object.entries(value)) {
    next[key] = replaceStrings(child, stats);
  }

  if (next.source_id === 'bha-racecard-links') {
    if (!next.url) {
      next.url = 'https://www.britishhorseracing.com/racing/fixtures/upcoming/';
      stats.insertions += 1;
    }
    next.role = 'racecard link discovery from upcoming fixture rows';
  }

  return next;
}

function collectStrings(value, output = []) {
  if (typeof value === 'string') {
    output.push(value);
    return output;
  }
  if (Array.isArray(value)) {
    for (const entry of value) collectStrings(entry, output);
    return output;
  }
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) collectStrings(child, output);
  }
  return output;
}

for (const filePath of targetPaths) {
  const original = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const stats = { replacements: 0, insertions: 0 };
  const repaired = replaceStrings(original, stats);
  const strings = new Set(collectStrings(repaired));

  for (const staleUrl of replacements.keys()) {
    if (strings.has(staleUrl)) {
      throw new Error(`${path.relative(root, filePath)} still contains stale URL: ${staleUrl}`);
    }
  }

  if (filePath.endsWith('major-country-acquisition-source-groups.json')) {
    for (const requiredUrl of requiredCurrentUrls) {
      if (!strings.has(requiredUrl)) {
        throw new Error(`${path.relative(root, filePath)} missing repaired URL: ${requiredUrl}`);
      }
    }
    if (!strings.has('https://www.britishhorseracing.com/racing/fixtures/upcoming/')) {
      throw new Error(`${path.relative(root, filePath)} missing BHA racecard discovery URL.`);
    }
  }

  fs.writeFileSync(filePath, `${JSON.stringify(repaired, null, 2)}\n`);
  console.log(
    `[repair-major-country-source-urls] updated ${path.relative(root, filePath)} replacements=${stats.replacements} inserted=${stats.insertions}`,
  );
}
