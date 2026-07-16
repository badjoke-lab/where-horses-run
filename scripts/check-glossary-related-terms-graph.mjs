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

const audit = parse('data/audits/glossary-related-terms-graph-v1.json');
const registry = parse('data/static/glossary-related-terms-graph-v1.json');
const patches = parse('data/static/glossary-relationships-graph-v1.json');
const glossary = loadGlossary(root);
const workflowPath = '.github/workflows/glossary-related-terms-graph.yml';
const docPath = 'docs/glossary/related-terms-graph.md';
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
    'git status --porcelain',
  ]) if (!workflow.includes(marker)) fail(`graph workflow missing ${marker}`);
  for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare']) {
    if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`graph workflow contains forbidden marker ${forbidden}`);
  }
}

if (audit.schema_version !== 'glossary-related-terms-graph-audit-v1') fail('audit schema differs');
if (audit.work_id !== 'WHR-GLOSSARY-DICTIONARY-V1') fail('audit Work ID differs');
if (audit.implementation_unit !== 'GLOSSARY-RELATED-TERMS-GRAPH-01') fail('audit implementation unit differs');
if (!['implemented_for_review', 'complete'].includes(audit.status)) fail('audit status differs');
if (audit.reviewed_at !== '2026-07-16') fail('audit review date differs');
if (
  audit.baseline?.glossary_nodes !== 48 ||
  audit.baseline?.edges !== 34 ||
  audit.baseline?.connected_components !== 18 ||
  audit.baseline?.isolated_nodes !== 8 ||
  audit.baseline?.bilingual_term_routes !== 96 ||
  audit.baseline?.graph_page_routes !== 0
) fail('audit baseline differs');
if (
  audit.implemented?.glossary_nodes !== 48 ||
  audit.implemented?.edges !== 57 ||
  audit.implemented?.added_edges !== 23 ||
  audit.implemented?.connected_components !== 1 ||
  audit.implemented?.isolated_nodes !== 0 ||
  audit.implemented?.self_loops !== 0 ||
  audit.implemented?.duplicate_edges !== 0 ||
  audit.implemented?.nonreciprocal_edges !== 0 ||
  audit.implemented?.bilingual_term_routes !== 96 ||
  audit.implemented?.graph_page_routes !== 2 ||
  audit.implemented?.new_concept_ids !== 0 ||
  audit.implemented?.removed_concept_ids !== 0
) fail('audit implemented counts differ');
if (audit.next_implementation_unit !== 'GLOSSARY-BEGINNER-EXPLANATIONS-01') fail('next implementation unit differs');
if (Object.entries(audit.public_boundary ?? {}).some(([key, value]) => key === 'definition_and_navigation_allowed' ? value !== true : value !== false)) fail('audit public boundary differs');
if (Object.values(audit.automation_boundary ?? {}).some((value) => value !== false)) fail('audit automation boundary differs');

if (registry.schema_version !== 'glossary-related-terms-graph-v1') fail('registry schema differs');
if (registry.work_id !== audit.work_id || registry.implementation_unit !== audit.implementation_unit || registry.reviewed_at !== audit.reviewed_at) fail('registry identity differs');
if (
  registry.scope?.glossary_nodes !== 48 ||
  registry.scope?.bilingual_term_routes !== 96 ||
  registry.scope?.graph_page_routes !== 2 ||
  registry.scope?.baseline_edges !== 34 ||
  registry.scope?.implemented_edges !== 57 ||
  registry.scope?.added_edges !== 23 ||
  registry.scope?.baseline_connected_components !== 18 ||
  registry.scope?.implemented_connected_components !== 1 ||
  registry.scope?.baseline_isolated_nodes !== 8 ||
  registry.scope?.implemented_isolated_nodes !== 0 ||
  registry.scope?.self_loops !== 0 ||
  registry.scope?.duplicate_edges !== 0 ||
  registry.scope?.nonreciprocal_edges !== 0 ||
  registry.scope?.new_concept_ids !== 0 ||
  registry.scope?.removed_concept_ids !== 0
) fail('registry scope differs');
const graphPolicy = registry.graph_policy ?? {};
for (const key of ['undirected', 'reciprocal_storage_required', 'relationship_patch_is_additive', 'category_boundary_preserved']) if (graphPolicy[key] !== true) fail(`graph policy ${key} differs`);
for (const key of ['self_loops_allowed', 'duplicate_edges_allowed', 'orphan_nodes_allowed', 'concept_id_change_allowed']) if (graphPolicy[key] !== false) fail(`graph policy ${key} differs`);

const baseline = parse('data/static/glossary.json');
const preGraphOrder = baseline.map((entry) => entry.id);
const preGraphById = new Map(baseline.map((entry) => [entry.id, entry]));
for (const filename of [
  'glossary-entries-role-v1.json',
  'glossary-entries-timetable-v1.json',
  'glossary-entries-official-source-v1.json',
]) {
  for (const record of parse(`data/static/${filename}`)) {
    if (!preGraphById.has(record.id)) preGraphOrder.push(record.id);
    preGraphById.set(record.id, record);
  }
}
for (const patch of parse('data/static/glossary-fields-multilingual-v1.json')) {
  const current = preGraphById.get(patch.id);
  if (!current) fail(`multilingual patch references unknown ID ${patch.id}`);
  else preGraphById.set(patch.id, { ...current, ...patch });
}
const preGraphGlossary = preGraphOrder.map((id) => preGraphById.get(id));

function graphMetrics(entries) {
  const ids = entries.map((entry) => entry.id);
  const idSet = new Set(ids);
  const adjacency = new Map(ids.map((id) => [id, new Set()]));
  const edgeSet = new Set();
  let selfLoops = 0;
  let duplicateRelations = 0;
  let nonreciprocalEdges = 0;

  for (const entry of entries) {
    if (new Set(entry.related_term_ids).size !== entry.related_term_ids.length) duplicateRelations += 1;
    for (const relatedId of entry.related_term_ids) {
      if (!idSet.has(relatedId)) {
        fail(`${entry.id}: graph endpoint missing ${relatedId}`);
        continue;
      }
      if (relatedId === entry.id) selfLoops += 1;
      const relatedEntry = entries.find((candidate) => candidate.id === relatedId);
      if (!relatedEntry?.related_term_ids.includes(entry.id)) nonreciprocalEdges += 1;
      adjacency.get(entry.id).add(relatedId);
      edgeSet.add(edgeKey(entry.id, relatedId));
    }
  }

  const visited = new Set();
  let connectedComponents = 0;
  for (const id of ids) {
    if (visited.has(id)) continue;
    connectedComponents += 1;
    const stack = [id];
    visited.add(id);
    while (stack.length) {
      const current = stack.pop();
      for (const relatedId of adjacency.get(current)) {
        if (!visited.has(relatedId)) {
          visited.add(relatedId);
          stack.push(relatedId);
        }
      }
    }
  }

  const isolatedIds = ids.filter((id) => adjacency.get(id).size === 0);
  return {
    ids,
    edgeKeys: [...edgeSet].sort(),
    edges: edgeSet.size,
    connectedComponents,
    isolatedIds,
    selfLoops,
    duplicateRelations,
    nonreciprocalEdges,
  };
}

const preMetrics = graphMetrics(preGraphGlossary);
const finalMetrics = graphMetrics(glossary);
if (preMetrics.ids.length !== 48 || preMetrics.edges !== 34 || preMetrics.connectedComponents !== 18 || preMetrics.isolatedIds.length !== 8) fail(`pre-patch graph metrics differ: nodes=${preMetrics.ids.length} edges=${preMetrics.edges} components=${preMetrics.connectedComponents} isolated=${preMetrics.isolatedIds.length}`);
if (!exact(preMetrics.isolatedIds, audit.formerly_isolated_ids)) fail('baseline isolated IDs differ');
if (finalMetrics.ids.length !== 48 || finalMetrics.edges !== 57 || finalMetrics.connectedComponents !== 1 || finalMetrics.isolatedIds.length !== 0) fail(`final graph metrics differ: nodes=${finalMetrics.ids.length} edges=${finalMetrics.edges} components=${finalMetrics.connectedComponents} isolated=${finalMetrics.isolatedIds.length}`);
if (finalMetrics.selfLoops !== 0 || finalMetrics.duplicateRelations !== 0 || finalMetrics.nonreciprocalEdges !== 0) fail('final graph integrity counters are nonzero');
if (!exact(finalMetrics.ids, preMetrics.ids) || !exact(finalMetrics.ids, registry.node_ids)) fail('concept ID order changed during graph patch');

const actualAddedEdgeKeys = finalMetrics.edgeKeys.filter((key) => !preMetrics.edgeKeys.includes(key));
const registryAddedEdgeKeys = registry.added_edges.map(([left, right]) => edgeKey(left, right)).sort();
if (actualAddedEdgeKeys.length !== 23 || !exact(actualAddedEdgeKeys, registryAddedEdgeKeys)) fail('added edge set differs');
if (digest(finalMetrics.edgeKeys) !== registry.edge_digest) fail(`final edge digest differs: ${digest(finalMetrics.edgeKeys)}`);
if (digest(actualAddedEdgeKeys) !== registry.added_edge_digest) fail(`added edge digest differs: ${digest(actualAddedEdgeKeys)}`);
for (const key of preMetrics.edgeKeys) if (!finalMetrics.edgeKeys.includes(key)) fail(`relationship patch removed baseline edge ${key}`);

const patchIds = patches.map((patch) => patch.id);
if (new Set(patchIds).size !== patchIds.length) fail('relationship patch IDs are not unique');
for (const patch of patches) {
  if (!exact(Object.keys(patch).sort(), ['add_related_term_ids', 'id'])) fail(`${patch.id}: relationship patch fields differ`);
  if (!preMetrics.ids.includes(patch.id)) fail(`${patch.id}: relationship patch references unknown node`);
  if (!Array.isArray(patch.add_related_term_ids) || new Set(patch.add_related_term_ids).size !== patch.add_related_term_ids.length) fail(`${patch.id}: relationship additions are invalid`);
  for (const relatedId of patch.add_related_term_ids) {
    if (!preMetrics.ids.includes(relatedId)) fail(`${patch.id}: relationship addition references unknown node ${relatedId}`);
    if (relatedId === patch.id) fail(`${patch.id}: relationship patch contains self-loop`);
  }
}

const loader = read(loaderPath);
for (const marker of ['glossary-relationships-graph-v1.json', 'relationshipPatchPriority', 'relationshipPatchFiles', 'add_related_term_ids']) if (!loader.includes(marker)) fail(`glossary loader missing ${marker}`);
const runtime = read(runtimePath);
for (const marker of ['glossary-relationships-graph-v1.json', 'relationshipGraphPatches', 'getGlossaryRelationshipEdges']) if (!runtime.includes(marker)) fail(`glossary runtime missing ${marker}`);
for (const page of ['src/pages/glossary/index.astro', 'src/pages/ja/glossary/index.astro']) if (!read(page).includes('relationships/')) fail(`${page}: graph link missing`);
for (const page of ['src/pages/glossary/[slug].astro', 'src/pages/ja/glossary/[slug].astro']) {
  const source = read(page);
  for (const marker of ['data-related-term-id', 'data-related-category', 'relationships/']) if (!source.includes(marker)) fail(`${page}: related graph marker missing ${marker}`);
}

const doc = read(docPath);
for (const marker of [
  'GLOSSARY-RELATED-TERMS-GRAPH-01', '34', '57', '18 connected components',
  'isolated nodes: 0', 'relationship patch is additive',
  '/glossary/relationships/', '/ja/glossary/relationships/',
  'automatic relation inference', 'GLOSSARY-BEGINNER-EXPLANATIONS-01',
]) if (!doc.includes(marker)) fail(`graph document missing ${marker}`);

if (!fs.existsSync(filePath('dist'))) fail('dist is missing; run npm run build first');
let renderedErrors = 0;
for (const entry of glossary) {
  for (const prefix of ['', 'ja/']) {
    const detailPath = filePath(`dist/${prefix}glossary/${entry.slug}/index.html`);
    if (!fs.existsSync(detailPath)) {
      fail(`${entry.id}: missing ${prefix || 'en'} term route`);
      renderedErrors += 1;
      continue;
    }
    const html = fs.readFileSync(detailPath, 'utf8');
    for (const relatedId of entry.related_term_ids) {
      if (!html.includes(`data-related-term-id="${relatedId}"`)) { fail(`${entry.id}: rendered related ID missing ${relatedId}`); renderedErrors += 1; }
      const related = glossary.find((candidate) => candidate.id === relatedId);
      if (!html.includes(`data-related-category="${related.category}"`)) { fail(`${entry.id}: rendered related category missing ${related.category}`); renderedErrors += 1; }
    }
  }
}
for (const [lang, graphPath, nodeLabel, edgeLabel] of [
  ['en', 'dist/glossary/relationships/index.html', 'reviewed glossary nodes', 'reviewed undirected edges'],
  ['ja', 'dist/ja/glossary/relationships/index.html', '確認済み用語ノード', '確認済み無向辺'],
]) {
  if (!fs.existsSync(filePath(graphPath))) {
    fail(`${lang}: graph page missing`);
    renderedErrors += 1;
    continue;
  }
  const html = read(graphPath);
  if (!html.includes(nodeLabel) || !html.includes(edgeLabel) || !html.includes('57') || !html.includes('48')) { fail(`${lang}: graph summary differs`); renderedErrors += 1; }
  for (const entry of glossary) {
    if (!html.includes(`data-graph-node-id="${entry.id}"`)) { fail(`${lang}: graph node missing ${entry.id}`); renderedErrors += 1; }
    if (!html.includes(`data-graph-node-degree="${entry.related_term_ids.length}"`)) { fail(`${lang}: graph degree differs ${entry.id}`); renderedErrors += 1; }
  }
}
if (renderedErrors !== 0) fail(`rendered route errors: ${renderedErrors}`);

if (errors.length) {
  console.error(`GLOSSARY_RELATED_TERMS_GRAPH: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('GLOSSARY_RELATED_TERMS_GRAPH: pass');
console.log('GLOSSARY_NODES: 48');
console.log('EDGES_BEFORE: 34');
console.log('EDGES_AFTER: 57');
console.log('ADDED_EDGES: 23');
console.log('COMPONENTS_BEFORE: 18');
console.log('COMPONENTS_AFTER: 1');
console.log('ISOLATED_BEFORE: 8');
console.log('ISOLATED_AFTER: 0');
console.log('BILINGUAL_TERM_ROUTES: 96');
console.log('GRAPH_PAGE_ROUTES: 2');
console.log('AUTOMATIC_RELATION_INFERENCE: false');
console.log('NEXT_IMPLEMENTATION_UNIT: GLOSSARY-BEGINNER-EXPLANATIONS-01');
