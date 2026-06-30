import fs from 'node:fs';

const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => fs.readFileSync(file, 'utf8');
const expected = [
  ['85','ghana','country'],
  ['86','saint-kitts-and-nevis','special'],
  ['87','jordan','special'],
  ['88','iraq','special'],
  ['89','azerbaijan','special'],
  ['90','mongolia','special'],
  ['91','botswana','special'],
  ['92','costa-rica','explanatory']
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
  'docs/country-pages/98-country-publication-transitions-85-92.tsv'
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
    if (row.page_kind !== pageKind) fail(`${slug}: page kind mismatch ${row.page_kind} != ${pageKind}`);
  }
  const profile = JSON.parse(read(`data/static/country-profiles-v2-${deliveryNo}-${slug}.json`))[0];
  if (profile?.public_display_ceiling !== 'C') fail(`${slug}: public ceiling must remain C`);
  if (profile?.page_kind !== pageKind) fail(`${slug}: profile page kind mismatch`);
  if (profile?.status !== 'reviewed') fail(`${slug}: profile must remain reviewed`);
}

const counts = {};
for (const row of byDelivery.values()) counts[row.programme_status] = (counts[row.programme_status] || 0) + 1;
if (counts.published !== 92 || counts.not_started !== 6) fail(`programme counts mismatch ${JSON.stringify(counts)}`);

const evidence = JSON.parse(read('docs/runbooks/rendered-preview-85-92-evidence.json'));
if (evidence.work_id !== 'WHR-PUB-85-92' || evidence.preview_pr !== 349) fail('preview identity mismatch');
if (evidence.preview_head !== '58a04fc6646136facafa14843589c2ae2f8df805') fail('preview head mismatch');
if (evidence.rendered_run_id !== 28429885439 || evidence.rendered_job_id !== 84241726718 || evidence.artifact_id !== 7974585662) fail('rendered evidence IDs mismatch');
if (evidence.artifact_digest !== 'sha256:d6c5c8301fcf166d892a4b2506be5f5c29db59b463a025b0a996dbdff99b9850') fail('artifact digest mismatch');
if (evidence.result !== 'passed' || evidence.routes !== 16 || evidence.viewport_checks !== 32 || evidence.representative_screenshots !== 16 || evidence.errors !== 0) fail('rendered evidence is incomplete');
if (JSON.stringify(evidence.representatives) !== JSON.stringify(['ghana','saint-kitts-and-nevis','mongolia','costa-rica'])) fail('representative evidence mismatch');

if (errors.length) { errors.forEach((error) => console.error(`ERROR: ${error}`)); process.exit(1); }
console.log('COUNTRY_PAGE_PUBLICATION_85_92_VALID published=92 routes=184 errors=0');
