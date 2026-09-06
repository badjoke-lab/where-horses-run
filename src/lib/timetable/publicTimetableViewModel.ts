import meetingListData from '../../../data/generated/timetable/public/meeting-list.json';
import meetingDetailsData from '../../../data/generated/timetable/public/meeting-details.json';
import japanAPlusOverridesData from '../../../data/generated/timetable/public/japan-a-plus-overrides.json';
import type { CapabilityRank } from './canonicalTypes.ts';
import {
  tjkPublicMeetingDetails,
  tjkPublicMeetingRows,
} from './tjkPublicSupplement.ts';
import {
  baneiReviewedMeetingDetails,
  baneiReviewedMeetingRows,
} from './baneiReviewedSupplement.ts';

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

type PublicTimetableMeetingCorrection = Partial<Pick<
  PublicTimetableMeetingRow,
  | 'first_race_time_local'
  | 'last_race_time_local'
  | 'policy_id'
  | 'source_status'
  | 'official_source_url'
  | 'last_checked_date'
  | 'detail_path'
  | 'show_live_label'
  | 'show_replay_label'
>>;

type PublicTimetableDetailCorrection = Partial<Pick<
  PublicTimetableMeetingDetail,
  | 'policy_id'
  | 'official_source_url'
  | 'source_status'
  | 'last_checked_date'
  | 'show_race_name'
  | 'show_distance'
  | 'show_surface'
  | 'show_course'
  | 'show_live_label'
  | 'show_replay_label'
  | 'timetable_rows'
>>;

const RANK_ORDER: Record<CapabilityRank, number> = {
  not_listed: 0,
  D: 1,
  C: 2,
  B: 3,
  'B+': 4,
  A: 5,
  'A+': 6,
};

const maxRank = (left: CapabilityRank, right: CapabilityRank): CapabilityRank =>
  RANK_ORDER[left] >= RANK_ORDER[right] ? left : right;

const isRankAtLeast = (candidate: CapabilityRank, floor: CapabilityRank): boolean =>
  RANK_ORDER[candidate] >= RANK_ORDER[floor];

const meetingListDataset = meetingListData as PublicMeetingListDataset;
const meetingDetailsDataset = meetingDetailsData as PublicMeetingDetailsDataset;
const japanAPlusOverrides = japanAPlusOverridesData as JapanAPlusPublicOverrides;

const overrideSnapshotDate = japanAPlusOverrides.generated_at.slice(0, 10);
const canApplyReviewedOverride = (lastCheckedDate: string | undefined): boolean =>
  typeof lastCheckedDate === 'string' && lastCheckedDate <= overrideSnapshotDate;

const canApplyMeetingRankOverride = (
  meeting: PublicTimetableMeetingRow,
  override: JapanMeetingOverride,
): boolean =>
  canApplyReviewedOverride(meeting.last_checked_date)
  && isRankAtLeast(override.max_public_rank, meeting.max_public_rank)
  && isRankAtLeast(override.effective_public_rank, meeting.effective_public_rank);

const canApplyDetailRankOverride = (
  detail: PublicTimetableMeetingDetail,
  override: JapanDetailOverride,
): boolean =>
  canApplyReviewedOverride(detail.last_checked_date)
  && isRankAtLeast(override.max_public_rank, detail.max_public_rank)
  && isRankAtLeast(override.effective_public_rank, detail.effective_public_rank);

const meetingOverrideIndex = new Map(
  japanAPlusOverrides.meeting_overrides.map((override) => [override.meeting_id, override]),
);
const detailOverrideIndex = new Map(
  japanAPlusOverrides.detail_overrides.map((override) => [override.meeting_id, override]),
);

const reviewedPublicCorrections = new Map<string, PublicTimetableMeetingCorrection>([
  [
    'kra-busan-gyeongnam-racecourse-2026-09-06',
    {
      last_race_time_local: '15:45',
      official_source_url: 'https://race.kra.co.kr/thisweekrace/ThisWeekDetailInfoList.do?Act=01&Sub=2&meet=',
      last_checked_date: '2026-09-03',
      source_status: 'verified',
    },
  ],
]);

const reviewedPublicDetailCorrections = new Map<string, PublicTimetableDetailCorrection>([
  [
    'kra-busan-gyeongnam-racecourse-2026-09-06',
    {
      official_source_url: 'https://race.kra.co.kr/thisweekrace/ThisWeekDetailInfoList.do?Act=01&Sub=2&meet=',
      last_checked_date: '2026-09-03',
      source_status: 'verified',
      timetable_rows: [
        { label: 'Race 1', post_time_local: '11:25' },
        { label: 'Race 2', post_time_local: '12:25' },
        { label: 'Race 3', post_time_local: '13:15' },
        { label: 'Race 4', post_time_local: '14:05' },
        { label: 'Race 5', post_time_local: '14:55' },
        { label: 'Race 6', post_time_local: '15:45' },
      ],
    },
  ],
]);

const reviewedPublicExcludedMeetingIds = new Set<string>([
  'era-meydan-racecourse-2026-09-30',
]);

const reviewedPublicSupplements: readonly PublicTimetableMeetingRow[] = [
  {
    meeting_id: 'hkjc-sha-tin-racecourse-2026-09-27',
    country_id: 'hong-kong', authority_id: 'hkjc', racecourse_id: 'sha-tin-racecourse', date: '2026-09-27', timezone: 'Asia/Hong_Kong', capability_rank: 'C', max_public_rank: 'C', effective_public_rank: 'C', first_race_time_local: null, last_race_time_local: null, policy_id: 'hkjc-reviewed-a-plus', source_status: 'verified', official_source_url: 'https://racing.hkjc.com/en-us/local/information/fixture?CalMonth=09&CalYear=2026', last_checked_date: '2026-09-03', detail_path: null, show_live_label: false, show_replay_label: false,
  },
  {
    meeting_id: 'kra-seoul-racecourse-2026-09-13', country_id: 'south-korea', authority_id: 'korea-racing-authority', racecourse_id: 'seoul-racecourse', date: '2026-09-13', timezone: 'Asia/Seoul', capability_rank: 'C', max_public_rank: 'C', effective_public_rank: 'C', first_race_time_local: null, last_race_time_local: null, policy_id: 'kra-reviewed-a', source_status: 'verified', official_source_url: 'https://race.kra.co.kr/chulmainfo/RegistStateList.do?meet=1', last_checked_date: '2026-09-03', detail_path: null, show_live_label: false, show_replay_label: false,
  },
  {
    meeting_id: 'kra-busan-gyeongnam-racecourse-2026-09-11', country_id: 'south-korea', authority_id: 'korea-racing-authority', racecourse_id: 'busan-gyeongnam-racecourse', date: '2026-09-11', timezone: 'Asia/Seoul', capability_rank: 'C', max_public_rank: 'C', effective_public_rank: 'C', first_race_time_local: null, last_race_time_local: null, policy_id: 'kra-reviewed-a', source_status: 'verified', official_source_url: 'https://race.kra.co.kr/chulmainfo/RegistStateList.do?meet=3', last_checked_date: '2026-09-03', detail_path: null, show_live_label: false, show_replay_label: false,
  },
  {
    meeting_id: 'kra-yeongcheon-racecourse-2026-09-13', country_id: 'south-korea', authority_id: 'korea-racing-authority', racecourse_id: 'yeongcheon-racecourse', date: '2026-09-13', timezone: 'Asia/Seoul', capability_rank: 'C', max_public_rank: 'C', effective_public_rank: 'C', first_race_time_local: null, last_race_time_local: null, policy_id: 'kra-reviewed-a', source_status: 'verified', official_source_url: 'https://race.kra.co.kr/chulmainfo/RegistStateList.do?meet=3', last_checked_date: '2026-09-03', detail_path: null, show_live_label: false, show_replay_label: false,
  },
  {
    meeting_id: 'kra-seoul-racecourse-2026-09-20', country_id: 'south-korea', authority_id: 'korea-racing-authority', racecourse_id: 'seoul-racecourse', date: '2026-09-20', timezone: 'Asia/Seoul', capability_rank: 'C', max_public_rank: 'C', effective_public_rank: 'C', first_race_time_local: null, last_race_time_local: null, policy_id: 'kra-reviewed-a', source_status: 'verified', official_source_url: 'https://race.kra.co.kr/thisweekrace/EventRacePlan.do', last_checked_date: '2026-09-03', detail_path: null, show_live_label: false, show_replay_label: false,
  },
  {
    meeting_id: 'kra-yeongcheon-racecourse-2026-09-20', country_id: 'south-korea', authority_id: 'korea-racing-authority', racecourse_id: 'yeongcheon-racecourse', date: '2026-09-20', timezone: 'Asia/Seoul', capability_rank: 'C', max_public_rank: 'C', effective_public_rank: 'C', first_race_time_local: null, last_race_time_local: null, policy_id: 'kra-reviewed-a', source_status: 'verified', official_source_url: 'https://race.kra.co.kr/raceoper/RaceoperView.do?Sub=1&meet=1', last_checked_date: '2026-09-03', detail_path: null, show_live_label: false, show_replay_label: false,
  },
  {
    meeting_id: 'kra-busan-gyeongnam-racecourse-2026-10-02', country_id: 'south-korea', authority_id: 'korea-racing-authority', racecourse_id: 'busan-gyeongnam-racecourse', date: '2026-10-02', timezone: 'Asia/Seoul', capability_rank: 'C', max_public_rank: 'C', effective_public_rank: 'C', first_race_time_local: null, last_race_time_local: null, policy_id: 'kra-reviewed-a', source_status: 'verified', official_source_url: 'https://race.kra.co.kr/raceoper/RaceoperView.do?Sub=1&meet=1', last_checked_date: '2026-09-03', detail_path: null, show_live_label: false, show_replay_label: false,
  },
  {
    meeting_id: 'kra-jeju-racecourse-2026-10-02', country_id: 'south-korea', authority_id: 'korea-racing-authority', racecourse_id: 'jeju-racecourse', date: '2026-10-02', timezone: 'Asia/Seoul', capability_rank: 'C', max_public_rank: 'C', effective_public_rank: 'C', first_race_time_local: null, last_race_time_local: null, policy_id: 'kra-reviewed-a', source_status: 'verified', official_source_url: 'https://race.kra.co.kr/raceoper/RaceoperView.do?Sub=1&meet=1', last_checked_date: '2026-09-03', detail_path: null, show_live_label: false, show_replay_label: false,
  },
];

function mergePublicMeetingRowsMonotonic(
  rows: readonly PublicTimetableMeetingRow[],
): readonly PublicTimetableMeetingRow[] {
  const merged = new Map<string, PublicTimetableMeetingRow>();
  for (const candidate of rows) {
    const existing = merged.get(candidate.meeting_id);
    if (!existing) {
      merged.set(candidate.meeting_id, candidate);
      continue;
    }

    const candidateRank = RANK_ORDER[candidate.effective_public_rank];
    const existingRank = RANK_ORDER[existing.effective_public_rank];
    const candidatePreferred = candidateRank > existingRank
      || (candidateRank === existingRank && candidate.last_checked_date > existing.last_checked_date);
    const preferred = candidatePreferred ? candidate : existing;
    const fallback = candidatePreferred ? existing : candidate;

    merged.set(candidate.meeting_id, {
      ...fallback,
      ...preferred,
      capability_rank: maxRank(existing.capability_rank, candidate.capability_rank),
      max_public_rank: maxRank(existing.max_public_rank, candidate.max_public_rank),
      effective_public_rank: maxRank(existing.effective_public_rank, candidate.effective_public_rank),
      first_race_time_local: preferred.first_race_time_local ?? fallback.first_race_time_local,
      last_race_time_local: preferred.last_race_time_local ?? fallback.last_race_time_local,
      detail_path: preferred.detail_path ?? fallback.detail_path,
    });
  }
  return [...merged.values()];
}

function mergePublicMeetingDetailsMonotonic(
  details: readonly PublicTimetableMeetingDetail[],
): readonly PublicTimetableMeetingDetail[] {
  const merged = new Map<string, PublicTimetableMeetingDetail>();
  for (const candidate of details) {
    const existing = merged.get(candidate.meeting_id);
    if (!existing) {
      merged.set(candidate.meeting_id, candidate);
      continue;
    }

    const candidateRank = RANK_ORDER[candidate.effective_public_rank];
    const existingRank = RANK_ORDER[existing.effective_public_rank];
    const candidatePreferred = candidateRank > existingRank
      || (candidateRank === existingRank && candidate.last_checked_date > existing.last_checked_date);
    const preferred = candidatePreferred ? candidate : existing;
    const fallback = candidatePreferred ? existing : candidate;

    merged.set(candidate.meeting_id, {
      ...fallback,
      ...preferred,
      capability_rank: maxRank(existing.capability_rank, candidate.capability_rank),
      max_public_rank: maxRank(existing.max_public_rank, candidate.max_public_rank),
      effective_public_rank: maxRank(
        existing.effective_public_rank,
        candidate.effective_public_rank,
      ) as PublicTimetableMeetingDetail['effective_public_rank'],
    });
  }
  return [...merged.values()];
}

const generatedPublicMeetingRows: readonly PublicTimetableMeetingRow[] = meetingListDataset.meetings
  .filter((meeting) => !reviewedPublicExcludedMeetingIds.has(meeting.meeting_id))
  .map((meeting) => {
    const override = meetingOverrideIndex.get(meeting.meeting_id);
    const withRankOverride = override && canApplyMeetingRankOverride(meeting, override)
      ? { ...meeting, ...override }
      : meeting;
    const correction = reviewedPublicCorrections.get(meeting.meeting_id);
    return correction ? { ...withRankOverride, ...correction } : withRankOverride;
  });

const publicMeetingRows: readonly PublicTimetableMeetingRow[] = mergePublicMeetingRowsMonotonic([
  ...generatedPublicMeetingRows,
  ...reviewedPublicSupplements,
  ...(baneiReviewedMeetingRows as readonly PublicTimetableMeetingRow[]),
  ...(tjkPublicMeetingRows as readonly PublicTimetableMeetingRow[]),
]);

const generatedPublicMeetingDetails: readonly PublicTimetableMeetingDetail[] = meetingDetailsDataset.details
  .map((detail) => {
    const override = detailOverrideIndex.get(detail.meeting_id);
    const withRankOverride = override && canApplyDetailRankOverride(detail, override)
      ? { ...detail, ...override }
      : detail;
    const correction = reviewedPublicDetailCorrections.get(detail.meeting_id);
    return correction ? { ...withRankOverride, ...correction } : withRankOverride;
  });

const publicMeetingDetails: readonly PublicTimetableMeetingDetail[] = mergePublicMeetingDetailsMonotonic([
  ...generatedPublicMeetingDetails,
  ...(baneiReviewedMeetingDetails as readonly PublicTimetableMeetingDetail[]),
  ...(tjkPublicMeetingDetails as readonly PublicTimetableMeetingDetail[]),
]);

const finalMeetingIndex = new Map(publicMeetingRows.map((meeting) => [meeting.meeting_id, meeting]));
for (const generated of generatedPublicMeetingRows) {
  const published = finalMeetingIndex.get(generated.meeting_id);
  if (!published) throw new Error(`Public meeting missing generated baseline: ${generated.meeting_id}`);
  if (
    !isRankAtLeast(published.capability_rank, generated.capability_rank)
    || !isRankAtLeast(published.max_public_rank, generated.max_public_rank)
    || !isRankAtLeast(published.effective_public_rank, generated.effective_public_rank)
  ) {
    throw new Error(`Public meeting rank downgraded below generated baseline: ${generated.meeting_id}`);
  }
}

const finalDetailIndex = new Map(publicMeetingDetails.map((detail) => [detail.meeting_id, detail]));
for (const generated of generatedPublicMeetingDetails) {
  const published = finalDetailIndex.get(generated.meeting_id);
  if (!published) throw new Error(`Public meeting detail missing generated baseline: ${generated.meeting_id}`);
  if (
    !isRankAtLeast(published.capability_rank, generated.capability_rank)
    || !isRankAtLeast(published.max_public_rank, generated.max_public_rank)
    || !isRankAtLeast(published.effective_public_rank, generated.effective_public_rank)
  ) {
    throw new Error(`Public meeting detail rank downgraded below generated baseline: ${generated.meeting_id}`);
  }
}

export function getPublicTimetableGeneratedAt(): string { return meetingListDataset.generated_at; }
export function getPublicTimetableMeetingRows(): readonly PublicTimetableMeetingRow[] { return publicMeetingRows; }
export function getPublicTimetableMeetingRowsByCountry(countryId: string): readonly PublicTimetableMeetingRow[] { return publicMeetingRows.filter((meeting) => meeting.country_id === countryId); }
export function getPublicTimetableMeetingRowsByRacecourse(racecourseId: string): readonly PublicTimetableMeetingRow[] { return publicMeetingRows.filter((meeting) => meeting.racecourse_id === racecourseId); }
export function getPublicTimetableMeetingDetail(meetingId: string): PublicTimetableMeetingDetail | undefined { return publicMeetingDetails.find((detail) => detail.meeting_id === meetingId); }
export function getPublicTimetableMeetingDetails(): readonly PublicTimetableMeetingDetail[] { return publicMeetingDetails; }
