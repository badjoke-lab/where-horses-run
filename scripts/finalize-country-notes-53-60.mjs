import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const resolve = (file) => path.join(root, file);
const read = (file) => fs.readFileSync(resolve(file), 'utf8');
const write = (file, value) => fs.writeFileSync(resolve(file), value);

function replaceOnce(text, before, after, label) {
  if (text.includes(after) && !text.includes(before)) return text;
  const count = text.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one occurrence, found ${count}`);
  return text.replace(before, after);
}

const entries = [
  ['53', 'cyprus', 'Reviewed note completed; countrywide manual calendar decision retained at public ceiling C.'],
  ['54', 'panama', 'Reviewed note completed; Hipódromo Presidente Remón remains the single reviewed C-level scope.'],
  ['55', 'kuwait', 'Reviewed note completed; official calendar capability remains app-based and link-only.'],
  ['56', 'kenya', 'Reviewed note completed; Ngong Racecourse remains the single reviewed manual C-level scope.'],
  ['57', 'pakistan', 'Reviewed note completed; Lahore remains stale and link-only, with wider Pakistan coverage incomplete.'],
  ['58', 'ecuador', 'Reviewed note completed; Miguel Salem Dibo remains a manually confirmed single-racecourse C-level scope.'],
  ['59', 'venezuela', 'Reviewed note completed; current-calendar output remains blocked pending a stable public upcoming source.'],
  ['60', 'belgium', 'Reviewed note completed; technical rank A remains behind country public ceiling C.'],
];

const trackerPath = 'docs/country-pages/98-country-tracker.tsv';
const lines = read(trackerPath).trimEnd().split(/\r?\n/);
const headers = lines[0].split('\t');
const index = Object.fromEntries(headers.map((name, position) => [name, position]));
const rows = lines.slice(1).map((line) => line.split('\t'));
for (const [deliveryNo, slug, remark] of entries) {
  const row = rows.find((candidate) => candidate[index.delivery_no] === deliveryNo);
  if (!row || row[index.slug] !== slug) throw new Error(`tracker mismatch: ${deliveryNo}-${slug}`);
  row[index.programme_status] = 'note_reviewed';
  row[index.note_status] = 'reviewed';
  row[index.note_ref] = `docs/country-page-notes/${deliveryNo}-${slug}.md`;
  row[index.evidence_reviewed_at] = '2026-06-29';
  row[index.remarks] = remark;
}
write(trackerPath, `${[headers.join('\t'), ...rows.map((row) => row.join('\t'))].join('\n')}\n`);

let value = read('START-HERE.md');
value = replaceOnce(value, 'Previous completed Work ID: `WHR-ST2-53-60`', 'Previous completed Work ID: `WHR-NOTE-53-60`', 'START-HERE previous');
value = replaceOnce(value, 'WHR-NOTE-53-60\n```\n\nNext Work ID:\n\n```text\nWHR-PROFILE-53-60', 'WHR-PROFILE-53-60\n```\n\nNext Work ID:\n\n```text\nWHR-PUB-53-60', 'START-HERE current');
write('START-HERE.md', value);

value = read('docs/project-roadmap.md');
value = replaceOnce(value, 'Current Work ID: `WHR-NOTE-53-60`  \nNext Work ID: `WHR-PROFILE-53-60`', 'Current Work ID: `WHR-PROFILE-53-60`  \nNext Work ID: `WHR-PUB-53-60`', 'project header');
value = replaceOnce(value, 'profile_ready:                  0\nnote_reviewed:                  0\nsource_tested:                  8\nnot_started:                   38', 'profile_ready:                  0\nnote_reviewed:                  8\nsource_tested:                  0\nnot_started:                   38', 'project counts');
value = replaceOnce(value, 'Completed: `WHR-ST2-53-60` via PR #326.\n\nCurrent Work ID: `WHR-NOTE-53-60`', 'Completed: `WHR-ST2-53-60` via PR #326 and `WHR-NOTE-53-60` via PR #327.\n\nCurrent Work ID: `WHR-PROFILE-53-60`', 'project phase 5');
write('docs/project-roadmap.md', value);

value = read('docs/country-pages/programme-roadmap.md');
value = replaceOnce(value, 'Latest completed Source Test v2 change: PR #326 — entries 53-60\nLatest country publication: PR #325 — entries 45-52 approved after rendered preview', 'Latest completed Source Test v2 change: PR #326 — entries 53-60\nLatest completed reviewed-note change: PR #327 — entries 53-60\nLatest country publication: PR #325 — entries 45-52 approved after rendered preview', 'programme latest');
value = replaceOnce(value, 'Current Work ID: WHR-NOTE-53-60\nNext working branch: country-notes-53-60', 'Current Work ID: WHR-PROFILE-53-60\nNext working branch: country-profiles-53-60', 'programme current');
value = replaceOnce(value, 'Current tracker counts after entries 45-52 preview approval:', 'Current tracker counts after reviewed notes 53-60:', 'programme count heading');
value = replaceOnce(value, 'profile_ready:    0\nnote_reviewed:    0\nsource_tested:    8\nnot_started:     38', 'profile_ready:    0\nnote_reviewed:    8\nsource_tested:    0\nnot_started:     38', 'programme counts');
value = replaceOnce(value, 'PR #326 closes Source Test v2 and Calendar Readiness decisions for entries 53-60. Reviewed-note work for these entries is now active.', 'PR #327 completes reviewed editorial notes for entries 53-60. Profile v2 work for these entries is now active.', 'programme paragraph');
const duplicate326 = '| #326 | Source Test v2 | Closed official-source and Calendar Readiness decisions for entries 53-60. |\n| #326 | Source Test v2 | Closed official-source and Calendar Readiness decisions for entries 53-60. |';
const completedRows = '| #326 | Source Test v2 | Closed official-source and Calendar Readiness decisions for entries 53-60. |\n| #327 | reviewed notes | Completed public-safe editorial notes for entries 53-60. |';
if (value.includes(duplicate326)) value = value.replace(duplicate326, completedRows);
else value = replaceOnce(value, '| #326 | Source Test v2 | Closed official-source and Calendar Readiness decisions for entries 53-60. |', completedRows, 'programme PR rows');
value = replaceOnce(value, '| #326 / `WHR-ST2-53-60` | complete | Added eight public-safe Source Test v2 records and eight Calendar Readiness decisions. |\n| `WHR-NOTE-53-60` | next | Convert the verified boundaries into reviewed editorial notes. |\n| `WHR-PROFILE-53-60` | planned | Add bilingual Profile v2 records. |', '| #326 / `WHR-ST2-53-60` | complete | Added eight public-safe Source Test v2 records and eight Calendar Readiness decisions. |\n| #327 / `WHR-NOTE-53-60` | complete | Added eight reviewed editorial notes with explicit scope, limitations, and handoff rules. |\n| `WHR-PROFILE-53-60` | next | Add bilingual Profile v2 records. |', 'programme wave table');
write('docs/country-pages/programme-roadmap.md', value);

value = read('scripts/check-country-page-programme.mjs');
value = replaceOnce(value, '{ published: 52, profile_ready: 0, source_tested: 8, note_reviewed: 0, page_qa: 0, not_started: 38 }', '{ published: 52, profile_ready: 0, source_tested: 0, note_reviewed: 8, page_qa: 0, not_started: 38 }', 'programme expected counts');
value = replaceOnce(value, "console.log('PROGRAMME_COUNTS: published=52 source_tested=8 note_reviewed=0 not_started=38');", "console.log('PROGRAMME_COUNTS: published=52 source_tested=0 note_reviewed=8 not_started=38');", 'programme count log');
write('scripts/check-country-page-programme.mjs', value);

value = read('scripts/check-calendar-contracts.mjs');
value = replaceOnce(value, "[paths.roadmap, roadmapText, ['Current Work ID: `WHR-NOTE-53-60`', 'Next Work ID: `WHR-PROFILE-53-60`']]", "[paths.roadmap, roadmapText, ['Current Work ID: `WHR-PROFILE-53-60`', 'Next Work ID: `WHR-PUB-53-60`']]", 'calendar roadmap');
value = replaceOnce(value, "[paths.startHere, startHereText, ['WHR-NOTE-53-60', 'WHR-PROFILE-53-60']]", "[paths.startHere, startHereText, ['WHR-PROFILE-53-60', 'WHR-PUB-53-60']]", 'calendar start');
value = replaceOnce(value, "console.log('CURRENT_WORK_ID: WHR-NOTE-53-60');\nconsole.log('NEXT_WORK_ID: WHR-PROFILE-53-60');", "console.log('CURRENT_WORK_ID: WHR-PROFILE-53-60');\nconsole.log('NEXT_WORK_ID: WHR-PUB-53-60');", 'calendar logs');
write('scripts/check-calendar-contracts.mjs', value);

value = read('scripts/check-project-governance-docs.mjs');
value = replaceOnce(value, "'Current Work ID: `WHR-NOTE-53-60`',\n    'Next Work ID: `WHR-PROFILE-53-60`',", "'Current Work ID: `WHR-PROFILE-53-60`',\n    'Next Work ID: `WHR-PUB-53-60`',", 'governance roadmap');
value = replaceOnce(value, "'START-HERE.md': ['WHR-NOTE-53-60', 'WHR-PROFILE-53-60', 'calendar-readiness-registry.json'],", "'START-HERE.md': ['WHR-PROFILE-53-60', 'WHR-PUB-53-60', 'calendar-readiness-registry.json'],", 'governance start');
value = replaceOnce(value, "console.log('CURRENT_WORK_ID: WIRNOTE-53-60');\nconsole.log('NEXT_WORK_ID: WHR-PROFILE-53-60');", "console.log('CURRENT_WORK_ID: WHR-PROFILE-53-60');\nconsole.log('NEXT_WORK_ID: WHR-PUB-53-60');", 'governance logs');
write('scripts/check-project-governance-docs.mjs', value);

value = read('scripts/check-country-page-programme-roadmap.mjs');
value = replaceOnce(value, 'for (const pr of [284, 311, 316, 317, 319, 321, 322, 323, 324, 325, 326, 340]) {', 'for (const pr of [284, 311, 316, 317, 319, 321, 322, 323, 324, 325, 326, 327, 340]) {', 'roadmap PR list');
value = replaceOnce(value, "'Current Work ID: WHR-NOTE-53-60',\n  'Next working branch: country-notes-53-60',\n  'Latest completed Source Test v2 change: PR #326',", "'Current Work ID: WHR-PROFILE-53-60',\n  'Next working branch: country-profiles-53-60',\n  'Latest completed Source Test v2 change: PR #326',\n  'Latest completed reviewed-note change: PR #327'," 'roadmap phrases');
value = replaceOnce(value, "console.log('KEY_PRS: 284,311,316,317,319,321,322,323,324,325,326,340');\nconsole.log('CURRENT_WORK: entries 53-60 source-tested; current Work ID WHR-NOTE-53-60');", "console.log('KEY_PRS: 284,311,316,317,319,321,322,323,324,325,326,327,340');\nconsole.log('CURRENT_WORK: entries 53-60 note-reviewed; current Work ID WHR-PROFILE-53-60');", "roadmap logs');
write('scripts/check-country-page-programme-roadmap.mjs', value);

write('docs/runbooks/country-notes-53-60.md', `# Reviewed country notes — entries 53-60

Status: complete  
Work ID: \`WHR-NOTE-53-60\`  
PR: #327  
Deployment: not required

## Scope

Cyprus, Panama, Kuwait, Kenya, Pakistan, Ecuador, Venezuela, and Belgium.

## Result

- 8 reviewed editorial notes
- tracker transition: \`source_tested\` to \`note_reviewed`
- all 8 country public ceilings remain C
- Profile v2 and bilingual routes remain not started

The notes preserve the reviewed acquisition boundaries: Kuwait and Pakistan remain link-only, Venezuela remains blocked for current-calendar use, and Belgium's technical rank A remains behind country public ceiling C.

## Repository boundary

The notes contain derived public-safe decisions only. Detailed acquisition material remains outside the public repository.

## Next

\`WHR-PROFILE-53-60\`
`);

console.log('FINALIZED_COUNTRY_NOTES_53_60 note_reviewed=8 current=WHR-PROFILE-53-60 next=WHR-PUB-53-60');
