import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildUaeEraRankUpgradeArtifactsV1, sha256UaeJsonV1 } from './uae-era-rank-upgrade-core.mjs';

const root = process.cwd();
const PUBLIC_LIST = path.join(root, 'data/generated/timetable/public/meeting-list.json');
const CANONICAL = path.join(root, 'data/generated/timetable/canonical/meetings.json');
const LOWER_THAN_A = new Set(['C', 'B', 'B+']);

const argument = (name) => process.argv.find((item) => item.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;
const outputArg = argument('output-dir') ?? '/tmp/uae-current-best-available';
const asOfArg = argument('as-of');

function dubaiDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

const asOf = asOfArg ?? dubaiDate();
if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) throw new Error('--as-of must be YYYY-MM-DD');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function runCollector(meeting) {
  const result = spawnSync(process.execPath, [
    'scripts/timetable/collect-uae-era-detail-artifacts.mjs',
    `--date=${meeting.date}`,
    `--racecourse-id=${meeting.racecourse_id}`,
  ], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) {
    return {
      status: 'unavailable',
      error: String(result.stderr || result.stdout || '').trim().slice(0, 2000),
      evidence: null,
    };
  }
  return { status: 'success', error: null, evidence: JSON.parse(result.stdout) };
}

const publicList = readJson(PUBLIC_LIST);
const canonical = readJson(CANONICAL);
const canonicalById = new Map((canonical.meetings ?? []).map((meeting) => [meeting.meeting_id, meeting]));
const selected = (publicList.meetings ?? [])
  .filter((meeting) =>
    meeting.country_id === 'united-arab-emirates' &&
    meeting.date >= asOf &&
    LOWER_THAN_A.has(meeting.effective_public_rank ?? meeting.capability_rank)
  )
  .sort((left, right) => left.date.localeCompare(right.date) || left.meeting_id.localeCompare(right.meeting_id));

const observations = [];
const aEvidenceByMeetingId = {};
const aMeetingIds = [];
for (const meeting of selected) {
  const canonicalMeeting = canonicalById.get(meeting.meeting_id);
  if (!canonicalMeeting) throw new Error(`public UAE meeting missing from canonical: ${meeting.meeting_id}`);
  const collected = runCollector(meeting);
  if (collected.status !== 'success') {
    observations.push({
      meeting_id: meeting.meeting_id,
      date: meeting.date,
      racecourse_id: meeting.racecourse_id,
      current_public_rank: meeting.effective_public_rank ?? meeting.capability_rank,
      status: 'unavailable',
      observed_rank: null,
      source_error_count: 1,
      error: collected.error,
    });
    continue;
  }

  const evidence = collected.evidence;
  const observedRank = evidence.classification?.rank ?? null;
  observations.push({
    meeting_id: meeting.meeting_id,
    date: meeting.date,
    racecourse_id: meeting.racecourse_id,
    current_public_rank: meeting.effective_public_rank ?? meeting.capability_rank,
    status: 'success',
    observed_rank: observedRank,
    first_race_time_local: evidence.classification?.first_race_time_local ?? null,
    last_race_time_local: evidence.classification?.last_race_time_local ?? null,
    race_count: evidence.meeting?.race_count ?? 0,
    source_error_count: evidence.source_errors?.length ?? 0,
  });

  // Existing reviewed UAE promotion contract is intentionally C -> A only.
  // B/B+ observations stay evidence-only until a separate bounded promotion contract exists.
  if (
    canonicalMeeting.capability_rank === 'C' &&
    observedRank === 'A' &&
    (evidence.source_errors ?? []).length === 0
  ) {
    aMeetingIds.push(meeting.meeting_id);
    aEvidenceByMeetingId[meeting.meeting_id] = evidence;
  }
}

const generatedAt = new Date().toISOString();
let rankAArtifacts = null;
if (aMeetingIds.length > 0) {
  const job = {
    schema_version: 'calendar-collection-job-v1',
    job_id: `uae-current-best-available-${asOf}-job`,
    campaign_id: 'uae-current-best-available-refresh',
    system_id: 'uae-national-racing-system',
    runner_policy: { mode: 'exact', runner: 'github_actions' },
    collection_mode: 'selected_meetings',
    requested_scope: { meeting_ids: [...aMeetingIds].sort() },
    rank_strategy: 'target_rank',
    target_rank: 'A',
    reason: 'rank_upgrade_retry',
    requested_at: generatedAt,
  };
  rankAArtifacts = buildUaeEraRankUpgradeArtifactsV1({
    job,
    batchId: `uae-current-best-available-${asOf.replaceAll('-', '')}`,
    generatedAt,
    canonicalMeetings: canonical.meetings,
    evidenceByMeetingId: aEvidenceByMeetingId,
  });
}

const summary = {
  schema_version: 'calendar-uae-current-best-available-summary-v1',
  generated_at: generatedAt,
  as_of_date: asOf,
  timezone: 'Asia/Dubai',
  selected_lower_rank_meeting_count: selected.length,
  selected_meeting_ids: selected.map((meeting) => meeting.meeting_id),
  observations,
  observed_rank_counts: observations.reduce((counts, row) => {
    const key = row.observed_rank ?? 'unavailable';
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {}),
  rank_a_candidate_count: rankAArtifacts?.candidate?.records?.length ?? 0,
  rank_a_candidate_ids: rankAArtifacts?.candidate?.records?.map((record) => record.meeting_id) ?? [],
  rank_a_candidate_sha256: rankAArtifacts ? sha256UaeJsonV1(rankAArtifacts.candidate) : null,
  rank_a_manifest_sha256: rankAArtifacts ? sha256UaeJsonV1(rankAArtifacts.manifest) : null,
  canonical_write: false,
  public_write: false,
  automatic_approval: false,
  automatic_promotion: false,
};

fs.mkdirSync(outputArg, { recursive: true });
fs.writeFileSync(path.join(outputArg, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
if (rankAArtifacts) {
  for (const [name, value] of Object.entries({
    'rank-a-candidates.json': rankAArtifacts.candidate,
    'rank-a-manifest.json': rankAArtifacts.manifest,
    'rank-a-coverage.json': rankAArtifacts.coverage,
    'rank-a-report.json': rankAArtifacts.report,
  })) {
    fs.writeFileSync(path.join(outputArg, name), `${JSON.stringify(value, null, 2)}\n`);
  }
}

console.log(JSON.stringify(summary, null, 2));
