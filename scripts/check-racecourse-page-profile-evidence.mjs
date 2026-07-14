import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const parse = (file) => JSON.parse(read(file));

const audit = parse('data/audits/racecourse-page-profile-evidence-v1.json');
const evidence = parse('data/static/racecourse-profile-evidence-japan-v1.json');
const identityRecords = parse('data/static/racecourses-public-timetable-identities-v1.json');
const dataSource = read('src/lib/data.ts');

if (audit.schema_version !== 'racecourse-page-profile-evidence-v1') fail('audit schema differs');
if (audit.work_id !== 'WHR-RACECOURSE-PAGES-V1') fail('audit Work ID differs');
if (audit.implementation_unit !== 'RACECOURSE-PAGE-PROFILE-EVIDENCE-01') fail('audit implementation unit differs');
if (!['implemented_for_review', 'complete'].includes(audit.status)) fail('audit status differs');
if (audit.discovery_artifact_digest !== 'sha256:8371940095e273c2e50087776a50582c753ded2a397cb691a8cbe18f7fa729f1') fail('discovery artifact digest differs');
if (audit.baseline?.racecourses !== 36 || audit.baseline?.identity_only_records !== 13 || audit.baseline?.no_profile_records !== 13 || audit.baseline?.complete_core_profiles !== 8) fail('baseline counts differ');
const baselineFields = audit.baseline?.field_counts ?? {};
if (baselineFields.city !== 23 || baselineFields.region !== 23 || baselineFields.racing_types !== 22 || baselineFields.surfaces !== 14 || baselineFields.direction !== 10 || baselineFields.course_profile !== 23 || baselineFields.distance_profile !== 8 || baselineFields.seasonality !== 23 || baselineFields.schedule_source !== 1) fail('baseline field counts differ');
if (audit.implemented?.reviewed_japan_records !== 13 || audit.implemented?.identity_only_records !== 0 || audit.implemented?.no_profile_records !== 0 || audit.implemented?.complete_core_profiles !== 8) fail('implemented counts differ');
const implementedFields = audit.implemented?.field_counts ?? {};
if (implementedFields.city !== 36 || implementedFields.region !== 36 || implementedFields.racing_types !== 35 || implementedFields.surfaces !== 27 || implementedFields.direction !== 23 || implementedFields.course_profile !== 36 || implementedFields.distance_profile !== 8 || implementedFields.seasonality !== 36 || implementedFields.public_calendar_connection !== 36) fail('implemented field counts differ');
if (Object.values(audit.boundaries ?? {}).some((value) => value !== false)) fail('audit boundaries must remain false');
if (audit.next_implementation_unit !== 'RACECOURSE-PAGE-LINK-ARCHITECTURE-01') fail('next implementation unit differs');

if (evidence.schema_version !== 'racecourse-profile-evidence-japan-v1') fail('evidence schema differs');
if (evidence.reviewed_at !== '2026-07-14') fail('evidence review date differs');
if (evidence.work_id !== audit.work_id || evidence.implementation_unit !== audit.implementation_unit) fail('evidence work markers differ');
if (!Array.isArray(evidence.records) || evidence.records.length !== 13) fail('evidence record count must be 13');
const expectedIds = [...audit.reviewed_record_ids].sort();
const actualIds = evidence.records.map((record) => record.id).sort();
if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) fail('evidence record IDs differ from audit');
if (new Set(actualIds).size !== 13) fail('evidence record IDs must be unique');
if (identityRecords.length !== 13) fail('identity-only base record count differs');

const narExpected = new Map([
  ['monbetsu-racecourse', ['Hidaka', 'Hokkaido', 'right-handed', 1600, null, 330, true, '02']],
  ['morioka-racecourse', ['Morioka', 'Iwate', 'left-handed', 1600, 1400, 300, false, '03']],
  ['urawa-racecourse', ['Saitama', 'Saitama', 'left-handed', 1200, null, 220, false, '05']],
  ['funabashi-racecourse', ['Funabashi', 'Chiba', 'left-handed', 1400, null, 308, true, '06']],
  ['oi-racecourse', ['Shinagawa', 'Tokyo', 'both-directions', 1600, null, 386, true, '07']],
  ['kawasaki-racecourse', ['Kawasaki', 'Kanagawa', 'left-handed', 1200, null, 300, false, '08']],
  ['kanazawa-racecourse', ['Kanazawa', 'Ishikawa', 'right-handed', 1200, null, 236, false, '09']],
  ['kasamatsu-racecourse', ['Kasamatsu', 'Gifu', 'right-handed', 1100, null, 201, false, '10']],
  ['nagoya-racecourse', ['Yatomi', 'Aichi', 'right-handed', 1180, null, 240, false, '11']],
  ['sonoda-racecourse', ['Amagasaki', 'Hyogo', 'right-handed', 1051, null, 213, false, '12']],
  ['kochi-racecourse', ['Kochi', 'Kochi', 'right-handed', 1100, null, 200, false, '14']],
  ['saga-racecourse', ['Tosu', 'Saga', 'right-handed', 1100, null, 200, false, '15']],
]);

for (const record of evidence.records) {
  if (record.profile_status !== 'official_profile_partial') fail(`${record.id}: profile status differs`);
  if (record.data_status?.course_profile !== 'verified' || record.data_status?.schedule !== 'public-calendar-connected' || record.data_status?.source_status !== 'verified' || record.data_status?.last_checked !== '2026-07-14') fail(`${record.id}: data status differs`);
  if (!record.city || !record.region || !record.direction || !Array.isArray(record.racing_types) || record.racing_types.length === 0 || !Array.isArray(record.surfaces) || record.surfaces.length === 0) fail(`${record.id}: reviewed core identity fields missing`);
  if (!record.course_profile || record.course_profile.dirt_circumference_m === null) fail(`${record.id}: reviewed course metrics missing`);
  if (record.course_profile.has_lighting !== null || record.course_profile.elevation_notes_en !== null || record.course_profile.elevation_notes_ja !== null) fail(`${record.id}: unsupported lighting/elevation fields must remain null`);
  if ('distance_profile' in record) fail(`${record.id}: race-distance profile must remain absent without an official race-distance menu`);
  if (!Array.isArray(record.official_links) || record.official_links.length !== 4) fail(`${record.id}: official source set is incomplete`);
  if (record.official_links.some((link) => !/^https:\/\//.test(link.url) || link.link_type !== 'official')) fail(`${record.id}: official links differ`);
  if (record.seasonality?.status !== 'partial') fail(`${record.id}: seasonality must remain partial`);

  if (record.id === 'kokura-racecourse') {
    if (record.city !== 'Kitakyushu' || record.region !== 'Fukuoka' || record.direction !== 'right-handed') fail('Kokura location/direction differs');
    if (JSON.stringify(record.racing_types) !== JSON.stringify(['thoroughbred-flat', 'jump-racing'])) fail('Kokura racing types differ');
    if (JSON.stringify(record.surfaces) !== JSON.stringify(['turf', 'dirt', 'jump-course'])) fail('Kokura surfaces differ');
    if (record.course_profile.turf_circumference_m !== 1615 || record.course_profile.dirt_circumference_m !== 1445 || record.course_profile.home_straight_m !== null || record.course_profile.has_inner_outer_courses !== true) fail('Kokura representative course metrics differ');
    if (!record.course_profile.course_notes_en.includes('1,633m') || !record.course_profile.course_notes_en.includes('1,652m') || !record.course_profile.course_notes_en.includes('1,724m') || !record.course_profile.course_notes_en.includes('415m')) fail('Kokura additional course evidence missing');
    if (!record.official_links.some((link) => link.url.endsWith('/j08.html')) || !record.official_links.some((link) => link.url.endsWith('/course_details/kokura.html'))) fail('Kokura official evidence routes missing');
  } else {
    const expected = narExpected.get(record.id);
    if (!expected) fail(`${record.id}: unexpected NAR evidence record`);
    else {
      const [city, region, direction, dirt, turf, straight, innerOuter, guideNo] = expected;
      if (record.city !== city || record.region !== region || record.direction !== direction) fail(`${record.id}: location/direction differs`);
      if (JSON.stringify(record.racing_types) !== JSON.stringify(['thoroughbred-flat'])) fail(`${record.id}: racing type differs`);
      const expectedSurfaces = turf === null ? ['dirt'] : ['dirt', 'turf'];
      if (JSON.stringify(record.surfaces) !== JSON.stringify(expectedSurfaces)) fail(`${record.id}: surface set differs`);
      if (record.course_profile.dirt_circumference_m !== dirt || record.course_profile.turf_circumference_m !== turf || record.course_profile.home_straight_m !== straight || record.course_profile.has_inner_outer_courses !== innerOuter) fail(`${record.id}: course metrics differ`);
      if (!record.official_links.some((link) => link.url === `https://www.keiba.go.jp/guide/${guideNo}/`) || !record.official_links.some((link) => link.url === 'https://www.keiba.go.jp/guide/course/')) fail(`${record.id}: NAR evidence routes missing`);
    }
  }
}

for (const marker of ['racecourse-profile-evidence-japan-v1.json', 'racecourseProfileEvidenceById', 'applyRacecourseProfileEvidence']) if (!dataSource.includes(marker)) fail(`data.ts missing ${marker}`);
const prohibited = ['horse_name', 'jockey_name', 'trainer_name', 'odds', 'payout', 'prediction', 'raw_html', 'source_body', 'stream_url'];
const serialized = JSON.stringify(evidence).toLowerCase();
for (const fragment of prohibited) if (serialized.includes(`"${fragment}"`)) fail(`evidence contains prohibited key ${fragment}`);

if (!fs.existsSync(path.join(root, 'dist'))) fail('dist is missing; run npm run build first');
for (const record of evidence.records) {
  const enPath = path.join(root, 'dist', 'tracks', record.id, 'index.html');
  const jaPath = path.join(root, 'dist', 'ja', 'tracks', record.id, 'index.html');
  if (!fs.existsSync(enPath) || !fs.existsSync(jaPath)) fail(`${record.id}: rendered bilingual page missing`);
  else {
    const en = fs.readFileSync(enPath, 'utf8');
    const ja = fs.readFileSync(jaPath, 'utf8');
    if (!en.includes(record.city) || !en.includes(record.region) || !ja.includes(record.city) || !ja.includes(record.region)) fail(`${record.id}: rendered location evidence missing`);
    if (!en.includes(String(record.course_profile.dirt_circumference_m)) || !ja.includes(String(record.course_profile.dirt_circumference_m))) fail(`${record.id}: rendered dirt course metric missing`);
    if (record.course_profile.home_straight_m !== null && (!en.includes(String(record.course_profile.home_straight_m)) || !ja.includes(String(record.course_profile.home_straight_m)))) fail(`${record.id}: rendered straight metric missing`);
    if (!en.includes('Not listed yet') || !ja.includes('未掲載')) fail(`${record.id}: retained unknown state is not explicit`);
  }
}

if (errors.length) {
  console.error(`RACECOURSE_PAGE_PROFILE_EVIDENCE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('RACECOURSE_PAGE_PROFILE_EVIDENCE: pass');
console.log('REVIEWED_JAPAN_RECORDS: 13');
console.log('IDENTITY_ONLY_RECORDS: 0');
console.log('NO_PROFILE_RECORDS: 0');
console.log('COMPLETE_CORE_PROFILES: 8');
console.log('RACE_DISTANCE_PROFILES_RETAINED_UNKNOWN: 13');
console.log('UNSUPPORTED_PROFILE_INFERENCE: false');
