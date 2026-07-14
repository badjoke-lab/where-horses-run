import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const parse = (file) => JSON.parse(read(file));

const audit = parse('data/audits/racecourse-page-identity-reconciliation-v1.json');
const identityRecords = parse('data/static/racecourses-public-timetable-identities-v1.json');
const publicMeetings = parse('data/generated/timetable/public/meeting-list.json');
const canonicalFiles = [
  'data/static/racecourses.json',
  'data/static/racecourses-extensions.json',
  'data/static/racecourses-public-timetable-identities-v1.json',
  'data/static/country-page-racecourses-01-04.json',
  'data/static/country-page-racecourses-11-oman.json',
  'data/static/country-page-racecourses-12-zimbabwe.json',
];
const canonicalRecords = canonicalFiles.flatMap((file) => parse(file));
const canonicalById = new Map();
for (const record of canonicalRecords) {
  if (canonicalById.has(record.id)) fail(`duplicate canonical racecourse ID ${record.id}`);
  canonicalById.set(record.id, record);
}

if (audit.schema_version !== 'racecourse-page-identity-reconciliation-v1') fail('audit schema differs');
if (audit.work_id !== 'WHR-RACECOURSE-PAGES-V1') fail('audit Work ID differs');
if (audit.implementation_unit !== 'RACECOURSE-PAGE-IDENTITY-RECONCILIATION-01') fail('audit implementation unit differs');
if (!['implemented_for_review', 'complete'].includes(audit.status)) fail('audit status differs');
if (audit.baseline?.canonical_records !== 23 || audit.baseline?.unresolved_ids !== 13 || audit.baseline?.meetings_on_unresolved_ids !== 114) fail('baseline discovery counts differ');
if (audit.implemented?.canonical_records !== 36 || audit.implemented?.public_racecourse_ids !== 26 || audit.implemented?.canonical_exact_ids !== 26 || audit.implemented?.unresolved_ids !== 0) fail('implemented reconciliation counts differ');
if (audit.implemented?.new_identity_only_records !== 13 || audit.implemented?.new_english_routes !== 13 || audit.implemented?.new_japanese_routes !== 13) fail('new identity route counts differ');
if ((audit.resolved_identity_ids ?? []).length !== 13 || new Set(audit.resolved_identity_ids).size !== 13) fail('resolved identity ID set differs');
if (Object.values(audit.boundaries ?? {}).some((value) => value !== false)) fail('audit boundaries must remain false');
if (audit.next_implementation_unit !== 'RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01') fail('next implementation unit differs');

if (canonicalRecords.length !== 36 || canonicalById.size !== 36) fail(`canonical racecourse count must be 36; found ${canonicalRecords.length}/${canonicalById.size}`);
if (identityRecords.length !== 13) fail(`identity-only record count must be 13; found ${identityRecords.length}`);

const expectedIds = [...audit.resolved_identity_ids].sort();
const actualIds = identityRecords.map((record) => record.id).sort();
if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) fail('identity-only record IDs differ from reviewed resolution set');

for (const record of identityRecords) {
  if (record.slug !== record.id) fail(`${record.id}: slug must equal canonical ID`);
  if (record.country_id !== 'japan' || record.timezone !== 'Asia/Tokyo') fail(`${record.id}: country/timezone identity differs`);
  if (record.status !== 'active') fail(`${record.id}: active status must follow current reviewed public meetings`);
  if (record.identity_status !== 'verified_from_reviewed_public_timetable' || record.profile_status !== 'identity_only') fail(`${record.id}: identity-only status differs`);
  if (record.city !== null || record.region !== null) fail(`${record.id}: location must remain unknown`);
  if (record.direction !== 'unknown' || record.surfaces.length !== 0 || record.racing_types.length !== 0) fail(`${record.id}: course/type fields must remain unknown`);
  for (const value of Object.values(record.course_profile ?? {})) if (value !== null) fail(`${record.id}: course profile must remain null`);
  for (const group of ['turf', 'dirt', 'all_weather', 'jump', 'harness']) {
    const profile = record.distance_profile?.[group];
    if (!profile || profile.min_m !== null || profile.max_m !== null || profile.known_distances_m.length !== 0) fail(`${record.id}: ${group} distance profile must remain unknown`);
  }
  if (record.distance_profile?.upcoming_conditions?.length !== 0) fail(`${record.id}: upcoming conditions must remain empty`);
  if (record.schedule_summary?.status !== 'official-link-only' || record.schedule_summary?.next_meeting_date !== null || record.schedule_summary?.upcoming_meetings?.length !== 0) fail(`${record.id}: schedule summary boundary differs`);
  if (record.notable_races?.length !== 0) fail(`${record.id}: notable races must remain empty`);
  if (!Array.isArray(record.official_links) || record.official_links.length < 2) fail(`${record.id}: official source routes missing`);
  for (const link of record.official_links ?? []) {
    if (!['japan-nar-racecourse-guide', 'japan-nar-home', 'japan-jairs-racecourses', 'japan-jra-home'].includes(link.source_id)) fail(`${record.id}: unreviewed source ID ${link.source_id}`);
    if (!/^https:\/\//.test(link.url)) fail(`${record.id}: official link must use HTTPS`);
  }
}

const publicIds = [...new Set((publicMeetings.meetings ?? []).map((meeting) => meeting.racecourse_id))].sort();
if (publicMeetings.meetings?.length !== 169 || publicIds.length !== 26) fail('public timetable meeting/identity counts differ');
for (const racecourseId of publicIds) if (!canonicalById.has(racecourseId)) fail(`public timetable racecourse remains unresolved: ${racecourseId}`);

const prohibitedFragments = ['horse_name', 'jockey_name', 'trainer_name', 'odds', 'payout', 'prediction', 'raw_html', 'source_body', 'stream_url'];
const serialized = JSON.stringify(identityRecords).toLowerCase();
for (const fragment of prohibitedFragments) if (serialized.includes(`"${fragment}"`)) fail(`identity records contain prohibited key ${fragment}`);

const dataSource = read('src/lib/data.ts');
for (const marker of ['racecourses-public-timetable-identities-v1.json', '...publicTimetableRacecourseIdentitiesV1']) if (!dataSource.includes(marker)) fail(`data.ts missing identity import marker ${marker}`);

if (!fs.existsSync(path.join(root, 'dist'))) fail('dist is missing; run npm run build first');
for (const racecourseId of publicIds) {
  for (const route of [`tracks/${racecourseId}/index.html`, `ja/tracks/${racecourseId}/index.html`]) {
    if (!fs.existsSync(path.join(root, 'dist', route))) fail(`missing rendered racecourse route ${route}`);
  }
}

for (const record of identityRecords) {
  const en = read(`dist/tracks/${record.slug}/index.html`);
  const ja = read(`dist/ja/tracks/${record.slug}/index.html`);
  if (!en.includes(record.name_en) || !ja.includes(record.name_ja)) fail(`${record.id}: rendered bilingual names differ`);
  if (!en.includes('Not listed yet') || !ja.includes('未掲載')) fail(`${record.id}: unknown profile state is not explicit`);
  if (!en.includes('/calendar/') || !ja.includes('/ja/calendar/')) fail(`${record.id}: Calendar fallback link missing`);
}

if (errors.length) {
  console.error(`RACECOURSE_PAGE_IDENTITY_RECONCILIATION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('RACECOURSE_PAGE_IDENTITY_RECONCILIATION: pass');
console.log('PUBLIC_MEETINGS: 169');
console.log('PUBLIC_RACECOURSE_IDS: 26');
console.log('CANONICAL_EXACT_IDS: 26');
console.log('UNRESOLVED_IDS: 0');
console.log('IDENTITY_ONLY_RECORDS: 13');
console.log('BILINGUAL_ROUTES_ADDED: 26');
console.log('UNSUPPORTED_PROFILE_INFERENCE: false');
