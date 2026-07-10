import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const audit = readJson('data/audits/calendar-uae-era-pilot-02-source-route-evidence-v1.json');
const baseline = readJson('data/audits/calendar-uae-era-pilot-01-baseline-v1.json');
const readiness = readJson('data/static/calendar-readiness-registry.json');
const doc = readText('docs/calendar/uae-era-pilot-02-source-route.md');

if (audit.schema_version !== 'calendar-uae-era-pilot-02-source-route-evidence-v1') fail('audit schema differs.');
if (audit.work_id !== 'WHR-CAL-UAE-ERA' || audit.implementation_unit !== 'UAE-PILOT-02') fail('audit Work identity differs.');
if (Number.isNaN(Date.parse(audit.reviewed_at))) fail('audit reviewed_at invalid.');

const evidence = audit.evidence_run ?? {};
if (evidence.workflow_run_id !== 29113262632) fail('workflow run ID differs.');
if (evidence.artifact_id !== 8235587195) fail('artifact ID differs.');
if (evidence.artifact_digest !== 'sha256:1bb8f25dd2fbec9904e513feeaa218e489e1b32886b75b2546d4a3ee179b4327') fail('artifact digest differs.');
if (Number.isNaN(Date.parse(evidence.checked_at))) fail('evidence checked_at invalid.');

const article = evidence.article_route ?? {};
if (article.http_status !== 200 || article.response_ok !== true || article.final_host !== 'emiratesracing.com') fail('article route response differs.');
if (article.response_bytes !== 48506) fail('article response byte count differs.');
if (article.season_start_year !== 2026 || article.season_end_year !== 2027) fail('season years differ.');
if (article.opening_date !== '2026-10-22' || article.opening_venue_label !== 'Abu Dhabi Turf Club') fail('opening observation differs.');
if (article.closing_date !== '2027-03-27') fail('closing date differs.');
if (article.total_race_meetings !== 64 || article.total_racecourses !== 5 || article.venue_count_sum !== 64) fail('season summary closure differs.');
if (!exact(article.venue_meeting_counts, { meydan: 17, abu_dhabi: 16, al_ain: 14, jebel_ali: 11, sharjah: 6 })) fail('venue counts differ.');
if (!exact(article.mapped_meeting_ids, ['uae-meydan-racecourse-2027-03-27'])) fail('mapped meeting IDs differ.');
if (!exact(article.unresolved_venue_observations, [{ date: '2026-10-22', venue_label: 'Abu Dhabi Turf Club', reason: 'canonical_racecourse_id_not_reviewed' }])) fail('unresolved venue observation differs.');
if (article.raw_html_stored !== false) fail('raw HTML boundary differs.');

const candidate = evidence.candidate_artifacts ?? {};
if (candidate.records_discovered !== 1 || candidate.records_updated !== 0) fail('candidate record counts differ.');
if (!exact(candidate.rank_counts, { C: 1, B: 0, 'B+': 0, A: 0, 'A+': 0 })) fail('candidate rank counts differ.');
if (candidate.coverage_claim !== 'partial' || !exact(candidate.unresolved_dates, ['2026-10-22'])) fail('candidate coverage boundary differs.');
if (candidate.source_error_count !== 0) fail('candidate source error count differs.');
if (candidate.candidate_review_state !== 'needs_review' || candidate.promotion_target !== null) fail('candidate review state differs.');
if (candidate.registry_activation !== false || candidate.canonical_write !== 'disabled' || candidate.public_write !== 'disabled' || candidate.publication_effect !== 'none') fail('candidate side-effect boundary differs.');

const pdf = evidence.pdf_route ?? {};
if (pdf.http_status !== 200 || pdf.response_ok !== true) fail('PDF route response differs.');
if (pdf.final_host !== 'd2xuc5ucjmnf40.cloudfront.net') fail('PDF final host differs.');
if (pdf.content_type !== 'application/pdf') fail('PDF content type differs.');
if (pdf.response_bytes !== 161107 || pdf.pdf_magic !== true || pdf.raw_pdf_stored !== false) fail('PDF route evidence differs.');
if (evidence.protected_state_hash_check !== 'pass' || evidence.repository_clean_after_run !== true) fail('immutability/cleanup evidence differs.');

const decision = audit.decision ?? {};
if (decision.article_html_route !== 'evidence_backed_c_level_partial_schedule_route') fail('article route decision differs.');
if (decision.pdf_route !== 'reachable_secondary_source_route_parsing_not_yet_proven') fail('PDF route decision differs.');
if (decision.registry_activation !== false) fail('Registry activation must remain false.');
if (decision.trusted_candidate_scope !== 'meydan_only') fail('trusted candidate scope differs.');
if (decision.broader_venue_mapping_status !== 'pending_canonical_id_mapping_review') fail('venue mapping status differs.');
if (decision.coverage_status !== 'partial') fail('coverage status differs.');

if (audit.next_unit?.id !== 'UAE-PILOT-03') fail('next unit differs.');
if (audit.next_unit?.title !== 'UAE ERA venue mapping and PDF calendar extraction evidence') fail('next unit title differs.');
for (const [key, value] of Object.entries(audit.boundaries ?? {})) if (value !== false) fail(`boundary ${key} must remain false.`);

if (baseline.work_id !== 'WHR-CAL-UAE-ERA' || baseline.implementation_unit !== 'UAE-PILOT-01') fail('PILOT-01 baseline identity differs.');
if (!exact(baseline.trusted_racecourse_ids_for_pilot_01, ['meydan-racecourse'])) fail('PILOT-01 trusted mapping differs.');
const readinessRecord = readiness.records.find((record) => record.readiness_id === baseline.readiness_id);
if (!readinessRecord) fail('UAE readiness record missing.');
else {
  if (readinessRecord.technical_rank !== 'C' || readinessRecord.public_ceiling !== 'C') fail('readiness rank differs.');
  if (!exact(readinessRecord.racecourse_ids, ['meydan-racecourse'])) fail('readiness racecourse IDs changed without mapping review.');
}

for (const phrase of [
  'Status: bounded live evidence implementation',
  'Official article HTML',
  'Fixture PDF endpoint',
  'Meydan Racecourse -> meydan-racecourse',
  'canonical_racecourse_id_not_reviewed',
  'coverage: partial',
  'PDF reachability is not required',
  'Registry activation',
]) {
  if (!doc.includes(phrase)) fail(`PILOT-02 document missing ${phrase}.`);
}

const serialized = JSON.stringify(audit).toLowerCase();
for (const forbidden of ['raw_html', 'source_body', 'horse_name', 'jockey_name', 'trainer_name', 'odds_value', 'result_payload', 'payout_amount', 'prediction', 'tip', 'stream_url']) {
  if (serialized.includes(`"${forbidden}"`)) fail(`audit contains forbidden key ${forbidden}.`);
}

if (errors.length) {
  console.error(`CALENDAR_UAE_ERA_PILOT_02_SOURCE_ROUTE_EVIDENCE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_UAE_ERA_PILOT_02_SOURCE_ROUTE_EVIDENCE: pass');
console.log('WORKFLOW_RUN_ID: 29113262632');
console.log('ARTICLE_ROUTE: evidence_backed_c_level_partial_schedule_route');
console.log('PDF_ROUTE: reachable_secondary_source_route_parsing_not_yet_proven');
console.log('MAPPED_CANDIDATE: uae-meydan-racecourse-2027-03-27');
console.log('UNRESOLVED_VENUE_DATE: 2026-10-22');
console.log('COVERAGE_STATUS: partial');
console.log('REGISTRY_ACTIVATION: false');
console.log('NEXT_UNIT: UAE-PILOT-03');
