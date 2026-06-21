import fs from 'node:fs';

const tracker = 'docs/country-pages/98-country-tracker.tsv';
const lines = fs.readFileSync(tracker, 'utf8').trimEnd().split(/\r?\n/);
const headers = lines[0].split('\t');
const index = Object.fromEntries(headers.map((name, position) => [name, position]));
const notes = {
  '45': 'norway', '46': 'finland', '47': 'netherlands', '48': 'switzerland',
  '49': 'poland', '50': 'romania', '51': 'serbia', '52': 'slovakia'
};
const output = [lines[0]];
for (const line of lines.slice(1)) {
  const row = line.split('\t');
  const slug = notes[row[index.delivery_no]];
  if (slug) {
    row[index.programme_status] = 'note_reviewed';
    row[index.note_status] = 'reviewed';
    row[index.note_ref] = `docs/country-page-notes/${row[index.delivery_no]}-${slug}.md`;
    row[index.evidence_reviewed_at] = '2026-06-20';
    row[index.profile_status] = 'not_started';
    row[index.en_route_status] = 'missing';
    row[index.ja_route_status] = 'missing';
    row[index.qa_status] = 'not_started';
    row[index.profile_last_reviewed] = '';
    row[index.page_published_at] = '';
    row[index.remarks] = 'Reviewed country note completed; Profile v2 and bilingual routes remain.';
  }
  output.push(row.join('\t'));
}
fs.writeFileSync(tracker, `${output.join('\n')}\n`);

const patch = (file, pairs) => {
  let text = fs.readFileSync(file, 'utf8');
  for (const [from, to] of pairs) {
    if (!text.includes(from)) throw new Error(`${file}: missing ${from}`);
    text = text.replace(from, to);
  }
  fs.writeFileSync(file, text);
};

patch('scripts/check-country-page-programme.mjs', [
  ['published: 20, profile_ready: 24, source_tested: 8, note_reviewed: 0, page_qa: 0, not_started: 46', 'published: 20, profile_ready: 24, source_tested: 0, note_reviewed: 8, page_qa: 0, not_started: 46'],
  ['PROGRAMME_COUNTS: published=20 profile_ready=24 source_tested=8 not_started=46', 'PROGRAMME_COUNTS: published=20 profile_ready=24 note_reviewed=8 not_started=46']
]);

patch('docs/country-pages/programme-roadmap.md', [
  ['Latest confirmed merge: PR #307', 'Latest confirmed merge: PR #309'],
  ['Parallel working PR: #309', 'Parallel working PR: #310'],
  ['Parallel working branch: country-source-tests-45-52', 'Parallel working branch: country-notes-45-52'],
  ['Next PR after #309: #310', 'Next PR after #310: #311'],
  ['Current tracker counts on the PR #309 head:', 'Current tracker counts on the PR #310 head:'],
  ['note_reviewed:    0', 'note_reviewed:    8'],
  ['source_tested:    8', 'source_tested:    0'],
  ['| #308 | Draft gate | GitHub QA for entries 37-44 passed; rendered preview remains. |', '| #308 | Draft gate | GitHub QA for entries 37-44 passed; rendered preview remains. |\n| #309 | merged | Added official source tests for entries 45-52. |'],
  ['| #309 | in progress | Add official source tests and advance all eight entries to `source_tested`. |', '| #309 | merged | Added official source tests and advanced all eight entries to `source_tested`. |'],
  ['| #310 | next | Add reviewed notes and advance all eight entries to `note_reviewed`. |', '| #310 | in progress | Add reviewed notes and advance all eight entries to `note_reviewed`. |'],
  ['| #311 | planned | Add Profile v2 records and reach `profile_ready`. |', '| #311 | next | Add Profile v2 records and reach `profile_ready`. |'],
  ['All eight initial country ceilings remain C.', 'All eight reviewed country ceilings remain C.']
]);

patch('scripts/check-country-page-programme-roadmap.mjs', [
  ["'Parallel working PR: #309'", "'Parallel working PR: #310'"],
  ["'Next PR after #309: #310'", "'Next PR after #310: #311'"],
  ["'Latest confirmed merge: PR #307'", "'Latest confirmed merge: PR #309'"],
  ['source tests PR 309; next PR 310', 'reviewed notes PR 310; next PR 311']
]);

console.log('NOTES_45_52_METADATA_UPDATED');
