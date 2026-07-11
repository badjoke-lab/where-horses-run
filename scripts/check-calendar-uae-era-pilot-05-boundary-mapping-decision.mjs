import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const audit = readJson('data/audits/calendar-uae-era-pilot-05-boundary-mapping-decision-v1.json');
const p2 = readJson('data/audits/calendar-uae-era-pilot-02-source-route-evidence-v1.json');
const mapping = readJson('data/audits/calendar-uae-era-pilot-03-venue-mapping-v1.json');
const p3 = readJson('data/audits/calendar-uae-era-pilot-03-pdf-evidence-v1.json');
const p4 = readJson('data/audits/calendar-uae-era-pilot-04-grid-parser-evidence-v1.json');
const readiness = readJson('data/static/calendar-readiness-registry.json');
const acquisition = readJson('data/static/calendar-acquisition-registry.json');
const racecourses = readJson('data/static/racecourses.json');
const doc = readText('docs/calendar/uae-era-pilot-05-boundary-mapping-decision.md');

if (audit.schema_version !== 'calendar-uae-era-pilot-05-boundary-mapping-decision-v1') fail('PILOT-05 audit schema differs.');
if (audit.work_id !== 'WHR-CAL-UAE-ERA' || audit.implementation_unit !== 'UAE-PILOT-05') fail('PILOT-05 Work identity differs.');
if (Number.isNaN(Date.parse(audit.reviewed_at))) fail('PILOT-05 reviewed_at invalid.');

const reconciliation = audit.source_boundary_reconciliation ?? {};
const article = reconciliation.article_summary ?? {};
const pdf = reconciliation.pdf_grid ?? {};
if (article.total_race_meetings !== 64 || article.total_racecourses !== 5) fail('article summary count structure differs.');
if (article.opening_date !== '2026-10-22' || article.narrative_closing_date !== '2027-03-27') fail('article summary date boundary differs.');
if (!exact(article.venue_meeting_counts, { Meydan:17, 'Abu Dhabi':16, 'Al Ain':14, 'Jebel Ali':11, Sharjah:6 })) fail('article summary venue counts differ.');
if (pdf.observation_count !== 64 || pdf.first_observation_date !== '2026-10-22' || pdf.last_observation_date !== '2027-04-15') fail('PDF grid count/date boundary differs.');
if (!exact(pdf.venue_meeting_counts, article.venue_meeting_counts)) fail('PDF/article venue counts differ in decision audit.');
if (!exact(pdf.observations_after_article_narrative_closing_date, [
  { date:'2027-04-01', venue_label:'Abu Dhabi Turf Club' },
  { date:'2027-04-02', venue_label:'Al Ain Racecourse' },
  { date:'2027-04-08', venue_label:'Abu Dhabi Turf Club' },
  { date:'2027-04-09', venue_label:'Al Ain Racecourse' },
  { date:'2027-04-15', venue_label:'Abu Dhabi Turf Club' },
])) fail('post-article-closing observations differ.');

const closure = reconciliation.closure ?? {};
for (const key of ['article_total_equals_pdf_observation_count','article_venue_counts_equal_pdf_venue_counts','opening_dates_match','april_observations_required_for_64_count_closure']) {
  if (closure[key] !== true) fail(`closure ${key} must be true.`);
}
if (closure.article_narrative_closing_date_equals_pdf_last_observation_date !== false) fail('article/PDF closing date equality must remain false.');

const boundaryDecision = reconciliation.decision ?? {};
if (boundaryDecision.article_narrative_closing_date_use !== 'not_authoritative_for_exhaustive_fixture_window_boundary') fail('article closing-date use decision differs.');
if (boundaryDecision.accepted_fixture_window_source !== 'official_fixture_pdf_coordinate_grid') fail('accepted fixture-window source differs.');
if (boundaryDecision.accepted_fixture_window_start !== '2026-10-22'
  || boundaryDecision.accepted_fixture_window_end_inclusive !== '2027-04-15'
  || boundaryDecision.accepted_fixture_window_end_exclusive !== '2027-04-16') fail('accepted fixture-window date boundary differs.');
if (boundaryDecision.coverage_state !== 'count_closed_reviewed_pdf_fixture_window') fail('coverage-state decision differs.');
if (boundaryDecision.full_season_semantic_claim !== false) fail('full-season semantic claim must remain false.');
if (!String(boundaryDecision.reason).includes('Five April PDF observations')) fail('boundary decision reason must preserve April closure evidence.');

const mappingApproval = audit.venue_mapping_approval ?? {};
if (!exact(mappingApproval.evidence_basis, [
  'official_article_label',
  'official_venue_page_route_and_label',
  'official_pdf_venue_alias_structure',
  'coordinate_grid_count_closure',
])) fail('mapping evidence basis differs.');
const expectedMappings = [
  ['Meydan Racecourse','meydan-racecourse','accepted_existing','retain_approved_existing'],
  ['Abu Dhabi Turf Club','abu-dhabi-turf-club','proposed_unapproved','approve_mapping'],
  ['Al Ain Racecourse','al-ain-racecourse','proposed_unapproved','approve_mapping'],
  ['Jebel Ali Racecourse','jebel-ali-racecourse','proposed_unapproved','approve_mapping'],
  ['Sharjah Racecourse','sharjah-racecourse','proposed_unapproved','approve_mapping'],
];
if (!Array.isArray(mappingApproval.mappings) || mappingApproval.mappings.length !== 5) fail('mapping approval must contain five mappings.');
for (const [label, id, previous, decision] of expectedMappings) {
  const item = mappingApproval.mappings?.find((entry) => entry.official_article_label === label);
  if (!item) fail(`mapping approval missing ${label}.`);
  else {
    if (item.canonical_id !== id || item.previous_status !== previous || item.decision !== decision) fail(`${label}: mapping approval state differs.`);
    if (item.approved_for_canonical_identity_registration !== true) fail(`${label}: canonical identity approval must be true.`);
  }
}
const mappingDecision = mappingApproval.decision ?? {};
if (mappingDecision.approved_mapping_count !== 5 || mappingDecision.newly_approved_mapping_count !== 4 || mappingDecision.mapping_decision_complete !== true) fail('mapping decision counts/state differ.');
for (const key of ['racecourse_registry_write_in_this_unit','readiness_registry_write_in_this_unit','acquisition_registry_write_in_this_unit','candidate_expansion_in_this_unit']) {
  if (mappingDecision[key] !== false) fail(`mapping decision ${key} must remain false.`);
}

const refs = [
  'data/audits/calendar-uae-era-pilot-02-source-route-evidence-v1.json',
  'data/audits/calendar-uae-era-pilot-03-venue-mapping-v1.json',
  'data/audits/calendar-uae-era-pilot-03-pdf-evidence-v1.json',
  'data/audits/calendar-uae-era-pilot-04-grid-parser-evidence-v1.json',
];
if (!exact(audit.evidence_refs, refs)) fail('PILOT-05 evidence refs differ.');
for (const ref of refs) if (!fs.existsSync(path.join(root, ref))) fail(`missing evidence ref ${ref}.`);

if (p2.evidence_run?.article_route?.total_race_meetings !== 64) fail('PILOT-02 article total differs.');
if (p2.evidence_run?.article_route?.closing_date !== '2027-03-27') fail('PILOT-02 article closing evidence differs.');
if (p3.decision?.pdf_route !== 'evidence_backed_in_memory_text_and_layout_structure_extraction') fail('PILOT-03 PDF route decision differs.');
if (mapping.decision?.accepted_existing_mapping_count !== 1 || mapping.decision?.proposed_unapproved_mapping_count !== 4) fail('PILOT-03 mapping handoff counts differ.');
if (p4.decision?.coordinate_parser !== 'evidence_backed_64_label_based_meeting_observations') fail('PILOT-04 coordinate parser decision differs.');
if (p4.decision?.source_boundary_status !== 'difference_requires_explicit_reconciliation') fail('PILOT-04 source-boundary handoff differs.');

const readinessRecord = readiness.records.find((record) => record.readiness_id === 'united-arab-emirates--uae-national-racing-system--era-season-calendar');
if (!readinessRecord) fail('UAE Readiness record missing.');
else if (!exact(readinessRecord.racecourse_ids, ['meydan-racecourse'])) fail('Readiness scope changed in decision-only unit.');
if (acquisition.records.some((record) => record.system_id === 'uae-national-racing-system')) fail('UAE Acquisition Registry profile must not be created in PILOT-05.');
const racecourseIds = new Set(racecourses.map((record) => record.id));
for (const id of ['abu-dhabi-turf-club','al-ain-racecourse','jebel-ali-racecourse','sharjah-racecourse']) {
  if (racecourseIds.has(id)) fail(`${id} was registered during decision-only PILOT-05.`);
}

if (audit.next_unit?.id !== 'UAE-PILOT-06') fail('next unit ID differs.');
if (audit.next_unit?.title !== 'UAE ERA canonical venue and acquisition profile activation foundation') fail('next unit title differs.');
for (const [key, value] of Object.entries(audit.boundaries ?? {})) if (value !== false) fail(`PILOT-05 boundary ${key} must remain false.`);

for (const phrase of [
  'Status: decision complete; implementation remains separate',
  'not_authoritative_for_exhaustive_fixture_window_boundary',
  'count_closed_reviewed_pdf_fixture_window',
  'All five mappings are approved for canonical identity registration.',
  'newly approved mappings: 4',
  'Approval is not implementation',
  'UAE-PILOT-06',
  'canonical venue and acquisition profile activation foundation',
]) {
  if (!doc.includes(phrase)) fail(`PILOT-05 document missing ${phrase}.`);
}

const serialized = JSON.stringify(audit).toLowerCase();
for (const forbiddenKey of ['raw_html','raw_pdf','raw_text','source_body','horse_name','jockey_name','trainer_name','odds_value','result_payload','payout_amount','prediction','tip','stream_url']) {
  if (serialized.includes(`"${forbiddenKey}"`)) fail(`PILOT-05 audit contains forbidden key ${forbiddenKey}.`);
}

if (errors.length) {
  console.error(`CALENDAR_UAE_ERA_PILOT_05_BOUNDARY_MAPPING_DECISION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_UAE_ERA_PILOT_05_BOUNDARY_MAPPING_DECISION: pass');
console.log('ARTICLE_CLOSING_DATE_USE: not_authoritative_for_exhaustive_fixture_window_boundary');
console.log('ACCEPTED_FIXTURE_WINDOW: 2026-10-22 through 2027-04-15 inclusive');
console.log('COVERAGE_STATE: count_closed_reviewed_pdf_fixture_window');
console.log('APPROVED_MAPPING_COUNT: 5');
console.log('NEWLY_APPROVED_MAPPING_COUNT: 4');
console.log('REGISTRY_WRITES: false');
console.log('CANDIDATE_EXPANSION: false');
console.log('NEXT_UNIT: UAE-PILOT-06');
