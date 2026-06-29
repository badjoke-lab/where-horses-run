import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const resolve = (file) => path.join(root, file);
const read = (file) => fs.readFileSync(resolve(file), 'utf8');
const write = (file, value) => fs.writeFileSync(resolve(file), value);
const replaceOnce = (text, before, after, label) => {
  if (text.includes(after) && !text.includes(before)) return text;
  const count = text.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one occurrence, found ${count}`);
  return text.replace(before, after);
};

let validator = read('scripts/check-country-page-publication-53-60.mjs');
validator = validator.replace(
  /const expected = \[[\s\S]*?\n\];\nconst stageOrder/,
  "const expected = [\n  ['61', 'slovenia'],\n  ['62', 'croatia'],\n  ['63', 'dominican-republic'],\n  ['64', 'tunisia'],\n  ['65', 'lebanon'],\n  ['66', 'libya'],\n  ['67', 'mainland-china'],\n  ['68', 'indonesia'],\n];\nconst stageOrder"
);
validator = validator.replaceAll('53_60', '61_68').replaceAll('53-60', '61-68');
validator = validator.replace(
  "if (profiles.get('kuwait')?.schedule?.time_patterns?.includes('official-link-only') !== true) fail('kuwait must retain link-only guidance');\nif (profiles.get('pakistan')?.schedule?.time_patterns?.includes('official-link-only') !== true) fail('pakistan must retain link-only guidance');\nif (!profiles.get('venezuela')?.calendar_guidance_en?.includes('Do not create current meeting rows')) fail('venezuela must retain blocked calendar guidance');\nif (profiles.get('belgium')?.schedule?.time_patterns?.includes('meeting-date-only') !== true) fail('belgium country output must remain C-level');",
  "for (const slug of ['slovenia', 'lebanon', 'libya']) {\n  if (profiles.get(slug)?.schedule?.time_patterns?.includes('official-link-only') !== true) fail(`${slug} must retain link-only guidance`);\n}\nfor (const slug of ['croatia', 'dominican-republic', 'tunisia', 'indonesia']) {\n  if (profiles.get(slug)?.schedule?.time_patterns?.includes('meeting-date-only') !== true) fail(`${slug} must retain meeting-date-only guidance`);\n}\nif (!profiles.get('mainland-china')?.calendar_guidance_en?.includes('Do not create current meeting rows')) fail('mainland-china must retain current-calendar hold guidance');"
);
write('scripts/check-country-page-publication-61-68.mjs', validator);

const entries = [
  ['61', 'slovenia'], ['62', 'croatia'], ['63', 'dominican-republic'], ['64', 'tunisia'],
  ['65', 'lebanon'], ['66', 'libya'], ['67', 'mainland-china'], ['68', 'indonesia'],
];
const trackerPath = 'docs/country-pages/98-country-tracker.tsv';
const lines = read(trackerPath).trimEnd().split(/\r?\n/);
const headers = lines[0].split('\t');
const index = Object.fromEntries(headers.map((name, position) => [name, position]));
const rows = lines.slice(1).map((line) => line.split('\t'));
for (const [deliveryNo, slug] of entries) {
  const row = rows.find((candidate) => candidate[index.delivery_no] === deliveryNo);
  if (!row || row[index.slug] !== slug) throw new Error(`tracker mismatch: ${deliveryNo}-${slug}`);
  row[index.programme_status] = 'page_qa';
  row[index.en_route_status] = 'complete';
  row[index.ja_route_status] = 'complete';
  row[index.qa_status] = 'pending';
  row[index.page_published_at] = '';
  row[index.remarks] = 'GitHub publication QA active; one final rendered preview remains required before publication.';
}
write(trackerPath, `${[headers.join('\t'), ...rows.map((row) => row.join('\t'))].join('\n')}\n`);

let value = read('docs/project-roadmap.md');
value = replaceOnce(value,
  'published country pages:       60\npage_qa:                        0\nprofile_ready:                  8\nnote_reviewed:                  0',
  'published country pages:       60\npage_qa:                        8\nprofile_ready:                  0\nnote_reviewed:                  0',
  'project counts');
value = replaceOnce(value,
  '- entries 53-60 are published after the approved rendered preview.',
  '- entries 53-60 are published after the approved rendered preview;\n- entries 61-68 are in publication QA and require one final rendered preview.',
  'project publication state');
write('docs/project-roadmap.md', value);

value = read('docs/country-pages/programme-roadmap.md');
value = replaceOnce(value, 'Current tracker counts after Profile v2 61-68:', 'Current tracker counts during publication QA 61-68:', 'programme heading');
value = replaceOnce(value,
  'page_qa:          0\nprofile_ready:    8\nnote_reviewed:    0',
  'page_qa:          8\nprofile_ready:    0\nnote_reviewed:    0',
  'programme counts');
value = replaceOnce(value,
  'page-QA English routes:                0\npage-QA Japanese routes:               0\npage-QA total routes:                  0\nprofile-ready English routes:           8\nprofile-ready Japanese routes:          8\nprofile-ready total routes:            16',
  'page-QA English routes:                8\npage-QA Japanese routes:               8\npage-QA total routes:                  16\nprofile-ready English routes:           0\nprofile-ready Japanese routes:          0\nprofile-ready total routes:             0',
  'programme routes');
value = replaceOnce(value,
  'PR #332 completes reviewed bilingual Profile v2 records for entries 61-68. QA and publication work for these entries is now active.',
  'PR #333 runs GitHub publication QA for entries 61-68. One final rendered preview remains required before publication.',
  'programme summary');
value = replaceOnce(value,
  '| #332 | Profile v2 | Added reviewed bilingual Profile v2 records and complete English/Japanese routes for entries 61-68. |',
  '| #332 | Profile v2 | Added reviewed bilingual Profile v2 records and complete English/Japanese routes for entries 61-68. |\n| #333 | publication QA | GitHub QA active; rendered preview and publication approval pending. |',
  'completed table');
value = replaceOnce(value,
  '| #332 / `WHR-PROFILE-61-68` | complete | Added eight reviewed bilingual Profile v2 records and complete English/Japanese routes. |\n| `WHR-PUB-61-68` | next | QA and publish after one rendered preview. |',
  '| #332 / `WHR-PROFILE-61-68` | complete | Added eight reviewed bilingual Profile v2 records and complete English/Japanese routes. |\n| #333 / `WHR-PUB-61-68` | active | GitHub QA active; publish after one approved rendered preview. |',
  'wave status');
write('docs/country-pages/programme-roadmap.md', value);

value = read('scripts/check-country-page-programme.mjs');
value = replaceOnce(value,
  '{ published: 60, profile_ready: 8, source_tested: 0, note_reviewed: 0, page_qa: 0, not_started: 30 }',
  '{ published: 60, profile_ready: 0, source_tested: 0, note_reviewed: 0, page_qa: 8, not_started: 30 }',
  'programme counts');
value = replaceOnce(value,
  "console.log('PROGRAMME_COUNTS: published=60 page_qa=0 profile_ready=8 source_tested=0 note_reviewed=0 not_started=30');",
  "console.log('PROGRAMME_COUNTS: published=60 page_qa=8 profile_ready=0 source_tested=0 note_reviewed=0 not_started=30');",
  'programme log');
write('scripts/check-country-page-programme.mjs', value);

value = read('scripts/check-country-page-programme-roadmap.mjs');
value = replaceOnce(value,
  'for (const pr of [284, 311, 316, 317, 319, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 340]) {',
  'for (const pr of [284, 311, 316, 317, 319, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 340]) {',
  'roadmap PRs');
value = replaceOnce(value,
  "console.log('KEY_PRS: 284,311,316,317,319,321,322,323,324,325,326,327,328,329,330,331,332,340');\nconsole.log('CURRENT_WORK: entries 61-68 profile-ready; current Work ID WHR-PUB-61-68');",
  "console.log('KEY_PRS: 284,311,316,317,319,321,322,323,324,325,326,327,328,329,330,331,332,333,340');\nconsole.log('CURRENT_WORK: entries 61-68 in page QA; current Work ID WHR-PUB-61-68');",
  'roadmap logs');
write('scripts/check-country-page-programme-roadmap.mjs', value);

console.log('APPLIED_PUBLICATION_QA_61_68 page_qa=8');
