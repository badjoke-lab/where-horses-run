import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, content) => fs.writeFileSync(path.join(root, file), content);

function replaceRequired(text, before, after, label, count = 1) {
  const found = text.split(before).length - 1;
  if (found === 0 && text.includes(after)) return text;
  if (found !== count) throw new Error(`${label}: expected ${count} occurrence(s), found ${found}`);
  return text.split(before).join(after);
}

const remarks = {
  norway: 'Published after rendered Cloudflare preview and bilingual public-boundary QA; harness and gallop remain separate reviewed systems.',
  finland: 'Published after rendered Cloudflare preview and bilingual public-boundary QA.',
  netherlands: 'Published after rendered Cloudflare preview and bilingual public-boundary QA.',
  switzerland: 'Published after rendered Cloudflare preview and bilingual public-boundary QA; trot and gallop remain separate reviewed systems.',
  poland: 'Published after rendered Cloudflare preview and bilingual public-boundary QA.',
  romania: 'Published after rendered Cloudflare preview and bilingual public-boundary QA; wider country coverage remains incomplete.',
  serbia: 'Published after rendered Cloudflare preview and bilingual public-boundary QA; wider country coverage remains incomplete.',
  slovakia: 'Published after rendered Cloudflare preview and bilingual public-boundary QA; first-race capability is not generalized beyond country ceiling C.',
};

const trackerPath = 'docs/country-pages/98-country-tracker.tsv';
const trackerLines = read(trackerPath).trimEnd().split(/\r?\n/);
const headers = trackerLines[0].split('\t');
const index = Object.fromEntries(headers.map((name, position) => [name, position]));
const rows = trackerLines.slice(1).map((line) => line.split('\t'));
for (const row of rows) {
  const delivery = Number(row[index.delivery_no]);
  if (delivery < 45 || delivery > 52) continue;
  const slug = row[index.slug];
  row[index.programme_status] = 'published';
  row[index.en_route_status] = 'published';
  row[index.ja_route_status] = 'published';
  row[index.qa_status] = 'passed';
  row[index.page_published_at] = '2026-06-29';
  row[index.remarks] = remarks[slug];
}
write(trackerPath, `${[headers.join('\t'), ...rows.map((row) => row.join('\t'))].join('\n')}\n`);

let startHere = read('START-HERE.md');
startHere = replaceRequired(startHere, 'Previous completed Work ID: `WHR-CP-PROFILE-45-52`', 'Previous completed Work ID: `WHR-CP-PUB-45-52`', 'START-HERE previous');
startHere = replaceRequired(startHere, 'WHR-CP-PUB-45-52\n```\n\nNext Work ID:\n\n```text\nWHR-ST2-53-60', 'WHR-ST2-53-60\n```\n\nNext Work ID:\n\n```text\nWHR-NOTE-53-60', 'START-HERE current/next');
write('START-HERE.md', startHere);

let project = read('docs/project-roadmap.md');
project = replaceRequired(project, 'Current Work ID: `WHR-CP-PUB-45-52`  \nNext Work ID: `WHR-ST2-53-60`', 'Current Work ID: `WHR-ST2-53-60`  \nNext Work ID: `WHR-NOTE-53-60`', 'project header');
project = replaceRequired(project, 'published country pages:       44\nprofile_ready:                  8\nnote_reviewed:                  0\nnot_started:                   46\ntotal countries/regions:       98\npublished routes:              44 EN + 44 JA = 88', 'published country pages:       52\nprofile_ready:                  0\nnote_reviewed:                  0\nnot_started:                   46\ntotal countries/regions:       98\npublished routes:              52 EN + 52 JA = 104', 'project counts');
project = replaceRequired(project, '- entries 45-52 are profile-ready and need publication.', '- entries 45-52 are published after the approved rendered preview.', 'project debt');
project = replaceRequired(project, '- `WHR-CP-PUB-37-44` via PR #319 after rendered-preview approval.\n\nThe publication debt for entries 29-44 is closed.', '- `WHR-CP-PUB-37-44` via PR #319 after rendered-preview approval.\n- `WHR-CP-PUB-45-52` via PR #325 after rendered-preview approval.\n\nThe publication debt for entries 29-52 is closed.', 'project phase 2');
project = replaceRequired(project, 'Current Work ID: `WHR-CP-PUB-45-52`\n\n```text\nWHR-CAL-BACKFILL-01-20', 'Next programme Work ID: `WHR-ST2-53-60`\n\n```text\nWHR-CAL-BACKFILL-01-20', 'project phase 3');
project = replaceRequired(project, 'Completed: `WHR-CP-PROFILE-45-52`.\n\nCurrent Work ID: `WHR-CP-PUB-45-52`', 'Completed: `WHR-CP-PROFILE-45-52` via PR #324 and `WHR-CP-PUB-45-52` via PR #325.', 'project phase 4');
write('docs/project-roadmap.md', project);

let programme = read('docs/country-pages/programme-roadmap.md');
programme = replaceRequired(programme, 'Publication gate: PR #319 — entries 37-44 published after approved rendered preview\nCurrent Work ID: WHR-CP-PUB-45-52\nNext working branch: country-pages-45-52-publication-qa', 'Latest country publication: PR #325 — entries 45-52 approved after rendered preview\nPublication gate: PR #325 — entries 45-52 published after approved rendered preview\nCurrent Work ID: WHR-ST2-53-60\nNext working branch: source-test-v2-53-60', 'programme current');
programme = replaceRequired(programme, 'Current tracker counts after entries 37-44 preview approval:', 'Current tracker counts after entries 45-52 preview approval:', 'programme count heading');
programme = replaceRequired(programme, 'published:       44\nprofile_ready:    8\nnote_reviewed:    0\nsource_tested:    0\nnot_started:     46', 'published:       52\nprofile_ready:    0\nnote_reviewed:    0\nsource_tested:    0\nnot_started:     46', 'programme counts');
programme = replaceRequired(programme, 'formally published English routes:   44\nformally published Japanese routes:  44\nformally published total routes:     88\nprofile-ready English routes:         0\nprofile-ready Japanese routes:        0\nprofile-ready total routes:           0', 'formally published English routes:   52\nformally published Japanese routes:  52\nformally published total routes:    104\nprofile-ready English routes:         0\nprofile-ready Japanese routes:        0\nprofile-ready total routes:           0', 'programme route counts');
programme = replaceRequired(programme, 'PR #323 completes Calendar Readiness decisions for entries 37-52. Profile v2 records for entries 45-52 are complete and publication QA is now active.', 'PR #325 publishes entries 45-52 after GitHub QA and rendered-preview approval. Source Test v2 work for entries 53-60 is now active.', 'programme current paragraph');
programme = replaceRequired(programme, '| #323 | Calendar Readiness | Completes entries 37-52 with 19 additional system/source decisions; implementation remains not started. |', '| #323 | merged | Completed entries 37-52 with 19 additional system/source decisions; implementation remains not started. |\n| #324 | merged | Added reviewed Profile v2 records for entries 45-52. |\n| #325 | publication | Published entries 45-52 after rendered-preview approval. |', 'programme PR table');
programme = replaceRequired(programme, '## 8. Wave 37-44', '### PR #325 — entries 45-52\n\nRendered preview approval:\n\n1. `preview-country-pages-45-52` passed live checks for all 16 English/Japanese routes.\n2. Norway, Switzerland, Romania, and Slovakia passed English/Japanese desktop and Pixel 7 rendered review.\n3. Canonical, hreflang, language switching, official links, empty states, CJK rendering, horizontal overflow, prohibited output, and C-rank column suppression passed.\n4. Evidence artifact `rendered-preview-45-52` is artifact `7943936486` with digest `sha256:663817f1622d1d8328f042c6a7305f2202001b2290945407b4518a7078dc0014`.\n5. Entries 45-52 are recorded as `published` on 2026-06-29.\n6. PR #325 must merge without `[CF-Pages-Skip]`, followed by one production-deployment confirmation.\n\n## 8. Wave 37-44', 'programme gate');
programme = replaceRequired(programme, '| `WHR-CP-PROFILE-45-52` | complete | Added eight reviewed Profile v2 records and reached `profile_ready`. |\n| `WHR-CP-PUB-45-52` | next | QA and publish sixteen routes after one final rendered preview. |', '| #324 | merged | Added eight reviewed Profile v2 records and reached `profile_ready`. |\n| #325 | publication | Published all sixteen routes after rendered-preview approval. |', 'programme wave');
write('docs/country-pages/programme-roadmap.md', programme);

let programmeCheck = read('scripts/check-country-page-programme.mjs');
programmeCheck = replaceRequired(programmeCheck, "'italy', 'spain'\n];", "'italy', 'spain',\n  'norway', 'finland', 'netherlands', 'switzerland', 'poland', 'romania', 'serbia', 'slovakia'\n];", 'programme published slugs');
programmeCheck = replaceRequired(programmeCheck, "{ published: 44, profile_ready: 8, source_tested: 0, note_reviewed: 0, page_qa: 0, not_started: 46 }", "{ published: 52, profile_ready: 0, source_tested: 0, note_reviewed: 0, page_qa: 0, not_started: 46 }", 'programme expected counts');
programmeCheck = replaceRequired(programmeCheck, "console.log('PROGRAMME_COUNTS: published=44 profile_ready=8 note_reviewed=0 not_started=46');", "console.log('PROGRAMME_COUNTS: published=52 profile_ready=0 note_reviewed=0 not_started=46');", 'programme count log');
write('scripts/check-country-page-programme.mjs', programmeCheck);

let calendarCheck = read('scripts/check-calendar-contracts.mjs');
calendarCheck = replaceRequired(calendarCheck, "['Current Work ID: `WHR-CP-PUB-45-52`', 'Next Work ID: `WHR-ST2-53-60`']", "['Current Work ID: `WHR-ST2-53-60`', 'Next Work ID: `WHR-NOTE-53-60`']", 'calendar roadmap check');
calendarCheck = replaceRequired(calendarCheck, "['WHR-CP-PUB-45-52', 'WHR-ST2-53-60']", "['WHR-ST2-53-60', 'WHR-NOTE-53-60']", 'calendar START-HERE check');
write('scripts/check-calendar-contracts.mjs', calendarCheck);

let governanceCheck = read('scripts/check-project-governance-docs.mjs');
governanceCheck = replaceRequired(governanceCheck, "'Current Work ID: `WHR-CP-PUB-45-52`',\n    'Next Work ID: `WHR-ST2-53-60`',", "'Current Work ID: `WHR-ST2-53-60`',\n    'Next Work ID: `WHR-NOTE-53-60`',", 'governance roadmap');
governanceCheck = replaceRequired(governanceCheck, "'START-HERE.md': ['WHR-CP-PUB-45-52', 'WHR-ST2-53-60', 'calendar-readiness-registry.json'],", "'START-HERE.md': ['WHR-ST2-53-60', 'WHR-NOTE-53-60', 'calendar-readiness-registry.json'],", 'governance START-HERE');
governanceCheck = replaceRequired(governanceCheck, "console.log('CURRENT_WORK_ID: WHR-CP-PUB-45-52');\nconsole.log('NEXT_WORK_ID: WHR-ST2-53-60');", "console.log('CURRENT_WORK_ID: WHR-ST2-53-60');\nconsole.log('NEXT_WORK_ID: WHR-NOTE-53-60');", 'governance logs');
write('scripts/check-project-governance-docs.mjs', governanceCheck);

let roadmapCheck = read('scripts/check-country-page-programme-roadmap.mjs');
roadmapCheck = replaceRequired(roadmapCheck, 'for (const pr of [284, 311, 316, 317, 319, 321, 322, 323, 340]) {', 'for (const pr of [284, 311, 316, 317, 319, 321, 322, 323, 324, 325, 340]) {', 'roadmap PRs');
roadmapCheck = replaceRequired(roadmapCheck, "'Publication gate: PR #319',\n  'Current Work ID: WHR-CP-PUB-45-52',\n  'Next working branch: country-pages-45-52-publication-qa',", "'Publication gate: PR #325',\n  'Current Work ID: WHR-ST2-53-60',\n  'Next working branch: source-test-v2-53-60',", 'roadmap required phrases');
roadmapCheck = replaceRequired(roadmapCheck, "console.log('KEY_PRS: 284,311,316,317,319,321,322,323,340');\nconsole.log('CURRENT_WORK: entries 45-52 profile-ready; current Work ID WHR-CP-PUB-45-52');", "console.log('KEY_PRS: 284,311,316,317,319,321,322,323,324,325,340');\nconsole.log('CURRENT_WORK: entries 45-52 published; current Work ID WHR-ST2-53-60');", 'roadmap logs');
write('scripts/check-country-page-programme-roadmap.mjs', roadmapCheck);

let workflow = read('.github/workflows/country-page-publication-45-52.yml');
workflow = workflow.replaceAll('docs/runbooks/country-pages-45-52-publication-qa.md', 'docs/runbooks/country-pages-45-52-publication-final.md');
write('.github/workflows/country-page-publication-45-52.yml', workflow);

const runbook = `# Country page publication — entries 45-52\n\nStatus: ready for merge after rendered-preview approval  \nWork ID: \`WHR-CP-PUB-45-52\`  \nPR: #325  \nPublication date: 2026-06-29\n\n## Scope\n\nNorway, Finland, Netherlands, Switzerland, Poland, Romania, Serbia, and Slovakia are published in English and Japanese. All country-level public ceilings remain C.\n\n## Rendered-preview evidence\n\n- preview branch: \`preview-country-pages-45-52\`\n- preview trigger commit: \`f1a07f9cbd71c8bc4977b878f3bd9630b7ef9a9b\`\n- successful rendered check run: \`28352430635\`\n- checked routes: 8 English + 8 Japanese\n- representative review: Norway, Switzerland, Romania, and Slovakia\n- viewports: desktop 1440x1200 and Pixel 7 412x915\n- artifact: \`rendered-preview-45-52\` / \`7943936486\`\n- digest: \`sha256:663817f1622d1d8328f042c6a7305f2202001b2290945407b4518a7078dc0014\`\n- errors: 0\n\nCanonical URLs, language alternates, H1 count, language switching, official links, empty states, CJK rendering, horizontal overflow, embedded-media exclusion, and C-rank time-column suppression passed.\n\n## Boundaries retained\n\nNorway and Switzerland preserve separate racing systems. Romania and Serbia remain partial-country coverage. Slovakia's first-race capability is not generalized beyond the country ceiling. No runner, participant, odds, result, payout, full racecard, embedded video, or direct-stream output is introduced.\n\n## Deployment\n\nMerge PR #325 without \`[CF-Pages-Skip]\` so exactly one production deployment runs. Confirm representative production routes after deployment.\n\n## Next\n\n\`WHR-ST2-53-60\`\n`;
write('docs/runbooks/country-pages-45-52-publication-final.md', runbook);

console.log('FINALIZED_COUNTRY_PUBLICATION_45_52 published=52 routes=104 current=WHR-ST2-53-60');
