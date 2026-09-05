import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const fail = (message) => {
  console.error(`MAP-010 contract failed: ${message}`);
  process.exitCode = 1;
};
const requireText = (source, needle, label) => {
  if (!source.includes(needle)) fail(`${label} is missing ${JSON.stringify(needle)}`);
};
const forbidText = (source, needle, label) => {
  if (source.includes(needle)) fail(`${label} unexpectedly contains ${JSON.stringify(needle)}`);
};

const map = read('src/components/RacecourseMap.astro');
const css = read('src/styles/racecourse-map.css');
const touchQa = read('src/styles/racecourse-map-qa.css');
const today = read('src/components/TodayMeetingMap.astro');
const calendar = read('src/components/CalendarMeetingMap.astro');
const home = read('src/components/HomeRacingMap.astro');
const detail = read('src/components/RacecourseLocationMapSection.astro');
const providerDecision = read('docs/decisions/map-runtime-provider-2026-09-06.md');

for (const token of [
  "import '../styles/racecourse-map-qa.css'",
  'https://unpkg.com/maplibre-gl@6.7.0/dist/maplibre-gl.css',
  'https://unpkg.com/maplibre-gl@6.7.0/dist/maplibre-gl.mjs',
  "styleUrl = 'https://tiles.openfreemap.org/styles/liberty'",
  "geojsonUrl = '/data/racecourse-locations-v1.geojson'",
  'attributionControl: true',
  'keyboard: true',
  "const MAP_HIT_LAYER = 'racecourse-hit-targets'",
  "'circle-radius': 22",
  "'circle-opacity': 0.01",
  'new IntersectionObserver',
  "rootMargin: '320px 0px'",
  'racecourse-map:activate',
  "root.dataset.mapState = 'failed'",
  'duration: 0',
]) requireText(map, token, 'RacecourseMap');

requireText(map, "fetch(geojsonUrl, { credentials: 'same-origin' })", 'RacecourseMap local projection fetch');
const fetchCalls = map.match(/\bfetch\s*\(/g) ?? [];
if (fetchCalls.length !== 1) fail(`RacecourseMap must have exactly one runtime fetch (local GeoJSON); found ${fetchCalls.length}`);

for (const [label, source] of [
  ['TodayMeetingMap', today],
  ['CalendarMeetingMap', calendar],
  ['HomeRacingMap', home],
  ['RacecourseLocationMapSection', detail],
]) {
  forbidText(source, 'fetch(', `${label} runtime racing-data boundary`);
  requireText(source, 'OpenFreeMap', `${label} visible attribution`);
  requireText(source, 'OpenStreetMap contributors', `${label} visible attribution`);
}

requireText(today, 'data-today-map-selected', 'Today persistent selected-racecourse card');
requireText(calendar, 'data-calendar-map-selected', 'Calendar persistent selected-racecourse card');
requireText(home, 'data-home-map-selected', 'Home persistent selected-racecourse card');
requireText(css, 'position: sticky', 'mobile selected-card presentation');

for (const token of ['MapLibre', 'OpenFreeMap', 'attribution', 'API key', 'Failure boundary']) {
  requireText(providerDecision, token, 'map runtime provider decision');
}

for (const token of [
  'min-height: 44px',
  'min-width: 44px',
  '.meeting-row__map-focus',
  '.calendar-map-switch__buttons button',
  '.home-racing-map__periods button',
  '.maplibregl-ctrl button',
  'prefers-reduced-motion: reduce',
]) requireText(touchQa, token, 'map touch-target QA styles');

if (!process.exitCode) {
  console.log('MAP-010 map UI contract OK: lazy runtime, local racing projection, touch targets, attribution, failure fallback, and selected-card boundaries verified.');
}
