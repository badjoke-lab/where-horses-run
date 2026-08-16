import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync('src/styles/v1-mobile-qa.css', 'utf8');
const list = fs.readFileSync('src/components/TimetableMeetingList.astro', 'utf8');
const mobileWorkflow = fs.readFileSync('.github/workflows/v1-mobile-qa.yml', 'utf8');
const gateWorkflow = fs.readFileSync('.github/workflows/m6-mobile-timetable-ux.yml', 'utf8');

for (const marker of [
  '.country-jump-nav a,',
  '.detail-nav a,',
  '.retired-preview__nav a,',
  '.browse-grid summary,',
  '.meeting-row__links a',
  'min-width: 2.75rem',
  'min-height: 2.75rem',
  'display: inline-flex',
  'align-items: center',
  'justify-content: center',
  'padding: 0.45rem',
  '@media (max-width: 720px)',
]) {
  assert.match(css, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `missing mobile timetable UX marker: ${marker}`);
}

assert.doesNotMatch(
  css,
  /\.country-jump-nav a\s*\{[\s\S]*?justify-content:\s*center;[\s\S]*?\}/,
  'country jump touch-target rule must stay consolidated with shared mobile actions',
);

assert.match(list, /group\.records\.map\(\(record\) => \(/, 'meeting row mapping contract changed');
assert.match(list, /<li class="meeting-row">/, 'meeting row markup contract changed');
assert.match(list, /class="meeting-row__links"/, 'meeting action container changed');
assert.match(list, /record\.official_source_url/, 'official source link must remain visible');
assert.match(list, /localizedDetailPath/, 'meeting detail navigation must remain available');
assert.doesNotMatch(list, /race_name|distance_m|surface|course_label/, 'mobile UX pass must not add A+ timetable fields');

assert.match(mobileWorkflow, /'src\/\*\*'/, 'existing browser mobile QA must still run for src changes');
assert.match(mobileWorkflow, /run-v1-mobile-qa-browser\.mjs/);
assert.match(mobileWorkflow, /contents: read/);
assert.doesNotMatch(mobileWorkflow, /contents:\s*write/);

assert.match(gateWorkflow, /npm run build/);
assert.match(gateWorkflow, /check-m6-mobile-timetable-ux\.mjs/);
assert.match(gateWorkflow, /contents: read/);
assert.doesNotMatch(gateWorkflow, /contents:\s*write/);
assert.doesNotMatch(gateWorkflow, /pull-requests:\s*write/);
assert.doesNotMatch(gateWorkflow, /deploy/i);

console.log('M6 mobile timetable UX check passed.');
console.log('- meeting detail and official-source links reuse the existing >=44px shared touch-target contract');
console.log('- duplicate country-jump touch-target declarations are consolidated instead of growing shared CSS');
console.log('- existing meeting-row markup and public timetable boundary remain unchanged');
console.log('- existing full-site mobile browser QA remains the runtime safety gate');
