import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = (path) => fs.readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const [brand, map, runtime, compact, timetable, media, liveStatus, timetableRows, filters] = await Promise.all([
  read('src/styles/brand-v1.css'),
  read('src/components/RacecourseMap.astro'),
  read('src/components/MeetingLiveStatusRuntime.astro'),
  read('src/styles/meeting-list-compact-v1.css'),
  read('src/components/TimetableMeetingList.astro'),
  read('src/data/racingMediaLinks.ts'),
  read('functions/api/live-status.js'),
  read('src/data/timetableMeetingRows.ts'),
  read('src/components/CalendarFilters.astro'),
]);

assert.doesNotMatch(
  brand,
  /racecourse-map__legend-dot--upcoming[\s\S]*?font-size:\s*0/,
  'brand CSS must never hide the Upcoming legend label',
);
assert.doesNotMatch(
  brand,
  /Upcoming \/ racing today|開催前 \/ 本日開催|開催前・本日開催/,
  'brand CSS must not replace the canonical separate Upcoming/Today legend states',
);
assert.match(map, />Upcoming</, 'English yellow Upcoming legend text must remain present');
assert.match(map, />開催前</, 'Japanese yellow Upcoming legend text must remain present');

assert.match(brand, /html:lang\(ja\) \.site-brand::before[\s\S]*?content:\s*'競馬どこ？'/,
  'Japanese brand first line must be 競馬どこ？');
assert.match(brand, /html:lang\(ja\) \.site-brand::after[\s\S]*?content:\s*'Where Horses Run'/,
  'Japanese brand second line must be Where Horses Run');
assert.match(brand, /html:lang\(ja\) \.site-brand[\s\S]*?font-family:\s*var\(--whr-font-family\)/,
  'Japanese brand must use the shared sans-serif/gothic font stack');

assert.doesNotMatch(runtime, /youtube\.com\/watch\?v=/,
  'Calendar runtime must not synthesize direct YouTube watch URLs');
assert.match(runtime, /querySelectorAll\('\[data-stream-media\]'\)/,
  'runtime must update each stream provider independently');
assert.match(runtime, /link\.dataset\.liveDefaultLabel/,
  'runtime must preserve each provider default label');
assert.match(runtime, /link\.dataset\.liveActiveLabel/,
  'runtime must use provider-specific live labels');
assert.match(runtime, /row\.dataset\.streamState = rowLive/,
  'row live state must aggregate provider states');

assert.match(
  compact,
  /a\[data-live-link\][\s\S]*?background:\s*transparent/,
  'non-live official-stream links must remain visually neutral',
);
assert.match(
  compact,
  /meeting-row__stream\[data-stream-state='live'\][\s\S]*?a\[data-live-link\][\s\S]*?background:\s*#fff0ef[\s\S]*?color:\s*#9d0000/,
  'only the verified-live provider link may receive the live accent',
);
assert.doesNotMatch(
  compact,
  /meeting-row\[data-stream-state='live'\][\s\S]*?a\[data-live-link\]/,
  'one live provider must not style every stream link in the row as live',
);
assert.match(compact, /\.meeting-row__streams[\s\S]*?flex-wrap:\s*wrap/,
  'multiple stream providers must wrap safely');
assert.match(compact, /presentation-state='running'[^\{]*\{[\s\S]*?background:\s*#fff7f6 !important;/,
  'running rows must use #fff7f6');
assert.match(compact, /presentation-state='upcoming'[^\{]*\{[\s\S]*?background:\s*#fff9e9 !important;/,
  'upcoming rows must use #fff9e9');
assert.match(compact, /presentation-state='today'[^\{]*\{[\s\S]*?background:\s*#fffcf4 !important;/,
  'today rows must use #fffcf4');
assert.match(compact, /presentation-state='ended'[^\{]*\{[\s\S]*?background:\s*#f6f7f8 !important;/,
  'ended rows must use #f6f7f8');

assert.match(
  media,
  /export type RacingMediaAccessTag =[\s\S]*?'free'[\s\S]*?'betting_account_required'[\s\S]*?'paid'[\s\S]*?'geo_restricted'/,
  'media registry must model visible access conditions independently from stream state',
);
assert.match(media, /calendar_label_en\?: string;[\s\S]*?display_order\?: number;/,
  'media registry must support compact provider labels and deterministic multi-stream order');

for (const authorityId of [
  'korea-racing-authority',
  'sorec',
  'teletrak-chile',
  'horse-racing-ireland',
  'hipodromo-de-monterrico',
  'jockey-club-of-saudi-arabia',
  'france-galop',
  'new-zealand-thoroughbred-racing',
  'harness-racing-new-zealand',
  'british-horseracing-authority',
]) {
  assert.match(media, new RegExp(`authority_id: '${authorityId}'`), `media registry must cover ${authorityId}`);
}

assert.match(media, /id: 'jcsa-dazn-live-2026'[\s\S]*?coverage: 'all_meetings'[\s\S]*?access_tags: \['free'\][\s\S]*?calendar_label_en: 'DAZN'[\s\S]*?display_order: 10[\s\S]*?dazn\.com\/competition\/competition:1adrk4o9v4x9316vgfndane2zu/,
  'JCSA DAZN route must be free, all-meetings, first in display order, and use the reviewed DAZN destination');
assert.match(media, /id: 'jcsa-youtube-live-2026'[\s\S]*?coverage: 'selected_meetings'[\s\S]*?access_tags: \['free'\][\s\S]*?calendar_label_en: 'YouTube'[\s\S]*?display_order: 20[\s\S]*?youtube_channel_id: 'UC4xAL1Lid7vrrm-xtxyyvwA'/,
  'JCSA YouTube route must be free, selected-coverage, second in display order, and bound to the official channel');
assert.doesNotMatch(media, /id: 'jcsa-live-2026'/,
  'the old single JCSA hub route must not hide the two actual providers');

assert.match(media, /id: 'kra-krbc-youtube-selected-2026'[\s\S]*?coverage: 'selected_meetings'[\s\S]*?access_tags: \['free'\]/,
  'KRA/KRBC must remain explicitly selected-coverage rather than pretending every meeting is streamed');
assert.match(media, /id: 'nz-tab-watch-bet-live-2026'[\s\S]*?access_tags: \['betting_account_required', 'geo_restricted'\]/,
  'New Zealand TAB stream must expose betting-account and geo restrictions');
assert.match(media, /id: 'sorec-tv-live-2026'[\s\S]*?coverage: 'selected_meetings'[\s\S]*?access_tags: \['access_unknown'\]/,
  'SOREC TV must stay selected-coverage with unknown public access conditions');
assert.match(media, /id: 'france-galop-equidia-live-2026'[\s\S]*?access: 'subscription'[\s\S]*?access_tags: \['paid'\]/,
  'France Galop Equidia route must expose its subscription requirement');

assert.match(timetableRows, /live_media_links:\s*readonly RacingMediaLink\[\]/,
  'meeting rows must expose all reviewed stream routes while retaining the preferred route');
assert.match(timetableRows, /function getLiveMediaForMeeting/,
  'meeting rows must collect all matching stream routes');
assert.match(timetableRows, /display_order \?\? 1000/,
  'multi-stream ordering must honor explicit display order');

assert.match(timetable, /meeting-row__streams/,
  'Calendar must render a stream group capable of holding multiple providers');
assert.match(timetable, /data-stream-detector-id=/,
  'runtime detector ids must be attached to individual providers');
assert.match(timetable, /data-live-default-label=/,
  'each provider must keep its own normal label');
assert.match(timetable, /data-live-active-label=/,
  'each provider must keep its own active label');
assert.match(timetable, /coverageBadge/,
  'non-all coverage such as SELECTED must be visible next to the provider');
assert.match(timetable, /jcsa-youtube-live-2026/,
  'JCSA YouTube must be eligible for runtime live detection');
assert.match(timetable, /BETTING ACCOUNT/,
  'English Calendar access labels must include betting-account disclosure');
assert.match(timetable, /投票口座/,
  'Japanese Calendar access labels must include betting-account disclosure');

assert.match(filters, /querySelectorAll\('\[data-stream-media\]'\)/,
  'Calendar filters must evaluate live state per provider');
assert.match(filters, /streamNode\.dataset\.streamDetectorId/,
  'Calendar filters must read provider-level detector ids');
assert.match(filters, /row\.dataset\.streamState = rowLive/,
  'Calendar filters must aggregate provider live states at row level');

assert.match(liveStatus, /id: 'jcsa-youtube-live-2026'[\s\S]*?channel_id: 'UC4xAL1Lid7vrrm-xtxyyvwA'[\s\S]*?time_zone: 'Asia\/Riyadh'/,
  'live-status API must detect JCSA YouTube using Saudi local time');
assert.match(liveStatus, /dateForTimeZone\(actualStart \?\? scheduledStart, detector\.time_zone \?\? DEFAULT_TIME_ZONE\)/,
  'event dates must use each detector local timezone rather than Japan for every country');
assert.match(liveStatus, /__cache\/\$\{namespace\}\/v4/,
  'live-status cache namespace must be bumped for the detector/timezone contract change');

assert.doesNotMatch(timetable, /#fff3c4/,
  'TimetableMeetingList must not retain the old merged upcoming/today row color');
assert.doesNotMatch(timetable, /presentation-state='running'[^\n]*#fff0ef/,
  'TimetableMeetingList must not retain the old running row color');
assert.doesNotMatch(timetable, /presentation-state='ended'[^\n]*#f3f3f3/,
  'TimetableMeetingList must not retain the old ended row color');

console.log('CALENDAR_STREAM_BRAND_REGRESSIONS: pass');
console.log('CALENDAR_MULTI_STREAM_CONTRACT: pass');
console.log('JCSA_DAZN_YOUTUBE_SPLIT: pass');
console.log('JCSA_YOUTUBE_RIYADH_LIVE_DETECTION: pass');
