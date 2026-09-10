const RANKS = Object.freeze(['C', 'B', 'B+', 'A', 'A+']);
const RANK_INDEX = new Map(RANKS.map((rank, index) => [rank, index]));

export const ACQUISITION_COMPLETION_DISPOSITIONS = Object.freeze([
  'promoted',
  'complete_current_best_available',
  'pending_publication',
  'retry_required',
  'implementation_gap',
  'not_applicable',
]);

const PENDING_DETAIL_STATUSES = new Set([
  'not_published',
  'scheduled_pending_details',
  'details_pending',
]);

const RETRY_DETAIL_STATUSES = new Set([
  'source_error',
  'acquisition_failed',
  'conflict',
  'timeout',
  'unavailable',
  'invalid_json',
  'parser_failure',
  'network_error',
]);

const NOT_APPLICABLE_DETAIL_STATUSES = new Set([
  'not_applicable',
]);

function rankIndex(value) {
  return RANK_INDEX.get(value) ?? -1;
}

export function maxSupportedObservationRank(profile) {
  return (profile?.supported_observation_ranks ?? []).reduce((best, value) => (
    rankIndex(value) > rankIndex(best) ? value : best
  ), 'C');
}

export function routeImplementsTechnicalCapability(profile) {
  const technical = profile?.technical_capability_rank ?? 'C';
  return rankIndex(maxSupportedObservationRank(profile)) >= rankIndex(technical);
}

export function classifyAcquisitionCompletion(record, profile) {
  const observedRank = record?.capability_rank;
  if (!RANK_INDEX.has(observedRank)) {
    throw new Error(`invalid observed capability rank: ${observedRank}`);
  }

  const technicalRank = profile?.technical_capability_rank ?? observedRank;
  if (!RANK_INDEX.has(technicalRank)) {
    throw new Error(`invalid technical capability rank: ${technicalRank}`);
  }

  if (observedRank === 'A+' || rankIndex(observedRank) >= rankIndex(technicalRank)) {
    return {
      disposition: 'complete_current_best_available',
      observed_rank: observedRank,
      technical_capability_rank: technicalRank,
      higher_rank_open: false,
      reason: observedRank === 'A+'
        ? 'No higher timetable rank exists.'
        : 'Observed evidence reached the registered technical capability rank.',
    };
  }

  const detailStatus = record?.detail_observation?.status ?? null;

  if (PENDING_DETAIL_STATUSES.has(detailStatus)) {
    return {
      disposition: 'pending_publication',
      observed_rank: observedRank,
      technical_capability_rank: technicalRank,
      higher_rank_open: true,
      reason: `Higher-detail evidence is not yet published or not yet available (${detailStatus}).`,
    };
  }

  if (RETRY_DETAIL_STATUSES.has(detailStatus)) {
    return {
      disposition: 'retry_required',
      observed_rank: observedRank,
      technical_capability_rank: technicalRank,
      higher_rank_open: true,
      reason: `Higher-detail acquisition did not complete safely (${detailStatus}).`,
    };
  }

  if (NOT_APPLICABLE_DETAIL_STATUSES.has(detailStatus)) {
    return {
      disposition: 'not_applicable',
      observed_rank: observedRank,
      technical_capability_rank: technicalRank,
      higher_rank_open: false,
      reason: 'The registered higher-detail route was explicitly not applicable to this meeting.',
    };
  }

  if (detailStatus === 'available') {
    if (routeImplementsTechnicalCapability(profile)) {
      return {
        disposition: 'complete_current_best_available',
        observed_rank: observedRank,
        technical_capability_rank: technicalRank,
        higher_rank_open: false,
        reason: 'The implemented higher-detail route was evaluated and produced the current evidence-supported rank.',
      };
    }
    return {
      disposition: 'implementation_gap',
      observed_rank: observedRank,
      technical_capability_rank: technicalRank,
      higher_rank_open: true,
      reason: 'Detail was observed, but the implemented route cannot reach the registered technical capability rank.',
    };
  }

  return {
    disposition: 'implementation_gap',
    observed_rank: observedRank,
    technical_capability_rank: technicalRank,
    higher_rank_open: true,
    reason: detailStatus
      ? `No completion rule exists for detail status ${detailStatus}.`
      : 'A lower rank was produced without an explicit higher-detail evaluation result.',
  };
}

export function withAcquisitionCompletion(record, profile) {
  return {
    ...record,
    acquisition_completion: classifyAcquisitionCompletion(record, profile),
  };
}
