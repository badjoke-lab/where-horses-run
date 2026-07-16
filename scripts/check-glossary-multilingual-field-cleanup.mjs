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

const audit = parse('data/audits/glossary-multilingual-field-cleanup-v1.json');
const registry = parse('data/static/glossary-multilingual-field-registry-v1.json');
const patches = parse('data/static/glossary-fields-multilingual-v1.json');
const categoryLabelRegistry = parse('data/static/glossary-category-labels-v1.json');
const glossary = loadGlossary(root);
const workflowPath = '.github/workflows/glossary-multilingual-field-cleanup.yml';
const docPath = 'docs/glossary/multilingual-field-cleanup.md';
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
    'node scripts/check-glossary-multilingual-field-cleanup.mjs',
    'git status --porcelain',
  ]) if (!workflow.includes(marker)) fail(`multilingual workflow missing ${marker}`);
  for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare']) {
    if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`multilingual workflow contains forbidden marker ${forbidden}`);
  }
}

if (audit.schema_version !== 'glossary-multilingual-field-cleanup-v1') fail('audit schema differs');
if (audit.work_id !== 'WHR-GLOSSARY-DICTIONARY-V1') fail('audit Work ID differs');
if (audit.implementation_unit !== 'GLOSSARY-MULTILINGUAL-FIELD-CLEANUP-01') fail('audit implementation unit differs');
if (!['implemented_for_review', 'complete'].includes(audit.status)) fail('audit status differs');
if (audit.reviewed_at !== '2026-07-16') fail('audit review date differs');
if (
  audit.baseline?.glossary_records !== 48 ||
  audit.baseline?.bilingual_routes !== 96 ||
  audit.baseline?.records_with_reading_ja !== 29 ||
  audit.baseline?.records_missing_reading_ja !== 19 ||
  audit.baseline?.localized_category_labels !== 0 ||
  audit.baseline?.raw_category_labels_in_ui !== true
) fail('audit baseline differs');
if (
  audit.implemented?.glossary_records !== 48 ||
  audit.implemented?.bilingual_routes !== 96 ||
  audit.implemented?.records_with_reading_ja !== 48 ||
  audit.implemented?.records_missing_reading_ja !== 0 ||
  audit.implemented?.patched_reading_records !== 19 ||
  audit.implemented?.localized_category_labels !== 18 ||
  audit.implemented?.categories !== 9 ||
  audit.implemented?.duplicate_aliases !== 0 ||
  audit.implemented?.canonical_term_alias_collisions !== 0 ||
  audit.implemented?.unpaired_beginner_explanations !== 0 ||
  audit.implemented?.trim_errors !== 0 ||
  audit.implemented?.language_fallback_errors !== 0 ||
  audit.implemented?.new_concept_ids !== 0 ||
  audit.implemented?.removed_concept_ids !== 0
) fail('audit implemented counts differ');
if (audit.next_implementation_unit !== 'GLOSSARY-RELATED-TERMS-GRAPH-01') fail('next implementation unit differs');
if (Object.entries(audit.public_boundary ?? {}).some(([key, value]) => key === 'definition_and_navigation_allowed' ? value !== true : value !== false)) fail('audit public boundary differs');
if (Object.values(audit.automation_boundary ?? {}).some((value) => value !== false)) fail('audit automation boundary differs');

if (registry.schema_version !== 'glossary-multilingual-field-registry-v1') fail('registry schema differs');
if (registry.work_id !== audit.work_id || registry.implementation_unit !== audit.implementation_unit) fail('registry identity differs');
if (registry.reviewed_at !== audit.reviewed_at) fail('registry review date differs');
if (
  registry.scope?.glossary_records !== 48 ||
  registry.scope?.bilingual_routes !== 96 ||
  registry.scope?.records_with_reading_before !== 29 ||
  registry.scope?.records_with_reading_after !== 48 ||
  registry.scope?.patched_reading_records !== 19 ||
  registry.scope?.categories !== 9 ||
  registry.scope?.localized_category_labels !== 18 ||
  registry.scope?.new_concept_ids !== 0 ||
  registry.scope?.removed_concept_ids !== 0
) fail('registry scope differs');
if (Object.values(registry.field_policy ?? {}).some((value) => value !== true && value !== false)) fail('field policy contains non-boolean value');
if (registry.field_policy?.silent_cross_language_fallback !== false || Object.entries(registry.field_policy ?? {}).some(([key, value]) => key !== 'silent_cross_language_fallback' && key !== 'pronunciation_en_optional' && value !== true)) fail('field policy differs');
if (registry.field_policy?.pronunciation_en_optional !== true) fail('English pronunciation optionality differs');

const expectedPatchIds = [
  'thoroughbred-racing', 'flat-racing', 'jump-racing', 'steeplechase', 'harness-racing',
  'trotting', 'pacing', 'arabian-racing', 'quarter-horse-racing', 'banei-racing',
  'racecourse', 'turf', 'dirt', 'all-weather', 'jump-course',
  'left-handed-course', 'right-handed-course', 'both-directions-course', 'straight-course',
];
const expectedCategoryIds = [
  'race_type', 'breed', 'horse_type', 'role', 'data_term',
  'official_source', 'track_term', 'surface', 'governance_term',
];
if (!exact(registry.reading_patch_ids, expectedPatchIds) || !exact(audit.reading_patch_ids, expectedPatchIds)) fail('reading patch IDs differ');
if (!exact(registry.category_ids, expectedCategoryIds) || !exact(audit.category_ids, expectedCategoryIds)) fail('category IDs differ');
if (!exact(patches.map((patch) => patch.id), expectedPatchIds)) fail('field patch order/content differs');
if (new Set(patches.map((patch) => patch.id)).size !== patches.length) fail('field patch IDs are not unique');
for (const patch of patches) {
  if (!exact(Object.keys(patch).sort(), ['id', 'reading_ja'])) fail(`${patch.id}: field patch must contain only id and reading_ja`);
  if (typeof patch.reading_ja !== 'string' || !patch.reading_ja.trim()) fail(`${patch.id}: field patch reading is invalid`);
}

const completeOverlayFiles = [
  'glossary-entries-role-v1.json',
  'glossary-entries-timetable-v1.json',
  'glossary-entries-official-source-v1.json',
];
const baseline = parse('data/static/glossary.json');
const prePatchOrder = baseline.map((entry) => entry.id);
const prePatchById = new Map(baseline.map((entry) => [entry.id, entry]));
for (const filename of completeOverlayFiles) {
  const records = parse(`data/static/${filename}`);
  for (const record of records) {
    if (!prePatchById.has(record.id)) prePatchOrder.push(record.id);
    prePatchById.set(record.id, record);
  }
}
const prePatchGlossary = prePatchOrder.map((id) => prePatchById.get(id));
const prePatchMissingReadingIds = prePatchGlossary
  .filter((entry) => entry.reading_ja === null || entry.reading_ja === '')
  .map((entry) => entry.id);
if (prePatchGlossary.length !== 48) fail(`pre-patch glossary record count expected 48; found ${prePatchGlossary.length}`);
if (prePatchGlossary.filter((entry) => Boolean(entry.reading_ja)).length !== 29) fail('pre-patch reading count differs');
if (!exact(prePatchMissingReadingIds, expectedPatchIds)) fail('field patch does not exactly cover pre-patch missing readings');

const ids = glossary.map((entry) => entry.id);
const slugs = glossary.map((entry) => entry.slug);
const entryById = new Map(glossary.map((entry) => [entry.id, entry]));
if (glossary.length !== 48) fail(`glossary record count expected 48; found ${glossary.length}`);
if (!exact(ids, prePatchGlossary.map((entry) => entry.id))) fail('concept ID order changed during field cleanup');
if (new Set(ids).size !== glossary.length) fail('glossary IDs are not unique');
if (new Set(slugs).size !== glossary.length) fail('glossary slugs are not unique');

const readingPattern = /^[ぁ-ゖァ-ヿー・（）()\s]+$/u;
let duplicateAliases = 0;
let canonicalAliasCollisions = 0;
let unpairedBeginnerExplanations = 0;
let trimErrors = 0;
let languageFallbackErrors = 0;
for (const entry of glossary) {
  if (typeof entry.reading_ja !== 'string' || !entry.reading_ja.trim()) fail(`${entry.id}: Japanese reading is missing after cleanup`);
  else if (!readingPattern.test(entry.reading_ja)) fail(`${entry.id}: Japanese reading contains unsupported characters`);

  for (const field of ['term_en', 'term_ja', 'summary_en', 'summary_ja']) {
    if (entry[field] !== entry[field].trim()) { fail(`${entry.id}: ${field} is not trimmed`); trimErrors += 1; }
  }
  if (entry.term_en === entry.term_ja) { fail(`${entry.id}: English and Japanese canonical terms silently fall back to the same value`); languageFallbackErrors += 1; }

  for (const [aliasField, canonicalField] of [['aliases_en', 'term_en'], ['aliases_ja', 'term_ja']]) {
    const aliases = entry[aliasField];
    if (new Set(aliases).size !== aliases.length) { fail(`${entry.id}: duplicate ${aliasField}`); duplicateAliases += 1; }
    for (const alias of aliases) {
      if (alias !== alias.trim()) { fail(`${entry.id}: ${aliasField} contains untrimmed alias`); trimErrors += 1; }
      if (alias === entry[canonicalField]) { fail(`${entry.id}: canonical term repeated in ${aliasField}`); canonicalAliasCollisions += 1; }
    }
  }

  const hasBeginnerEn = Boolean(entry.beginner_explanation_en);
  const hasBeginnerJa = Boolean(entry.beginner_explanation_ja);
  if (hasBeginnerEn !== hasBeginnerJa) { fail(`${entry.id}: beginner explanation language pair differs`); unpairedBeginnerExplanations += 1; }
}
if (duplicateAliases !== 0 || canonicalAliasCollisions !== 0 || unpairedBeginnerExplanations !== 0 || trimErrors !== 0 || languageFallbackErrors !== 0) fail('multilingual field error counters are nonzero');

if (categoryLabelRegistry.schema_version !== 'glossary-category-labels-v1') fail('category-label schema differs');
if (categoryLabelRegistry.work_id !== audit.work_id || categoryLabelRegistry.implementation_unit !== audit.implementation_unit || categoryLabelRegistry.reviewed_at !== audit.reviewed_at) fail('category-label identity differs');
const labelIds = Object.keys(categoryLabelRegistry.labels ?? {});
if (!exact(labelIds, expectedCategoryIds)) fail('category-label IDs differ');
if (!exact(registry.category_labels, categoryLabelRegistry.labels)) fail('category-label registry content differs');
for (const categoryId of expectedCategoryIds) {
  const label = categoryLabelRegistry.labels[categoryId];
  if (!label || typeof label.en !== 'string' || !label.en.trim() || typeof label.ja !== 'string' || !label.ja.trim()) fail(`${categoryId}: localized category label is invalid`);
  if (label.en === categoryId || label.ja === categoryId || label.en === label.ja) fail(`${categoryId}: localized category label falls back to raw or same-language value`);
}
const categoriesInGlossary = [...new Set(glossary.map((entry) => entry.category))];
for (const categoryId of categoriesInGlossary) if (!expectedCategoryIds.includes(categoryId)) fail(`unregistered glossary category ${categoryId}`);
for (const categoryId of expectedCategoryIds) if (!categoriesInGlossary.includes(categoryId)) fail(`unused registered glossary category ${categoryId}`);

const loader = read(loaderPath);
for (const marker of ['glossary-fields-multilingual-v1.json', 'fieldPatchPriority', 'fieldPatchFiles', '{ ...current, ...patch }']) {
  if (!loader.includes(marker)) fail(`glossary loader missing ${marker}`);
}
const runtime = read(runtimePath);
for (const marker of ['glossary-fields-multilingual-v1.json', 'glossary-category-labels-v1.json', 'multilingualFieldPatches', 'getGlossaryCategoryLabel']) {
  if (!runtime.includes(marker)) fail(`runtime glossary cleanup missing ${marker}`);
}
for (const page of [
  'src/pages/glossary/index.astro',
  'src/pages/ja/glossary/index.astro',
  'src/pages/glossary/[slug].astro',
  'src/pages/ja/glossary/[slug].astro',
]) {
  const source = read(page);
  if (!source.includes('getGlossaryCategoryLabel')) fail(`${page}: localized category helper missing`);
  if (!source.includes('data-glossary-category')) fail(`${page}: machine-readable category marker missing`);
}

const doc = read(docPath);
for (const marker of [
  'GLOSSARY-MULTILINGUAL-FIELD-CLEANUP-01',
  'Japanese reading cleanup', 'Localized category labels', 'Field policy',
  'nineteen', '48 glossary records', '96 bilingual glossary routes',
  'data-glossary-category', 'automatic translation',
  'GLOSSARY-RELATED-TERMS-GRAPH-01',
]) if (!doc.includes(marker)) fail(`multilingual cleanup document missing ${marker}`);

if (!fs.existsSync(filePath('dist'))) fail('dist is missing; run npm run build first');
let renderedErrors = 0;
const enIndex = read('dist/glossary/index.html');
const jaIndex = read('dist/ja/glossary/index.html');
for (const categoryId of expectedCategoryIds) {
  const labels = categoryLabelRegistry.labels[categoryId];
  if (!enIndex.includes(labels.en)) { fail(`${categoryId}: English index category label missing`); renderedErrors += 1; }
  if (!jaIndex.includes(labels.ja)) { fail(`${categoryId}: Japanese index category label missing`); renderedErrors += 1; }
}
for (const entry of glossary) {
  const labels = categoryLabelRegistry.labels[entry.category];
  for (const [lang, prefix, term, summary, categoryLabel] of [
    ['en', '', entry.term_en, entry.summary_en, labels.en],
    ['ja', 'ja/', entry.term_ja, entry.summary_ja, labels.ja],
  ]) {
    const output = filePath(`dist/${prefix}glossary/${entry.slug}/index.html`);
    if (!fs.existsSync(output)) {
      fail(`${entry.id}: missing ${lang} route`);
      renderedErrors += 1;
      continue;
    }
    const html = fs.readFileSync(output, 'utf8');
    if (!html.includes(term) || !html.includes(summary)) { fail(`${entry.id}: ${lang} rendered content differs`); renderedErrors += 1; }
    if (!html.includes(entry.reading_ja)) { fail(`${entry.id}: ${lang} Japanese reading missing`); renderedErrors += 1; }
    if (!html.includes(categoryLabel)) { fail(`${entry.id}: ${lang} localized category label missing`); renderedErrors += 1; }
    if (!html.includes(`data-glossary-category="${entry.category}"`)) { fail(`${entry.id}: ${lang} machine-readable category missing`); renderedErrors += 1; }
    if (html.includes(`<p>${entry.category}</p>`)) { fail(`${entry.id}: ${lang} raw category ID is still displayed`); renderedErrors += 1; }
  }
}
if (renderedErrors !== 0) fail(`rendered route errors: ${renderedErrors}`);

if (errors.length) {
  console.error(`GLOSSARY_MULTILINGUAL_FIELD_CLEANUP: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('GLOSSARY_MULTILINGUAL_FIELD_CLEANUP: pass');
console.log('GLOSSARY_RECORDS: 48');
console.log('BILINGUAL_ROUTES: 96');
console.log('READINGS_BEFORE: 29');
console.log('READINGS_AFTER: 48');
console.log('PATCHED_READINGS: 19');
console.log('CATEGORIES: 9');
console.log('LOCALIZED_CATEGORY_LABELS: 18');
console.log('NEW_CONCEPT_IDS: 0');
console.log('REMOVED_CONCEPT_IDS: 0');
console.log('AUTOMATIC_TRANSLATION: false');
console.log('NEXT_IMPLEMENTATION_UNIT: GLOSSARY-RELATED-TERMS-GRAPH-01');
