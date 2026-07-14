import fs from 'node:fs';
import path from 'node:path';

export const expectedUaeRacecourses = [
  'meydan-racecourse',
  'abu-dhabi-turf-club',
  'al-ain-racecourse',
  'jebel-ali-racecourse',
  'sharjah-racecourse',
];

export function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

export function readText(root, relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

export function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function validateHistoricalAudit({ audit, schemaVersion, implementationUnit, errors }) {
  if (audit.schema_version !== schemaVersion) errors.push(`${implementationUnit}: historical audit schema differs.`);
  if (audit.work_id !== 'WHR-CAL-UAE-ERA' || audit.implementation_unit !== implementationUnit) errors.push(`${implementationUnit}: historical Work identity differs.`);
  if (Number.isNaN(Date.parse(audit.reviewed_at))) errors.push(`${implementationUnit}: historical reviewed_at invalid.`);
  const serialized = JSON.stringify(audit).toLowerCase();
  for (const forbidden of ['raw_html', 'source_body', 'horse_name', 'jockey_name', 'trainer_name', 'odds_value', 'result_payload', 'payout_amount', 'prediction', 'tip', 'stream_url']) {
    if (serialized.includes(`"${forbidden}"`)) errors.push(`${implementationUnit}: historical audit contains forbidden key ${forbidden}.`);
  }
}

export function validateCurrentUaeState(root, errors) {
  const acquisition = readJson(root, 'data/static/calendar-acquisition-registry.json');
  const readiness = readJson(root, 'data/static/calendar-readiness-registry.json');
  const compatibility = readJson(root, 'data/static/calendar-runner-compatibility-contract-v1.json');

  const profile = acquisition.records.find((record) => record.system_id === 'uae-national-racing-system');
  if (!profile) errors.push('Current UAE Acquisition profile missing.');
  else {
    if (profile.profile_status !== 'active') errors.push('Current UAE profile must be active.');
    if (profile.primary_runner !== 'github_actions' || profile.fallback_runner !== null) errors.push('Current UAE runner state differs.');
    if (profile.schedule_source_id !== 'era-season-calendar' || profile.schedule_adapter_id !== 'uae-era-pdf-grid-actions-v1') errors.push('Current UAE schedule route differs.');
    if (profile.detail_source_id !== 'era-racecard-public-timetable' || profile.detail_adapter_id !== 'uae-era-racecard-detail-artifact-v1') errors.push('Current UAE detail route differs.');
    if (profile.technical_capability_rank !== 'A' || profile.public_ceiling !== 'A') errors.push('Current UAE A-level boundary differs.');
    if (!exact(profile.supported_observation_ranks, ['C', 'A'])) errors.push('Current UAE observation ranks differ.');
    if (profile.supports_source_visible_horizon !== true || profile.supports_selected_meetings !== true || profile.supports_rank_upgrade_retry !== true) errors.push('Current UAE reviewed acquisition modes differ.');
    if (profile.supports_date_window !== false || profile.supports_cross_month_window !== false) errors.push('Current UAE unsupported window modes changed.');
  }

  const schedule = readiness.records.find((record) => record.readiness_id === 'united-arab-emirates--uae-national-racing-system--era-season-calendar');
  if (!schedule) errors.push('Current UAE schedule Readiness missing.');
  else {
    if (!exact(schedule.racecourse_ids, expectedUaeRacecourses)) errors.push('Current UAE schedule racecourse scope differs.');
    if (schedule.readiness !== 'prototype_ready' || schedule.implementation_status !== 'fixture_validated' || schedule.automation_mode !== 'semi_automatic') errors.push('Current UAE schedule Readiness state differs.');
    if (schedule.technical_rank !== 'C' || schedule.public_ceiling !== 'C') errors.push('Current UAE schedule rank boundary differs.');
  }

  const detail = readiness.records.find((record) => record.readiness_id === 'united-arab-emirates--uae-national-racing-system--era-racecard-public-timetable');
  if (!detail) errors.push('Current UAE detail Readiness missing.');
  else {
    if (detail.technical_rank !== 'A' || detail.public_ceiling !== 'A') errors.push('Current UAE detail Readiness boundary differs.');
    if (detail.readiness !== 'prototype_ready' || detail.automation_mode !== 'semi_automatic') errors.push('Current UAE detail Readiness state differs.');
  }

  const executor = compatibility.executors.find((entry) => entry.system_id === 'uae-national-racing-system' && entry.runner === 'github_actions');
  if (!executor) errors.push('Current UAE Actions executor missing.');
  else {
    if (executor.executor_id !== 'uae-era-actions') errors.push('Current UAE executor ID differs.');
    if (executor.entry_point !== 'scripts/timetable/run-uae-era-actions-job.mjs') errors.push('Current UAE executor entry point differs.');
    if (!exact(executor.supported_collection_modes, ['source_visible_horizon', 'selected_meetings'])) errors.push('Current UAE executor modes differ.');
  }

  if (compatibility.side_effect_boundary?.approval !== false || compatibility.side_effect_boundary?.promotion !== false || compatibility.side_effect_boundary?.canonical_write !== false || compatibility.side_effect_boundary?.public_write !== false || compatibility.side_effect_boundary?.publication !== false || compatibility.side_effect_boundary?.deployment !== false) {
    errors.push('Current UAE runner side-effect boundary differs.');
  }

  return { profile, schedule, detail, executor };
}
