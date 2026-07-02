import { readFileSync } from 'node:fs';
import path from 'node:path';
import { buildPublicProjectionV1 } from './timetable/pipeline-v1/public-projection-core.mjs';
import { loadCalendarReadinessV1 } from './timetable/load-calendar-readiness.mjs';

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const readinessRegistry = loadCalendarReadinessV1(root);
const jraReadiness = readinessRegistry.records.find((record) => record.readiness_id === 'japan--japan-jra-system--jra-programme');
assert(jraReadiness, 'missing amended JRA readiness record');
assert(jraReadiness.public_ceiling === 'A+', 'JRA public ceiling must be A+ after amendment');
for (const field of ['race_name', 'distance', 'surface', 'course']) {
  assert(jraReadiness.confirmed_fields?.[field] === true, `JRA confirmed field ${field} must be enabled`);
}

const result = buildPublicProjectionV1({
  canonicalMeetings: readJson('data/generated/timetable/canonical/meetings.json'),
  canonicalDetails: readJson('data/generated/timetable/canonical/meeting-details.json'),
  policyData: readJson('src/data/publicationDisplayPolicies.json'),
  readinessRegistry,
  sourceAliases: readJson('data/static/timetable-source-aliases-v1.json'),
});

const meetingId = 'jra-hanshin-racecourse-2026-06-06';
const decision = result.audit.decisions.find((item) => item.meeting_id === meetingId);
const detail = result.meetingDetailsDataset.details.find((item) => item.meeting_id === meetingId);
assert(decision, 'missing JRA projection decision fixture');
assert(decision.effective_public_rank === 'A+', 'JRA fixture must project at A+');
assert(detail, 'missing JRA A+ detail fixture');
assert(detail.show_race_name && detail.show_distance && detail.show_surface && detail.show_course, 'JRA A+ detail flags are incomplete');
assert(detail.timetable_rows.every((row) =>
  'race_name' in row && 'distance_m' in row && 'surface' in row && 'course_label' in row
), 'JRA A+ timetable rows are incomplete');

console.log('JRA_READINESS_AMENDMENT: pass');
