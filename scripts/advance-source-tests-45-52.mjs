import fs from 'node:fs';

const trackerFile = 'docs/country-pages/98-country-tracker.tsv';
const lines = fs.readFileSync(trackerFile, 'utf8').trimEnd().split(/\r?\n/);
const headers = lines[0].split('\t');
const index = Object.fromEntries(headers.map((name, position) => [name, position]));
const updates = {
  '45': ['remote_complete', 'Official Norway harness and gallop calendar source tests completed; reviewed note, profile, and routes remain.'],
  '46': ['remote_complete', 'Official Finland harness calendar source test completed; reviewed note, profile, and routes remain.'],
  '47': ['remote_complete', 'Official NDR calendar source test completed; reviewed note, profile, and routes remain.'],
  '48': ['remote_complete', 'Official Switzerland trot and gallop calendar source tests completed; reviewed note, profile, and routes remain.'],
  '49': ['remote_complete', 'Official PKWK national plan source test completed; reviewed note, profile, and routes remain.'],
  '50': ['remote_partial', 'Reviewed Ploiesti source test completed; wider Romania coverage remains incomplete.'],
  '51': ['remote_partial', 'Reviewed Belgrade source test completed; wider Serbia coverage remains incomplete.'],
  '52': ['remote_complete', 'Official Slovakia calendar source test completed; reviewed note, profile, and routes remain.']
};
const output = [lines[0]];
for (const line of lines.slice(1)) {
  const row = line.split('\t');
  const update = updates[row[index.delivery_no]];
  if (update) {
    row[index.programme_status] = 'source_tested';
    row[index.acquisition_status] = update[0];
    row[index.note_status] = 'not_started';
    row[index.note_ref] = '';
    row[index.profile_status] = 'not_started';
    row[index.en_route_status] = 'missing';
    row[index.ja_route_status] = 'missing';
    row[index.qa_status] = 'not_started';
    row[index.source_last_checked] = '2026-06-20';
    row[index.evidence_reviewed_at] = '';
    row[index.profile_last_reviewed] = '';
    row[index.page_published_at] = '';
    row[index.remarks] = update[1];
  }
  output.push(row.join('\t'));
}
fs.writeFileSync(trackerFile, `${output.join('\n')}\n`);

const replaceAll = (file, pairs) => {
  let text = fs.readFileSync(file, 'utf8');
  for (const [from, to] of pairs) {
    if (!text.includes(from)) throw new Error(`${file}: missing ${from}`);
    text = text.replace(from, to);
  }
  fs.writeFileSync(file, text);
};

replaceAll('scripts/check-country-page-programme.mjs', [
  ['published: 20, profile_ready: 24, source_tested: 0, note_reviewed: 0, page_qa: 0, not_started: 54', 'published: 20, profile_ready: 24, source_tested: 8, note_reviewed: 0, page_qa: 0, not_started: 46'],
  ['PROGRAMME_COUNTS: published=20 profile_ready=24 not_started=54', 'PROGRAMME_COUNTS: published=20 profile_ready=24 source_tested=8 not_started=46']
]);

replaceAll('docs/country-pages/programme-roadmap.md', [
  ['Latest confirmed merge: PR #306', 'Latest confirmed merge: PR #307'],
  ['Parallel working PR: #307', 'Third publication gate: PR #308 — Draft; entries 37-44; Cloudflare preview pending\nParallel working PR: #309'],
  ['Parallel working branch: country-profiles-37-44', 'Parallel working branch: country-source-tests-45-52'],
  ['Next PR after #307: #308', 'Next PR after #309: #310'],
  ['Current tracker counts on the PR #307 head:', 'Current tracker counts on the PR #309 head:'],
  ['source_tested:    0', 'source_tested:    8'],
  ['not_started:     54', 'not_started:     46'],
  ['PR #300 and PR #304 remain independent publication gates.', 'PR #300, PR #304, and PR #308 remain independent publication gates.'],
  ['| #305 | merged | Added source tests and conservative country ceilings for entries 37-44. |', '| #305 | merged | Added source tests and conservative country ceilings for entries 37-44. |\n| #306 | merged | Added reviewed country notes for entries 37-44. |\n| #307 | merged | Added Profile v2 records for entries 37-44. |\n| #308 | Draft gate | GitHub QA for entries 37-44 passed; rendered preview remains. |'],
  ['| #306 | merged | Add reviewed notes and advance all eight entries to `note_reviewed`. |', '| #306 | merged | Added reviewed notes and advanced all eight entries to `note_reviewed`. |'],
  ['| #307 | in progress | Add Profile v2 records and reach `profile_ready`. |', '| #307 | merged | Added Profile v2 records and advanced all eight entries to `profile_ready`. |'],
  ['| #308 | next | QA and publish sixteen routes after one final rendered preview. |', '| #308 | Draft gate | GitHub pre-preview QA passed; rendered preview remains. |'],
  ['## 9. Remaining wave schedule', '## 9. Wave 45-52\n\nEntries: Norway, Finland, Netherlands, Switzerland, Poland, Romania, Serbia, and Slovakia.\n\n| PR | Status | Work and completion condition |\n| ---: | --- | --- |\n| #309 | in progress | Add official source tests and advance all eight entries to `source_tested`. |\n| #310 | next | Add reviewed notes and advance all eight entries to `note_reviewed`. |\n| #311 | planned | Add Profile v2 records and reach `profile_ready`. |\n| #312 | planned | QA and publish sixteen routes after one final rendered preview. |\n\nAll eight initial country ceilings remain C. Detailed capability in Ploiesti, Belgrade, and Slovakia is not generalized beyond the reviewed scope.\n\n## 10. Remaining wave schedule'],
  ['## 10. Final release gate', '## 11. Final release gate'],
  ['## 11. Roadmap maintenance rules', '## 12. Roadmap maintenance rules']
]);

replaceAll('scripts/check-country-page-programme-roadmap.mjs', [
  ["'Parallel working PR: #307'", "'Third publication gate: PR #308',\n  'Parallel working PR: #309'"],
  ["'Next PR after #307: #308'", "'Next PR after #309: #310'"],
  ["'Latest confirmed merge: PR #306'", "'Latest confirmed merge: PR #307'"],
  ['profiles PR 307; next PR 308', 'publication gates 300, 304, and 308; source tests PR 309; next PR 310']
]);

console.log('SOURCE_TESTS_45_52_METADATA_UPDATED');
