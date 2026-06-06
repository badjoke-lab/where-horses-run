import normalizedTimetable from '../../data/generated/normalized-timetable.json';
import {
  readCalendarMeetingSummariesFromNormalizedTimetable,
  type CalendarMeetingSummary,
  type NormalizedTimetableFile,
} from '../lib/timetable/calendar-view-model';

export type NormalizedTimetableCalendarPreviewRecord = Pick<
  CalendarMeetingSummary,
  | 'meeting_id'
  | 'date'
  | 'country_id'
  | 'authority_id'
  | 'racecourse_id'
  | 'source_status'
  | 'capability_rank'
  | 'first_race_time_local'
  | 'last_race_time_local'
  | 'display_status'
  | 'official_source_url'
> & {
  readonly detail_path: string;
};

export type NormalizedTimetableCalendarPreviewDay = {
  date: string;
  records: NormalizedTimetableCalendarPreviewRecord[];
};

export const createNormalizedTimetableMeetingDetailPath = (meetingId: string) =>
  `/timetable/meetings/${encodeURIComponent(meetingId)}/`;

const toPreviewRecord = (summary: CalendarMeetingSummary): NormalizedTimetableCalendarPreviewRecord => ({
  meeting_id: summary.meeting_id,
  date: summary.date,
  country_id: summary.country_id,
  authority_id: summary.authority_id,
  racecourse_id: summary.racecourse_id,
  source_status: summary.source_status,
  capability_rank: summary.capability_rank,
  first_race_time_local: summary.first_race_time_local,
  last_race_time_local: summary.last_race_time_local,
  display_status: summary.display_status,
  official_source_url: summary.official_source_url,
  detail_path: createNormalizedTimetableMeetingDetailPath(summary.meeting_id),
});

export const normalizedTimetableCalendarPreviewRecords = readCalendarMeetingSummariesFromNormalizedTimetable(
  normalizedTimetable as NormalizedTimetableFile,
).map(toPreviewRecord);

export const normalizedTimetableCalendarPreviewDays = normalizedTimetableCalendarPreviewRecords.reduce<
  NormalizedTimetableCalendarPreviewDay[]
>((days, record) => {
  const day = days.find((entry) => entry.date === record.date);
  if (day) {
    day.records.push(record);
  } else {
    days.push({ date: record.date, records: [record] });
  }
  return days;
}, []);

export const normalizedTimetableCalendarPreviewSummary = {
  record_count: normalizedTimetableCalendarPreviewRecords.length,
  day_count: normalizedTimetableCalendarPreviewDays.length,
  source_path: 'data/generated/normalized-timetable.json',
  reader_path: 'src/lib/timetable/calendar-view-model.ts',
  notice: [
    'Preview-only normalized samples.',
    'Loaded from generated JSON without live fetching.',
    'Projected through the calendar view model reader before display.',
    'Summary-only monthly/day calendar preview; complete calendar coverage is not claimed.',
    'A/B/B+ meeting detail pages link to official sources without republishing race-by-race detail.',
  ],
};
