import assert from 'node:assert/strict';
import fs from 'node:fs';
import { evaluatePublicFreshness } from '../src/lib/timetable/publicFreshnessState.mjs';

const current = evaluatePublicFreshness({
  lastCheckedDate: '2026-08-16',
  referenceDate: '2026-08-16',
});
assert.equal(current.status, 'current');
assert.equal(current.ageDays, 0);

const grace = evaluatePublicFreshness({
  lastCheckedDate: '2026-08-15',
  referenceDate: '2026-08-16',
});
assert.equal(grace.status, 'current');
assert.equal(grace.ageDays, 1);

const stale = evaluatePublicFreshness({
  lastCheckedDate: '2026-08-14',
  referenceDate: '2026-08-16',
});
assert.equal(stale.status, 'stale');
assert.equal(stale.ageDays, 2);

const unknown = evaluatePublicFreshness({
  lastCheckedDate: null,
  referenceDate: '2026-08-16',
});
assert.equal(unknown.status, 'unknown');
assert.equal(unknown.ageDays, null);

assert.throws(
  () => evaluatePublicFreshness({ lastCheckedDate: '2026-02-30', referenceDate: '2026-08-16' }),
  /real calendar date/,
);

const list = fs.readFileSync('src/components/TimetableMeetingList.astro', 'utf8');
assert.match(list, /evaluatePublicFreshness/);
assert.match(list, /group\.records\.map\(\(record\) => \(/);
assert.match(list, /<li class="meeting-row">/);
assert.match(list, /freshnessFor\(record\)\.status === 'stale'/);
assert.match(list, /stale: 'Stale'/);
assert.match(list, /stale: '古い可能性あり'/);
assert.match(list, /record\.official_source_url/);
assert.match(list, /text\.official/);
assert.doesNotMatch(list, /race_name|distance_m|surface|course_label/);

const status = fs.readFileSync('src/components/CalendarDateStatus.astro', 'utf8');
assert.match(status, /stale_generation_with_window_records/);
assert.match(status, /Stale data warning/);
assert.match(status, /データ鮮度警告/);
assert.match(status, /official source/);
assert.match(status, /公式ソース/);

const workflow = fs.readFileSync('.github/workflows/m5-stale-data-warning.yml', 'utf8');
assert.match(workflow, /pull_request:/);
assert.match(workflow, /check-m5-stale-data-warning\.mjs/);
assert.doesNotMatch(workflow, /contents:\s*write/);
assert.doesNotMatch(workflow, /pull-requests:\s*write/);
assert.doesNotMatch(workflow, /deploy/i);

console.log('M5 stale data warning check passed.');
console.log('- source checks 0-1 day old remain current; 2+ days become stale');
console.log('- missing check dates remain explicitly unknown');
console.log('- existing single-row mapping/markup contract is preserved');
console.log('- English/Japanese meeting rows expose freshness without adding timetable detail');
console.log('- stale projection status is explicitly labeled and official-source confirmation remains visible');
