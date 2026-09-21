import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const masterDir = path.join(root, 'data', 'glossary-master');
const manifestPath = path.join(masterDir, 'manifest-v1.json');
const coveragePath = path.join(masterDir, 'coverage', 'master-005-evidence-coverage-v1.tsv');
const dispositionPath = path.join(masterDir, 'concepts', 'concept-dispositions-v1.tsv');

const expectedConceptHeader = [
  'concept_id',
  'category_id',
  'category_ja',
  'canonical_en',
  'preferred_ja',
  'working_definition_ja',
  'concept_kind',
  'priority',
  'jurisdiction_scope',
  'discipline_scope',
  'translation_status',
  'verification_status',
  'source_required',
  'public_ready',
  'notes',
];

function fail(message) {
  console.error(`Glossary master integrity check failed: ${message}`);
  process.exitCode = 1;
}

function readTsv(filePath) {
  const text = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '').replace(/(?:\r?\n)+$/, '');
  const lines = text.split(/\r?\n/);
  if (!lines.length || !lines[0]) return { header: [], rows: [] };
  const header = lines[0].split('\t');
  const rows = lines.slice(1).filter(Boolean).map((line, index) => {
    const values = line.split('\t');
    if (values.length !== header.length) {
      fail(`${path.relative(root, filePath)}:${index + 2} has ${values.length} columns; expected ${header.length}`);
    }
    return Object.fromEntries(header.map((key, i) => [key, values[i] ?? '']));
  });
  return { header, rows };
}

function sameHeader(actual, expected) {
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const categoryIds = new Set(manifest.categories.map((category) => category.id));
const baseFileCategory = new Map();
const conceptFiles = new Set();

for (const category of manifest.categories) {
  baseFileCategory.set(category.file, category.id);
  conceptFiles.add(category.file);
  for (const supplemental of category.supplemental_files ?? []) conceptFiles.add(supplemental);
}

const activeConcepts = [];
const seenIds = new Map();
const categoryCounts = new Map();
const priorityCounts = new Map();
let sourceVerified = 0;
let candidate = 0;
let publicReady = 0;

for (const relativeFile of [...conceptFiles].sort()) {
  const filePath = path.join(masterDir, relativeFile);
  if (!fs.existsSync(filePath)) {
    fail(`manifest references missing concept file ${relativeFile}`);
    continue;
  }

  const { header, rows } = readTsv(filePath);
  if (!sameHeader(header, expectedConceptHeader)) {
    fail(`${relativeFile} has invalid Concept TSV header: ${header.join('|')}`);
    continue;
  }

  for (const row of rows) {
    if (!row.concept_id || !/^([A-Z]+)-\d{3}$/.test(row.concept_id)) {
      fail(`${relativeFile} contains invalid concept_id ${JSON.stringify(row.concept_id)}`);
      continue;
    }
    if (!categoryIds.has(row.category_id)) fail(`${row.concept_id} uses unknown category ${row.category_id}`);

    const expectedBaseCategory = baseFileCategory.get(relativeFile);
    if (expectedBaseCategory && row.category_id !== expectedBaseCategory) {
      fail(`${relativeFile} contains ${row.concept_id} in category ${row.category_id}; expected ${expectedBaseCategory}`);
    }

    if (seenIds.has(row.concept_id)) {
      fail(`duplicate active Concept ID ${row.concept_id} in ${seenIds.get(row.concept_id)} and ${relativeFile}`);
    } else {
      seenIds.set(row.concept_id, relativeFile);
    }

    if (!['P0', 'P1', 'P2', 'P3'].includes(row.priority)) fail(`${row.concept_id} has invalid priority ${row.priority}`);
    if (!['candidate', 'source_verified'].includes(row.verification_status)) {
      fail(`${row.concept_id} has invalid verification_status ${row.verification_status}`);
    }
    if (!['yes', 'no'].includes(row.public_ready)) fail(`${row.concept_id} has invalid public_ready ${row.public_ready}`);

    activeConcepts.push(row);
    categoryCounts.set(row.category_id, (categoryCounts.get(row.category_id) ?? 0) + 1);
    priorityCounts.set(row.priority, (priorityCounts.get(row.priority) ?? 0) + 1);
    if (row.verification_status === 'source_verified') sourceVerified += 1;
    if (row.verification_status === 'candidate') candidate += 1;
    if (row.public_ready === 'yes') publicReady += 1;
  }
}

if (activeConcepts.length !== manifest.concept_count) {
  fail(`manifest concept_count=${manifest.concept_count}, active Concept rows=${activeConcepts.length}`);
}

for (const category of manifest.categories) {
  const observed = categoryCounts.get(category.id) ?? 0;
  if (observed !== category.count) fail(`manifest category ${category.id} count=${category.count}, observed=${observed}`);
}

for (const priority of ['P0', 'P1', 'P2', 'P3']) {
  const expected = manifest.priority_counts?.[priority] ?? 0;
  const observed = priorityCounts.get(priority) ?? 0;
  if (observed !== expected) fail(`manifest priority ${priority} count=${expected}, observed=${observed}`);
}

if (publicReady !== manifest.public_ready_count) {
  fail(`manifest public_ready_count=${manifest.public_ready_count}, observed=${publicReady}`);
}

const { rows: dispositionRows } = readTsv(dispositionPath);
if (manifest.concept_dispositions?.merged_concept_rows !== dispositionRows.length) {
  fail(`manifest merged_concept_rows=${manifest.concept_dispositions?.merged_concept_rows}, disposition rows=${dispositionRows.length}`);
}
for (const row of dispositionRows) {
  if (seenIds.has(row.retired_concept_id)) fail(`retired Concept ID ${row.retired_concept_id} is still active`);
  if (!seenIds.has(row.canonical_concept_id)) fail(`disposition canonical Concept ${row.canonical_concept_id} is not active`);
}

const abbreviationRelativePath = manifest.usage_layers?.abbreviations?.file;
if (abbreviationRelativePath) {
  const abbreviationPath = path.join(masterDir, abbreviationRelativePath);
  const { rows: abbreviationRows } = readTsv(abbreviationPath);
  for (const row of abbreviationRows) {
    if (!seenIds.has(row.concept_id)) fail(`abbreviation ${row.abbreviation_id} references inactive Concept ${row.concept_id}`);
    if (row.verification_status !== 'source_verified') fail(`abbreviation ${row.abbreviation_id} is not source_verified`);
  }
  if (manifest.usage_layers.abbreviations.row_count !== abbreviationRows.length) {
    fail(`manifest abbreviation row_count=${manifest.usage_layers.abbreviations.row_count}, observed=${abbreviationRows.length}`);
  }
}

const { rows: coverageRows } = readTsv(coveragePath);
const allCoverage = coverageRows.find((row) => row.scope_type === 'all' && row.scope_id === 'ALL');
if (!allCoverage) {
  fail('coverage file has no all/ALL row');
} else {
  const expected = {
    total_concepts: activeConcepts.length,
    source_verified: sourceVerified,
    candidate,
  };
  for (const [field, observed] of Object.entries(expected)) {
    if (Number(allCoverage[field]) !== observed) fail(`coverage ${field}=${allCoverage[field]}, observed=${observed}`);
  }
}

const p0Rows = activeConcepts.filter((row) => row.priority === 'P0');
const p0Coverage = coverageRows.find((row) => row.scope_type === 'priority' && row.scope_id === 'P0');
if (!p0Coverage) {
  fail('coverage file has no priority/P0 row');
} else {
  const p0Verified = p0Rows.filter((row) => row.verification_status === 'source_verified').length;
  const p0Candidate = p0Rows.filter((row) => row.verification_status === 'candidate').length;
  if (Number(p0Coverage.total_concepts) !== p0Rows.length) fail(`P0 coverage total=${p0Coverage.total_concepts}, observed=${p0Rows.length}`);
  if (Number(p0Coverage.source_verified) !== p0Verified) fail(`P0 coverage verified=${p0Coverage.source_verified}, observed=${p0Verified}`);
  if (Number(p0Coverage.candidate) !== p0Candidate) fail(`P0 coverage candidate=${p0Coverage.candidate}, observed=${p0Candidate}`);
}

const searchLayer = manifest.search_intent_layer;
let searchQueryCount = 0;
if (searchLayer) {
  const requiredSearchFiles = [
    searchLayer.policy_file,
    ...(searchLayer.query_files ?? []),
    searchLayer.coverage_file,
    searchLayer.readiness_gate_file,
  ].filter(Boolean);
  for (const relativeFile of requiredSearchFiles) {
    const filePath = path.join(masterDir, relativeFile);
    if (!fs.existsSync(filePath)) fail(`manifest search_intent_layer references missing file ${relativeFile}`);
  }

  const expectedSearchHeader = [
    'query_id',
    'concept_id',
    'related_concept_id',
    'query',
    'language',
    'country_or_locale',
    'search_intent',
    'query_type',
    'priority',
    'future_target',
    'review_state',
    'source_basis',
  ];
  const searchIds = new Set();
  const observedIntentCounts = new Map();
  const definitionP0ByLanguage = new Map();
  for (const relativeFile of searchLayer.query_files ?? []) {
    const filePath = path.join(masterDir, relativeFile);
    if (!fs.existsSync(filePath)) continue;
    const { header, rows } = readTsv(filePath);
    if (!sameHeader(header, expectedSearchHeader)) {
      fail(`${relativeFile} has invalid search-query TSV header: ${header.join('|')}`);
      continue;
    }
    for (const row of rows) {
      searchQueryCount += 1;
      if (!/^SQ-\d{4}$/.test(row.query_id)) fail(`${relativeFile} has invalid query_id ${row.query_id}`);
      if (searchIds.has(row.query_id)) fail(`duplicate search query ID ${row.query_id}`);
      searchIds.add(row.query_id);
      if (!seenIds.has(row.concept_id)) fail(`${row.query_id} references inactive Concept ${row.concept_id}`);
      if (row.related_concept_id && !seenIds.has(row.related_concept_id)) fail(`${row.query_id} references inactive related Concept ${row.related_concept_id}`);
      if (!row.query.trim()) fail(`${row.query_id} has empty query`);
      if (!['en','ja','fr'].includes(row.language)) fail(`${row.query_id} has unsupported language ${row.language}`);
      if (!['P0','P1','P2','P3'].includes(row.priority)) fail(`${row.query_id} has invalid priority ${row.priority}`);
      if (!row.review_state) fail(`${row.query_id} has empty review_state`);
      observedIntentCounts.set(row.search_intent, (observedIntentCounts.get(row.search_intent) ?? 0) + 1);
      if (row.search_intent === 'definition' && row.priority === 'P0') {
        if (!definitionP0ByLanguage.has(row.language)) definitionP0ByLanguage.set(row.language, new Set());
        const set = definitionP0ByLanguage.get(row.language);
        if (set.has(row.concept_id)) fail(`duplicate P0 definition intent for ${row.concept_id} language ${row.language}`);
        set.add(row.concept_id);
      }
    }
  }
  if (searchQueryCount !== searchLayer.query_count) fail(`manifest search query_count=${searchLayer.query_count}, observed=${searchQueryCount}`);
  if (searchQueryCount !== searchLayer.reviewed_query_count) fail(`manifest reviewed_query_count=${searchLayer.reviewed_query_count}, observed reviewed wave-1 records=${searchQueryCount}`);
  for (const [intent, expected] of Object.entries(searchLayer.intent_counts ?? {})) {
    const observed = observedIntentCounts.get(intent) ?? 0;
    if (observed !== expected) fail(`manifest search intent ${intent} count=${expected}, observed=${observed}`);
  }
  if (searchLayer.definition_p0_concepts !== undefined) {
    if (searchLayer.definition_p0_concepts !== p0Rows.length) {
      fail(`manifest definition_p0_concepts=${searchLayer.definition_p0_concepts}, active P0 Concepts=${p0Rows.length}`);
    }
    const p0Ids = new Set(p0Rows.map((row) => row.concept_id));
    for (const language of searchLayer.definition_p0_languages ?? []) {
      const covered = definitionP0ByLanguage.get(language) ?? new Set();
      if (covered.size !== p0Ids.size) fail(`P0 definition coverage for ${language}=${covered.size}, expected=${p0Ids.size}`);
      for (const conceptId of p0Ids) {
        if (!covered.has(conceptId)) fail(`P0 Concept ${conceptId} missing ${language} definition intent`);
      }
    }
  }
}

if (!process.exitCode) {
  const searchSuffix = manifest.search_intent_layer ? `, ${searchQueryCount} search-intent queries` : '';
  console.log(`Glossary master integrity OK: ${activeConcepts.length} Concepts, ${sourceVerified} verified, ${candidate} candidate, ${dispositionRows.length} dispositions${searchSuffix}.`);
}
