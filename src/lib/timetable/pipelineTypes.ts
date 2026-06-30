export type PipelineCapabilityRank = 'C' | 'B' | 'B+' | 'A' | 'A+';
export type PipelineReviewStatus = 'needs_review' | 'approved' | 'rejected';
export type PipelineConfidence = 'low' | 'medium' | 'high';
export type PipelinePromotionTarget = 'canonical-timetable-v0';
export type PipelineExtractionMethod =
  | 'manual_import'
  | 'fixture_parser'
  | 'adapter_candidate'
  | 'reviewed_snapshot';

export type TimetableCandidateWindowV1 = {
  readonly start_date: string;
  readonly end_date_exclusive: string;
  readonly timezone: string;
};

export type TimetableCandidateSourceV1 = {
  readonly source_id: string;
  readonly official_url: string;
  readonly checked_at: string;
  readonly extraction_method: PipelineExtractionMethod;
};

export type TimetableCandidateRowV1 = {
  readonly label: string;
  readonly post_time_local: string;
  readonly race_name?: string | null;
  readonly distance_m?: number | null;
  readonly surface?: string | null;
  readonly course_label?: string | null;
};

export type TimetableCandidateRecordV1 = {
  readonly candidate_id: string;
  readonly meeting_id: string;
  readonly country_id: string;
  readonly authority_id: string;
  readonly racing_system_id: string;
  readonly racecourse_id: string;
  readonly date: string;
  readonly timezone: string;
  readonly capability_rank: PipelineCapabilityRank;
  readonly first_race_time_local: string | null;
  readonly last_race_time_local: string | null;
  readonly timetable_rows: readonly TimetableCandidateRowV1[];
  readonly source: TimetableCandidateSourceV1;
  readonly confidence: PipelineConfidence;
  readonly review_status: PipelineReviewStatus;
  readonly notes: string;
};

export type TimetableCandidateReviewV1 = {
  readonly status: PipelineReviewStatus;
  readonly reviewed_at: string | null;
  readonly reviewer: string | null;
  readonly summary: string;
  readonly promotion_target: PipelinePromotionTarget | null;
};

export type TimetableCandidateFileV1 = {
  readonly schema_version: 'timetable-candidate-v1';
  readonly generated_at: string;
  readonly adapter_id: string;
  readonly country_id: string;
  readonly authority_id: string;
  readonly source_id: string;
  readonly candidate_window: TimetableCandidateWindowV1;
  readonly records: readonly TimetableCandidateRecordV1[];
  readonly review: TimetableCandidateReviewV1;
};

export type TimetableCandidateSafetyPolicyV1 = {
  readonly store_source_body: false;
  readonly store_raw_markup: false;
  readonly publish_without_review: false;
  readonly allowed_output: 'meeting_and_timetable_summary_only';
};

export const timetableCandidateSafetyPolicyV1: TimetableCandidateSafetyPolicyV1 = {
  store_source_body: false,
  store_raw_markup: false,
  publish_without_review: false,
  allowed_output: 'meeting_and_timetable_summary_only'
} as const;
