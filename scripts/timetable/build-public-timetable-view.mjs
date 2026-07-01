import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildPublicProjectionV1 } from './pipeline-v1/public-projection-core.mjs';
import { resolveCalendarReadinessRegistryForProjection } from './pipeline-v1/registry-overrides.mjs';

const root = process.cwd();
const paths = {
  canonicalMeetings: 'data/generated/timetable/canonical/meetings.json',
  canonicalDetails: 'data/generated/timetable/canonical/meeting-details.json',
  policy: 'src/data/publicationDisplayPolicies.json',
  readiness: 'data/static/calendar-readiness-registry.json',
  japanReadiness: 'data/static/calendar-readiness-japan-v2.json',
  japanRuntime: 'data/static/japan-a-plus-runtime-control.json',
  aliases: 'data/static/timetable-source-aliases-v1.json',
  publicMeetings: 'data/generated/timetable/public/meeting-list.json',
  publicDetails: 'data/generated/timetable/public/meeting-details.json'
};

const flags = new Set(process.argv.slice(2));
for (const flag of flags) {
  if (!['--check', '--dry-run'].includes(flag)) throw new Error(`unsupported argument ${flag}`);
}
if (flags.has('--check') && flags.has('--dry-run')) throw new Error('--check and --dry-run are mutually exclusive');

function readJson(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) throw new Error(`missing required file: ${relativePath}`);
  return JSON.parse(readFileSync(absolutePath, 'utf8'));
}

function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function atomicWrite(relativePath, content) {
  const absolutePath = path.join(root, relativePath);
  const temporaryPath = `${absolutePath}.projection-v1.tmp`;
  writeFileSync(temporaryPath, content);
  renameSync(temporaryPath, absolutePath);
}

try {
  const result = buildPublicProjectionV1({
    canonicalMeetings: readJson(paths.canonicalMeetings),
    canonicalDetails: readJson(paths.canonicalDetails),
    policyData: readJson(paths.policy),
    readinessRegistry: resolveCalendarReadinessRegistryForProjection(
      readJson(paths.readiness),
      readJson(paths.japanReadiness),
      readJson(paths.japanRuntime)
    ),
    sourceAliases: readJson(paths.aliases)
  });

  result.meetingListDataset.readiness_override_source = paths.japanReadiness;
  result.meetingDetailsDataset.readiness_override_source = paths.japanReadiness;
  result.meetingListDataset.readiness_control_source = paths.japanRuntime;
  result.meetingDetailsDataset.readiness_control_source = paths.japanRuntime;

  const meetingListContent = serialize(result.meetingListDataset);
  const meetingDetailsContent = serialize(result.meetingDetailsDataset);

  if (flags.has('--dry-run')) {
    console.log(JSON.stringify(result.audit, null, 2));
    console.log('PUBLIC_PROJECTION_WRITE_MODE: dry-run');
    process.exit(0);
  }

  if (flags.has('--check')) {
    if (readFileSync(path.join(root, paths.publicMeetings), 'utf8') !== meetingListContent) {
      throw new Error(`public projection is stale: ${paths.publicMeetings}`);
    }
    if (readFileSync(path.join(root, paths.publicDetails), 'utf8') !== meetingDetailsContent) {
      throw new Error(`public projection is stale: ${paths.publicDetails}`);
    }
    console.log(JSON.stringify(result.audit, null, 2));
    console.log('PUBLIC_PROJECTION_WRITE_MODE: check');
    process.exit(0);
  }

  atomicWrite(paths.publicMeetings, meetingListContent);
  atomicWrite(paths.publicDetails, meetingDetailsContent);
  console.log(JSON.stringify(result.audit, null, 2));
  console.log('PUBLIC_PROJECTION_WRITE_MODE: deterministic-public-only');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
