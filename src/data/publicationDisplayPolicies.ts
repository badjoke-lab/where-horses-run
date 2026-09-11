import policyData from './publicationDisplayPolicies.json';

export type DetailFieldVisibility = {
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
  readonly include_in_public_list: boolean;
  readonly detail_fields: DetailFieldVisibility;
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
