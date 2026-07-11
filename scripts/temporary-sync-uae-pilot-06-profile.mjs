import fs from 'node:fs';

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);

const racecoursesPath = 'data/static/racecourses-extensions.json';
const readinessPath = 'data/static/calendar-readiness-registry.json';
const acquisitionPath = 'data/static/calendar-acquisition-registry.json';
const compatibilityPath = 'data/static/calendar-runner-compatibility-contract-v1.json';

const racecourses = readJson(racecoursesPath);
const readiness = readJson(readinessPath);
const acquisition = readJson(acquisitionPath);
const compatibility = readJson(compatibilityPath);

const sourceId = 'uae-era-home';
const commonDistanceProfile = {
  turf: { min_m: null, max_m: null, known_distances_m: [] },
  dirt: { min_m: null, max_m: null, known_distances_m: [] },
  all_weather: { min_m: null, max_m: null, known_distances_m: [] },
  jump: { min_m: null, max_m: null, known_distances_m: [] },
  harness: { min_m: null, max_m: null, known_distances_m: [] },
  upcoming_conditions: [],
};

function makeRacecourse({ id, nameEn, nameJa, city, region, officialUrl }) {
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
      course_notes_en: 'Course profile details are pending separate official-source verification. This record establishes the PILOT-05 approved canonical venue identity only.',
      course_notes_ja: 'コース詳細は別途公式ソース確認後に反映する。このレコードではPILOT-05で承認された競馬場IDのみを確定する。',
    },
    distance_profile: structuredClone(commonDistanceProfile),
    schedule_summary: {
      today_status: 'unknown',
      next_meeting_date: null,
      upcoming_meetings: [],
      status: 'official-link-only',
      last_checked: null,
    },
    notable_races: [],
    seasonality: {
      summary_en: 'The reviewed ERA fixture calendar is handled by the Calendar timetable pipeline; broader venue seasonality claims remain separate.',
      summary_ja: '確認済みERA開催カレンダーはCalendarタイムテーブル系で扱い、競馬場単位の開催時期の詳細は別途確認する。',
      status: 'partial',
    },
    official_links: [
      {
        label_en: `${nameEn} official ERA page`,
        label_ja: `${nameJa} ERA公式ページ`,
        source_id: sourceId,
        url: officialUrl,
        link_type: 'official',
      },
    ],
    related_terms: ['racecourse', 'thoroughbred-racing', 'arabian-racing', 'meeting', 'racecard', 'post-time', 'fixture', 'jockey', 'trainer'],
    related_sources: [sourceId],
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

const approvedNewVenues = [
  makeRacecourse({
    id: 'abu-dhabi-turf-club',
    nameEn: 'Abu Dhabi Turf Club',
    nameJa: 'アブダビ・ターフクラブ',
    city: 'Abu Dhabi',
    region: 'Abu Dhabi',
    officialUrl: 'https://emiratesracing.com/racecourses/abu-dhabi-turf-club',
  }),
  makeRacecourse({
    id: 'al-ain-racecourse',
    nameEn: 'Al Ain Racecourse',
    nameJa: 'アルアイン競馬場',
    city: 'Al Ain',
    region: 'Abu Dhabi',
    officialUrl: 'https://emiratesracing.com/racecourses/al-ain',
  }),
  makeRacecourse({
    id: 'jebel-ali-racecourse',
    nameEn: 'Jebel Ali Racecourse',
    nameJa: 'ジェベルアリ競馬場',
    city: 'Dubai',
    region: 'Dubai',
    officialUrl: 'https://emiratesracing.com/racecourses/jebel-ali',
  }),
  makeRacecourse({
    id: 'sharjah-racecourse',
    nameEn: 'Sharjah Racecourse',
    nameJa: 'シャルジャ競馬場',
    city: 'Sharjah',
    region: 'Sharjah',
    officialUrl: 'https://emiratesracing.com/racecourses/sharjah',
  }),
];

for (const venue of approvedNewVenues) {
  const existing = racecourses.find((record) => record.id === venue.id);
  if (existing) Object.assign(existing, venue);
  else racecourses.push(venue);
}
writeJson(racecoursesPath, racecourses);

const uaeReadiness = readiness.records.find((record) => record.readiness_id === 'united-arab-emirates--uae-national-racing-system--era-season-calendar');
if (!uaeReadiness) throw new Error('UAE Readiness record missing');
Object.assign(uaeReadiness, {
  racecourse_ids: [
    'meydan-racecourse',
    'abu-dhabi-turf-club',
    'al-ain-racecourse',
    'jebel-ali-racecourse',
    'sharjah-racecourse',
  ],
  technical_rank: 'C',
  public_ceiling: 'C',
  source_format: 'mixed',
  access_mode: 'direct',
  automation_mode: 'semi_automatic',
  refresh_classes: ['seasonal', 'manual'],
  readiness: 'prototype_ready',
  implementation_status: 'fixture_validated',
  fallback: 'keep_last_verified_and_mark_stale',
  source_status: 'verified',
  checked_date: '2026-07-11',
  evidence_reviewed_at: '2026-07-11T00:00:00Z',
  revalidation_trigger: 'Revalidate when ERA publishes a replacement fixture PDF, changes venue identities, or the reviewed fixture-window structure no longer closes to 64 C-level observations.',
  blocked_reason: null,
  limitations: 'C-level meeting date and approved racecourse identity only. No race-time or programme-detail claim. PDF fixture-window extraction is review-only and automatic execution/publication remain disabled.',
  notes: 'UAE-PILOT-02 through PILOT-05 provide reviewed article, venue-page, PDF structure, coordinate-grid, boundary-reconciliation, and venue-mapping evidence. The accepted reviewed PDF fixture window is 2026-10-22 through 2027-04-15 inclusive, with 64 C-level label-based observations across five approved venue identities.',
});
writeJson(readinessPath, readiness);

const uaeProfile = {
  system_id: 'uae-national-racing-system',
  country_id: 'united-arab-emirates',
  authority_id: 'emirates-racing-authority',
  profile_status: 'provisional',
  primary_runner: 'github_actions',
  fallback_runner: null,
  schedule_source_id: 'era-season-calendar',
  detail_source_id: null,
  schedule_adapter_id: 'uae-era-pdf-grid-actions-v1',
  detail_adapter_id: null,
  technical_capability_rank: 'C',
  collection_target_rank: 'best_available',
  public_ceiling: 'C',
  supported_observation_ranks: ['C'],
  supports_date_window: false,
  supports_cross_month_window: false,
  supports_selected_meetings: false,
  supports_source_visible_horizon: true,
  supports_rank_upgrade_retry: false,
  pending_fields: ['fallback_runner', 'detail_source_id', 'detail_adapter_id'],
  operator_notes: 'Provisional UAE Stage 10 profile. PILOT-02 through PILOT-05 prove the official article and PDF routes, all five venue identities, a coordinate-aware 64-observation C-level fixture grid, count closure, and the reviewed PDF fixture window. GitHub Actions is the only registered runner. Only source_visible_horizon is enabled; arbitrary date windows, selected meetings, rank-upgrade retry, fallback execution, detail acquisition, automatic approval, promotion, publication, canonical write, and public write remain disabled.',
};
const profileIndex = acquisition.records.findIndex((record) => record.system_id === uaeProfile.system_id);
if (profileIndex >= 0) acquisition.records[profileIndex] = uaeProfile;
else acquisition.records.push(uaeProfile);
writeJson(acquisitionPath, acquisition);

const uaeExecutor = {
  system_id: 'uae-national-racing-system',
  runner: 'github_actions',
  executor_id: 'uae-era-pdf-grid-actions',
  invocation_kind: 'node',
  entry_point: 'scripts/timetable/run-uae-era-pdf-grid-actions.mjs',
  output_model: 'uae-era-pdf-grid-artifact-batch',
  supported_collection_modes: ['source_visible_horizon'],
};
const executorIndex = compatibility.executors.findIndex((entry) => entry.system_id === uaeExecutor.system_id && entry.runner === uaeExecutor.runner);
if (executorIndex >= 0) compatibility.executors[executorIndex] = uaeExecutor;
else compatibility.executors.push(uaeExecutor);
writeJson(compatibilityPath, compatibility);

console.log('UAE_PILOT_06_PROFILE_SYNC: applied');
