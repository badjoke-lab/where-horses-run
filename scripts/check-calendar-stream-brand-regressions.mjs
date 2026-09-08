import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = (path) => fs.readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const [brand, map, runtime, compact, timetable] = await Promise.all([
  read('src/styles/brand-v1.css'),
  read('src/components/RacecourseMap.astro'),
  read('src/components/MeetingLiveStatusRuntime.astro'),
  read('src/styles/meeting-list-compact-v1.css'),
  read('src/components/TimetableMeetingList.astro'),
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
assert.match(runtime, /● Live now ↗/, 'verified-live English stream label must be present');
assert.match(runtime, /● 公式配信中 ↗/, 'verified-live Japanese stream label must be present');
assert.match(runtime, /link\.href = defaultHref;/,
  'Calendar runtime must keep the reviewed official landing destination');

assert.match(
  compact,
  /a\[data-live-link\][\s\S]*?background:\s*transparent/,
  'non-live official-stream links must remain visually neutral',
);
assert.match(
  compact,
  /data-stream-state='live'[\s\S]*?a\[data-live-link\][\s\S]*?background:\s*#fff0ef[\s\S]*?color:\s*#9d0000/,
  'only verified-live official-stream links may receive the live accent',
);
assert.match(compact, /presentation-state='running'[^\{]*\{[\s\S]*?background:\s*#fff7f6 !important;/,
  'running rows must use #fff7f6');
assert.match(compact, /presentation-state='upcoming'[^\{]*\{[\s\S]*?background:\s*#fff9e9 !important;/,
  'upcoming rows must use #fff9e9');
assert.match(compact, /presentation-state='today'[^\{]*\{[\s\S]*?background:\s*#fffcf4 !important;/,
  'today rows must use #fffcf4');
assert.match(compact, /presentation-state='ended'[^\{]*\{[\s\S]*?background:\s*#f6f7f8 !important;/,
  'ended rows must use #f6f7f8');

assert.doesNotMatch(timetable, /#fff3c4/,
  'TimetableMeetingList must not retain the old merged upcoming/today row color');
assert.doesNotMatch(timetable, /presentation-state='running'[^\n]*#fff0ef/,
  'TimetableMeetingList must not retain the old running row color');
assert.doesNotMatch(timetable, /presentation-state='ended'[^\n]*#f3f3f3/,
  'TimetableMeetingList must not retain the old ended row color');

console.log('CALENDAR_STREAM_BRAND_REGRESSIONS: pass');
