import fs from 'node:fs';
import path from 'node:path';
import { buildJapanCurrentWindowAuditV1, validateJapanCurrentWindowAuditV1 } from './timetable/japan-current-window-audit-core.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const policy = readJson('data/static/calendar-japan-current-window-policy-v1.json');
const canonical = readJson('data/generated/timetable/canonical/meetings.json');
const registry = readJson('data/static/calendar-acquisition-registry.json');
const compatibility = readJson('data/static/calendar-runner-compatibility-contract-v1.json');
const generatedAt = '2026-07-13T08:00:00Z';
let audit = null;
try {
  audit = buildJapanCurrentWindowAuditV1({
    policy,
    canonical,
    acquisitionRegistry: registry,
    runnerCompatibility: compatibility,
    generatedAt,
  });
} catch (error) {
  fail(`audit build failed: ${error.message}`);
}
if (audit) {
  const validationErrors = validateJapanCurrentWindowAuditV1(audit);
  if (validationErrors.length) fail(`audit validation failed: ${validationErrors.join('; ')}`);
  if (audit.window.start_date !== '2026-07-13' || audit.window.end_date_exclusive !== '2026-08-12' || audit.window.timezone !== 'Asia/Tokyo') fail('audit window differs');
  if (audit.systems.length !== 3) fail('audit must contain exactly three Japan systems');
  const bySystem = new Map(audit.systems.map((record) => [record.system_id, record]));
  const jra = bySystem.get('japan-jra-system');
  const nar = bySystem.get('japan-nar-system');
  const banei = bySystem.get('japan-banei-system');
  if (!jra || !nar || !banei) fail('one or more Japan systems are missing');
  if (jra) {
    if (jra.primary_runner !== 'local' || jra.fallback_runner !== 'reviewed_import') fail('JRA runner state differs');
    if (jra.executor_id !== 'jra-refresh-local' || !exact(jra.supported_collection_modes, ['date_window'])) fail('JRA executor state differs');
    if (jra.supports_selected_meetings !== false || jra.supports_rank_upgrade_retry !== false) fail('JRA shared retry capability was overstated');
    if (jra.retry_required_count > 0 && jra.operational_state !== 'manual_refresh_required') fail('JRA low-rank action differs');
  }
  if (nar) {
    if (nar.primary_runner !== 'github_actions' || nar.fallback_runner !== 'local') fail('NAR runner state differs');
    if (nar.executor_id !== 'nar-incremental-v2-actions' || !exact(nar.supported_collection_modes, ['date_window', 'selected_meetings'])) fail('NAR executor state differs');
    if (nar.supports_selected_meetings !== true || nar.supports_rank_upgrade_retry !== true) fail('NAR retry capability differs');
    if (nar.retry_required_count > 0 && nar.operational_state !== 'selected_meeting_retry_required') fail('NAR retry state differs');
  }
  if (banei) {
    if (banei.primary_runner !== 'github_actions' || banei.fallback_runner !== 'reviewed_import') fail('Banei runner state differs');
    if (banei.executor_id !== 'banei-schedule-detail-actions' || !exact(banei.supported_collection_modes, ['date_window', 'selected_meetings'])) fail('Banei executor state differs');
    if (banei.supports_selected_meetings !== true || banei.supports_rank_upgrade_retry !== true) fail('Banei retry capability differs');
    if (banei.retry_required_count > 0 && banei.operational_state !== 'selected_meeting_retry_required') fail('Banei retry state differs');
  }
  const currentWindowCanonical = canonical.meetings.filter((meeting) => meeting.country_id === 'japan' && meeting.date >= policy.window.start_date && meeting.date < policy.window.end_date_exclusive);
  if (audit.summary.canonical_meeting_count !== currentWindowCanonical.length) fail('audit Canonical meeting count differs from direct window filter');
  if (audit.summary.target_ready_count + audit.summary.retry_required_count !== audit.summary.canonical_meeting_count) fail('audit summary target/retry counts do not close');
  if (!exact(audit.summary.systems_without_canonical_meetings, audit.systems.filter((system) => system.canonical_meeting_count === 0).map((system) => system.system_id))) fail('empty-system summary differs');
  if (Object.values(audit.side_effect_boundary).some((value) => value !== false)) fail('audit side-effect boundary differs');
}

for (const file of policy.systems.map((record) => record.entry_point)) {
  if (!fs.existsSync(path.join(root, file))) fail(`operator entry point missing: ${file}`);
}
for (const file of [
  'scripts/timetable/japan-current-window-audit-core.mjs',
  'scripts/timetable/build-japan-current-window-audit.mjs',
  'docs/calendar/japan-current-window-operations.md',
  '.github/workflows/calendar-japan-current-window-operations.yml',
]) {
  if (!fs.existsSync(path.join(root, file))) fail(`Japan current-window component missing: ${file}`);
}
const builder = readText('scripts/timetable/build-japan-current-window-audit.mjs');
for (const phrase of ['output must remain outside the repository', 'network_fetch: false', 'canonical_write: false', 'public_write: false']) {
  if (!builder.includes(phrase)) fail(`Japan current-window builder missing ${phrase}`);
}
const workflow = readText('.github/workflows/calendar-japan-current-window-operations.yml');
for (const phrase of ['contents: read', 'build-japan-current-window-audit.mjs', 'actions/upload-artifact@v4', 'Prove protected state unchanged']) {
  if (!workflow.includes(phrase)) fail(`Japan current-window workflow missing ${phrase}`);
}
if (/\bschedule\s*:|\bcron\s*:|contents:\s*write/.test(workflow)) fail('Japan current-window workflow enables scheduled or write operation');

const invalidPolicy = structuredClone(policy);
invalidPolicy.systems[1].supports_rank_upgrade_retry = false;
let invalidRejected = false;
try {
  buildJapanCurrentWindowAuditV1({ policy: invalidPolicy, canonical, acquisitionRegistry: registry, runnerCompatibility: compatibility, generatedAt });
} catch (error) {
  invalidRejected = error.message.includes('retry support differs');
}
if (!invalidRejected) fail('NAR retry-capability drift was not rejected');

if (errors.length) {
  console.error(`CALENDAR_JAPAN_CURRENT_WINDOW_OPERATIONS: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_JAPAN_CURRENT_WINDOW_OPERATIONS: pass');
console.log(`WINDOW: ${audit.window.start_date}..${audit.window.end_date_exclusive}`);
console.log(`CANONICAL_MEETINGS: ${audit.summary.canonical_meeting_count}`);
console.log(`TARGET_READY_A_PLUS: ${audit.summary.target_ready_count}`);
console.log(`ACTION_REQUIRED: ${audit.summary.retry_required_count}`);
for (const system of audit.systems) {
  console.log(`${system.system_id}: meetings=${system.canonical_meeting_count} ranks=${JSON.stringify(system.rank_counts)} state=${system.operational_state}`);
}
console.log('NETWORK_FETCH: false');
console.log('CANONICAL_PUBLIC_WRITE: false');
