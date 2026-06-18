import fs from 'node:fs';

const replaceOnce = (text, before, after, label) => {
  const count = text.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one match, found ${count}`);
  return text.replace(before, after);
};

{
  const file = 'docs/country-pages/98-country-tracker.tsv';
  const lines = fs.readFileSync(file, 'utf8').trimEnd().split(/\r?\n/);
  const headers = lines[0].split('\t');
  const targets = new Set(['13','14','15','16','17','18','19','20']);
  const output = lines.slice(1).map((line) => {
    const values = line.split('\t');
    while (values.length < headers.length) values.push('');
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
    if (targets.has(row.delivery_no)) {
      row.programme_status = 'profile_ready';
      row.profile_status = 'reviewed';
      row.en_route_status = 'complete';
      row.ja_route_status = 'complete';
      row.qa_status = 'not_started';
      row.profile_last_reviewed = '2026-06-18';
      row.page_published_at = '';
      row.remarks = 'Reviewed profile-v2 and bilingual routes ready; formal publication QA remains.';
    }
    return headers.map((header) => row[header] ?? '').join('\t');
  });
  fs.writeFileSync(file, `${lines[0]}\n${output.join('\n')}\n`);
}

{
  const file = 'scripts/check-country-page-programme.mjs';
  let text = fs.readFileSync(file, 'utf8');
  text = replaceOnce(text,
    "for (const slug of ['japan', 'hong-kong']) {\n  const row = rows.find((entry) => entry.slug === slug);\n  if (!row || row.programme_status !== 'profile_ready') fail(`${slug} must remain profile_ready pending separate publication QA`);\n  if (row?.note_status !== 'reviewed' || !row?.note_ref || !row?.evidence_reviewed_at) fail(`${slug} requires reviewed note metadata`);\n}\nfor (const deliveryNo of ['15', '16', '17', '18', '19', '20']) {\n  const row = rows.find((entry) => entry.delivery_no === deliveryNo);\n  if (!row || row.programme_status !== 'note_reviewed') fail(`delivery ${deliveryNo} must be note_reviewed`);\n  if (row?.note_status !== 'reviewed' || !row?.note_ref || !row?.evidence_reviewed_at) fail(`delivery ${deliveryNo} requires reviewed note metadata`);\n}",
    "for (const deliveryNo of ['13', '14', '15', '16', '17', '18', '19', '20']) {\n  const row = rows.find((entry) => entry.delivery_no === deliveryNo);\n  if (!row || row.programme_status !== 'profile_ready') fail(`delivery ${deliveryNo} must be profile_ready`);\n  if (row?.note_status !== 'reviewed' || !row?.note_ref || !row?.evidence_reviewed_at) fail(`delivery ${deliveryNo} requires reviewed note metadata`);\n  if (row?.profile_status !== 'reviewed' || !row?.profile_last_reviewed) fail(`delivery ${deliveryNo} requires reviewed profile metadata`);\n  if (row?.en_route_status !== 'complete' || row?.ja_route_status !== 'complete') fail(`delivery ${deliveryNo} requires complete bilingual routes`);\n}",
    'programme batch state'
  );
  text = replaceOnce(text,
    "if ((statusCounts.profile_ready ?? 0) !== 2) fail('tracker must contain 2 profile_ready rows');\nif ((statusCounts.source_tested ?? 0) !== 0) fail('tracker must contain 0 source_tested rows');\nif ((statusCounts.note_reviewed ?? 0) !== 6) fail('tracker must contain 6 note_reviewed rows');",
    "if ((statusCounts.profile_ready ?? 0) !== 8) fail('tracker must contain 8 profile_ready rows');\nif ((statusCounts.source_tested ?? 0) !== 0) fail('tracker must contain 0 source_tested rows');\nif ((statusCounts.note_reviewed ?? 0) !== 0) fail('tracker must contain 0 note_reviewed rows');",
    'programme counts'
  );
  text = replaceOnce(text,
    "console.log('PROGRAMME_COUNTS: published=12 profile_ready=2 note_reviewed=6 not_started=78');",
    "console.log('PROGRAMME_COUNTS: published=12 profile_ready=8 not_started=78');",
    'programme output'
  );
  fs.writeFileSync(file, text);
}

{
  const file = 'scripts/check-country-page-publication-01-12.mjs';
  let text = fs.readFileSync(file, 'utf8');
  text = replaceOnce(text,
    "if (profileReadyCount !== 2) fail(`expected 2 profile_ready legacy rows; found ${profileReadyCount}`);\nif (noteReviewedCount !== 6) fail(`expected 6 note_reviewed rows; found ${noteReviewedCount}`);",
    "if (profileReadyCount !== 8) fail(`expected 8 profile_ready rows; found ${profileReadyCount}`);\nif (noteReviewedCount !== 0) fail(`expected 0 note_reviewed rows; found ${noteReviewedCount}`);",
    'publication counts'
  );
  text = replaceOnce(text,
    "console.log('TRACKER_COUNTS: published=12 profile_ready=2 note_reviewed=6 not_started=78');",
    "console.log('TRACKER_COUNTS: published=12 profile_ready=8 not_started=78');",
    'publication output'
  );
  fs.writeFileSync(file, text);
}

{
  const file = 'scripts/check-country-source-tests-13-20.mjs';
  let text = fs.readFileSync(file, 'utf8');
  for (const deliveryNo of ['15','16','17','18','19','20']) {
    text = text.replace(`'${deliveryNo}': ['note_reviewed',`, `'${deliveryNo}': ['profile_ready',`);
  }
  text = text.replace("console.log('TRACKER: Japan/Hong Kong profile_ready; entries 15-20 note_reviewed');", "console.log('TRACKER: entries 13-20 profile_ready');");
  fs.writeFileSync(file, text);
}

{
  const file = 'docs/country-pages/programme-roadmap.md';
  let text = fs.readFileSync(file, 'utf8');
  text = replaceOnce(text, 'Merged through: PR #294', 'Merged through: PR #295', 'roadmap merged-through');
  text = replaceOnce(text, 'Latest confirmed merge: 1874c58bd1add52d8cdeebc4137728983402b4df', 'Latest confirmed merge: PR #295', 'roadmap merge reference');
  text = replaceOnce(text, 'Working PR: #295', 'Working PR: #296', 'roadmap working PR');
  text = replaceOnce(text, 'Working branch: country-profiles-13-20', 'Working branch: country-pages-13-20-publication-qa', 'roadmap working branch');
  text = replaceOnce(text, 'Next PR: #296', 'Next PR: #297', 'roadmap next PR');
  text = replaceOnce(text, 'profile_ready:    2', 'profile_ready:    8', 'roadmap profile count');
  text = replaceOnce(text, 'note_reviewed:    6', 'note_reviewed:    0', 'roadmap note count');
  text = replaceOnce(text, 'merged:        #284-#294 = 11 PRs', 'merged:        #284-#295 = 12 PRs', 'roadmap merged count');
  text = replaceOnce(text, 'in progress:   #295', 'in progress:   #296', 'roadmap in-progress PR');
  text = replaceOnce(text, 'remaining after #295: #296-#337', 'remaining after #296: #297-#337', 'roadmap remaining range');
  text = replaceOnce(text,
    '| #295 | in progress | Migrate Japan and Hong Kong from legacy seed profiles to profile v2. Add profile v2 for New Zealand, South Africa, Uruguay, Sweden, Denmark, and the Czech Republic. Add required country and source registry records, runtime integration, tracker transitions, and validators. Completion condition: all eight entries are `profile_ready`, legacy fallback is no longer used for Japan or Hong Kong, and all CI is green. |\n| #296 | planned next | Run bilingual route and publication QA for entries 13-20. Verify canonical, hreflang, language switch, racecourse and source links, responsive layout, accessibility, public ceilings, and empty states. Completion condition: eight entries and sixteen routes are `published`. |',
    '| #295 | merged | Migrated Japan and Hong Kong from legacy seed profiles to profile v2. Added profile v2 and source-led registry records for New Zealand, South Africa, Uruguay, Sweden, Denmark, and the Czech Republic. All eight entries are `profile_ready`, and the runtime is v2-only. |\n| #296 | in progress | Run bilingual route and publication QA for entries 13-20. Verify canonical, hreflang, language switch, racecourse and source links, responsive layout, accessibility, public ceilings, and empty states. Completion condition: eight entries and sixteen routes are `published`. |',
    'roadmap wave status'
  );
  fs.writeFileSync(file, text);
}

{
  const file = 'scripts/check-country-page-programme-roadmap.mjs';
  let text = fs.readFileSync(file, 'utf8');
  text = replaceOnce(text, "'Working PR: #295',", "'Working PR: #296',", 'roadmap validator working PR');
  text = replaceOnce(text, "'Next PR: #296',", "'Next PR: #297',", 'roadmap validator next PR');
  text = replaceOnce(text, "'Final release gate: #337',", "'Merged through: PR #295',\n  'Final release gate: #337',", 'roadmap validator merged-through');
  fs.writeFileSync(file, text);
}

console.log('PR_295_STATE_SYNC_COMPLETE');
