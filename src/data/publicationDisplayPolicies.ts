import policyData from './publicationDisplayPolicies.json';
import type { CapabilityRank } from '../lib/timetable/canonicalTypes.ts';

export type APlusFieldVisibility = {
  readonly show_race_name: boolean;
  readonly show_distance: boolean;
  readonly show_surface: boolean;
  readonly show_course: boolean;
};

export type PublicationPolicyMatch = {
  readonly country_ids?: readonly string[];
  readonly authority_ids?: readonly string[];
  readonly source_ids?: readonly string[];
};

export type PublicationDisplayPolicy = {
  readonly id: string;
  readonly priority: number;
  readonly match: PublicationPolicyMatch;
  readonly max_public_rank: CapabilityRank;
  readonly include_in_public_list: boolean;
  readonly a_plus_fields: APlusFieldVisibility;
  readonly show_live_label: boolean;
  readonly show_replay_label: boolean;
  readonly notes: string;
};

type PublicationPolicyData = {
  readonly schema_version: string;
  readonly default_policy: PublicationDisplayPolicy;
  readonly policies: readonly PublicationDisplayPolicy[];
};

const typedPolicyData = policyData as PublicationPolicyData;

export const defaultPublicationDisplayPolicy =
  typedPolicyData.default_policy;

export const publicationDisplayPolicies = typedPolicyData.policies;
