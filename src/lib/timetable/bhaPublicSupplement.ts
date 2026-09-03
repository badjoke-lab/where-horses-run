import supplementData from '../../../data/static/bha-public-timetable-supplement-v1.json';

type BhaFixtureDate = {
  readonly date: string;
  readonly racecourse_ids: readonly string[];
};

type BhaSupplementData = {
  readonly schema_version: 'bha-public-timetable-supplement-v1';
  readonly generated_at: string;
  readonly window: {
    readonly start_date: string;
    readonly end_date_exclusive: string;
    readonly timezone: string;
  };
  readonly authority_id: string;
  readonly country_id: string;
  readonly rank: 'C';
  readonly annual_source_url: string;
  readonly fixtures: readonly BhaFixtureDate[];
  readonly source_overrides: Readonly<Record<string, string>>;
};

const supplement = supplementData as BhaSupplementData;

export function isBhaSupplementWindowMeeting(meeting: {
  readonly authority_id: string;
  readonly date: string;
}): boolean {
  return (
    meeting.authority_id === supplement.authority_id
      && meeting.date >= supplement.window.start_date
      && meeting.date < supplement.window.end_date_exclusive
  );
}

export const bhaPublicMeetingRows = supplement.fixtures.flatMap(({ date, racecourse_ids }) =>
  racecourse_ids.map((racecourseId) => {
    const meetingId = `bha-${racecourseId}-${date}`;
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
      official_source_url: supplement.source_overrides[meetingId] ?? supplement.annual_source_url,
      last_checked_date: supplement.generated_at.slice(0, 10),
      detail_path: null,
      show_live_label: false,
      show_replay_label: false,
    } as const;
  }),
);

if (bhaPublicMeetingRows.length !== 119) {
  throw new Error(`BHA supplement must contain 119 meetings, got ${bhaPublicMeetingRows.length}`);
}
