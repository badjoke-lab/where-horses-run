import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  PUBLIC_COVERAGE_STATUSES,
  PUBLIC_GAP_STATUSES,
  derivePublicCoverageState,
} from '../src/lib/timetable/publicCoverageState.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (relativePath) => {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) {
    fail(`missing required file: ${relativePath}`);
    return '';
  }
  return readFileSync(absolutePath, 'utf8');
};
const parse = (relativePath) => {
  try {
    return JSON.parse(read(relativePath));
  } catch (error) {
    fail(`${relativePath} must parse: ${error.message}`);
    return null;
  }
};
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const requireIncludes = (text, marker, label) => {
  if (!text.includes(marker)) fail(`${label} missing ${marker}`);
};

const audit = parse('data/audits/calendar-public-v1-pilot-record-reconciliation-v1.json');
const publicList = parse('data/generated/timetable/public/meeting-list.json');
const canonicalMeetings = parse('data/generated/timetable/canonical/meetings.json');
const readiness = parse('data/static/calendar-readiness-registry.json');
const acquisition = parse('data/static/calendar-acquisition-registry.json');
const hkjcHandoff = parse('data/audits/calendar-hkjc-handoff-decision-v1.json');
const uaeHandoff = parse('data/audits/calendar-uae-era-handoff-decision-v1.json');
const doc = read('docs/calendar/public-v1-pilot-record-reconciliation.md');
const meetingRowsSource = read('src/data/timetableMeetingRows.ts');
const meetingListSource = read('src/components/TimetableMeetingList.astro');
const coverageCoreSource = read('src/lib/timetable/publicCoverageState.mjs');
const roadmap = read('docs/calendar/implementation-roadmap.md');

if (audit) {
  if (audit.schema_version !== 'calendar-public-v1-pilot-record-reconciliation-v1') fail('unexpected audit schema.');
  if (audit.work_id !== 'WHR-CAL-PUBLIC-V1') fail('audit Work ID differs.');
  if (audit.implementation_unit !== 'PUBLIC-V1-PILOT-RECORD-RECONCILIATION-01') fail('implementation unit differs.');
  if (audit.status !== 'implemented_for_review') fail('audit status differs.');
  if (Number.isNaN(Date.parse(audit.reviewed_at))) fail('audit reviewed_at is invalid.');
  if (!exact(Object.values(audit.coverage_by_public_rank ?? {}), PUBLIC_COVERAGE_STATUSES)) {
    fail('coverage_by_public_rank differs from the public coverage contract.');
  }
  if (!exact(audit.public_gap_states, PUBLIC_GAP_STATUSES)) fail('public_gap_states differ from the public gap contract.');
  if (!Array.isArray(audit.pilot_systems) || audit.pilot_systems.length !== 5) fail('five pilot systems are required.');
  if (!Array.isArray(audit.forbidden_public_fields) || audit.forbidden_public_fields.length < 10) fail('forbidden public field set is incomplete.');
  for (const [key, value] of Object.entries(audit.boundaries ?? {})) {
    if (value !== false) fail(`boundaries.${key} must remain false.`);
  }
}

if (publicList?.schema_version !== 'public-timetable-meeting-list-v0') fail('public meeting list schema differs.');
if (!Array.isArray(publicList?.meetings) || publicList.meetings.length === 0) fail('public meeting list must contain rows.');
if (canonicalMeetings?.schema_version !== 'canonical-timetable-v0') fail('canonical meeting schema differs.');
if (readiness?.schema_version !== 'calendar-readiness-registry-v1') fail('Calendar Readiness schema differs.');
if (acquisition?.schema_version !== 'calendar-acquisition-registry-v1') fail('Acquisition Registry schema differs.');

const ranks = ['C', 'B', 'B+', 'A', 'A+'];
const rankIndex = (rank) => ranks.indexOf(rank);
const publicRowsByAuthority = new Map();
const stateCounts = new Map();

for (const row of publicList?.meetings ?? []) {
  const derived = derivePublicCoverageState(row);
  const rows = publicRowsByAuthority.get(row.authority_id) ?? [];
  rows.push({ ...row, ...derived });
  publicRowsByAuthority.set(row.authority_id, rows);
  stateCounts.set(derived.coverage_status, (stateCounts.get(derived.coverage_status) ?? 0) + 1);
  stateCounts.set(derived.public_gap_status, (stateCounts.get(derived.public_gap_status) ?? 0) + 1);

  if (!PUBLIC_COVERAGE_STATUSES.includes(derived.coverage_status)) fail(`${row.meeting_id} has invalid coverage status.`);
  if (!PUBLIC_GAP_STATUSES.includes(derived.public_gap_status)) fail(`${row.meeting_id} has invalid public gap status.`);
  if (!/^https:\/\//.test(row.official_source_url ?? '')) fail(`${row.meeting_id} official source must use HTTPS.`);
  if (!audit?.freshness_and_source_rules?.source_status_values?.includes(row.source_status)) fail(`${row.meeting_id} source status differs.`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.last_checked_date ?? '')) fail(`${row.meeting_id} last_checked_date must be YYYY-MM-DD.`);

  if (row.effective_public_rank === 'C') {
    if (row.first_race_time_local !== null || row.last_race_time_local !== null || row.detail_path !== null) {
      fail(`${row.meeting_id} C row exposes timetable detail.`);
    }
  } else if (row.effective_public_rank === 'B') {
    if (typeof row.first_race_time_local !== 'string' || row.last_race_time_local !== null || row.detail_path !== null) {
      fail(`${row.meeting_id} B row shape differs.`);
    }
  } else if (row.effective_public_rank === 'B+') {
    if (typeof row.first_race_time_local !== 'string' || typeof row.last_race_time_local !== 'string' || row.detail_path !== null) {
      fail(`${row.meeting_id} B+ row shape differs.`);
    }
  } else if (!['A', 'A+'].includes(row.effective_public_rank) || typeof row.detail_path !== 'string') {
    fail(`${row.meeting_id} A/A+ row must retain a meeting detail path.`);
  }

  if (derived.public_gap_status === 'more_detail_not_reviewed' && rankIndex(row.effective_public_rank) >= rankIndex(row.max_public_rank)) {
    fail(`${row.meeting_id} detail-gap state has no public rank gap.`);
  }
  if (derived.public_gap_status === 'publication_ceiling_applied') {
    if (rankIndex(row.capability_rank) <= rankIndex(row.effective_public_rank) || row.effective_public_rank !== row.max_public_rank) {
      fail(`${row.meeting_id} publication-ceiling state is inconsistent.`);
    }
  }
  if (derived.public_gap_status === 'at_current_public_ceiling' && row.effective_public_rank !== row.max_public_rank) {
    fail(`${row.meeting_id} current-ceiling state is inconsistent.`);
  }

  for (const forbidden of audit?.forbidden_public_fields ?? []) {
    if (Object.prototype.hasOwnProperty.call(row, forbidden)) fail(`${row.meeting_id} exposes forbidden public field ${forbidden}.`);
  }
}

const requiredAuthorities = ['jra', 'nar-local-government-racing', 'hkjc', 'emirates-racing-authority'];
for (const authorityId of requiredAuthorities) {
  if ((publicRowsByAuthority.get(authorityId) ?? []).length === 0) fail(`${authorityId} must retain public canonical rows.`);
}

const jraRows = publicRowsByAuthority.get('jra') ?? [];
if (!jraRows.some((row) => row.public_gap_status === 'more_detail_not_reviewed')) {
  fail('JRA must retain at least one honest meeting-level detail gap.');
}

const narRows = publicRowsByAuthority.get('nar-local-government-racing') ?? [];
if (!narRows.some((row) => row.effective_public_rank === 'C')) fail('NAR must retain C schedule rows.');
if (!narRows.some((row) => row.effective_public_rank === 'A+')) fail('NAR must retain A+ detail rows.');
if (narRows.filter((row) => row.effective_public_rank === 'C').some((row) => row.public_gap_status !== 'more_detail_not_reviewed')) {
  fail('NAR C rows must expose an honest additional-detail gap.');
}

const hkjcRows = publicRowsByAuthority.get('hkjc') ?? [];
if (!hkjcRows.some((row) => row.public_gap_status === 'publication_ceiling_applied')) {
  fail('HKJC must retain the reviewed A+ to A public-ceiling example.');
}
if (!hkjcRows.some((row) => row.public_gap_status === 'more_detail_not_reviewed')) {
  fail('HKJC must retain C rows below the reviewed A ceiling.');
}

const uaeRows = publicRowsByAuthority.get('emirates-racing-authority') ?? [];
if (uaeRows.some((row) => row.effective_public_rank !== 'C' || row.max_public_rank !== 'C')) {
  fail('existing UAE public rows must remain at the reviewed C ceiling.');
}
if (uaeRows.some((row) => row.public_gap_status !== 'at_current_public_ceiling')) {
  fail('existing UAE public rows must state the current reviewed C ceiling.');
}

const baneiRows = publicRowsByAuthority.get('banei-tokachi') ?? [];
const canonicalBanei = (canonicalMeetings?.meetings ?? []).filter((row) => row.authority_id === 'banei-tokachi');
if (canonicalBanei.length === 0) fail('Banei canonical evidence must remain present.');
if (baneiRows.length === 0) {
  const baneiProfile = acquisition?.records?.find((record) => record.system_id === 'japan-banei-system');
  if (baneiProfile?.profile_status !== 'active') fail('Banei reviewed exclusion requires the active accepted profile.');
}

const expectedSystems = new Map((audit?.pilot_systems ?? []).map((entry) => [entry.system_id, entry]));
for (const system of acquisition?.records ?? []) {
  const expected = expectedSystems.get(system.system_id);
  if (!expected) fail(`Acquisition Registry system is missing from the Public v1 pilot audit: ${system.system_id}`);
  else if (expected.authority_id !== system.authority_id) fail(`${system.system_id} authority differs from the pilot audit.`);
}
if ((acquisition?.records ?? []).length !== expectedSystems.size) fail('pilot audit and Acquisition Registry system counts differ.');

if (hkjcHandoff?.handoff_claims?.automatic_publication_claimed !== false || hkjcHandoff?.boundaries?.public_write !== false) {
  fail('HKJC handoff must retain no automatic publication/public write boundary.');
}
if (uaeHandoff?.handoff_claims?.automatic_publication_claimed !== false || uaeHandoff?.boundaries?.public_write !== false) {
  fail('UAE handoff must retain no automatic publication/public write boundary.');
}

for (const marker of [
  'derivePublicCoverageState',
  'coverage_status: PublicCoverageStatus',
  'public_gap_status: PublicGapStatus',
]) requireIncludes(meetingRowsSource, marker, 'timetableMeetingRows.ts');
for (const marker of [
  "coverage: 'Reviewed coverage'",
  "coverage: '確認済み範囲'",
  "detailState: 'Additional detail'",
  "detailState: '追加詳細'",
  'coverageLabel[record.coverage_status]',
  'gapLabel[record.public_gap_status]',
  'More detail not reviewed',
  'Public ceiling applied',
  '追加詳細は未確認',
  '公開上限を適用',
]) requireIncludes(meetingListSource, marker, 'TimetableMeetingList.astro');
for (const marker of [
  'PUBLIC_COVERAGE_STATUSES',
  'PUBLIC_GAP_STATUSES',
  'publication_ceiling_applied',
  'more_detail_not_reviewed',
]) requireIncludes(coverageCoreSource, marker, 'publicCoverageState.mjs');
for (const marker of [
  'PUBLIC-V1-PILOT-RECORD-RECONCILIATION-01',
  'Reviewed coverage',
  'Public ceiling applied',
  '64-record UAE handoff evidence remains review-only',
]) requireIncludes(doc, marker, 'public-v1-pilot-record-reconciliation.md');
for (const marker of [
  'Current Work ID: `WHR-CAL-PUBLIC-V1`',
  'Current implementation unit: `PUBLIC-V1-PILOT-RECORD-RECONCILIATION-01`',
]) requireIncludes(roadmap, marker, 'implementation-roadmap.md');

for (const validator of [
  'scripts/check-calendar-pipeline-v1-public-projection.mjs',
  'scripts/check-calendar-public-v1-surface-audit.mjs',
]) {
  const result = spawnSync(process.execPath, [validator], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  process.stdout.write(result.stdout ?? '');
  process.stderr.write(result.stderr ?? '');
  if (result.status !== 0) fail(`required validator failed: ${validator}`);
}

if (errors.length) {
  console.error(`CALENDAR_PUBLIC_V1_PILOT_RECORD_RECONCILIATION: failed (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('CALENDAR_PUBLIC_V1_PILOT_RECORD_RECONCILIATION: pass');
console.log(`PUBLIC_MEETINGS: ${publicList.meetings.length}`);
for (const [authorityId, rows] of [...publicRowsByAuthority.entries()].sort()) {
  console.log(`PUBLIC_AUTHORITY_ROWS: ${authorityId}=${rows.length}`);
}
for (const [state, count] of [...stateCounts.entries()].sort()) {
  console.log(`PUBLIC_STATE_COUNT: ${state}=${count}`);
}
console.log(`BANEI_PUBLIC_ROWS: ${baneiRows.length}`);
console.log('UNATTENDED_PUBLICATION: false');
