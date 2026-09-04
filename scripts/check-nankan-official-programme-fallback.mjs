import assert from 'node:assert/strict';
import {
  fetchNankanOfficialProgramme,
  parseNankanMeetingDates,
  parseNankanMeetingNumber,
  parseNankanProgrammeRows,
} from './timetable/nankan-official-programme-fallback.mjs';
import { withSagaOfficialStartFallback } from './timetable/saga-official-start-fallback.mjs';

const programmeFixture = `
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
      <a href="/syousai/2026090721070101.do" class="nk23_c-block01__list__title nk23_u-colorlink js-mheight-ele">Ｃ３(五)</a>
    </div>
  </li>
  <li class="nk23_c-block01__list__item js-mheight-itemele">
    <div class="nk23_c-block01__list__top">
      <span class="nk23_c-block01__label">2R</span>
      <p class="nk23_c-block01__texts">
        <span class="nk23_c-block01__text">15:30</span>
        <span class="nk23_c-block01__text">1400m</span>
        <span class="nk23_c-block01__text">7頭</span>
      </p>
    </div>
    <div class="nk23_c-block01__titlebtn">
      <a href="/syousai/2026090721070102.do" class="nk23_c-block01__list__title nk23_u-colorlink js-mheight-ele">２歳(六)(ロ)</a>
    </div>
  </li>
  <li class="nk23_c-block01__list__item js-mheight-itemele">
    <div class="nk23_c-block01__list__top">
      <span class="nk23_c-block01__label">3R</span>
      <p class="nk23_c-block01__texts">
        <span class="nk23_c-block01__text">16:00</span>
        <span class="nk23_c-block01__text">900m</span>
        <span class="nk23_c-block01__text">10頭</span>
      </p>
    </div>
    <div class="nk23_c-block01__titlebtn">
      <a href="/syousai/2026090721070103.do" class="nk23_c-block01__list__title nk23_u-colorlink js-mheight-ele">のぞみ賞 ２歳 未格付選定馬</a>
    </div>
  </li>
</ul>`;

const rows = parseNankanProgrammeRows(programmeFixture);
assert.equal(rows.length, 3);
assert.deepEqual(rows.map((row) => row.race_number), [1, 2, 3]);
assert.deepEqual(rows.map((row) => row.race_name), ['Ｃ３(五)', '２歳(六)(ロ)', 'のぞみ賞 ２歳 未格付選定馬']);
assert.deepEqual(rows.map((row) => row.post_time_local), ['15:00', '15:30', '16:00']);
assert.deepEqual(rows.map((row) => row.distance_m), [1400, 1400, 900]);
assert.ok(rows.every((row) => !/^\d+頭$/.test(row.race_name)), 'horse-count text must never become race_name');

const menuFixture = `
<a href="/bangumi/20262106.do">川崎6回</a>
<a href="/bangumi/20262107.do">川崎7回</a>`;
assert.equal(parseNankanMeetingNumber(menuFixture, '2026', '21'), '07');

const bangumiFixture = `
<div>9月7日（月）</div><div>1R</div>
<div>9月8日（火）</div><div>1R</div>
<div>9月9日（水）</div><div>1R</div>`;
assert.deepEqual(parseNankanMeetingDates(bangumiFixture, '2026'), ['2026-09-07', '2026-09-08', '2026-09-09']);

const fetchFixture = async (input) => {
  const url = String(input);
  if (url.includes('/bangumi_menu/')) return new Response(menuFixture, { status: 200 });
  if (url.endsWith('/bangumi/20262107.do')) return new Response(bangumiFixture, { status: 200 });
  if (url.endsWith('/program/20260907210701.do')) return new Response(programmeFixture, { status: 200 });
  return new Response('', { status: 404 });
};

const meeting = {
  meeting_id: 'nar-kawasaki-racecourse-2026-09-07',
  date: '2026-09-07',
  authority_id: 'nar-local-government-racing',
  racing_system_id: 'japan-nar-system',
  racecourse_id: 'kawasaki-racecourse',
  venue_code: '21',
};

const direct = await fetchNankanOfficialProgramme(meeting, { fetchImpl: fetchFixture });
assert.equal(direct?.status, 'ok');
assert.equal(direct?.meeting.capability_rank, 'A+');
assert.equal(direct?.meeting.source_id, 'nankankeiba-south-kanto-programme');
assert.equal(direct?.meeting.timetable_rows.length, 3);
assert.equal(direct?.meeting.timetable_rows[0].race_name, 'Ｃ３(五)');
assert.equal(direct?.meeting.timetable_rows[0].surface, 'Dirt');
assert.equal(direct?.meeting.timetable_rows[0].course_label, 'Dirt Left-handed');
assert.equal(direct?.meeting.official_source_url, 'https://www.nankankeiba.com/program/20260907210701.do');

const primaryPending = { status: 'scheduled_pending_details', reason: 'scheduled_pending_details' };
const wrapped = withSagaOfficialStartFallback(async () => primaryPending, fetchFixture);
const rescued = await wrapped(meeting);
assert.equal(rescued.status, 'ok');
assert.equal(rescued.meeting.source_id, 'nankankeiba-south-kanto-programme');

const unrelated = await wrapped({ ...meeting, racecourse_id: 'nagoya-racecourse', venue_code: '24' });
assert.deepEqual(unrelated, primaryPending, 'non-South-Kanto meetings must preserve the primary result');

const unavailable = withSagaOfficialStartFallback(async () => primaryPending, async () => new Response('', { status: 404 }));
assert.deepEqual(await unavailable(meeting), primaryPending, 'unavailable official programme must fail closed to primary pending state');

const alreadyOk = { status: 'ok', meeting: { ...meeting, capability_rank: 'A+' } };
const noOverride = withSagaOfficialStartFallback(async () => alreadyOk, async () => { throw new Error('must not fetch fallback'); });
assert.equal((await noOverride(meeting)).status, 'ok');

console.log('NANKAN_OFFICIAL_PROGRAMME_FALLBACK: pass');
