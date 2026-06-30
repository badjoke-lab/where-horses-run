import fs from 'node:fs';

const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => fs.readFileSync(file, 'utf8');
const expected = [
  ['93','nicaragua','explanatory'],
  ['94','el-salvador','explanatory'],
  ['95','tanzania','explanatory'],
  ['96','singapore','archive'],
  ['97','macau','archive'],
  ['98','greece','archive']
];

function parseTsv(file) {
  const lines = read(file).trimEnd().split(/\r?\n/);
  const headers = lines.shift().split('\t');
  return lines.filter(Boolean).map((line) => Object.fromEntries(headers.map((header, index) => [header, line.split('\t')[index] ?? ''])));
}

const rows = parseTsv('docs/country-pages/98-country-tracker.tsv');
const byDelivery = new Map(rows.map((row) => [row.delivery_no, row]));
for (const file of [
  'docs/country-pages/98-country-tracker-transitions.tsv',
  'docs/country-pages/98-country-source-test-transitions-77-84.tsv',
  'docs/country-pages/98-country-note-transitions-77-84.tsv',
  'docs/country-pages/98-country-profile-transitions-77-84.tsv',
  'docs/country-pages/98-country-publication-transitions-77-84.tsv',
  'docs/country-pages/98-country-source-test-transitions-85-92.tsv',
  'docs/country-pages/98-country-note-transitions-85-92.tsv',
  'docs/country-pages/98-country-profile-transitions-85-92.tsv',
  'docs/country-pages/98-country-publication-transitions-85-92.tsv',
  'docs/country-pages/98-country-source-test-transitions-93-98.tsv',
  'docs/country-pages/98-country-note-transitions-93-98.tsv',
  'docs/country-pages/98-country-profile-transitions-93-98.tsv',
  'docs/country-pages/98-country-publication-transitions-93-98.tsv'
]) {
  for (const change of parseTsv(file)) {
    const row = byDelivery.get(change.delivery_no);
    if (!row) { fail(`${file}: unknown delivery ${change.delivery_no}`); continue; }
    for (const [field, value] of Object.entries(change)) if (field !== 'delivery_no' && value !== '') row[field] = value;
  }
}

for (const [deliveryNo, slug, pageKind] of expected) {
  const row = byDelivery.get(deliveryNo);
  if (!row || row.slug !== slug) fail(`tracker mismatch for ${deliveryNo}-${slug}`);
  else {
    if (row.programme_status !== 'published') fail(`${slug}: published state required`);
    if (row.note_status !== 'reviewed' || row.profile_status !== 'reviewed') fail(`${slug}: reviewed note and profile required`);
    if (row.en_route_status !== 'published' || row.ja_route_status !== 'published') fail(`${slug}: routes must be published`);
    if (row.qa_status !== 'passed' || row.page_published_at !== '2026-06-30') fail(`${slug}: publication gate incomplete`);
    if (row.page_kind !== pageKind) fail(`${slug}: page kind mismatch`);
  }
  const profile = JSON.parse(read(`data/static/country-profiles-v2-${deliveryNo}-${slug}.json`))[0];
  if (profile?.public_display_ceiling !== 'C' || profile?.page_kind !== pageKind || profile?.status !== 'reviewed') fail(`${slug}: profile publication boundary mismatch`);
  if (!profile?.schedule?.time_patterns?.includes('official-link-only')) fail(`${slug}: schedule must remain official-link-only`);
}

const counts = {};
for (const row of byDelivery.values()) counts[row.programme_status] = (counts[row.programme_status] || 0) + 1;
if (counts.published !== 98) fail(`programme counts mismatch ${JSON.stringify(counts)}`);

const evidence = JSON.parse(read('docs/runbooks/rendered-preview-93-98-evidence.json'));
if (evidence.work_id !== 'WHR-PUB-93-98' || evidence.preview_pr !== 355) fail('preview identity mismatch');
if (evidence.preview_head !== '11b6345c1c67ed0dc36330acc8a47cfc01a4ea87') fail('preview head mismatch');
if (evidence.rendered_run_id !== 28433824015 || evidence.rendered_job_id !== 84254759575 || evidence.artifact_id !== 7976225757) fail('rendered evidence IDs mismatch');
if (evidence.artifact_digest !== 'sha256:acc3568b7cbfb6e678ee0c1e0afa16d732b031f4a44b7cc2f5a3f3abd49b7827') fail('artifact digest mismatch');
if (evidence.result !== 'passed' || evidence.routes !== 12 || evidence.viewport_checks !== 24 || evidence.representative_screenshots !== 12 || evidence.errors !== 0) fail('rendered evidence is incomplete');
if (JSON.stringify(evidence.representatives) !== JSON.stringify(['nicaragua','singapore','greece'])) fail('representative evidence mismatch');

if (errors.length) { errors.forEach((error) => console.error(`ERROR: ${error}`)); process.exit(1); }
console.log('COUNTRY_PAGE_PUBLICATION_93_98_VALID published=98 routes=196 errors=0');
