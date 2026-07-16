import crypto from 'node:crypto';
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
const edgeKey = (left, right) => [left, right].sort().join('::');
const digest = (keys) => `sha256:${crypto.createHash('sha256').update(keys.join('\n')).digest('hex')}`;
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0;

const release = parse('data/static/glossary-public-release-v1.json');
const audit = parse('data/audits/glossary-qa-release-v1.json');
const graphRegistry = parse('data/static/glossary-related-terms-graph-v1.json');
const categoryRegistry = parse('data/static/glossary-category-labels-v1.json');
const glossary = loadGlossary(root);
const workflowPath = '.github/workflows/glossary-qa-release.yml';
const docPath = 'docs/glossary/qa-release.md';

for (const requiredPath of [workflowPath, docPath]) {
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
    'node scripts/check-glossary-qa-release.mjs',
    'git status --porcelain',
  ]) if (!workflow.includes(marker)) fail(`QA workflow missing ${marker}`);
  for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare']) {
    if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`QA workflow contains forbidden marker ${forbidden}`);
  }
}

if (release.schema_version !== 'glossary-public-release-v1') fail('release schema differs');
if (release.release_id !== 'WHR-GLOSSARY-V1') fail('release ID differs');
if (release.work_id !== 'WHR-GLOSSARY-DICTIONARY-V1') fail('release Work ID differs');
if (release.implementation_unit !== 'GLOSSARY-QA-RELEASE-01') fail('release implementation unit differs');
if (release.status !== 'release_ready') fail('release status differs');
if (release.reviewed_at !== '2026-07-16') fail('release review date differs');
if (release.next_work_id !== 'WHR-SEARCH-FILTER-SEO-V1') fail('release next Work ID differs');

const expectedScope = {
  glossary_concepts: 48,
  categories: 9,
  localized_category_labels: 18,
  bilingual_term_routes: 96,
  graph_page_routes: 2,
  total_glossary_routes: 98,
  relationship_edges: 57,
  connected_components: 1,
  isolated_concepts: 0,
  records_with_japanese_reading: 48,
  records_with_paired_beginner_explanations: 48,
  records_with_broken_relationships: 0,
  records_with_unpaired_fields: 0,
};
if (!exact(release.scope, expectedScope)) fail('release scope differs');

const expectedCategoryCounts = {
  race_type: 10,
  breed: 4,
  horse_type: 1,
  role: 8,
  data_term: 8,
  official_source: 5,
  governance_term: 3,
  track_term: 6,
  surface: 3,
};
if (!exact(release.category_counts, expectedCategoryCounts)) fail('release category counts differ');
if (!exact(release.concept_ids, graphRegistry.node_ids)) fail('release concept IDs differ from graph registry');
if (release.graph_contract?.edge_digest !== graphRegistry.edge_digest) fail('release graph digest differs');
for (const key of ['undirected', 'reciprocal_storage_required']) if (release.graph_contract?.[key] !== true) fail(`release graph contract ${key} differs`);
for (const key of ['self_loops_allowed', 'duplicate_edges_allowed', 'orphan_concepts_allowed']) if (release.graph_contract?.[key] !== false) fail(`release graph contract ${key} differs`);
for (const value of Object.values(release.field_contract ?? {})) if (value !== true) fail('release field contract differs');
for (const [key, value] of Object.entries(release.public_boundary ?? {})) {
  const expected = key === 'definition_and_navigation_allowed';
  if (value !== expected) fail(`release public boundary differs: ${key}`);
}
for (const value of Object.values(release.automation_boundary ?? {})) if (value !== false) fail('release automation boundary differs');
if (!Array.isArray(release.completed_units) || release.completed_units.length !== 10 || release.completed_units.at(-1) !== 'GLOSSARY-QA-RELEASE-01') fail('completed unit list differs');

if (audit.schema_version !== 'glossary-qa-release-v1') fail('audit schema differs');
if (audit.release_id !== release.release_id || audit.work_id !== release.work_id || audit.implementation_unit !== release.implementation_unit) fail('audit identity differs');
if (audit.status !== 'release_ready' || audit.release_decision !== 'release_ready') fail('audit release decision differs');
if (audit.reviewed_at !== release.reviewed_at) fail('audit review date differs');
if (audit.next_work_id !== release.next_work_id) fail('audit next Work ID differs');
for (const value of Object.values(audit.release_invariants ?? {})) if (value !== true) fail('audit release invariant differs');
for (const [key, value] of Object.entries(audit.public_boundary ?? {})) {
  const expected = key === 'definition_and_navigation_allowed';
  if (value !== expected) fail(`audit public boundary differs: ${key}`);
}
for (const value of Object.values(audit.automation_boundary ?? {})) if (value !== false) fail('audit automation boundary differs');

const ids = glossary.map((entry) => entry.id);
const slugs = glossary.map((entry) => entry.slug);
if (glossary.length !== 48) fail(`glossary concept count expected 48; found ${glossary.length}`);
if (!exact(ids, release.concept_ids)) fail('final concept ID order differs from release contract');
if (new Set(ids).size !== 48) fail('duplicate glossary IDs found');
if (new Set(slugs).size !== 48) fail('duplicate glossary slugs found');

const actualCategoryCounts = Object.fromEntries(Object.keys(expectedCategoryCounts).map((category) => [category, 0]));
const entryById = new Map(glossary.map((entry) => [entry.id, entry]));
const edgeSet = new Set();
const adjacency = new Map(ids.map((id) => [id, new Set()]));
let brokenRelationships = 0;
let nonreciprocalRelationships = 0;
let selfLoops = 0;
let missingRequiredFields = 0;
let unpairedFields = 0;
let publicBoundaryErrors = 0;

for (const entry of glossary) {
  if (entry.id !== entry.slug) fail(`${entry.id}: slug differs from frozen concept ID`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id)) fail(`${entry.id}: invalid concept ID`);
  if (actualCategoryCounts[entry.category] === undefined) fail(`${entry.id}: unknown category ${entry.category}`);
  else actualCategoryCounts[entry.category] += 1;

  const requiredStringFields = [
    'schema_version', 'id', 'slug', 'term_en', 'term_ja', 'category',
    'summary_en', 'summary_ja', 'reading_ja', 'evidence_status',
    'content_status', 'last_reviewed',
  ];
  for (const field of requiredStringFields) {
    if (!nonempty(entry[field])) { fail(`${entry.id}: required field missing ${field}`); missingRequiredFields += 1; }
  }
  if (entry.schema_version !== 'glossary-entry-v2') fail(`${entry.id}: schema version differs`);
  if (!Array.isArray(entry.aliases_en) || !Array.isArray(entry.aliases_ja) || !Array.isArray(entry.related_term_ids) || !Array.isArray(entry.source_ids)) {
    fail(`${entry.id}: required array field differs`);
    missingRequiredFields += 1;
  }
  for (const aliases of [entry.aliases_en, entry.aliases_ja]) {
    if (Array.isArray(aliases) && (new Set(aliases).size !== aliases.length || aliases.some((alias) => !nonempty(alias) || alias !== alias.trim()))) fail(`${entry.id}: alias contract differs`);
  }
  if (Boolean(entry.beginner_explanation_en) !== Boolean(entry.beginner_explanation_ja)) { fail(`${entry.id}: beginner explanation pair differs`); unpairedFields += 1; }
  if (!nonempty(entry.beginner_explanation_en) || !nonempty(entry.beginner_explanation_ja)) { fail(`${entry.id}: beginner explanation missing`); missingRequiredFields += 1; }
  if (!entry.public_boundary || !['definition_only', 'definition_and_navigation'].includes(entry.public_boundary.mode) || entry.public_boundary.republish_dataset !== false || !Array.isArray(entry.public_boundary.prohibited_dataset_keys)) {
    fail(`${entry.id}: public boundary differs`);
    publicBoundaryErrors += 1;
  }

  if (new Set(entry.related_term_ids).size !== entry.related_term_ids.length) fail(`${entry.id}: duplicate related IDs found`);
  for (const relatedId of entry.related_term_ids) {
    if (!entryById.has(relatedId)) { fail(`${entry.id}: broken related concept ${relatedId}`); brokenRelationships += 1; continue; }
    if (relatedId === entry.id) { fail(`${entry.id}: self-loop found`); selfLoops += 1; }
    if (!entryById.get(relatedId).related_term_ids.includes(entry.id)) { fail(`${entry.id}: nonreciprocal relationship ${relatedId}`); nonreciprocalRelationships += 1; }
    adjacency.get(entry.id).add(relatedId);
    edgeSet.add(edgeKey(entry.id, relatedId));
  }
}
if (!exact(actualCategoryCounts, expectedCategoryCounts)) fail(`actual category counts differ: ${JSON.stringify(actualCategoryCounts)}`);

const categoryLabels = categoryRegistry.labels ?? {};
if (!exact(Object.keys(categoryLabels), Object.keys(expectedCategoryCounts))) fail('category label IDs differ');
let localizedCategoryLabels = 0;
for (const category of Object.keys(expectedCategoryCounts)) {
  for (const locale of ['en', 'ja']) {
    if (!nonempty(categoryLabels[category]?.[locale])) fail(`category label missing: ${category}.${locale}`);
    else localizedCategoryLabels += 1;
  }
}
if (localizedCategoryLabels !== 18) fail(`localized category label count expected 18; found ${localizedCategoryLabels}`);

const edgeKeys = [...edgeSet].sort();
if (edgeKeys.length !== 57) fail(`edge count expected 57; found ${edgeKeys.length}`);
if (digest(edgeKeys) !== release.graph_contract.edge_digest) fail(`edge digest differs: ${digest(edgeKeys)}`);
let connectedComponents = 0;
const visited = new Set();
for (const id of ids) {
  if (visited.has(id)) continue;
  connectedComponents += 1;
  const stack = [id];
  visited.add(id);
  while (stack.length) {
    const current = stack.pop();
    for (const relatedId of adjacency.get(current)) {
      if (!visited.has(relatedId)) { visited.add(relatedId); stack.push(relatedId); }
    }
  }
}
const isolatedIds = ids.filter((id) => adjacency.get(id).size === 0);
if (connectedComponents !== 1) fail(`connected components expected 1; found ${connectedComponents}`);
if (isolatedIds.length !== 0) fail(`isolated concepts found: ${isolatedIds.join(', ')}`);
if (brokenRelationships || nonreciprocalRelationships || selfLoops || missingRequiredFields || unpairedFields || publicBoundaryErrors) fail('QA integrity counters are nonzero');

const routeContract = release.route_contract;
if (!exact(routeContract, {
  english_index: '/glossary/',
  japanese_index: '/ja/glossary/',
  english_term_pattern: '/glossary/{slug}/',
  japanese_term_pattern: '/ja/glossary/{slug}/',
  english_graph: '/glossary/relationships/',
  japanese_graph: '/ja/glossary/relationships/',
})) fail('route contract differs');

const indexSources = [
  ['src/pages/glossary/index.astro', 'Public v1', '48 reviewed racing concepts', '/glossary/relationships/'],
  ['src/pages/ja/glossary/index.astro', '公開v1', '競馬関連用語48件', '/ja/glossary/relationships/'],
];
for (const [page, releaseText, countText, graphLink] of indexSources) {
  const source = read(page);
  for (const marker of ['data-glossary-release="WHR-GLOSSARY-V1"', 'data-glossary-concepts="48"', 'data-glossary-relationships="57"', releaseText, countText, graphLink]) {
    if (!source.includes(marker)) fail(`${page}: release marker missing ${marker}`);
  }
}

const doc = read(docPath);
for (const marker of [
  'WHR-GLOSSARY-V1', 'GLOSSARY-QA-RELEASE-01', '48', '57', '98',
  'sha256:b4a653f0417bc0b2fb61aff8d10fbc811fd4a433100e9f90f92ece415102a849',
  'data-glossary-release', 'WHR-SEARCH-FILTER-SEO-V1',
]) if (!doc.includes(marker)) fail(`QA release document missing ${marker}`);

if (!fs.existsSync(filePath('dist'))) fail('dist is missing; run npm run build first');
let missingRenderedRoutes = 0;
let renderedMarkerErrors = 0;
const renderedIndexes = [
  ['dist/glossary/index.html', ['data-glossary-release="WHR-GLOSSARY-V1"', 'data-glossary-concepts="48"', 'data-glossary-relationships="57"']],
  ['dist/ja/glossary/index.html', ['data-glossary-release="WHR-GLOSSARY-V1"', 'data-glossary-concepts="48"', 'data-glossary-relationships="57"']],
  ['dist/glossary/relationships/index.html', ['data-glossary-graph="reviewed"']],
  ['dist/ja/glossary/relationships/index.html', ['data-glossary-graph="reviewed"']],
];
for (const [output, markers] of renderedIndexes) {
  if (!fs.existsSync(filePath(output))) { fail(`rendered route missing: ${output}`); missingRenderedRoutes += 1; continue; }
  const html = read(output);
  for (const marker of markers) if (!html.includes(marker)) { fail(`${output}: rendered marker missing ${marker}`); renderedMarkerErrors += 1; }
}
for (const entry of glossary) {
  for (const [prefix, term, summary, beginner] of [
    ['', entry.term_en, entry.summary_en, entry.beginner_explanation_en],
    ['ja/', entry.term_ja, entry.summary_ja, entry.beginner_explanation_ja],
  ]) {
    const output = `dist/${prefix}glossary/${entry.slug}/index.html`;
    if (!fs.existsSync(filePath(output))) { fail(`${entry.id}: rendered route missing ${output}`); missingRenderedRoutes += 1; continue; }
    const html = read(output);
    for (const marker of [
      term,
      summary,
      `data-glossary-schema-version="${entry.schema_version}"`,
      `data-glossary-content-status="${entry.content_status}"`,
      `data-glossary-public-boundary="${entry.public_boundary.mode}"`,
      `data-glossary-category="${entry.category}"`,
      'data-glossary-beginner-explanation="reviewed"',
      entry.reading_ja,
    ]) if (!html.includes(marker)) { fail(`${entry.id}: rendered marker/content missing ${marker}`); renderedMarkerErrors += 1; }
    if (!html.includes(beginner) && !html.includes(beginner.replaceAll('&', '&amp;').replaceAll("'", '&#39;'))) { fail(`${entry.id}: rendered beginner explanation differs`); renderedMarkerErrors += 1; }
    if (entry.public_boundary.prohibited_dataset_keys.length > 0) {
      const boundaryHeading = prefix ? '<h2>公開データ境界</h2>' : '<h2>Public data boundary</h2>';
      if (!html.includes(boundaryHeading)) { fail(`${entry.id}: rendered public boundary notice missing`); renderedMarkerErrors += 1; }
    }
  }
}
if (missingRenderedRoutes !== 0 || renderedMarkerErrors !== 0) fail('rendered QA counters are nonzero');

const verified = audit.verified ?? {};
const measuredAudit = {
  glossary_concepts: glossary.length,
  categories: Object.keys(actualCategoryCounts).length,
  localized_category_labels: localizedCategoryLabels,
  bilingual_term_routes: glossary.length * 2,
  graph_page_routes: 2,
  total_glossary_routes: glossary.length * 2 + 2,
  relationship_edges: edgeKeys.length,
  connected_components: connectedComponents,
  isolated_concepts: isolatedIds.length,
  records_with_japanese_reading: glossary.filter((entry) => nonempty(entry.reading_ja)).length,
  records_with_paired_beginner_explanations: glossary.filter((entry) => nonempty(entry.beginner_explanation_en) && nonempty(entry.beginner_explanation_ja)).length,
  duplicate_ids: glossary.length - new Set(ids).size,
  duplicate_slugs: glossary.length - new Set(slugs).size,
  broken_relationships: brokenRelationships,
  nonreciprocal_relationships: nonreciprocalRelationships,
  self_loops: selfLoops,
  missing_required_fields: missingRequiredFields,
  unpaired_multilingual_fields: unpairedFields,
  missing_rendered_routes: missingRenderedRoutes,
  rendered_marker_errors: renderedMarkerErrors,
  public_boundary_errors: publicBoundaryErrors,
  release_contract_errors: 0,
};
if (!exact(verified, measuredAudit)) fail(`audit verified measurements differ: ${JSON.stringify(measuredAudit)}`);

if (errors.length) {
  console.error(`GLOSSARY_QA_RELEASE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('GLOSSARY_QA_RELEASE: pass');
console.log('RELEASE_ID: WHR-GLOSSARY-V1');
console.log('RELEASE_DECISION: release_ready');
console.log('GLOSSARY_CONCEPTS: 48');
console.log('BILINGUAL_TERM_ROUTES: 96');
console.log('GRAPH_PAGE_ROUTES: 2');
console.log('TOTAL_GLOSSARY_ROUTES: 98');
console.log('RELATIONSHIP_EDGES: 57');
console.log('CONNECTED_COMPONENTS: 1');
console.log('ISOLATED_CONCEPTS: 0');
console.log('PAIRED_BEGINNER_EXPLANATIONS: 48');
console.log('PUBLICATION_OR_DEPLOYMENT: false');
console.log('NEXT_WORK_ID: WHR-SEARCH-FILTER-SEO-V1');
