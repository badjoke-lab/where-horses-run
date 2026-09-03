import supplementData from '../../../data/static/hri-public-timetable-supplement-v1.json';

type HriFixtureDate = {
  readonly date: string;
  readonly racecourse_ids: readonly string[];
};

type HriSupplementData = {
  readonly schema_version: 'hri-public-timetable-supplement-v1';
  readonly generated_at: string;
  readonly window: {
    readonly start_date: string;
    readonly end_date_exclusive: string;
    readonly timezone: string;
  };
  readonly authority_id: string;
  readonly country_id: string;
  readonly rank: 'C';
  readonly official_source_url: string;
  readonly fixtures: readonly HriFixtureDate[];
};

const supplement = supplementData as HriSupplementData;

export function isHriSupplementWindowMeeting(meeting: {
  readonly authority_id: string;
  readonly date: string;
}): boolean {
  return (
    meeting.authority_id === supplement.authority_id
      && meeting.date >= supplement.window.start_date
      && meeting.date < supplement.window.end_date_exclusive
  );
}

export const hriPublicMeetingRows = supplement.fixtures.flatMap(({ date, racecourse_ids }) =>
  racecourse_ids.map((racecourseId) => {
    const meetingId = `hri-${racecourseId}-${date}`;
    return {
      meeting_id: meetingId,
      country_id: supplement.country_id,
      authority_id: supplement.authority_id,
      racecourse_id: racecourseId,
      date,
      timezone: supplement.window.timezone,
      capability_rank: 'C',
      max_public_rank: 'C',
      effective_public_rank: 'C',
      first_race_time_local: null,
      last_race_time_local: null,
      policy_id: 'default-conservative-c',
      source_status: 'verified',
      official_source_url: supplement.official_source_url,
      last_checked_date: supplement.generated_at.slice(0, 10),
      detail_path: null,
      show_live_label: false,
      show_replay_label: false,
    } as const;
  }),
);

if (hriPublicMeetingRows.length !== 38) {
  throw new Error(`HRI supplement must contain 38 meetings, got ${hriPublicMeetingRows.length}`);
}
