const RANKS = ['C', 'B', 'B+', 'A', 'A+'];

export const PUBLIC_COVERAGE_STATUSES = [
  'meeting_only',
  'first_time_only',
  'first_last_times',
  'race_times',
  'programme_summary',
];

export const PUBLIC_GAP_STATUSES = [
  'evidence_projection_aligned',
  'public_structure_fallback',
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
  effective_public_rank,
}) {
  const capabilityIndex = rankIndex(capability_rank, 'capability_rank');
  const effectiveIndex = rankIndex(effective_public_rank, 'effective_public_rank');

  return {
    coverage_status: coverageByRank[effective_public_rank],
    public_gap_status: effectiveIndex < capabilityIndex
      ? 'public_structure_fallback'
      : 'evidence_projection_aligned',
  };
}
