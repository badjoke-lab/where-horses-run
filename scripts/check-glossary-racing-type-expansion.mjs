import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const filePath = (file) => path.join(root, file);
const read = (file) => fs.readFileSync(filePath(file), 'utf8');
const parse = (file) => JSON.parse(read(file));

const audit = parse('data/audits/glossary-racing-type-expansion-v1.json');
const registry = parse('data/static/glossary-racing-type-registry-v1.json');
const glossary = parse('data/static/glossary.json');
const workflowPath = '.github/workflows/glossary-racing-type-expansion.yml';
const docPath = 'docs/glossary/racing-type-expansion.md';

if (!fs.existsSync(filePath(workflowPath))) fail('racing-type expansion workflow is missing');
if (!fs.existsSync(filePath(docPath))) fail('racing-type expansion document is missing');
if (fs.existsSync(filePath(workflowPath))) {
  const workflow = read(workflowPath);
  for (const marker of ['npm install --package-lock=false', 'npm run build', 'node scripts/check-glossary-schema-extension.mjs', 'node scripts/check-glossary-racing-type-expansion.mjs', 'git status --porcelain']) {
    if (!workflow.includes(marker)) fail(`racing-type workflow missing ${marker}`);
  }
  for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare']) {
    if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`racing-type workflow contains forbidden marker ${forbidden}`);
  }
}

if (audit.schema_version !== 'glossary-racing-type-expansion-v1') fail('audit schema differs');
if (audit.work_id !== 'WHR-GLOSSARY-DICTIONARY-V1') fail('audit Work ID differs');
if (audit.implementation_unit !== 'GLOSSARY-RACING-TYPE-EXPANSION-01') fail('audit implementation unit differs');
if (!['implemented_for_review', 'complete'].includes(audit.status)) fail('audit status differs');
if (audit.reviewed_at !== '2026-07-16') fail('audit review date differs');
if (audit.baseline?.glossary_records !== 23 || audit.baseline?.race_type_records !== 7 || audit.baseline?.bilingual_routes !== 46) fail('audit baseline differs');
if (audit.implemented?.glossary_records !== 26 || audit.implemented?.race_type_records !== 10 || audit.implemented?.browse_primary_records !== 8 || audit.implemented?.supporting_definition_records !== 2 || audit.implemented?.bilingual_routes !== 52 || audit.implemented?.new_records !== 3 || audit.implemented?.reconciled_existing_records !== 7) fail('audit implemented counts differ');
if (audit.next_implementation_unit !== 'GLOSSARY-HORSE-BREED-EXPANSION-01') fail('next implementation unit differs');
if (Object.entries(audit.public_boundary ?? {}).some(([key, value]) => key === 'definition_and_navigation_allowed' ? value !== true : value !== false)) fail('audit public boundary differs');
if (Object.values(audit.automation_boundary ?? {}).some((value) => value !== false)) fail('audit automation boundary differs');

if (registry.schema_version !== 'glossary-racing-type-registry-v1') fail('registry schema differs');
if (registry.work_id !== audit.work_id || registry.implementation_unit !== audit.implementation_unit) fail('registry identity differs');
if (registry.reviewed_at !== audit.reviewed_at) fail('registry review date differs');
if (registry.scope?.baseline_race_type_records !== 7 || registry.scope?.implemented_race_type_records !== 10 || registry.scope?.browse_primary_records !== 8 || registry.scope?.supporting_definition_records !== 2) fail('registry scope differs');

const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const expectedBrowseIds = [
  'thoroughbred-racing', 'jump-racing', 'harness-racing', 'trotting',
  'pacing', 'arabian-racing', 'quarter-horse-racing', 'banei-racing',
];
const expectedSupportingIds = ['flat-racing', 'steeplechase'];
const expectedAddedIds = ['flat-racing', 'jump-racing', 'steeplechase'];
const expectedReconciledIds = [
  'thoroughbred-racing', 'harness-racing', 'trotting', 'pacing',
  'arabian-racing', 'quarter-horse-racing', 'banei-racing',
];
if (!exact(registry.browse_primary_ids, expectedBrowseIds) || !exact(audit.browse_primary_ids, expectedBrowseIds)) fail('browse-primary IDs differ');
if (!exact(registry.supporting_definition_ids, expectedSupportingIds) || !exact(audit.supporting_definition_ids, expectedSupportingIds)) fail('supporting-definition IDs differ');
if (!exact(audit.added_ids, expectedAddedIds)) fail('added IDs differ');
if (!exact(audit.reconciled_ids, expectedReconciledIds)) fail('reconciled IDs differ');

const ids = glossary.map((entry) => entry.id);
const slugs = glossary.map((entry) => entry.slug);
const idSet = new Set(ids);
if (glossary.length !== 26) fail(`glossary record count expected 26; found ${glossary.length}`);
if (idSet.size !== glossary.length) fail('glossary IDs are not unique');
if (new Set(slugs).size !== glossary.length) fail('glossary slugs are not unique');

const raceTypes = glossary.filter((entry) => entry.category === 'race_type');
if (raceTypes.length !== 10) fail(`race-type record count expected 10; found ${raceTypes.length}`);
const raceTypeById = new Map(raceTypes.map((entry) => [entry.id, entry]));
const registryIds = registry.records.map((record) => record.id);
if (new Set(registryIds).size !== registry.records.length) fail('registry IDs are not unique');
if (!exact(registryIds, [
  'thoroughbred-racing', 'flat-racing', 'jump-racing', 'steeplechase',
  'harness-racing', 'trotting', 'pacing', 'arabian-racing',
  'quarter-horse-racing', 'banei-racing',
])) fail('registry order/content differs');

for (const record of registry.records) {
  const entry = raceTypeById.get(record.id);
  if (!entry) {
    fail(`registry record missing from glossary: ${record.id}`);
    continue;
  }
  for (const field of ['term_en', 'term_ja', 'summary_en', 'summary_ja']) {
    if (entry[field] !== record[field]) fail(`${record.id}: glossary ${field} differs from registry`);
  }
  if (entry.content_status !== 'enriched_reviewed') fail(`${record.id}: race-type content must be enriched_reviewed`);
  if (!['reviewed_secondary', 'reviewed_official', 'mixed_reviewed'].includes(entry.evidence_status)) fail(`${record.id}: race-type evidence status is not reviewed`);
  if (entry.public_boundary?.republish_dataset !== false || entry.public_boundary?.mode !== 'definition_and_navigation') fail(`${record.id}: public boundary differs`);
  if (record.parent_race_type_id !== null && !raceTypeById.has(record.parent_race_type_id)) fail(`${record.id}: broken registry parent ${record.parent_race_type_id}`);
  if (!['browse_primary', 'supporting_definition'].includes(record.taxonomy_role)) fail(`${record.id}: invalid taxonomy role`);
}
for (const id of raceTypeById.keys()) if (!registryIds.includes(id)) fail(`race-type glossary record missing from registry: ${id}`);

const boundaries = registry.classification_boundaries ?? {};
for (const id of boundaries.breed_ids_reserved_for_later ?? []) if (idSet.has(id)) fail(`breed record entered during racing-type unit: ${id}`);
for (const id of boundaries.surface_ids_not_race_types ?? []) {
  const entry = glossary.find((candidate) => candidate.id === id);
  if (!entry || entry.category !== 'surface') fail(`${id}: surface classification changed`);
}
if (boundaries.banei_is_jump_racing !== false || boundaries.flat_racing_is_surface !== false || boundaries.trotting_and_pacing_are_breeds !== false) fail('classification boolean boundary differs');

const thoroughbred = raceTypeById.get('thoroughbred-racing');
if (!thoroughbred.aliases_en.includes('Thoroughbred racing') || !thoroughbred.aliases_ja.includes('サラブレッド競馬')) fail('thoroughbred legacy labels are not preserved as aliases');
if (!raceTypeById.get('banei-racing')?.source_ids.includes('japan-banei-home')) fail('Banei reviewed official source is missing');
for (const id of expectedAddedIds) {
  const entry = raceTypeById.get(id);
  if (!entry || entry.last_reviewed !== '2026-07-16') fail(`${id}: new record review date differs`);
}

const doc = read(docPath);
for (const marker of [
  'GLOSSARY-RACING-TYPE-EXPANSION-01',
  'Thoroughbred flat racing',
  'Jump racing',
  'Flat racing',
  'Steeplechase',
  'breed',
  'surface',
  'governing body',
  'GLOSSARY-HORSE-BREED-EXPANSION-01',
]) if (!doc.includes(marker)) fail(`racing-type expansion document missing ${marker}`);

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
for (const id of expectedAddedIds) {
  for (const prefix of ['', 'ja/']) {
    if (!fs.existsSync(filePath(`dist/${prefix}glossary/${id}/index.html`))) {
      fail(`${id}: missing new bilingual route`);
      renderedErrors += 1;
    }
  }
}
if (renderedErrors !== 0) fail(`rendered route errors: ${renderedErrors}`);

if (errors.length) {
  console.error(`GLOSSARY_RACING_TYPE_EXPANSION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('GLOSSARY_RACING_TYPE_EXPANSION: pass');
console.log('GLOSSARY_RECORDS: 26');
console.log('RACE_TYPE_RECORDS: 10');
console.log('BROWSE_PRIMARY_RECORDS: 8');
console.log('SUPPORTING_DEFINITION_RECORDS: 2');
console.log('BILINGUAL_ROUTES: 52');
console.log('NEW_RECORDS: flat-racing,jump-racing,steeplechase');
console.log('CLASSIFICATION_CONFLATION_ERRORS: 0');
console.log('DATASET_REPUBLICATION: false');
console.log('NEXT_IMPLEMENTATION_UNIT: GLOSSARY-HORSE-BREED-EXPANSION-01');
