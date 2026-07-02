import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildPublicProjectionV1 } from './pipeline-v1/public-projection-core.mjs';
import { resolveCalendarReadinessRegistryForProjection } from './pipeline-v1/registry-overrides.mjs';

const root = process.cwd();
const outputPath = 'data/generated/timetable/public/japan-a-plus-overrides.json';
const flags = new Set(process.argv.slice(2));
for (const flag of flags) {
  if (!['--check', '--dry-run'].includes(flag)) throw new Error(`unsupported argument ${flag}`);
}
if (flags.has('--check') && flags.has('--dry-run')) throw new Error('--check and --dry-run are mutually exclusive');

const readJson = (file) => JSON.parse(readFileSync(path.join(root, file), 'utf8'));

const result = buildPublicProjectionV1({
  canonicalMeetings: readJson('data/generated/timetable/canonical/meetings.json'),
  canonicalDetails: readJson('data/generated/timetable/canonical/meeting-details.json'),
  policyData: readJson('src/data/publicationDisplayPolicies.json'),
  readinessRegistry: resolveCalendarReadinessRegistryForProjection(
    readJson('data/static/calendar-readiness-registry.json'),
    readJson('data/static/calendar-readiness-japan-v2.json'),
    readJson('data/static/japan-a-plus-runtime-control.json')
  ),
  sourceAliases: readJson('data/static/timetable-source-aliases-v1.json')
});

const meetingOverrides = result.meetingListDataset.meetings
  .filter((meeting) => meeting.country_id === 'japan' && meeting.authority_id === 'jra')
  .map((meeting) => ({
    meeting_id: meeting.meeting_id,
    max_public_rank: meeting.max_public_rank,
    effective_public_rank: meeting.effective_public_rank
  }));

const detailOverrides = result.meetingDetailsDataset.details
  .filter((detail) => detail.country_id === 'japan' && detail.authority_id === 'jra')
  .map((detail) => ({
    meeting_id: detail.meeting_id,
    max_public_rank: detail.max_public_rank,
    effective_public_rank: detail.effective_public_rank,
    show_race_name: detail.show_race_name,
    show_distance: detail.show_distance,
    show_surface: detail.show_surface,
    show_course: detail.show_course,
    timetable_rows: detail.timetable_rows
  }));

const output = {
  schema_version: 'japan-a-plus-public-overrides-v1',
  generated_at: result.meetingListDataset.generated_at,
  meeting_overrides: meetingOverrides,
  detail_overrides: detailOverrides
};
const serialized = `${JSON.stringify(output)}\n`;
const absoluteOutput = path.join(root, outputPath);

if (flags.has('--dry-run')) {
  console.log(JSON.stringify({
    meeting_overrides: meetingOverrides.length,
    detail_overrides: detailOverrides.length,
    timetable_rows: detailOverrides.reduce((sum, detail) => sum + detail.timetable_rows.length, 0)
  }, null, 2));
  process.exit(0);
}
if (flags.has('--check')) {
  if (!existsSync(absoluteOutput) || readFileSync(absoluteOutput, 'utf8') !== serialized) {
    throw new Error(`Japan A+ public override is stale: ${outputPath}`);
  }
  console.log('JAPAN_A_PLUS_PUBLIC_OVERRIDES: current');
  process.exit(0);
}
const temporary = `${absoluteOutput}.tmp`;
writeFileSync(temporary, serialized);
renameSync(temporary, absoluteOutput);
console.log(`JAPAN_A_PLUS_PUBLIC_OVERRIDES: wrote meetings=${meetingOverrides.length} details=${detailOverrides.length}`);
