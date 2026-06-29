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
  ['53', 'cyprus'], ['54', 'panama'], ['55', 'kuwait'], ['56', 'kenya'],
  ['57', 'pakistan'], ['58', 'ecuador'], ['59', 'venezuela'], ['60', 'belgium'],
];

let validator = read('scripts/check-country-page-publication-45-52.mjs');
validator = validator.replace(
  /const expected = \[[\s\S]*?\n\];\nconst stageOrder/,
  "const expected = [\n  ['53', 'cyprus'],\n  ['54', 'panama'],\n  ['55', 'kuwait'],\n  ['56', 'kenya'],\n  ['57', 'pakistan'],\n  ['58', 'ecuador'],\n  ['59', 'venezuela'],\n  ['60', 'belgium'],\n];\nconst stageOrder"
);
validator = validator.replaceAll('45_52', '53_60').replaceAll('45-52', '53-60');
validator = validator.replace(
  "if (errors.length) {",
  "if (profiles.get('kuwait')?.schedule?.time_patterns?.includes('official-link-only') !== true) fail('kuwait must retain link-only guidance');\nif (profiles.get('pakistan')?.schedule?.time_patterns?.includes('official-link-only') !== true) fail('pakistan must retain link-only guidance');\nif (!profiles.get('venezuela')?.calendar_guidance_en?.includes('Do not create current meeting rows')) fail('venezuela must retain blocked calendar guidance');\nif (profiles.get('belgium')?.schedule?.time_patterns?.includes('meeting-date-only') !== true) fail('belgium country output must remain C-level');\n\nif (errors.length) {"
);
write('scripts/check-country-page-publication-53-60.mjs', validator);

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
  row[index.remarks] = 'GitHub publication QA active; final rendered Cloudflare preview remains required before publication.';
}
write(trackerPath, `${[headers.join('\t'), ...rows.map((row) => row.join('\t'))].join('\n')}\n`);

let value = read('docs/project-roadmap.md');
value = replaceOnce(value,
  'published country pages:       52\nprofile_ready:                  8\nnote_reviewed:                  0\nsource_tested:                  0\nnot_started:                   38',
  'published country pages:       52\npage_qa:                        8\nprofile_ready:                  0\nnote_reviewed:                  0\nsource_tested:                  0\nnot_started:                   38',
  'project counts');
value = replaceOnce(value,
  '- entries 45-52 are published after the approved rendered preview.',
  '- entries 45-52 are published after the approved rendered preview;\n- entries 53-60 are in publication QA and require one final rendered preview.',
  'project publication debt');
write('docs/project-roadmap.md', value);

value = read('docs/country-pages/programme-roadmap.md');
value = replaceOnce(value, 'Current tracker counts after Profile v2 53-60:', 'Current tracker counts during publication QA 53-60:', 'programme count heading');
value = replaceOnce(value,
  'published:       52\nprofile_ready:    8\nnote_reviewed:    0\nsource_tested:    0\nnot_started:     38',
  'published:       52\npage_qa:          8\nprofile_ready:    0\nnote_reviewed:    0\nsource_tested:    0\nnot_started:     38',
  'programme counts');
value = replaceOnce(value,
  'profile-ready English routes:         8\nprofile-ready Japanese routes:        8\nprofile-ready total routes:          16',
  'page-QA English routes:                8\npage-QA Japanese routes:               8\npage-QA total routes:                 16',
  'programme routes');
value = replaceOnce(value,
  'PR #328 completes reviewed bilingual Profile v2 records for entries 53-60. QA and publication work for these entries is now active.',
  'PR #329 runs GitHub publication QA for entries 53-60. One final rendered Cloudflare preview remains required before publication.',
  'programme paragraph');
value = replaceOnce(value,
  '| #328 | Profile v2 | Added reviewed bilingual Profile v2 records and generated complete English and Japanese routes for entries 53-60. |',
  '| #328 | Profile v2 | Added reviewed bilingual Profile v2 records and generated complete English and Japanese routes for entries 53-60. |\n| #329 | publication QA | GitHub QA active; final rendered preview and publication approval pending. |',
  'programme completed table');
value = replaceOnce(value,
  '| #328 / `WHR-PROFILE-53-60` | complete | Added eight reviewed bilingual Profile v2 records and complete English/Japanese routes. |\n| `WHR-PUB-53-60` | next | QA and publish after one rendered preview. |',
  '| #328 / `WHR-PROFILE-53-60` | complete | Added eight reviewed bilingual Profile v2 records and complete English/Japanese routes. |\n| #329 / `WHR-PUB-53-60` | active | GitHub QA active; publish after one approved rendered preview. |',
  'programme wave table');
write('docs/country-pages/programme-roadmap.md', value);

value = read('scripts/check-country-page-programme.mjs');
value = replaceOnce(value,
  '{ published: 52, profile_ready: 8, source_tested: 0, note_reviewed: 0, page_qa: 0, not_started: 38 }',
  '{ published: 52, profile_ready: 0, source_tested: 0, note_reviewed: 0, page_qa: 8, not_started: 38 }',
  'programme expected counts');
value = replaceOnce(value,
  "console.log('PROGRAMME_COUNTS: published=52 profile_ready=8 source_tested=0 note_reviewed=0 not_started=38');",
  "console.log('PROGRAMME_COUNTS: published=52 page_qa=8 profile_ready=0 source_tested=0 note_reviewed=0 not_started=38');",
  'programme count log');
write('scripts/check-country-page-programme.mjs', value);

value = read('scripts/check-country-page-programme-roadmap.mjs');
value = replaceOnce(value,
  "  ['published', counts.published ?? 0],\n  ['profile_ready', counts.profile_ready ?? 0],",
  "  ['published', counts.published ?? 0],\n  ['page_qa', counts.page_qa ?? 0],\n  ['profile_ready', counts.profile_ready ?? 0],",
  'roadmap count list');
value = replaceOnce(value,
  "const alwaysRequired = new Set(['published', 'profile_ready', 'not_started', 'total']);",
  "const alwaysRequired = new Set(['published', 'page_qa', 'profile_ready', 'not_started', 'total']);",
  'roadmap required counts');
write('scripts/check-country-page-programme-roadmap.mjs', value);

console.log('MATERIALIZED_PUBLICATION_QA_53_60 page_qa=8 preview_required=true');
