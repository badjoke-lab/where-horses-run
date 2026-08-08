import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = new Map(process.argv.slice(2).map((arg) => {
  const index = arg.indexOf('=');
  return index === -1 ? [arg, true] : [arg.slice(0, index), arg.slice(index + 1)];
}));

const required = [
  '--generated-at',
  '--run-id',
  '--run-attempt',
  '--event-name',
  '--source-sha',
  '--source-ref',
  '--plan-result',
  '--execute-result',
  '--review-branch',
  '--output',
];
for (const key of required) if (!args.get(key)) throw new Error(`${key}=<value> is required`);

const jobResults = new Set(['success', 'failure', 'cancelled', 'skipped']);
const eventNames = new Set(['schedule', 'workflow_dispatch', 'push']);
const generatedAt = args.get('--generated-at');
const runId = args.get('--run-id');
const runAttempt = Number(args.get('--run-attempt'));
const eventName = args.get('--event-name');
const sourceSha = args.get('--source-sha');
const sourceRef = args.get('--source-ref');
const planResult = args.get('--plan-result');
const executeResult = args.get('--execute-result');
const hostedJobsRaw = args.get('--hosted-jobs') ?? '';
const planIdRaw = args.get('--plan-id') ?? '';
const reviewBranch = args.get('--review-branch');
const outputPath = args.get('--output');

if (Number.isNaN(Date.parse(generatedAt))) throw new Error('--generated-at must be a valid date-time');
if (!/^[0-9]+$/.test(runId)) throw new Error('--run-id must contain digits only');
if (!Number.isInteger(runAttempt) || runAttempt < 1) throw new Error('--run-attempt must be a positive integer');
if (!eventNames.has(eventName)) throw new Error('--event-name is unsupported');
if (!/^[0-9a-f]{40}$/.test(sourceSha)) throw new Error('--source-sha must be a lowercase 40-character SHA');
if (sourceRef.trim() === '') throw new Error('--source-ref must be non-empty');
if (!jobResults.has(planResult)) throw new Error('--plan-result is unsupported');
if (!jobResults.has(executeResult)) throw new Error('--execute-result is unsupported');
if (reviewBranch !== 'automation/calendar-daily-acquisition-review') throw new Error('--review-branch differs from the stable review branch');

let hostedJobs = null;
if (hostedJobsRaw !== '') {
  hostedJobs = Number(hostedJobsRaw);
  if (!Number.isInteger(hostedJobs) || hostedJobs < 0) throw new Error('--hosted-jobs must be a non-negative integer or empty');
}
const planId = planIdRaw === '' ? null : planIdRaw;

function addDays(date, days) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function publicationFreshness() {
  const meetingListPath = path.join(root, 'data/generated/timetable/public/meeting-list.json');
  const meetingList = JSON.parse(fs.readFileSync(meetingListPath, 'utf8'));
  const dates = (meetingList.meetings ?? []).map((meeting) => meeting.date).filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date));
  const publicHorizonEndDate = dates.sort().at(-1) ?? null;
  const planningDate = generatedAt.slice(0, 10);
  const requiredHorizonEndDate = addDays(planningDate, 29);
  return {
    public_horizon_end_date: publicHorizonEndDate,
    required_horizon_end_date: requiredHorizonEndDate,
    publication_review_required: publicHorizonEndDate === null || publicHorizonEndDate < requiredHorizonEndDate,
  };
}

const status = {
  schema_version: 'calendar-daily-acquisition-activation-status-v1',
  generated_at: generatedAt,
  run_id: runId,
  run_attempt: runAttempt,
  event_name: eventName,
  source_sha: sourceSha,
  source_ref: sourceRef,
  plan_result: planResult,
  execute_result: executeResult,
  hosted_jobs: hostedJobs,
  plan_id: planId,
  review_branch: reviewBranch,
  publication_freshness: publicationFreshness(),
  publication_boundary: {
    automatic_approval: false,
    canonical_written: false,
    public_projection_written: false,
    automatic_merge: false,
    deployment_performed: false,
  },
};

const output = path.resolve(root, outputPath);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(status, null, 2)}\n`);
console.log(JSON.stringify({
  output: path.relative(root, output),
  run_id: status.run_id,
  plan_result: status.plan_result,
  execute_result: status.execute_result,
  hosted_jobs: status.hosted_jobs,
  review_branch: status.review_branch,
  publication_freshness: status.publication_freshness,
}));
