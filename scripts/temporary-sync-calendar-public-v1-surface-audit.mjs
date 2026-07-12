import fs from 'node:fs';

function replaceRequired(file, before, after) {
  const current = fs.readFileSync(file, 'utf8');
  if (!current.includes(before)) throw new Error(`${file}: required synchronization anchor missing`);
  fs.writeFileSync(file, current.replace(before, after));
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function emptyDistanceProfile() {
  return {
    turf: { min_m: null, max_m: null, known_distances_m: [] },
    dirt: { min_m: null, max_m: null, known_distances_m: [] },
    all_weather: { min_m: null, max_m: null, known_distances_m: [] },
    jump: { min_m: null, max_m: null, known_distances_m: [] },
    harness: { min_m: null, max_m: null, known_distances_m: [] },
    upcoming_conditions: [],
  };
}

function createUaeRacecourse({ id, nameEn, nameJa, city, region }) {
  return {
    id,
    slug: id,
    country_id: 'united-arab-emirates',
    name_en: nameEn,
    name_ja: nameJa,
    name_local: nameEn,
    city,
    region,
    timezone: 'Asia/Dubai',
    racing_types: ['thoroughbred-flat', 'arabian-racing'],
    status: 'active',
    surfaces: [],
    direction: 'unknown',
    course_profile: {
      turf_circumference_m: null,
      dirt_circumference_m: null,
      home_straight_m: null,
      has_inner_outer_courses: null,
      has_lighting: null,
      elevation_notes_en: null,
      elevation_notes_ja: null,
      course_notes_en: 'Course profile details are pending source-specific official review.',
      course_notes_ja: 'コース詳細はソース別の公式確認後に反映する。',
    },
    distance_profile: emptyDistanceProfile(),
    schedule_summary: {
      today_status: 'unknown',
      next_meeting_date: null,
      upcoming_meetings: [],
      status: 'official-link-only',
      last_checked: null,
    },
    notable_races: [],
    seasonality: {
      summary_en: 'The accepted ERA fixture evidence confirms venue identity and meeting dates only. Seasonality details require separate official review.',
      summary_ja: '承認済みERA開催証拠は競馬場識別と開催日のみを確認する。開催シーズンの詳細は別途公式確認が必要。',
      status: 'partial',
    },
    official_links: [
      {
        label_en: 'Emirates Racing official site',
        label_ja: 'エミレーツ競馬公式サイト',
        source_id: 'uae-era-home',
        url: 'https://emiratesracing.com/',
        link_type: 'official',
      },
    ],
    related_terms: ['racecourse', 'thoroughbred-racing', 'arabian-racing', 'meeting', 'racecard', 'post-time', 'fixture', 'jockey', 'trainer'],
    related_sources: ['uae-era-home'],
    data_status: {
      course_profile: 'partial',
      schedule: 'official-link-only',
      source_status: 'link_first',
      last_checked: '2026-07-11',
    },
    image_status: 'planned',
    image_path: null,
    image_alt_en: `Planned illustrative image for ${nameEn}.`,
    image_alt_ja: `${nameJa}の説明用イメージ画像予定地。`,
    course_diagram_status: 'pending',
    image: {
      src: '',
      alt_en: `Planned illustrative image for ${nameEn}.`,
      alt_ja: `${nameJa}の説明用イメージ画像予定地。`,
      image_type: 'placeholder',
      is_official_photo: false,
      note_en: 'Illustrative image. Not an official venue photo.',
      note_ja: '説明用のイメージ画像です。公式写真ではありません。',
      status: 'planned',
    },
  };
}

replaceRequired(
  'scripts/check-calendar-contracts.mjs',
  "  [paths.roadmap, roadmapText, ['Country-page programme: complete', 'Current Work ID: `WHR-CAL-JAPAN-NAR`', 'Next Work ID: `WHR-CAL-JAPAN-BANEI`', 'Completed Work ID: `WHR-CAL-OPS-V1`', 'WHR-CAL-BASELINE-RECONCILE']],\n  [paths.startHere, startHereText, ['Previous completed implementation Work ID: `WHR-CAL-JAPAN-JRA`', 'WHR-CAL-JAPAN-NAR', 'WHR-CAL-JAPAN-BANEI']],",
  "  [paths.roadmap, roadmapText, ['Country-page programme: complete', 'Completed Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`', 'Completed Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`', 'Completed Work ID: `WHR-CAL-UAE-ERA`', 'Current Work ID: `WHR-CAL-PUBLIC-V1`', 'WHR-CAL-OPS-V1', 'WHR-CAL-BASELINE-RECONCILE']],\n  [paths.startHere, startHereText, ['Previous completed implementation Work ID: `WHR-CAL-JAPAN-JRA`', 'WHR-CAL-JAPAN-NAR', 'WHR-CAL-JAPAN-BANEI', 'Current Work ID: `WHR-CAL-PUBLIC-V1`']],",
);
replaceRequired(
  'scripts/check-calendar-contracts.mjs',
  "console.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-NAR');\nconsole.log('NEXT_WORK_ID: WHR-CAL-JAPAN-BANEI');",
  "console.log('CURRENT_WORK_ID: WHR-CAL-PUBLIC-V1');\nconsole.log('COMPLETED_SOURCE_WORK_ID: WHR-CAL-UAE-ERA');",
);

replaceRequired(
  'docs/calendar/README.md',
  '- [`dynamic-dates-release-gate.md`](dynamic-dates-release-gate.md) — Dynamic Dates completion and Operations v1 boundary.\n',
  '- [`dynamic-dates-release-gate.md`](dynamic-dates-release-gate.md) — Dynamic Dates completion and Operations v1 boundary.\n- [`public-v1-surface-audit.md`](public-v1-surface-audit.md) — Calendar Public v1 Calendar/Today/Tomorrow shared-surface audit, validator reconciliation, bilingual parity, one-meeting-per-row boundary, and rendered fixture matrix.\n',
);
replaceRequired(
  'docs/calendar/README.md',
  'data/audits/calendar-dynamic-dates-release-gate.json\n',
  'data/audits/calendar-dynamic-dates-release-gate.json\ndata/audits/calendar-public-v1-surface-audit-v1.json\n',
);

replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  'Status: active current programme work\nWork ID: `WHR-CAL-PUBLIC-V1`\n\nRelease criteria include:',
  'Status: active current programme work\nWork ID: `WHR-CAL-PUBLIC-V1`\nCurrent implementation unit: `PUBLIC-V1-SURFACE-AUDIT-01` — in review\n\nRelease criteria include:',
);
replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  '- no participant, betting, result, payout, prediction, full-racecard, raw-source, embedded-video, or direct-stream output.\n\n## Later product stages',
  '- no participant, betting, result, payout, prediction, full-racecard, raw-source, embedded-video, or direct-stream output.\n\nCurrent Public v1 evidence unit:\n\n- Calendar, Today, and Tomorrow share explicit reference-date/timezone resolution;\n- English and Japanese routes use the shared `CalendarDateStatus` and `TimetableMeetingList`;\n- one meeting remains one list row;\n- C/B/B+/A/A+ list visibility and separate meeting-detail boundaries are checked;\n- reproducible current-window and stale-window rendered fixtures are validated;\n- automatic acquisition, approval, promotion, and unattended publication remain disabled.\n\n## Later product stages',
);

const readiness = readJson('data/static/calendar-readiness-registry.json');
const uaeReadiness = readiness.records.find((record) => record.readiness_id === 'united-arab-emirates--uae-national-racing-system--era-season-calendar');
if (!uaeReadiness) throw new Error('UAE Calendar Readiness record missing');
uaeReadiness.evidence_reviewed_at = '2026-07-11';
uaeReadiness.limitations = [
  'C-level meeting date and approved racecourse identity only. No race-time or programme-detail claim. PDF fixture-window extraction is review-only and automatic execution/publication remain disabled.',
];
writeJson('data/static/calendar-readiness-registry.json', readiness);

const racecourses = readJson('data/static/racecourses.json');
const additions = [
  createUaeRacecourse({
    id: 'abu-dhabi-turf-club',
    nameEn: 'Abu Dhabi Turf Club',
    nameJa: 'アブダビ・ターフクラブ',
    city: 'Abu Dhabi',
    region: 'Abu Dhabi',
  }),
  createUaeRacecourse({
    id: 'al-ain-racecourse',
    nameEn: 'Al Ain Racecourse',
    nameJa: 'アルアイン競馬場',
    city: 'Al Ain',
    region: 'Abu Dhabi',
  }),
  createUaeRacecourse({
    id: 'jebel-ali-racecourse',
    nameEn: 'Jebel Ali Racecourse',
    nameJa: 'ジェベルアリ競馬場',
    city: 'Jebel Ali',
    region: 'Dubai',
  }),
  createUaeRacecourse({
    id: 'sharjah-racecourse',
    nameEn: 'Sharjah Racecourse',
    nameJa: 'シャルジャ競馬場',
    city: 'Sharjah',
    region: 'Sharjah',
  }),
];
for (const addition of additions) {
  if (!racecourses.some((racecourse) => racecourse.id === addition.id)) racecourses.push(addition);
}
writeJson('data/static/racecourses.json', racecourses);

console.log('CALENDAR_PUBLIC_V1_SURFACE_AUDIT_SYNC: applied');
