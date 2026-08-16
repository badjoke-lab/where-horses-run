import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync('src/styles/v1-mobile-qa.css', 'utf8');
const list = fs.readFileSync('src/components/TimetableMeetingList.astro', 'utf8');
const mobileWorkflow = fs.readFileSync('.github/workflows/v1-mobile-qa.yml', 'utf8');
const gateWorkflow = fs.readFileSync('.github/workflows/m6-mobile-timetable-ux.yml', 'utf8');

for (const marker of [
  '@media (max-width: 720px)',
  '.main-content .timetable-date-group .meeting-row__meta',
  'grid-template-columns: repeat(2, minmax(0, 1fr))',
  '.main-content .timetable-date-group .meeting-row__links',
  'grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr))',
  'min-height: 2.75rem',
  'display: inline-flex',
  'white-space: normal',
  '@media (max-width: 420px)',
  'grid-template-columns: minmax(0, 1fr)',
]) {
  assert.match(css, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `missing mobile timetable UX marker: ${marker}`);
}

assert.match(list, /group\.records\.map\(\(record\) => \(/, 'meeting row mapping contract changed');
assert.match(list, /<li class="meeting-row">/, 'meeting row markup contract changed');
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
console.log('- meeting metadata uses two columns at <=720px and one column at <=420px');
console.log('- meeting detail and official-source actions remain at least 44px tall and can wrap');
console.log('- existing meeting-row markup and public timetable boundary remain unchanged');
console.log('- existing full-site mobile browser QA remains the runtime safety gate');
