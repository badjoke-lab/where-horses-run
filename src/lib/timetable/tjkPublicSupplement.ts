import supplementData from '../../../data/static/tjk-public-timetable-supplement-v1.json';
import generatedMeetingListData from '../../../data/generated/timetable/public/meeting-list.json';
import generatedMeetingDetailsData from '../../../data/generated/timetable/public/meeting-details.json';
import { bhaPublicMeetingRows, isBhaSupplementWindowMeeting } from './bhaPublicSupplement.ts';
import { hriPublicMeetingRows, isHriSupplementWindowMeeting } from './hriPublicSupplement.ts';
import {
  franceGalopPublicMeetingRows,
  isFranceGalopSupplementWindowMeeting,
} from './franceGalopPublicSupplement.ts';

const AUTHORITY_ID = 'turkiye-jokey-kulubu';
const COUNTRY_ID = 'turkey';
const TIMEZONE = 'Europe/Istanbul';
const POLICY_ID = 'tjk-reviewed-a';
const ANNUAL_SOURCE_URL = 'https://www.tjk.org/TR/YarisSever/Query/Page/YillikYarisProgramiCoklu';
const WINDOW_START = '2026-09-03';
const WINDOW_END_EXCLUSIVE = '2026-10-03';
const MIZUSAWA_AUTHORITY_ID = 'nar-local-government-racing';
const MIZUSAWA_SOURCE_URL = 'https://www.iwatekeiba.or.jp/';

const mizusawaReviewedRows = [
  ['2026-09-06', '12:00', '18:00'],
  ['2026-09-07', '11:45', '18:15'],
  ['2026-09-08', '11:45', '18:15'],
  ['2026-09-13', '11:30', '18:05'],
  ['2026-09-14', '11:40', '18:05'],
  ['2026-09-15', '11:30', '18:00'],
].map(([date, firstRaceTime, lastRaceTime]) => ({
  meeting_id: `nar-mizusawa-racecourse-${date}`,
  country_id: 'japan',
  authority_id: MIZUSAWA_AUTHORITY_ID,
  racecourse_id: 'mizusawa-racecourse',
  date,
  timezone: 'Asia/Tokyo',
  capability_rank: 'B+',
  max_public_rank: 'B+',
  effective_public_rank: 'B+',
  first_race_time_local: firstRaceTime,
  last_race_time_local: lastRaceTime,
  policy_id: 'nar-reviewed-a-plus',
  source_status: 'verified',
  official_source_url: MIZUSAWA_SOURCE_URL,
  last_checked_date: '2026-09-03',
  detail_path: null,
  show_live_label: false,
  show_replay_label: false,
} as const));

const mizusawaReviewedMeetingIds = new Set(mizusawaReviewedRows.map((meeting) => meeting.meeting_id));

type RankARecord = {
  readonly source_url: string;
  readonly times: readonly string[];
};

type SupplementData = {
  readonly schema_version: 'tjk-public-timetable-supplement-v1';
  readonly generated_at: string;
  readonly source_run_id: number;
  readonly meeting_ids: readonly string[];
  readonly rank_a: Readonly<Record<string, RankARecord>>;
};

type GeneratedMeetingListData = {
  readonly meetings: readonly {
    readonly meeting_id: string;
    readonly authority_id: string;
  }[];
};

type GeneratedMeetingDetailsData = {
  readonly details: readonly {
    readonly meeting_id: string;
    readonly authority_id: string;
  }[];
};

const supplement = supplementData as SupplementData;
const generatedTjkMeetingIds = new Set(
  (generatedMeetingListData as GeneratedMeetingListData).meetings
    .filter((meeting) => meeting.authority_id === AUTHORITY_ID)
    .map((meeting) => meeting.meeting_id),
);
const generatedTjkDetailIds = new Set(
  (generatedMeetingDetailsData as GeneratedMeetingDetailsData).details
    .filter((detail) => detail.authority_id === AUTHORITY_ID)
    .map((detail) => detail.meeting_id),
);

function parseMeetingId(meetingId: string): { racecourseId: string; date: string } {
  const match = meetingId.match(/^tjk-(.+-racecourse)-(\d{4}-\d{2}-\d{2})$/);
  if (!match) throw new Error(`Invalid TJK supplement meeting id: ${meetingId}`);
  return { racecourseId: match[1], date: match[2] };
}

export function isTjkSupplementWindowMeeting(meeting: {
  readonly meeting_id: string;
  readonly authority_id: string;
  readonly date: string;
}): boolean {
  return (
    mizusawaReviewedMeetingIds.has(meeting.meeting_id)
    || isBhaSupplementWindowMeeting(meeting)
    || isHriSupplementWindowMeeting(meeting)
    || isFranceGalopSupplementWindowMeeting(meeting)
  );
}

const tjkRows = supplement.meeting_ids.map((meetingId) => {
  const { racecourseId, date } = parseMeetingId(meetingId);
  const rankA = supplement.rank_a[meetingId];
  const rank = rankA ? 'A' : 'C';
  const times = rankA?.times ?? [];
  return {
    meeting_id: meetingId,
    country_id: COUNTRY_ID,
    authority_id: AUTHORITY_ID,
    racecourse_id: racecourseId,
    date,
    timezone: TIMEZONE,
    capability_rank: rank,
    max_public_rank: rank,
    effective_public_rank: rank,
    first_race_time_local: times[0] ?? null,
    last_race_time_local: times.at(-1) ?? null,
    policy_id: POLICY_ID,
    source_status: 'verified',
    official_source_url: rankA?.source_url ?? ANNUAL_SOURCE_URL,
    last_checked_date: supplement.generated_at.slice(0, 10),
    detail_path: rankA ? `/timetable/meetings/${meetingId}/` : null,
    show_live_label: false,
    show_replay_label: false,
  } as const;
});

const tjkDetails = Object.entries(supplement.rank_a).map(([meetingId, rankA]) => {
  const { racecourseId, date } = parseMeetingId(meetingId);
  return {
    meeting_id: meetingId,
    country_id: COUNTRY_ID,
    authority_id: AUTHORITY_ID,
    racecourse_id: racecourseId,
    date,
    timezone: TIMEZONE,
    capability_rank: 'A',
    max_public_rank: 'A',
    effective_public_rank: 'A',
    policy_id: POLICY_ID,
    official_source_url: rankA.source_url,
    source_status: 'verified',
    last_checked_date: supplement.generated_at.slice(0, 10),
    show_race_name: false,
    show_distance: false,
    show_surface: false,
    show_course: false,
    show_live_label: false,
    show_replay_label: false,
    timetable_rows: rankA.times.map((postTime, index) => ({
      label: `Race ${index + 1}`,
      post_time_local: postTime,
    })),
  } as const;
});

export const tjkPublicMeetingRows = [
  ...tjkRows.filter((meeting) => !generatedTjkMeetingIds.has(meeting.meeting_id)),
  ...mizusawaReviewedRows,
  ...bhaPublicMeetingRows,
  ...hriPublicMeetingRows,
  ...franceGalopPublicMeetingRows,
] as const;

export const tjkPublicMeetingDetails = tjkDetails.filter(
  (detail) => !generatedTjkDetailIds.has(detail.meeting_id),
);

if (tjkRows.length !== 63) {
  throw new Error(`TJK supplement must contain 63 meetings, got ${tjkRows.length}`);
}
if (tjkDetails.length !== 6) {
  throw new Error(`TJK supplement must contain 6 Rank A details, got ${tjkDetails.length}`);
}
