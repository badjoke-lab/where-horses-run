import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = (path) => fs.readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const [brand, map, runtime, compact, timetable, media, liveStatusApi, rowsModel, filters, meetingStatePolicy] = await Promise.all([
  read('src/styles/brand-v1.css'),
  read('src/components/RacecourseMap.astro'),
  read('src/components/MeetingLiveStatusRuntime.astro'),
  read('src/styles/meeting-list-compact-v1.css'),
  read('src/components/TimetableMeetingList.astro'),
  read('src/data/racingMediaLinks.ts'),
  read('functions/api/live-status.js'),
  read('src/data/timetableMeetingRows.ts'),
  read('src/components/CalendarFilters.astro'),
  read('src/components/MeetingStatePolicy.astro'),
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
assert.match(brand, /html:lang\(ja\) \.site-brand::before[\s\S]*?color:\s*var\(--whr-color-navy\)/,
  'Japanese brand first line must preserve the English primary brand color');
assert.match(brand, /html:lang\(ja\) \.site-brand::after[\s\S]*?color:\s*var\(--whr-color-gold-dark\)/,
  'Japanese brand second line must preserve the English secondary brand color');

assert.doesNotMatch(runtime, /youtube\.com\/watch\?v=/,
  'Calendar runtime must not synthesize direct YouTube watch URLs');
assert.match(runtime, /querySelectorAll\('\[data-live-link\]'\)/,
  'Calendar runtime must evaluate every stream provider link in a meeting row');
assert.match(runtime, /link\.dataset\.liveLiveLabel/,
  'Calendar runtime must promote only the detected provider link to its live label');
assert.match(runtime, /row\.dataset\.streamState = rowIsLive \? 'live' : 'unknown'/,
  'Calendar row live state must aggregate provider-specific live state for the map');
assert.match(runtime, /link\.href = defaultHref;/,
  'Calendar runtime must keep each reviewed official landing destination');

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
assert.match(media, /id: 'kra-krbc-youtube-selected-2026'[\s\S]*?coverage: 'selected_meetings'[\s\S]*?access_tags: \['free'\]/,
  'KRA/KRBC must remain explicitly selected-coverage rather than pretending every meeting is streamed');
assert.match(media, /id: 'nz-tab-watch-bet-live-2026'[\s\S]*?access_tags: \['betting_account_required', 'geo_restricted'\]/,
  'New Zealand TAB stream must expose betting-account and geo restrictions');
assert.match(media, /id: 'nz-tab-watch-bet-live-2026'[\s\S]*?coverage: 'selected_meetings'/,
  'New Zealand TAB stream must not overclaim all-meeting coverage');
assert.match(media, /id: 'nz-hrnz-tab-watch-bet-live-2026'[\s\S]*?coverage: 'selected_meetings'/,
  'New Zealand harness TAB stream must not overclaim all-meeting coverage');
assert.match(media, /id: 'sorec-tv-live-2026'[\s\S]*?coverage: 'selected_meetings'[\s\S]*?access_tags: \['access_unknown'\]/,
  'SOREC TV must stay selected-coverage with unknown public access conditions');
assert.match(media, /id: 'letrot-equidia-live-2026'[\s\S]*?coverage: 'selected_meetings'[\s\S]*?access_tags: \['access_unknown'\]/,
  'LeTROT Equidia route must not overclaim access or all-meeting coverage');
assert.match(media, /id: 'monterrico-live-2026'[\s\S]*?https:\/\/monterrico\.elturf\.com\/carreras-senal-en-vivo/,
  'Monterrico must link to the exact official live-signal page');
assert.match(media, /id: 'chile-valparaiso-live-2026'[\s\S]*?https:\/\/www\.sporting\.cl\/hipica\/front\/es\/signal\/index\.html/,
  'Valparaiso must link to the exact official live-signal page');
assert.match(media, /id: 'ireland-racing-tv-live-2026'[\s\S]*?access_tags: \['paid'\]/,
  'Irish Racing TV route must expose paid access');
assert.match(media, /id: 'uk-sky-sports-racing-live-2026'[\s\S]*?access_tags: \['paid', 'geo_restricted'\]/,
  'ATR Player route must expose paid and geographic restrictions');
assert.match(media, /id: 'france-galop-equidia-live-2026'[\s\S]*?access: 'subscription'[\s\S]*?access_tags: \['paid'\]/,
  'France Galop Equidia route must expose the subscription requirement stated by France Galop');
assert.match(media, /id: 'uk-sky-sports-racing-live-2026'[\s\S]*?bangor-on-dee-racecourse[\s\S]*?chester-racecourse[\s\S]*?doncaster-racecourse[\s\S]*?lingfield-park-racecourse[\s\S]*?newbury-racecourse[\s\S]*?windsor-racecourse/,
  'Sky Sports Racing mapping must include the current ATR official rights-list courses');
assert.match(media, /id: 'uk-racing-tv-live-2026'[\s\S]*?scope: 'track'[\s\S]*?coverage: 'all_meetings'[\s\S]*?aintree-racecourse[\s\S]*?wincanton-racecourse[\s\S]*?york-racecourse/,
  'Racing TV mapping must be explicit by racecourse rather than an authority-wide fallback');

assert.match(timetable, /data-live-access-tags=/,
  'Calendar rows must expose media access tags to the rendered DOM');
assert.match(timetable, /meeting-row__watch-menu/,
  'Calendar must collapse multiple providers into a bounded Watch control');
assert.match(timetable, /meeting-row__watch-panel/,
  'multiple-provider Watch controls must expose a provider panel');
assert.match(timetable, /meeting-row__country-flag/,
  'Calendar rows must show a country flag next to Country / Authority');
assert.match(timetable, /BETTING ACCOUNT/,
  'English Calendar access labels must include betting-account disclosure');
assert.match(timetable, /投票口座/,
  'Japanese Calendar access labels must include betting-account disclosure');
assert.doesNotMatch(
  timetable,
  /record\.authority_id === 'korea-racing-authority'.*kra-krbc/s,
  'selected KRA/KRBC media must not be wired into the global per-day live detector',
);
assert.match(compact, /\.meeting-row__watch-panel[\s\S]*?position:\s*absolute/,
  'desktop multiple-provider Watch must use a compact popover');
assert.match(compact, /@media \(max-width:\s*1023px\)[\s\S]*?\.meeting-row__watch-panel[\s\S]*?position:\s*fixed/,
  'mobile multiple-provider Watch must use a bottom sheet');
assert.match(compact, /grid-template-columns:[\s\S]*?1\.8fr[\s\S]*?0\.9fr[\s\S]*?0\.75fr[\s\S]*?1\.2fr/,
  'mobile action row must reserve stable Watch, Details, Map and Official slots');

assert.match(rowsModel, /live_media: readonly RacingMediaLink\[\]/,
  'meeting rows must support multiple reviewed live-media routes');
assert.match(rowsModel, /function getLiveMediaForMeeting/,
  'meeting rows must return all matching reviewed live-media routes');
assert.match(media, /id: 'jcsa-dazn-live-2026'[\s\S]*?provider_label: 'DAZN'[\s\S]*?coverage: 'all_meetings'|id: 'jcsa-dazn-live-2026'[\s\S]*?coverage: 'all_meetings'[\s\S]*?provider_label: 'DAZN'/,
  'Saudi racing must expose the JCSA-reviewed DAZN all-meeting route');
assert.match(media, /id: 'jcsa-youtube-live-2026'[\s\S]*?coverage: 'selected_meetings'[\s\S]*?provider_label: 'YouTube'/,
  'Saudi racing must expose YouTube separately without overclaiming all-meeting coverage');
assert.match(media, /https:\/\/www\.youtube\.com\/@JockeyClub_SA\/streams/,
  'Saudi YouTube route must use the official JCSA streams landing page');
assert.match(timetable, /data-watch-summary-label/,
  'Calendar must aggregate multiple providers into Watch N');
assert.match(timetable, /record\.live_media\.map/,
  'Watch panel must render every reviewed provider for the meeting');
assert.match(timetable, /data-live-live-label=/,
  'provider links must carry provider-specific live labels');
assert.match(liveStatusApi, /id: 'jcsa-youtube-live-2026'[\s\S]*?handle: '@JockeyClub_SA'[\s\S]*?time_zone: 'Asia\/Riyadh'/,
  'JCSA YouTube detector must use the official handle and Saudi local date');
assert.doesNotMatch(liveStatusApi, /DAZN/i,
  'paid or broadcaster-web routes must not be added to runtime live detection');

assert.match(timetable, /data-time-empty=/,
  'Calendar must mark time-empty rows explicitly');
assert.doesNotMatch(timetable, /: '—'/,
  'Calendar must not render a dash placeholder for missing meeting times');
assert.match(timetable, /moveMapActionIntoLinks/,
  'Calendar must move existing Map actions into the bounded action row');
assert.match(runtime, /data-provider-live-indicator/,
  'provider panel must expose LIVE state only for the detected provider');
assert.match(runtime, /data-watch-summary-label/,
  'row-level Watch summary must reflect whether any provider is live');
assert.match(filters, /querySelectorAll\('\[data-live-link\]'\)/,
  'Calendar filters must evaluate every provider link rather than only the first route');
assert.match(filters, /link\.dataset\.liveDefaultLabel/,
  'Calendar filters must preserve the reviewed Watch label during live-state refresh');
assert.doesNotMatch(filters, /link\.textContent\s*=\s*state === 'live'[\s\S]*?Official stream/,
  'Calendar filters must never rewrite Watch controls back to legacy Official stream copy');
assert.match(meetingStatePolicy, /\[data-live-link\]:not\(\[data-live-role\]\)/,
  'legacy neutral stream styling must exclude new Watch and provider action controls');
assert.doesNotMatch(timetable, /#fff3c4/,
  'TimetableMeetingList must not retain the old merged upcoming/today row color');
assert.doesNotMatch(timetable, /presentation-state='running'[^\n]*#fff0ef/,
  'TimetableMeetingList must not retain the old running row color');
assert.doesNotMatch(timetable, /presentation-state='ended'[^\n]*#f3f3f3/,
  'TimetableMeetingList must not retain the old ended row color');

console.log('CALENDAR_STREAM_BRAND_REGRESSIONS: pass');
