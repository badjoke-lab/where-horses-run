import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const parse = (file) => JSON.parse(read(file));
const errors = [];
const expected = [
  ['93','nicaragua','Nicaragua','explanatory'],
  ['94','el-salvador','El Salvador','explanatory'],
  ['95','tanzania','Tanzania','explanatory'],
  ['96','singapore','Singapore','archive'],
  ['97','macau','Macau','archive'],
  ['98','greece','Greece','archive']
];
const sections = ['## Metadata','## Evidence labels','## Page-ready verified facts','## Racing structure','## Governing and organising body','## Racecourses observed','## Programme format','## Limitations and cautions','## Claims not yet safe for publication','## Fresh research required','## Source-test references','## Editorial handoff'];
const fail = (message) => errors.push(message);

function parseTsv(file) {
  const lines = read(file).trimEnd().split(/\r?\n/);
  const headers = lines.shift().split('\t');
  return lines.filter(Boolean).map((line) => Object.fromEntries(headers.map((header, index) => [header, line.split('\t')[index] || ''])));
}

const tracker = new Map(parseTsv('docs/country-pages/98-country-tracker.tsv').map((row) => [row.delivery_no, row]));
const overlays = [
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
  'docs/country-pages/98-country-note-transitions-93-98.tsv'
];
for (const file of overlays) for (const change of parseTsv(file)) {
  const row = tracker.get(change.delivery_no);
  if (!row) { fail(`${file}: unknown delivery ${change.delivery_no}`); continue; }
  for (const [key, value] of Object.entries(change)) if (key !== 'delivery_no' && value) row[key] = value;
}

for (const [deliveryNo, slug, country, pageKind] of expected) {
  const noteRef = `docs/country-page-notes/${deliveryNo}-${slug}.md`;
  const sourceRef = `docs/timetable-source-tests/${deliveryNo}-${slug}/source-test-v2.json`;
  if (!fs.existsSync(noteRef)) { fail(`missing ${noteRef}`); continue; }
  const note = read(noteRef);
  if (!note.startsWith(`# ${country}\n`)) fail(`${slug}: title mismatch`);
  for (const marker of sections) if (!note.includes(marker)) fail(`${slug}: missing ${marker}`);
  for (const marker of ['| Note status | reviewed |','| Evidence cutoff | 2026-06-30 |','| Technical rank | C |','| Public display ceiling | C |','| Calendar readiness | blocked |',`| Page kind | ${pageKind} |`,'[VERIFIED]','[NEEDS_RESEARCH]',sourceRef]) if (!note.includes(marker)) fail(`${slug}: missing ${marker}`);
  const source = parse(sourceRef);
  if (source.delivery_no !== deliveryNo || source.country_id !== slug || source.public_safe !== true || source.records?.length !== 1 || source.records[0].readiness !== 'blocked' || source.records[0].public_ceiling !== 'C') fail(`${slug}: Source Test boundary mismatch`);
  const row = tracker.get(deliveryNo);
  if (!row || row.slug !== slug || row.page_kind !== pageKind || row.programme_status !== 'note_reviewed' || row.note_status !== 'reviewed' || row.note_ref !== noteRef || row.evidence_reviewed_at !== '2026-06-30') fail(`${slug}: tracker mismatch`);
  if (row && (row.profile_status !== 'not_started' || row.en_route_status !== 'missing' || row.ja_route_status !== 'missing' || row.qa_status !== 'not_started' || row.page_published_at)) fail(`${slug}: later state advanced early`);
}

const counts = {};
for (const row of tracker.values()) counts[row.programme_status] = (counts[row.programme_status] || 0) + 1;
if (counts.published !== 92 || counts.note_reviewed !== 6) fail(`programme counts mismatch ${JSON.stringify(counts)}`);
if (errors.length) { errors.forEach((error) => console.error(`ERROR: ${error}`)); process.exit(1); }
console.log('COUNTRY_NOTES_93_98_VALID reviewed=6 public_ceiling_C=6 blocked=6');
console.log('PROGRAMME_COUNTS published=92 note_reviewed=6');
