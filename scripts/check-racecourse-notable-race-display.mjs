import fs from 'node:fs';

const componentPath = 'src/components/RacecourseDetailPage.astro';
const specPath = 'docs/racecourses/notable-and-graded-race-display-2026-09-09.md';
const roadmapPath = 'docs/racecourses/notable-and-graded-race-roadmap-2026-09-09.md';
const agentPath = 'AGENTS.md';

const component = fs.readFileSync(componentPath, 'utf8');
const spec = fs.readFileSync(specPath, 'utf8');
const roadmap = fs.readFileSync(roadmapPath, 'utf8');
const agents = fs.readFileSync(agentPath, 'utf8');
const errors = [];
const fail = (message) => errors.push(message);

const notableModelStart = component.indexOf('const notableRaces =');
const officialLinksStart = component.indexOf('const officialLinks =');
if (notableModelStart < 0 || officialLinksStart < 0 || officialLinksStart <= notableModelStart) {
  fail('cannot locate notableRaces model block');
} else {
  const notableModel = component.slice(notableModelStart, officialLinksStart);
  for (const legacyUrlField of ['source_url', 'official_link', 'race?.url']) {
    if (notableModel.includes(legacyUrlField)) {
      fail(`notableRaces model still consumes legacy external field: ${legacyUrlField}`);
    }
  }
}

const subsectionStart = component.indexOf('data-racecourse-notable-races');
const sourcesStart = component.indexOf('data-racecourse-detail-sources');
if (subsectionStart < 0 || sourcesStart < 0 || sourcesStart <= subsectionStart) {
  fail('cannot locate notable-race rendered subsection');
} else {
  const notableMarkup = component.slice(subsectionStart, sourcesStart);
  if (/<a\b/i.test(notableMarkup)) {
    fail('notable-race subsection contains an anchor');
  }
  if (!notableMarkup.includes('{race.name}')) {
    fail('notable-race subsection does not render the localized race name');
  }
}

if (!component.includes("<h3>{isJapanese ? '主なレース' : 'Notable races'}</h3>")) {
  fail('localized notable-race heading changed unexpectedly');
}

for (const required of [
  'racecourse page -> notable race name = text only',
  'racecourse -> race_id[]',
  'Past graded races / 過去に開催された重賞',
]) {
  if (!spec.includes(required)) fail(`display contract missing required rule: ${required}`);
}

for (const required of [
  'WHR-RACECOURSE-NOTABLE-RACES-001',
  'WHR-GRADED-RACE-REPRESENTATIVE-AUDIT-001',
  'WHR-GRADED-RACE-ACTIVE-MASTER-001',
  'WHR-GRADED-RACE-HISTORY-001',
  'WHR-GRADED-RACE-CLOSED-RACECOURSE-001',
]) {
  if (!roadmap.includes(required)) fail(`graded-race roadmap missing ${required}`);
}

for (const required of [specPath, roadmapPath, 'legacy `notable_races[].source_url`']) {
  if (!agents.includes(required)) fail(`AGENTS.md missing notable/graded-race entry rule marker: ${required}`);
}

if (errors.length) {
  console.error(`RACECOURSE_NOTABLE_RACE_DISPLAY: failed (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('RACECOURSE_NOTABLE_RACE_DISPLAY: passed');
