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

const evidence = JSON.parse(read('docs/runbooks/rendered-preview-53-60-evidence.json'));
if (
  evidence.preview_branch !== 'preview-country-pages-53-60' ||
  evidence.preview_trigger_commit !== '711b621661545e5c3511db08f31b725f8048cc24' ||
  evidence.rendered_check_run_id !== 28361835722 ||
  evidence.artifact_id !== 7947674868 ||
  evidence.errors !== 0 ||
  !evidence.commit_checks?.every((check) => check.status === 'completed' && check.conclusion === 'success')
) throw new Error('rendered-preview evidence is not the approved zero-error result');

const entries = [
  ['53', 'cyprus', 'Published after approved rendered preview and bilingual public-boundary QA; countrywide manual C-level treatment retained.'],
  ['54', 'panama', 'Published after approved rendered preview and bilingual public-boundary QA; Hipódromo Presidente Remón remains the reviewed single-racecourse scope.'],
  ['55', 'kuwait', 'Published after approved rendered preview and bilingual public-boundary QA; app-based link-only calendar treatment retained.'],
  ['56', 'kenya', 'Published after approved rendered preview and bilingual public-boundary QA; Ngong Racecourse remains the reviewed single-racecourse scope.'],
  ['57', 'pakistan', 'Published after approved rendered preview and bilingual public-boundary QA; stale Lahore link-only treatment and incomplete national coverage retained.'],
  ['58', 'ecuador', 'Published after approved rendered preview and bilingual public-boundary QA; manual single-racecourse confirmation retained.'],
  ['59', 'venezuela', 'Published after approved rendered preview and bilingual public-boundary QA; current-calendar rows remain blocked pending a stable public upcoming source.'],
  ['60', 'belgium', 'Published after approved rendered preview and bilingual public-boundary QA; technical rank A remains behind country public ceiling C.'],
];

const trackerPath = 'docs/country-pages/98-country-tracker.tsv';
const trackerLines = read(trackerPath).trimEnd().split(/\r?\n/);
const trackerHeaders = trackerLines[0].split('\t');
const trackerIndex = Object.fromEntries(trackerHeaders.map((name, position) => [name, position]));
const trackerRows = trackerLines.slice(1).map((line) => line.split('\t'));
for (const [deliveryNo, slug, remark] of entries) {
  const row = trackerRows.find((candidate) => candidate[trackerIndex.delivery_no] === deliveryNo);
  if (!row || row[trackerIndex.slug] !== slug) throw new Error(`tracker mismatch: ${deliveryNo}-${slug}`);
  row[trackerIndex.programme_status] = 'published';
  row[trackerIndex.en_route_status] = 'published';
  row[trackerIndex.ja_route_status] = 'published';
  row[trackerIndex.qa_status] = 'passed';
  row[trackerIndex.page_published_at] = '2026-06-29';
  row[trackerIndex.remarks] = remark;
}
write(trackerPath, `${[trackerHeaders.join('\t'), ...trackerRows.map((row) => row.join('\t'))].join('\n')}\n`);

let value = read('START-HERE.md');
value = replaceOnce(value, 'Previous completed Work ID: `WHR-PROFILE-53-60`', 'Previous completed Work ID: `WHR-PUB-53-60`', 'START previous');
value = replaceOnce(value,
  'WHR-PUB-53-60\n```\n\nNext Work ID:\n\n```text\nWHR-ST2-61-68',
  'WHR-ST2-61-68\n```\n\nNext Work ID:\n\n```text\nWHR-NOTE-61-68',
  'START work IDs');
write('START-HERE.md', value);

value = read('docs/project-roadmap.md');
value = replaceOnce(value,
  'Current Work ID: `WHR-PUB-53-60`  \nNext Work ID: `WHR-ST2-61-68`',
  'Current Work ID: `WHR-ST2-61-68`  \nNext Work ID: `WHR-NOTE-61-68`',
  'project header');
value = replaceOnce(value,
  'published country pages:       52\npage_qa:                        8\nprofile_ready:                  0\nnote_reviewed:                  0\nsource_tested:                  0\nnot_started:                   38\ntotal countries/regions:       98\npublished routes:              52 EN + 52 JA = 104',
  'published country pages:       60\npage_qa:                        0\nprofile_ready:                  0\nnote_reviewed:                  0\nsource_tested:                  0\nnot_started:                   38\ntotal countries/regions:       98\npublished routes:              60 EN + 60 JA = 120',
  'project counts');
value = replaceOnce(value,
  '- entries 45-52 are published after the approved rendered preview;\n- entries 53-60 are in publication QA and require one final rendered preview.',
  '- entries 45-52 are published after the approved rendered preview;\n- entries 53-60 are published after the approved rendered preview.',
  'project publication status');
value = replaceOnce(value,
  'Completed: `WHR-ST2-53-60` via PR #326, `WHR-NOTE-53-60` via PR #327, and `WHR-PROFILE-53-60` via PR #328.\n\nCurrent Work ID: `WHR-PUB-53-60`',
  'Completed: `WHR-ST2-53-60` via PR #326, `WHR-NOTE-53-60` via PR #327, `WHR-PROFILE-53-60` via PR #328, and `WHR-PUB-53-60` via PR #329 after rendered-preview approval.\n\nCurrent Work ID: `WHR-ST2-61-68`',
  'project phase 5');
write('docs/project-roadmap.md', value);

value = read('docs/country-pages/programme-roadmap.md');
value = replaceOnce(value,
  'Latest country publication: PR #325 — entries 45-52 approved after rendered preview\nPublication gate: PR #325 — entries 45-52 published after approved rendered preview\nCurrent Work ID: WHR-PUB-53-60\nNext working branch: country-publish-53-60',
  'Latest country publication: PR #329 — entries 53-60 approved after rendered preview\nPublication gate: PR #329 — entries 53-60 published after approved rendered preview\nCurrent Work ID: WHR-ST2-61-68\nNext working branch: source-test-v2-61-68',
  'programme current position');
value = replaceOnce(value, 'Current tracker counts during publication QA 53-60:', 'Current tracker counts after publication 53-60:', 'programme count heading');
value = replaceOnce(value,
  'published:       52\npage_qa:          8\nprofile_ready:    0\nnote_reviewed:    0\nsource_tested:    0\nnot_started:     38',
  'published:       60\npage_qa:          0\nprofile_ready:    0\nnote_reviewed:    0\nsource_tested:    0\nnot_started:     38',
  'programme counts');
value = replaceOnce(value,
  'formally published English routes:   52\nformally published Japanese routes:  52\nformally published total routes:    104\npage-QA English routes:                8\npage-QA Japanese routes:               8\npage-QA total routes:                 16',
  'formally published English routes:   60\nformally published Japanese routes:  60\nformally published total routes:    120\npage-QA English routes:                0\npage-QA Japanese routes:               0\npage-QA total routes:                  0',
  'programme routes');
value = replaceOnce(value,
  'PR #329 runs GitHub publication QA for entries 53-60. One final rendered Cloudflare preview remains required before publication.',
  'PR #329 publishes entries 53-60 after the approved rendered Cloudflare preview. Source Test v2 for entries 61-68 is now active.',
  'programme summary');
value = value.replace(
  '| #329 | publication QA | GitHub QA active; final rendered preview and publication approval pending. |\n| #329 | publication QA | GitHub QA active; final rendered preview and publication approval pending. |',
  '| #329 | publication | Published entries 53-60 after rendered-preview approval. |'
);
value = value.replace(
  '| #329 | publication QA | GitHub QA active; final rendered preview and publication approval pending. |',
 '| #329 | publication | Published entries 53-60 after rendered-preview approval. |'
);
const gate45 = `### PR #325 — entries 45-52

Rendered preview approval:

1. \`preview-country-pages-45-52\` passed live checks for all 16 English/Japanese routes.
2. Norway, Switzerland, Romania, and Slovakia passed English/Japanese desktop and Pixel 7 rendered review.
3. Canonical, hreflang, language switching, official links, empty states, CJK rendering, horizontal overflow, prohibited output, and C-rank column suppression passed.
4. Evidence artifact \`rendered-preview-45-52\` is artifact \`7943936486\` with digest \`sha256:663817f1622d1d8328f042c6a7305f2202001b2290945407b4518a7078dc0014\`.
5. Entries 45-52 are recorded as \`published\` on 2026-06-29.
6. PR #325 must merge without \`[CF-Pages-Skip]`, followed by one production-deployment confirmation.`;
const gate53 = `${gate45}

### PR #329 — entries 53-60

Rendered preview approval:

1. Cloudflare Pages preview deployment \`79eea020-b3d2-4c56-8c93-75cce98f7770\` succeeded from \`preview-country-pages-53-60\`.
2. All 8 English and 8 Japanese routes passed rendered route checks.
3. Cyprus, Kuwait, Venezuela, and Belgium passed English/Japanese desktop 1440x1200 and Pixel 7 412x915 rendered review.
4. Canonical, hreflang, language switching, official links, empty states, CJK rendering, horizontal overflow, media exclusion, and C-rank column suppression passed.
5. Evidence artifact \`rendered-preview-53-60\` is artifact \`7947674868\` with digest \`sha256:df4d7c5250a4f167f86354fc4e0344bf9ec6795a095c2b1f3f6e6c1f1f2ec28d\`; rendered run \`28361835722\` completed with 0 errors.
6. Entries 53-60 are recorded as \`published\` on 2026-06-29.
7. PR #329 must merge without \`[CF-Pages-Skip]\`, followed by one production-deployment confirmation.`;
value = replaceOnce(value, gate45, gate53, 'programme publication gate');
value = replaceOnce(value,
  '| #329 / `WHR-PUB-53-60` | active | GitHub QA active; publish after one approved rendered preview. |',
  '| #329 / `WHR-PUB-53-60` | complete | Published all sixteen routes after approved rendered-preview QA. |',
  'programme wave status');
write('docs/country-pages/programme-roadmap.md', value);

value = read('scripts/check-country-page-programme.mjs');
value = replaceOnce(value,
  "  'norway', 'finland', 'netherlands', 'switzerland', 'poland', 'romania', 'serbia', 'slovakia'\n];",
  "  'norway', 'finland', 'netherlands', 'switzerland', 'poland', 'romania', 'serbia', 'slovakia',\n  'cyprus', 'panama', 'kuwait', 'kenya', 'pakistan', 'ecuador', 'venezuela', 'belgium'\n];",
  'published slugs');
value = replaceOnce(value,
  '{ published: 52, profile_ready: 0, source_tested: 0, note_reviewed: 0, page_qa: 8, not_started: 38 }',
 '{ published: 60, profile_ready: 0, source_tested: 0, note_reviewed: 0, page_qa: 0, not_started: 38 }',
  'programme expected counts');
value = replaceOnce(value,
  "console.log('PROGRAMME_COUNTS: published=52 page_qa=8 profile_ready=0 source_tested=0 note_reviewed=0 not_started=38');",
  "console.log('PROGRAMME_COUNTS: published=60 page_qa=0 profile_ready=0 source_tested=0 note_reviewed=0 not_started=38');",
  'programme count log');
write('scripts/check-country-page-programme.mjs', value);

value = read('scripts/check-country-page-programme-roadmap.mjs');
value = replaceOnce(value,
  'for (const pr of [284, 311, 316, 317, 319, 321, 322, 323, 324, 325, 326, 327, 328, 340]) {',
  'for (const pr of [284, 311, 316, 317, 319, 321, 322, 323, 324, 325, 326, 327, 328, 329, 340]) {',
  'roadmap PR list');
value = replaceOnce(value,
  "  'Publication gate: PR #325',\n  'Current Work ID: WHR-PUB-53-60',\n  'Next working branch: country-publish-53-60',",
  "  'Publication gate: PR #329',\n  'Current Work ID: WHR-ST2-61-68',\n  'Next working branch: source-test-v2-61-68',",
  'roadmap current phrases');
value = replaceOnce(value,
  "  'Latest completed Profile v2 change: PR #328',",
  "  'Latest completed Profile v2 change: PR #328',\n  'Latest country publication: PR #329',",
  'roadmap publication phrase');
value = replaceOnce(value,
  "console.log('KEY_PRS: 284,311,316,317,319,321,322,323,324,325,326,327,328,340');\nconsole.log('CURRENT_WORK: entries 53-60 profile-ready; current Work ID WHR-PUB-53-60');",
  "console.log('KEY_PRS: 284,311,316,317,319,321,322,323,324,325,326,327,328,329,340');\nconsole.log('CURRENT_WORK: entries 53-60 published; current Work ID WHR-ST2-61-68');",
  'roadmap logs');
write('scripts/check-country-page-programme-roadmap.mjs', value);

value = read('scripts/check-calendar-contracts.mjs');
value = replaceOnce(value,
  "[paths.roadmap, roadmapText, ['Current Work ID: `WHR-PUB-53-60`', 'Next Work ID: `WHR-ST2-61-68`']]",
  "[paths.roadmap, roadmapText, ['Current Work ID: `WHR-ST2-61-68`', 'Next Work ID: `WHR-NOTE-61-68`']]",
  'calendar roadmap');
value = replaceOnce(value,
  "[paths.startHere, startHereText, ['WHR-PUB-53-60', 'WHR-ST2-61-68']]",
  "[paths.startHere, startHereText, ['WHR-ST2-61-68', 'WHR-NOTE-61-68']]",
  'calendar start');
value = replaceOnce(value,
  "console.log('CURRENT_WORK_ID: WHR-PUB-53-60');\nconsole.log('NEXT_WORK_ID: WHR-ST2-61-68');",
  "console.log('CURRENT_WORK_ID: WHR-ST2-61-68');\nconsole.log('NEXT_WORK_ID: WHR-NOTE-61-68');",
  'calendar logs');
write('scripts/check-calendar-contracts.mjs', value);

value = read('scripts/check-project-governance-docs.mjs');
value = replaceOnce(value,
  "    'Current Work ID: `WHR-PUB-53-60`',\n    'Next Work ID: `WHR-ST2-61-68`',",
  "    'Current Work ID: `WHR-ST2-61-68`',\n    'Next Work ID: `WHR-NOTE-61-68`',",
  'governance roadmap');
value = replaceOnce(value,
  "  'START-HERE.md': ['WHR-PUB-53-60', 'WHR-ST2-61-68', 'calendar-readiness-registry.json'],",
  "  'START-HERE.md': ['WHR-ST2-61-68', 'WHR-NOTE-61-68', 'calendar-readiness-registry.json'],",
  'governance start');
value = replaceOnce(value,
  "console.log('CURRENT_WORK_ID: WHR-PUB-53-60');\nconsole.log('NEXT_WORK_ID: WHR-ST2-61-68');",
  "console.log('CURRENT_WORK_ID: WHR-ST2-61-68');\nconsole.log('NEXT_WORK_ID: WHR-NOTE-61-68');",
  'governance logs');
write('scripts/check-project-governance-docs.mjs', value);

write('docs/runbooks/country-pages-53-60-publication-final.md', `# Country page publication — entries 53-60

Status: ready for merge after rendered-preview approval  
Work ID: \`WHR-PUB-53-60\`  
PR: #329  
Publication date: 2026-06-29

## Scope

Cyprus, Panama, Kuwait, Kenya, Pakistan, Ecuador, Venezuela, and Belgium are published in English and Japanese. All country-level public ceilings remain C.

## Rendered-preview evidence

- preview branch: \`preview-country-pages-53-60\`
- preview trigger commit: \`711b621661545e5c3511db08f31b725f8048cc24\`
- successful rendered check run: \`28361835722\`
- Cloudflare Pages deployment: \`79eea020-b3d2-4c56-8c93-75cce98f7770\`
- checked routes: 8 English + 8 Japanese
- representative review: Cyprus, Kuwait, Venezuela, and Belgium
- viewports: desktop 1440x1200 and Pixel 7 412x915
- artifact: \`rendered-preview-53-60\` / \`7947674868\`
- digest: \`sha256:df4d7c5250a4f167f86354fc4e0344bf9ec6795a095c2b1f3f6e6c1f1f2ec28d\`
- errors: 0

Canonical URLs, language alternates, H1 count, language switching, official links, empty states, CJK rendering, horizontal overflow, media exclusion, and C-rank time-column suppression passed.

## Boundaries retained

Kuwait and Pakistan remain link-only for current-calendar guidance. Venezuela remains excluded from current-calendar rows until a stable public upcoming source is reviewed. Belgium's technical rank A remains behind country public ceiling C. Panama, Kenya, and Ecuador retain their reviewed racecourse limits. No prohibited detailed programme output is introduced.

## Deployment

Merge PR #329 without \`[CF-Pages-Skip]\` so exactly one production deployment runs. Confirm the Cloudflare production check and representative production routes once after deployment.

## Next

\`WHR-ST2-61-68\`
`);

fs.rmSync(resolve('docs/runbooks/country-pages-53-60-publication-qa.md'), { force: true });
console.log('FINALIZED_PUBLICATION_53_60 published=60 current=WHR-ST2-61-68 next=WHR-NOTE-61-68');
