import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const RANKS = ['C', 'B', 'B+', 'A', 'A+'];
const RANK_INDEX = new Map(RANKS.map((value, index) => [value, index]));
const DATA_COMMIT = /^data: refresh (?:Japan official timetable|unified official rolling timetable) \((?:full|near)\)$/;

const SYSTEMS = [
  { key: 'hkjc', file: 'hkjc.json', country_id: 'hong-kong', authority_id: 'hkjc', racing_system_id: 'hong-kong-hkjc-system' },
  { key: 'uae', file: 'uae.json', country_id: 'united-arab-emirates', authority_id: 'emirates-racing-authority', racing_system_id: 'uae-national-racing-system' },
  { key: 'kra', file: 'kra.json', country_id: 'south-korea', authority_id: 'korea-racing-authority', racing_system_id: 'kra-national-racing-system' },
  { key: 'tjk', file: 'tjk.json', country_id: 'turkey', authority_id: 'turkiye-jokey-kulubu', racing_system_id: 'tjk-national-racing-system' },
  { key: 'sorec', file: 'sorec.json', country_id: 'morocco', authority_id: 'sorec', racing_system_id: 'sorec-racing-information-system' },
  { key: 'chile', file: 'chile.json', country_id: 'chile', authority_id: 'teletrak-chile', racing_system_id: 'chile-teletrak-racing-system' },
  { key: 'ireland', file: 'ireland.json', country_id: 'ireland', authority_id: 'horse-racing-ireland', racing_system_id: 'ireland-hri-racing-system' },
];

const STATE_FILES = {
  canonical: 'data/generated/timetable/canonical/meetings.json',
  details: 'data/generated/timetable/canonical/meeting-details.json',
  publicList: 'data/generated/timetable/public/meeting-list.json',
  publicDetails: 'data/generated/timetable/public/meeting-details.json',
};

function arg(name, fallback = null) {
  const prefix = `--${name}=`;
  const value = process.argv.find((item) => item.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
}
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}
function git(repoRoot, args) {
  return execFileSync('git', ['-C', repoRoot, ...args], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }).trim();
}
function gitJson(repoRoot, ref, file) {
  return JSON.parse(git(repoRoot, ['show', `${ref}:${file}`]));
}
function recordsFromArtifact(artifact) {
  if (Array.isArray(artifact)) return artifact;
  if (Array.isArray(artifact.records)) return artifact.records;
  if (Array.isArray(artifact.candidates)) return artifact.candidates;
  if (Array.isArray(artifact.detail_candidates) || Array.isArray(artifact.schedule_candidates)) {
    return [...(artifact.schedule_candidates ?? []), ...(artifact.detail_candidates ?? [])];
  }
  return [];
}
function mapById(rows = []) { return new Map(rows.map((row) => [row.meeting_id, row])); }
function rank(value) { return RANK_INDEX.get(value) ?? -1; }
function countArray(value) { return Array.isArray(value) ? value.length : 0; }
function withoutVolatile(value) {
  if (Array.isArray(value)) return value.map(withoutVolatile);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !['freshness', 'last_checked_date', 'generated_at'].includes(key))
    .map(([key, child]) => [key, withoutVolatile(child)]));
}
function sameSubstance(left, right) {
  return JSON.stringify(withoutVolatile(left ?? null)) === JSON.stringify(withoutVolatile(right ?? null));
}
function stateMaps(repoRoot, ref) {
  return {
    canonical: mapById(gitJson(repoRoot, ref, STATE_FILES.canonical).meetings ?? []),
    details: mapById(gitJson(repoRoot, ref, STATE_FILES.details).details ?? []),
    publicList: mapById(gitJson(repoRoot, ref, STATE_FILES.publicList).meetings ?? []),
    publicDetails: mapById(gitJson(repoRoot, ref, STATE_FILES.publicDetails).details ?? []),
  };
}
function meetingState(maps, meetingId) {
  return {
    canonical: maps.canonical.get(meetingId) ?? null,
    detail: maps.details.get(meetingId) ?? null,
    public: maps.publicList.get(meetingId) ?? null,
    public_detail: maps.publicDetails.get(meetingId) ?? null,
  };
}
function findResultSha(repoRoot, sourceHeadSha, startedAt, completedAt) {
  const started = Date.parse(startedAt);
  const completed = Date.parse(completedAt);
  if (!Number.isFinite(started) || !Number.isFinite(completed)) throw new Error('invalid run timestamps');
  const raw = git(repoRoot, ['log', '--format=%H%x1f%cI%x1f%s', `${sourceHeadSha}..HEAD`]);
  if (!raw) return sourceHeadSha;
  const candidates = raw.split('\n').map((line) => {
    const [sha, timestamp, ...subjectParts] = line.split('\x1f');
    return { sha, timestamp, subject: subjectParts.join('\x1f') };
  }).filter((row) => {
    const time = Date.parse(row.timestamp);
    return DATA_COMMIT.test(row.subject) && time >= started - 60_000 && time <= completed + 120_000;
  }).sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  return candidates.at(-1)?.sha ?? sourceHeadSha;
}
function selectJapanReconciliation(artifactRoot) {
  const candidates = [
    path.join(artifactRoot, 'data/generated/timetable/japan-zero-based-30d-reconciliation.json'),
    path.join(artifactRoot, 'data/generated/timetable/japan-zero-based-3d-reconciliation.json'),
  ].filter((file) => fs.existsSync(file));
  if (!candidates.length) return null;
  return candidates.map((file) => ({ file, data: readJson(file) }))
    .sort((a, b) => String(b.data.checked_at ?? '').localeCompare(String(a.data.checked_at ?? '')))[0];
}
function countNonJapanFetchFailures(artifact, records) {
  if (Array.isArray(artifact.diagnostics?.fetch_failures)) return artifact.diagnostics.fetch_failures.length;
  if (Array.isArray(artifact.diagnostics?.source_failures)) return artifact.diagnostics.source_failures.length;
  const statusCount = artifact.discovery?.detail_status_counts?.source_error;
  if (Number.isInteger(statusCount)) return statusCount;
  return records.filter((row) => row?.detail_observation?.status === 'source_error').length;
}
function countNonJapanParseFailures(artifact) {
  return countArray(artifact.diagnostics?.parse_failures) + countArray(artifact.discovery?.parse_failures);
}
function pendingFromArtifact(artifact, records) {
  const explicit = artifact.discovery?.detail_status_counts?.not_published;
  if (Number.isInteger(explicit)) return explicit;
  return records.filter((row) => ['not_published', 'details_pending'].includes(row?.detail_observation?.status)).length;
}
function summarizeMeetingIds({ ids, before, after }) {
  let changed = 0;
  let promoted = 0;
  let added = 0;
  for (const meetingId of ids) {
    const oldState = meetingState(before, meetingId);
    const newState = meetingState(after, meetingId);
    if (!sameSubstance(oldState, newState)) changed += 1;
    if (!oldState.canonical && newState.canonical) added += 1;
    if (oldState.canonical && rank(newState.canonical?.capability_rank) > rank(oldState.canonical?.capability_rank)) promoted += 1;
  }
  return { changed, unchanged: Math.max(0, ids.length - changed), promoted, added };
}

const repoRoot = path.resolve(arg('repo-root', '.'));
const artifactRoot = path.resolve(arg('artifact-root', '.'));
const output = path.resolve(arg('output', '.calendar-audit/refresh-audit-summary.json'));
const sourceRunId = arg('source-run-id');
const sourceHeadSha = arg('source-head-sha');
const runStartedAt = arg('run-started-at');
const runCompletedAt = arg('run-completed-at');
const sourceConclusion = arg('source-conclusion', 'unknown');
for (const [name, value] of Object.entries({ sourceRunId, sourceHeadSha, runStartedAt, runCompletedAt })) {
  if (!value) throw new Error(`missing required --${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)} argument`);
}

const resultSha = findResultSha(repoRoot, sourceHeadSha, runStartedAt, runCompletedAt);
const before = stateMaps(repoRoot, sourceHeadSha);
const after = stateMaps(repoRoot, resultSha);
const systems = [];

const japan = selectJapanReconciliation(artifactRoot);
if (japan) {
  const byGroup = new Map();
  for (const row of japan.data.reconciliations ?? []) {
    const group = row.acquisition_group ?? 'unknown';
    if (!byGroup.has(group)) byGroup.set(group, []);
    byGroup.get(group).push(row);
  }
  for (const [group, rows] of [...byGroup.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const ids = [...new Set(rows.map((row) => row.meeting_id).filter(Boolean))];
    const state = summarizeMeetingIds({ ids, before, after });
    const outcomes = Object.fromEntries([...new Set(rows.map((row) => row.outcome))].sort()
      .map((name) => [name, rows.filter((row) => row.outcome === name).length]));
    const completionCounts = Object.fromEntries([...new Set(rows.map((row) => row.acquisition_completion))].sort()
      .map((name) => [name, rows.filter((row) => row.acquisition_completion === name).length]));
    systems.push({
      country_id: 'japan', authority_id: null, racing_system_id: null, acquisition_group: group,
      status: 'audited', checked: ids.length, ...state,
      pending: rows.filter((row) => ['pending_publication', 'retry_required', 'implementation_gap'].includes(row.acquisition_completion)).length,
      fetch_failed: Number(outcomes.acquisition_failed ?? 0),
      parse_failed: Number(outcomes.conflict ?? 0),
      raw_reconciliation: { outcomes, completion_counts: completionCounts },
    });
  }
  const sourceFailures = (japan.data.source_completeness ?? []).reduce((sum, row) => sum + Number(row.failure_count ?? 0) + Number(row.programme_failure_count ?? 0), 0);
  systems.push({
    country_id: 'japan', authority_id: null, racing_system_id: null, acquisition_group: 'source-health',
    status: japan.data.complete && japan.data.mother_set_complete ? 'complete' : 'incomplete',
    checked: japan.data.official_meeting_count ?? 0, changed: 0, unchanged: 0, promoted: 0, added: 0,
    pending: (japan.data.source_completeness ?? []).reduce((sum, row) => sum + Number(row.pending_count ?? 0) + Number(row.programme_not_published_count ?? 0), 0),
    fetch_failed: sourceFailures, parse_failed: 0,
    reconciliation_scope: japan.data.scope ?? null,
    reconciliation_checked_at: japan.data.checked_at ?? null,
    mother_set_complete: Boolean(japan.data.mother_set_complete),
  });
} else {
  systems.push({ country_id: 'japan', authority_id: null, racing_system_id: null, acquisition_group: 'all', status: 'artifact_missing', checked: 0, changed: 0, unchanged: 0, promoted: 0, added: 0, pending: 0, fetch_failed: 1, parse_failed: 0 });
}

for (const config of SYSTEMS) {
  const artifactPath = path.join(artifactRoot, '.calendar-unified', config.file);
  if (!fs.existsSync(artifactPath)) {
    systems.push({ ...config, status: 'artifact_missing', checked: 0, changed: 0, unchanged: 0, promoted: 0, added: 0, pending: 0, fetch_failed: 1, parse_failed: 0 });
    continue;
  }
  const artifact = readJson(artifactPath);
  const records = recordsFromArtifact(artifact);
  const ids = [...new Set(records.map((row) => row?.meeting_id).filter(Boolean))];
  const state = summarizeMeetingIds({ ids, before, after });
  systems.push({
    country_id: config.country_id,
    authority_id: config.authority_id,
    racing_system_id: config.racing_system_id,
    status: 'audited',
    observed_records: records.length,
    checked: ids.length,
    ...state,
    pending: pendingFromArtifact(artifact, records),
    fetch_failed: countNonJapanFetchFailures(artifact, records),
    parse_failed: countNonJapanParseFailures(artifact),
    diagnostics: {
      unknown_venues: countArray(artifact.diagnostics?.unknown_venues),
      detail_conflict: Number(artifact.discovery?.detail_status_counts?.conflict ?? 0),
      source_warnings: countArray(artifact.diagnostics?.source_warnings),
    },
  });
}

const reportRows = systems.filter((row) => row.acquisition_group !== 'source-health');
const totals = reportRows.reduce((acc, row) => {
  for (const key of ['checked', 'changed', 'unchanged', 'promoted', 'added', 'pending', 'fetch_failed', 'parse_failed']) acc[key] += Number(row[key] ?? 0);
  return acc;
}, { checked: 0, changed: 0, unchanged: 0, promoted: 0, added: 0, pending: 0, fetch_failed: 0, parse_failed: 0 });

const summary = {
  schema_version: 'calendar-refresh-audit-summary-v1',
  generated_at: new Date().toISOString(),
  source_run_id: String(sourceRunId),
  source_head_sha: sourceHeadSha,
  result_sha: resultSha,
  source_conclusion: sourceConclusion,
  run_started_at: runStartedAt,
  run_completed_at: runCompletedAt,
  semantics: {
    checked: 'Unique meeting_ids present in the source-run acquisition artifacts.',
    changed: 'Checked meeting_ids with a substantive canonical/detail/public difference from source_head_sha to result_sha; freshness-only changes are excluded.',
    unchanged: 'checked - changed.',
    promoted: 'Previously existing checked meeting_ids whose canonical capability rank increased.',
    added: 'Checked meeting_ids absent from canonical at source_head_sha and present at result_sha.',
    pending: 'Known detail publication/acquisition work still pending in the source-run artifact.',
    fetch_failed: 'Explicit source/acquisition failures represented in the source-run artifact.',
    parse_failed: 'Explicit parse/conflict failures represented in the source-run artifact.',
  },
  totals,
  systems,
};
writeJson(output, summary);
console.log(JSON.stringify({ output, source_run_id: String(sourceRunId), result_sha: resultSha, totals }));
