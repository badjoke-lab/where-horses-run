import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, value) => fs.writeFileSync(path.join(root, file), value);

function replaceOnce(text, before, after, label) {
  if (text.includes(after) && !text.includes(before)) return text;
  const count = text.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one occurrence, found ${count}`);
  return text.replace(before, after);
}

let value = read('START-HERE.md');
value = replaceOnce(value, 'Previous completed Work ID: `WHR-CP-PUB-45-52`', 'Previous completed Work ID: `WHR-ST2-53-60`', 'START-HERE previous');
value = replaceOnce(value, 'WHR-ST2-53-60\n```\n\nNext Work ID:\n\n```text\nWHR-NOTE-53-60', 'WHR-NOTE-53-60\n```\n\nNext Work ID:\n\n```text\nWHR-PROFILE-53-60', 'START-HERE current');
write('START-HERE.md', value);

value = read('docs/project-roadmap.md');
value = replaceOnce(value, 'Current Work ID: `WHR-ST2-53-60`  \nNext Work ID: `WHR-NOTE-53-60`', 'Current Work ID: `WHR-NOTE-53-60`  \nNext Work ID: `WHR-PROFILE-53-60`', 'project header');
value = replaceOnce(value, 'profile_ready:                  0\nnote_reviewed:                  0\nnot_started:                   46', 'profile_ready:                  0\nnote_reviewed:                  0\nsource_tested:                  8\nnot_started:                   38', 'project counts');
value = replaceOnce(value, '- Calendar Readiness decisions are closed for entries 01-52, covering 52 countries and 70 system/source records.', '- Calendar Readiness decisions are closed through entry 60, covering 60 countries and 78 system/source records.', 'project readiness');
value = replaceOnce(value, '## Phase 5 — complete entries 53-98 under Source Test v2\n\n```text', '## Phase 5 — complete entries 53-98 under Source Test v2\n\nCompleted: `WHR-ST2-53-60` via PR #326.\n\nCurrent Work ID: `WHR-NOTE-53-60`\n\n```text', 'project phase');
write('docs/project-roadmap.md', value);

value = read('docs/country-pages/programme-roadmap.md');
value = replaceOnce(value, 'Latest completed Calendar Readiness change: PR #323\nLatest country publication: PR #325 — entries 45-52 approved after rendered preview', 'Latest completed Source Test v2 change: PR #326 — entries 53-60\nLatest country publication: PR #325 — entries 45-52 approved after rendered preview', 'programme latest');
value = replaceOnce(value, 'Current Work ID: WHR-ST2-53-60\nNext working branch: source-test-v2-53-60', 'Current Work ID: WHR-NOTE-53-60\nNext working branch: country-notes-53-60', 'programme current');
value = replaceOnce(value, 'source_tested:    0\nnot_started:     46', 'source_tested:    8\nnot_started:     38', 'programme counts');
value = replaceOnce(value, 'PR #325 publishes entries 45-52 after GitHub QA and rendered-preview approval. Source Test v2 work for entries 53-60 is now active.', 'PR #326 closes Source Test v2 and Calendar Readiness decisions for entries 53-60. Reviewed-note work for these entries is now active.', 'programme paragraph');
value = replaceOnce(value, '| #325 | publication | Published entries 45-52 after rendered-preview approval. |', '| #325 | publication | Published entries 45-52 after rendered-preview approval. |\n| #326 | Source Test v2 | Closed official-source and Calendar Readiness decisions for entries 53-60. |', 'programme PR');
value = replaceOnce(value, '## 10. Remaining wave schedule', `## 10. Wave 53-60

Entries: Cyprus, Panama, Kuwait, Kenya, Pakistan, Ecuador, Venezuela, and Belgium.

| Work | Status | Result |
| --- | --- | --- |
| #326 / \`WHR-ST2-53-60\` | complete | Added eight public-safe Source Test v2 records and eight Calendar Readiness decisions. |
| \`WHR-NOTE-53-60\` | next | Convert the verified boundaries into reviewed editorial notes. |
| \`WHR-PROFILE-53-60\` | planned | Add bilingual Profile v2 records. |
| \`WHR-PUB-53-60\` | planned | QA and publish after one rendered preview. |

Readiness result: 2 prototype-ready, 3 manual-ready, 2 link-only, and 1 blocked. Belgium retains technical rank A behind country public ceiling C; all other country ceilings remain C.

## 11. Remaining wave schedule`, 'programme wave');
value = replaceOnce(value, '## 11. Final release gate', '## 12. Final release gate', 'programme final');
value = replaceOnce(value, '## 12. Roadmap maintenance rules', '## 13. Roadmap maintenance rules', 'programme maintenance');
write('docs/country-pages/programme-roadmap.md', value);

value = read('scripts/check-country-page-programme.mjs');
value = replaceOnce(value, '{ published: 52, profile_ready: 0, source_tested: 0, note_reviewed: 0, page_qa: 0, not_started: 46 }', '{ published: 52, profile_ready: 0, source_tested: 8, note_reviewed: 0, page_qa: 0, not_started: 38 }', 'programme expected');
value = replaceOnce(value, "console.log('PROGRAMME_COUNTS: published=52 profile_ready=0 note_reviewed=0 not_started=46');", "console.log('PROGRAMME_COUNTS: published=52 source_tested=8 note_reviewed=0 not_started=38');", 'programme log');
write('scripts/check-country-page-programme.mjs', value);

value = read('scripts/check-calendar-contracts.mjs');
value = replaceOnce(value, "[paths.roadmap, roadmapText, ['Current Work ID: `WHR-ST2-53-60`', 'Next Work ID: `WHR-NOTE-53-60`']]", "[paths.roadmap, roadmapText, ['Current Work ID: `WHR-NOTE-53-60`', 'Next Work ID: `WHR-PROFILE-53-60`']]", 'calendar roadmap');
value = replaceOnce(value, "[paths.startHere, startHereText, ['WHR-ST2-53-60', 'WHR-NOTE-53-60']]", "[paths.startHere, startHereText, ['WHR-NOTE-53-60', 'WHR-PROFILE-53-60']]", 'calendar start');
value = replaceOnce(value, "console.log('CURRENT_WORK_ID: WHR-CAL-BACKFILL-37-52');\nconsole.log('NEXT_WORK_ID: WHR-CP-PROFILE-45-52');", "console.log('CURRENT_WORK_ID: WHR-NOTE-53-60');\nconsole.log('NEXT_WORK_ID: WHR-PROFILE-53-60');", 'calendar logs');
write('scripts/check-calendar-contracts.mjs', value);

value = read('scripts/check-project-governance-docs.mjs');
value = replaceOnce(value, "'Current Work ID: `WHR-ST2-53-60`',\n    'Next Work ID: `WHR-NOTE-53-60`',", "'Current Work ID: `WHR-NOTE-53-60`',\n    'Next Work ID: `WHR-PROFILE-53-60`',", 'governance roadmap');
value = replaceOnce(value, "'START-HERE.md': ['WHR-ST2-53-60', 'WHR-NOTE-53-60', 'calendar-readiness-registry.json'],", "'START-HERE.md': ['WHR-NOTE-53-60', 'WHR-PROFILE-53-60', 'calendar-readiness-registry.json'],", 'governance start');
value = replaceOnce(value, "'\"bootstrap_status\": \"complete\"',\n    '\"countries_with_closed_decision\": 52',\n    '\"WHR-ST2-53-60\"',", "'\"bootstrap_status\": \"source_test_v2_active\"',\n    '\"countries_with_closed_decision\": 60',\n    '\"WHR-ST2-61-68\"',", 'governance registry');
value = replaceOnce(value, "console.log('CURRENT_WORK_ID: WHR-ST2-53-60');\nconsole.log('NEXT_WORK_ID: WHR-NOTE-53-60');", "console.log('CURRENT_WORK_ID: WHR-NOTE-53-60');\nconsole.log('NEXT_WORK_ID: WHR-PROFILE-53-60');", 'governance logs');
write('scripts/check-project-governance-docs.mjs', value);

value = read('scripts/check-country-page-programme-roadmap.mjs');
value = replaceOnce(value, 'for (const pr of [284, 311, 316, 317, 319, 321, 322, 323, 324, 325, 340]) {', 'for (const pr of [284, 311, 316, 317, 319, 321, 322, 323, 324, 325, 326, 340]) {', 'roadmap PR');
value = replaceOnce(value, "'Current Work ID: WHR-ST2-53-60',\n  'Next working branch: source-test-v2-53-60',\n  'Latest completed Calendar Readiness change: PR #323',", "'Current Work ID: WHR-NOTE-53-60',\n  'Next working branch: country-notes-53-60',\n  'Latest completed Source Test v2 change: PR #326',", 'roadmap phrases');
value = replaceOnce(value, "console.log('KEY_PRS: 284,311,316,317,319,321,322,323,324,325,340');\nconsole.log('CURRENT_WORK: entries 45-52 published; current Work ID WHR-ST2-53-60');", "console.log('KEY_PRS: 284,311,316,317,319,321,322,323,324,325,326,340');\nconsole.log('CURRENT_WORK: entries 53-60 source-tested; current Work ID WHR-NOTE-53-60');", 'roadmap logs');
write('scripts/check-country-page-programme-roadmap.mjs', value);

write('docs/runbooks/source-test-v2-53-60.md', `# Source Test v2 — entries 53-60

Status: complete  
Work ID: \`WHR-ST2-53-60\`  
PR: #326  
Deployment: not required

## Scope

Cyprus, Panama, Kuwait, Kenya, Pakistan, Ecuador, Venezuela, and Belgium.

## Result

- 8 public-safe Source Test v2 summaries
- 8 authority/source inventory records
- 8 Calendar Readiness records
- cumulative closed countries: 60
- cumulative readiness records: 78
- readiness mix: prototype-ready 2, manual-ready 3, link-only 2, blocked 1
- every new implementation status remains \`not_started\`

Belgium retains technical rank A behind country public ceiling C. All other country ceilings remain C.

## Next

\`WHR-NOTE-53-60\`
`);

console.log('ADVANCED_AFTER_SOURCE_TEST_V2_53_60 current=WHR-NOTE-53-60 next=WHR-PROFILE-53-60');
