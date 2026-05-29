export type CandidateExtractionMethod =
  | 'manual_seed'
  | 'adapter_dry_run'
  | 'adapter_candidate'
  | 'season_gap';

export type CandidateReviewStatus = 'needs_review' | 'approved' | 'rejected';

export type CandidateStatus = 'candidate' | 'source-reviewed' | 'rejected' | 'promoted';

export type SafeSourceAdapterMode = 'probe' | 'dry_run' | 'candidate';

export type SourceAdapterSafetyPolicy = {
  readonly storeSourceBody: false;
  readonly storeRawMarkup: false;
  readonly publishWithoutReview: false;
  readonly allowedOutput: 'meeting_level_only';
};

export type SourceAdapterInput = {
  readonly adapterId: string;
  readonly countryId: string;
  readonly sourceId: string;
  readonly sourceUrl: string;
  readonly window: {
    readonly startDate: string;
    readonly endDateExclusive: string;
    readonly timezone: string;
  };
  readonly mode: SafeSourceAdapterMode;
};

export type TimetableCandidateRecord = {
  readonly candidate_id: string;
  readonly country_id: string;
  readonly racing_system_id: string;
  readonly racecourse_id: string;
  readonly racecourse_name: string;
  readonly date: string;
  readonly start_time_local: string;
  readonly timezone: string;
  readonly racing_type: string;
  readonly source_id: string;
  readonly source_url: string;
  readonly source_checked_at: string;
  readonly extraction_method: CandidateExtractionMethod;
  readonly status: CandidateStatus;
  readonly confidence: 'low' | 'medium' | 'high';
  readonly review_status: CandidateReviewStatus;
  readonly notes: string;
};

export type TimetableCandidateFile = {
  readonly schema_version: 'timetable-candidates-v0';
  readonly generated_at: string;
  readonly source_adapter_id: string;
  readonly country_id: string;
  readonly candidate_window: {
    readonly start_date: string;
    readonly end_date_exclusive: string;
    readonly timezone: string;
  };
  readonly records: readonly TimetableCandidateRecord[];
  readonly review: {
    readonly review_status: CandidateReviewStatus;
    readonly reviewed_at: string | null;
    readonly reviewer: string | null;
    readonly summary: string;
    readonly promotion_target: string | null;
  };
};

export type SafeSourceAdapterResult = {
  readonly adapterId: string;
  readonly generatedAt: string;
  readonly candidateFile: TimetableCandidateFile;
  readonly warnings: readonly string[];
};

export interface SafeSourceAdapter {
  readonly adapterId: string;
  readonly countryId: string;
  readonly sourceIds: readonly string[];
  readonly safetyPolicy: SourceAdapterSafetyPolicy;
  generateCandidates(input: SourceAdapterInput): Promise<SafeSourceAdapterResult>;
}

export const defaultSafeSourceAdapterSafetyPolicy: SourceAdapterSafetyPolicy = {
  storeSourceBody: false,
  storeRawMarkup: false,
  publishWithoutReview: false,
  allowedOutput: 'meeting_level_only'
} as const;
