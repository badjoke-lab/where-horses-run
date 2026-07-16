import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputArg = process.argv.find((arg) => arg.startsWith('--output='));
const outputPath = outputArg ? outputArg.slice('--output='.length) : null;
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const glossary = readJson('data/static/glossary.json');
const categories = Object.fromEntries([...new Set(glossary.map((entry) => entry.category))].sort().map((category) => [category, glossary.filter((entry) => entry.category === category).length]));
const ids = glossary.map((entry) => entry.id);
const slugs = glossary.map((entry) => entry.slug);
const requiredBasic = ['id', 'slug', 'term_en', 'term_ja', 'category', 'summary_en', 'summary_ja'];
const extensionFields = [
  'aliases_en',
  'aliases_ja',
  'reading_ja',
  'pronunciation_en',
  'beginner_explanation_en',
  'beginner_explanation_ja',
  'related_term_ids',
  'source_ids',
  'evidence_status',
  'public_boundary',
  'content_status',
  'last_reviewed',
];
const recordsMissingBasic = glossary.filter((entry) => requiredBasic.some((field) => !entry[field])).map((entry) => entry.id);
const recordsWithAnyExtension = glossary.filter((entry) => extensionFields.some((field) => Object.hasOwn(entry, field))).map((entry) => entry.id);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
const duplicateSlugs = [...new Set(slugs.filter((slug, index) => slugs.indexOf(slug) !== index))];
const routePairs = glossary.map((entry) => ({
  id: entry.id,
  english: `/glossary/${entry.slug}/`,
  japanese: `/ja/glossary/${entry.slug}/`,
}));
const audit = {
  schema_version: 'glossary-schema-extension-discovery-v1',
  work_id: 'WHR-GLOSSARY-DICTIONARY-V1',
  implementation_unit: 'GLOSSARY-SCHEMA-EXTENSION-01',
  counts: {
    records: glossary.length,
    categories: Object.keys(categories).length,
    bilingual_routes_expected: glossary.length * 2,
    records_missing_basic_fields: recordsMissingBasic.length,
    duplicate_ids: duplicateIds.length,
    duplicate_slugs: duplicateSlugs.length,
    records_with_any_extension_field: recordsWithAnyExtension.length,
    schema_files: ['data/static/glossary-entry-v2.schema.json', 'data/static/glossary-v2.schema.json'].filter((file) => fs.existsSync(path.join(root, file))).length,
  },
  category_counts: categories,
  required_basic_fields: requiredBasic,
  proposed_extension_fields: extensionFields,
  records_missing_basic_fields: recordsMissingBasic,
  duplicate_ids: duplicateIds,
  duplicate_slugs: duplicateSlugs,
  records_with_any_extension_field: recordsWithAnyExtension,
  route_pairs: routePairs,
  public_boundary: {
    definition_and_navigation_only: true,
    entries_dataset: false,
    odds_dataset: false,
    results_dataset: false,
    payouts_dataset: false,
    predictions_dataset: false,
    raw_source_body: false,
  },
  boundaries: {
    repository_write: false,
    network_fetch: false,
    automatic_source_acceptance: false,
    publication: false,
    deployment: false,
  },
};
if (outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(audit, null, 2)}\n`);
}
console.log(JSON.stringify(audit, null, 2));
