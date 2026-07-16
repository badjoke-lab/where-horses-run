import fs from 'node:fs';
import path from 'node:path';
import { loadGlossary } from './glossary-data-loader.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const filePath = (file) => path.join(root, file);
const read = (file) => fs.readFileSync(filePath(file), 'utf8');
const parse = (file) => JSON.parse(read(file));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const audit = parse('data/audits/glossary-role-expansion-v1.json');
const registry = parse('data/static/glossary-role-registry-v1.json');
const overlay = parse('data/static/glossary-entries-role-v1.json');
const glossary = loadGlossary(root);
const workflowPath = '.github/workflows/glossary-role-expansion.yml';
const docPath = 'docs/glossary/role-expansion.md';
const runtimePath = 'src/lib/glossary-data.ts';

if (!fs.existsSync(filePath(workflowPath))) fail('role expansion workflow is missing');
if (!fs.existsSync(filePath(docPath))) fail('role expansion document is missing');
if (!fs.existsSync(filePath(runtimePath))) fail('runtime glossary merger is missing');

if (fs.existsSync(filePath(workflowPath))) {
  const workflow = read(workflowPath);
  for (const marker of [
    'npm install --package-lock=false',
    'npm run build',
    'node scripts/check-glossary-schema-extension.mjs',
    'node scripts/check-glossary-racing-type-expansion.mjs',
    'node scripts/check-glossary-horse-breed-expansion.mjs',
    'node scripts/check-glossary-role-expansion.mjs',
    'git status --porcelain',
  ]) if (!workflow.includes(marker)) fail(`role workflow missing ${marker}`);
  for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare']) {
    if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`role workflow contains forbidden marker ${forbidden}`);
  }
}

if (audit.schema_version !== 'glossary-role-expansion-v1') fail('audit schema differs');
if (audit.work_id !== 'WHR-GLOSSARY-DICTIONARY-V1') fail('audit Work ID differs');
if (audit.implementation_unit !== 'GLOSSARY-ROLE-EXPANSION-01') fail('audit implementation unit differs');
if (!['implemented_for_review', 'complete'].includes(audit.status)) fail('audit status differs');
if (audit.reviewed_at !== '2026-07-16') fail('audit review date differs');
if (audit.baseline?.glossary_records !== 31 || audit.baseline?.role_records !== 3 || audit.baseline?.bilingual_routes !== 62) fail('audit baseline differs');
if (audit.implemented?.glossary_records !== 36 || audit.implemented?.role_records !== 8 || audit.implemented?.participant_role_records !== 5 || audit.implemented?.race_official_role_records !== 3 || audit.implemented?.new_records !== 5 || audit.implemented?.reconciled_existing_records !== 3 || audit.implemented?.bilingual_routes !== 72 || audit.implemented?.new_bilingual_routes !== 10 || audit.implemented?.reciprocal_relationships !== 6) fail('audit implemented counts differ');
if (audit.next_implementation_unit !== 'GLOSSARY-TIMETABLE-TERM-EXPANSION-01') fail('next implementation unit differs');
if (Object.entries(audit.public_boundary ?? {}).some(([key, value]) => key === 'definition_and_navigation_allowed' ? value !== true : value !== false)) fail('audit public boundary differs');
if (Object.values(audit.automation_boundary ?? {}).some((value) => value !== false)) fail('audit automation boundary differs');

if (registry.schema_version !== 'glossary-role-registry-v1') fail('registry schema differs');
if (registry.work_id !== audit.work_id || registry.implementation_unit !== audit.implementation_unit) fail('registry identity differs');
if (registry.reviewed_at !== audit.reviewed_at) fail('registry review date differs');
if (registry.scope?.baseline_glossary_records !== 31 || registry.scope?.implemented_glossary_records !== 36 || registry.scope?.baseline_role_records !== 3 || registry.scope?.implemented_role_records !== 8 || registry.scope?.participant_role_records !== 5 || registry.scope?.race_official_role_records !== 3 || registry.scope?.new_bilingual_routes !== 10 || registry.scope?.implemented_bilingual_routes !== 72) fail('registry scope differs');

const expectedParticipantIds = ['jockey', 'driver', 'trainer', 'owner', 'breeder'];
const expectedOfficialIds = ['steward', 'starter', 'clerk-of-scales'];
const expectedAddedIds = ['owner', 'breeder', 'steward', 'starter', 'clerk-of-scales'];
const expectedReconciledIds = ['jockey', 'driver', 'trainer'];
if (!exact(registry.participant_role_ids, expectedParticipantIds) || !exact(audit.participant_role_ids, expectedParticipantIds)) fail('participant-role IDs differ');
if (!exact(registry.race_official_role_ids, expectedOfficialIds) || !exact(audit.race_official_role_ids, expectedOfficialIds)) fail('race-official-role IDs differ');
if (!exact(audit.added_ids, expectedAddedIds)) fail('added role IDs differ');
if (!exact(audit.reconciled_ids, expectedReconciledIds)) fail('reconciled role IDs differ');

const ids = glossary.map((entry) => entry.id);
const slugs = glossary.map((entry) => entry.slug);
const entryById = new Map(glossary.map((entry) => [entry.id, entry]));
if (glossary.length < 36) fail(`glossary record count regressed below 36; found ${glossary.length}`);
if (new Set(ids).size !== glossary.length) fail('glossary IDs are not unique');
if (new Set(slugs).size !== glossary.length) fail('glossary slugs are not unique');
const roles = glossary.filter((entry) => entry.category === 'role');
if (roles.length !== 8) fail(`role count expected 8; found ${roles.length}`);
if (glossary.filter((entry) => entry.category === 'race_type').length !== 10) fail('race-type count changed');
if (glossary.filter((entry) => entry.category === 'breed').length !== 4) fail('breed count changed');
if (glossary.filter((entry) => entry.category === 'horse_type').length !== 1) fail('horse-type count changed');

const overlayIds = overlay.map((entry) => entry.id);
if (!exact(overlayIds, [
  'harness-racing', 'meeting', 'post-time',
  'jockey', 'driver', 'trainer', 'owner', 'breeder', 'steward', 'starter', 'clerk-of-scales',
])) fail('role overlay order/content differs');
if (new Set(overlayIds).size !== overlay.length) fail('role overlay IDs are not unique');

const roleRecordById = new Map(registry.records.map((record) => [record.id, record]));
if (roleRecordById.size !== 8) fail('registry role record count differs');
for (const id of [...expectedParticipantIds, ...expectedOfficialIds]) {
  const record = roleRecordById.get(id);
  const entry = entryById.get(id);
  if (!record || !entry) {
    fail(`role record missing: ${id}`);
    continue;
  }
  for (const field of [
    'term_en', 'term_ja', 'summary_en', 'summary_ja',
    'aliases_en', 'aliases_ja', 'reading_ja',
    'beginner_explanation_en', 'beginner_explanation_ja',
    'source_ids', 'evidence_status',
  ]) if (!exact(entry[field], record[field])) fail(`${id}: glossary ${field} differs from registry`);
  if (!exact(entry.related_term_ids, record.related_concept_ids)) fail(`${id}: related concepts differ`);
  if (entry.category !== 'role') fail(`${id}: category must be role`);
  if (entry.content_status !== 'enriched_reviewed') fail(`${id}: content status differs`);
  if (entry.last_reviewed !== '2026-07-16') fail(`${id}: review date differs`);
  if (entry.public_boundary?.mode !== 'definition_and_navigation' || entry.public_boundary?.republish_dataset !== false) fail(`${id}: public boundary differs`);
  if (!exact(entry.public_boundary?.prohibited_dataset_keys, ['participant_data'])) fail(`${id}: participant dataset boundary differs`);
  const expectedGroup = expectedParticipantIds.includes(id) ? 'participant_role' : 'race_official_role';
  if (record.role_group !== expectedGroup) fail(`${id}: role group differs`);
}

for (const [left, right] of audit.relationship_pairs ?? []) {
  const leftEntry = entryById.get(left);
  const rightEntry = entryById.get(right);
  if (!leftEntry || !rightEntry) {
    fail(`relationship endpoint missing: ${left} <-> ${right}`);
    continue;
  }
  if (!leftEntry.related_term_ids.includes(right) || !rightEntry.related_term_ids.includes(left)) fail(`relationship is not reciprocal: ${left} <-> ${right}`);
}
for (const entry of glossary) {
  for (const relatedId of entry.related_term_ids) {
    const related = entryById.get(relatedId);
    if (!related) fail(`${entry.id}: broken related term ${relatedId}`);
    else if (!related.related_term_ids.includes(entry.id)) fail(`${entry.id}: non-reciprocal related term ${relatedId}`);
  }
}

if (Object.values(registry.classification_boundaries ?? {}).some((value) => value !== true)) fail('classification boundary differs');
if (entryById.get('jockey')?.term_en === entryById.get('driver')?.term_en) fail('Jockey and Driver were conflated');
if (entryById.get('trainer')?.related_term_ids.length !== 2) fail('Trainer relation boundary differs');
if (entryById.get('steward')?.category !== 'role') fail('Steward must remain a role');
if (entryById.get('starter')?.id === entryById.get('post-time')?.id) fail('Starter and Post time were conflated');

const runtime = read(runtimePath);
for (const marker of ['glossary-entries-role-v1.json', 'const overlays', 'for (const overlay of overlays)']) {
  if (!runtime.includes(marker)) fail(`runtime glossary merger missing ${marker}`);
}
for (const page of [
  'src/pages/glossary/index.astro',
  'src/pages/ja/glossary/index.astro',
  'src/pages/glossary/[slug].astro',
  'src/pages/ja/glossary/[slug].astro',
]) if (!read(page).includes('lib/glossary-data')) fail(`${page} does not use merged glossary data`);

const doc = read(docPath);
for (const marker of [
  'GLOSSARY-ROLE-EXPANSION-01', 'Participant roles', 'Race-official roles',
  'Jockey', 'Driver', 'Trainer', 'Owner', 'Breeder', 'Steward', 'Starter', 'Clerk of the scales',
  'ownership records', 'pedigrees', 'rider weights', 'disciplinary records',
  'GLOSSARY-TIMETABLE-TERM-EXPANSION-01',
]) if (!doc.includes(marker)) fail(`role expansion document missing ${marker}`);

if (!fs.existsSync(filePath('dist'))) fail('dist is missing; run npm run build first');
let renderedErrors = 0;
for (const entry of glossary) {
  for (const [lang, prefix, term, summary] of [
    ['en', '', entry.term_en, entry.summary_en],
    ['ja', 'ja/', entry.term_ja, entry.summary_ja],
  ]) {
    const output = filePath(`dist/${prefix}glossary/${entry.slug}/index.html`);
    if (!fs.existsSync(output)) {
      fail(`${entry.id}: missing ${lang} route`);
      renderedErrors += 1;
      continue;
    }
    const html = fs.readFileSync(output, 'utf8');
    if (!html.includes(term) || !html.includes(summary)) { fail(`${entry.id}: ${lang} rendered content differs`); renderedErrors += 1; }
    if (!html.includes(`data-glossary-content-status="${entry.content_status}"`)) { fail(`${entry.id}: ${lang} content-status marker differs`); renderedErrors += 1; }
  }
}
for (const id of [...expectedParticipantIds, ...expectedOfficialIds]) {
  const entry = entryById.get(id);
  for (const [prefix, markers] of [
    ['', ['<h2 id="aliases-heading">Aliases</h2>', '<h2 id="beginner-heading">Beginner explanation</h2>', '<h2 id="related-heading">Related terms</h2>']],
    ['ja/', ['<h2 id="aliases-heading">別名</h2>', '<h2 id="beginner-heading">初心者向け説明</h2>', '<h2 id="related-heading">関連用語</h2>']],
  ]) {
    const html = fs.readFileSync(filePath(`dist/${prefix}glossary/${id}/index.html`), 'utf8');
    for (const marker of markers) if (!html.includes(marker)) { fail(`${id}: rendered optional section missing ${marker}`); renderedErrors += 1; }
    if (!html.includes(entry.reading_ja)) { fail(`${id}: Japanese reading is missing from rendered page`); renderedErrors += 1; }
  }
}
if (renderedErrors !== 0) fail(`rendered route errors: ${renderedErrors}`);

if (errors.length) {
  console.error(`GLOSSARY_ROLE_EXPANSION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('GLOSSARY_ROLE_EXPANSION: pass');
console.log(`CURRENT_GLOSSARY_RECORDS: ${glossary.length}`);
console.log('ROLE_RELEASE_RECORDS: 36');
console.log('ROLE_RECORDS: 8');
console.log('PARTICIPANT_ROLE_RECORDS: 5');
console.log('RACE_OFFICIAL_ROLE_RECORDS: 3');
console.log('ROLE_RELEASE_BILINGUAL_ROUTES: 72');
console.log('RECIPROCAL_RELATIONSHIPS: 6');
console.log('CLASSIFICATION_CONFLATION_ERRORS: 0');
console.log('PARTICIPANT_DATASET_REPUBLICATION: false');
console.log('NEXT_IMPLEMENTATION_UNIT: GLOSSARY-TIMETABLE-TERM-EXPANSION-01');
