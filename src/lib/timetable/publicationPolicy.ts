import type { CapabilityRank } from './canonicalTypes.ts';
import {
  defaultPublicationDisplayPolicy,
  publicationDisplayPolicies,
  type PublicationDisplayPolicy,
} from '../../data/publicationDisplayPolicies.ts';

export type PublicationContext = {
  country_id: string;
  authority_id: string;
  source_id: string;
};

export type PublicationDecision = {
  policy_id: string;
  capability_rank: CapabilityRank;
  max_public_rank: CapabilityRank;
  effective_public_rank: CapabilityRank;
  include_in_public_list: boolean;
  show_race_name: boolean;
  show_distance: boolean;
  show_surface: boolean;
  show_course: boolean;
  show_live_label: boolean;
  show_replay_label: boolean;
};

const ranks: CapabilityRank[] = [
  'not_listed',
  'D',
  'C',
  'B',
  'B+',
  'A',
  'A+',
];

export function lowerRank(
  capabilityRank: CapabilityRank,
  maxPublicRank: CapabilityRank,
): CapabilityRank {
  return ranks.indexOf(capabilityRank) <= ranks.indexOf(maxPublicRank)
    ? capabilityRank
    : maxPublicRank;
}

function includesOrAny(value: string, values?: readonly string[]): boolean {
  return !values || values.length === 0 || values.includes(value);
}

export function matchesPublicationPolicy(
  policy: PublicationDisplayPolicy,
  context: PublicationContext,
): boolean {
  return (
    includesOrAny(context.country_id, policy.match.country_ids) &&
    includesOrAny(context.authority_id, policy.match.authority_ids) &&
    includesOrAny(context.source_id, policy.match.source_ids)
  );
}

export function findPublicationPolicy(
  context: PublicationContext,
  policies: readonly PublicationDisplayPolicy[] = publicationDisplayPolicies,
): PublicationDisplayPolicy {
  const matches = policies
    .filter((policy) => matchesPublicationPolicy(policy, context))
    .sort((a, b) => b.priority - a.priority);

  return matches[0] ?? defaultPublicationDisplayPolicy;
}

export function resolvePublicationDecision(
  capabilityRank: CapabilityRank,
  context: PublicationContext,
  policies: readonly PublicationDisplayPolicy[] = publicationDisplayPolicies,
): PublicationDecision {
  const policy = findPublicationPolicy(context, policies);
  const effectiveRank = lowerRank(capabilityRank, policy.max_public_rank);
  const showAPlus = effectiveRank === 'A+';

  return {
    policy_id: policy.id,
    capability_rank: capabilityRank,
    max_public_rank: policy.max_public_rank,
    effective_public_rank: effectiveRank,
    include_in_public_list:
      policy.include_in_public_list &&
      effectiveRank !== 'not_listed' &&
      effectiveRank !== 'D',
    show_race_name: showAPlus && policy.a_plus_fields.show_race_name,
    show_distance: showAPlus && policy.a_plus_fields.show_distance,
    show_surface: showAPlus && policy.a_plus_fields.show_surface,
    show_course: showAPlus && policy.a_plus_fields.show_course,
    show_live_label: policy.show_live_label,
    show_replay_label: policy.show_replay_label,
  };
}
