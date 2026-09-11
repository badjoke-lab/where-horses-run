import assert from 'node:assert/strict';
import fs from 'node:fs';
import { deriveBestAvailableRank } from './timetable/best-available-rank.mjs';
import { projectPublicTimetableRows } from './timetable/public-detail-projection.mjs';

const allowAll = {
  detail_fields: {
    show_race_name: true,
    show_distance: true,
    show_surface: true,
    show_course: true,
  },
};

const baseRows = [
  { label: 'Race 1', post_time_local: '12:10', race_name: 'Race One', distance_m: 1200, surface: 'Turf', course_label: 'Outer' },
  { label: 'Race 2', post_time_local: '12:40', race_name: 'Race Two', distance_m: 1600, surface: 'Turf', course_label: 'Inner' },
];

assert.equal(deriveBestAvailableRank({}, baseRows), 'A+', 'complete programme rows must remain A+');
let projection = projectPublicTimetableRows(baseRows, allowAll);
assert.deepEqual(projection.rows, baseRows, 'A+ projection must preserve all policy-approved fields');

const nameMissing = baseRows.map(({ race_name, ...row }) => row);
assert.equal(deriveBestAvailableRank({}, nameMissing), 'A', 'missing race names must reduce evidence rank to A');
projection = projectPublicTimetableRows(nameMissing, allowAll);
assert.equal(projection.rows[0].distance_m, 1200, 'A projection must retain verified distance when race name is absent');
assert.equal(projection.rows[0].surface, 'Turf', 'A projection must retain verified surface when race name is absent');
assert.equal(projection.rows[0].course_label, 'Outer', 'A projection must retain verified course when race name is absent');
assert.ok(!('race_name' in projection.rows[0]), 'missing race name must not be fabricated');

const distanceMissing = baseRows.map(({ distance_m, ...row }) => row);
assert.equal(deriveBestAvailableRank({}, distanceMissing), 'A', 'missing distance must reduce evidence rank to A');
projection = projectPublicTimetableRows(distanceMissing, allowAll);
assert.equal(projection.rows[0].race_name, 'Race One', 'A projection must retain verified race name when distance is absent');
assert.equal(projection.rows[0].surface, 'Turf', 'A projection must retain verified surface when distance is absent');
assert.equal(projection.rows[0].course_label, 'Outer', 'A projection must retain verified course when distance is absent');
assert.ok(!('distance_m' in projection.rows[0]), 'missing distance must not be fabricated');

const oneNameMissing = [baseRows[0], { ...baseRows[1], race_name: undefined }];
assert.equal(deriveBestAvailableRank({}, oneNameMissing), 'A', 'one incomplete row must keep the meeting at A');
projection = projectPublicTimetableRows(oneNameMissing, allowAll);
assert.equal(projection.rows[0].race_name, 'Race One', 'present sibling-row race name must survive an incomplete meeting');
assert.ok(!('race_name' in projection.rows[1]), 'only the missing row should omit race name');
assert.equal(projection.rows[1].distance_m, 1600, 'other rich fields on the incomplete row must survive');

const timeOnly = baseRows.map(({ label, post_time_local }) => ({ label, post_time_local }));
assert.equal(deriveBestAvailableRank({}, timeOnly), 'A', 'complete time rows without richer fields remain A');
projection = projectPublicTimetableRows(timeOnly, allowAll);
assert.deepEqual(projection.rows, timeOnly, 'time-only A projection must not fabricate richer fields');

const denyDistance = {
  detail_fields: {
    show_race_name: true,
    show_distance: false,
    show_surface: true,
    show_course: true,
  },
};
projection = projectPublicTimetableRows(baseRows, denyDistance);
assert.equal(projection.rows[0].race_name, 'Race One');
assert.ok(!('distance_m' in projection.rows[0]), 'publication policy must be able to deny one canonical field independently');
assert.equal(projection.rows[0].surface, 'Turf');
assert.equal(projection.rows[0].course_label, 'Outer');

const policyText = fs.readFileSync('src/data/publicationDisplayPolicies.json', 'utf8');
assert.match(policyText, /"detail_fields"/, 'publication policy must use rank-independent detail_fields');
assert.doesNotMatch(policyText, /"a_plus_fields"/, 'deprecated a_plus_fields policy key must not remain in canonical policy data');

const applyText = fs.readFileSync('scripts/timetable/apply-official-rolling-observations.mjs', 'utf8');
assert.match(applyText, /projectPublicTimetableRows/, 'official observation application must use the tested field projection helper');
assert.doesNotMatch(applyText, /const showPlus = listRow\.effective_public_rank === 'A\+'/, 'A+ must not gate all richer field publication');

const bootstrapText = fs.readFileSync('src/components/CalendarRuntimeBootstrap.astro', 'utf8');
assert.match(bootstrapText, /params\.get\('diag'\) === 'calendar'/, 'diagnostics loader must be gated by ?diag=calendar');
assert.match(bootstrapText, /calendar-diagnostics\.js/, 'diagnostics query must load the operator diagnostics renderer');

const diagnosticsText = fs.readFileSync('public/calendar-diagnostics.js', 'utf8');
assert.match(diagnosticsText, /Canonical/, 'diagnostics must display canonical coverage');
assert.match(diagnosticsText, /Public/, 'diagnostics must display public coverage');
assert.match(diagnosticsText, /disposition/, 'diagnostics must surface acquisition disposition');

const endpointText = fs.readFileSync('src/pages/calendar/diagnostics.json.ts', 'utf8');
assert.match(endpointText, /canonical: coverage/, 'diagnostics endpoint must aggregate canonical coverage');
assert.match(endpointText, /public: coverage/, 'diagnostics endpoint must aggregate public coverage');
assert.doesNotMatch(endpointText, /timetable_rows:\s*canonicalDetail/, 'diagnostics endpoint must not expose canonical timetable rows directly');

console.log('CALENDAR_FIELD_PUBLICATION_DIAGNOSTICS: pass');
console.log('PARTIAL_A_FIELD_PROJECTION_CASES: 5');
