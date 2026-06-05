export type TimetableSourceStatus = 'verified' | 'partial' | 'not_verified' | 'stale' | 'unavailable';

export type TimetableCapabilityRank = 'C' | 'B' | 'B+' | 'A';

export type TimetableDisplayStatus = 'displayable' | 'partial' | 'hidden' | 'stale' | 'unavailable';

export type NormalizedTimetableRecord = {
  readonly meeting_id: string;
  readonly country_id: string;
  readonly authority_id: string;
  readonly racecourse_id: string;
  readonly date: string;
  readonly timezone: string;
  readonly source_id: string;
  readonly route_id: string | null;
  readonly source_status: TimetableSourceStatus;
  readonly capability_rank: TimetableCapabilityRank;
  readonly first_race_time_local: string | null;
  readonly last_race_time_local: string | null;
  readonly official_source_url: string;
  readonly last_checked_date: string | null;
  readonly display_status: TimetableDisplayStatus;
  readonly notes: string;
};

export type NormalizedTimetableFile = {
  readonly schema_version: string;
  readonly schema_ref: string;
  readonly purpose: string;
  readonly records: readonly NormalizedTimetableRecord[];
};

export type CalendarMeetingSummary = {
  readonly meeting_id: string;
  readonly country_id: string;
  readonly authority_id: string;
  readonly racecourse_id: string;
  readonly date: string;
  readonly timezone: string;
  readonly source_id: string;
  readonly route_id: string | null;
  readonly source_status: TimetableSourceStatus;
  readonly capability_rank: TimetableCapabilityRank;
  readonly first_race_time_local: string | null;
  readonly last_race_time_local: string | null;
  readonly official_source_url: string;
  readonly last_checked_date: string | null;
  readonly display_status: TimetableDisplayStatus;
  readonly notes: string;
};

export type CalendarMeetingsByDate = Readonly<Record<string, readonly CalendarMeetingSummary[]>>;

function toDisplaySafeTimes(record: NormalizedTimetableRecord): Pick<
  CalendarMeetingSummary,
  'first_race_time_local' | 'last_race_time_local'
> {
  if (record.capability_rank === 'C') {
    return { first_race_time_local: null, last_race_time_local: null };
  }

  if (record.capability_rank === 'B') {
    return { first_race_time_local: record.first_race_time_local, last_race_time_local: null };
  }

  return {
    first_race_time_local: record.first_race_time_local,
    last_race_time_local: record.last_race_time_local
  };
}

export function toCalendarMeetingSummary(record: NormalizedTimetableRecord): CalendarMeetingSummary {
  const safeTimes = toDisplaySafeTimes(record);

  return {
    meeting_id: record.meeting_id,
    country_id: record.country_id,
    authority_id: record.authority_id,
    racecourse_id: record.racecourse_id,
    date: record.date,
    timezone: record.timezone,
    source_id: record.source_id,
    route_id: record.route_id,
    source_status: record.source_status,
    capability_rank: record.capability_rank,
    first_race_time_local: safeTimes.first_race_time_local,
    last_race_time_local: safeTimes.last_race_time_local,
    official_source_url: record.official_source_url,
    last_checked_date: record.last_checked_date,
    display_status: record.display_status,
    notes: record.notes
  };
}

export function sortCalendarMeetingSummaries(
  summaries: readonly CalendarMeetingSummary[]
): CalendarMeetingSummary[] {
  return [...summaries].sort((left, right) => {
    const leftSortKey = [
      left.date,
      left.country_id,
      left.racecourse_id,
      left.first_race_time_local ?? '99:99',
      left.meeting_id
    ];
    const rightSortKey = [
      right.date,
      right.country_id,
      right.racecourse_id,
      right.first_race_time_local ?? '99:99',
      right.meeting_id
    ];

    for (const [index, leftValue] of leftSortKey.entries()) {
      const comparison = leftValue.localeCompare(rightSortKey[index]);
      if (comparison !== 0) return comparison;
    }

    return 0;
  });
}

export function createCalendarMeetingSummaries(
  records: readonly NormalizedTimetableRecord[]
): CalendarMeetingSummary[] {
  return sortCalendarMeetingSummaries(records.map(toCalendarMeetingSummary));
}

export function readCalendarMeetingSummariesFromNormalizedTimetable(
  normalizedTimetable: NormalizedTimetableFile
): CalendarMeetingSummary[] {
  return createCalendarMeetingSummaries(normalizedTimetable.records);
}

export function filterCalendarMeetingSummariesByDate(
  summaries: readonly CalendarMeetingSummary[],
  date: string
): CalendarMeetingSummary[] {
  return sortCalendarMeetingSummaries(summaries.filter((summary) => summary.date === date));
}

export function filterCalendarMeetingSummariesByDateRange(
  summaries: readonly CalendarMeetingSummary[],
  startDate: string,
  endDate: string
): CalendarMeetingSummary[] {
  return sortCalendarMeetingSummaries(
    summaries.filter((summary) => summary.date >= startDate && summary.date <= endDate)
  );
}

export function groupCalendarMeetingSummariesByDate(
  summaries: readonly CalendarMeetingSummary[]
): CalendarMeetingsByDate {
  const grouped: Record<string, CalendarMeetingSummary[]> = {};

  for (const summary of sortCalendarMeetingSummaries(summaries)) {
    grouped[summary.date] ??= [];
    grouped[summary.date].push(summary);
  }

  return grouped;
}
