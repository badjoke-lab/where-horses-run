import fs from 'node:fs';

const readJson = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));
const writeJson = (path, value) => fs.writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
const replaceExact = (path, before, after) => {
  const current = fs.readFileSync(path, 'utf8');
  if (!current.includes(before)) throw new Error(`${path}: expected synchronization marker missing`);
  fs.writeFileSync(path, current.replace(before, after));
};

const evidenceRunId = 29199123357;
const evidenceArtifactId = 8261852673;
const evidenceDigest = 'sha256:7c6cc386a8092d86b2d603fdea3aa9b890558c89b5f8bfb798af69ae1f9dc379';

const inventoryPath = 'data/static/authority-source-inventory.json';
const inventory = readJson(inventoryPath);
const scheduleIndex = inventory.records.findIndex((record) => record.country_id === 'united-arab-emirates'
  && record.authority_id === 'emirates-racing-authority'
  && record.official_source_id === 'era-season-calendar');
if (scheduleIndex < 0) throw new Error('UAE schedule source missing');
const detailRecord = {
  country_id: 'united-arab-emirates',
  authority_id: 'emirates-racing-authority',
  authority_name_en: 'Emirates Racing Authority',
  authority_name_local: null,
  authority_type: 'national',
  racecourse_scope: 'countrywide',
  official_source_id: 'era-racecard-public-timetable',
  official_source_url: 'https://emiratesracing.com/racecard/2026-04-10/1/declarations',
  source_kind: 'racecard',
  source_status: 'verified',
  last_checked_date: '2026-07-13',
  capability_rank: 'A',
  adapter_candidate_status: 'candidate',
  notes: `Official ERA racecard routes exposed complete Race 1-N post times, distance, and surface for the reviewed Al Ain meeting. Live evidence run ${evidenceRunId}, artifact ${evidenceArtifactId}, ${evidenceDigest}. Participant, betting, result, payout, and raw-source data remain excluded.`,
};
const existingDetailIndex = inventory.records.findIndex((record) => record.country_id === detailRecord.country_id
  && record.authority_id === detailRecord.authority_id
  && record.official_source_id === detailRecord.official_source_id);
if (existingDetailIndex >= 0) inventory.records[existingDetailIndex] = detailRecord;
else inventory.records.splice(scheduleIndex + 1, 0, detailRecord);
writeJson(inventoryPath, inventory);

const readinessPath = 'data/static/calendar-readiness-registry.json';
const readiness = readJson(readinessPath);
const uaeReadiness = readiness.records.find((record) => record.readiness_id === 'united-arab-emirates--uae-national-racing-system--era-season-calendar');
if (!uaeReadiness) throw new Error('UAE readiness record missing');
Object.assign(uaeReadiness, {
  authority_source_key: 'united-arab-emirates/emirates-racing-authority/era-racecard-public-timetable',
  technical_rank: 'A',
  public_ceiling: 'A',
  confirmed_fields: {
    meeting_date: true,
    racecourse: true,
    first_race_time: true,
    last_race_time: true,
    per_race_post_times: true,
    race_name: false,
    distance: true,
    surface: true,
    course: false,
  },
  source_format: 'mixed',
  access_mode: 'date_route',
  automation_mode: 'semi_automatic',
  refresh_classes: ['seasonal', 'weekly', 'near_meeting', 'manual'],
  readiness: 'prototype_ready',
  implementation_status: 'fixture_validated',
  fallback: 'downgrade_to_C',
  source_status: 'verified',
  checked_date: '2026-07-13',
  evidence_reviewed_at: '2026-07-13',
  revalidation_trigger: 'Revalidate when ERA changes its racecard date/race route, when Race 1-N navigation stops closing continuously, or when a future source-visible meeting cannot reproduce reviewed A-level post-time fields.',
  blocked_reason: null,
  limitations: [
    'The season-calendar path remains C-level until the corresponding ERA racecard becomes source-visible.',
    'The reviewed detail route supports A-level race labels and post times; race names are not consistently present, so A+ is not claimed.',
    'Automatic approval, canonical promotion, public writing, unattended publication, and scheduled retry execution remain disabled.',
  ],
  notes: `UAE schedule coverage remains the reviewed 64-meeting five-venue PDF window. Detail recovery live run ${evidenceRunId} proved a complete 10-race Al Ain timetable from 17:00 through 21:30 at Rank A using the official ERA racecard route; artifact ${evidenceArtifactId}, ${evidenceDigest}.`,
});
writeJson(readinessPath, readiness);

const acquisitionPath = 'data/static/calendar-acquisition-registry.json';
const acquisition = readJson(acquisitionPath);
const uaeProfile = acquisition.records.find((record) => record.system_id === 'uae-national-racing-system');
if (!uaeProfile) throw new Error('UAE acquisition profile missing');
Object.assign(uaeProfile, {
  profile_status: 'provisional',
  primary_runner: 'github_actions',
  fallback_runner: null,
  schedule_source_id: 'era-season-calendar',
  detail_source_id: 'era-racecard-public-timetable',
  schedule_adapter_id: 'uae-era-pdf-grid-actions-v1',
  detail_adapter_id: 'uae-era-racecard-detail-artifact-v1',
  technical_capability_rank: 'A',
  collection_target_rank: 'best_available',
  public_ceiling: 'A',
  supported_observation_ranks: ['C', 'A'],
  supports_date_window: false,
  supports_cross_month_window: false,
  supports_selected_meetings: false,
  supports_source_visible_horizon: true,
  supports_rank_upgrade_retry: false,
  pending_fields: ['fallback_runner'],
  operator_notes: `Provisional UAE profile with two evidence-backed routes: the ERA season-calendar PDF grid supplies C-level date/venue observations across the reviewed source-visible horizon, while the official ERA racecard date/race route supplies complete A-level Race 1-N post-time evidence when detail is source-visible. Live detail run ${evidenceRunId} proved 10 Al Ain races from 17:00 through 21:30. Shared near-meeting retry routing, fallback execution, automatic approval, canonical/public writes, and unattended publication remain pending or disabled.`,
});
writeJson(acquisitionPath, acquisition);

const displayPolicyPath = 'src/data/publicationDisplayPolicies.json';
const displayPolicies = readJson(displayPolicyPath);
const uaePolicy = displayPolicies.policies.find((policy) => policy.id === 'uae-reviewed-a-plus');
if (!uaePolicy) throw new Error('UAE display policy missing');
uaePolicy.id = 'uae-reviewed-a';
uaePolicy.max_public_rank = 'A';
uaePolicy.a_plus_fields = {
  show_race_name: false,
  show_distance: false,
  show_surface: false,
  show_course: false,
};
uaePolicy.notes = 'UAE may publish up to A when reviewed ERA racecard data supplies complete Race 1-N post times. Schedule-only records remain C until detail becomes source-visible.';
writeJson(displayPolicyPath, displayPolicies);

const acquisitionChecker = 'scripts/check-calendar-acquisition-registry.mjs';
replaceExact(
  acquisitionChecker,
  `  ['uae-era-pdf-grid-actions-v1', { path: 'scripts/timetable/uae-era-pdf-grid-candidate-core.mjs', marker: "const ADAPTER_ID = 'uae-era-pdf-grid-actions-v1'" }],`,
  `  ['uae-era-pdf-grid-actions-v1', { path: 'scripts/timetable/uae-era-pdf-grid-candidate-core.mjs', marker: "const ADAPTER_ID = 'uae-era-pdf-grid-actions-v1'" }],\n  ['uae-era-racecard-detail-artifact-v1', { path: 'scripts/timetable/uae-era-detail-artifact-core.mjs', marker: "const ADAPTER_ID = 'uae-era-racecard-detail-artifact-v1'" }],`,
);
replaceExact(
  acquisitionChecker,
  `if (uaeProfile?.detail_source_id !== null || uaeProfile?.detail_adapter_id !== null) fail('UAE provisional profile must not claim detail acquisition.');\nif (JSON.stringify(uaeProfile?.supported_observation_ranks) !== JSON.stringify(['C'])) fail('UAE provisional profile must remain C-only.');\nif (uaeProfile?.supports_source_visible_horizon !== true || uaeProfile?.supports_date_window !== false || uaeProfile?.supports_selected_meetings !== false || uaeProfile?.supports_rank_upgrade_retry !== false) fail('UAE profile scope support must remain source-visible-horizon only.');`,
  `if (uaeProfile?.detail_source_id !== 'era-racecard-public-timetable' || uaeProfile?.detail_adapter_id !== 'uae-era-racecard-detail-artifact-v1') fail('UAE provisional profile must preserve the evidence-backed ERA racecard detail route.');\nif (uaeProfile?.technical_capability_rank !== 'A' || uaeProfile?.public_ceiling !== 'A') fail('UAE provisional profile must preserve reviewed A-level capability and ceiling.');\nif (JSON.stringify(uaeProfile?.supported_observation_ranks) !== JSON.stringify(['C', 'A'])) fail('UAE provisional profile must preserve C schedule and A detail observation ranks.');\nif (JSON.stringify(uaeProfile?.pending_fields) !== JSON.stringify(['fallback_runner'])) fail('UAE provisional profile must keep only fallback_runner pending.');\nif (uaeProfile?.supports_source_visible_horizon !== true || uaeProfile?.supports_date_window !== false || uaeProfile?.supports_selected_meetings !== false || uaeProfile?.supports_rank_upgrade_retry !== false) fail('UAE profile must preserve source-visible-horizon schedule support while shared date-window, selected-meeting, and rank-retry routing remain disabled.');`,
);
replaceExact(
  acquisitionChecker,
  `console.log('UAE_PROFILE: provisional / github_actions schedule primary / source-visible-horizon only / C-only');`,
  `console.log('UAE_PROFILE: provisional / C schedule + A detail / fallback and shared rank-retry routing pending');`,
);

const pilotChecker = 'scripts/check-calendar-uae-era-pilot-06-profile-foundation.mjs';
replaceExact(
  pilotChecker,
  `  if (uaeReadiness.technical_rank !== 'C' || uaeReadiness.public_ceiling !== 'C') fail('UAE Readiness rank boundary differs.');\n  if (uaeReadiness.source_format !== 'mixed') fail('UAE Readiness source format differs.');\n  if (uaeReadiness.access_mode !== 'direct') fail('UAE Readiness access mode differs.');\n  if (uaeReadiness.automation_mode !== 'semi_automatic') fail('UAE Readiness automation mode differs.');\n  if (!exact(uaeReadiness.refresh_classes, ['seasonal', 'manual'])) fail('UAE Readiness refresh classes differ.');\n  if (uaeReadiness.readiness !== 'prototype_ready' || uaeReadiness.implementation_status !== 'fixture_validated') fail('UAE Readiness implementation state differs.');\n  if (uaeReadiness.fallback !== 'keep_last_verified_and_mark_stale') fail('UAE Readiness fallback differs.');\n  if (uaeReadiness.checked_date !== '2026-07-11' || !String(uaeReadiness.evidence_reviewed_at).startsWith('2026-07-11')) fail('UAE Readiness review date differs.');\n  if (!String(uaeReadiness.limitations).includes('C-level meeting date and approved racecourse identity only')) fail('UAE Readiness C-only limitation missing.');`,
  `  if (uaeReadiness.technical_rank !== 'A' || uaeReadiness.public_ceiling !== 'A') fail('UAE Readiness recovered rank boundary differs.');\n  if (uaeReadiness.source_format !== 'mixed') fail('UAE Readiness source format differs.');\n  if (uaeReadiness.access_mode !== 'date_route') fail('UAE Readiness access mode differs.');\n  if (uaeReadiness.automation_mode !== 'semi_automatic') fail('UAE Readiness automation mode differs.');\n  if (!exact(uaeReadiness.refresh_classes, ['seasonal', 'weekly', 'near_meeting', 'manual'])) fail('UAE Readiness refresh classes differ.');\n  if (uaeReadiness.readiness !== 'prototype_ready' || uaeReadiness.implementation_status !== 'fixture_validated') fail('UAE Readiness implementation state differs.');\n  if (uaeReadiness.fallback !== 'downgrade_to_C') fail('UAE Readiness fallback differs.');\n  if (uaeReadiness.checked_date !== '2026-07-13' || !String(uaeReadiness.evidence_reviewed_at).startsWith('2026-07-13')) fail('UAE Readiness recovery review date differs.');\n  if (!String(uaeReadiness.limitations).includes('racecard becomes source-visible')) fail('UAE Readiness source-visible detail limitation missing.');`,
);
replaceExact(
  pilotChecker,
  `const uaeSource = authorityInventory.records.find((record) => record.country_id === 'united-arab-emirates' && record.authority_id === 'emirates-racing-authority' && record.official_source_id === 'era-season-calendar');\nif (!uaeSource) fail('UAE ERA authority source inventory record missing.');\nelse {\n  if (uaeSource.official_source_id !== 'era-season-calendar') fail('UAE ERA source ID differs.');\n  if (uaeSource.capability_rank !== 'C') fail('UAE ERA source inventory capability rank differs.');\n  if (uaeSource.source_status !== 'verified') fail('UAE ERA source inventory status differs.');\n}`,
  `const uaeSource = authorityInventory.records.find((record) => record.country_id === 'united-arab-emirates' && record.authority_id === 'emirates-racing-authority' && record.official_source_id === 'era-season-calendar');\nif (!uaeSource) fail('UAE ERA authority source inventory record missing.');\nelse {\n  if (uaeSource.official_source_id !== 'era-season-calendar') fail('UAE ERA source ID differs.');\n  if (uaeSource.capability_rank !== 'C') fail('UAE ERA schedule source inventory capability rank differs.');\n  if (uaeSource.source_status !== 'verified') fail('UAE ERA source inventory status differs.');\n}\nconst uaeDetailSource = authorityInventory.records.find((record) => record.country_id === 'united-arab-emirates' && record.authority_id === 'emirates-racing-authority' && record.official_source_id === 'era-racecard-public-timetable');\nif (!uaeDetailSource || uaeDetailSource.capability_rank !== 'A' || uaeDetailSource.source_status !== 'verified') fail('UAE ERA detail source inventory evidence differs.');`,
);
replaceExact(
  pilotChecker,
  `  if (profile.detail_source_id !== null || profile.detail_adapter_id !== null) fail('UAE detail route must remain inactive.');\n  if (profile.technical_capability_rank !== 'C' || profile.public_ceiling !== 'C') fail('UAE profile rank boundary differs.');\n  if (!exact(profile.supported_observation_ranks, ['C'])) fail('UAE supported observation ranks differ.');\n  if (profile.supports_source_visible_horizon !== true) fail('UAE source-visible-horizon support missing.');\n  for (const key of ['supports_date_window','supports_cross_month_window','supports_selected_meetings','supports_rank_upgrade_retry']) {\n    if (profile[key] !== false) fail(\`UAE profile \${key} must remain false.\`);\n  }\n  for (const field of ['fallback_runner','detail_source_id','detail_adapter_id']) {\n    if (!profile.pending_fields?.includes(field)) fail(\`UAE profile pending field missing \${field}.\`);\n  }`,
  `  if (profile.detail_source_id !== 'era-racecard-public-timetable' || profile.detail_adapter_id !== 'uae-era-racecard-detail-artifact-v1') fail('UAE detail route recovery differs.');\n  if (profile.technical_capability_rank !== 'A' || profile.public_ceiling !== 'A') fail('UAE recovered profile rank boundary differs.');\n  if (!exact(profile.supported_observation_ranks, ['C', 'A'])) fail('UAE supported observation ranks differ.');\n  if (profile.supports_source_visible_horizon !== true) fail('UAE source-visible-horizon support missing.');\n  for (const key of ['supports_date_window','supports_cross_month_window','supports_selected_meetings','supports_rank_upgrade_retry']) {\n    if (profile[key] !== false) fail(\`UAE profile \${key} must remain false until shared route integration.\`);\n  }\n  if (!exact(profile.pending_fields, ['fallback_runner'])) fail('UAE profile must keep only fallback_runner pending.');`,
);
replaceExact(pilotChecker, `console.log('SUPPORTED_RANKS: C');\nconsole.log('DETAIL_ROUTE: inactive');`, `console.log('SUPPORTED_RANKS: C,A');\nconsole.log('DETAIL_ROUTE: era-racecard-public-timetable / evidence-backed A');`);

const handoffChecker = 'scripts/check-calendar-uae-era-handoff-decision.mjs';
replaceExact(
  handoffChecker,
  `  if (profile.detail_source_id !== null || profile.detail_adapter_id !== null) fail('UAE Registry detail route must remain inactive.');\n  if (!exact(profile.supported_observation_ranks, ['C'])) fail('UAE Registry ranks must remain C-only.');\n  if (profile.supports_source_visible_horizon !== true) fail('UAE Registry source-visible-horizon support missing.');`,
  `  if (profile.detail_source_id !== 'era-racecard-public-timetable' || profile.detail_adapter_id !== 'uae-era-racecard-detail-artifact-v1') fail('UAE Registry current detail recovery route differs.');\n  if (profile.technical_capability_rank !== 'A' || profile.public_ceiling !== 'A') fail('UAE Registry current A-level boundary differs.');\n  if (!exact(profile.supported_observation_ranks, ['C', 'A'])) fail('UAE Registry current ranks must preserve C schedule and A detail.');\n  if (profile.supports_source_visible_horizon !== true) fail('UAE Registry source-visible-horizon support missing.');`,
);
replaceExact(
  handoffChecker,
  `  if (readinessRecord.technical_rank !== 'C' || readinessRecord.public_ceiling !== 'C') fail('UAE Readiness rank boundary differs.');`,
  `  if (readinessRecord.technical_rank !== 'A' || readinessRecord.public_ceiling !== 'A') fail('UAE Readiness current recovered rank boundary differs.');`,
);
replaceExact(
  handoffChecker,
  `console.log('DETAIL_ROUTE: inactive');`,
  `console.log('HISTORICAL_DETAIL_ROUTE: inactive at UAE-HANDOFF-01');\nconsole.log('CURRENT_DETAIL_ROUTE: era-racecard-public-timetable / A evidence-backed');`,
);

const handoffDocPath = 'docs/calendar/uae-era-handoff-decision.md';
replaceExact(
  handoffDocPath,
  `# UAE ERA bounded reviewed steady-state handoff decision\n`,
  `# UAE ERA bounded reviewed steady-state handoff decision\n\n> Supersession notice (2026-07-13): this document remains the historical decision for the C-level season-calendar route. It no longer represents current UAE capability. \\`WHR-CAL-UAE-ERA-DETAIL-RECOVERY\\` has since proved and registered an official ERA A-level racecard detail route.\n`,
);

const recoveryDocPath = 'docs/calendar/uae-era-detail-recovery.md';
fs.appendFileSync(recoveryDocPath, `\n## Accepted live evidence\n\n- workflow run: \\`${evidenceRunId}\\`;\n- artifact: \\`${evidenceArtifactId}\\`;\n- artifact digest: \\`${evidenceDigest}\\`;\n- meeting: Al Ain, 2026-04-10;\n- Race 1-N closure: 10 races;\n- first/last post time: 17:00 / 21:30;\n- observed rank: A;\n- source errors: 0;\n- canonical/public writes: none.\n\nThe UAE Acquisition Registry and Calendar Readiness boundary are therefore corrected from C-only to C schedule plus A detail capability. Shared automatic near-meeting retry execution remains a separate follow-up.\n`);

fs.rmSync('scripts/temporary-activate-uae-era-detail-recovery.mjs', { force: true });
fs.rmSync('.github/workflows/temporary-activate-uae-era-detail-recovery.yml', { force: true });

console.log('UAE_ERA_DETAIL_ACTIVATION_SYNC: applied');
