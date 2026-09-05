import assert from 'node:assert/strict';
import {
  classifyNarZeroRaceDiscovery,
  narRaceProgrammeLooksPublished,
  narRaceProgrammePublicationSignals,
} from './timetable/nar-publication-signal.mjs';

const unpublished = `
<html><body>
  <h1>レース一覧</h1>
  <div>本日のレース情報</div>
  <div>出馬表 オッズ 競走成績</div>
</body></html>`;

assert.equal(
  narRaceProgrammeLooksPublished(unpublished),
  false,
  'static RaceList navigation must not be mistaken for a published race programme',
);
assert.deepEqual(
  classifyNarZeroRaceDiscovery(unpublished),
  { status: 'scheduled_pending_details', reason: 'scheduled_pending_details' },
  'genuinely unpublished RaceList remains pending rather than failing',
);

const publishedWithUnknownRaceNumberMarkup = `
<html><body>
  <section data-race="one">
    <h2>第1競走</h2><span>14:25</span>
    <a href="/KeibaWeb/TodayRaceInfo/DebaTable?newRaceKey=one">出馬表</a>
  </section>
  <section data-race="two">
    <h2>第2競走</h2><span>14:55</span>
    <a href="/KeibaWeb/TodayRaceInfo/DebaTable?newRaceKey=two">出馬表</a>
  </section>
</body></html>`;

assert.equal(
  narRaceProgrammeLooksPublished(publishedWithUnknownRaceNumberMarkup),
  true,
  'published programme must remain detectable even when current k_raceNo/1R discovery markup disappears',
);
assert.deepEqual(
  classifyNarZeroRaceDiscovery(publishedWithUnknownRaceNumberMarkup),
  {
    status: 'race_number_discovery_incomplete',
    reason: 'published_programme_without_discoverable_race_numbers',
  },
  'published-looking programme must fail closed instead of being silently labeled C',
);

const signals = narRaceProgrammePublicationSignals(publishedWithUnknownRaceNumberMarkup);
assert.equal(signals.race_heading_count, 2);
assert.equal(signals.post_time_count, 2);
assert.equal(signals.detail_link_count, 2);

const oneStaticRaceReference = `
<html><body>
  <p>第1競走</p>
  <p>過去のレース 14:25</p>
</body></html>`;
assert.equal(
  narRaceProgrammeLooksPublished(oneStaticRaceReference),
  false,
  'one incidental race reference is insufficient publication evidence',
);

console.log('NAR_PUBLICATION_SIGNAL_GUARD: pass');
