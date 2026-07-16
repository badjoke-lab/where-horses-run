import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const filePath = (file) => path.join(root, file);
const read = (file) => fs.readFileSync(filePath(file), 'utf8');
const parse = (file) => JSON.parse(read(file));

const workflowPath = '.github/workflows/glossary-schema-extension.yml';
const temporaryWorkflowPath = '.github/workflows/temporary-glossary-schema-extension-discovery.yml';
if (!fs.existsSync(filePath(workflowPath))) fail('permanent glossary schema workflow is missing');
if (fs.existsSync(filePath(temporaryWorkflowPath))) fail('temporary glossary discovery workflow must be removed');
if (fs.existsSync(filePath(workflowPath))) {
  const workflow = read(workflowPath);
  for (const marker of ['npm ci', 'npm run build', 'node scripts/check-glossary-schema-extension.mjs', 'git status --porcelain']) {
    if (!workflow.includes(marker)) fail(`permanent workflow missing ${marker}`);
  }
}

const audit = parse('data/audits/glossary-schema-extension-v1.json');
const entrySchema = parse('data/static/glossary-entry-v2.schema.json');
const collectionSchema = parse('data/static/glossary-v2.schema.json');
const glossary = parse('data/static/glossary.json');

const sourceIds = new Set();
for (const filename of fs.readdirSync(filePath('data/static'))) {
  if (!/sources.*\.json$/.test(filename) && filename !== 'sources.json') continue;
  const value = parse(`data/static/${filename}`);
  const records = Array.isArray(value) ? value : (value.source_records ?? []);
  for (const record of records) if (record?.id) sourceIds.add(record.id);
}
const racecourseAmendments = parse('data/static/racecourse-link-amendments-v1.json');
for (const record of racecourseAmendments.source_records ?? []) if (record?.id) sourceIds.add(record.id);

if (audit.schema_version !== 'glossary-schema-extension-v1') fail('audit schema differs');
if (audit.work_id !== 'WHR-GLOSSARY-DICTIONARY-V1') fail('audit Work ID differs');
if (audit.implementation_unit !== 'GLOSSARY-SCHEMA-EXTENSION-01') fail('audit implementation unit differs');
if (!['implemented_for_review', 'complete'].includes(audit.status)) fail('audit status differs');
if (audit.reviewed_at !== '2026-07-16') fail('audit review date differs');
if (audit.discovery?.artifact_digest !== 'sha256:c6d024f9e3b6164d68b091dc690842cc2333cccc115ce7761971a9940bbdfb9a') fail('discovery artifact digest differs');
if (audit.baseline?.records !== 23 || audit.baseline?.categories !== 5 || audit.baseline?.records_with_any_extension_field !== 0 || audit.baseline?.schema_files !== 0) fail('baseline counts differ');
if (audit.implemented?.records !== 23 || audit.implemented?.categories !== 5 || audit.implemented?.bilingual_routes !== 46 || audit.implemented?.records_with_all_extension_fields !== 23 || audit.implemented?.entry_schema_files !== 2 || audit.implemented?.broken_related_term_ids !== 0 || audit.implemented?.broken_source_ids !== 0 || audit.implemented?.rendered_route_errors !== 0) fail('implemented counts differ');
if (audit.next_implementation_unit !== 'GLOSSARY-RACING-TYPE-EXPANSION-01') fail('next implementation unit differs');
if (Object.entries(audit.public_boundary ?? {}).some(([key, value]) => key === 'definition_and_navigation_allowed' ? value !== true : value !== false)) fail('audit public boundary differs');
if (Object.values(audit.automation_boundary ?? {}).some((value) => value !== false)) fail('audit automation boundary differs');

if (entrySchema.$schema !== 'https://json-schema.org/draft/2020-12/schema' || entrySchema.$id !== 'https://whr.badjoke-lab.com/schemas/glossary-entry-v2.schema.json') fail('entry schema identity differs');
if (entrySchema.type !== 'object' || entrySchema.additionalProperties !== false) fail('entry schema object boundary differs');
if (collectionSchema.$schema !== 'https://json-schema.org/draft/2020-12/schema' || collectionSchema.type !== 'array' || collectionSchema.items?.$ref !== './glossary-entry-v2.schema.json') fail('collection schema differs');

const requiredKeys = entrySchema.required ?? [];
const required = new Set(requiredKeys);
for (const field of ['schema_version', 'id', 'slug', 'term_en', 'term_ja', 'category', 'summary_en', 'summary_ja', ...audit.required_extension_fields]) {
  if (!required.has(field)) fail(`entry schema missing required field ${field}`);
}
const allowedKeys = new Set(Object.keys(entrySchema.properties ?? {}));
const allowedCategories = entrySchema.properties?.category?.enum ?? [];
if (JSON.stringify(allowedCategories) !== JSON.stringify(audit.allowed_categories)) fail('allowed category order/content differs');
if (entrySchema.properties?.public_boundary?.properties?.republish_dataset?.const !== false) fail('schema must prohibit dataset republication');

const ids = glossary.map((entry) => entry.id);
const slugs = glossary.map((entry) => entry.slug);
const idSet = new Set(ids);
if (glossary.length !== 23) fail(`glossary record count expected 23; found ${glossary.length}`);
if (idSet.size !== glossary.length) fail('glossary IDs are not unique');
if (new Set(slugs).size !== glossary.length) fail('glossary slugs are not unique');
const categoryCounts = Object.fromEntries([...new Set(glossary.map((entry) => entry.category))]
  .sort()
  .map((category) => [category, glossary.filter((entry) => entry.category === category).length]));
if (JSON.stringify(categoryCounts) !== JSON.stringify(audit.baseline.category_counts)) fail('category counts changed during schema migration');

const restrictedRules = audit.restricted_concept_rules ?? {};
for (const entry of glossary) {
  for (const field of requiredKeys) if (!Object.hasOwn(entry, field)) fail(`${entry.id}: missing ${field}`);
  for (const field of Object.keys(entry)) if (!allowedKeys.has(field)) fail(`${entry.id}: unsupported field ${field}`);
  if (entry.schema_version !== 'glossary-entry-v2') fail(`${entry.id}: schema version differs`);
  if (entry.slug !== entry.id) fail(`${entry.id}: slug must remain equal to ID in the current baseline`);
  if (!allowedCategories.includes(entry.category)) fail(`${entry.id}: unsupported category ${entry.category}`);
  for (const field of ['term_en', 'term_ja', 'summary_en', 'summary_ja']) {
    if (typeof entry[field] !== 'string' || !entry[field].trim()) fail(`${entry.id}: invalid ${field}`);
  }
  for (const field of ['aliases_en', 'aliases_ja', 'related_term_ids', 'source_ids']) {
    if (!Array.isArray(entry[field]) || new Set(entry[field]).size !== entry[field].length || entry[field].some((value) => typeof value !== 'string' || !value)) fail(`${entry.id}: invalid ${field}`);
  }
  for (const field of ['reading_ja', 'pronunciation_en', 'beginner_explanation_en', 'beginner_explanation_ja']) {
    if (entry[field] !== null && (typeof entry[field] !== 'string' || !entry[field].trim())) fail(`${entry.id}: invalid ${field}`);
  }
  for (const relatedId of entry.related_term_ids) if (!idSet.has(relatedId) || relatedId === entry.id) fail(`${entry.id}: broken related term ${relatedId}`);
  for (const sourceId of entry.source_ids) if (!sourceIds.has(sourceId)) fail(`${entry.id}: broken source ID ${sourceId}`);
  if (!['baseline_definition', 'reviewed_secondary', 'reviewed_official', 'mixed_reviewed'].includes(entry.evidence_status)) fail(`${entry.id}: invalid evidence status`);
  if (!['draft_review_only', 'baseline_reviewed', 'enriched_reviewed'].includes(entry.content_status)) fail(`${entry.id}: invalid content status`);
  if (entry.last_reviewed !== audit.migration_defaults.last_reviewed) fail(`${entry.id}: review date differs`);
  if (!entry.public_boundary || entry.public_boundary.republish_dataset !== false || !['definition_only', 'definition_and_navigation'].includes(entry.public_boundary.mode)) fail(`${entry.id}: invalid public boundary`);
  const restricted = entry.public_boundary.prohibited_dataset_keys;
  if (!Array.isArray(restricted) || new Set(restricted).size !== restricted.length) fail(`${entry.id}: invalid prohibited dataset keys`);
  if (JSON.stringify(restricted) !== JSON.stringify(restrictedRules[entry.id] ?? [])) fail(`${entry.id}: restricted concept keys differ`);
}

const indexSource = read('src/pages/glossary/index.astro');
const jaIndexSource = read('src/pages/ja/glossary/index.astro');
const detailSource = read('src/pages/glossary/[slug].astro');
const jaDetailSource = read('src/pages/ja/glossary/[slug].astro');
for (const marker of ['data-glossary-schema-version', 'data-glossary-content-status', 'data-glossary-public-boundary']) {
  if (!detailSource.includes(marker) || !jaDetailSource.includes(marker)) fail(`detail pages missing ${marker}`);
}
for (const marker of ['entry.aliases_en.length', 'entry.reading_ja', 'entry.beginner_explanation_en', 'entry.related_term_ids']) {
  if (!detailSource.includes(marker)) fail(`English detail page missing optional field contract ${marker}`);
}
for (const marker of ['entry.aliases_ja.length', 'entry.reading_ja', 'entry.beginner_explanation_ja', 'entry.related_term_ids']) {
  if (!jaDetailSource.includes(marker)) fail(`Japanese detail page missing optional field contract ${marker}`);
}
if (!indexSource.includes('getGlossaryEntries') || !jaIndexSource.includes('getGlossaryEntries')) fail('glossary index data source changed');

if (!fs.existsSync(filePath('dist'))) fail('dist is missing; run npm run build first');
let renderedErrors = 0;
for (const entry of glossary) {
  for (const [lang, prefix, term, summary] of [['en', '', entry.term_en, entry.summary_en], ['ja', 'ja/', entry.term_ja, entry.summary_ja]]) {
    const output = filePath(`dist/${prefix}glossary/${entry.slug}/index.html`);
    if (!fs.existsSync(output)) {
      fail(`${entry.id}: missing ${lang} route`);
      renderedErrors += 1;
      continue;
    }
    const html = fs.readFileSync(output, 'utf8');
    if (!html.includes(term) || !html.includes(summary)) { fail(`${entry.id}: ${lang} baseline content changed`); renderedErrors += 1; }
    if (!html.includes('data-glossary-schema-version="glossary-entry-v2"') || !html.includes('data-glossary-content-status="baseline_reviewed"') || !html.includes('data-glossary-public-boundary="definition_and_navigation"')) {
      fail(`${entry.id}: ${lang} schema markers missing`);
      renderedErrors += 1;
    }
    if (html.includes('<h2 id="aliases-heading">Aliases</h2>') || html.includes('<h2 id="aliases-heading">別名</h2>') || html.includes('<h2 id="beginner-heading">Beginner explanation</h2>') || html.includes('<h2 id="beginner-heading">初心者向け説明</h2>') || html.includes('<h2 id="related-heading">Related terms</h2>') || html.includes('<h2 id="related-heading">関連用語</h2>')) {
      fail(`${entry.id}: ${lang} empty optional section rendered`);
      renderedErrors += 1;
    }
  }
}
if (renderedErrors !== 0) fail(`rendered route errors: ${renderedErrors}`);

if (errors.length) {
  console.error(`GLOSSARY_SCHEMA_EXTENSION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('GLOSSARY_SCHEMA_EXTENSION: pass');
console.log('GLOSSARY_RECORDS: 23');
console.log('BILINGUAL_ROUTES: 46');
console.log('SCHEMA_FILES: 2');
console.log('MIGRATED_V2_RECORDS: 23');
console.log('PERMANENT_WORKFLOW: enabled');
console.log('DATASET_REPUBLICATION: false');
console.log('NEXT_IMPLEMENTATION_UNIT: GLOSSARY-RACING-TYPE-EXPANSION-01');
