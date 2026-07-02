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

const decision = result.audit.decisions.find((item) =>
  item.readiness_id === jraReadiness.readiness_id &&
  item.effective_public_rank === 'A+' &&
  result.meetingDetailsDataset.details.some((detail) => detail.meeting_id === item.meeting_id)
);
const detail = decision
  ? result.meetingDetailsDataset.details.find((item) => item.meeting_id === decision.meeting_id)
  : null;
assert(decision, 'missing current JRA A+ projection decision fixture');
assert(decision.max_public_rank === 'A+', 'JRA fixture maximum public rank must be A+');
assert(decision.effective_public_rank === 'A+', 'JRA fixture must project at A+');
assert(detail, 'missing current JRA A+ detail fixture');
assert(detail.show_race_name && detail.show_distance && detail.show_surface && detail.show_course, 'JRA A+ detail flags are incomplete');
assert(detail.timetable_rows.length > 0, 'JRA A+ detail must contain timetable rows');
assert(detail.timetable_rows.every((row) =>
  'race_name' in row && row.race_name &&
  Number.isInteger(row.distance_m) && row.distance_m > 0 &&
  'surface' in row && row.surface &&
  'course_label' in row && row.course_label
), 'JRA A+ timetable rows are incomplete');

console.log(`JRA_READINESS_AMENDMENT: pass meeting=${decision.meeting_id} rows=${detail.timetable_rows.length}`);
