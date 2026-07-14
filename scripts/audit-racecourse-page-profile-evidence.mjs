import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const outputArg = process.argv.find((arg) => arg.startsWith('--output='));
const outputPath = outputArg ? outputArg.slice('--output='.length) : null;
const files = [
  'data/static/racecourses.json',
  'data/static/racecourses-extensions.json',
  'data/static/racecourses-public-timetable-identities-v1.json',
  'data/static/country-page-racecourses-01-04.json',
  'data/static/country-page-racecourses-11-oman.json',
  'data/static/country-page-racecourses-12-zimbabwe.json',
];
const records = files.flatMap((file) => readJson(file).map((record) => ({ ...record, record_file: file })));
const present = (value) => value !== null && value !== undefined && value !== '';
const nonEmptyArray = (value) => Array.isArray(value) && value.length > 0;
const anyCourseProfile = (record) => Object.values(record.course_profile ?? {}).some(present);
const anyDistanceProfile = (record) => ['turf', 'dirt', 'all_weather', 'jump', 'harness'].some((key) => {
  const item = record.distance_profile?.[key];
  return present(item?.min_m) || present(item?.max_m) || nonEmptyArray(item?.known_distances_m);
});
const row = (record) => ({
  racecourse_id: record.id,
  slug: record.slug,
  country_id: record.country_id,
  name_en: record.name_en,
  record_file: record.record_file,
  identity_status: record.identity_status ?? null,
  profile_status: record.profile_status ?? null,
  official_link_count: record.official_links?.length ?? 0,
  official_source_ids: [...new Set((record.official_links ?? []).map((link) => link.source_id))].sort(),
  last_checked: record.data_status?.last_checked ?? null,
  fields: {
    city: present(record.city),
    region: present(record.region),
    racing_types: nonEmptyArray(record.racing_types),
    surfaces: nonEmptyArray(record.surfaces),
    direction: present(record.direction) && record.direction !== 'unknown',
    course_profile: anyCourseProfile(record),
    distance_profile: anyDistanceProfile(record),
    seasonality: present(record.seasonality?.summary_en) && record.seasonality?.status !== 'unverified',
    schedule_source: (record.official_links ?? []).some((link) => /schedule|calendar|racecard|programme/i.test(`${link.label_en} ${link.link_type}`)),
  },
});
const rows = records.map(row).sort((a, b) => a.racecourse_id.localeCompare(b.racecourse_id));
const fieldNames = Object.keys(rows[0]?.fields ?? {});
const fieldCounts = Object.fromEntries(fieldNames.map((field) => [field, rows.filter((item) => item.fields[field]).length]));
const identityOnly = rows.filter((item) => item.profile_status === 'identity_only');
const noProfile = rows.filter((item) => !item.fields.city && !item.fields.region && !item.fields.racing_types && !item.fields.surfaces && !item.fields.direction && !item.fields.course_profile && !item.fields.distance_profile);
const completeCore = rows.filter((item) => ['city', 'region', 'racing_types', 'surfaces', 'direction', 'course_profile', 'distance_profile'].every((field) => item.fields[field]));
const priorities = rows
  .map((item) => ({
    ...item,
    missing_core_fields: ['city', 'region', 'racing_types', 'surfaces', 'direction', 'course_profile', 'distance_profile'].filter((field) => !item.fields[field]),
  }))
  .sort((a, b) => b.missing_core_fields.length - a.missing_core_fields.length || a.racecourse_id.localeCompare(b.racecourse_id));
const audit = {
  schema_version: 'racecourse-page-profile-evidence-discovery-v1',
  work_id: 'WHR-RACECOURSE-PAGES-V1',
  implementation_unit: 'RACECOURSE-PAGE-PROFILE-EVIDENCE-01',
  record_files: files,
  counts: {
    racecourses: rows.length,
    identity_only_records: identityOnly.length,
    no_profile_records: noProfile.length,
    complete_core_profiles: completeCore.length,
    records_with_official_links: rows.filter((item) => item.official_link_count > 0).length,
    records_with_last_checked: rows.filter((item) => present(item.last_checked)).length,
  },
  field_counts: fieldCounts,
  identity_only_ids: identityOnly.map((item) => item.racecourse_id),
  no_profile_ids: noProfile.map((item) => item.racecourse_id),
  complete_core_profile_ids: completeCore.map((item) => item.racecourse_id),
  priorities,
  boundaries: {
    repository_write: false,
    network_fetch: false,
    profile_inference: false,
    automatic_source_acceptance: false,
    publication: false,
    deployment: false,
  },
};
if (outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(audit, null, 2)}\n`);
}
console.log(JSON.stringify(audit, null, 2));
