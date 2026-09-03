import supplementData from '../../../data/static/france-galop-public-timetable-supplement-v1.json';

type FranceGalopFixture = {
  readonly date: string;
  readonly racecourse_id: string;
  readonly source_url: string;
};

type FranceGalopSupplementData = {
  readonly schema_version: 'france-galop-public-timetable-supplement-v1';
  readonly generated_at: string;
  readonly window: {
    readonly start_date: string;
    readonly end_date_exclusive: string;
    readonly timezone: string;
  };
  readonly authority_id: string;
  readonly country_id: string;
  readonly rank: 'C';
  readonly fixtures: readonly FranceGalopFixture[];
};

const supplement = supplementData as FranceGalopSupplementData;

export function isFranceGalopSupplementWindowMeeting(meeting: {
  readonly authority_id: string;
  readonly date: string;
}): boolean {
  return (
    meeting.authority_id === supplement.authority_id
      && meeting.date >= supplement.window.start_date
      && meeting.date < supplement.window.end_date_exclusive
  );
}

export const franceGalopPublicMeetingRows = supplement.fixtures.map((fixture) => {
  const meetingId = `france-galop-${fixture.racecourse_id}-${fixture.date}`;
  return {
    meeting_id: meetingId,
    country_id: supplement.country_id,
    authority_id: supplement.authority_id,
    racecourse_id: fixture.racecourse_id,
    date: fixture.date,
    timezone: supplement.window.timezone,
    capability_rank: 'C',
    max_public_rank: 'C',
    effective_public_rank: 'C',
    first_race_time_local: null,
    last_race_time_local: null,
    policy_id: 'default-conservative-c',
    source_status: 'verified',
    official_source_url: fixture.source_url,
    last_checked_date: supplement.generated_at.slice(0, 10),
    detail_path: null,
    show_live_label: false,
    show_replay_label: false,
  } as const;
});

if (franceGalopPublicMeetingRows.length !== 82) {
  throw new Error(`France Galop supplement must contain 82 meetings, got ${franceGalopPublicMeetingRows.length}`);
}
