import fs from 'node:fs';
import {
  classifyUaeEraDetailMeeting,
  parseUaeEraPublicSafeRacecardHtml,
  uaeEraDetailContractV1,
} from './timetable/uae-era-detail-artifact-core.mjs';

const fixturePath = 'data/fixtures/calendar-uae-era-detail-core-fixtures-v1.json';
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const errors = [];
const fail = (message) => errors.push(message);

if (fixture.schema_version !== 'calendar-uae-era-detail-core-fixtures-v1') fail('fixture schema version differs');
if (fixture.work_id !== 'WHR-CAL-UAE-ERA-DETAIL-RECOVERY') fail('fixture Work ID differs');
if (fixture.implementation_unit !== 'UAE-DETAIL-RECOVERY-01') fail('fixture implementation unit differs');
if (!Array.isArray(fixture.fixtures) || fixture.fixtures.length < 4) fail('fixture matrix must contain at least four cases');

const seen = new Set();
for (const entry of fixture.fixtures ?? []) {
  if (seen.has(entry.id)) fail(`duplicate fixture id: ${entry.id}`);
  seen.add(entry.id);
  const observations = [];
  for (const page of entry.pages ?? []) {
    try {
      const observation = parseUaeEraPublicSafeRacecardHtml(page.public_safe_markup, { sourceUrl: page.source_url });
      observations.push(observation);
      if (observation.country_id !== uaeEraDetailContractV1.country_id) fail(`${entry.id}: country differs`);
      if (observation.authority_id !== uaeEraDetailContractV1.authority_id) fail(`${entry.id}: authority differs`);
      if (observation.system_id !== uaeEraDetailContractV1.system_id) fail(`${entry.id}: system differs`);
      if (observation.source_id !== uaeEraDetailContractV1.source_id) fail(`${entry.id}: source differs`);
      if (observation.adapter_id !== uaeEraDetailContractV1.adapter_id) fail(`${entry.id}: adapter differs`);
      if (!observation.racecourse_id) fail(`${entry.id}: racecourse identity missing`);
      if (!observation.post_time_local) fail(`${entry.id}: post time missing`);
      if (observation.distance_m == null) fail(`${entry.id}: distance missing`);
      if (!observation.surface) fail(`${entry.id}: surface missing`);
      for (const forbidden of ['horse', 'jockey', 'trainer', 'odds', 'payout', 'result', 'raw_html', 'source_body']) {
        if (JSON.stringify(observation).toLowerCase().includes(`\"${forbidden}`)) fail(`${entry.id}: forbidden field retained: ${forbidden}`);
      }
    } catch (error) {
      fail(`${entry.id}: parser failed: ${error.message}`);
    }
  }
  const classification = classifyUaeEraDetailMeeting({ observations, meeting_complete: entry.meeting_complete });
  if (classification.rank !== entry.expected_rank) fail(`${entry.id}: rank ${classification.rank} != ${entry.expected_rank}`);
  if (classification.first_race_time_local !== entry.expected_first_time) fail(`${entry.id}: first time differs`);
  if (classification.last_race_time_local !== entry.expected_last_time) fail(`${entry.id}: last time differs`);
  if (['A', 'A+'].includes(classification.rank) && classification.timetable_rows.length !== observations.length) {
    fail(`${entry.id}: complete timetable row count differs`);
  }
}

for (const invalidUrl of [
  'http://emiratesracing.com/racecard/2026-04-10/1/declarations',
  'https://example.com/racecard/2026-04-10/1/declarations',
  'https://emiratesracing.com/news/example',
]) {
  let rejected = false;
  try {
    parseUaeEraPublicSafeRacecardHtml('<main></main>', { sourceUrl: invalidUrl });
  } catch {
    rejected = true;
  }
  if (!rejected) fail(`invalid source URL was accepted: ${invalidUrl}`);
}

if (uaeEraDetailContractV1.public_ceiling !== 'A') fail('UAE public ceiling must remain A');

if (errors.length) {
  console.error(`CALENDAR_UAE_ERA_DETAIL_RECOVERY: failed (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('CALENDAR_UAE_ERA_DETAIL_RECOVERY: pass');
console.log(JSON.stringify({
  fixtures: fixture.fixtures.length,
  ranks: fixture.fixtures.map((entry) => entry.expected_rank),
  official_hostname: uaeEraDetailContractV1.official_hostname,
  public_ceiling: uaeEraDetailContractV1.public_ceiling,
}));
