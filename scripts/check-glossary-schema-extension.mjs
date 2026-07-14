import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const parse = (file) => JSON.parse(read(file));

const audit = parse('data/audits/glossary-schema-extension-v1.json');
const entrySchema = parse('data/static/glossary-entry-v2.schema.json');
const collectionSchema = parse('data/static/glossary-v2.schema.json');
const glossary = parse('data/static/glossary.json');
const sources = new Set([
  ...parse('data/static/sources.json').map((source) => source.id),
  ...parse('data/static/country-page-sources-01-04.json').map((source) => source.id),
  ...parse('data/static/country-page-sources-05-08.json').map((source) => source.id),
  ...parse('data/static/country-page-sources-09-bahrain.json').map((source) => source.id),
  ...parse('data/static/country-page-sources-10-qatar.json').map((source) => source.id),
  ...parse('data/static/country-page-sources-11-oman.json').map((source) => source.id),
  ...parse('data/static/country-page-sources-12-zimbabwe.json').map((source) => source.id),
  ...parse('data/static/country-page-sources-14-hong-kong.json').map((source) => source.id),
  ...parse('data/static/country-page-sources-15-new-zealand-harness.json').map((source) => source.id),
  ...parse('data/static/country-page-sources-15-new-zealand-thoroughbred.json').map((source) => source.id),
  ...parse('data/static/country-page-sources-16-south-africa.json').map((source) => source.id),
  ...parse('data/static/country-page-sources-17-uruguay.json').map((source) => source.id),
  ...parse('data/static/country-page-sources-18-sweden.json').map((source) => source.id),
  ...parse('data/static/country-page-sources-19-denmark.json').map((source) => source.id),
  ...parse('data/static/country-page-sources-20-czech-republic.json').map((source) => source.id),
  ...parse('data/static/country-page-sources-21-28.json').map((source) => source.id),
  ...parse('data/static/country-page-sources-29-36.json').map((source) => source.id),
  ...parse('data/static/country-page-sources-37-44.json').map((source) => source.id),
  ...parse('data/static/country-page-sources-45-52.json').map((source) => source.id),
  ...parse('data/static/country-page-sources-53-60.json').map((source) => source.id),
  ...parse('data/static/country-page-sources-61-68.json').map((source) => source.id),
  ...parse('data/static/country-page-sources-69-76.json').map((source) => source.id),
  ...parse('data/static/country-page-sources-77-84.json').map((source) => source.id),
  ...parse('data/static/country-page-sources-85-92.json').map((source) => source.id),
  ...parse('data/static/country-page-sources-93-98.json').map((source) => source.id),
  ...parse('data/static/racecourse-link-amendments-v1.json').source_records.map((source) => source.id),
]);

if (audit.schema_version !== 'glossary-schema-extension-v1') fail('audit schema differs');
if (audit.work_id !== 'WHR-GLOSSARY-DICTIONARY-V1') fail('audit Work ID differs');
if (audit.implementation_unit !== 'GLOSSARY-SCHEMA-EXTENSION-01') fail('audit implementation unit differs');
if (!['implemented_for_review', 'complete'].includes(audit.status)) fail('audit status differs');
if (audit.discovery?.artifact_digest !== 'sha256:c6d024f9e3b6164d68b091dc690842cc2333cccc115ce7761971a9940bbdfb9a') fail('discovery artifact digest differs');
if (audit.baseline?.records !== 23 || audit.baseline?.categories !== 5 || audit.baseline?.records_with_any_extension_field !== 0 || audit.baseline?.schema_files !== 0) fail('baseline counts differ');
if (audit.implemented?.records !== 23 || audit.implemented?.categories !== 5 || audit.implemented?.bilingual_routes !== 46 || audit.implemented?.records_with_all_extension_fields !== 23 || audit.implemented?.entry_schema_files !== 2 || audit.implemented?.broken_related_term_ids !== 0 || audit.implemented?.broken_source_ids !== 0 || audit.implemented?.rendered_route_errors !== 0) fail('implemented counts differ');
if (audit.next_implementation_unit !== 'GLOSSARY-RACING-TYPE-EXPANSION-01') fail('next implementation unit differs');
if (Object.entries(audit.public_boundary ?? {}).some(([key, value]) => key === 'definition_and_navigation_allowed' ? value !== true : value !== false)) fail('audit public boundary differs');
if (Object.values(audit.automation_boundary ?? {}).some((value) => value !== false)) fail('audit automation boundary differs');

if (entrySchema.$schema !== 'https://json-schema.org/draft/2020-12/schema' || entrySchema.$id !== 'https://whr.badjoke-lab.com/schemas/glossary-entry-v2.schema.json') fail('entry schema identity differs');
if (entrySchema.type !== 'object' || entrySchema.additionalProperties !== false) fail('entry schema object boundary differs');
if (collectionSchema.$schema !== 'https://json-schema.org/draft/2020-12/schema' || collectionSchema.type !== 'array' || collectionSchema.items?.$ref !== './glossary-entry-v2.schema.json') fail('collection schema differs');
const required = new Set(entrySchema.required ?? []);
for (const field of ['schema_version', 'id', 'slug', 'term_en', 'term_ja', 'category', 'summary_en', 'summary_ja', ...audit.required_extension_fields]) if (!required.has(field)) fail(`entry schema missing required field ${field}`);
const allowedCategories = entrySchema.properties?.category?.enum ?? [];
if (JSON.stringify(allowedCategories) !== JSON.stringify(audit.allowed_categories)) fail('allowed category order/content differs');
if (entrySchema.properties?.public_boundary?.properties?.republish_dataset?.const !== false) fail('schema must prohibit dataset republication');

const ids = glossary.map((entry) => entry.id);
const slugs = glossary.map((entry) => entry.slug);
const idSet = new Set(ids);
if (glossary.length !== 23) fail(`glossary record count expected 23; found ${glossary.length}`);
if (idSet.size !== glossary.length) fail('glossary IDs are not unique');
if (new Set(slugs).size !== glossary.length) fail('glossary slugs are not unique');
const categoryCounts = Object.fromEntries([...new Set(glossary.map((entry) => entry.category))].sort().map((category) => [category, glossary.filter((entry) => entry.category === category).length]));
if (JSON.stringify(categoryCounts) !== JSON.stringify(audit.baseline.category_counts)) fail('category counts changed during schema migration');

const requiredKeys = entrySchema.required;
const allowedKeys = new Set(Object.keys(entrySchema.properties));
const restrictedRules = audit.restricted_concept_rules;
for (const entry of glossary) {
  for (const field of requiredKeys) if (!Object.hasOwn(entry, field)) fail(`${entry.id}: missing ${field}`);
  for (const field of Object.keys(entry)) if (!allowedKeys.has(field)) fail(`${entry.id}: unsupported field ${field}`);
  if (entry.schema_version !== 'glossary-entry-v2') fail(`${entry.id}: schema version differs`);
  if (entry.slug !== entry.id) fail(`${entry.id}: slug must remain equal to ID in the current baseline`);
  if (!allowedCategories.includes(entry.category)) fail(`${entry.id}: unsupported category ${entry.category}`);
  for (const field of ['term_en', 'term_ja', 'summary_en', 'summary_ja']) if (typeof entry[field] !== 'string' || !entry[field].trim()) fail(`${entry.id}: invalid ${field}`);
  for (const field of ['aliases_en', 'aliases_ja', 'related_term_ids', 'source_ids']) {
    if (!Array.isArray(entry[field]) || new Set(entry[field]).size !== entry[field].length || entry[field].some((value) => typeof value !== 'string' || !value)) fail(`${entry.id}: invalid ${field}`);
  }
  for (const field of ['reading_ja', 'pronunciation_en', 'beginner_explanation_en', 'beginner_explanation_ja']) if (entry[field] !== null && (typeof entry[field] !== 'string' || !entry[field].trim())) fail(`${entry.id}: invalid ${field}`);
  for (const relatedId of entry.related_term_ids) if (!idSet.has(relatedId) || relatedId === entry.id) fail(`${entry.id}: broken related term ${relatedId}`);
  for (const sourceId of entry.source_ids) if (!sources.has(sourceId)) fail(`${entry.id}: broken source ID ${sourceId}`);
  if (!['baseline_definition', 'reviewed_secondary', 'reviewed_official', 'mixed_reviewed'].includes(entry.evidence_status)) fail(`${entry.id}: invalid evidence status`);
  if (!['draft_review_only', 'baseline_reviewed', 'enriched_reviewed'].includes(entry.content_status)) fail(`${entry.id}: invalid content status`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.last_reviewed)) fail(`${entry.id}: invalid review date`);
  if (!entry.public_boundary || entry.public_boundary.republish_dataset !== false || !['definition_only', 'definition_and_navigation'].includes(entry.public_boundary.mode)) fail(`${entry.id}: invalid public boundary`);
  const restricted = entry.public_boundary.prohibited_dataset_keys;
  if (!Array.isArray(restricted) || new Set(restricted).size !== restricted.length) fail(`${entry.id}: invalid prohibited dataset keys`);
  const expectedRestricted = restrictedRules[entry.id] ?? [];
  if (JSON.stringify(restricted) !== JSON.stringify(expectedRestricted)) fail(`${entry.id}: restricted concept keys differ`);
}

const indexSource = read('src/pages/glossary/index.astro');
const jaIndexSource = read('src/pages/ja/glossary/index.astro');
const detailSource = read('src/pages/glossary/[slug].astro');
const jaDetailSource = read('src/pages/ja/glossary/[slug].astro');
for (const marker of ['data-glossary-schema-version', 'data-glossary-content-status', 'data-glossary-public-boundary']) {
  if (!detailSource.includes(marker) || !jaDetailSource.includes(marker)) fail(`detail pages missing ${marker}`);
}
for (const marker of ['entry.aliases_en.length', 'entry.reading_ja', 'entry.beginner_explanation_en', 'entry.related_term_ids']) if (!detailSource.includes(marker)) fail(`English detail page missing optional field contract ${marker}`);
for (const marker of ['entry.aliases_ja.length', 'entry.reading_ja', 'entry.beginner_explanation_ja', 'entry.related_term_ids']) if (!jaDetailSource.includes(marker)) fail(`Japanese detail page missing optional field contract ${marker}`);
if (!indexSource.includes('getGlossaryEntries') || !jaIndexSource.includes('getGlossaryEntries')) fail('glossary index data source changed');

if (!fs.existsSync(path.join(root, 'dist'))) fail('dist is missing; run npm run build first');
let renderedErrors = 0;
for (const entry of glossary) {
  for (const [lang, prefix, term, summary] of [['en', '', entry.term_en, entry.summary_en], ['ja', 'ja/', entry.term_ja, entry.summary_ja]]) {
    const file = path.join(root, `dist/${prefix}glossary/${entry.slug}/index.html`);
    if (!fs.existsSync(file)) {
      fail(`${entry.id}: missing ${lang} route`);
      renderedErrors += 1;
      continue;
    }
    const html = fs.readFileSync(file, 'utf8');
    if (!html.includes(term) || !html.includes(summary)) { fail(`${entry.id}: ${lang} baseline content changed`); renderedErrors += 1; }
    if (!html.includes('data-glossary-schema-version="glossary-entry-v2"') || !html.includes('data-glossary-content-status="baseline_reviewed"') || !html.includes('data-glossary-public-boundary="definition_and_navigation"')) { fail(`${entry.id}: ${lang} schema markers missing`); renderedErrors += 1; }
    if (html.includes('<h2>Aliases</h2>') || html.includes('<h2>別名</h2>') || html.includes('<h2>Beginner explanation</h2>') || html.includes('<h2>初心者向け説明</h2>') || html.includes('<h2>Related terms</h2>') || html.includes('<h2>関連用語</h2>')) { fail(`${entry.id}: ${lang} empty optional section rendered`); renderedErrors += 1; }
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
console.log('DATASET_REPUBLICATION: false');
console.log('NEXT_IMPLEMENTATION_UNIT: GLOSSARY-RACING-TYPE-EXPANSION-01');
