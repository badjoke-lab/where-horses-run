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
  ['53', 'cyprus', 'Reviewed Profile v2 completed; bilingual routes generated at public ceiling C.'],
  ['54', 'panama', 'Reviewed Profile v2 completed; single-racecourse bilingual routes generated at public ceiling C.'],
  ['55', 'kuwait', 'Reviewed Profile v2 completed; bilingual routes retain app-based link-only calendar treatment.'],
  ['56', 'kenya', 'Reviewed Profile v2 completed; Ngong-only bilingual routes generated at public ceiling C.'],
  ['57', 'pakistan', 'Reviewed Profile v2 completed; bilingual routes retain stale Lahore link-only treatment and incomplete national coverage.'],
  ['58', 'ecuador', 'Reviewed Profile v2 completed; bilingual routes retain manual single-racecourse confirmation.'],
  ['59', 'venezuela', 'Reviewed Profile v2 completed; bilingual routes retain blocked current-calendar treatment.'],
  ['60', 'belgium', 'Reviewed Profile v2 completed; bilingual routes retain technical rank A behind public ceiling C.'],
];

let value = read('src/lib/data.ts');
value = replaceOnce(value,
  "import countryPageCountries4552 from '../../data/static/country-page-countries-45-52.json';",
  "import countryPageCountries4552 from '../../data/static/country-page-countries-45-52.json';\nimport countryPageCountries5360 from '../../data/static/country-page-countries-53-60.json';",
  'country import');
value = replaceOnce(value,
  "import countryProfilesV252Slovakia from '../../data/static/country-profiles-v2-52-slovakia.json';",
  "import countryProfilesV252Slovakia from '../../data/static/country-profiles-v2-52-slovakia.json';\nimport countryProfilesV253Cyprus from '../../data/static/country-profiles-v2-53-cyprus.json';\nimport countryProfilesV254Panama from '../../data/static/country-profiles-v2-54-panama.json';\nimport countryProfilesV255Kuwait from '../../data/static/country-profiles-v2-55-kuwait.json';\nimport countryProfilesV256Kenya from '../../data/static/country-profiles-v2-56-kenya.json';\nimport countryProfilesV257Pakistan from '../../data/static/country-profiles-v2-57-pakistan.json';\nimport countryProfilesV258Ecuador from '../../data/static/country-profiles-v2-58-ecuador.json';\nimport countryProfilesV259Venezuela from '../../data/static/country-profiles-v2-59-venezuela.json';\nimport countryProfilesV260Belgium from '../../data/static/country-profiles-v2-60-belgium.json';",
  'profile imports');
value = replaceOnce(value,
  "import countryPageSources4552 from '../../data/static/country-page-sources-45-52.json';",
  "import countryPageSources4552 from '../../data/static/country-page-sources-45-52.json';\nimport countryPageSources5360 from '../../data/static/country-page-sources-53-60.json';",
  'source import');
value = replaceOnce(value,
  '  ...countryPageCountries3744,\n  ...countryPageCountries4552\n] as const;',
  '  ...countryPageCountries3744,\n  ...countryPageCountries4552,\n  ...countryPageCountries5360\n] as const;',
  'country spread');
value = replaceOnce(value,
  '  ...countryProfilesV250Romania,\n  ...countryProfilesV251Serbia,\n  ...countryProfilesV252Slovakia\n] as const;',
  '  ...countryProfilesV250Romania,\n  ...countryProfilesV251Serbia,\n  ...countryProfilesV252Slovakia,\n  ...countryProfilesV253Cyprus,\n  ...countryProfilesV254Panama,\n  ...countryProfilesV255Kuwait,\n  ...countryProfilesV256Kenya,\n  ...countryProfilesV257Pakistan,\n  ...countryProfilesV258Ecuador,\n  ...countryProfilesV259Venezuela,\n  ...countryProfilesV260Belgium\n] as const;',
  'profile spread');
value = replaceOnce(value,
  '  ...countryPageSources3744,\n  ...countryPageSources4552\n] as const;',
  '  ...countryPageSources3744,\n  ...countryPageSources4552,\n  ...countryPageSources5360\n] as const;',
  'source spread');
write('src/lib/data.ts', value);

const trackerPath = 'docs/country-pages/98-country-tracker.tsv';
const lines = read(trackerPath).trimEnd().split(/\r?\n/);
const headers = lines[0].split('\t');
const index = Object.fromEntries(headers.map((name, position) => [name, position]));
const rows = lines.slice(1).map((line) => line.split('\t'));
for (const [deliveryNo, slug, remark] of entries) {
  const row = rows.find((candidate) => candidate[index.delivery_no] === deliveryNo);
  if (!row || row[index.slug] !== slug) throw new Error(`tracker mismatch: ${deliveryNo}-${slug}`);
  row[index.programme_status] = 'profile_ready';
  row[index.profile_status] = 'reviewed';
  row[index.en_route_status] = 'complete';
  row[index.ja_route_status] = 'complete';
  row[index.qa_status] = 'not_started';
  row[index.profile_last_reviewed] = '2026-06-29';
  row[index.page_published_at] = '';
  row[index.remarks] = remark;
}
write(trackerPath, `${[headers.join('\t'), ...rows.map((row) => row.join('\t'))].join('\n')}\n`);

value = read('START-HERE.md');
value = replaceOnce(value, 'Previous completed Work ID: `WHR-NOTE-53-60`', 'Previous completed Work ID: `WHR-PROFILE-53-60`', 'START-HERE previous');
value = replaceOnce(value,
  'WHR-PROFILE-53-60\n```\n\nNext Work ID:\n\n```text\nWHR-PUB-53-60',
  'WHR-PUB-53-60\n```\n\nNext Work ID:\n\n```text\nWHR-ST2-61-68',
  'START-HERE work IDs');
write('START-HERE.md', value);

value = read('docs/project-roadmap.md');
value = replaceOnce(value,
  'Current Work ID: `WHR-PROFILE-53-60`  \nNext Work ID: `WHR-PUB-53-60`',
  'Current Work ID: `WHR-PUB-53-60`  \nNext Work ID: `WHR-ST2-61-68`',
  'project header');
value = replaceOnce(value,
  'profile_ready:                  0\nnote_reviewed:                  8\nsource_tested:                  0\nnot_started:                   38',
  'profile_ready:                  8\nnote_reviewed:                  0\nsource_tested:                  0\nnot_started:                   38',
  'project counts');
value = replaceOnce(value,
  'Completed: `WHR-ST2-53-60` via PR #326 and `WHR-NOTE-53-60` via PR #327.\n\nCurrent Work ID: `WHR-PROFILE-53-60`',
  'Completed: `WHR-ST2-53-60` via PR #326, `WHR-NOTE-53-60` via PR #327, and `WHR-PROFILE-53-60` via PR #328.\n\nCurrent Work ID: `WHR-PUB-53-60`',
  'project phase 5');
write('docs/project-roadmap.md', value);

value = read('docs/country-pages/programme-roadmap.md');
value = replaceOnce(value,
  'Latest completed reviewed-note change: PR #327 — entries 53-60\nLatest country publication: PR #325 — entries 45-52 approved after rendered preview',
  'Latest completed reviewed-note change: PR #327 — entries 53-60\nLatest completed Profile v2 change: PR #328 — entries 53-60\nLatest country publication: PR #325 — entries 45-52 approved after rendered preview',
  'programme latest');
value = replaceOnce(value,
  'Current Work ID: WHR-PROFILE-53-60\nNext working branch: country-profiles-53-60',
  'Current Work ID: WHR-PUB-53-60\nNext working branch: country-publish-53-60',
  'programme current');
value = replaceOnce(value, 'Current tracker counts after reviewed notes 53-60:', 'Current tracker counts after Profile v2 53-60:', 'programme count heading');
value = replaceOnce(value,
  'profile_ready:    0\nnote_reviewed:    8\nsource_tested:    0\nnot_started:     38',
  'profile_ready:    8\nnote_reviewed:    0\nsource_tested:    0\nnot_started:     38',
  'programme counts');
value = replaceOnce(value,
  'profile-ready English routes:         0\nprofile-ready Japanese routes:        0\nprofile-ready total routes:           0',
  'profile-ready English routes:         8\nprofile-ready Japanese routes:        8\nprofile-ready total routes:          16',
  'programme routes');
value = replaceOnce(value,
  'PR #327 completes reviewed editorial notes for entries 53-60. Profile v2 work for these entries is now active.',
  'PR #328 completes reviewed bilingual Profile v2 records for entries 53-60. QA and publication work for these entries is now active.',
  'programme paragraph');
value = replaceOnce(value,
  '| #327 | reviewed notes | Completed public-safe editorial notes for entries 53-60. |',
  '| #327 | reviewed notes | Completed public-safe editorial notes for entries 53-60. |\n| #328 | Profile v2 | Added reviewed bilingual Profile v2 records and generated complete English and Japanese routes for entries 53-60. |',
  'programme completed table');
value = replaceOnce(value,
  '| #327 / `WHR-NOTE-53-60` | complete | Added eight reviewed editorial notes with explicit scope, limitations, and handoff rules. |\n| `WHR-PROFILE-53-60` | next | Add bilingual Profile v2 records. |\n| `WHR-PUB-53-60` | planned | QA and publish after one rendered preview. |',
  '| #327 / `WHR-NOTE-53-60` | complete | Added eight reviewed editorial notes with explicit scope, limitations, and handoff rules. |\n| #328 / `WHR-PROFILE-53-60` | complete | Added eight reviewed bilingual Profile v2 records and complete English/Japanese routes. |\n| `WHR-PUB-53-60` | next | QA and publish after one rendered preview. |',
  'programme wave table');
write('docs/country-pages/programme-roadmap.md', value);

value = read('scripts/check-country-page-programme.mjs');
value = replaceOnce(value,
  '{ published: 52, profile_ready: 0, source_tested: 0, note_reviewed: 8, page_qa: 0, not_started: 38 }',
  '{ published: 52, profile_ready: 8, source_tested: 0, note_reviewed: 0, page_qa: 0, not_started: 38 }',
  'programme expected counts');
value = replaceOnce(value,
  "console.log('PROGRAMME_COUNTS: published=52 source_tested=0 note_reviewed=8 not_started=38');",
  "console.log('PROGRAMME_COUNTS: published=52 profile_ready=8 source_tested=0 note_reviewed=0 not_started=38');",
  'programme count log');
write('scripts/check-country-page-programme.mjs', value);

value = read('scripts/check-calendar-contracts.mjs');
value = replaceOnce(value,
  "[paths.roadmap, roadmapText, ['Current Work ID: `WHR-PROFILE-53-60`', 'Next Work ID: `WHR-PUB-53-60`']]",
  "[paths.roadmap, roadmapText, ['Current Work ID: `WHR-PUB-53-60`', 'Next Work ID: `WHR-ST2-61-68`']]",
  'calendar roadmap');
value = replaceOnce(value,
  "[paths.startHere, startHereText, ['WHR-PROFILE-53-60', 'WHR-PUB-53-60']]",
  "[paths.startHere, startHereText, ['WHR-PUB-53-60', 'WHR-ST2-61-68']]",
  'calendar start');
value = replaceOnce(value,
  "console.log('CURRENT_WORK_ID: WHR-PROFILE-53-60');\nconsole.log('NEXT_WORK_ID: WHR-PUB-53-60');",
  "console.log('CURRENT_WORK_ID: WHR-PUB-53-60');\nconsole.log('NEXT_WORK_ID: WHR-ST2-61-68');",
  'calendar logs');
write('scripts/check-calendar-contracts.mjs', value);

value = read('scripts/check-project-governance-docs.mjs');
value = replaceOnce(value,
  "'Current Work ID: `WHR-PROFILE-53-60`',\n    'Next Work ID: `WHR-PUB-53-60`',",
  "'Current Work ID: `WHR-PUB-53-60`',\n    'Next Work ID: `WHR-ST2-61-68`',",
  'governance roadmap');
value = replaceOnce(value,
  "'START-HERE.md': ['WHR-PROFILE-53-60', 'WHR-PUB-53-60', 'calendar-readiness-registry.json'],",
  "'START-HERE.md': ['WHR-PUB-53-60', 'WHR-ST2-61-68', 'calendar-readiness-registry.json'],",
  'governance start');
value = replaceOnce(value,
  "console.log('CURRENT_WORK_ID: WHR-PROFILE-53-60');\nconsole.log('NEXT_WORK_ID: WHR-PUB-53-60');",
  "console.log('CURRENT_WORK_ID: WHR-PUB-53-60');\nconsole.log('NEXT_WORK_ID: WHR-ST2-61-68');",
  'governance logs');
write('scripts/check-project-governance-docs.mjs', value);

value = read('scripts/check-country-page-programme-roadmap.mjs');
value = replaceOnce(value,
  'for (const pr of [284, 311, 316, 317, 319, 321, 322, 323, 324, 325, 326, 327, 340]) {',
  'for (const pr of [284, 311, 316, 317, 319, 321, 322, 323, 324, 325, 326, 327, 328, 340]) {',
  'roadmap PR list');
value = replaceOnce(value,
  "'Current Work ID: WHR-PROFILE-53-60',\n  'Next working branch: country-profiles-53-60',\n  'Latest completed Source Test v2 change: PR #326',\n  'Latest completed reviewed-note change: PR #327',",
  "'Current Work ID: WHR-PUB-53-60',\n  'Next working branch: country-publish-53-60',\n  'Latest completed Source Test v2 change: PR #326',\n  'Latest completed reviewed-note change: PR #327',\n  'Latest completed Profile v2 change: PR #328',",
  'roadmap phrases');
value = replaceOnce(value,
  "console.log('KEY_PRS: 284,311,316,317,319,321,322,323,324,325,326,327,340');\nconsole.log('CURRENT_WORK: entries 53-60 note-reviewed; current Work ID WHR-PROFILE-53-60');",
  "console.log('KEY_PRS: 284,311,316,317,319,321,322,323,324,325,326,327,328,340');\nconsole.log('CURRENT_WORK: entries 53-60 profile-ready; current Work ID WHR-PUB-53-60');",
  'roadmap logs');
write('scripts/check-country-page-programme-roadmap.mjs', value);

write('docs/runbooks/country-profiles-53-60.md', `# Country Profile v2 — entries 53-60

Status: complete  
Work ID: \`WHR-PROFILE-53-60\`  
PR: #328  
Deployment: not required

## Scope

Cyprus, Panama, Kuwait, Kenya, Pakistan, Ecuador, Venezuela, and Belgium.

## Result

- 8 country records
- 8 official source records
- 8 reviewed bilingual Profile v2 records
- 16 complete English/Japanese routes
- tracker transition: \`note_reviewed\` to \`profile_ready\`
- every country public display ceiling remains C

## Retained boundaries

- Kuwait and Pakistan remain link-only for current calendar guidance.
- Venezuela remains blocked for current-calendar rows.
- Belgium retains technical rank A behind country public ceiling C.
- Panama, Kenya, and Ecuador remain limited to their reviewed racecourse scope.

## Next

\`WHR-PUB-53-60\`
`);

console.log('MATERIALIZED_COUNTRY_PROFILES_53_60 profile_ready=8 routes=16 current=WHR-PUB-53-60 next=WHR-ST2-61-68');
