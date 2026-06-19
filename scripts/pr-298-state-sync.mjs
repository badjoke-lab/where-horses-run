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
  const targets = new Map([
    ['21', 'hungary'], ['22', 'malta'], ['23', 'austria'], ['24', 'puerto-rico'],
    ['25', 'jamaica'], ['26', 'trinidad-and-tobago'], ['27', 'barbados'], ['28', 'martinique']
  ]);
  const rows = lines.slice(1).map((line) => {
    const values = line.split('\t');
    while (values.length < headers.length) values.push('');
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
    const slug = targets.get(row.delivery_no);
    if (slug) {
      row.programme_status = 'note_reviewed';
      row.note_status = 'reviewed';
      row.note_ref = `docs/country-page-notes/${row.delivery_no}-${slug}.md`;
      row.evidence_reviewed_at = '2026-06-19';
      row.remarks = 'Reviewed note completed; profile, routes, and publication QA remain.';
    }
    return headers.map((header) => row[header] ?? '').join('\t');
  });
  fs.writeFileSync(file, `${lines[0]}\n${rows.join('\n')}\n`);
}

{
  const file = 'scripts/check-country-page-programme.mjs';
  let text = fs.readFileSync(file, 'utf8');
  text = replaceState(text,
    "if ((statusCounts.source_tested ?? 0) !== 8) fail('tracker must contain 8 source_tested rows');",
    "if ((statusCounts.source_tested ?? 0) !== 0) fail('tracker must contain 0 source_tested rows');"
  );
  text = replaceState(text,
    "if ((statusCounts.note_reviewed ?? 0) !== 0) fail('tracker must contain 0 note_reviewed rows');",
    "if ((statusCounts.note_reviewed ?? 0) !== 8) fail('tracker must contain 8 note_reviewed rows');"
  );
  text = replaceState(text,
    "console.log('PROGRAMME_COUNTS: published=20 source_tested=8 not_started=70');",
    "console.log('PROGRAMME_COUNTS: published=20 note_reviewed=8 not_started=70');"
  );
  fs.writeFileSync(file, text);
}

{
  const file = 'docs/country-pages/programme-roadmap.md';
  let text = fs.readFileSync(file, 'utf8');
  const updates = [
    ['Merged through: PR #297', 'Merged through: PR #298'],
    ['Latest confirmed merge: PR #297', 'Latest confirmed merge: PR #298'],
    ['Working PR: #298', 'Working PR: #299'],
    ['Working branch: country-notes-21-28', 'Working branch: country-profiles-21-28'],
    ['Next PR: #299', 'Next PR: #300'],
    ['note_reviewed:    0\nsource_tested:    8', 'note_reviewed:    8\nsource_tested:    0'],
    ['merged:        #284-#297 = 14 PRs', 'merged:        #284-#298 = 15 PRs'],
    ['in progress:   #298', 'in progress:   #299'],
    ['remaining after #298: #299-#337', 'remaining after #299: #300-#337'],
    ['| #298 | Reviewed notes for entries 21-28. Separate verified facts, observations, inferences, unresolved claims, and revalidation triggers. |', '| #298 | Completed reviewed notes for entries 21-28 with verified facts, observations, inferences, unresolved claims, public ceilings, and revalidation triggers. |']
  ];
  for (const [before, after] of updates) text = replaceState(text, before, after);
  fs.writeFileSync(file, text);
}

{
  const file = 'scripts/check-country-page-programme-roadmap.mjs';
  let text = fs.readFileSync(file, 'utf8');
  text = replaceState(text, "'Working PR: #298'", "'Working PR: #299'");
  text = replaceState(text, "'Next PR: #299'", "'Next PR: #300'");
  text = replaceState(text, "'Merged through: PR #297'", "'Merged through: PR #298'");
  fs.writeFileSync(file, text);
}

console.log('PR_298_STATE_SYNC_COMPLETE');
