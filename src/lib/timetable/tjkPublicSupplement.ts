import supplementData from '../../../data/static/tjk-public-timetable-supplement-v1.json';

const AUTHORITY_ID = 'turkiye-jokey-kulubu';
const COUNTRY_ID = 'turkey';
const TIMEZONE = 'Europe/Istanbul';
const POLICY_ID = 'tjk-reviewed-a';
const ANNUAL_SOURCE_URL = 'https://www.tjk.org/TR/YarisSever/Query/Page/YillikYarisProgramiCoklu';
const WINDOW_START = '2026-09-03';
const WINDOW_END_EXCLUSIVE = '2026-10-03';

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

const supplement = supplementData as SupplementData;

function parseMeetingId(meetingId: string): { racecourseId: string; date: string } {
  const match = meetingId.match(/^tjk-(.+-racecourse)-(\d{4}-\d{2}-\d{2})$/);
  if (!match) throw new Error(`Invalid TJK supplement meeting id: ${meetingId}`);
  return { racecourseId: match[1], date: match[2] };
}

export function isTjkSupplementWindowMeeting(meeting: {
  readonly authority_id: string;
  readonly date: string;
}): boolean {
  return meeting.authority_id === AUTHORITY_ID
    && meeting.date >= WINDOW_START
    && meeting.date < WINDOW_END_EXCLUSIVE;
}

export const tjkPublicMeetingRows = supplement.meeting_ids.map((meetingId) => {
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

export const tjkPublicMeetingDetails = Object.entries(supplement.rank_a).map(([meetingId, rankA]) => {
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

if (tjkPublicMeetingRows.length !== 63) {
  throw new Error(`TJK supplement must contain 63 meetings, got ${tjkPublicMeetingRows.length}`);
}
if (tjkPublicMeetingDetails.length !== 6) {
  throw new Error(`TJK supplement must contain 6 Rank A details, got ${tjkPublicMeetingDetails.length}`);
}
