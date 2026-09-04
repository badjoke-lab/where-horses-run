import assert from 'node:assert/strict';
import {
  fetchNankanOfficialProgramme,
  parseNankanMeetingDates,
  parseNankanMeetingNumber,
  parseNankanMeetingNumbers,
  parseNankanProgrammeRows,
} from './timetable/nankan-official-programme-fallback.mjs';
import { withSagaOfficialStartFallback } from './timetable/saga-official-start-fallback.mjs';

const linkedProgrammeFixture = `
<ul class="nk23_c-block01__list">
  <li class="nk23_c-block01__list__item js-mheight-itemele">
    <div class="nk23_c-block01__list__top">
      <span class="nk23_c-block01__label">1R</span>
      <p class="nk23_c-block01__texts">
        <span class="nk23_c-block01__text">15:00</span>
        <span class="nk23_c-block01__text">1400m</span>
        <span class="nk23_c-block01__text">12頭</span>
      </p>
    </div>
    <div class="nk23_c-block01__titlebtn">
      <a href="/syousai/fixture01.do" class="nk23_c-block01__list__title nk23_u-colorlink js-mheight-ele">Ｃ３(五)</a>
    </div>
  </li>
  <li class="nk23_c-block01__list__item js-mheight-itemele">
    <div class="nk23_c-block01__list__top">
      <span class="nk23_c-block01__label">2R</span>
      <p class="nk23_c-block01__texts">
        <span class="nk23_c-block01__text">15:30</span>
        <span class="nk23_c-block01__text">900m</span>
        <span class="nk23_c-block01__text">7頭</span>
      </p>
    </div>
    <div class="nk23_c-block01__titlebtn">
      <a href="/syousai/fixture02.do" class="nk23_c-block01__list__title nk23_u-colorlink js-mheight-ele">２歳(六)(ロ)</a>
    </div>
  </li>
</ul>`;

const currentProgrammeFixture = `
<ul class="nk23_c-block01__list">
  <li class="nk23_c-block01__list__item js-mheight-itemele">
    <div class="nk23_c-block01__list__top">
      <span class="nk23_c-block01__label">1R</span>
      <p class="nk23_c-block01__texts">
        <span class="nk23_c-block01__text">14:45</span>
        <span class="nk23_c-block01__text">1400m</span>
        <span class="nk23_c-block01__text">12頭</span>
      </p>
    </div>
    <div class="nk23_c-block01__titlebtn">
      <h3 class="nk23_c-block01__list__title is-nolink">Ｃ３(一)(二)</h3>
    </div>
  </li>
  <li class="nk23_c-block01__list__item js-mheight-itemele">
    <div class="nk23_c-block01__list__top">
      <span class="nk23_c-block01__label">2R</span>
      <p class="nk23_c-block01__texts">
        <span class="nk23_c-block01__text">15:15</span>
        <span class="nk23_c-block01__text">1600m</span>
        <span class="nk23_c-block01__text">11頭</span>
      </p>
    </div>
    <div class="nk23_c-block01__titlebtn">
      <h3 class="nk23_c-block01__list__title is-nolink">将来開催テスト特別</h3>
    </div>
  </li>
</ul>`;

for (const [fixture, names] of [
  [linkedProgrammeFixture, ['Ｃ３(五)', '２歳(六)(ロ)']],
  [currentProgrammeFixture, ['Ｃ３(一)(二)', '将来開催テスト特別']],
]) {
  const rows = parseNankanProgrammeRows(fixture);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((row) => row.race_number), [1, 2]);
  assert.deepEqual(rows.map((row) => row.race_name), names);
  assert.ok(rows.every((row) => !/^\d+頭$/.test(row.race_name)), 'horse-count text must never become race_name');
}

const menuFixture = `
<a href="/bangumi/20262106.do">川崎6回</a>
<a href="/bangumi/20262107.do">川崎7回</a>
<a href="/bangumi/20262108.do">川崎8回</a>`;
assert.deepEqual(parseNankanMeetingNumbers(menuFixture, '2026', '21'), ['06', '07', '08']);
assert.equal(parseNankanMeetingNumber(menuFixture, '2026', '21'), '08');

const bangumi07Fixture = `
<div>9月7日（月）</div><div>1R</div>
<div>9月8日（火）</div><div>1R</div>
<div>9月9日（水）</div><div>1R</div>`;
const bangumi08Fixture = `
<div>10月10日（土）</div><div>1R</div>
<div>10月11日（日）</div><div>1R</div>
<div>10月12日（月）</div><div>1R</div>`;
assert.deepEqual(parseNankanMeetingDates(bangumi07Fixture, '2026'), ['2026-09-07', '2026-09-08', '2026-09-09']);
assert.deepEqual(parseNankanMeetingDates(bangumi08Fixture, '2026'), ['2026-10-10', '2026-10-11', '2026-10-12']);

const fallbackCalls = [];
const fallbackFetch = async (input) => {
  const url = String(input);
  fallbackCalls.push(url);
  if (url.includes('/bangumi_menu/')) return new Response(menuFixture, { status: 200 });
  if (url.endsWith('/bangumi/20262106.do')) return new Response('<div>8月1日（土）</div><div>1R</div>', { status: 200 });
  if (url.endsWith('/bangumi/20262107.do')) return new Response(bangumi07Fixture, { status: 200 });
  if (url.endsWith('/bangumi/20262108.do')) return new Response(bangumi08Fixture, { status: 200 });
  if (url.endsWith('/program/20260907210701.do')) return new Response(linkedProgrammeFixture, { status: 200 });
  return new Response('', { status: 404 });
};

const septemberMeeting = {
  meeting_id: 'nar-kawasaki-racecourse-2026-09-07',
  date: '2026-09-07',
  authority_id: 'nar-local-government-racing',
  racing_system_id: 'japan-nar-system',
  racecourse_id: 'kawasaki-racecourse',
  venue_code: '21',
};

const dateSelected = await fetchNankanOfficialProgramme(septemberMeeting, { fetchImpl: fallbackFetch });
assert.equal(dateSelected?.status, 'ok');
assert.equal(dateSelected?.meeting.capability_rank, 'A+');
assert.equal(dateSelected?.meeting.source_id, 'nankankeiba-south-kanto-programme');
assert.equal(dateSelected?.meeting.timetable_rows.length, 2);
assert.equal(dateSelected?.meeting.official_source_url, 'https://www.nankankeiba.com/program/20260907210701.do');
assert.ok(fallbackCalls.some((url) => url.endsWith('/bangumi/20262107.do')), 'target meeting number must be inspected');
assert.ok(!fallbackCalls.some((url) => url.endsWith('/bangumi/20262108.do')), 'must stop when the target date is found, not blindly use the latest meeting number');

const directCalls = [];
const futureProgramUrl = 'https://www.nankankeiba.com/program/20261012210803.do';
const directFetch = async (input) => {
  const url = String(input);
  directCalls.push(url);
  if (url === futureProgramUrl) return new Response(currentProgrammeFixture, { status: 200 });
  return new Response('', { status: 404 });
};
const futureMeeting = {
  ...septemberMeeting,
  meeting_id: 'nar-kawasaki-racecourse-2026-10-12',
  date: '2026-10-12',
  nankankeiba_program_url: futureProgramUrl,
};
const direct = await fetchNankanOfficialProgramme(futureMeeting, { fetchImpl: directFetch });
assert.equal(direct?.status, 'ok');
assert.equal(direct?.meeting.timetable_rows.length, 2);
assert.equal(direct?.meeting.timetable_rows[0].race_name, 'Ｃ３(一)(二)');
assert.equal(direct?.meeting.timetable_rows[0].surface, 'Dirt');
assert.equal(direct?.meeting.timetable_rows[0].course_label, 'Dirt Left-handed');
assert.equal(direct?.meeting.official_source_url, futureProgramUrl);
assert.deepEqual(directCalls, [futureProgramUrl], 'derived per-meeting URL must bypass menu/latest-meeting lookup');

const primaryPending = { status: 'scheduled_pending_details', reason: 'scheduled_pending_details' };
const wrapped = withSagaOfficialStartFallback(async () => primaryPending, fallbackFetch);
const rescued = await wrapped(septemberMeeting);
assert.equal(rescued.status, 'ok');
assert.equal(rescued.meeting.source_id, 'nankankeiba-south-kanto-programme');

const unrelated = await wrapped({ ...septemberMeeting, racecourse_id: 'nagoya-racecourse', venue_code: '24' });
assert.deepEqual(unrelated, primaryPending, 'non-South-Kanto meetings must preserve the primary result');

const unavailable = withSagaOfficialStartFallback(async () => primaryPending, async () => new Response('', { status: 404 }));
assert.deepEqual(await unavailable(septemberMeeting), primaryPending, 'unavailable official programme must fail closed to primary pending state');

const alreadyOk = { status: 'ok', meeting: { ...septemberMeeting, capability_rank: 'A+' } };
const noOverride = withSagaOfficialStartFallback(async () => alreadyOk, async () => { throw new Error('must not fetch fallback'); });
assert.equal((await noOverride(septemberMeeting)).status, 'ok');

console.log('NANKAN_OFFICIAL_PROGRAMME_FALLBACK: pass');
