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
  ['61','slovenia','Reviewed note completed; official federation retained as link-only pending a stable current calendar.'],
  ['62','croatia','Reviewed note completed; Zagreb gallop calendar retained as manual-ready at public ceiling C.'],
  ['63','dominican-republic','Reviewed note completed; Hipódromo V Centenario retained as a single-racecourse prototype-ready scope.'],
  ['64','tunisia','Reviewed note completed; official calendar retained as manual-ready with reachability limitations.'],
  ['65','lebanon','Reviewed note completed; authority context retained as link-only without a current calendar.'],
  ['66','libya','Reviewed note completed; official racing route retained as link-only without a current calendar.'],
  ['67','mainland-china','Reviewed note completed; Conghua current-calendar output remains blocked pending an official meeting calendar.'],
  ['68','indonesia','Reviewed note completed; PORDASI calendar retained as manual-ready at public ceiling C.'],
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
value = replaceOnce(value, 'Previous completed Work ID: `WHR-ST2-61-68`', 'Previous completed Work ID: `WHR-NOTE-61-68`', 'START previous');
value = replaceOnce(value, 'WHR-NOTE-61-68\n```\n\nNext Work ID:\n\n```text\nWHR-PROFILE-61-68', 'WHR-PROFILE-61-68\n```\n\nNext Work ID:\n\n```text\nWHR-PUB-61-68', 'START IDs');
write('START-HERE.md', value);

value = read('docs/project-roadmap.md');
value = replaceOnce(value, 'Current Work ID: `WHR-NOTE-61-68`  \nNext Work ID: `WHR-PROFILE-61-68`', 'Current Work ID: `WHR-PROFILE-61-68`  \nNext Work ID: `WHR-PUB-61-68`', 'project IDs');
value = replaceOnce(value, 'note_reviewed:                  0\nsource_tested:                  8\nnot_started:                   30', 'note_reviewed:                  8\nsource_tested:                  0\nnot_started:                   30', 'project counts');
value = replaceOnce(value, 'Completed: `WHR-ST2-61-68` via PR #330.\n\nCurrent Work ID: `WHR-NOTE-61-68`', 'Completed: `WHR-ST2-61-68` via PR #330 and `WHR-NOTE-61-68` via PR #331.\n\nCurrent Work ID: `WHR-PROFILE-61-68`', 'project phase');
write('docs/project-roadmap.md', value);

value = read('docs/country-pages/programme-roadmap.md');
value = replaceOnce(value, 'Latest completed Source Test v2 change: PR #330 — entries 61-68\nLatest completed reviewed-note change: PR #327 — entries 53-60', 'Latest completed Source Test v2 change: PR #330 — entries 61-68\nLatest completed reviewed-note change: PR #331 — entries 61-68', 'programme latest');
value = replaceOnce(value, 'Current Work ID: WHR-NOTE-61-68\nNext working branch: country-notes-61-68', 'Current Work ID: WHR-PROFILE-61-68\nNext working branch: country-profiles-61-68', 'programme current');
value = replaceOnce(value, 'Current tracker counts after Source Test v2 61-68:', 'Current tracker counts after reviewed notes 61-68:', 'programme heading');
value = replaceOnce(value, 'note_reviewed:    0\nsource_tested:    8\nnot_started:     30', 'note_reviewed:    8\nsource_tested:    0\nnot_started:     30', 'programme counts');
value = replaceOnce(value, 'PR #330 closes Source Test v2 and Calendar Readiness decisions for entries 61-68. Reviewed-note work for these entries is now active.', 'PR #331 completes reviewed editorial notes for entries 61-68. Profile v2 work for these entries is now active.', 'programme summary');
value = replaceOnce(value, '| #330 / `WHR-ST2-61-68` | complete | Added eight Source Test v2 records and eight Calendar Readiness decisions. |\n| `WHR-NOTE-61-68` | next | Convert the verified boundaries into reviewed editorial notes. |\n| `WHR-PROFILE-61-68` | planned | Add bilingual Profile v2 records. |', '| #330 / `WHR-ST2-61-68` | complete | Added eight Source Test v2 records and eight Calendar Readiness decisions. |\n| #331 / `WHR-NOTE-61-68` | complete | Added eight reviewed editorial notes with explicit scope and limitations. |\n| `WHR-PROFILE-61-68` | next | Add bilingual Profile v2 records. |', 'programme wave');
write('docs/country-pages/programme-roadmap.md', value);

value = read('scripts/check-country-page-programme.mjs');
value = replaceOnce(value, '{ published: 60, profile_ready: 0, source_tested: 8, note_reviewed: 0, page_qa: 0, not_started: 30 }', '{ published: 60, profile_ready: 0, source_tested: 0, note_reviewed: 8, page_qa: 0, not_started: 30 }', 'programme expected counts');
value = replaceOnce(value, "console.log('PROGRAMME_COUNTS: published=60 page_qa=0 profile_ready=0 source_tested=8 note_reviewed=0 not_started=30');", "console.log('PROGRAMME_COUNTS: published=60 page_qa=0 profile_ready=0 source_tested=0 note_reviewed=8 not_started=30');", 'programme log');
write('scripts/check-country-page-programme.mjs', value);

value = read('scripts/check-source-test-v2-61-68.mjs');
value = replaceOnce(value, "const expected = [", "const sourceTestOrLater = new Set(['source_tested', 'note_reviewed', 'profile_ready', 'page_qa', 'published']);\nconst expected = [", 'source stages');
value = replaceOnce(value, "if (row[index.programme_status] !== 'source_tested') fail(`${slug}: tracker must be source_tested`);", "if (!sourceTestOrLater.has(row[index.programme_status])) fail(`${slug}: tracker must retain Source Test completion or a later programme state`);", 'source tracker state');
write('scripts/check-source-test-v2-61-68.mjs', value);

value = read('scripts/check-calendar-contracts.mjs');
value = replaceOnce(value, "[paths.roadmap, roadmapText, ['Current Work ID: `WHR-NOTE-61-68`', 'Next Work ID: `WHR-PROFILE-61-68`']]", "[paths.roadmap, roadmapText, ['Current Work ID: `WHR-PROFILE-61-68`', 'Next Work ID: `WHR-PUB-61-68`']]", 'calendar roadmap');
value = replaceOnce(value, "[paths.startHere, startHereText, ['WHR-NOTE-61-68', 'WHR-PROFILE-61-68']]", "[paths.startHere, startHereText, ['WHR-PROFILE-61-68', 'WHR-PUB-61-68']]", 'calendar start');
value = replaceOnce(value, "console.log('CURRENT_WORK_ID: WHR-NOTE-61-68');\nconsole.log('NEXT_WORK_ID: WHR-PROFILE-61-68');", "console.log('CURRENT_WORK_ID: WHR-PROFILE-61-68');\nconsole.log('NEXT_WORK_ID: WHR-PUB-61-68');", 'calendar logs');
write('scripts/check-calendar-contracts.mjs', value);

value = read('scripts/check-project-governance-docs.mjs');
value = replaceOnce(value, "'Current Work ID: `WHR-NOTE-61-68`',\n    'Next Work ID: `WHR-PROFILE-61-68`',", "'Current Work ID: `WHR-PROFILE-61-68`',\n    'Next Work ID: `WHR-PUB-61-68`',", 'governance roadmap');
value = replaceOnce(value, "'START-HERE.md': ['WHR-NOTE-61-68', 'WHR-PROFILE-61-68', 'calendar-readiness-registry.json'],", "'START-HERE.md': ['WHR-PROFILE-61-68', 'WHR-PUB-61-68', 'calendar-readiness-registry.json'],", 'governance start');
value = replaceOnce(value, "console.log('CURRENT_WORK_ID: WHR-NOTE-61-68');\nconsole.log('NEXT_WORK_ID: WHR-PROFILE-61-68');", "console.log('CURRENT_WORK_ID: WHR-PROFILE-61-68');\nconsole.log('NEXT_WORK_ID: WHR-PUB-61-68');", 'governance logs');
write('scripts/check-project-governance-docs.mjs', value);

value = read('scripts/check-country-page-programme-roadmap.mjs');
value = replaceOnce(value, 'for (const pr of [284, 311, 316, 317, 319, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 340]) {', 'for (const pr of [284, 311, 316, 317, 319, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 340]) {', 'roadmap PRs');
value = replaceOnce(value, "  'Current Work ID: WHR-NOTE-61-68',\n  'Next working branch: country-notes-61-68',\n  'Latest completed Source Test v2 change: PR #330',", "  'Current Work ID: WHR-PROFILE-61-68',\n  'Next working branch: country-profiles-61-68',\n  'Latest completed Source Test v2 change: PR #330',\n  'Latest completed reviewed-note change: PR #331',", 'roadmap phrases');
value = replaceOnce(value, "console.log('KEY_PRS: 284,311,316,317,319,321,322,323,324,325,326,327,328,329,330,340');\nconsole.log('CURRENT_WORK: entries 61-68 source-tested; current Work ID WHR-NOTE-61-68');", "console.log('KEY_PRS: 284,311,316,317,319,321,322,323,324,325,326,327,328,329,330,331,340');\nconsole.log('CURRENT_WORK: entries 61-68 note-reviewed; current Work ID WHR-PROFILE-61-68');", 'roadmap logs');
write('scripts/check-country-page-programme-roadmap.mjs', value);

write('docs/runbooks/country-notes-61-68.md', `# Reviewed country notes — entries 61-68\n\nStatus: complete  \nWork ID: \`WHR-NOTE-61-68\`  \nPR: #331  \nDeployment: not required\n\n## Result\n\n- 8 reviewed editorial notes\n- tracker transition: \`source_tested\` to \`note_reviewed\`\n- every country public ceiling remains C\n- profiles and routes remain not started\n\n## Next\n\n\`WHR-PROFILE-61-68\`\n`);

console.log('MATERIALIZED_COUNTRY_NOTES_61_68 note_reviewed=8 current=WHR-PROFILE-61-68');
