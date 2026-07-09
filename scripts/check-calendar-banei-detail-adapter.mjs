import fs from 'node:fs';
import path from 'node:path';
import {
  baneiDebaTableUrl,
  baneiDetailV1Contract,
  baneiRaceListUrl,
  completeBaneiAPlusMeeting,
  continuousRaceNumbers,
  discoverBaneiRaceNumbers,
  parseBaneiDebaMetadata,
  parseBaneiRaceList,
} from './timetable/banei-detail-core.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const date = '2026-07-04';
const listHtml = `
<html><body><table>
<tr>
  <td>1R</td><td>14:30</td>
  <td><a href="/KeibaWeb/TodayRaceInfo/DebaTable?k_raceNo=1&amp;k_babaCode=3&amp;k_raceDate=2026%2F07%2F04">Fixture Banei Race One</a></td>
  <td>直200m</td>
</tr>
<tr>
  <td>2R</td><td>15:00</td>
  <td><a href="/KeibaWeb/TodayRaceInfo/DebaTable?k_raceNo=2&amp;k_babaCode=3&amp;k_raceDate=2026%2F07%2F04">Fixture Banei Race Two</a></td>
  <td>直200ｍ</td>
</tr>
</table></body></html>
`;
const detailHtml = '<html><body><div>ダート 200ｍ（直） 天候：晴 馬場：0.9</div></body></html>';

if (baneiDetailV1Contract.venue_code !== '3') fail('Banei venue code contract differs.');
if (baneiDetailV1Contract.adapter_id !== 'banei-nar-race-list-detail-v1') fail('Banei adapter ID differs.');
if (baneiDetailV1Contract.source_id !== 'nar-banei-race-list-deba-table') fail('Banei source ID differs.');
if (baneiDetailV1Contract.course_label !== 'Banei Straight Course') fail('Banei course label contract differs.');

const listUrl = baneiRaceListUrl(date);
if (!listUrl.startsWith('https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList?')) fail('Banei RaceList URL path differs.');
if (!listUrl.includes('k_babaCode=3')) fail('Banei RaceList venue code differs.');
const detailUrl = baneiDebaTableUrl(date, 1);
if (!detailUrl.startsWith('https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/DebaTable?')) fail('Banei DebaTable URL path differs.');
if (!detailUrl.includes('k_raceNo=1')) fail('Banei DebaTable race number differs.');

const discovered = discoverBaneiRaceNumbers(listHtml);
if (!exact(discovered, [1, 2])) fail(`Banei race-number discovery differs: ${JSON.stringify(discovered)}`);
if (!continuousRaceNumbers(discovered)) fail('Banei fixture race numbers must be continuous from one.');
if (continuousRaceNumbers([1, 3])) fail('non-continuous Banei race numbers must fail continuity.');

const rows = parseBaneiRaceList(listHtml, date);
if (rows.length !== 2) fail(`Banei RaceList row count differs: ${rows.length}`);
else {
  if (!exact(rows.map((row) => row.race_number), [1, 2])) fail('Banei parsed race numbers differ.');
  if (!exact(rows.map((row) => row.post_time_local), ['14:30', '15:00'])) fail('Banei post times differ.');
  if (!exact(rows.map((row) => row.race_name), ['Fixture Banei Race One', 'Fixture Banei Race Two'])) fail(`Banei race names differ: ${JSON.stringify(rows.map((row) => row.race_name))}`);
  if (!rows.every((row) => row.list_distance_m === 200 && row.list_course_shape === 'straight')) fail('Banei RaceList straight-200m evidence differs.');
}

const metadata = parseBaneiDebaMetadata(detailHtml);
if (!metadata) fail('Banei DebaTable metadata did not parse.');
else {
  if (metadata.surface !== 'Dirt') fail('Banei DebaTable surface differs.');
  if (metadata.distance_m !== 200) fail('Banei DebaTable distance differs.');
  if (metadata.course_label !== 'Banei Straight Course') fail('Banei DebaTable course label differs.');
  if (metadata.course_shape !== 'straight') fail('Banei DebaTable course shape differs.');
}
if (parseBaneiDebaMetadata('<div>芝 200m（直）</div>') !== null) fail('non-Banei dirt metadata must not pass Banei Deba parser.');
if (parseBaneiDebaMetadata('<div>ダート 200m（右）</div>') !== null) fail('non-straight metadata must not pass Banei Deba parser.');

if (rows.length === 2 && metadata) {
  const metadataByRace = new Map([[1, metadata], [2, metadata]]);
  let candidate = null;
  try {
    candidate = completeBaneiAPlusMeeting({
      date,
      list_url: listUrl,
      list_rows: rows,
      detail_metadata_by_race: metadataByRace,
      checked_at: '2026-07-09T03:00:00Z',
    });
  } catch (error) {
    fail(`Banei A+ candidate build failed: ${error.message}`);
  }
  if (candidate) {
    if (candidate.schema_version !== 'timetable-candidate-v1') fail('Banei A+ shared candidate schema differs.');
    if (candidate.records.length !== 1) fail('Banei A+ candidate must contain one meeting record.');
    const record = candidate.records[0];
    if (record.capability_rank !== 'A+') fail('complete Banei detail candidate must be A+.');
    if (record.first_race_time_local !== '14:30' || record.last_race_time_local !== '15:00') fail('Banei first/last time summary differs.');
    if (record.timetable_rows.length !== 2) fail('Banei timetable row count differs.');
    if (!record.timetable_rows.every((row) => row.distance_m === 200 && row.surface === 'Dirt' && row.course_label === 'Banei Straight Course')) {
      fail('Banei A+ row metadata differs.');
    }
    if (record.review_status !== 'needs_review' || candidate.review.status !== 'needs_review') fail('Banei detail candidate must remain needs_review.');
    const serialized = JSON.stringify(candidate).toLowerCase();
    for (const forbidden of ['horse_name', 'jockey_name', 'trainer_name', 'odds', 'payout', 'prediction', 'raw_html', 'source_body', 'stream_url']) {
      if (serialized.includes(`"${forbidden}"`)) fail(`forbidden candidate key present: ${forbidden}`);
    }
  }

  let missingDetailRejected = false;
  try {
    completeBaneiAPlusMeeting({
      date,
      list_url: listUrl,
      list_rows: rows,
      detail_metadata_by_race: new Map([[1, metadata]]),
      checked_at: '2026-07-09T03:00:00Z',
    });
  } catch {
    missingDetailRejected = true;
  }
  if (!missingDetailRejected) fail('A+ candidate must reject missing per-race detail metadata.');

  let distanceMismatchRejected = false;
  try {
    completeBaneiAPlusMeeting({
      date,
      list_url: listUrl,
      list_rows: rows,
      detail_metadata_by_race: new Map([
        [1, metadata],
        [2, { ...metadata, distance_m: 210 }],
      ]),
      checked_at: '2026-07-09T03:00:00Z',
    });
  } catch {
    distanceMismatchRejected = true;
  }
  if (!distanceMismatchRejected) fail('A+ candidate must reject list/detail distance mismatch.');
}

const collectorText = readText('scripts/timetable/collect-banei-detail-window.mjs');
for (const phrase of [
  'Provide either start/end window or selected meeting IDs',
  'parseBaneiRaceList',
  'parseBaneiDebaMetadata',
  'completeBaneiAPlusMeeting',
  "candidate_mode: 'review_only'",
  "publication_effect: 'none'",
  "canonical_write: 'disabled'",
  "public_write: 'disabled'",
  "raw_source_storage: 'disabled'",
]) {
  if (!collectorText.includes(phrase)) fail(`Banei detail collector missing ${phrase}.`);
}

const docs = readText('docs/calendar/banei-detail-adapter.md');
for (const phrase of [
  'RaceList',
  'DebaTable',
  'A+ requires every race row',
  'Banei Straight Course',
  'date-window',
  'selected-meeting',
  'Registry activation is separate',
  'no flat-racing matrix fallback',
  'Human review',
]) {
  if (!docs.includes(phrase)) fail(`Banei detail adapter contract missing ${phrase}.`);
}

if (errors.length) {
  console.error(`CALENDAR_BANEI_DETAIL_ADAPTER: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_BANEI_DETAIL_ADAPTER: pass');
console.log('RACE_LIST_ROWS: 2');
console.log('DETAIL_METADATA: Dirt / 200m / straight');
console.log('A_PLUS_COMPLETENESS: pass');
console.log('MISSING_DETAIL_REJECTION: pass');
console.log('DISTANCE_MISMATCH_REJECTION: pass');
console.log('WINDOW_AND_SELECTED_SCOPE: contract present');
console.log('REGISTRY_ACTIVATION: separate');
