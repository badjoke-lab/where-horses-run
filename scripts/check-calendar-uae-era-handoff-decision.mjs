import fs from 'node:fs';
import path from 'node:path';
import { validateCurrentUaeState, readJson, readText } from './lib/check-uae-era-current-state.mjs';

const root = process.cwd();
const errors = [];
const decision = readJson(root, 'data/audits/calendar-uae-era-handoff-decision-v1.json');
const p5 = readJson(root, 'data/audits/calendar-uae-era-pilot-05-boundary-mapping-decision-v1.json');
const p6 = readJson(root, 'data/audits/calendar-uae-era-pilot-06-profile-live-evidence-v1.json');
const doc = readText(root, 'docs/calendar/uae-era-handoff-decision.md');

if (decision.schema_version !== 'calendar-uae-era-handoff-decision-v1' || decision.work_id !== 'WHR-CAL-UAE-ERA' || decision.decision_id !== 'UAE-HANDOFF-01') errors.push('UAE historical handoff identity differs.');
if (decision.decision !== 'accept_bounded_reviewed_steady_state_handoff' || decision.completed_work_id !== 'WHR-CAL-UAE-ERA' || decision.next_work_id !== 'WHR-CAL-PUBLIC-V1') errors.push('UAE historical handoff decision differs.');
if (Number.isNaN(Date.parse(decision.reviewed_at))) errors.push('UAE handoff reviewed_at invalid.');
const accepted = decision.accepted_state ?? {};
if (accepted.registry_profile_status !== 'provisional' || accepted.readiness_state !== 'prototype_ready' || accepted.technical_rank === 'A') errors.push('UAE historical accepted C-only handoff differs.');
if (accepted.schedule_route?.status !== 'active_review_only' || accepted.schedule_route?.reviewed_record_count !== 64 || accepted.schedule_route?.coverage_claim !== 'source_window_complete') errors.push('UAE historical schedule handoff closure differs.');
if (accepted.detail_route?.status !== 'inactive' || accepted.detail_route?.source_id !== null || accepted.detail_route?.adapter_id !== null) errors.push('UAE historical inactive-detail boundary differs.');
for (const [key, value] of Object.entries(decision.boundaries ?? {})) if (value !== false) errors.push(`UAE historical handoff boundary differs: ${key}.`);
if (p5.venue_mapping_approval?.decision?.approved_mapping_count !== 5) errors.push('UAE PILOT-05 mapping approval differs.');
if (p6.evidence_run?.records_discovered !== 64 || p6.evidence_run?.coverage_claim !== 'source_window_complete') errors.push('UAE PILOT-06 evidence dependency differs.');
for (const phrase of ['UAE-HANDOFF-01', 'WHR-CAL-PUBLIC-V1', 'bounded', 'review']) {
  if (!doc.toLowerCase().includes(phrase.toLowerCase())) errors.push(`UAE handoff document missing ${phrase}.`);
}
for (const ref of decision.evidence_refs ?? []) if (!fs.existsSync(path.join(root, ref))) errors.push(`UAE handoff evidence ref missing: ${ref}.`);

validateCurrentUaeState(root, errors);

if (errors.length) {
  console.error(`CALENDAR_UAE_ERA_HANDOFF_DECISION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_UAE_ERA_HANDOFF_DECISION: pass');
console.log('HISTORICAL_HANDOFF: bounded_C_schedule_only');
console.log('CURRENT_OPERATION: active_C_schedule_plus_A_detail_review_only');
