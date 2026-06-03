import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-136-hkjc-bplus-route-verification] ${message}`);
  process.exit(1);
}

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) fail(`Missing file: ${relativePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

const route = readJson('data/generated/timetable/pr-136-hkjc-bplus-route-verification.json');
const notes = read('PR-136.md');

if (route.schema_version !== 'pr-136-hkjc-bplus-route-verification-v0') fail('Unexpected schema version.');
if (route.month !== '2026-06') fail('Unexpected month.');
if (route.system?.country_id !== 'hong-kong') fail('Unexpected country_id.');
if (route.system?.group_id !== 'hkjc') fail('Unexpected group_id.');
if (route.system?.current_rank !== 'C') fail('HKJC must remain C in this route verification PR.');
if (route.system?.target_rank !== 'B+') fail('HKJC target rank must be B+.');
if (route.system?.time_zone !== 'Asia/Hong_Kong') fail('HKJC time_zone must be Asia/Hong_Kong.');

if (!route.official_sources?.fixture_source_url?.startsWith('https://racing.hkjc.com/')) fail('Fixture source must be official HKJC URL.');
if (!route.official_sources?.racecard_source_url?.startsWith('https://racing.hkjc.com/')) fail('Racecard source must be official HKJC URL.');

const meetings = route.observed_june_2026_meetings_from_fixture_source ?? [];
if (meetings.length !== 7) fail(`Expected 7 HKJC June 2026 meetings, got ${meetings.length}.`);
for (const meeting of meetings) {
  if (!meeting.meeting_date?.startsWith('2026-06-')) fail('Meeting date must be in June 2026.');
  if (!['Happy Valley', 'Sha Tin'].includes(meeting.racecourse)) fail(`Unexpected racecourse: ${meeting.racecourse}`);
  if (!['HV', 'ST'].includes(meeting.fixture_code)) fail(`Unexpected fixture code: ${meeting.fixture_code}`);
}

if (route.route_assessment?.fixture_route_status !== 'verified_for_C') fail('Fixture route status must be verified_for_C.');
if (route.route_assessment?.racecard_route_status !== 'promising_for_Bplus_but_not_promotion_ready') fail('Racecard route must not be promotion-ready yet.');
if (!route.route_assessment?.reason_not_promotion_ready?.includes('date-addressable')) fail('Missing date-addressable blocker reason.');

const requiredBeforePromotion = route.route_assessment?.required_before_promotion ?? [];
for (const required of ['stable date-addressable', 'race_number', 'first_race_time', 'last_race_time', 'time_source_url']) {
  if (!requiredBeforePromotion.some((item) => item.includes(required))) fail(`Missing required promotion gate: ${required}`);
}

if (route.promotion_decision?.promote_in_this_pr !== false) fail('PR-136 must not promote records.');
if (!route.promotion_decision?.do_not_infer?.includes('first_race_time')) fail('first_race_time must not be inferred.');
if (!route.promotion_decision?.do_not_infer?.includes('last_race_time')) fail('last_race_time must not be inferred.');
if (!route.promotion_decision?.do_not_infer?.includes('race_count')) fail('race_count must not be inferred.');
if (!route.promotion_decision?.last_race_time_definition?.includes('not meeting_end_time')) fail('last_race_time definition must reject meeting_end_time.');

const requiredNoteSnippets = [
  'This PR records route evidence only. It does not promote any records.',
  'HKJC remains C in this PR.',
  'stable date-addressable HKJC racecard URL or payload',
  'time_zone = Asia/Hong_Kong',
  'not meeting end time',
  'PR-137 should inspect HKJC racecard network/date parameters'
];

for (const snippet of requiredNoteSnippets) {
  if (!notes.includes(snippet)) fail(`PR note missing required snippet: ${snippet}`);
}

console.log(`[pr-136-hkjc-bplus-route-verification] PASS ${meetings.length} HKJC meetings / no promotion`);
