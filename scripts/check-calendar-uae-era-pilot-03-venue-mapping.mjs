import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const audit = readJson('data/audits/calendar-uae-era-pilot-03-venue-mapping-v1.json');
const readiness = readJson('data/static/calendar-readiness-registry.json');
const p2 = readJson('data/audits/calendar-uae-era-pilot-02-source-route-evidence-v1.json');
const probeSource = readText('scripts/timetable/probe_uae_era_pdf_text.py');
const doc = readText('docs/calendar/uae-era-pilot-03-venue-mapping-pdf-evidence.md');

if (audit.schema_version !== 'calendar-uae-era-pilot-03-venue-mapping-v1') fail('venue mapping audit schema differs.');
if (audit.work_id !== 'WHR-CAL-UAE-ERA' || audit.implementation_unit !== 'UAE-PILOT-03') fail('venue mapping audit Work identity differs.');
if (Number.isNaN(Date.parse(audit.reviewed_at))) fail('venue mapping reviewed_at invalid.');
if (audit.source_authority !== 'emirates-racing-authority') fail('venue mapping authority differs.');

const policy = audit.mapping_policy ?? {};
for (const key of ['existing_trusted_mapping_may_be_reused', 'official_page_slug_may_seed_proposed_id', 'proposed_id_is_not_approved_mapping']) {
  if (policy[key] !== true) fail(`mapping policy ${key} must be true.`);
}
for (const key of ['automatic_canonical_creation', 'automatic_candidate_expansion']) {
  if (policy[key] !== false) fail(`mapping policy ${key} must be false.`);
}

const expectedVenues = [
  ['Meydan Racecourse', 'Meydan', 'meydan', 'meydan-racecourse', 'meydan-racecourse', 'accepted_existing', true],
  ['Abu Dhabi Turf Club', 'Abu Dhabi Turf Club', 'abu-dhabi-turf-club', null, 'abu-dhabi-turf-club', 'proposed_unapproved', false],
  ['Al Ain Racecourse', 'Al Ain', 'al-ain', null, 'al-ain-racecourse', 'proposed_unapproved', false],
  ['Jebel Ali Racecourse', 'Jebel Ali', 'jebel-ali', null, 'jebel-ali-racecourse', 'proposed_unapproved', false],
  ['Sharjah Racecourse', 'Sharjah', 'sharjah', null, 'sharjah-racecourse', 'proposed_unapproved', false],
];
if (!Array.isArray(audit.venues) || audit.venues.length !== expectedVenues.length) fail('venue mapping audit must contain exactly five official venues.');
const proposedIds = new Set();
for (const expected of expectedVenues) {
  const [articleLabel, pageLabel, slug, existingId, proposedId, status, candidateAllowed] = expected;
  const venue = audit.venues?.find((item) => item.official_article_label === articleLabel);
  if (!venue) {
    fail(`venue mapping missing ${articleLabel}.`);
    continue;
  }
  if (venue.official_page_label !== pageLabel) fail(`${articleLabel}: official page label differs.`);
  if (venue.official_page_slug !== slug) fail(`${articleLabel}: official page slug differs.`);
  if (venue.official_page_url !== `https://emiratesracing.com/racecourses/${slug}`) fail(`${articleLabel}: official page URL differs.`);
  if (venue.existing_trusted_canonical_id !== existingId) fail(`${articleLabel}: existing canonical ID differs.`);
  if (venue.proposed_canonical_id !== proposedId) fail(`${articleLabel}: proposed canonical ID differs.`);
  if (venue.mapping_status !== status) fail(`${articleLabel}: mapping status differs.`);
  if (venue.candidate_generation_allowed !== candidateAllowed) fail(`${articleLabel}: candidate-generation boundary differs.`);
  if (venue.activation_effect !== 'none') fail(`${articleLabel}: activation effect must remain none.`);
  if (proposedIds.has(venue.proposed_canonical_id)) fail(`duplicate proposed canonical ID ${venue.proposed_canonical_id}.`);
  proposedIds.add(venue.proposed_canonical_id);
}

const accepted = audit.venues?.filter((venue) => venue.mapping_status === 'accepted_existing') ?? [];
const proposed = audit.venues?.filter((venue) => venue.mapping_status === 'proposed_unapproved') ?? [];
if (accepted.length !== 1 || accepted[0]?.proposed_canonical_id !== 'meydan-racecourse') fail('accepted mapping scope must remain Meydan only.');
if (proposed.length !== 4 || proposed.some((venue) => venue.candidate_generation_allowed !== false)) fail('four proposed mappings must remain candidate-generation blocked.');

const decision = audit.decision ?? {};
if (decision.accepted_existing_mapping_count !== 1 || decision.proposed_unapproved_mapping_count !== 4) fail('mapping decision counts differ.');
if (decision.candidate_scope !== 'meydan_only') fail('mapping decision candidate scope differs.');
if (decision.broader_candidate_generation !== 'blocked_pending_explicit_mapping_approval') fail('broader candidate-generation decision differs.');
for (const key of ['racecourse_registry_write', 'readiness_registry_write', 'acquisition_registry_write']) {
  if (decision[key] !== false) fail(`decision ${key} must remain false.`);
}
for (const [key, value] of Object.entries(audit.boundaries ?? {})) if (value !== false) fail(`venue mapping boundary ${key} must remain false.`);

const baselineReadiness = readiness.records.find((record) => record.readiness_id === 'united-arab-emirates--uae-national-racing-system--era-season-calendar');
if (!baselineReadiness) fail('UAE Readiness record missing.');
else {
  if (!exact(baselineReadiness.racecourse_ids, ['meydan-racecourse'])) fail('Readiness racecourse scope expanded before explicit mapping approval.');
  if (baselineReadiness.technical_rank !== 'C' || baselineReadiness.public_ceiling !== 'C') fail('UAE Readiness rank boundary changed.');
  if (baselineReadiness.implementation_status !== 'not_started' || baselineReadiness.automation_mode !== 'manual_confirmation') fail('UAE Readiness implementation/automation state changed in mapping audit unit.');
}

if (p2.decision?.article_html_route !== 'evidence_backed_c_level_partial_schedule_route') fail('PILOT-02 article route evidence state differs.');
if (p2.decision?.pdf_route !== 'reachable_secondary_source_route_parsing_not_yet_proven') fail('PILOT-02 PDF route handoff state differs.');
if (p2.decision?.trusted_candidate_scope !== 'meydan_only') fail('PILOT-02 trusted candidate scope differs.');

for (const marker of [
  'PdfReader(BytesIO(payload))',
  'raw_pdf_stored',
  'raw_text_stored',
  'extracted_text_emitted',
  'normalized_text_sha256',
  'venue_label_occurrences',
  'date_candidates',
]) {
  if (!probeSource.includes(marker)) fail(`PDF probe missing ${marker}.`);
}
for (const forbiddenWrite of ['write_bytes(', 'write_text(', 'NamedTemporaryFile', 'mkstemp', 'open("/tmp/', "open('/tmp/"]) {
  if (probeSource.includes(forbiddenWrite)) fail(`PDF probe contains forbidden file-write primitive ${forbiddenWrite}.`);
}

for (const phrase of [
  'UAE-PILOT-03',
  'accepted_existing',
  'proposed_unapproved',
  'meydan_only',
  'in-memory PDF text extraction',
  'raw PDF is not stored',
  'raw extracted text is not stored',
  'broader candidate generation remains blocked',
]) {
  if (!doc.includes(phrase)) fail(`PILOT-03 document missing ${phrase}.`);
}

if (errors.length) {
  console.error(`CALENDAR_UAE_ERA_PILOT_03_VENUE_MAPPING: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_UAE_ERA_PILOT_03_VENUE_MAPPING: pass');
console.log('WORK_ID: WHR-CAL-UAE-ERA');
console.log('IMPLEMENTATION_UNIT: UAE-PILOT-03');
console.log('ACCEPTED_EXISTING_MAPPING_COUNT: 1');
console.log('PROPOSED_UNAPPROVED_MAPPING_COUNT: 4');
console.log('CANDIDATE_SCOPE: meydan_only');
console.log('BROADER_CANDIDATE_GENERATION: blocked_pending_explicit_mapping_approval');
console.log('PDF_PROBE_RAW_STORAGE: false');
console.log('REGISTRY_WRITES: false');
