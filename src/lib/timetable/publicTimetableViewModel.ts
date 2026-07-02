import meetingListData from '../../../data/generated/timetable/public/meeting-list.json';
import meetingDetailsData from '../../../data/generated/timetable/public/meeting-details.json';
import japanAPlusOverridesData from '../../../data/generated/timetable/public/japan-a-plus-overrides.json';
import jraCurrentMonthData from '../../../data/generated/timetable/public/jra-current-month.json';
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

type PublicMeetingListDataset = {
  readonly schema_version: 'public-timetable-meeting-list-v0';
  readonly generated_at: string;
  readonly meetings: readonly PublicTimetableMeetingRow[];
};

type PublicMeetingDetailsDataset = {
  readonly schema_version: 'public-timetable-meeting-details-v0';
  readonly generated_at: string;
  readonly details: readonly PublicTimetableMeetingDetail[];
};

type JapanMeetingOverride = Pick<
  PublicTimetableMeetingRow,
  'meeting_id' | 'max_public_rank' | 'effective_public_rank'
>;

type JapanDetailOverride = Pick<
  PublicTimetableMeetingDetail,
  | 'meeting_id'
  | 'max_public_rank'
  | 'effective_public_rank'
  | 'show_race_name'
  | 'show_distance'
  | 'show_surface'
  | 'show_course'
  | 'timetable_rows'
>;

type JapanAPlusPublicOverrides = {
  readonly schema_version: 'japan-a-plus-public-overrides-v1';
  readonly generated_at: string;
  readonly meeting_overrides: readonly JapanMeetingOverride[];
  readonly detail_overrides: readonly JapanDetailOverride[];
};

type JraCurrentMonthPublicDataset = {
  readonly schema_version: 'jra-current-month-public-v1';
  readonly status: 'awaiting_first_fetch' | 'fetched_official_programme';
  readonly month: string;
  readonly generated_at: string;
  readonly source_notice: string;
  readonly source_pages: readonly string[];
  readonly meetings: readonly PublicTimetableMeetingRow[];
  readonly details: readonly PublicTimetableMeetingDetail[];
};

const meetingListDataset = meetingListData as PublicMeetingListDataset;
const meetingDetailsDataset = meetingDetailsData as PublicMeetingDetailsDataset;
const japanAPlusOverrides = japanAPlusOverridesData as JapanAPlusPublicOverrides;
const jraCurrentMonthDataset = jraCurrentMonthData as JraCurrentMonthPublicDataset;

if (
  japanAPlusOverrides.generated_at !== meetingListDataset.generated_at ||
  japanAPlusOverrides.generated_at !== meetingDetailsDataset.generated_at
) {
  throw new Error('Japan A+ public overrides do not match the public timetable generation timestamp.');
}

const meetingOverrideIndex = new Map(
  japanAPlusOverrides.meeting_overrides.map((override) => [override.meeting_id, override]),
);
const detailOverrideIndex = new Map(
  japanAPlusOverrides.detail_overrides.map((override) => [override.meeting_id, override]),
);

const historicalMeetingRows = meetingListDataset.meetings.map((meeting) => {
  const override = meetingOverrideIndex.get(meeting.meeting_id);
  return override ? { ...meeting, ...override } : meeting;
});
const historicalMeetingDetails = meetingDetailsDataset.details.map((detail) => {
  const override = detailOverrideIndex.get(detail.meeting_id);
  return override ? { ...detail, ...override } : detail;
});

function mergeByMeetingId<T extends { readonly meeting_id: string }>(
  historical: readonly T[],
  current: readonly T[],
): readonly T[] {
  const index = new Map(historical.map((record) => [record.meeting_id, record]));
  for (const record of current) index.set(record.meeting_id, record);
  return [...index.values()].sort((left, right) => left.meeting_id.localeCompare(right.meeting_id));
}

const publicMeetingRows = mergeByMeetingId(
  historicalMeetingRows,
  jraCurrentMonthDataset.meetings,
).sort((left, right) => `${left.date}:${left.racecourse_id}`.localeCompare(`${right.date}:${right.racecourse_id}`));

const publicMeetingDetails = mergeByMeetingId(
  historicalMeetingDetails,
  jraCurrentMonthDataset.details,
).sort((left, right) => `${left.date}:${left.racecourse_id}`.localeCompare(`${right.date}:${right.racecourse_id}`));

export function getPublicTimetableGeneratedAt(): string {
  return [meetingListDataset.generated_at, jraCurrentMonthDataset.generated_at].sort().at(-1) ?? meetingListDataset.generated_at;
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
