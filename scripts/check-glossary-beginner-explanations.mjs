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
const escapeHtml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');
const renderedTextMatches = (html, text) => {
  const escaped = escapeHtml(text);
  return [
    text,
    escaped,
    escaped.replaceAll('&#39;', '&#x27;'),
    escaped.replaceAll('&#39;', '&apos;'),
  ].some((candidate) => html.includes(candidate));
};

const audit = parse('data/audits/glossary-beginner-explanations-v1.json');
const registry = parse('data/static/glossary-beginner-explanation-registry-v1.json');
const patches = parse('data/static/glossary-fields-beginner-v1.json');
const glossary = loadGlossary(root);
const workflowPath = '.github/workflows/glossary-beginner-explanations.yml';
const docPath = 'docs/glossary/beginner-explanations.md';
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
    'node scripts/check-glossary-related-terms-graph.mjs',
    'node scripts/check-glossary-beginner-explanations.mjs',
    'git status --porcelain',
  ]) if (!workflow.includes(marker)) fail(`beginner workflow missing ${marker}`);
  for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare']) {
    if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`beginner workflow contains forbidden marker ${forbidden}`);
  }
}

if (audit.schema_version !== 'glossary-beginner-explanations-v1') fail('audit schema differs');
if (audit.work_id !== 'WHR-GLOSSARY-DICTIONARY-V1') fail('audit Work ID differs');
if (audit.implementation_unit !== 'GLOSSARY-BEGINNER-EXPLANATIONS-01') fail('audit implementation unit differs');
if (!['implemented_for_review', 'complete'].includes(audit.status)) fail('audit status differs');
if (audit.reviewed_at !== '2026-07-16') fail('audit review date differs');
if (
  audit.baseline?.glossary_records !== 48 ||
  audit.baseline?.bilingual_term_routes !== 96 ||
  audit.baseline?.graph_page_routes !== 2 ||
  audit.baseline?.records_with_paired_beginner_explanations !== 29 ||
  audit.baseline?.records_missing_paired_beginner_explanations !== 19
) fail('audit baseline differs');
if (
  audit.implemented?.glossary_records !== 48 ||
  audit.implemented?.bilingual_term_routes !== 96 ||
  audit.implemented?.graph_page_routes !== 2 ||
  audit.implemented?.records_with_paired_beginner_explanations !== 48 ||
  audit.implemented?.records_missing_paired_beginner_explanations !== 0 ||
  audit.implemented?.patched_records !== 19 ||
  audit.implemented?.unpaired_explanations !== 0 ||
  audit.implemented?.empty_explanations !== 0 ||
  audit.implemented?.summary_copy_errors !== 0 ||
  audit.implemented?.rendered_explanation_errors !== 0 ||
  audit.implemented?.new_concept_ids !== 0 ||
  audit.implemented?.removed_concept_ids !== 0 ||
  audit.implemented?.changed_routes !== 0
) fail('audit implemented counts differ');
if (audit.next_implementation_unit !== 'GLOSSARY-QA-RELEASE-01') fail('next implementation unit differs');
if (Object.entries(audit.public_boundary ?? {}).some(([key, value]) => key === 'definition_and_navigation_allowed' ? value !== true : value !== false)) fail('audit public boundary differs');
if (Object.values(audit.automation_boundary ?? {}).some((value) => value !== false)) fail('audit automation boundary differs');

if (registry.schema_version !== 'glossary-beginner-explanation-registry-v1') fail('registry schema differs');
if (registry.work_id !== audit.work_id || registry.implementation_unit !== audit.implementation_unit) fail('registry identity differs');
if (registry.reviewed_at !== audit.reviewed_at) fail('registry review date differs');
if (
  registry.scope?.glossary_records !== 48 ||
  registry.scope?.bilingual_term_routes !== 96 ||
  registry.scope?.graph_page_routes !== 2 ||
  registry.scope?.records_with_explanations_before !== 29 ||
  registry.scope?.records_missing_explanations_before !== 19 ||
  registry.scope?.records_with_explanations_after !== 48 ||
  registry.scope?.records_missing_explanations_after !== 0 ||
  registry.scope?.patched_records !== 19 ||
  registry.scope?.new_concept_ids !== 0 ||
  registry.scope?.removed_concept_ids !== 0 ||
  registry.scope?.changed_routes !== 0
) fail('registry scope differs');
if (Object.values(registry.content_policy ?? {}).some((value) => value !== true && value !== false)) fail('content policy contains non-boolean value');
if (Object.values(registry.content_policy ?? {}).some((value) => value !== true)) fail('content policy differs');

const expectedPatchIds = [
  'thoroughbred-racing', 'flat-racing', 'jump-racing', 'steeplechase', 'harness-racing',
  'trotting', 'pacing', 'arabian-racing', 'quarter-horse-racing', 'banei-racing',
  'racecourse', 'turf', 'dirt', 'all-weather', 'jump-course',
  'left-handed-course', 'right-handed-course', 'both-directions-course', 'straight-course',
];
if (!exact(registry.patch_ids, expectedPatchIds) || !exact(audit.patch_ids, expectedPatchIds)) fail('beginner patch IDs differ');
if (!exact(patches.map((patch) => patch.id), expectedPatchIds)) fail('beginner patch order/content differs');
if (new Set(patches.map((patch) => patch.id)).size !== patches.length) fail('beginner patch IDs are not unique');

for (const patch of patches) {
  if (!exact(Object.keys(patch).sort(), ['beginner_explanation_en', 'beginner_explanation_ja', 'id'])) fail(`${patch.id}: patch fields differ`);
  for (const [field, minimum] of [['beginner_explanation_en', 50], ['beginner_explanation_ja', 25]]) {
    const value = patch[field];
    if (typeof value !== 'string' || value !== value.trim() || value.length < minimum) fail(`${patch.id}: ${field} is invalid`);
    if (/[<>]/.test(value)) fail(`${patch.id}: ${field} contains HTML-like markup`);
  }
}

const baseline = parse('data/static/glossary.json');
const completeOverlayFiles = [
  'glossary-entries-role-v1.json',
  'glossary-entries-timetable-v1.json',
  'glossary-entries-official-source-v1.json',
];
const order = baseline.map((entry) => entry.id);
const preBeginnerById = new Map(baseline.map((entry) => [entry.id, entry]));
for (const filename of completeOverlayFiles) {
  for (const record of parse(`data/static/${filename}`)) {
    if (!preBeginnerById.has(record.id)) order.push(record.id);
    preBeginnerById.set(record.id, record);
  }
}
for (const patch of parse('data/static/glossary-fields-multilingual-v1.json')) {
  const current = preBeginnerById.get(patch.id);
  if (!current) fail(`multilingual patch references unknown ID ${patch.id}`);
  else preBeginnerById.set(patch.id, { ...current, ...patch });
}
for (const patch of parse('data/static/glossary-relationships-graph-v1.json')) {
  const current = preBeginnerById.get(patch.id);
  if (!current) {
    fail(`relationship patch references unknown ID ${patch.id}`);
    continue;
  }
  const related = [...current.related_term_ids];
  for (const relatedId of patch.add_related_term_ids ?? []) if (!related.includes(relatedId)) related.push(relatedId);
  preBeginnerById.set(patch.id, { ...current, related_term_ids: related });
}
const preBeginnerGlossary = order.map((id) => preBeginnerById.get(id));
const preMissingIds = preBeginnerGlossary
  .filter((entry) => !entry.beginner_explanation_en && !entry.beginner_explanation_ja)
  .map((entry) => entry.id);
const preUnpairedIds = preBeginnerGlossary
  .filter((entry) => Boolean(entry.beginner_explanation_en) !== Boolean(entry.beginner_explanation_ja))
  .map((entry) => entry.id);
if (preBeginnerGlossary.length !== 48) fail(`pre-patch glossary count expected 48; found ${preBeginnerGlossary.length}`);
if (preBeginnerGlossary.filter((entry) => entry.beginner_explanation_en && entry.beginner_explanation_ja).length !== 29) fail('pre-patch explanation count differs');
if (!exact(preMissingIds, expectedPatchIds)) fail(`pre-patch missing IDs differ: ${preMissingIds.join(', ')}`);
if (preUnpairedIds.length !== 0) fail(`pre-patch unpaired explanation IDs: ${preUnpairedIds.join(', ')}`);

const ids = glossary.map((entry) => entry.id);
const slugs = glossary.map((entry) => entry.slug);
const entryById = new Map(glossary.map((entry) => [entry.id, entry]));
if (glossary.length !== 48) fail(`final glossary count expected 48; found ${glossary.length}`);
if (!exact(ids, order)) fail('concept ID order changed');
if (new Set(ids).size !== 48 || new Set(slugs).size !== 48) fail('concept IDs or slugs are not unique');

let unpairedExplanations = 0;
let emptyExplanations = 0;
let summaryCopyErrors = 0;
for (const entry of glossary) {
  const en = entry.beginner_explanation_en;
  const ja = entry.beginner_explanation_ja;
  if (Boolean(en) !== Boolean(ja)) { fail(`${entry.id}: explanation language pair differs`); unpairedExplanations += 1; }
  if (typeof en !== 'string' || !en.trim() || typeof ja !== 'string' || !ja.trim()) { fail(`${entry.id}: explanation is empty`); emptyExplanations += 1; }
  if (en === entry.summary_en || ja === entry.summary_ja) { fail(`${entry.id}: explanation copies summary`); summaryCopyErrors += 1; }
}
if (unpairedExplanations !== 0 || emptyExplanations !== 0 || summaryCopyErrors !== 0) fail('beginner explanation error counters are nonzero');

const stripBeginner = (entry) => {
  const { beginner_explanation_en, beginner_explanation_ja, ...rest } = entry;
  return rest;
};
for (const id of ids) {
  const before = preBeginnerById.get(id);
  const after = entryById.get(id);
  if (!exact(stripBeginner(before), stripBeginner(after))) fail(`${id}: non-beginner field changed`);
}
for (const patch of patches) {
  const entry = entryById.get(patch.id);
  if (!entry || entry.beginner_explanation_en !== patch.beginner_explanation_en || entry.beginner_explanation_ja !== patch.beginner_explanation_ja) fail(`${patch.id}: final explanation differs from patch`);
}

const loader = read(loaderPath);
for (const marker of ['glossary-fields-beginner-v1.json', 'fieldPatchPriority', 'fieldPatchFiles', '{ ...current, ...patch }']) {
  if (!loader.includes(marker)) fail(`loader missing ${marker}`);
}
const runtime = read(runtimePath);
for (const marker of ['glossary-fields-beginner-v1.json', 'beginnerExplanationPatches', 'Unknown beginner-explanation patch ID']) {
  if (!runtime.includes(marker)) fail(`runtime missing ${marker}`);
}
for (const page of ['src/pages/glossary/[slug].astro', 'src/pages/ja/glossary/[slug].astro']) {
  const source = read(page);
  if (!source.includes('data-glossary-beginner-explanation="reviewed"')) fail(`${page}: reviewed beginner marker missing`);
}

const doc = read(docPath);
for (const marker of [
  'GLOSSARY-BEGINNER-EXPLANATIONS-01', '29 of the 48', 'Nineteen records',
  'Beginner explanation', '初心者向け説明', 'data-glossary-beginner-explanation',
  'automatic translation', 'GLOSSARY-QA-RELEASE-01',
]) if (!doc.includes(marker)) fail(`beginner explanation document missing ${marker}`);

if (!fs.existsSync(filePath('dist'))) fail('dist is missing; run npm run build first');
let renderedErrors = 0;
for (const entry of glossary) {
  for (const [prefix, heading, text] of [
    ['', '<h2 id="beginner-heading">Beginner explanation</h2>', entry.beginner_explanation_en],
    ['ja/', '<h2 id="beginner-heading">初心者向け説明</h2>', entry.beginner_explanation_ja],
  ]) {
    const output = filePath(`dist/${prefix}glossary/${entry.slug}/index.html`);
    if (!fs.existsSync(output)) { fail(`${entry.id}: rendered glossary route missing`); renderedErrors += 1; continue; }
    const html = fs.readFileSync(output, 'utf8');
    if (!html.includes('data-glossary-beginner-explanation="reviewed"')) { fail(`${entry.id}: rendered beginner marker missing`); renderedErrors += 1; }
    if (!html.includes(heading)) { fail(`${entry.id}: rendered beginner heading missing`); renderedErrors += 1; }
    if (!renderedTextMatches(html, text)) { fail(`${entry.id}: rendered beginner text differs`); renderedErrors += 1; }
  }
}
for (const graphPage of ['dist/glossary/relationships/index.html', 'dist/ja/glossary/relationships/index.html']) {
  if (!fs.existsSync(filePath(graphPage))) { fail(`graph page missing: ${graphPage}`); renderedErrors += 1; }
}
if (renderedErrors !== 0) fail(`rendered explanation errors: ${renderedErrors}`);

if (errors.length) {
  console.error(`GLOSSARY_BEGINNER_EXPLANATIONS: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('GLOSSARY_BEGINNER_EXPLANATIONS: pass');
console.log('GLOSSARY_RECORDS: 48');
console.log('EXPLANATIONS_BEFORE: 29');
console.log('EXPLANATIONS_AFTER: 48');
console.log('PATCHED_RECORDS: 19');
console.log('BILINGUAL_TERM_ROUTES: 96');
console.log('GRAPH_PAGE_ROUTES: 2');
console.log('UNPAIRED_EXPLANATIONS: 0');
console.log('SUMMARY_COPY_ERRORS: 0');
console.log('AUTOMATIC_GENERATION: false');
console.log('NEXT_IMPLEMENTATION_UNIT: GLOSSARY-QA-RELEASE-01');
