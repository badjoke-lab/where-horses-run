import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadCalendarAcquisitionRegistryV1 } from './load-calendar-acquisition-registry.mjs';
import { compileRunnerExecutionV1 } from './runner-compatibility.mjs';

const root = process.cwd();
const arg = (name, fallback = null) => process.argv.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const systemKey = arg('system');
const outputArg = arg('output-dir');
const days = Number(arg('days', '30'));
if (!['hkjc', 'kra'].includes(systemKey)) throw new Error('--system=hkjc|kra is required');
if (!outputArg) throw new Error('--output-dir=<path> is required');
if (!Number.isInteger(days) || days < 1 || days > 62) throw new Error('--days must be an integer from 1 through 62');

const CONFIG = {
  hkjc: {
    system_id: 'hong-kong-hkjc-system',
    authority_id: 'hkjc',
    timezone: 'Asia/Hong_Kong',
    collection_mode: 'date_window',
    public_ceiling: 'A',
  },
  kra: {
    system_id: 'kra-national-racing-system',
    authority_id: 'korea-racing-authority',
    timezone: 'Asia/Seoul',
    collection_mode: 'selected_meetings',
    public_ceiling: 'A',
  },
};
const config = CONFIG[systemKey];
const lowerRanks = new Set(['C', 'B', 'B+']);
const rankIndex = new Map(['C', 'B', 'B+', 'A', 'A+'].map((rank, index) => [rank, index]));
const outputDir = path.resolve(root, outputArg);
fs.mkdirSync(outputDir, { recursive: true });

function localDate(timezone, instant = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function plusDays(date, count) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + count);
  return value.toISOString().slice(0, 10);
}

function runNode(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 30 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${script} failed: ${(result.stderr || result.stdout || '').slice(0, 8000)}`);
  return result.stdout;
}

const meetingList = JSON.parse(fs.readFileSync(path.join(root, 'data/generated/timetable/public/meeting-list.json'), 'utf8'));
const asOfDate = localDate(config.timezone);
const endDateExclusive = plusDays(asOfDate, days);
const selected = (meetingList.meetings ?? [])
  .filter((meeting) => meeting.authority_id === config.authority_id)
  .filter((meeting) => lowerRanks.has(meeting.capability_rank))
  .filter((meeting) => meeting.date >= asOfDate && meeting.date < endDateExclusive)
  .sort((a, b) => a.date.localeCompare(b.date) || a.meeting_id.localeCompare(b.meeting_id));
const selectedById = new Map(selected.map((meeting) => [meeting.meeting_id, meeting]));

const registry = loadCalendarAcquisitionRegistryV1(root);
const compatibility = JSON.parse(fs.readFileSync(path.join(root, 'data/static/calendar-runner-compatibility-contract-v1.json'), 'utf8'));
const generatedAt = new Date().toISOString();
const runToken = generatedAt.replace(/[-:.TZ]/g, '').slice(0, 14);

function makeJob({ suffix, requestedScope }) {
  const campaignId = `calendar-${systemKey}-current-best-available-${asOfDate}`;
  return {
    schema_version: 'calendar-collection-job-v1',
    job_id: `${systemKey}-current-best-available-${suffix}-${runToken}`,
    campaign_id: campaignId,
    system_id: config.system_id,
    runner_policy: { mode: 'exact', runner: 'github_actions' },
    collection_mode: config.collection_mode,
    requested_scope: requestedScope,
    rank_strategy: 'best_available',
    target_rank: null,
    reason: 'regular_refresh',
    requested_at: generatedAt,
  };
}

const jobs = [];
if (systemKey === 'kra' && selected.length) {
  jobs.push(makeJob({
    suffix: 'selected',
    requestedScope: { meeting_ids: selected.map((meeting) => meeting.meeting_id) },
  }));
}
if (systemKey === 'hkjc' && selected.length) {
  const byMonth = new Map();
  for (const meeting of selected) {
    const month = meeting.date.slice(0, 7);
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month).push(meeting);
  }
  for (const [month, meetings] of [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const startDate = meetings[0].date;
    const finalDate = meetings[meetings.length - 1].date;
    jobs.push(makeJob({
      suffix: month,
      requestedScope: {
        start_date: startDate,
        end_date_exclusive: plusDays(finalDate, 1),
        timezone: config.timezone,
      },
    }));
  }
}

const observations = [];
const sourceErrors = [];
const batches = [];
for (let index = 0; index < jobs.length; index += 1) {
  const job = jobs[index];
  const batchId = `${systemKey}-current-best-available-${runToken}-${String(index + 1).padStart(2, '0')}`;
  const execution = compileRunnerExecutionV1(job, { batch_id: batchId }, registry, compatibility);
  const jobPath = path.join(outputDir, `${batchId}-job.json`);
  const executionPath = path.join(outputDir, `${batchId}-execution.json`);
  const statusPath = path.join(outputDir, `${batchId}-status.json`);
  fs.writeFileSync(jobPath, `${JSON.stringify(job, null, 2)}\n`);
  fs.writeFileSync(executionPath, `${JSON.stringify(execution, null, 2)}\n`);
  runNode('scripts/timetable/run-calendar-actions-job.mjs', [
    `--job=${jobPath}`,
    `--execution=${executionPath}`,
    `--status-output=${statusPath}`,
  ]);
  const artifactDir = path.join(root, 'data/generated/timetable/actions-multi-job', batchId);
  const candidate = JSON.parse(fs.readFileSync(path.join(artifactDir, 'candidates.json'), 'utf8'));
  const coverage = JSON.parse(fs.readFileSync(path.join(artifactDir, 'coverage-observation.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(artifactDir, 'result-manifest.json'), 'utf8'));
  const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
  if (candidate.review?.status !== 'needs_review') throw new Error(`${systemKey} candidate escaped review boundary`);
  if (status.status !== 'success') throw new Error(`${systemKey} dispatcher status ${status.status}`);
  for (const error of coverage.source_errors ?? []) sourceErrors.push(error);
  for (const record of candidate.records ?? []) {
    if (selectedById.has(record.meeting_id)) observations.push(record);
  }
  batches.push({
    batch_id: batchId,
    requested_scope: job.requested_scope,
    coverage_claim: coverage.coverage_claim,
    rank_counts: manifest.rank_counts,
    source_error_count: (coverage.source_errors ?? []).length,
  });
}

const observedById = new Map(observations.map((record) => [record.meeting_id, record]));
const observedRankCounts = Object.fromEntries(['C', 'B', 'B+', 'A', 'A+'].map((rank) => [
  rank,
  observations.filter((record) => record.capability_rank === rank).length,
]));
const upgradeCandidates = selected.flatMap((meeting) => {
  const observed = observedById.get(meeting.meeting_id);
  if (!observed) return [];
  if ((rankIndex.get(observed.capability_rank) ?? -1) <= (rankIndex.get(meeting.capability_rank) ?? -1)) return [];
  return [{
    meeting_id: meeting.meeting_id,
    current_rank: meeting.capability_rank,
    observed_rank: observed.capability_rank,
    public_ceiling: config.public_ceiling,
  }];
});

const summary = {
  schema_version: 'calendar-current-lower-rank-best-available-summary-v1',
  generated_at: generatedAt,
  system_key: systemKey,
  system_id: config.system_id,
  authority_id: config.authority_id,
  timezone: config.timezone,
  as_of_date: asOfDate,
  end_date_exclusive: endDateExclusive,
  selected_lower_rank_meeting_count: selected.length,
  selected_meeting_ids: selected.map((meeting) => meeting.meeting_id),
  batch_count: batches.length,
  batches,
  observed_selected_meeting_count: observations.length,
  observed_rank_counts: observedRankCounts,
  upgrade_candidate_count: upgradeCandidates.length,
  upgrade_candidates: upgradeCandidates,
  source_error_count: sourceErrors.length,
  source_errors: sourceErrors,
  review_status: 'needs_review',
  public_ceiling: config.public_ceiling,
  canonical_write: false,
  public_write: false,
  automatic_approval: false,
  automatic_promotion: false,
};
fs.writeFileSync(path.join(outputDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
if (sourceErrors.length) process.exitCode = 1;
