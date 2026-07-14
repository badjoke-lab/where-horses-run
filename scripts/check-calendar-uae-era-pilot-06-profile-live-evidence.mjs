import fs from 'node:fs';
import path from 'node:path';
import { validateCurrentUaeState, validateHistoricalAudit, readJson, exact } from './lib/check-uae-era-current-state.mjs';

const root = process.cwd();
const errors = [];
const audit = readJson(root, 'data/audits/calendar-uae-era-pilot-06-profile-live-evidence-v1.json');
const jobFixture = readJson(root, 'data/fixtures/calendar-uae-era-pilot-06-job-v1.json');
const p5 = readJson(root, 'data/audits/calendar-uae-era-pilot-05-boundary-mapping-decision-v1.json');

validateHistoricalAudit({ audit, schemaVersion: 'calendar-uae-era-pilot-06-profile-live-evidence-v1', implementationUnit: 'UAE-PILOT-06', errors });
const evidence = audit.evidence_run ?? {};
if (evidence.workflow_run_id !== 29143729235 || evidence.artifact_id !== 8246040300) errors.push('PILOT-06 evidence identity differs.');
if (evidence.artifact_digest !== 'sha256:5b1832ca37e64fa3fb61630b1072ca45a86787510b4340014906347320bc4415') errors.push('PILOT-06 artifact digest differs.');
if (evidence.runner_used !== 'github_actions' || evidence.collection_mode !== 'source_visible_horizon') errors.push('PILOT-06 historical execution route differs.');
if (evidence.records_discovered !== 64 || evidence.records_updated !== 0 || evidence.coverage_claim !== 'source_window_complete') errors.push('PILOT-06 historical result closure differs.');
if (!exact(evidence.racecourse_record_counts, { 'meydan-racecourse': 17, 'abu-dhabi-turf-club': 16, 'al-ain-racecourse': 14, 'jebel-ali-racecourse': 11, 'sharjah-racecourse': 6 })) errors.push('PILOT-06 historical racecourse counts differ.');
if (evidence.candidate_mode !== 'review_only' || evidence.candidate_review_state !== 'needs_review' || evidence.promotion_target !== null || evidence.publication_effect !== 'none') errors.push('PILOT-06 review-only boundary differs.');
for (const key of ['raw_pdf_storage', 'raw_text_storage', 'registry_write', 'canonical_write', 'public_write']) {
  if (evidence[key] !== 'disabled') errors.push(`PILOT-06 historical boundary differs: ${key}.`);
}
if (evidence.protected_state_hash_check !== 'pass' || evidence.repository_clean_after_run !== true) errors.push('PILOT-06 protected-state evidence differs.');

const accepted = audit.accepted_profile_state ?? {};
if (accepted.racecourse_identity_count !== 5 || accepted.readiness_state !== 'prototype_ready' || accepted.technical_rank !== 'C' || accepted.public_ceiling !== 'C') errors.push('PILOT-06 accepted historical C profile differs.');
if (accepted.acquisition_profile_status !== 'provisional' || accepted.detail_source_id !== null || accepted.detail_adapter_id !== null) errors.push('PILOT-06 accepted historical profile boundary differs.');
if (audit.decision?.profile_foundation !== 'evidence_backed_review_only_c_level' || audit.decision?.canonical_publication_path !== 'not_activated') errors.push('PILOT-06 historical decision differs.');
if (jobFixture.job?.collection_mode !== 'source_visible_horizon' || jobFixture.expected?.records_discovered !== 64) errors.push('PILOT-06 Job fixture differs.');
if (p5.venue_mapping_approval?.decision?.approved_mapping_count !== 5) errors.push('PILOT-05 mapping approval dependency differs.');
for (const file of ['docs/calendar/uae-era-pilot-06-profile-foundation.md', '.github/workflows/calendar-uae-era-pilot-06-profile-foundation.yml']) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`PILOT-06 component missing: ${file}.`);
}

validateCurrentUaeState(root, errors);

if (errors.length) {
  console.error(`CALENDAR_UAE_ERA_PILOT_06_PROFILE_LIVE_EVIDENCE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_UAE_ERA_PILOT_06_PROFILE_LIVE_EVIDENCE: pass');
console.log('HISTORICAL_PROFILE: provisional_C_schedule_only');
console.log('CURRENT_PROFILE: active_C_schedule_plus_A_detail');
