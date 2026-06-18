import fs from 'node:fs';

const replaceState = (text, before, after) => {
  if (text.includes(after)) return text;
  if (text.includes(before)) return text.replace(before, after);
  throw new Error(`state marker missing: ${before}`);
};

{
  const file = 'docs/country-pages/98-country-tracker.tsv';
  const lines = fs.readFileSync(file, 'utf8').trimEnd().split(/\r?\n/);
  const headers = lines[0].split('\t');
  const acquisition = {
    '21': 'remote_complete',
    '22': 'remote_complete',
    '23': 'remote_partial',
    '24': 'remote_complete',
    '25': 'remote_complete',
    '26': 'remote_complete',
    '27': 'remote_complete',
    '28': 'remote_partial'
  };
  const rows = lines.slice(1).map((line) => {
    const values = line.split('\t');
    while (values.length < headers.length) values.push('');
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
    if (acquisition[row.delivery_no]) {
      row.programme_status = 'source_tested';
      row.acquisition_status = acquisition[row.delivery_no];
      row.source_last_checked = '2026-06-18';
      row.remarks = 'Official source test completed; reviewed note, profile, routes, and publication QA remain.';
    }
    return headers.map((header) => row[header] ?? '').join('\t');
  });
  fs.writeFileSync(file, `${lines[0]}\n${rows.join('\n')}\n`);
}

{
  const file = 'scripts/check-country-page-programme.mjs';
  let text = fs.readFileSync(file, 'utf8');
  text = replaceState(text,
    "if ((statusCounts.source_tested ?? 0) !== 0) fail('tracker must contain 0 source_tested rows');",
    "if ((statusCounts.source_tested ?? 0) !== 8) fail('tracker must contain 8 source_tested rows');"
  );
  text = replaceState(text,
    "if ((statusCounts.not_started ?? 0) !== 78) fail('tracker must contain 78 not_started rows');",
    "if ((statusCounts.not_started ?? 0) !== 70) fail('tracker must contain 70 not_started rows');"
  );
  text = replaceState(text,
    "console.log('PROGRAMME_COUNTS: published=20 not_started=78');",
    "console.log('PROGRAMME_COUNTS: published=20 source_tested=8 not_started=70');"
  );
  fs.writeFileSync(file, text);
}

{
  const file = 'docs/country-pages/programme-roadmap.md';
  let text = fs.readFileSync(file, 'utf8');
  const updates = [
    ['Merged through: PR #296', 'Merged through: PR #297'],
    ['Latest confirmed merge: PR #296', 'Latest confirmed merge: PR #297'],
    ['Working PR: #297', 'Working PR: #298'],
    ['Working branch: country-source-tests-21-28', 'Working branch: country-notes-21-28'],
    ['Next PR: #298', 'Next PR: #299'],
    ['note_reviewed:    0\nnot_started:     78', 'note_reviewed:    0\nsource_tested:    8\nnot_started:     70'],
    ['merged:        #284-#296 = 13 PRs', 'merged:        #284-#297 = 14 PRs'],
    ['in progress:   #297', 'in progress:   #298'],
    ['remaining after #297: #298-#337', 'remaining after #298: #299-#337'],
    ['| #297 | Source tests for entries 21-28. Record official routes, source roles, capability rank, public ceiling, review date, and local requirements. |', '| #297 | Completed public-safe source tests for entries 21-28, including official routes, capability ranks, public ceilings, review dates, and remote acquisition decisions. |']
  ];
  for (const [before, after] of updates) text = replaceState(text, before, after);
  fs.writeFileSync(file, text);
}

{
  const file = 'scripts/check-country-page-programme-roadmap.mjs';
  let text = fs.readFileSync(file, 'utf8');
  text = replaceState(text, "'Working PR: #297'", "'Working PR: #298'");
  text = replaceState(text, "'Next PR: #298'", "'Next PR: #299'");
  text = replaceState(text, "'Merged through: PR #296'", "'Merged through: PR #297'");
  fs.writeFileSync(file, text);
}

const relaxGlobalCounts = (file) => {
  let text = fs.readFileSync(file, 'utf8');
  text = text.replace(
    /const counts = rows\.reduce\(\(result, row\) => \{[\s\S]*?if \(\(counts\.not_started \?\? 0\) !== \d+\) fail\([^\n]+\);\n/,
    "if (rows.length !== 98) fail(`tracker must contain 98 rows; found ${rows.length}`);\n"
  );
  text = text.replace(/console\.log\('TRACKER_COUNTS:[^\n]+\);\n?/g, '');
  fs.writeFileSync(file, text);
};

for (const file of [
  'scripts/check-country-notes-13-20.mjs',
  'scripts/check-country-profiles-13-20.mjs',
  'scripts/check-country-page-publication-13-20.mjs'
]) relaxGlobalCounts(file);

{
  const file = 'scripts/check-country-page-publication-01-12.mjs';
  let text = fs.readFileSync(file, 'utf8');
  text = text.replace(
    /const publishedCount = rows\.filter[\s\S]*?if \(notStartedCount !== \d+\) fail\([^\n]+\);\n/,
    "if (rows.length !== 98) fail(`tracker must contain 98 rows; found ${rows.length}`);\n"
  );
  text = text.replace(/console\.log\('TRACKER_COUNTS:[^\n]+\);\n?/g, '');
  fs.writeFileSync(file, text);
}

{
  const file = 'scripts/check-country-source-tests-21-28.mjs';
  let text = fs.readFileSync(file, 'utf8');
  text = text.replace(
    "if (row.programme_status !== 'source_tested') fail(`${slug} programme_status must be source_tested`);",
    "const stageOrder = ['not_started', 'source_research', 'source_tested', 'note_reviewed', 'profile_ready', 'page_qa', 'published'];\n  if (stageOrder.indexOf(row.programme_status) < stageOrder.indexOf('source_tested')) fail(`${slug} must be at least source_tested`);"
  );
  text = text.replace(
    /const counts = rows\.reduce\(\(result, row\) => \{[\s\S]*?if \(\(counts\.not_started \?\? 0\) !== 70\) fail\([^\n]+\);\n/,
    "if (rows.length !== 98) fail(`tracker must contain 98 rows; found ${rows.length}`);\n"
  );
  text = text.replace("console.log('TRACKER_COUNTS: published=20 source_tested=8 not_started=70');\n", '');
  fs.writeFileSync(file, text);
}

console.log('PR_297_STATE_SYNC_COMPLETE');
