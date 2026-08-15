import readinessData from '../../../data/static/calendar-readiness-registry.json';
import meetingListData from '../../../data/generated/timetable/public/meeting-list.json';
import meetingDetailsData from '../../../data/generated/timetable/public/meeting-details.json';

export type CoverageDimension = 'racecourses' | 'dates' | 'events' | 'times' | 'structures';
export type SourceCoverageStatus = 'verified' | 'limited' | 'blocked';

export type CoverageDashboardCountry = {
  country_id: string;
  country_label: string;
  country_label_ja: string;
  source_status: SourceCoverageStatus;
  source_dimensions: Record<CoverageDimension, boolean>;
  public: {
    meetings: number;
    dates: number;
    racecourses: number;
    event_rows: number;
    meetings_with_times: number;
    structured_event_rows: number;
  };
};

type ReadinessRecord = {
  country_id: string;
  readiness?: string;
  source_status?: string;
  confirmed_fields?: {
    meeting_date?: boolean;
    racecourse?: boolean;
    first_race_time?: boolean;
    last_race_time?: boolean;
    per_race_post_times?: boolean;
    race_name?: boolean;
    distance?: boolean;
    surface?: boolean;
    course?: boolean;
  };
};

type PublicMeeting = {
  meeting_id: string;
  country_id: string;
  racecourse_id: string;
  date: string;
  first_race_time_local: string | null;
  last_race_time_local: string | null;
};

type PublicDetail = {
  meeting_id: string;
  country_id: string;
  timetable_rows: Array<{
    post_time_local?: string;
    race_name?: string;
    distance_m?: number;
    surface?: string;
    course_label?: string;
  }>;
};

const targets = [
  { id: 'japan', en: 'Japan', ja: '日本' },
  { id: 'hong-kong', en: 'Hong Kong', ja: '香港' },
  { id: 'united-arab-emirates', en: 'United Arab Emirates', ja: 'アラブ首長国連邦' },
  { id: 'south-korea', en: 'South Korea', ja: '韓国' },
  { id: 'turkey', en: 'Turkey', ja: 'トルコ' },
  { id: 'morocco', en: 'Morocco', ja: 'モロッコ' },
] as const;

const readinessRecords = (readinessData as { records: ReadinessRecord[] }).records;
const publicMeetings = (meetingListData as { meetings: PublicMeeting[] }).meetings;
const publicDetails = (meetingDetailsData as { details: PublicDetail[] }).details;

const anyConfirmed = (records: ReadinessRecord[], key: keyof NonNullable<ReadinessRecord['confirmed_fields']>) =>
  records.some((record) => record.confirmed_fields?.[key] === true);

function sourceStatus(records: ReadinessRecord[]): SourceCoverageStatus {
  if (records.length === 0 || records.every((record) => record.readiness === 'blocked')) return 'blocked';
  if (records.some((record) => record.source_status === 'verified')) return 'verified';
  return 'limited';
}

function publicMetrics(countryId: string) {
  const meetings = publicMeetings.filter((meeting) => meeting.country_id === countryId);
  const meetingIds = new Set(meetings.map((meeting) => meeting.meeting_id));
  const details = publicDetails.filter((detail) => detail.country_id === countryId && meetingIds.has(detail.meeting_id));
  const rows = details.flatMap((detail) => detail.timetable_rows ?? []);

  return {
    meetings: meetings.length,
    dates: new Set(meetings.map((meeting) => meeting.date)).size,
    racecourses: new Set(meetings.map((meeting) => meeting.racecourse_id)).size,
    event_rows: rows.length,
    meetings_with_times: meetings.filter((meeting) =>
      meeting.first_race_time_local !== null ||
      meeting.last_race_time_local !== null ||
      details.some((detail) => detail.meeting_id === meeting.meeting_id && detail.timetable_rows.length > 0),
    ).length,
    structured_event_rows: rows.filter((row) =>
      Boolean(row.race_name) ||
      typeof row.distance_m === 'number' ||
      Boolean(row.surface) ||
      Boolean(row.course_label),
    ).length,
  };
}

export function getCoverageDashboardCountries(): CoverageDashboardCountry[] {
  return targets.map((country) => {
    const records = readinessRecords.filter((record) => record.country_id === country.id);
    return {
      country_id: country.id,
      country_label: country.en,
      country_label_ja: country.ja,
      source_status: sourceStatus(records),
      source_dimensions: {
        racecourses: anyConfirmed(records, 'racecourse'),
        dates: anyConfirmed(records, 'meeting_date'),
        events: anyConfirmed(records, 'per_race_post_times'),
        times:
          anyConfirmed(records, 'first_race_time') ||
          anyConfirmed(records, 'last_race_time') ||
          anyConfirmed(records, 'per_race_post_times'),
        structures:
          anyConfirmed(records, 'race_name') ||
          anyConfirmed(records, 'distance') ||
          anyConfirmed(records, 'surface') ||
          anyConfirmed(records, 'course'),
      },
      public: publicMetrics(country.id),
    };
  });
}

export const coverageDashboardGeneratedAt = (meetingListData as { generated_at: string }).generated_at;
