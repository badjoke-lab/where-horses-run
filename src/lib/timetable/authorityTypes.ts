export type CalendarAcquisitionAttemptStatus =
  | 'success'
  | 'source_error'
  | 'network_error'
  | 'parser_failure'
  | 'pending_publication'
  | 'implementation_gap'
  | 'not_applicable';

export type CalendarAcquisitionAttemptV1 = {
  readonly attempted_at: string;
  readonly status: CalendarAcquisitionAttemptStatus;
  readonly source_id?: string | null;
  readonly route_id?: string | null;
  readonly error_code?: string | null;
};

export type CalendarAcquisitionDisposition =
  | 'promoted'
  | 'complete_current_best_available'
  | 'pending_publication'
  | 'retry_required'
  | 'implementation_gap'
  | 'not_applicable';

export type CalendarAcquisitionCompletionV1 = {
  readonly disposition: CalendarAcquisitionDisposition;
  readonly observed_rank: 'C' | 'B' | 'B+' | 'A' | 'A+';
  readonly technical_capability_rank: 'C' | 'B' | 'B+' | 'A' | 'A+';
  readonly evaluated_capability_rank?: 'C' | 'B' | 'B+' | 'A' | 'A+';
  readonly higher_rank_open: boolean;
  readonly reason: string;
};

export type CalendarReviewProvenanceV1 = {
  readonly reviewed_at: string;
  readonly reviewer: string;
  readonly evidence_reference?: string | null;
};

export type CalendarEvidenceProvenanceV1 = {
  readonly source_id: string;
  readonly official_source_url: string | null;
  readonly observed_at: string | null;
  readonly successfully_verified_at: string | null;
  readonly acquisition_method: 'automatic' | 'reviewed';
  readonly review?: CalendarReviewProvenanceV1;
};

export type CalendarRaceEvidenceSupportV1 = {
  readonly race_times?: CalendarEvidenceProvenanceV1;
  readonly race_names?: CalendarEvidenceProvenanceV1;
  readonly distances?: CalendarEvidenceProvenanceV1;
  readonly surfaces?: CalendarEvidenceProvenanceV1;
  readonly courses?: CalendarEvidenceProvenanceV1;
};

export type CalendarEvidenceSupportV1 = {
  readonly meeting_identity?: CalendarEvidenceProvenanceV1;
  readonly meeting_date?: CalendarEvidenceProvenanceV1;
  readonly race_times?: CalendarEvidenceProvenanceV1;
  readonly timetable?: CalendarEvidenceProvenanceV1;
  readonly race_names?: CalendarEvidenceProvenanceV1;
  readonly distances?: CalendarEvidenceProvenanceV1;
  readonly surfaces?: CalendarEvidenceProvenanceV1;
  readonly courses?: CalendarEvidenceProvenanceV1;
  readonly race_overrides?: Readonly<Record<string, CalendarRaceEvidenceSupportV1>>;
};

export type CalendarEvidenceChangeTargetV1 = {
  readonly meeting_id: string;
  readonly scope: 'meeting' | 'detail' | 'field';
  readonly field?:
    | 'meeting_identity'
    | 'meeting_date'
    | 'race_time'
    | 'race_name'
    | 'distance'
    | 'surface'
    | 'course';
  readonly race_label?: string | null;
};

export type CalendarEvidenceChangeV1 = {
  readonly target: CalendarEvidenceChangeTargetV1;
  readonly action: 'correct' | 'withdraw' | 'invalidate';
  readonly reason_type:
    | 'official_correction'
    | 'official_retraction'
    | 'parser_error'
    | 'reviewed_correction'
    | 'other';
  readonly reason: string;
  readonly evidence: CalendarEvidenceProvenanceV1;
};

export type CalendarAuthorityMetadataV1 = {
  readonly acquisition_attempt?: CalendarAcquisitionAttemptV1;
  readonly acquisition_completion?: CalendarAcquisitionCompletionV1;
  readonly evidence_support?: CalendarEvidenceSupportV1;
  readonly evidence_changes?: readonly CalendarEvidenceChangeV1[];
};

export type CalendarPublicationSnapshotV1 = {
  readonly schema_version: 'calendar-publication-snapshot-v1';
  readonly snapshot_id: string;
  readonly generated_at: string;
};
