import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const json = (file) => JSON.parse(read(file));

const architecture = json('data/static/nar-source-route-architecture-v1.json');
const seed = json('data/static/nar-venue-code-research-seed-v1.json');
const migration = json('data/audits/nar-legacy-pr281-migration.json');
const pilotControl = json('data/static/local-racing-pilot-control-v2.json');
const runtimeControl = json('data/static/japan-a-plus-runtime-control.json');
const doc = read('docs/calendar/nar-a-plus-source-architecture.md');
const startHere = read('START-HERE.md');
const scheduledWorkflow = read('.github/workflows/timetable-scheduled-refresh.yml');

if (architecture.schema_version !== 'nar-source-route-architecture-v1') fail('unexpected architecture schema.');
if (architecture.work_id !== 'WHR-CAL-JAPAN-NAR-A-PLUS') fail('architecture Work ID is incorrect.');
if (architecture.status !== 'architecture_review') fail('architecture status must remain architecture_review.');
if (architecture.system_id !== 'japan-nar-system') fail('architecture system ID is incorrect.');
if (architecture.authority_id !== 'nar-local-government-racing') fail('architecture authority ID is incorrect.');
if (architecture.technical_rank !== 'A+' || architecture.public_ceiling !== 'A+') fail('NAR architecture must retain A+/A+.');
if (architecture.public_projection_activation !== 'pending_pilot') fail('NAR public projection must remain pending_pilot.');

const expectedHosts = ['www.keiba.go.jp', 'www2.keiba.go.jp', 'keiba.go.jp'];
for (const host of expectedHosts) {
  if (!architecture.official_hosts?.includes(host)) fail(`missing official host ${host}.`);
}
if (!architecture.routes?.course_guide?.startsWith('https://www.keiba.go.jp/guide/')) fail('course guide route is invalid.');
if (architecture.routes?.race_list_template !== 'https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList') fail('RaceList template is invalid.');
if (architecture.routes?.race_detail_template !== 'https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/DebaTable') fail('DebaTable template is invalid.');
for (const parameter of ['k_babaCode', 'k_raceDate']) {
  if (!architecture.routes?.race_list_parameters?.includes(parameter)) fail(`RaceList missing ${parameter}.`);
  if (!architecture.routes?.race_detail_parameters?.includes(parameter)) fail(`DebaTable missing ${parameter}.`);
}
if (!architecture.routes?.race_detail_parameters?.includes('k_raceNo')) fail('DebaTable missing k_raceNo.');

if (seed.schema_version !== 'nar-venue-code-research-seed-v1') fail('unexpected venue seed schema.');
if (seed.work_id !== 'WHR-CAL-JAPAN-NAR-A-PLUS') fail('venue seed Work ID is incorrect.');
if (!seed.use_rule?.includes('revalidated before fixture or candidate activation')) fail('venue seed lacks mandatory revalidation rule.');
if (!Array.isArray(seed.records) || seed.records.length !== 14) fail('venue seed must contain fourteen records.');

const codes = new Set();
const racecourses = new Set();
for (const record of seed.records ?? []) {
  if (!/^\d{2}$/.test(record.venue_code ?? '')) fail(`invalid venue code ${record.venue_code}.`);
  if (codes.has(record.venue_code)) fail(`duplicate venue code ${record.venue_code}.`);
  if (racecourses.has(record.racecourse_id)) fail(`duplicate racecourse ${record.racecourse_id}.`);
  codes.add(record.venue_code);
  racecourses.add(record.racecourse_id);
  if (!['revalidate', 'official_detail_example_confirmed'].includes(record.state)) fail(`${record.venue_code} has invalid state.`);
}
for (const pilotCode of ['18', '19']) {
  if (!architecture.pilot_venue_codes?.includes(pilotCode)) fail(`pilot code ${pilotCode} is missing.`);
  const record = seed.records.find((item) => item.venue_code === pilotCode);
  if (!record || record.state !== 'official_detail_example_confirmed') fail(`pilot code ${pilotCode} lacks official-example confirmation.`);
}
if (architecture.pilot_venue_codes?.length !== 2) fail('first pilot must remain bounded to two venue codes.');

const contract = architecture.candidate_contract ?? {};
if (contract.output_boundary !== 'candidate_only') fail('NAR architecture must be candidate-only.');
if (contract.review_status !== 'needs_review') fail('NAR candidates must require review.');
if (contract.canonical_write !== 'human_approval_only') fail('canonical write must require human approval.');
if (contract.public_write !== 'human_approval_only') fail('public write must require human approval.');
if (contract.schedule_mode !== 'disabled') fail('NAR scheduling must remain disabled.');
if (contract.raw_source_storage !== 'disabled') fail('raw source storage must remain disabled.');
const expectedFields = ['label', 'post_time_local', 'race_name', 'distance_m', 'surface', 'course_label'];
if (JSON.stringify(contract.allowed_public_fields) !== JSON.stringify(expectedFields)) fail('allowed public fields differ from the A+ boundary.');
if (!Array.isArray(architecture.activation_requirements) || architecture.activation_requirements.length < 7) fail('activation requirements are incomplete.');

if (migration.schema_version !== 'nar-legacy-pr281-migration-v1') fail('unexpected PR 281 migration schema.');
if (migration.work_id !== 'WHR-CAL-JAPAN-NAR-A-PLUS') fail('PR 281 migration Work ID is incorrect.');
if (migration.legacy_pr !== 281 || migration.decision !== 'do_not_merge') fail('PR 281 must remain do_not_merge.');
if (migration.publication_effect !== 'none') fail('architecture work must have no publication effect.');
for (const replacement of ['direct canonical writes', 'direct public projection writes', 'all-venue all-date unbounded acquisition', 'post-hoc mutation of canonical and public race names']) {
  if (!migration.replace?.includes(replacement)) fail(`migration decision missing replacement: ${replacement}.`);
}
for (const target of ['public-safe fixture', 'candidate-only adapter', 'human promotion', 'deterministic public projection']) {
  if (!migration.target_pipeline?.includes(target)) fail(`migration target missing ${target}.`);
}

if (pilotControl.work_id !== 'WHR-CAL-JAPAN-NAR-A-PLUS') fail('NAR pilot control Work ID is incorrect.');
if (pilotControl.expected_technical_rank !== 'A+' || pilotControl.expected_public_ceiling !== 'A+') fail('NAR pilot control must expect A+/A+.');
if (pilotControl.candidate_mode !== 'review_only') fail('NAR pilot candidates must remain review-only.');
if (pilotControl.canonical_write_mode !== 'human_approval_only' || pilotControl.public_write_mode !== 'human_approval_only') fail('NAR pilot writes must require human approval.');
if (pilotControl.schedule_mode !== 'disabled') fail('NAR pilot schedule must remain disabled.');

const runtime = runtimeControl.records?.find((record) => record.system_id === 'japan-nar-system');
if (!runtime || runtime.public_projection_activation !== 'pending_pilot') fail('NAR runtime activation must remain pending_pilot.');

for (const phrase of [
  'This contract defines source architecture only.',
  'Do not merge PR #281 directly.',
  'The first implementation PR must be candidate-only.',
  'Urawa',
  'Funabashi',
  'raw HTML',
  'human promotion',
]) {
  if (!doc.includes(phrase)) fail(`architecture document missing: ${phrase}`);
}
for (const phrase of [
  'docs/calendar/nar-a-plus-source-architecture.md',
  'data/static/nar-source-route-architecture-v1.json',
  'data/static/nar-venue-code-research-seed-v1.json',
  'data/audits/nar-legacy-pr281-migration.json',
  'scripts/check-calendar-nar-source-architecture.mjs',
  'WHR-CAL-JAPAN-NAR-A-PLUS',
  'WHR-CAL-JAPAN-BANEI-A-PLUS',
]) {
  if (!startHere.includes(phrase)) fail(`START-HERE missing ${phrase}.`);
}

for (const forbiddenFile of [
  'scripts/timetable/refresh-nar.mjs',
  'scripts/timetable/repair-nar-race-names.mjs',
  'data/generated/timetable/nar-racecard-source-snapshot.json',
]) {
  if (fs.existsSync(path.join(root, forbiddenFile))) fail(`legacy direct-write artifact must not exist: ${forbiddenFile}.`);
}
if (/^\s*schedule:/m.test(scheduledWorkflow) || scheduledWorkflow.includes('cron:')) fail('scheduled refresh must remain disabled.');

if (errors.length) {
  console.error(`CALENDAR_NAR_SOURCE_ARCHITECTURE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_NAR_SOURCE_ARCHITECTURE: pass');
console.log(`VENUE_RESEARCH_SEEDS: ${seed.records.length}`);
console.log('FIRST_PILOT_CODES: 18,19');
console.log('PUBLIC_PROJECTION_ACTIVATION: pending_pilot');
console.log('NEXT_IMPLEMENTATION: bounded_fixture_probe');
