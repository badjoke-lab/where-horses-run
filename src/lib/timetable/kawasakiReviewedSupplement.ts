import kawasakiReviewedData from '../../../data/static/kawasaki-2026-09-07-through-11-public-detail-v1.json';

const COUNTRY_ID = 'japan';
const AUTHORITY_ID = 'nar-local-government-racing';
const RACECOURSE_ID = 'kawasaki-racecourse';
const TIMEZONE = 'Asia/Tokyo';
const POLICY_ID = 'nar-reviewed-a-plus';

type KawasakiReviewedData = {
  readonly last_checked_date: string;
  readonly meetings: readonly { readonly date: string; readonly source_url: string }[];
  readonly post_times: readonly string[];
};

const data = kawasakiReviewedData as KawasakiReviewedData;

export const kawasakiReviewedMeetingIds = new Set(
  data.meetings.map(({ date }) => `nar-kawasaki-racecourse-${date}`),
);

export const kawasakiReviewedMeetingRows = data.meetings.map(({ date, source_url }) => {
  const meetingId = `nar-kawasaki-racecourse-${date}`;
  return {
    meeting_id: meetingId,
    country_id: COUNTRY_ID,
    authority_id: AUTHORITY_ID,
    racecourse_id: RACECOURSE_ID,
    date,
    timezone: TIMEZONE,
    capability_rank: 'A',
    max_public_rank: 'A',
    effective_public_rank: 'A',
    first_race_time_local: data.post_times[0],
    last_race_time_local: data.post_times.at(-1) ?? null,
    policy_id: POLICY_ID,
    source_status: 'verified',
    official_source_url: source_url,
    last_checked_date: data.last_checked_date,
    detail_path: `/timetable/meetings/${meetingId}/`,
    show_live_label: false,
    show_replay_label: false,
  } as const;
});

export const kawasakiReviewedMeetingDetails = data.meetings.map(({ date, source_url }) => {
  const meetingId = `nar-kawasaki-racecourse-${date}`;
  return {
    meeting_id: meetingId,
    country_id: COUNTRY_ID,
    authority_id: AUTHORITY_ID,
    racecourse_id: RACECOURSE_ID,
    date,
    timezone: TIMEZONE,
    capability_rank: 'A',
    max_public_rank: 'A',
    effective_public_rank: 'A',
    policy_id: POLICY_ID,
    official_source_url: source_url,
    source_status: 'verified',
    last_checked_date: data.last_checked_date,
    show_race_name: false,
    show_distance: false,
    show_surface: false,
    show_course: false,
    show_live_label: false,
    show_replay_label: false,
    timetable_rows: data.post_times.map((postTime, index) => ({
      label: `Race ${index + 1}`,
      post_time_local: postTime,
    })),
  } as const;
});

if (kawasakiReviewedMeetingRows.length !== 5) {
  throw new Error(`Kawasaki reviewed supplement must contain 5 meetings, got ${kawasakiReviewedMeetingRows.length}`);
}
if (data.post_times.length !== 12) {
  throw new Error(`Kawasaki reviewed supplement must contain 12 race times, got ${data.post_times.length}`);
}
