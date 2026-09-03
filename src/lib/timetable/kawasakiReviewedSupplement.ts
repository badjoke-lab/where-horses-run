import kawasakiReviewedData from '../../../data/static/kawasaki-2026-09-07-through-11-public-detail-v1.json';

const COUNTRY_ID = 'japan';
const AUTHORITY_ID = 'nar-local-government-racing';
const RACECOURSE_ID = 'kawasaki-racecourse';
const TIMEZONE = 'Asia/Tokyo';
const POLICY_ID = 'nar-reviewed-a-plus';

type KawasakiReviewedRow = {
  readonly label: string;
  readonly post_time_local: string;
  readonly race_name: string;
  readonly distance_m: number;
  readonly surface: string;
  readonly course_label: string;
};

type KawasakiReviewedMeeting = {
  readonly date: string;
  readonly source_url: string;
  readonly timetable_rows: readonly KawasakiReviewedRow[];
};

type KawasakiReviewedData = {
  readonly last_checked_date: string;
  readonly meetings: readonly KawasakiReviewedMeeting[];
};

const data = kawasakiReviewedData as KawasakiReviewedData;

export const kawasakiReviewedMeetingIds = new Set(
  data.meetings.map(({ date }) => `nar-kawasaki-racecourse-${date}`),
);

export const kawasakiReviewedMeetingRows = data.meetings.map(({ date, source_url, timetable_rows }) => {
  const meetingId = `nar-kawasaki-racecourse-${date}`;
  return {
    meeting_id: meetingId,
    country_id: COUNTRY_ID,
    authority_id: AUTHORITY_ID,
    racecourse_id: RACECOURSE_ID,
    date,
    timezone: TIMEZONE,
    capability_rank: 'A+',
    max_public_rank: 'A+',
    effective_public_rank: 'A+',
    first_race_time_local: timetable_rows[0]?.post_time_local ?? null,
    last_race_time_local: timetable_rows.at(-1)?.post_time_local ?? null,
    policy_id: POLICY_ID,
    source_status: 'verified',
    official_source_url: source_url,
    last_checked_date: data.last_checked_date,
    detail_path: `/timetable/meetings/${meetingId}/`,
    show_live_label: false,
    show_replay_label: false,
  } as const;
});

export const kawasakiReviewedMeetingDetails = data.meetings.map(({ date, source_url, timetable_rows }) => {
  const meetingId = `nar-kawasaki-racecourse-${date}`;
  return {
    meeting_id: meetingId,
    country_id: COUNTRY_ID,
    authority_id: AUTHORITY_ID,
    racecourse_id: RACECOURSE_ID,
    date,
    timezone: TIMEZONE,
    capability_rank: 'A+',
    max_public_rank: 'A+',
    effective_public_rank: 'A+',
    policy_id: POLICY_ID,
    official_source_url: source_url,
    source_status: 'verified',
    last_checked_date: data.last_checked_date,
    show_race_name: true,
    show_distance: true,
    show_surface: true,
    show_course: true,
    show_live_label: false,
    show_replay_label: false,
    timetable_rows,
  } as const;
});
