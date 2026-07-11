import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const audit = readJson('data/audits/calendar-uae-era-pilot-03-pdf-evidence-v1.json');
const mapping = readJson('data/audits/calendar-uae-era-pilot-03-venue-mapping-v1.json');
const p2 = readJson('data/audits/calendar-uae-era-pilot-02-source-route-evidence-v1.json');
const readiness = readJson('data/static/calendar-readiness-registry.json');
const doc = readText('docs/calendar/uae-era-pilot-03-venue-mapping-pdf-evidence.md');

if (audit.schema_version !== 'calendar-uae-era-pilot-03-pdf-evidence-v1') fail('PILOT-03 PDF evidence schema differs.');
if (audit.work_id !== 'WHR-CAL-UAE-ERA' || audit.implementation_unit !== 'UAE-PILOT-03') fail('PILOT-03 evidence Work identity differs.');
if (Number.isNaN(Date.parse(audit.reviewed_at))) fail('PILOT-03 reviewed_at invalid.');

const evidence = audit.evidence_run ?? {};
if (evidence.workflow_run_id !== 29141771555) fail('PILOT-03 workflow run ID differs.');
if (evidence.artifact_id !== 8245387666) fail('PILOT-03 artifact ID differs.');
if (evidence.artifact_digest !== 'sha256:cf32b5bf6015dd6d30543239a13a402b43db37f3c18f8e2157180525fae00ed3') fail('PILOT-03 artifact digest differs.');

const venuePages = evidence.venue_pages ?? {};
if (Number.isNaN(Date.parse(venuePages.checked_at))) fail('venue-page checked_at invalid.');
if (venuePages.page_count !== 5 || venuePages.all_pages_reachable !== true || venuePages.all_final_hosts_official !== true || venuePages.all_page_labels_observed !== true) fail('venue-page evidence closure differs.');
const expectedPages = [
  ['meydan', 200, 100135],
  ['abu-dhabi-turf-club', 200, 116713],
  ['al-ain', 200, 111565],
  ['jebel-ali', 200, 96207],
  ['sharjah', 200, 98849],
];
if (!Array.isArray(venuePages.pages) || venuePages.pages.length !== expectedPages.length) fail('venue-page evidence page count differs.');
for (const [slug, status, bytes] of expectedPages) {
  const page = venuePages.pages?.find((item) => item.slug === slug);
  if (!page) fail(`venue-page evidence missing ${slug}.`);
  else if (page.http_status !== status || page.response_bytes !== bytes) fail(`${slug}: venue-page evidence differs.`);
}
if (venuePages.raw_html_stored !== false) fail('venue-page raw HTML boundary differs.');

const pdf = evidence.pdf_structure ?? {};
if (pdf.http_status !== 200 || pdf.final_host !== 'd2xuc5ucjmnf40.cloudfront.net' || pdf.content_type !== 'application/pdf') fail('PDF route response evidence differs.');
if (pdf.response_bytes !== 161107 || pdf.pdf_magic !== true || pdf.page_count !== 1) fail('PDF binary/page evidence differs.');
if (pdf.plain_text_chars !== 2118 || pdf.layout_extraction_available !== true || pdf.layout_text_chars !== 5427) fail('PDF text extraction evidence differs.');
if (pdf.plain_non_empty_line_count !== 33 || pdf.layout_non_empty_line_count !== 33) fail('PDF non-empty line counts differ.');
if (pdf.plain_text_sha256 !== 'f83e9bd8ad66605589eddb15e737503ac1e27863c73f472ec311a3a6b6ff898b') fail('plain text hash differs.');
if (pdf.layout_text_sha256 !== 'dd44cea69767bf9816e73bd832f1bb31896e034b0b1db2669edb081113a6d6a1') fail('layout text hash differs.');
if (pdf.full_venue_labels_observed !== false || pdf.all_five_venue_aliases_observed !== true) fail('PDF venue-label/alias evidence differs.');
if (!exact(pdf.venue_alias_occurrences_combined_plain_and_layout, {
  'Meydan Racecourse': 38,
  'Abu Dhabi Turf Club': 34,
  'Al Ain Racecourse': 30,
  'Jebel Ali Racecourse': 24,
  'Sharjah Racecourse': 14,
})) fail('PDF venue alias occurrence evidence differs.');
if (!exact(pdf.month_tokens_observed, {
  October: 2,
  November: 2,
  December: 2,
  January: 2,
  February: 2,
  March: 2,
})) fail('PDF month-token evidence differs.');
if (pdf.weekday_tokens_observed !== true || pdf.numeric_day_tokens_1_through_31_observed !== true) fail('PDF calendar-grid token evidence differs.');
if (pdf.date_candidate_count !== 0 || pdf.season_opening_date_observed_as_normalized_candidate !== false || pdf.season_closing_date_observed_as_normalized_candidate !== false) fail('PDF normalized date-candidate evidence differs.');
if (pdf.raw_pdf_stored !== false || pdf.raw_text_stored !== false || pdf.extracted_text_emitted !== false) fail('PDF raw-source boundary differs.');
if (evidence.protected_state_hash_check !== 'pass' || evidence.repository_clean_after_run !== true) fail('PILOT-03 protected-state/cleanup evidence differs.');

const decision = audit.decision ?? {};
if (decision.official_venue_page_routes !== 'evidence_backed') fail('venue-page route decision differs.');
if (decision.pdf_route !== 'evidence_backed_in_memory_text_and_layout_structure_extraction') fail('PDF route decision differs.');
if (decision.pdf_venue_alias_structure !== 'evidence_backed_all_five_aliases_observed') fail('PDF venue structure decision differs.');
if (decision.pdf_date_venue_pairing !== 'not_evidence_backed_coordinate_aware_grid_parser_required') fail('PDF date-to-venue pairing decision differs.');
if (decision.mapping_state !== 'one_accepted_existing_four_proposed_unapproved') fail('mapping state decision differs.');
if (decision.candidate_scope !== 'meydan_only') fail('candidate scope differs.');
if (decision.broader_candidate_generation !== 'blocked_pending_explicit_mapping_approval_and_date_venue_pairing_evidence') fail('broader candidate-generation decision differs.');
if (decision.registry_activation !== false) fail('Registry activation must remain false.');
if (!String(decision.reason).includes('coordinate-aware calendar-grid parsing')) fail('decision reason must explain coordinate-aware parser requirement.');

if (audit.next_unit?.id !== 'UAE-PILOT-04') fail('next unit ID differs.');
if (audit.next_unit?.title !== 'UAE ERA coordinate-aware PDF calendar grid parser evidence') fail('next unit title differs.');
for (const [key, value] of Object.entries(audit.boundaries ?? {})) if (value !== false) fail(`PILOT-03 boundary ${key} must remain false.`);

if (mapping.decision?.accepted_existing_mapping_count !== 1 || mapping.decision?.proposed_unapproved_mapping_count !== 4) fail('venue mapping audit counts differ.');
if (mapping.decision?.candidate_scope !== 'meydan_only') fail('venue mapping audit candidate scope differs.');
if (p2.decision?.article_html_route !== 'evidence_backed_c_level_partial_schedule_route') fail('PILOT-02 article route handoff differs.');
if (p2.decision?.pdf_route !== 'reachable_secondary_source_route_parsing_not_yet_proven') fail('PILOT-02 PDF route handoff differs.');

const readinessRecord = readiness.records.find((record) => record.readiness_id === 'united-arab-emirates--uae-national-racing-system--era-season-calendar');
if (!readinessRecord) fail('UAE Readiness record missing.');
else {
  if (!exact(readinessRecord.racecourse_ids, ['meydan-racecourse'])) fail('Readiness racecourse scope expanded before mapping approval.');
  if (readinessRecord.technical_rank !== 'C' || readinessRecord.public_ceiling !== 'C') fail('UAE Readiness rank boundary changed.');
  if (readinessRecord.implementation_status !== 'not_started' || readinessRecord.automation_mode !== 'manual_confirmation') fail('UAE Readiness implementation/automation state changed.');
}

for (const phrase of [
  'Status: completed bounded live evidence review',
  'workflow run: 29141771555',
  'all five venue aliases were observed',
  'normalized date candidates: 0',
  'coordinate-aware parser is required',
  'one accepted existing mapping',
  'four proposed unapproved mappings',
  'candidate scope remains `meydan_only`',
  'UAE-PILOT-04',
  'coordinate-aware PDF calendar grid parser evidence',
]) {
  if (!doc.toLowerCase().includes(phrase.toLowerCase())) fail(`PILOT-03 document missing ${phrase}.`);
}

const serialized = JSON.stringify(audit).toLowerCase();
for (const forbiddenKey of ['raw_html', 'raw_pdf', 'raw_text', 'source_body', 'horse_name', 'jockey_name', 'trainer_name', 'odds_value', 'result_payload', 'payout_amount', 'prediction', 'tip', 'stream_url']) {
  if (serialized.includes(`"${forbiddenKey}"`)) fail(`PILOT-03 audit contains forbidden key ${forbiddenKey}.`);
}

if (errors.length) {
  console.error(`CALENDAR_UAE_ERA_PILOT_03_PDF_EVIDENCE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_UAE_ERA_PILOT_03_PDF_EVIDENCE: pass');
console.log('WORKFLOW_RUN_ID: 29141771555');
console.log('VENUE_PAGE_ROUTES: evidence_backed');
console.log('PDF_STRUCTURE_EXTRACTION: evidence_backed');
console.log('ALL_FIVE_VENUE_ALIASES: observed');
console.log('DATE_VENUE_PAIRING: not_evidence_backed');
console.log('MAPPING_STATE: one_accepted_existing_four_proposed_unapproved');
console.log('CANDIDATE_SCOPE: meydan_only');
console.log('REGISTRY_ACTIVATION: false');
console.log('NEXT_UNIT: UAE-PILOT-04');
