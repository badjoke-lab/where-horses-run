import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));

const readiness = readJson('data/static/calendar-readiness-registry.json');
const policies = readJson('src/data/publicationDisplayPolicies.json');
const cCandidate = readJson('data/candidates/banei-current-window-c-schedule-approved.json');
const aPlusCandidate = readJson('data/candidates/banei-current-window-a-plus-approved.json');
const publicMeetings = readJson('data/generated/timetable/public/meeting-list.json');
const publicDetails = readJson('data/generated/timetable/public/meeting-details.json');

const scheduleReadiness = readiness.records.find((record) => record.authority_source_key === 'japan/banei-tokachi/banei-official-schedule');
const detailReadiness = readiness.records.find((record) => record.authority_source_key === 'japan/banei-tokachi/nar-banei-race-list-deba-table');
if (!scheduleReadiness) fail('Banei schedule Readiness missing.');
else {
  if (scheduleReadiness.technical_rank !== 'C' || scheduleReadiness.public_ceiling !== 'C') fail('Banei schedule Readiness rank boundary differs.');
  if (scheduleReadiness.readiness !== 'prototype_ready' || scheduleReadiness.automation_mode !== 'semi_automatic') fail('Banei schedule Readiness applied state differs.');
  if (!scheduleReadiness.racecourse_ids?.includes('obihiro-racecourse')) fail('Banei schedule Readiness racecourse scope differs.');
}
if (!detailReadiness) fail('Banei detail Readiness missing.');
else {
  if (detailReadiness.technical_rank !== 'A+' || detailReadiness.public_ceiling !== 'A+') fail('Banei detail Readiness rank boundary differs.');
  if (detailReadiness.readiness !== 'prototype_ready' || detailReadiness.automation_mode !== 'semi_automatic') fail('Banei detail Readiness operating state differs.');
}

const policy = policies.policies.find((entry) => entry.id === 'banei-reviewed-a-plus');
if (!policy || policy.max_public_rank !== 'A+') fail('Banei A+ publication policy differs.');
for (const key of ['show_race_name', 'show_distance', 'show_surface', 'show_course']) {
  if (policy?.a_plus_fields?.[key] !== true) fail(`Banei A+ policy field disabled: ${key}`);
}

if (cCandidate.schema_version !== 'timetable-candidate-v1' || cCandidate.records?.length !== 12) fail('Banei approved C candidate set differs.');
if (aPlusCandidate.schema_version !== 'timetable-candidate-v1' || aPlusCandidate.records?.length !== 1) fail('Banei approved A+ candidate set differs.');

const meetingById = new Map(publicMeetings.meetings.map((record) => [record.meeting_id, record]));
const detailById = new Map(publicDetails.details.map((record) => [record.meeting_id, record]));
for (const record of cCandidate.records ?? []) {
  const meeting = meetingById.get(record.meeting_id);
  if (!meeting || meeting.effective_public_rank !== 'C') fail(`${record.meeting_id}: public C row missing.`);
  else if (meeting.detail_path !== null || meeting.first_race_time_local !== null || meeting.last_race_time_local !== null) fail(`${record.meeting_id}: C list boundary differs.`);
  if (detailById.has(record.meeting_id)) fail(`${record.meeting_id}: C detail leaked.`);
}

const approvedAPlus = aPlusCandidate.records?.[0];
const aPlusMeeting = approvedAPlus ? meetingById.get(approvedAPlus.meeting_id) : null;
const aPlusDetail = approvedAPlus ? detailById.get(approvedAPlus.meeting_id) : null;
if (!aPlusMeeting || aPlusMeeting.effective_public_rank !== 'A+' || !aPlusMeeting.detail_path) fail('Banei public A+ list row missing.');
if (!aPlusDetail || aPlusDetail.effective_public_rank !== 'A+' || aPlusDetail.timetable_rows?.length !== 12) fail('Banei public A+ detail differs.');
for (const row of aPlusDetail?.timetable_rows ?? []) {
  for (const key of ['label', 'post_time_local', 'race_name', 'distance_m', 'surface', 'course_label']) {
    if (row[key] === undefined || row[key] === null || row[key] === '') fail(`Banei A+ row missing ${key}.`);
  }
}

const serialized = JSON.stringify({ meetings: [...meetingById.values()].filter((record) => record.authority_id === 'banei-tokachi'), detail: aPlusDetail }).toLowerCase();
for (const forbidden of ['horse_name', 'jockey_name', 'trainer_name', 'odds', 'payout', 'prediction', 'raw_html', 'source_body', 'stream_url']) {
  if (serialized.includes(`"${forbidden}"`)) fail(`Forbidden public key present: ${forbidden}`);
}

if (errors.length) {
  console.error(`CALENDAR_BANEI_BILINGUAL_PUBLIC_DISPLAY_QA: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_BANEI_BILINGUAL_PUBLIC_DISPLAY_QA: pass');
console.log('BANEI_PUBLIC_STATE: A+=1,C=12,A+_ROWS=12');
