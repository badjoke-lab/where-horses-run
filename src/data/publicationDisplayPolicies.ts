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

const visibleAPlusFields: APlusFieldVisibility = {
  show_race_name: true,
  show_distance: true,
  show_surface: true,
  show_course: true,
};

const hiddenAPlusFields: APlusFieldVisibility = {
  show_race_name: false,
  show_distance: false,
  show_surface: false,
  show_course: false,
};

/**
 * Unknown or not-yet-reviewed source families stay at meeting-level C.
 * Reviewed source families are explicitly listed below and may publish up to A+.
 */
export const defaultPublicationDisplayPolicy: PublicationDisplayPolicy = {
  id: 'default-conservative-c',
  priority: 0,
  match: {},
  max_public_rank: 'C',
  include_in_public_list: true,
  a_plus_fields: hiddenAPlusFields,
  show_live_label: false,
  show_replay_label: false,
  notes: 'Unknown or unreviewed source families remain limited to meeting-level C until an explicit reviewed policy is added.',
};

/**
 * Initial testing policy:
 * - when canonical capability is A+, effective public rank may also be A+;
 * - A+ programme fields are visible on meeting detail pages;
 * - lower capability records remain at their actual lower rank;
 * - changing max_public_rank or individual A+ field flags later tests downgrade/switch behavior without changing canonical data.
 */
export const publicationDisplayPolicies: readonly PublicationDisplayPolicy[] = [
  {
    id: 'hkjc-reviewed-a-plus',
    priority: 500,
    match: { authority_ids: ['hkjc'] },
    max_public_rank: 'A+',
    include_in_public_list: true,
    a_plus_fields: visibleAPlusFields,
    show_live_label: false,
    show_replay_label: false,
    notes: 'HKJC A+ capability is initially published as A+ to test programme-summary display and later policy switching.',
  },
  {
    id: 'jra-reviewed-a-plus',
    priority: 500,
    match: { authority_ids: ['jra'] },
    max_public_rank: 'A+',
    include_in_public_list: true,
    a_plus_fields: visibleAPlusFields,
    show_live_label: false,
    show_replay_label: false,
    notes: 'JRA may publish up to A+ when A+ canonical data becomes available; current lower-capability records remain lower automatically.',
  },
  {
    id: 'nar-reviewed-a-plus',
    priority: 400,
    match: { authority_ids: ['nar-local-government-racing'] },
    max_public_rank: 'A+',
    include_in_public_list: true,
    a_plus_fields: visibleAPlusFields,
    show_live_label: false,
    show_replay_label: false,
    notes: 'NAR may publish up to A+ when the acquisition path stores valid A+ data; current B/B+ or C records remain unchanged.',
  },
  {
    id: 'banei-reviewed-a-plus',
    priority: 400,
    match: { authority_ids: ['banei-tokachi'] },
    max_public_rank: 'A+',
    include_in_public_list: true,
    a_plus_fields: visibleAPlusFields,
    show_live_label: false,
    show_replay_label: false,
    notes: 'Banei may publish up to A+ for display and switching tests; Banei-specific field semantics can be refined later.',
  },
  {
    id: 'uae-reviewed-a-plus',
    priority: 400,
    match: { authority_ids: ['emirates-racing-authority'] },
    max_public_rank: 'A+',
    include_in_public_list: true,
    a_plus_fields: visibleAPlusFields,
    show_live_label: false,
    show_replay_label: false,
    notes: 'UAE may publish up to A+ when A+ canonical data becomes available; current C records remain C.',
  },
];
