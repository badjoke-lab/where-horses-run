const RANKS = ['C', 'B', 'B+', 'A', 'A+'];

export const PUBLIC_COVERAGE_STATUSES = [
  'meeting_only',
  'first_time_only',
  'first_last_times',
  'race_times',
  'programme_summary',
];

export const PUBLIC_GAP_STATUSES = [
  'more_detail_not_reviewed',
  'publication_ceiling_applied',
  'at_current_public_ceiling',
];

const coverageByRank = {
  C: 'meeting_only',
  B: 'first_time_only',
  'B+': 'first_last_times',
  A: 'race_times',
  'A+': 'programme_summary',
};

function rankIndex(rank, label) {
  const index = RANKS.indexOf(rank);
  if (index < 0) throw new Error(`${label} has unsupported public rank ${rank}`);
  return index;
}

export function derivePublicCoverageState({
  capability_rank,
  max_public_rank,
  effective_public_rank,
}) {
  const capabilityIndex = rankIndex(capability_rank, 'capability_rank');
  const maximumIndex = rankIndex(max_public_rank, 'max_public_rank');
  const effectiveIndex = rankIndex(effective_public_rank, 'effective_public_rank');

  if (effectiveIndex > maximumIndex) {
    throw new Error(`effective_public_rank ${effective_public_rank} exceeds max_public_rank ${max_public_rank}`);
  }

  let public_gap_status = 'at_current_public_ceiling';
  if (capabilityIndex > effectiveIndex && effectiveIndex === maximumIndex) {
    public_gap_status = 'publication_ceiling_applied';
  } else if (effectiveIndex < maximumIndex) {
    public_gap_status = 'more_detail_not_reviewed';
  }

  return {
    coverage_status: coverageByRank[effective_public_rank],
    public_gap_status,
  };
}
