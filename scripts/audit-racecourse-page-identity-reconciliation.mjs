import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const canonicalFiles = [
  'data/static/racecourses.json',
  'data/static/racecourses-extensions.json',
  'data/static/country-page-racecourses-01-04.json',
  'data/static/country-page-racecourses-11-oman.json',
  'data/static/country-page-racecourses-12-zimbabwe.json',
];
const outputArg = process.argv.find((arg) => arg.startsWith('--output='));
const outputPath = outputArg ? outputArg.slice('--output='.length) : null;

const canonicalRecords = canonicalFiles.flatMap((file) => readJson(file).map((record) => ({ ...record, record_file: file })));
const publicMeetings = readJson('data/generated/timetable/public/meeting-list.json');

const canonicalById = new Map();
const duplicateCanonicalIds = [];
for (const record of canonicalRecords) {
  if (canonicalById.has(record.id)) duplicateCanonicalIds.push(record.id);
  canonicalById.set(record.id, record);
}

const meetingsByRacecourseId = new Map();
for (const meeting of publicMeetings.meetings ?? []) {
  const rows = meetingsByRacecourseId.get(meeting.racecourse_id) ?? [];
  rows.push(meeting);
  meetingsByRacecourseId.set(meeting.racecourse_id, rows);
}

const identities = [...meetingsByRacecourseId.entries()]
  .map(([racecourseId, meetings]) => {
    const canonical = canonicalById.get(racecourseId) ?? null;
    return {
      racecourse_id: racecourseId,
      resolution_status: canonical ? 'canonical_exact' : 'unresolved',
      canonical_slug: canonical?.slug ?? null,
      canonical_record_file: canonical?.record_file ?? null,
      canonical_country_id: canonical?.country_id ?? null,
      public_meeting_count: meetings.length,
      public_country_ids: [...new Set(meetings.map((meeting) => meeting.country_id))].sort(),
      public_authority_ids: [...new Set(meetings.map((meeting) => meeting.authority_id))].sort(),
      public_dates: [...new Set(meetings.map((meeting) => meeting.date))].sort(),
      public_ranks: [...new Set(meetings.map((meeting) => meeting.effective_public_rank))].sort(),
      has_public_detail: meetings.some((meeting) => meeting.detail_path !== null),
      sample_meeting_ids: meetings.slice(0, 5).map((meeting) => meeting.meeting_id),
      sample_official_source_urls: [...new Set(meetings.map((meeting) => meeting.official_source_url))].slice(0, 3),
    };
  })
  .sort((left, right) => left.racecourse_id.localeCompare(right.racecourse_id));

const resolved = identities.filter((identity) => identity.resolution_status === 'canonical_exact');
const unresolved = identities.filter((identity) => identity.resolution_status === 'unresolved');
const orphanCanonical = canonicalRecords
  .filter((record) => !meetingsByRacecourseId.has(record.id))
  .map((record) => ({
    racecourse_id: record.id,
    slug: record.slug,
    country_id: record.country_id,
    record_file: record.record_file,
  }))
  .sort((left, right) => left.racecourse_id.localeCompare(right.racecourse_id));

const audit = {
  schema_version: 'racecourse-page-identity-reconciliation-discovery-v1',
  work_id: 'WHR-RACECOURSE-PAGES-V1',
  implementation_unit: 'RACECOURSE-PAGE-IDENTITY-RECONCILIATION-01',
  source_public_meeting_list: 'data/generated/timetable/public/meeting-list.json',
  source_public_generated_at: publicMeetings.generated_at,
  canonical_record_files: canonicalFiles,
  counts: {
    canonical_records: canonicalRecords.length,
    unique_canonical_ids: canonicalById.size,
    duplicate_canonical_ids: duplicateCanonicalIds.length,
    public_meetings: publicMeetings.meetings?.length ?? 0,
    public_racecourse_ids: identities.length,
    canonical_exact_ids: resolved.length,
    unresolved_ids: unresolved.length,
    meetings_on_resolved_ids: resolved.reduce((sum, identity) => sum + identity.public_meeting_count, 0),
    meetings_on_unresolved_ids: unresolved.reduce((sum, identity) => sum + identity.public_meeting_count, 0),
    orphan_canonical_ids: orphanCanonical.length,
  },
  duplicate_canonical_ids: [...new Set(duplicateCanonicalIds)].sort(),
  public_identities: identities,
  unresolved_identities: unresolved,
  orphan_canonical_identities: orphanCanonical,
  boundaries: {
    repository_write: false,
    canonical_data_write: false,
    public_dataset_write: false,
    automatic_identity_merge: false,
    automatic_page_creation: false,
    publication: false,
    deployment: false,
  },
};

if (outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(audit, null, 2)}\n`);
}

console.log(JSON.stringify(audit, null, 2));
