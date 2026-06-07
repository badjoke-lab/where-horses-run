export type CapabilityRank = 'not_listed' | 'D' | 'C' | 'B' | 'B+' | 'A' | 'A+';

export type SourceStatus = 'unknown' | 'partial' | 'verified' | 'stale' | 'unavailable';

export type DisplayStatus = 'hidden' | 'partial' | 'displayable' | 'legacy' | 'sample';

export type Freshness = {
  readonly last_checked_date: string;
  readonly generated_at?: string | null;
  readonly stale_after_date?: string | null;
  readonly freshness_note?: string | null;
};

export type SourceTrace = {
  readonly source_id: string;
  readonly route_id?: string | null;
  readonly source_status: SourceStatus;
  readonly official_source_url: string;
  readonly source_label?: string | null;
  readonly extraction_method?: 'manual_seed' | 'manual_review' | 'snapshot' | 'normalizer' | 'adapter' | 'legacy_import' | null;
  readonly source_snapshot_path?: string | null;
  readonly normalized_from_path?: string | null;
};

export type CanonicalMeeting = {
  readonly meeting_id: string;
  readonly country_id: string;
  readonly authority_id: string;
  readonly racecourse_id: string;
  readonly date: string;
  readonly timezone: string;
  readonly capability_rank: CapabilityRank;
  readonly display_status: DisplayStatus;
  readonly first_race_time_local?: string | null;
  readonly last_race_time_local?: string | null;
  readonly source_trace: SourceTrace;
  readonly freshness: Freshness;
  readonly notes?: string | null;
};

export type CanonicalRaceTimetableRow = {
  readonly label: string;
  readonly post_time_local: string;
  readonly race_name?: string | null;
  readonly distance_m?: number | null;
  readonly surface?: string | null;
  readonly course_label?: string | null;
  readonly metadata_status?: 'verified' | 'partial' | 'pending' | null;
  readonly source_label?: string | null;
};

export type CanonicalMeetingDetail = {
  readonly meeting_id: string;
  readonly country_id: string;
  readonly authority_id: string;
  readonly racecourse_id: string;
  readonly date: string;
  readonly timezone: string;
  readonly capability_rank: Extract<CapabilityRank, 'A' | 'A+'>;
  readonly source_trace: SourceTrace;
  readonly freshness: Freshness;
  readonly timetable_rows: readonly CanonicalRaceTimetableRow[];
  readonly summary_note?: string | null;
};

export type MeetingSummaryRecord = Pick<
  CanonicalMeeting,
  | 'meeting_id'
  | 'country_id'
  | 'authority_id'
  | 'racecourse_id'
  | 'date'
  | 'timezone'
  | 'capability_rank'
  | 'display_status'
  | 'first_race_time_local'
  | 'last_race_time_local'
  | 'source_trace'
  | 'freshness'
>;

export type MeetingDetailRecord = CanonicalMeetingDetail;

export type CanonicalTimetableDataset = {
  readonly schema_version: 'canonical-timetable-v0';
  readonly generated_at: string;
  readonly meetings: readonly CanonicalMeeting[];
};

export type CanonicalMeetingDetailDataset = {
  readonly schema_version: 'canonical-meeting-details-v0';
  readonly generated_at: string;
  readonly details: readonly CanonicalMeetingDetail[];
};
