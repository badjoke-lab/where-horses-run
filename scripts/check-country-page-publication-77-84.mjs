import fs from 'node:fs';

const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => fs.readFileSync(file, 'utf8');
const expected = [['77','kazakhstan'],['78','egypt'],['79','algeria'],['80','iran'],['81','vietnam'],['82','bolivia'],['83','guatemala'],['84','honduras']];

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
  'docs/country-pages/98-country-publication-transitions-77-84.tsv'
]) {
  for (const change of parseTsv(file)) {
    const row = byDelivery.get(change.delivery_no);
    if (!row) { fail(`${file}: unknown delivery ${change.delivery_no}`); continue; }
    for (const [field, value] of Object.entries(change)) if (field !== 'delivery_no' && value !== '') row[field] = value;
  }
}

for (const [deliveryNo, slug] of expected) {
  const row = byDelivery.get(deliveryNo);
  if (!row || row.slug !== slug) fail(`tracker mismatch for ${deliveryNo}-${slug}`);
  else {
    if (row.programme_status !== 'published') fail(`${slug}: published state required`);
    if (row.en_route_status !== 'published' || row.ja_route_status !== 'published') fail(`${slug}: routes must be published`);
    if (row.qa_status !== 'passed' || row.page_published_at !== '2026-06-30') fail(`${slug}: publication gate incomplete`);
  }
  const profile = JSON.parse(read(`data/static/country-profiles-v2-${deliveryNo}-${slug}.json`))[0];
  if (profile?.public_display_ceiling !== 'C') fail(`${slug}: public ceiling must remain C`);
}

const counts = {};
for (const row of byDelivery.values()) counts[row.programme_status] = (counts[row.programme_status] || 0) + 1;
if (counts.published !== 84 || counts.not_started !== 14) fail(`programme counts mismatch ${JSON.stringify(counts)}`);

const evidence = JSON.parse(read('docs/runbooks/rendered-preview-77-84-evidence.json'));
if (evidence.result !== 'passed' || evidence.routes !== 16 || evidence.viewport_checks !== 32 || evidence.representative_screenshots !== 16 || evidence.errors !== 0) fail('rendered evidence is incomplete');

if (errors.length) { errors.forEach((error) => console.error(`ERROR: ${error}`)); process.exit(1); }
console.log('COUNTRY_PAGE_PUBLICATION_77_84_VALID published=84 routes=168 errors=0');
