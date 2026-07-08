import { validateReviewCohortPlanV1 } from './review-cohort-planner.mjs';
import { validateRankAwareRetryQueueV1 } from './rank-aware-retry-queue-validation.mjs';

const RANKS = Object.freeze(['C', 'B', 'B+', 'A', 'A+']);
const RANK_INDEX = new Map(RANKS.map((rank, index) => [rank, index]));
const CLAIMS = Object.freeze(['none', 'partial', 'source_window_complete', 'audited_complete']);
const BOUNDARIES = Object.freeze({
  pull_request_created: false,
  candidate_approved: false,
  promotion_performed: false,
  canonical_write_performed: false,
  public_write_performed: false,
  publication_performed: false,
  deployment_performed: false,
});
const PACKAGE_KEYS = Object.freeze([
  'package_id', 'cohort_id', 'system_id', 'cohort_kind', 'public_display_risk',
  'promotion_dependency', 'rank_counts', 'candidate_diff_summary', 'coverage_summary',
  'retry_summary', 'batch_artifacts', 'checklist', 'proposed_pr', 'boundaries',
]);
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REPO_REF_PATTERN = /^(?:data|docs)\/[A-Za-z0-9_./+-]+$/;

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function validDateTime(value) {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Date.parse(value));
}

function zeroRankCounts() {
  return { C: 0, B: 0, 'B+': 0, A: 0, 'A+': 0 };
}

function rankTotal(counts) {
  return RANKS.reduce((sum, rank) => sum + (counts?.[rank] ?? 0), 0);
}

function transitionKey(fromRank, toRank) {
  return `${fromRank ?? 'NEW'}->${toRank}`;
}

function sortTransitions(entries) {
  return [...entries].sort((left, right) => {
    const leftFrom = left.from_rank === null ? -1 : RANK_INDEX.get(left.from_rank);
    const rightFrom = right.from_rank === null ? -1 : RANK_INDEX.get(right.from_rank);
    if (leftFrom !== rightFrom) return leftFrom - rightFrom;
    return RANK_INDEX.get(left.to_rank) - RANK_INDEX.get(right.to_rank);
  });
}

function buildCandidateDiffSummary(cohort, artifactsByBatchId, canonicalByMeetingId) {
  const totals = {
    candidate_count: 0,
    new_count: 0,
    upgrade_count: 0,
    unchanged_count: 0,
    lower_observation_count: 0,
    transitions: [],
  };
  const transitionCounts = new Map();
  const seenMeetings = new Set();

  for (const batch of cohort.batches) {
    const artifact = artifactsByBatchId.get(batch.batch_id);
    if (!artifact) throw new Error(`artifact catalog missing for ${batch.batch_id}`);
    if (artifact.manifest_ref !== batch.manifest_ref) throw new Error(`manifest_ref drift for ${batch.batch_id}`);
    const records = artifact.candidate_records ?? [];
    if (records.length !== rankTotal(batch.rank_counts)) {
      throw new Error(`candidate count differs from rank total for ${batch.batch_id}`);
    }
    for (const record of records) {
      if (!ID_PATTERN.test(record.meeting_id ?? '')) throw new Error(`candidate meeting_id invalid in ${batch.batch_id}`);
      if (!RANKS.includes(record.observed_rank)) throw new Error(`candidate observed_rank invalid in ${batch.batch_id}`);
      const uniqueKey = `${cohort.system_id}:${record.meeting_id}`;
      if (seenMeetings.has(uniqueKey)) throw new Error(`duplicate candidate meeting across cohort batches: ${record.meeting_id}`);
      seenMeetings.add(uniqueKey);
      totals.candidate_count += 1;
      const canonical = canonicalByMeetingId.get(record.meeting_id);
      const fromRank = canonical?.capability_rank ?? null;
      if (fromRank !== null && !RANKS.includes(fromRank)) throw new Error(`canonical rank invalid for ${record.meeting_id}`);
      if (fromRank === null) totals.new_count += 1;
      else if (RANK_INDEX.get(record.observed_rank) > RANK_INDEX.get(fromRank)) totals.upgrade_count += 1;
      else if (RANK_INDEX.get(record.observed_rank) === RANK_INDEX.get(fromRank)) totals.unchanged_count += 1;
      else totals.lower_observation_count += 1;
      const key = transitionKey(fromRank, record.observed_rank);
      const current = transitionCounts.get(key) ?? { from_rank: fromRank, to_rank: record.observed_rank, count: 0 };
      current.count += 1;
      transitionCounts.set(key, current);
    }
  }
  totals.transitions = sortTransitions(transitionCounts.values());
  return { summary: totals, meeting_ids: seenMeetings };
}

function buildCoverageSummary(cohort) {
  const claimCounts = Object.fromEntries(CLAIMS.map((claim) => [claim, 0]));
  for (const batch of cohort.batches) claimCounts[batch.coverage_claim] += 1;
  return {
    batch_count: cohort.batch_count,
    claim_counts: claimCounts,
    unresolved_dates_count: cohort.unresolved_dates_count,
    unresolved_meeting_ids_count: cohort.unresolved_meeting_ids_count,
    source_error_count: cohort.source_error_count,
  };
}

function buildRetrySummary(cohort, candidateMeetingKeys, retryQueue, generatedAt) {
  const matches = (retryQueue?.entries ?? []).filter((entry) =>
    entry.system_id === cohort.system_id && candidateMeetingKeys.has(`${cohort.system_id}:${entry.meeting_id}`));
  const byReason = {};
  let dueNow = 0;
  let deferred = 0;
  const generatedTime = Date.parse(generatedAt);
  for (const entry of matches) {
    byReason[entry.retry_reason] = (byReason[entry.retry_reason] ?? 0) + 1;
    if (entry.next_eligible_retry_at === null || Date.parse(entry.next_eligible_retry_at) <= generatedTime) dueNow += 1;
    else deferred += 1;
  }
  return {
    matched_retry_count: matches.length,
    due_now_count: dueNow,
    deferred_count: deferred,
    by_reason: Object.fromEntries(Object.entries(byReason).sort(([left], [right]) => left.localeCompare(right))),
  };
}

function buildBatchArtifacts(cohort, artifactsByBatchId) {
  return cohort.batches.map((batch) => {
    const artifact = artifactsByBatchId.get(batch.batch_id);
    if (!artifact) throw new Error(`artifact catalog missing for ${batch.batch_id}`);
    if (artifact.manifest_ref !== batch.manifest_ref) throw new Error(`manifest_ref drift for ${batch.batch_id}`);
    for (const key of ['manifest_ref', 'coverage_observation_ref']) {
      if (typeof artifact[key] !== 'string' || !REPO_REF_PATTERN.test(artifact[key]) || artifact[key].includes('..')) {
        throw new Error(`${key} invalid for ${batch.batch_id}`);
      }
    }
    for (const key of ['candidate_ref', 'collection_report_ref']) {
      if (artifact[key] !== null && (typeof artifact[key] !== 'string' || !REPO_REF_PATTERN.test(artifact[key]) || artifact[key].includes('..'))) {
        throw new Error(`${key} invalid for ${batch.batch_id}`);
      }
    }
    return {
      batch_id: batch.batch_id,
      manifest_ref: artifact.manifest_ref,
      candidate_ref: artifact.candidate_ref,
      coverage_observation_ref: artifact.coverage_observation_ref,
      collection_report_ref: artifact.collection_report_ref,
    };
  });
}

function checklistFor(cohort) {
  const checklist = [
    'Verify candidate diff summary against batch candidate artifacts.',
    'Verify five-rank distribution and public display risk against the cohort plan.',
    'Verify Coverage summary and unresolved counts before any approval decision.',
    'Verify retry summary and preserve lower-observation monotonicity rules.',
    'Run Promotion Validation separately after human approval; this package does not promote data.',
  ];
  if (cohort.cohort_kind === 'coverage_review') checklist.push('Resolve or explicitly accept the recorded coverage dependency before promotion.');
  if (cohort.cohort_kind === 'source_failure_review') checklist.push('Recover or revalidate the source route before candidate promotion.');
  if (cohort.promotion_dependency === 'public_ceiling_projection_required') checklist.push('Verify Public Ceiling projection removes fields above the active public ceiling.');
  return checklist;
}

function bodyMarkdownFor(cohort, diffSummary, coverageSummary, retrySummary) {
  return [
    `## ${cohort.proposal.title}`,
    '',
    '**human review required**',
    '',
    `- Cohort: \`${cohort.cohort_id}\``,
    `- System: \`${cohort.system_id}\``,
    `- Review kind: \`${cohort.cohort_kind}\``,
    `- Public display risk: \`${cohort.public_display_risk}\``,
    `- Promotion dependency: \`${cohort.promotion_dependency}\``,
    `- Batches: ${cohort.batch_count}`,
    `- Candidate records: ${diffSummary.candidate_count}`,
    `- New / upgrade / unchanged / lower observation: ${diffSummary.new_count} / ${diffSummary.upgrade_count} / ${diffSummary.unchanged_count} / ${diffSummary.lower_observation_count}`,
    `- Coverage unresolved dates / meetings: ${coverageSummary.unresolved_dates_count} / ${coverageSummary.unresolved_meeting_ids_count}`,
    `- Source errors: ${coverageSummary.source_error_count}`,
    `- Matching retries: ${retrySummary.matched_retry_count} (${retrySummary.due_now_count} due, ${retrySummary.deferred_count} deferred)`,
    '',
    'This package prepares a bounded review proposal only. It does not approve candidates, run Promotion Validation, promote canonical data, publish public data, or deploy the site.',
  ].join('\n');
}

export function prepareReviewPrPackagesV1(cohortPlan, {
  review_queue: reviewQueue,
  registry,
  artifact_catalog: artifactCatalog,
  canonical_meetings: canonicalMeetings = [],
  retry_queue: retryQueue,
  generated_at: generatedAt = cohortPlan?.generated_at,
} = {}) {
  const planErrors = validateReviewCohortPlanV1(cohortPlan, reviewQueue, registry);
  if (planErrors.length) throw new Error(`invalid Review Cohort Plan: ${planErrors.join('; ')}`);
  if (!validDateTime(generatedAt)) throw new Error('generated_at must be a valid ISO date-time');
  const retryErrors = validateRankAwareRetryQueueV1(retryQueue);
  if (retryErrors.length) throw new Error(`invalid Rank-aware Retry Queue: ${retryErrors.join('; ')}`);

  const artifactsByBatchId = new Map();
  for (const artifact of artifactCatalog?.batches ?? []) {
    if (artifactsByBatchId.has(artifact.batch_id)) throw new Error(`duplicate artifact catalog batch ${artifact.batch_id}`);
    artifactsByBatchId.set(artifact.batch_id, artifact);
  }
  const canonicalByMeetingId = new Map(canonicalMeetings.map((meeting) => [meeting.meeting_id, meeting]));

  const packages = cohortPlan.cohorts.map((cohort) => {
    const { summary: diffSummary, meeting_ids: meetingIds } = buildCandidateDiffSummary(cohort, artifactsByBatchId, canonicalByMeetingId);
    const coverageSummary = buildCoverageSummary(cohort);
    const retrySummary = buildRetrySummary(cohort, meetingIds, retryQueue, generatedAt);
    const batchArtifacts = buildBatchArtifacts(cohort, artifactsByBatchId);
    return {
      package_id: `review-package-${cohort.cohort_id.replace(/^review-cohort-/, '')}`,
      cohort_id: cohort.cohort_id,
      system_id: cohort.system_id,
      cohort_kind: cohort.cohort_kind,
      public_display_risk: cohort.public_display_risk,
      promotion_dependency: cohort.promotion_dependency,
      rank_counts: structuredClone(cohort.rank_counts),
      candidate_diff_summary: diffSummary,
      coverage_summary: coverageSummary,
      retry_summary: retrySummary,
      batch_artifacts: batchArtifacts,
      checklist: checklistFor(cohort),
      proposed_pr: {
        branch_name: `review/calendar-${cohort.cohort_id}`,
        title: cohort.proposal.title,
        labels: ['human review required'],
        body_markdown: bodyMarkdownFor(cohort, diffSummary, coverageSummary, retrySummary),
        review_state: 'pending_human_review',
      },
      boundaries: structuredClone(BOUNDARIES),
    };
  });

  const output = {
    schema_version: 'calendar-review-pr-package-v1',
    generated_at: generatedAt,
    source_cohort_plan_generated_at: cohortPlan.generated_at,
    packages,
  };
  const errors = validateReviewPrPackageSetV1(output, cohortPlan, artifactCatalog);
  if (errors.length) throw new Error(`Review PR package invalid: ${errors.join('; ')}`);
  return output;
}

function exactKeys(value, keys) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && keys.every((key) => Object.hasOwn(value, key))
    && Object.keys(value).every((key) => keys.includes(key));
}

export function validateReviewPrPackageSetV1(output, cohortPlan, artifactCatalog) {
  const errors = [];
  if (!exactKeys(output, ['schema_version', 'generated_at', 'source_cohort_plan_generated_at', 'packages'])) return ['review PR package set fields differ'];
  if (output.schema_version !== 'calendar-review-pr-package-v1') errors.push('schema_version differs');
  if (!validDateTime(output.generated_at)) errors.push('generated_at invalid');
  if (output.source_cohort_plan_generated_at !== cohortPlan?.generated_at) errors.push('source cohort plan timestamp differs');
  if (!Array.isArray(output.packages)) return [...errors, 'packages must be an array'];
  if (output.packages.length !== (cohortPlan?.cohorts?.length ?? -1)) errors.push('package count must equal cohort count');

  const cohortById = new Map((cohortPlan?.cohorts ?? []).map((cohort) => [cohort.cohort_id, cohort]));
  const artifactsByBatchId = new Map((artifactCatalog?.batches ?? []).map((artifact) => [artifact.batch_id, artifact]));
  const seen = new Set();
  for (const [index, pkg] of output.packages.entries()) {
    const location = `packages[${index}]`;
    if (!exactKeys(pkg, PACKAGE_KEYS)) {
      errors.push(`${location} fields differ`);
      continue;
    }
    if (seen.has(pkg.cohort_id)) errors.push(`duplicate cohort package ${pkg.cohort_id}`);
    seen.add(pkg.cohort_id);
    const cohort = cohortById.get(pkg.cohort_id);
    if (!cohort) {
      errors.push(`${location} unknown cohort_id`);
      continue;
    }
    for (const key of ['system_id', 'cohort_kind', 'public_display_risk', 'promotion_dependency', 'rank_counts']) {
      if (!exact(pkg[key], cohort[key])) errors.push(`${location}.${key} differs from cohort`);
    }
    const diff = pkg.candidate_diff_summary;
    if (diff.candidate_count !== diff.new_count + diff.upgrade_count + diff.unchanged_count + diff.lower_observation_count) errors.push(`${location} candidate diff counts do not close`);
    if (diff.candidate_count !== rankTotal(cohort.rank_counts)) errors.push(`${location} candidate count differs from cohort rank total`);
    if (pkg.coverage_summary.batch_count !== cohort.batch_count
      || pkg.coverage_summary.unresolved_dates_count !== cohort.unresolved_dates_count
      || pkg.coverage_summary.unresolved_meeting_ids_count !== cohort.unresolved_meeting_ids_count
      || pkg.coverage_summary.source_error_count !== cohort.source_error_count) {
      errors.push(`${location} coverage summary differs from cohort`);
    }
    const claimTotal = CLAIMS.reduce((sum, claim) => sum + pkg.coverage_summary.claim_counts[claim], 0);
    if (claimTotal !== cohort.batch_count) errors.push(`${location} coverage claim counts do not close`);
    if (pkg.retry_summary.matched_retry_count !== pkg.retry_summary.due_now_count + pkg.retry_summary.deferred_count) errors.push(`${location} retry counts do not close`);
    if (!Array.isArray(pkg.batch_artifacts) || pkg.batch_artifacts.length !== cohort.batch_count) errors.push(`${location} batch artifact count differs`);
    else {
      const expectedBatchIds = cohort.batches.map((batch) => batch.batch_id);
      const actualBatchIds = pkg.batch_artifacts.map((batch) => batch.batch_id);
      if (!exact(actualBatchIds, expectedBatchIds)) errors.push(`${location} batch artifact order differs`);
      for (const batch of pkg.batch_artifacts) {
        const catalog = artifactsByBatchId.get(batch.batch_id);
        if (!catalog) errors.push(`${location} artifact catalog missing ${batch.batch_id}`);
        else {
          const expected = {
            batch_id: catalog.batch_id,
            manifest_ref: catalog.manifest_ref,
            candidate_ref: catalog.candidate_ref,
            coverage_observation_ref: catalog.coverage_observation_ref,
            collection_report_ref: catalog.collection_report_ref,
          };
          if (!exact(batch, expected)) errors.push(`${location} batch artifact differs for ${batch.batch_id}`);
        }
      }
    }
    if (!Array.isArray(pkg.checklist) || pkg.checklist.length < 5 || new Set(pkg.checklist).size !== pkg.checklist.length) errors.push(`${location} checklist invalid`);
    if (pkg.proposed_pr.labels?.length !== 1 || pkg.proposed_pr.labels[0] !== 'human review required') errors.push(`${location} human review label differs`);
    if (pkg.proposed_pr.review_state !== 'pending_human_review') errors.push(`${location} review state differs`);
    if (!pkg.proposed_pr.body_markdown?.includes('**human review required**')) errors.push(`${location} PR body lacks human review boundary`);
    if (!exact(pkg.boundaries, BOUNDARIES)) errors.push(`${location} side-effect boundaries differ`);
  }
  return errors;
}

export const reviewPrPreparationV1Contract = Object.freeze({
  ranks: RANKS,
  coverage_claims: CLAIMS,
  package_keys: PACKAGE_KEYS,
  boundaries: BOUNDARIES,
});
