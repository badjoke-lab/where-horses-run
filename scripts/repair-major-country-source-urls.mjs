import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourcePath = path.join(root, 'data/static/major-country-acquisition-source-groups.json');

const replacements = new Map([
  ['https://www.hri.ie/racing/fixture-list/', 'https://www.hri.ie/fixture-list'],
  ['https://www.hri.ie/racing/racecards/', 'https://www.hri.ie/racecards'],
  ['https://www.hri.ie/racing/race-results/', 'https://www.hri.ie/results'],
  ['https://loveracing.nz/RaceInfo/Calendar.aspx', 'https://loveracing.nz/RaceInfo.aspx#bm-meeting-calendar'],
  ['https://loveracing.nz/RaceInfo/Nominations.aspx', 'https://loveracing.nz/RaceInfo.aspx#bm-meeting-nom-fields'],
  ['https://emiratesracing.com/racecards', 'https://emiratesracing.com/season-calendar/current-season'],
  ['https://www.britishhorseracing.com/regulation/purebred-arabian-pa-horseracing/', 'https://www.britishhorseracing.com/regulation/arabian-racing/'],
]);

function walk(value, visitor) {
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visitor);
    return;
  }
  if (!value || typeof value !== 'object') return;
  visitor(value);
  for (const child of Object.values(value)) walk(child, visitor);
}

const data = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
let replacementCount = 0;
let bhaRacecardDiscoveryCount = 0;

walk(data, (object) => {
  if (typeof object.url === 'string' && replacements.has(object.url)) {
    object.url = replacements.get(object.url);
    replacementCount += 1;
  }

  if (object.source_id === 'bha-racecard-links' && !object.url) {
    object.url = 'https://www.britishhorseracing.com/racing/fixtures/upcoming/';
    object.role = 'racecard link discovery from upcoming fixture rows';
    bhaRacecardDiscoveryCount += 1;
  }
});

if (replacementCount !== 13) {
  throw new Error(`Expected 13 URL replacements, applied ${replacementCount}.`);
}
if (bhaRacecardDiscoveryCount !== 1) {
  throw new Error(`Expected one BHA racecard discovery URL insertion, applied ${bhaRacecardDiscoveryCount}.`);
}

fs.writeFileSync(sourcePath, `${JSON.stringify(data, null, 2)}\n`);
console.log(`[repair-major-country-source-urls] updated ${path.relative(root, sourcePath)} replacements=${replacementCount} inserted=${bhaRacecardDiscoveryCount}`);
