import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const filePath = (file) => path.join(root, file);
const read = (file) => fs.readFileSync(filePath(file), 'utf8');
const parse = (file) => JSON.parse(read(file));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const audit = parse('data/audits/glossary-horse-breed-expansion-v1.json');
const registry = parse('data/static/glossary-horse-breed-registry-v1.json');
const glossary = parse('data/static/glossary.json');
const entrySchema = parse('data/static/glossary-entry-v2.schema.json');
const sources = parse('data/static/sources.json');
const workflowPath = '.github/workflows/glossary-horse-breed-expansion.yml';
const docPath = 'docs/glossary/horse-breed-expansion.md';

if (!fs.existsSync(filePath(workflowPath))) fail('horse-breed expansion workflow is missing');
if (!fs.existsSync(filePath(docPath))) fail('horse-breed expansion document is missing');
if (fs.existsSync(filePath(workflowPath))) {
  const workflow = read(workflowPath);
  for (const marker of [
    'npm install --package-lock=false',
    'npm run build',
    'node scripts/check-glossary-schema-extension.mjs',
    'node scripts/check-glossary-racing-type-expansion.mjs',
    'node scripts/check-glossary-horse-breed-expansion.mjs',
    'git status --porcelain',
  ]) if (!workflow.includes(marker)) fail(`horse-breed workflow missing ${marker}`);
  for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare']) {
    if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`horse-breed workflow contains forbidden marker ${forbidden}`);
  }
}

if (audit.schema_version !== 'glossary-horse-breed-expansion-v1') fail('audit schema differs');
if (audit.work_id !== 'WHR-GLOSSARY-DICTIONARY-V1') fail('audit Work ID differs');
if (audit.implementation_unit !== 'GLOSSARY-HORSE-BREED-EXPANSION-01') fail('audit implementation unit differs');
if (!['implemented_for_review', 'complete'].includes(audit.status)) fail('audit status differs');
if (audit.reviewed_at !== '2026-07-16') fail('audit review date differs');
if (audit.baseline?.glossary_records !== 26 || audit.baseline?.breed_records !== 0 || audit.baseline?.horse_type_records !== 0 || audit.baseline?.bilingual_routes !== 52) fail('audit baseline differs');
if (audit.implemented?.glossary_records !== 31 || audit.implemented?.breed_records !== 4 || audit.implemented?.horse_type_records !== 1 || audit.implemented?.new_records !== 5 || audit.implemented?.bilingual_routes !== 62 || audit.implemented?.new_bilingual_routes !== 10 || audit.implemented?.official_source_links !== 4 || audit.implemented?.mixed_source_links !== 1) fail('audit implemented counts differ');
if (audit.next_implementation_unit !== 'GLOSSARY-ROLE-EXPANSION-01') fail('next implementation unit differs');
if (Object.entries(audit.public_boundary ?? {}).some(([key, value]) => key === 'definition_and_navigation_allowed' ? value !== true : value !== false)) fail('audit public boundary differs');
if (Object.values(audit.automation_boundary ?? {}).some((value) => value !== false)) fail('audit automation boundary differs');

if (registry.schema_version !== 'glossary-horse-breed-registry-v1') fail('registry schema differs');
if (registry.work_id !== audit.work_id || registry.implementation_unit !== audit.implementation_unit) fail('registry identity differs');
if (registry.reviewed_at !== audit.reviewed_at) fail('registry review date differs');
if (registry.scope?.baseline_glossary_records !== 26 || registry.scope?.implemented_glossary_records !== 31 || registry.scope?.breed_records !== 4 || registry.scope?.horse_type_records !== 1 || registry.scope?.new_bilingual_routes !== 10 || registry.scope?.implemented_bilingual_routes !== 62) fail('registry scope differs');

const expectedBreedIds = ['thoroughbred', 'arabian-horse', 'american-quarter-horse', 'standardbred'];
const expectedHorseTypeIds = ['draft-horse'];
if (!exact(registry.breed_ids, expectedBreedIds) || !exact(audit.added_breed_ids, expectedBreedIds)) fail('breed IDs differ');
if (!exact(registry.horse_type_ids, expectedHorseTypeIds) || !exact(audit.added_horse_type_ids, expectedHorseTypeIds)) fail('horse-type IDs differ');
if (!entrySchema.properties?.category?.enum?.includes('horse_type')) fail('glossary schema does not include horse_type');

const ids = glossary.map((entry) => entry.id);
const slugs = glossary.map((entry) => entry.slug);
const idSet = new Set(ids);
const entryById = new Map(glossary.map((entry) => [entry.id, entry]));
if (glossary.length !== 31) fail(`glossary record count expected 31; found ${glossary.length}`);
if (idSet.size !== glossary.length) fail('glossary IDs are not unique');
if (new Set(slugs).size !== glossary.length) fail('glossary slugs are not unique');
if (glossary.filter((entry) => entry.category === 'breed').length !== 4) fail('breed count differs');
if (glossary.filter((entry) => entry.category === 'horse_type').length !== 1) fail('horse-type count differs');
if (glossary.filter((entry) => entry.category === 'race_type').length !== 10) fail('race-type count changed');

const registryIds = registry.records.map((record) => record.id);
if (!exact(registryIds, [...expectedBreedIds, ...expectedHorseTypeIds])) fail('registry record order/content differs');
const sourceIds = new Set(sources.map((source) => source.id));
const expectedOfficialSourceIds = new Set([
  'united-states-jockey-club-registry',
  'united-states-arabian-horse-association',
  'united-states-aqha',
  'united-states-usta',
]);
for (const sourceId of expectedOfficialSourceIds) if (!sourceIds.has(sourceId)) fail(`official breed source missing: ${sourceId}`);

for (const record of registry.records) {
  const entry = entryById.get(record.id);
  if (!entry) {
    fail(`registry record missing from glossary: ${record.id}`);
    continue;
  }
  for (const field of ['category', 'term_en', 'term_ja', 'summary_en', 'summary_ja', 'aliases_en', 'aliases_ja', 'reading_ja', 'beginner_explanation_en', 'beginner_explanation_ja', 'source_ids', 'evidence_status']) {
    const registryField = field === 'beginner_explanation_en' ? 'beginner_explanation_en' : field === 'beginner_explanation_ja' ? 'beginner_explanation_ja' : field;
    const recordValue = record[registryField] ?? (field === 'beginner_explanation_en' ? record.beginner_explanation_en : field === 'beginner_explanation_ja' ? record.beginner_explanation_ja : undefined);
    if (!exact(entry[field], recordValue)) fail(`${record.id}: glossary ${field} differs from registry`);
  }
  if (!exact(entry.related_term_ids, record.related_racing_type_ids)) fail(`${record.id}: related racing types differ`);
  if (entry.content_status !== 'enriched_reviewed') fail(`${record.id}: content status differs`);
  if (entry.last_reviewed !== '2026-07-16') fail(`${record.id}: review date differs`);
  if (entry.public_boundary?.mode !== 'definition_and_navigation' || entry.public_boundary?.republish_dataset !== false) fail(`${record.id}: public boundary differs`);
  for (const sourceId of entry.source_ids) if (!sourceIds.has(sourceId)) fail(`${record.id}: broken source ID ${sourceId}`);
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

const boundaries = registry.classification_boundaries ?? {};
if (Object.values(boundaries).some((value) => value !== true)) fail('classification boundary differs');
if (entryById.get('draft-horse')?.category !== 'horse_type') fail('Draft horse must be horse_type');
if (entryById.get('standardbred')?.category !== 'breed') fail('Standardbred must be breed');
for (const id of ['trotting', 'pacing', 'harness-racing', 'banei-racing']) {
  if (entryById.get(id)?.category !== 'race_type') fail(`${id}: race-type classification changed`);
}

const doc = read(docPath);
for (const marker of [
  'GLOSSARY-HORSE-BREED-EXPANSION-01',
  'Thoroughbred',
  'Arabian horse',
  'American Quarter Horse',
  'Standardbred',
  'Draft horse',
  'horse_type',
  'reciprocal',
  'registry',
  'pedigree',
  'GLOSSARY-ROLE-EXPANSION-01',
]) if (!doc.includes(marker)) fail(`horse-breed expansion document missing ${marker}`);

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
for (const id of [...expectedBreedIds, ...expectedHorseTypeIds]) {
  const entry = entryById.get(id);
  for (const [prefix, aliasHeading, beginnerHeading, relatedHeading, sourceHeading] of [
    ['', '<h2 id="aliases-heading">Aliases</h2>', '<h2 id="beginner-heading">Beginner explanation</h2>', '<h2 id="related-heading">Related terms</h2>', '<h2 id="sources-heading">Reviewed source IDs</h2>'],
    ['ja/', '<h2 id="aliases-heading">別名</h2>', '<h2 id="beginner-heading">初心者向け説明</h2>', '<h2 id="related-heading">関連用語</h2>', '<h2 id="sources-heading">確認済みソースID</h2>'],
  ]) {
    const html = fs.readFileSync(filePath(`dist/${prefix}glossary/${id}/index.html`), 'utf8');
    for (const marker of [aliasHeading, beginnerHeading, relatedHeading, sourceHeading]) {
      if (!html.includes(marker)) { fail(`${id}: rendered optional section missing ${marker}`); renderedErrors += 1; }
    }
    if (!html.includes(entry.reading_ja)) { fail(`${id}: Japanese reading is missing from rendered page`); renderedErrors += 1; }
  }
}
if (renderedErrors !== 0) fail(`rendered route errors: ${renderedErrors}`);

if (errors.length) {
  console.error(`GLOSSARY_HORSE_BREED_EXPANSION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('GLOSSARY_HORSE_BREED_EXPANSION: pass');
console.log('GLOSSARY_RECORDS: 31');
console.log('BREED_RECORDS: 4');
console.log('HORSE_TYPE_RECORDS: 1');
console.log('BILINGUAL_ROUTES: 62');
console.log('RECIPROCAL_RELATIONSHIPS: 7');
console.log('CLASSIFICATION_CONFLATION_ERRORS: 0');
console.log('REGISTRY_DATASET_REPUBLICATION: false');
console.log('NEXT_IMPLEMENTATION_UNIT: GLOSSARY-ROLE-EXPANSION-01');
