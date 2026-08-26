import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');
const readJson = (path) => JSON.parse(read(path));

const addendumPath = 'docs/project-roadmap-2026-08-25-addendum.md';
const addendumRelativePath = 'project-roadmap-2026-08-25-addendum.md';
const addendum = read(addendumPath);
const authority = read('docs/governance/document-authority.md');
const docsIndex = read('docs/README.md');
const start = read('START-HERE.md');
const roadmap = read('docs/project-roadmap.md');
const release = readJson('data/static/m6-v1-release-v1.json');
const sorec = readJson('docs/timetable-source-tests/04-morocco/revalidation-2026-08-14.json');

assert.equal(release.schema_version, 'm6-v1-release-v1');
assert.equal(release.completion?.m6_v1_release_complete_when_merged, true);
assert.equal(release.completion?.next_stage, 'reviewed_incremental_maintenance');

for (const marker of [
  'Status: active canonical project-roadmap addendum',
  'Adopted: 2026-08-25',
  'Current stage: reviewed_incremental_maintenance',
  'M6 v1.0 / PR #599',
  'PR #579',
  'PR #582',
  'PR #584',
  'PR #592',
  'PR #599',
  'Draft PR #559 remains the durable review queue',
  'Automatic publication: disabled',
]) assert.ok(addendum.includes(marker), `post-v1 addendum missing marker: ${marker}`);

assert.equal(sorec.status, 'blocked_no_public_timetable_source');
assert.equal(sorec.technical_capability_rank, 'not_confirmed');
assert.equal(sorec.decision?.adapter_status, 'blocked');
assert.equal(sorec.decision?.candidate_generation, false);
assert.equal(sorec.decision?.canonical_write, false);
assert.equal(sorec.decision?.public_projection_write, false);

assert.ok(authority.includes(addendumPath), `documentation authority must point to ${addendumPath}`);
assert.ok(start.includes(addendumPath), `START-HERE must point to ${addendumPath}`);
assert.ok(docsIndex.includes(addendumRelativePath), `documentation index must point to ${addendumRelativePath}`);

for (const [label, text] of [
  ['START-HERE', start],
  ['project roadmap', roadmap],
]) {
  assert.ok(text.includes('Current stage: `reviewed_incremental_maintenance`'), `${label} must expose reviewed_incremental_maintenance as current stage`);
  assert.ok(text.includes('Completed Work ID: `WHR-GLOSSARY-DICTIONARY-V1`'), `${label} must mark glossary work complete`);
  assert.ok(text.includes('Completed implementation unit: `GLOSSARY-QA-RELEASE-01`'), `${label} must preserve glossary release completion`);
  assert.ok(!text.includes('Current Work ID: `WHR-GLOSSARY-DICTIONARY-V1`'), `${label} must not retain glossary as current work`);
  assert.ok(!text.includes('Current implementation unit: `GLOSSARY-SCHEMA-EXTENSION-01`'), `${label} must not retain the first glossary unit as current`);
}

assert.ok(authority.includes('The current adopted top-level execution addendum is:'));
assert.ok(authority.includes('docs/project-roadmap-2026-08-25-addendum.md'));
assert.ok(!authority.includes('The current adopted top-level execution addendum is:\n\n```text\ndocs/project-roadmap-2026-08-09-addendum.md'));

console.log('Post-v1 maintenance governance: PASS');
