import fs from 'node:fs';

const STATE_PATH = 'data/static/racecourse-current-state-v1.json';
const CURRENT_DOC_PATH = 'docs/racecourses/current-state-2026-08-28-addendum.md';
const PREVIOUS_DOC_PATH = 'docs/racecourses/current-state-2026-08-09-addendum.md';
const RENDERED_QA_PATH = 'scripts/check-racecourse-page-bilingual-qa-rendered.mjs';

const expect = (condition, message) => {
  if (!condition) throw new Error(message);
};
const read = (file) => fs.readFileSync(file, 'utf8');
const json = (file) => JSON.parse(read(file));

for (const file of [STATE_PATH, CURRENT_DOC_PATH, PREVIOUS_DOC_PATH, RENDERED_QA_PATH]) {
  expect(fs.existsSync(file), `Required racecourse current-state file is missing: ${file}`);
}

const state = json(STATE_PATH);
const currentDoc = read(CURRENT_DOC_PATH);
const previousDoc = read(PREVIOUS_DOC_PATH);
const renderedQa = read(RENDERED_QA_PATH);

expect(state.schema_version === 'racecourse-current-state-v1', 'racecourse current-state schema differs');
expect(state.work_id === 'WHR-RACECOURSE-PAGES-V1', 'racecourse current-state Work ID differs');
expect(state.state_id === 'RACECOURSE-CURRENT-STATE-2026-08-28', 'racecourse current-state ID differs');
expect(state.status === 'active_reviewed_current_state', 'racecourse current-state status differs');
expect(state.reviewed_at === '2026-08-28', 'racecourse current-state review date differs');
expect(Object.values(state.boundaries ?? {}).every((value) => value === false), 'racecourse current-state boundary differs');

const sourceBlock = renderedQa.match(/const sourceFiles = \[([\s\S]*?)\];/);
expect(sourceBlock, 'rendered bilingual QA sourceFiles declaration is missing');
const sourceFiles = [...sourceBlock[1].matchAll(/['"]([^'"]+\.json)['"]/g)].map((match) => match[1]);
expect(sourceFiles.length > 0, 'rendered bilingual QA sourceFiles declaration is empty');

const records = sourceFiles.flatMap((file) => {
  expect(fs.existsSync(file), `racecourse source file is missing: ${file}`);
  const rows = json(file);
  expect(Array.isArray(rows), `racecourse source file must be an array: ${file}`);
  return rows;
});

const ids = records.map((record) => record?.id).filter(Boolean);
const slugs = records.map((record) => record?.slug).filter(Boolean);
expect(ids.length === records.length, 'racecourse current source set contains a record without id');
expect(slugs.length === records.length, 'racecourse current source set contains a record without slug');
expect(new Set(ids).size === ids.length, 'racecourse current source set contains duplicate ids');
expect(new Set(slugs).size === slugs.length, 'racecourse current source set contains duplicate slugs');

const expectedCounts = {
  racecourses: records.length,
  english_detail_routes: records.length,
  japanese_detail_routes: records.length,
  bilingual_detail_routes: records.length * 2,
};
for (const [key, expected] of Object.entries(expectedCounts)) {
  expect(state.counts?.[key] === expected, `racecourse current-state ${key} expected ${expected}; found ${state.counts?.[key]}`);
}

expect(state.derivation?.source_of_truth === 'scripts/check-racecourse-page-bilingual-qa-rendered.mjs sourceFiles', 'racecourse current-state derivation source differs');
expect(state.derivation?.count_rule === 'flatten current canonical racecourse source arrays and count rendered bilingual route pairs', 'racecourse current-state count rule differs');
expect(state.derivation?.historical_v1_release_racecourses === 36, 'historical v1 racecourse count differs');
expect(state.derivation?.historical_v1_release_bilingual_detail_routes === 72, 'historical v1 bilingual route count differs');

expect(currentDoc.includes('Status: active canonical racecourse-page addendum'), 'current racecourse addendum is not active canonical');
expect(currentDoc.includes('Supersedes: `docs/racecourses/current-state-2026-08-09-addendum.md`'), 'current racecourse addendum does not supersede the previous snapshot');
expect(currentDoc.includes('Machine state: `data/static/racecourse-current-state-v1.json`'), 'current racecourse addendum does not name the machine state');
expect(currentDoc.includes(`canonical racecourse identities represented by the rendered QA source set: ${records.length}`), 'current racecourse addendum racecourse count differs');
expect(currentDoc.includes(`bilingual racecourse detail routes: ${records.length * 2}`), 'current racecourse addendum bilingual route count differs');
expect(/Status: superseded/i.test(previousDoc), 'previous racecourse current-state addendum is not marked superseded');
expect(previousDoc.includes('docs/racecourses/current-state-2026-08-28-addendum.md'), 'previous racecourse addendum does not name its replacement');

console.log(`RACECOURSE_CURRENT_STATE: pass (${records.length} racecourses / ${records.length * 2} bilingual detail routes)`);
