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

const audit = parse('data/audits/glossary-official-source-term-expansion-v1.json');
const registry = parse('data/static/glossary-official-source-term-registry-v1.json');
const overlay = parse('data/static/glossary-entries-official-source-v1.json');
const glossary = loadGlossary(root);
const workflowPath = '.github/workflows/glossary-official-source-term-expansion.yml';
const docPath = 'docs/glossary/official-source-term-expansion.md';
const runtimePath = 'src/lib/glossary-data.ts';
const loaderPath = 'scripts/glossary-data-loader.mjs';

for (const requiredPath of [workflowPath, docPath, runtimePath, loaderPath]) {
  if (!fs.existsSync(filePath(requiredPath))) fail(`required file missing: ${requiredPath}`);
}

if (fs.existsSync(filePath(workflowPath))) {
  const workflow = read(workflowPath);
  for (const marker of [
    'npm install --package-lock=false',
    'npm run build',
    'node scripts/check-glossary-schema-extension.mjs',
    'node scripts/check-glossary-racing-type-expansion.mjs',
    'node scripts/check-glossary-horse-breed-expansion.mjs',
    'node scripts/check-glossary-role-expansion.mjs',
    'node scripts/check-glossary-timetable-term-expansion.mjs',
    'node scripts/check-glossary-official-source-term-expansion.mjs',
    'git status --porcelain',
  ]) if (!workflow.includes(marker)) fail(`official-source workflow missing ${marker}`);
  for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare']) {
    if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`official-source workflow contains forbidden marker ${forbidden}`);
  }
}

if (audit.schema_version !== 'glossary-official-source-term-expansion-v1') fail('audit schema differs');
if (audit.work_id !== 'WHR-GLOSSARY-DICTIONARY-V1') fail('audit Work ID differs');
if (audit.implementation_unit !== 'GLOSSARY-OFFICIAL-SOURCE-TERM-EXPANSION-01') fail('audit implementation unit differs');
if (!['implemented_for_review', 'complete'].includes(audit.status)) fail('audit status differs');
if (audit.reviewed_at !== '2026-07-16') fail('audit review date differs');
if (audit.baseline?.glossary_records !== 40 || audit.baseline?.official_source_records !== 0 || audit.baseline?.governance_term_records !== 0 || audit.baseline?.bilingual_routes !== 80) fail('audit baseline differs');
if (
  audit.implemented?.glossary_records !== 48 ||
  audit.implemented?.official_source_records !== 5 ||
  audit.implemented?.governance_term_records !== 3 ||
  audit.implemented?.new_records !== 8 ||
  audit.implemented?.reconciled_existing_records !== 2 ||
  audit.implemented?.bilingual_routes !== 96 ||
  audit.implemented?.new_bilingual_routes !== 16 ||
  audit.implemented?.reciprocal_relationships !== 9
) fail('audit implemented counts differ');
if (audit.next_implementation_unit !== 'GLOSSARY-MULTILINGUAL-FIELD-CLEANUP-01') fail('next implementation unit differs');
if (Object.entries(audit.public_boundary ?? {}).some(([key, value]) => key === 'definition_and_navigation_allowed' ? value !== true : value !== false)) fail('audit public boundary differs');
if (Object.values(audit.automation_boundary ?? {}).some((value) => value !== false)) fail('audit automation boundary differs');

if (registry.schema_version !== 'glossary-official-source-term-registry-v1') fail('registry schema differs');
if (registry.work_id !== audit.work_id || registry.implementation_unit !== audit.implementation_unit) fail('registry identity differs');
if (registry.reviewed_at !== audit.reviewed_at) fail('registry review date differs');
if (
  registry.scope?.baseline_glossary_records !== 40 ||
  registry.scope?.implemented_glossary_records !== 48 ||
  registry.scope?.official_source_records !== 5 ||
  registry.scope?.governance_term_records !== 3 ||
  registry.scope?.reconciled_existing_records !== 2 ||
  registry.scope?.new_bilingual_routes !== 16 ||
  registry.scope?.implemented_bilingual_routes !== 96
) fail('registry scope differs');

const expectedOfficialSourceIds = ['official-source', 'official-calendar', 'official-racecard', 'link-first-source', 'source-status'];
const expectedGovernanceIds = ['governing-body', 'racing-authority', 'racecourse-operator'];
const expectedNewIds = [...expectedOfficialSourceIds, ...expectedGovernanceIds];
const expectedOverlayIds = ['fixture', 'racecard', ...expectedNewIds];
if (!exact(registry.official_source_ids, expectedOfficialSourceIds) || !exact(audit.added_official_source_ids, expectedOfficialSourceIds)) fail('official-source IDs differ');
if (!exact(registry.governance_term_ids, expectedGovernanceIds) || !exact(audit.added_governance_term_ids, expectedGovernanceIds)) fail('governance-term IDs differ');
if (!exact(audit.reconciled_ids, ['fixture', 'racecard'])) fail('reconciled IDs differ');
if (!exact(overlay.map((entry) => entry.id), expectedOverlayIds)) fail('official-source overlay order/content differs');
if (new Set(overlay.map((entry) => entry.id)).size !== overlay.length) fail('official-source overlay IDs are not unique');

const ids = glossary.map((entry) => entry.id);
const slugs = glossary.map((entry) => entry.slug);
const entryById = new Map(glossary.map((entry) => [entry.id, entry]));
if (glossary.length !== 48) fail(`glossary record count expected 48; found ${glossary.length}`);
if (new Set(ids).size !== glossary.length) fail('glossary IDs are not unique');
if (new Set(slugs).size !== glossary.length) fail('glossary slugs are not unique');
if (glossary.filter((entry) => entry.category === 'official_source').length !== 5) fail('official-source count differs');
if (glossary.filter((entry) => entry.category === 'governance_term').length !== 3) fail('governance-term count differs');
if (glossary.filter((entry) => entry.category === 'data_term').length !== 8) fail('data-term count changed');
if (glossary.filter((entry) => entry.category === 'role').length !== 8) fail('role count changed');
if (glossary.filter((entry) => entry.category === 'race_type').length !== 10) fail('race-type count changed');
if (glossary.filter((entry) => entry.category === 'breed').length !== 4) fail('breed count changed');
if (glossary.filter((entry) => entry.category === 'horse_type').length !== 1) fail('horse-type count changed');

const registryById = new Map(registry.records.map((record) => [record.id, record]));
if (registryById.size !== 8 || !exact(registry.records.map((record) => record.id), expectedNewIds)) fail('registry record order/content differs');
for (const id of expectedNewIds) {
  const record = registryById.get(id);
  const entry = entryById.get(id);
  if (!record || !entry) {
    fail(`official-source record missing: ${id}`);
    continue;
  }
  for (const field of [
    'term_en', 'term_ja', 'summary_en', 'summary_ja',
    'aliases_en', 'aliases_ja', 'reading_ja',
    'beginner_explanation_en', 'beginner_explanation_ja',
  ]) if (!exact(entry[field], record[field])) fail(`${id}: glossary ${field} differs from registry`);
  for (const relatedId of record.related_concept_ids) if (!entry.related_term_ids.includes(relatedId)) fail(`${id}: required related concept missing ${relatedId}`);
  if (!exact(entry.public_boundary?.prohibited_dataset_keys, record.prohibited_dataset_keys)) fail(`${id}: prohibited dataset keys differ`);
  const expectedCategory = expectedOfficialSourceIds.includes(id) ? 'official_source' : 'governance_term';
  if (entry.category !== expectedCategory) fail(`${id}: category differs`);
  if (record.term_group !== expectedCategory) fail(`${id}: registry term group differs`);
  if (entry.content_status !== 'enriched_reviewed') fail(`${id}: content status differs`);
  if (entry.evidence_status !== 'reviewed_secondary') fail(`${id}: evidence status differs`);
  if (entry.last_reviewed !== '2026-07-16') fail(`${id}: review date differs`);
  if (entry.public_boundary?.mode !== 'definition_and_navigation' || entry.public_boundary?.republish_dataset !== false) fail(`${id}: public boundary differs`);
  if (entry.source_ids.length !== 0) fail(`${id}: source IDs must remain empty in the terminology unit`);
}

if (!entryById.get('fixture')?.related_term_ids.includes('official-calendar')) fail('Fixture does not link to Official calendar');
if (!entryById.get('racecard')?.related_term_ids.includes('official-racecard')) fail('Racecard does not link to Official racecard');
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
if (!entryById.get('official-source')?.summary_en.includes('provenance')) fail('Official source provenance boundary is missing');
if (!entryById.get('official-racecard')?.public_boundary.prohibited_dataset_keys.includes('raw_source_body')) fail('Official racecard republication boundary is missing');
if (!entryById.get('link-first-source')?.summary_en.includes('automated extraction')) fail('Link-first automation boundary is missing');
if (!entryById.get('source-status')?.summary_en.includes('not a universal quality score')) fail('Source-status quality boundary is missing');
if (entryById.get('governing-body')?.id === entryById.get('racing-authority')?.id) fail('Governing body and Racing authority were conflated');
if (entryById.get('racecourse-operator')?.category !== 'governance_term') fail('Racecourse operator classification differs');

const loader = read(loaderPath);
for (const marker of ['glossary-entries-role-v1.json', 'glossary-entries-timetable-v1.json', 'glossary-entries-official-source-v1.json', 'overlayPriority']) {
  if (!loader.includes(marker)) fail(`glossary loader missing ${marker}`);
}
const runtime = read(runtimePath);
for (const marker of ['glossary-entries-role-v1.json', 'glossary-entries-timetable-v1.json', 'glossary-entries-official-source-v1.json', 'const overlays', 'for (const overlay of overlays)']) {
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
  'GLOSSARY-OFFICIAL-SOURCE-TERM-EXPANSION-01',
  'Official-source concepts', 'Governance concepts',
  'Official source', 'Official calendar', 'Official racecard', 'Link-first source', 'Source status',
  'Governing body', 'Racing authority', 'Racecourse operator',
  'raw source bodies', 'automatic source acceptance', 'live fetching',
  'GLOSSARY-MULTILINGUAL-FIELD-CLEANUP-01',
]) if (!doc.includes(marker)) fail(`official-source expansion document missing ${marker}`);

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
for (const id of expectedNewIds) {
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
for (const id of ['official-source', 'official-racecard', 'link-first-source']) {
  const en = fs.readFileSync(filePath(`dist/glossary/${id}/index.html`), 'utf8');
  const ja = fs.readFileSync(filePath(`dist/ja/glossary/${id}/index.html`), 'utf8');
  if (!en.includes('<h2>Public data boundary</h2>')) { fail(`${id}: English public-boundary notice missing`); renderedErrors += 1; }
  if (!ja.includes('<h2>公開データ境界</h2>')) { fail(`${id}: Japanese public-boundary notice missing`); renderedErrors += 1; }
}
if (renderedErrors !== 0) fail(`rendered route errors: ${renderedErrors}`);

if (errors.length) {
  console.error(`GLOSSARY_OFFICIAL_SOURCE_TERM_EXPANSION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('GLOSSARY_OFFICIAL_SOURCE_TERM_EXPANSION: pass');
console.log('GLOSSARY_RECORDS: 48');
console.log('OFFICIAL_SOURCE_RECORDS: 5');
console.log('GOVERNANCE_TERM_RECORDS: 3');
console.log('BILINGUAL_ROUTES: 96');
console.log('RECIPROCAL_RELATIONSHIPS: 9');
console.log('CLASSIFICATION_CONFLATION_ERRORS: 0');
console.log('SOURCE_BODY_REPUBLICATION: false');
console.log('LIVE_FETCH_ENABLED: false');
console.log('NEXT_IMPLEMENTATION_UNIT: GLOSSARY-MULTILINGUAL-FIELD-CLEANUP-01');
