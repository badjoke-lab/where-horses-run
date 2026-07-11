import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const audit = readJson('data/audits/calendar-uae-era-pilot-04-grid-parser-evidence-v1.json');
const p3 = readJson('data/audits/calendar-uae-era-pilot-03-pdf-evidence-v1.json');
const mapping = readJson('data/audits/calendar-uae-era-pilot-03-venue-mapping-v1.json');
const p2 = readJson('data/audits/calendar-uae-era-pilot-02-source-route-evidence-v1.json');
const readiness = readJson('data/static/calendar-readiness-registry.json');
const doc = readText('docs/calendar/uae-era-pilot-04-coordinate-grid-parser.md');

if (audit.schema_version !== 'calendar-uae-era-pilot-04-grid-parser-evidence-v1') fail('PILOT-04 audit schema differs.');
if (audit.work_id !== 'WHR-CAL-UAE-ERA' || audit.implementation_unit !== 'UAE-PILOT-04') fail('PILOT-04 audit Work identity differs.');
if (Number.isNaN(Date.parse(audit.reviewed_at))) fail('PILOT-04 reviewed_at invalid.');

const evidence = audit.evidence_run ?? {};
if (evidence.workflow_run_id !== 29142374154) fail('PILOT-04 workflow run ID differs.');
if (evidence.artifact_id !== 8245577585) fail('PILOT-04 artifact ID differs.');
if (evidence.artifact_digest !== 'sha256:139343efe9771fd6a3a41cb15741961632bcddf739ab9ba447b3f8081eeee847') fail('PILOT-04 artifact digest differs.');

const coordinate = evidence.coordinate_summary ?? {};
if (coordinate.page_count !== 1) fail('coordinate evidence page count differs.');
if (!exact(coordinate.month_sequence, ['October','November','December','January','February','March','April'])) fail('coordinate evidence month sequence differs.');
if (coordinate.month_tokens !== 7 || coordinate.weekday_tokens !== 212 || coordinate.day_tokens !== 218 || coordinate.venue_anchors !== 70) fail('coordinate evidence token counts differ.');
if (coordinate.raw_pdf_stored !== false || coordinate.raw_text_stored !== false || coordinate.unapproved_text_emitted !== false) fail('coordinate raw-source boundary differs.');

const grid = evidence.grid_parser ?? {};
if (grid.parser_mode !== 'coordinate_aware_public_safe_grid') fail('grid parser mode differs.');
if (grid.observation_count !== 64) fail('grid parser observation count differs.');
if (!exact(grid.month_meeting_counts, {
  '2026-10': 4,
  '2026-11': 11,
  '2026-12': 10,
  '2027-01': 13,
  '2027-02': 11,
  '2027-03': 10,
  '2027-04': 5,
})) fail('grid parser month counts differ.');
if (!exact(grid.venue_meeting_counts, {
  Meydan: 17,
  'Abu Dhabi': 16,
  'Al Ain': 14,
  'Jebel Ali': 11,
  Sharjah: 6,
})) fail('grid parser venue counts differ.');
if (grid.max_day_venue_y_delta !== 0.525) fail('grid parser pairing delta differs.');
if (grid.weekday_calendar_validation !== 'pass') fail('weekday calendar validation differs.');
if (grid.duplicate_date_venue_observations !== 0) fail('duplicate date/venue observation count differs.');
if (grid.accepted_existing_observation_count !== 17 || grid.proposed_unapproved_observation_count !== 47) fail('mapping-state observation counts differ.');
if (grid.candidate_generation_scope !== 'meydan_only') fail('candidate generation scope differs.');

const boundary = evidence.source_boundary_comparison ?? {};
if (boundary.article_opening_date !== '2026-10-22' || boundary.pdf_first_observation_date !== '2026-10-22' || boundary.opening_dates_match !== true) fail('opening boundary comparison differs.');
if (boundary.article_narrative_closing_date !== '2027-03-27') fail('article narrative closing date differs.');
if (boundary.pdf_last_observation_date !== '2027-04-15') fail('PDF last observation date differs.');
if (boundary.pdf_observation_count_after_article_closing_date !== 5) fail('post-article-closing PDF observation count differs.');
if (!exact(boundary.pdf_observation_dates_after_article_closing_date, ['2027-04-01','2027-04-02','2027-04-08','2027-04-09','2027-04-15'])) fail('post-article-closing dates differ.');
if (boundary.boundary_status !== 'source_boundary_difference_requires_review') fail('source boundary status differs.');
if (evidence.protected_state_hash_check !== 'pass' || evidence.repository_clean_after_run !== true) fail('protected-state or cleanup evidence differs.');

const decision = audit.decision ?? {};
if (decision.coordinate_parser !== 'evidence_backed_64_label_based_meeting_observations') fail('coordinate parser decision differs.');
if (decision.month_count_closure !== 'pass') fail('month count closure decision differs.');
if (decision.venue_count_closure !== 'pass_matches_official_article_counts') fail('venue count closure decision differs.');
if (decision.weekday_coordinate_validation !== 'pass') fail('weekday coordinate decision differs.');
if (decision.date_venue_pairing !== 'evidence_backed') fail('date/venue pairing decision differs.');
if (decision.source_boundary_status !== 'difference_requires_explicit_reconciliation') fail('source-boundary decision differs.');
for (const key of ['mapping_approval', 'broader_candidate_generation', 'registry_activation']) {
  if (decision[key] !== false) fail(`decision ${key} must remain false.`);
}
if (!String(decision.reason).includes('five April observations')) fail('decision reason must preserve April source-boundary difference.');

if (audit.next_unit?.id !== 'UAE-PILOT-05') fail('next unit ID differs.');
if (audit.next_unit?.title !== 'UAE ERA source-boundary reconciliation and venue mapping approval decision') fail('next unit title differs.');
for (const [key, value] of Object.entries(audit.boundaries ?? {})) if (value !== false) fail(`PILOT-04 boundary ${key} must remain false.`);

if (p3.decision?.pdf_date_venue_pairing !== 'not_evidence_backed_coordinate_aware_grid_parser_required') fail('PILOT-03 parser handoff state differs.');
if (p3.decision?.candidate_scope !== 'meydan_only') fail('PILOT-03 candidate scope differs.');
if (mapping.decision?.accepted_existing_mapping_count !== 1 || mapping.decision?.proposed_unapproved_mapping_count !== 4) fail('PILOT-03 mapping audit counts differ.');
if (p2.evidence_run?.article_route?.total_race_meetings !== 64 || p2.evidence_run?.article_route?.total_racecourses !== 5) fail('PILOT-02 article season summary differs.');
if (!exact(p2.evidence_run?.article_route?.venue_meeting_counts, { meydan:17, abu_dhabi:16, al_ain:14, jebel_ali:11, sharjah:6 })) fail('PILOT-02 article venue counts differ.');

const readinessRecord = readiness.records.find((record) => record.readiness_id === 'united-arab-emirates--uae-national-racing-system--era-season-calendar');
if (!readinessRecord) fail('UAE Readiness record missing.');
else {
  if (!exact(readinessRecord.racecourse_ids, ['meydan-racecourse'])) fail('Readiness racecourse scope expanded before mapping approval.');
  if (readinessRecord.technical_rank !== 'C' || readinessRecord.public_ceiling !== 'C') fail('UAE Readiness rank boundary changed.');
  if (readinessRecord.implementation_status !== 'not_started' || readinessRecord.automation_mode !== 'manual_confirmation') fail('UAE Readiness implementation/automation state changed.');
}

for (const phrase of [
  'Status: completed coordinate-grid parser evidence review',
  'workflow run: 29142374154',
  '64 label-based meeting observations',
  'max day/venue y delta: 0.525',
  'weekday calendar validation: pass',
  '2027-04-15',
  'source boundary difference requires explicit reconciliation',
  'mapping approval remains false',
  'UAE-PILOT-05',
  'source-boundary reconciliation and venue mapping approval decision',
]) {
  if (!doc.toLowerCase().includes(phrase.toLowerCase())) fail(`PILOT-04 document missing ${phrase}.`);
}

const serialized = JSON.stringify(audit).toLowerCase();
for (const forbiddenKey of ['raw_html', 'raw_pdf', 'raw_text', 'source_body', 'horse_name', 'jockey_name', 'trainer_name', 'odds_value', 'result_payload', 'payout_amount', 'prediction', 'tip', 'stream_url']) {
  if (serialized.includes(`"${forbiddenKey}"`)) fail(`PILOT-04 audit contains forbidden key ${forbiddenKey}.`);
}

if (errors.length) {
  console.error(`CALENDAR_UAE_ERA_PILOT_04_GRID_PARSER_EVIDENCE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_UAE_ERA_PILOT_04_GRID_PARSER_EVIDENCE: pass');
console.log('WORKFLOW_RUN_ID: 29142374154');
console.log('COORDINATE_PARSER: evidence_backed_64_label_based_meeting_observations');
console.log('MONTH_COUNT_CLOSURE: pass');
console.log('VENUE_COUNT_CLOSURE: pass_matches_official_article_counts');
console.log('WEEKDAY_COORDINATE_VALIDATION: pass');
console.log('DATE_VENUE_PAIRING: evidence_backed');
console.log('SOURCE_BOUNDARY_STATUS: difference_requires_explicit_reconciliation');
console.log('MAPPING_APPROVAL: false');
console.log('BROADER_CANDIDATE_GENERATION: false');
console.log('REGISTRY_ACTIVATION: false');
console.log('NEXT_UNIT: UAE-PILOT-05');
