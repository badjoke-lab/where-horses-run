import meetingListData from '../../../data/generated/timetable/public/meeting-list.json';
import meetingDetailsData from '../../../data/generated/timetable/public/meeting-details.json';
import japanAPlusOverridesData from '../../../data/generated/timetable/public/japan-a-plus-overrides.json';
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

const meetingListDataset = meetingListData as PublicMeetingListDataset;
const meetingDetailsDataset = meetingDetailsData as PublicMeetingDetailsDataset;
const japanAPlusOverrides = japanAPlusOverridesData as JapanAPlusPublicOverrides;

const overrideSnapshotDate = japanAPlusOverrides.generated_at.slice(0, 10);
const canApplyReviewedOverride = (lastCheckedDate: string | undefined): boolean =>
  typeof lastCheckedDate === 'string' && lastCheckedDate <= overrideSnapshotDate;

const meetingOverrideIndex = new Map(
  japanAPlusOverrides.meeting_overrides.map((override) => [override.meeting_id, override]),
);
const detailOverrideIndex = new Map(
  japanAPlusOverrides.detail_overrides.map((override) => [override.meeting_id, override]),
);

const reviewedPublicSupplements: readonly PublicTimetableMeetingRow[] = [
  {
    meeting_id: 'hkjc-sha-tin-racecourse-2026-09-27',
    country_id: 'hong-kong',
    authority_id: 'hkjc',
    racecourse_id: 'sha-tin-racecourse',
    date: '2026-09-27',
    timezone: 'Asia/Hong_Kong',
    capability_rank: 'C',
    max_public_rank: 'C',
    effective_public_rank: 'C',
    first_race_time_local: null,
    last_race_time_local: null,
    policy_id: 'hkjc-reviewed-a-plus',
    source_status: 'verified',
    official_source_url: 'https://racing.hkjc.com/en-us/local/information/fixture?CalMonth=09&CalYear=2026',
    last_checked_date: '2026-09-03',
    detail_path: null,
    show_live_label: false,
    show_replay_label: false,
  },
  {
    meeting_id: 'kra-seoul-racecourse-2026-09-13',
    country_id: 'south-korea',
    authority_id: 'korea-racing-authority',
    racecourse_id: 'seoul-racecourse',
    date: '2026-09-13',
    timezone: 'Asia/Seoul',
    capability_rank: 'C',
    max_public_rank: 'C',
    effective_public_rank: 'C',
    first_race_time_local: null,
    last_race_time_local: null,
    policy_id: 'kra-reviewed-a',
    source_status: 'verified',
    official_source_url: 'https://race.kra.co.kr/chulmainfo/RegistStateList.do?meet=1',
    last_checked_date: '2026-09-03',
    detail_path: null,
    show_live_label: false,
    show_replay_label: false,
  },
  {
    meeting_id: 'kra-busan-gyeongnam-racecourse-2026-09-11',
    country_id: 'south-korea',
    authority_id: 'korea-racing-authority',
    racecourse_id: 'busan-gyeongnam-racecourse',
    date: '2026-09-11',
    timezone: 'Asia/Seoul',
    capability_rank: 'C',
    max_public_rank: 'C',
    effective_public_rank: 'C',
    first_race_time_local: null,
    last_race_time_local: null,
    policy_id: 'kra-reviewed-a',
    source_status: 'verified',
    official_source_url: 'https://race.kra.co.kr/chulmainfo/RegistStateList.do?meet=3',
    last_checked_date: '2026-09-03',
    detail_path: null,
    show_live_label: false,
    show_replay_label: false,
  },
  {
    meeting_id: 'kra-yeongcheon-racecourse-2026-09-13',
    country_id: 'south-korea',
    authority_id: 'korea-racing-authority',
    racecourse_id: 'yeongcheon-racecourse',
    date: '2026-09-13',
    timezone: 'Asia/Seoul',
    capability_rank: 'C',
    max_public_rank: 'C',
    effective_public_rank: 'C',
    first_race_time_local: null,
    last_race_time_local: null,
    policy_id: 'kra-reviewed-a',
    source_status: 'verified',
    official_source_url: 'https://race.kra.co.kr/chulmainfo/RegistStateList.do?meet=3',
    last_checked_date: '2026-09-03',
    detail_path: null,
    show_live_label: false,
    show_replay_label: false,
  },
];

const generatedPublicMeetingRows = meetingListDataset.meetings.map((meeting) => {
  const override = meetingOverrideIndex.get(meeting.meeting_id);
  return override && canApplyReviewedOverride(meeting.last_checked_date)
    ? { ...meeting, ...override }
    : meeting;
});

const generatedMeetingIds = new Set(generatedPublicMeetingRows.map((meeting) => meeting.meeting_id));

const publicMeetingRows: readonly PublicTimetableMeetingRow[] = [
  ...generatedPublicMeetingRows,
  ...reviewedPublicSupplements.filter((meeting) => !generatedMeetingIds.has(meeting.meeting_id)),
];

const publicMeetingDetails: readonly PublicTimetableMeetingDetail[] =
  meetingDetailsDataset.details.map((detail) => {
    const override = detailOverrideIndex.get(detail.meeting_id);
    return override && canApplyReviewedOverride(detail.last_checked_date)
      ? { ...detail, ...override }
      : detail;
  });

export function getPublicTimetableGeneratedAt(): string {
  return meetingListDataset.generated_at;
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
