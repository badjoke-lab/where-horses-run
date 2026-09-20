import meetingListData from '../../../data/generated/timetable/public/meeting-list.json';
import meetingDetailsData from '../../../data/generated/timetable/public/meeting-details.json';
import type { CapabilityRank } from './canonicalTypes.ts';

export type PublicTimetableMeetingRow = {
  readonly meeting_id: string;
  readonly country_id: string;
  readonly authority_id: string;
  readonly racecourse_id: string;
  readonly date: string;
  readonly timezone: string;
  readonly capability_rank: CapabilityRank;
  readonly max_public_rank: CapabilityRank;
  readonly effective_public_rank: CapabilityRank;
  readonly first_race_time_local: string | null;
  readonly last_race_time_local: string | null;
  readonly policy_id: string;
  readonly source_status: string;
  readonly official_source_url: string;
  readonly last_checked_date: string;
  readonly detail_path: string | null;
  readonly show_live_label: boolean;
  readonly show_replay_label: boolean;
};

export type PublicTimetableDetailRow = {
  readonly label: string;
  readonly post_time_local: string;
  readonly race_name?: string;
  readonly distance_m?: number;
  readonly surface?: string;
  readonly course_label?: string;
};

export type PublicTimetableMeetingDetail = {
  readonly meeting_id: string;
  readonly country_id: string;
  readonly authority_id: string;
  readonly racecourse_id: string;
  readonly date: string;
  readonly timezone: string;
  readonly capability_rank: CapabilityRank;
  readonly max_public_rank: CapabilityRank;
  readonly effective_public_rank: Extract<CapabilityRank, 'A' | 'A+'>;
  readonly policy_id: string;
  readonly official_source_url: string;
  readonly source_status: string;
  readonly last_checked_date: string;
  readonly show_race_name: boolean;
  readonly show_distance: boolean;
  readonly show_surface: boolean;
  readonly show_course: boolean;
  readonly show_live_label: boolean;
  readonly show_replay_label: boolean;
  readonly timetable_rows: readonly PublicTimetableDetailRow[];
};

type PublicationSnapshot = {
  readonly schema_version: 'calendar-publication-snapshot-v1';
  readonly snapshot_id: string;
  readonly generated_at: string;
};

type PublicMeetingListDataset = {
  readonly schema_version: 'public-timetable-meeting-list-v0';
  readonly generated_at: string;
  readonly publication_snapshot: PublicationSnapshot;
  readonly meetings: readonly PublicTimetableMeetingRow[];
};

type PublicMeetingDetailsDataset = {
  readonly schema_version: 'public-timetable-meeting-details-v0';
  readonly generated_at: string;
  readonly publication_snapshot: PublicationSnapshot;
  readonly details: readonly PublicTimetableMeetingDetail[];
};

const meetingListDataset = meetingListData as PublicMeetingListDataset;
const meetingDetailsDataset = meetingDetailsData as PublicMeetingDetailsDataset;

if (meetingListDataset.schema_version !== 'public-timetable-meeting-list-v0') {
  throw new Error(`Unsupported public meeting-list schema: ${meetingListDataset.schema_version}`);
}
if (meetingDetailsDataset.schema_version !== 'public-timetable-meeting-details-v0') {
  throw new Error(`Unsupported public meeting-details schema: ${meetingDetailsDataset.schema_version}`);
}
if (
  !meetingListDataset.publication_snapshot
  || !meetingDetailsDataset.publication_snapshot
  || meetingListDataset.publication_snapshot.snapshot_id !== meetingDetailsDataset.publication_snapshot.snapshot_id
) {
  throw new Error('Public timetable list/detail snapshot mismatch.');
}

const publicMeetingRows: readonly PublicTimetableMeetingRow[] = meetingListDataset.meetings;
const publicMeetingDetails: readonly PublicTimetableMeetingDetail[] = meetingDetailsDataset.details;

export function getPublicTimetableGeneratedAt(): string {
  return meetingListDataset.generated_at;
}

export function getPublicTimetableSnapshotId(): string {
  return meetingListDataset.publication_snapshot.snapshot_id;
}

export function getPublicTimetableMeetingRows(): readonly PublicTimetableMeetingRow[] {
  return publicMeetingRows;
}

export function getPublicTimetableMeetingRowsByCountry(
  countryId: string,
): readonly PublicTimetableMeetingRow[] {
  return publicMeetingRows.filter((meeting) => meeting.country_id === countryId);
}

export function getPublicTimetableMeetingRowsByRacecourse(
  racecourseId: string,
): readonly PublicTimetableMeetingRow[] {
  return publicMeetingRows.filter((meeting) => meeting.racecourse_id === racecourseId);
}

export function getPublicTimetableMeetingDetail(
  meetingId: string,
): PublicTimetableMeetingDetail | undefined {
  return publicMeetingDetails.find((detail) => detail.meeting_id === meetingId);
}

export function getPublicTimetableMeetingDetails(): readonly PublicTimetableMeetingDetail[] {
  return publicMeetingDetails;
}
