import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const trackerPath = path.join(root, 'docs/country-pages/98-country-tracker.tsv');
const contractPath = path.join(root, 'docs/country-pages/completion-contract.md');
const errors = [];
const fail = (message) => errors.push(message);

const parseTsv = (text) => {
  const lines = text.replace(/\r\n/g, '\n').trimEnd().split('\n');
  const headers = lines[0].split('\t');
  const rows = lines.slice(1).map((line, index) => {
    const values = line.split('\t');
    if (values.length !== headers.length) {
      fail(`tracker row ${index + 2} has ${values.length} columns; expected ${headers.length}`);
      return null;
    }
    return Object.fromEntries(headers.map((header, column) => [header, values[column]]));
  });
  return { headers, rows: rows.filter(Boolean) };
};

if (!fs.existsSync(trackerPath)) fail('missing docs/country-pages/98-country-tracker.tsv');
if (!fs.existsSync(contractPath)) fail('missing docs/country-pages/completion-contract.md');
if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}

const trackerText = fs.readFileSync(trackerPath, 'utf8');
const contractText = fs.readFileSync(contractPath, 'utf8');
const { headers, rows } = parseTsv(trackerText);
const expectedHeaders = [
  'delivery_no', 'scope_group', 'scope_group_no', 'name_en', 'name_ja', 'slug',
  'page_kind', 'programme_status', 'acquisition_status', 'note_status', 'note_ref',
  'profile_status', 'en_route_status', 'ja_route_status', 'qa_status',
  'source_last_checked', 'evidence_reviewed_at', 'profile_last_reviewed',
  'page_published_at', 'remarks'
];
if (JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) fail(`unexpected tracker headers: ${headers.join(', ')}`);
if (rows.length !== 98) fail(`tracker must contain exactly 98 rows; found ${rows.length}`);

const expectedGroupCounts = {
  v0_candidate: 27,
  v0_1_candidate: 29,
  v0_2_candidate: 16,
  link_or_hold: 13,
  under_review_special: 6,
  exclusion_leaning: 4,
  archive: 3
};
const allowedProgrammeStatuses = new Set(['not_started', 'source_research', 'source_tested', 'note_reviewed', 'profile_ready', 'page_qa', 'published']);
const allowedAcquisitionStatuses = new Set(['not_started', 'remote_complete', 'remote_partial', 'local_required', 'local_complete', 'pending_unreachable', 'not_applicable']);
const allowedNoteStatuses = new Set(['not_started', 'draft', 'reviewed']);
const allowedProfileStatuses = new Set(['not_started', 'draft', 'reviewed_seed', 'reviewed']);
const allowedRouteStatuses = new Set(['missing', 'generated_seed', 'draft', 'complete', 'published']);
const allowedQaStatuses = new Set(['not_started', 'pending', 'passed']);
const allowedPageKinds = new Set(['country', 'special', 'explanatory', 'archive']);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const today = new Date().toISOString().slice(0, 10);
const dateFields = ['source_last_checked', 'evidence_reviewed_at', 'profile_last_reviewed', 'page_published_at'];
const seenSlugs = new Set();

for (const [index, row] of rows.entries()) {
  const rowNumber = index + 2;
  const expectedDelivery = String(index + 1).padStart(2, '0');
  if (row.delivery_no !== expectedDelivery) fail(`row ${rowNumber} delivery_no must be ${expectedDelivery}; found ${row.delivery_no}`);
  if (!slugPattern.test(row.slug)) fail(`invalid slug at row ${rowNumber}: ${row.slug}`);
  if (seenSlugs.has(row.slug)) fail(`duplicate slug: ${row.slug}`);
  seenSlugs.add(row.slug);
  if (!expectedGroupCounts[row.scope_group]) fail(`unknown scope_group at row ${rowNumber}: ${row.scope_group}`);
  const groupNo = Number(row.scope_group_no);
  if (!Number.isInteger(groupNo) || groupNo < 1 || groupNo > expectedGroupCounts[row.scope_group]) fail(`invalid scope_group_no for ${row.slug}: ${row.scope_group_no}`);
  if (!row.name_en || !row.name_ja) fail(`missing bilingual name at row ${rowNumber}`);
  if (!allowedPageKinds.has(row.page_kind)) fail(`invalid page_kind for ${row.slug}: ${row.page_kind}`);
  if (!allowedProgrammeStatuses.has(row.programme_status)) fail(`invalid programme_status for ${row.slug}: ${row.programme_status}`);
  if (!allowedAcquisitionStatuses.has(row.acquisition_status)) fail(`invalid acquisition_status for ${row.slug}: ${row.acquisition_status}`);
  if (!allowedNoteStatuses.has(row.note_status)) fail(`invalid note_status for ${row.slug}: ${row.note_status}`);
  if (!allowedProfileStatuses.has(row.profile_status)) fail(`invalid profile_status for ${row.slug}: ${row.profile_status}`);
  if (!allowedRouteStatuses.has(row.en_route_status) || !allowedRouteStatuses.has(row.ja_route_status)) fail(`invalid route status for ${row.slug}`);
  if (!allowedQaStatuses.has(row.qa_status)) fail(`invalid qa_status for ${row.slug}: ${row.qa_status}`);
  if (row.note_status === 'reviewed') {
    if (!row.note_ref) fail(`reviewed note is missing note_ref for ${row.slug}`);
    else if (!fs.existsSync(path.join(root, row.note_ref))) fail(`note_ref does not exist for ${row.slug}: ${row.note_ref}`);
  }
  for (const field of dateFields) {
    const value = row[field];
    if (!value) continue;
    if (!datePattern.test(value)) fail(`invalid ${field} for ${row.slug}: ${value}`);
    else if (value > today) fail(`${field} must not be in the future for ${row.slug}: ${value}`);
  }
  if (row.page_kind === 'archive' && row.scope_group !== 'archive') fail(`archive page_kind must use archive scope_group: ${row.slug}`);
  if (row.scope_group === 'archive' && row.page_kind !== 'archive') fail(`archive scope_group must use archive page_kind: ${row.slug}`);
  if (row.scope_group === 'under_review_special' && row.page_kind !== 'special') fail(`under_review_special must use special page_kind: ${row.slug}`);
  if (row.scope_group === 'exclusion_leaning' && row.page_kind !== 'explanatory') fail(`exclusion_leaning must use explanatory page_kind: ${row.slug}`);
  if (row.programme_status === 'published') {
    if (row.en_route_status !== 'published' || row.ja_route_status !== 'published') fail(`published programme requires published routes: ${row.slug}`);
    if (row.qa_status !== 'passed') fail(`published programme requires passed QA: ${row.slug}`);
    if (!row.page_published_at) fail(`published programme requires page_published_at: ${row.slug}`);
    if (!['reviewed', 'reviewed_seed'].includes(row.profile_status)) fail(`published programme requires reviewed profile: ${row.slug}`);
  } else if (row.page_published_at) {
    fail(`non-published programme must not set page_published_at: ${row.slug}`);
  }
}

for (const [group, expected] of Object.entries(expectedGroupCounts)) {
  const groupRows = rows.filter((row) => row.scope_group === group);
  if (groupRows.length !== expected) fail(`${group} must contain ${expected} rows; found ${groupRows.length}`);
  const numbers = groupRows.map((row) => Number(row.scope_group_no)).sort((a, b) => a - b);
  const expectedNumbers = Array.from({ length: expected }, (_, index) => index + 1);
  if (JSON.stringify(numbers) !== JSON.stringify(expectedNumbers)) fail(`${group} scope_group_no values must be exactly 1-${expected}`);
}

const publishedBatch = [
  ['01', 'united-arab-emirates'], ['02', 'south-korea'], ['03', 'turkey'], ['04', 'morocco'],
  ['05', 'chile'], ['06', 'peru'], ['07', 'mexico'], ['08', 'brazil'],
  ['09', 'bahrain'], ['10', 'qatar'], ['11', 'oman'], ['12', 'zimbabwe'],
  ['13', 'japan'], ['14', 'hong-kong'], ['15', 'new-zealand'], ['16', 'south-africa'],
  ['17', 'uruguay'], ['18', 'sweden'], ['19', 'denmark'], ['20', 'czech-republic']
];
const staticDirectory = path.join(root, 'data/static');
const productionProfileFiles = fs.readdirSync(staticDirectory).filter((name) => /^country-profiles-v2(?:-.*)?\.json$/.test(name)).sort();
const productionProfiles = productionProfileFiles.flatMap((fileName) => JSON.parse(fs.readFileSync(path.join(staticDirectory, fileName), 'utf8')));
const productionProfileIds = new Set(productionProfiles.map((profile) => profile.country_id));
for (const [deliveryNo, slug] of publishedBatch) {
  const row = rows.find((entry) => entry.delivery_no === deliveryNo);
  if (!row || row.slug !== slug) fail(`delivery ${deliveryNo} must be ${slug}`);
  if (!productionProfileIds.has(slug)) fail(`delivery ${deliveryNo} requires a production profile`);
  if (row?.programme_status !== 'published') fail(`delivery ${deliveryNo} must be published`);
  if (row?.profile_status !== 'reviewed') fail(`delivery ${deliveryNo} profile must be reviewed`);
  if (row?.en_route_status !== 'published' || row?.ja_route_status !== 'published') fail(`delivery ${deliveryNo} requires published routes`);
  if (row?.qa_status !== 'passed' || !row?.page_published_at) fail(`delivery ${deliveryNo} requires completed publication QA`);
}

const statusCounts = rows.reduce((counts, row) => {
  counts[row.programme_status] = (counts[row.programme_status] ?? 0) + 1;
  return counts;
}, {});
if ((statusCounts.published ?? 0) !== 20) fail('tracker must contain 20 published rows');
if ((statusCounts.profile_ready ?? 0) !== 8) fail('tracker must contain 8 profile_ready rows');
if ((statusCounts.source_tested ?? 0) !== 0) fail('tracker must contain 0 source_tested rows');
if ((statusCounts.note_reviewed ?? 0) !== 0) fail('tracker must contain 0 note_reviewed rows');
if ((statusCounts.page_qa ?? 0) !== 0) fail('tracker must contain 0 page_qa rows');
if ((statusCounts.not_started ?? 0) !== 70) fail('tracker must contain 70 not_started rows');

const requiredContractPhrases = [
  'All 98 countries and regions', 'English and Japanese', 'source_last_checked',
  'evidence_reviewed_at', 'tested_meeting_date', 'profile_last_reviewed',
  'page_published_at', 'A reviewed research note is not a published country page',
  'Archive and exclusion-leaning entries still require detail pages'
];
for (const phrase of requiredContractPhrases) {
  if (!contractText.includes(phrase)) fail(`completion contract is missing required phrase: ${phrase}`);
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}

console.log('COUNTRY_PAGE_PROGRAMME_VALID');
console.log('TRACKER_ROWS_VALID: 98');
console.log('GROUP_COUNTS_VALID: 27 + 29 + 16 + 13 + 6 + 4 + 3 = 98');
console.log('PROGRAMME_COUNTS: published=20 profile_ready=8 not_started=70');
