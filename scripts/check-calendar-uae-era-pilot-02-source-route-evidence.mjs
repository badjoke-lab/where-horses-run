import { validateCurrentUaeState, validateHistoricalAudit, readJson, readText, exact } from './lib/check-uae-era-current-state.mjs';

const root = process.cwd();
const errors = [];
const audit = readJson(root, 'data/audits/calendar-uae-era-pilot-02-source-route-evidence-v1.json');
const baseline = readJson(root, 'data/audits/calendar-uae-era-pilot-01-baseline-v1.json');
const doc = readText(root, 'docs/calendar/uae-era-pilot-02-source-route.md');

validateHistoricalAudit({ audit, schemaVersion: 'calendar-uae-era-pilot-02-source-route-evidence-v1', implementationUnit: 'UAE-PILOT-02', errors });
const evidence = audit.evidence_run ?? {};
if (evidence.workflow_run_id !== 29113262632 || evidence.artifact_id !== 8235587195) errors.push('PILOT-02 evidence identity differs.');
if (evidence.artifact_digest !== 'sha256:1bb8f25dd2fbec9904e513feeaa218e489e1b32886b75b2546d4a3ee179b4327') errors.push('PILOT-02 artifact digest differs.');
if (evidence.article_route?.total_race_meetings !== 64 || evidence.article_route?.total_racecourses !== 5) errors.push('PILOT-02 article evidence closure differs.');
if (!exact(evidence.article_route?.venue_meeting_counts, { meydan: 17, abu_dhabi: 16, al_ain: 14, jebel_ali: 11, sharjah: 6 })) errors.push('PILOT-02 venue counts differ.');
if (evidence.article_route?.raw_html_stored !== false || evidence.pdf_route?.raw_pdf_stored !== false) errors.push('PILOT-02 raw-source boundary differs.');
if (evidence.candidate_artifacts?.candidate_review_state !== 'needs_review' || evidence.candidate_artifacts?.promotion_target !== null || evidence.candidate_artifacts?.publication_effect !== 'none') errors.push('PILOT-02 review-only boundary differs.');
if (audit.decision?.registry_activation !== false || audit.decision?.coverage_status !== 'partial') errors.push('PILOT-02 historical decision differs.');
if (baseline.implementation_unit !== 'UAE-PILOT-01' || !exact(baseline.trusted_racecourse_ids_for_pilot_01, ['meydan-racecourse'])) errors.push('PILOT-01 historical baseline differs.');
for (const phrase of ['Status: bounded live evidence implementation', 'Official article HTML', 'Fixture PDF endpoint', 'coverage: partial']) {
  if (!doc.includes(phrase)) errors.push(`PILOT-02 document missing ${phrase}.`);
}
validateCurrentUaeState(root, errors);

if (errors.length) {
  console.error(`CALENDAR_UAE_ERA_PILOT_02_SOURCE_ROUTE_EVIDENCE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_UAE_ERA_PILOT_02_SOURCE_ROUTE_EVIDENCE: pass');
console.log('HISTORICAL_SCOPE: partial_meydan_only');
console.log('CURRENT_SCOPE: five_venues_C_schedule_plus_A_detail');
