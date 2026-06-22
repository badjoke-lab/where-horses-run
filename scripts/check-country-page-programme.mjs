import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const trackerPath = path.join(root, 'docs/country-pages/98-country-tracker.tsv');
const contractPath = path.join(root, 'docs/country-pages/completion-contract.md');
const errors = [];
const fail = (message) => errors.push(message);

const lines = fs.readFileSync(trackerPath, 'utf8').replace(/\r\n/g, '\n').trimEnd().split('\n');
const headers = lines[0].split('\t');
const expectedHeaders = [
  'delivery_no', 'scope_group', 'scope_group_no', 'name_en', 'name_ja', 'slug',
  'page_kind', 'programme_status', 'acquisition_status', 'note_status', 'note_ref',
  'profile_status', 'en_route_status', 'ja_route_status', 'qa_status',
  'source_last_checked', 'evidence_reviewed_at', 'profile_last_reviewed',
  'page_published_at', 'remarks'
];
if (JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) fail(`unexpected tracker headers: ${headers.join(', ')}`);

const rows = lines.slice(1).map((line, index) => {
  const values = line.split('\t');
  if (values.length !== headers.length) {
    fail(`tracker row ${index + 2} has ${values.length} columns; expected ${headers.length}`);
    return null;
  }
  return Object.fromEntries(headers.map((header, column) => [header, values[column]]));
}).filter(Boolean);
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
const allowed = {
  programme_status: new Set(['not_started', 'source_research', 'source_tested', 'note_reviewed', 'profile_ready', 'page_qa', 'published']),
  acquisition_status: new Set(['not_started', 'remote_complete', 'remote_partial', 'local_required', 'local_complete', 'pending_unreachable', 'not_applicable']),
  note_status: new Set(['not_started', 'draft', 'reviewed']),
  profile_status: new Set(['not_started', 'draft', 'reviewed_seed', 'reviewed']),
  route_status: new Set(['missing', 'generated_seed', 'draft', 'complete', 'published']),
  qa_status: new Set(['not_started', 'pending', 'passed']),
  page_kind: new Set(['country', 'special', 'explanatory', 'archive'])
};
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const today = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
const seenSlugs = new Set();

for (const [index, row] of rows.entries()) {
  const rowNumber = index + 2;
  const expectedDelivery = String(index + 1).padStart(2, '0');
  if (row.delivery_no !== expectedDelivery) fail(`row ${rowNumber} delivery_no must be ${expectedDelivery}`);
  if (!slugPattern.test(row.slug) || seenSlugs.has(row.slug)) fail(`invalid or duplicate slug at row ${rowNumber}: ${row.slug}`);
  seenSlugs.add(row.slug);
  if (!expectedGroupCounts[row.scope_group]) fail(`unknown scope_group for ${row.slug}: ${row.scope_group}`);
  if (!allowed.page_kind.has(row.page_kind)) fail(`invalid page_kind for ${row.slug}`);
  if (!allowed.programme_status.has(row.programme_status)) fail(`invalid programme_status for ${row.slug}`);
  if (!allowed.acquisition_status.has(row.acquisition_status)) fail(`invalid acquisition_status for ${row.slug}`);
  if (!allowed.note_status.has(row.note_status)) fail(`invalid note_status for ${row.slug}`);
  if (!allowed.profile_status.has(row.profile_status)) fail(`invalid profile_status for ${row.slug}`);
  if (!allowed.route_status.has(row.en_route_status) || !allowed.route_status.has(row.ja_route_status)) fail(`invalid route status for ${row.slug}`);
  if (!allowed.qa_status.has(row.qa_status)) fail(`invalid qa_status for ${row.slug}`);
  if (!row.name_en || !row.name_ja) fail(`missing bilingual name for ${row.slug}`);

  if (row.note_status === 'reviewed') {
    if (!row.note_ref || !fs.existsSync(path.join(root, row.note_ref))) fail(`reviewed note is missing for ${row.slug}`);
  }
  for (const field of ['source_last_checked', 'evidence_reviewed_at', 'profile_last_reviewed', 'page_published_at']) {
    const value = row[field];
    if (!value) continue;
    if (!datePattern.test(value) || value > today) fail(`invalid ${field} for ${row.slug}: ${value}`);
  }
  if (row.programme_status === 'published') {
    if (row.en_route_status !== 'published' || row.ja_route_status !== 'published') fail(`published routes required for ${row.slug}`);
    if (row.qa_status !== 'passed' || !row.page_published_at) fail(`completed publication QA required for ${row.slug}`);
    if (!['reviewed', 'reviewed_seed'].includes(row.profile_status)) fail(`reviewed profile required for ${row.slug}`);
  } else if (row.page_published_at) {
    fail(`non-published row must not set page_published_at for ${row.slug}`);
  }
  if (row.scope_group === 'archive' && row.page_kind !== 'archive') fail(`archive scope must use archive page_kind: ${row.slug}`);
  if (row.scope_group === 'under_review_special' && row.page_kind !== 'special') fail(`special scope must use special page_kind: ${row.slug}`);
  if (row.scope_group === 'exclusion_leaning' && row.page_kind !== 'explanatory') fail(`exclusion scope must use explanatory page_kind: ${row.slug}`);
}

for (const [group, expected] of Object.entries(expectedGroupCounts)) {
  const groupRows = rows.filter((row) => row.scope_group === group);
  if (groupRows.length !== expected) fail(`${group} must contain ${expected} rows; found ${groupRows.length}`);
  const numbers = groupRows.map((row) => Number(row.scope_group_no)).sort((a, b) => a - b);
  const expectedNumbers = Array.from({ length: expected }, (_, index) => index + 1);
  if (JSON.stringify(numbers) !== JSON.stringify(expectedNumbers)) fail(`${group} scope_group_no values must be exactly 1-${expected}`);
}

const publishedSlugs = [
  'united-arab-emirates', 'south-korea', 'turkey', 'morocco', 'chile', 'peru', 'mexico', 'brazil',
  'bahrain', 'qatar', 'oman', 'zimbabwe', 'japan', 'hong-kong', 'new-zealand', 'south-africa',
  'uruguay', 'sweden', 'denmark', 'czech-republic', 'hungary', 'malta', 'austria', 'puerto-rico',
  'jamaica', 'trinidad-and-tobago', 'barbados', 'martinique'
];
const profileFiles = fs.readdirSync(path.join(root, 'data/static')).filter((name) => /^country-profiles-v2(?:-.*)?\.json$/.test(name));
const profileIds = new Set(profileFiles.flatMap((name) => JSON.parse(fs.readFileSync(path.join(root, 'data/static', name), 'utf8'))).map((profile) => profile.country_id));
for (const slug of publishedSlugs) {
  const row = rows.find((entry) => entry.slug === slug);
  if (!row || row.programme_status !== 'published' || !profileIds.has(slug)) fail(`published profile contract failed for ${slug}`);
}

const counts = rows.reduce((result, row) => {
  result[row.programme_status] = (result[row.programme_status] ?? 0) + 1;
  return result;
}, {});
for (const [status, expected] of Object.entries({ published: 28, profile_ready: 16, source_tested: 0, note_reviewed: 8, page_qa: 0, not_started: 46 })) {
  if ((counts[status] ?? 0) !== expected) fail(`tracker must contain ${expected} ${status} rows; found ${counts[status] ?? 0}`);
}

const contractText = fs.readFileSync(contractPath, 'utf8');
for (const phrase of ['All 98 countries and regions', 'English and Japanese', 'source_last_checked', 'evidence_reviewed_at', 'page_published_at']) {
  if (!contractText.includes(phrase)) fail(`completion contract is missing required phrase: ${phrase}`);
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}
console.log('COUNTRY_PAGE_PROGRAMME_VALID');
console.log('TRACKER_ROWS_VALID: 98');
console.log('PROGRAMME_COUNTS: published=28 profile_ready=16 note_reviewed=8 not_started=46');
