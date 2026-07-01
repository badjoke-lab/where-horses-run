import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const argv = process.argv.slice(2);
const valueOf = (name) => {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : null;
};
const check = argv.includes('--check');
const dryRun = argv.includes('--dry-run');
if (check && dryRun) throw new Error('--check and --dry-run are mutually exclusive.');

const statusPath = valueOf('--status') ?? 'data/generated/timetable/operations-status.json';
const outputPath = valueOf('--output') ?? 'data/generated/timetable/operations-review-package.json';
const controlPath = 'data/static/calendar-operations-control.json';
const readText = (file) => readFileSync(path.isAbsolute(file) ? file : path.join(root, file), 'utf8');
const readJson = (file) => JSON.parse(readText(file));
const sha256 = (file) => createHash('sha256').update(readText(file)).digest('hex');
const status = readJson(statusPath);
const control = readJson(controlPath);

if (status.schema_version !== 'calendar-operations-status-v1') throw new Error('Unexpected operations status schema.');
if (control.schema_version !== 'calendar-operations-control-v1') throw new Error('Unexpected operations control schema.');
if (control.mode !== 'paused_review_only') throw new Error('Operations control must remain paused_review_only.');

const priorities = {
  refresh_before_promotion: 1,
  source_unavailable_review: 2,
  blocked_review: 3,
  source_revalidation_due: 4,
  manual_revalidation_due: 5,
  link_revalidation_due: 6,
  human_review_required: 7
};
const actions = status.operator_actions.map((action) => ({
  ...action,
  priority: priorities[action.type] ?? 99,
  required_decision: action.type === 'refresh_before_promotion'
    ? 'obtain a fresh reviewed source capture before approval'
    : action.type === 'blocked_review'
      ? 'retain block unless new evidence resolves the recorded reason'
      : action.type === 'source_unavailable_review'
        ? 'confirm official route and apply fallback'
        : 'review source evidence and prepare a bounded candidate or registry update'
})).sort((a, b) => a.priority - b.priority || `${a.country_id}:${a.key}`.localeCompare(`${b.country_id}:${b.key}`));

const actionCounts = {};
for (const action of actions) actionCounts[action.type] = (actionCounts[action.type] ?? 0) + 1;

const reviewPackage = {
  schema_version: 'calendar-operations-review-package-v1',
  work_id: 'WHR-CAL-OPS-V1',
  as_of_date: status.as_of_date,
  generated_at: status.generated_at,
  mode: control.mode,
  boundaries: {
    network_fetch_performed: false,
    repository_write_performed: false,
    candidate_approval_performed: false,
    canonical_write_performed: false,
    public_write_performed: false,
    pull_request_created: false
  },
  input_digests: {
    operations_status_sha256: sha256(statusPath),
    operations_control_sha256: sha256(controlPath),
    readiness_registry_sha256: sha256('data/static/calendar-readiness-registry.json'),
    authority_inventory_sha256: sha256('data/static/authority-source-inventory.json'),
    public_meeting_list_sha256: sha256('data/generated/timetable/public/meeting-list.json'),
    jra_candidate_sha256: sha256('data/candidates/japan-jra-candidates.json')
  },
  summary: {
    operator_action_count: actions.length,
    action_counts: actionCounts,
    revalidation_due_count: status.source_summary.revalidation_due_count,
    blocked_count: status.source_summary.blocked_count,
    unavailable_count: status.source_summary.unavailable_count,
    current_window_meeting_count: status.public_projection.current_window_meeting_count,
    public_projection_stale: status.public_projection.stale_for_current_window,
    jra_refresh_required: status.candidate_summary.promotion_blocked_by_freshness
  },
  proposed_review: {
    branch_name: `ops/calendar-review-${status.as_of_date}`,
    title: `Calendar operations review ${status.as_of_date}`,
    commit_message: `chore: prepare Calendar operations review ${status.as_of_date}`,
    changed_files: [],
    public_release_expected: false,
    required_checks: [
      'source evidence reviewed',
      'candidate freshness gate satisfied where applicable',
      'no rank or Public Ceiling change without contract update',
      'no candidate approval in generated artifacts',
      'no canonical or public output change',
      'pause and rollback control remains active'
    ]
  },
  actions,
  pause_and_rollback: {
    current_mode: control.mode,
    pause_actions: control.pause_actions,
    rollback_actions: control.rollback_actions,
    activation_prerequisites: control.activation_prerequisites
  }
};

const serialized = `${JSON.stringify(reviewPackage, null, 2)}\n`;
if (dryRun) {
  console.log(JSON.stringify({ as_of_date: reviewPackage.as_of_date, summary: reviewPackage.summary, proposed_review: reviewPackage.proposed_review }, null, 2));
  process.exit(0);
}
const absoluteOutput = path.isAbsolute(outputPath) ? outputPath : path.join(root, outputPath);
if (check) {
  if (!existsSync(absoluteOutput) || readFileSync(absoluteOutput, 'utf8') !== serialized) throw new Error('Operations review package is stale.');
  console.log(`CALENDAR_OPERATIONS_REVIEW_PACKAGE: current as_of=${reviewPackage.as_of_date}`);
  process.exit(0);
}
mkdirSync(path.dirname(absoluteOutput), { recursive: true });
writeFileSync(absoluteOutput, serialized);
console.log(`CALENDAR_OPERATIONS_REVIEW_PACKAGE: wrote ${outputPath} actions=${actions.length}`);
