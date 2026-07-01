import {
  getPublicTimetableGeneratedAt,
  getPublicTimetableMeetingRows,
  type PublicTimetableMeetingRow,
} from '../lib/timetable/publicTimetableViewModel';
import {
  createCalendarDateContext,
  evaluateCalendarDataState,
  filterRecordsForDate,
  filterRecordsForWindow,
} from '../lib/timetable/calendarDateContext.mjs';

export type CalendarRank = 'C' | 'B' | 'B+' | 'A' | 'A+';

export type TimetableMeetingRow = {
  meeting_id: string;
  date: string;
  country_id: string;
  country_label: string;
  authority_id: string;
  authority_label: string;
  racecourse_id: string;
  racecourse_name: string;
  capability_rank: CalendarRank;
  first_race_time_local: string | null;
  last_race_time_local: string | null;
  official_source_url: string;
  detail_path: string | null;
  can_view_race_timetable: boolean;
  rank_weight: number;
  source_status?: string;
  last_checked_date?: string | null;
};

export type TimetableMeetingDayGroup = {
  date: string;
  records: TimetableMeetingRow[];
};

const rankWeight: Record<CalendarRank, number> = {
  C: 0,
  B: 1,
  'B+': 2,
  A: 3,
  'A+': 4,
};

const racecourseNameById: Record<string, string> = {
  'tokyo-racecourse': 'Tokyo Racecourse',
  'obihiro-racecourse': 'Obihiro Racecourse',
  'sha-tin-racecourse': 'Sha Tin Racecourse',
  'happy-valley-racecourse': 'Happy Valley Racecourse',
  'meydan-racecourse': 'Meydan Racecourse',
};

const authorityLabelById: Record<string, string> = {
  jra: 'JRA',
  hkjc: 'HKJC',
  'nar-local-government-racing': 'NAR',
  'banei-tokachi': 'Banei Tokachi',
  'emirates-racing-authority': 'Emirates Racing Authority',
};

const countryLabelById: Record<string, string> = {
  japan: 'Japan',
  'hong-kong': 'Hong Kong',
  'united-arab-emirates': 'United Arab Emirates',
};

const titleCaseId = (value: string) =>
  value
    .replace(/-racecourse$/, '')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const displayRacecourse = (racecourseId: string) =>
  racecourseNameById[racecourseId] ?? `${titleCaseId(racecourseId)} Racecourse`;
const displayAuthority = (authorityId: string) =>
  authorityLabelById[authorityId] ?? titleCaseId(authorityId);
const displayCountry = (countryId: string) =>
  countryLabelById[countryId] ?? titleCaseId(countryId);

function toMeetingRow(record: PublicTimetableMeetingRow): TimetableMeetingRow {
  const effectiveRank = record.effective_public_rank as CalendarRank;
  const canViewRaceTimetable =
    (effectiveRank === 'A' || effectiveRank === 'A+') &&
    record.detail_path !== null;

  return {
    meeting_id: record.meeting_id,
    date: record.date,
    country_id: record.country_id,
    country_label: displayCountry(record.country_id),
    authority_id: record.authority_id,
    authority_label: displayAuthority(record.authority_id),
    racecourse_id: record.racecourse_id,
    racecourse_name: displayRacecourse(record.racecourse_id),
    capability_rank: effectiveRank,
    first_race_time_local: record.first_race_time_local,
    last_race_time_local: record.last_race_time_local,
    official_source_url: record.official_source_url,
    detail_path: record.detail_path,
    can_view_race_timetable: canViewRaceTimetable,
    rank_weight: rankWeight[effectiveRank],
    source_status: record.source_status,
    last_checked_date: record.last_checked_date,
  };
}

export function getTimetableMeetingRows(): TimetableMeetingRow[] {
  return getPublicTimetableMeetingRows()
    .map(toMeetingRow)
    .sort((left, right) =>
      `${left.date}:${left.country_id}:${left.racecourse_name}:${left.first_race_time_local ?? '99:99'}:${left.meeting_id}`.localeCompare(
        `${right.date}:${right.country_id}:${right.racecourse_name}:${right.first_race_time_local ?? '99:99'}:${right.meeting_id}`,
      ),
    );
}

export function getTimetableMeetingRowsForDate(date: string): TimetableMeetingRow[] {
  return filterRecordsForDate(getTimetableMeetingRows(), date) as TimetableMeetingRow[];
}

export function getTimetableMeetingRowsForWindow(startDate: string, endDateExclusive: string): TimetableMeetingRow[] {
  return filterRecordsForWindow(getTimetableMeetingRows(), startDate, endDateExclusive) as TimetableMeetingRow[];
}

export function getTimetableDateContext() {
  return createCalendarDateContext();
}

export function getCurrentCalendarWindowMeetingRows(context = getTimetableDateContext()) {
  return getTimetableMeetingRowsForWindow(context.windowStart, context.windowEndExclusive);
}

export function getGroupedTimetableMeetingRows(
  records = getTimetableMeetingRows(),
): TimetableMeetingDayGroup[] {
  const recordsByDate = records.reduce((groups, record) => {
    groups[record.date] ??= [];
    groups[record.date].push(record);
    return groups;
  }, {} as Record<string, TimetableMeetingRow[]>);

  return Object.entries(recordsByDate)
    .map(([date, dayRecords]) => ({ date, records: dayRecords }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function getCurrentCalendarWindowGroups(context = getTimetableDateContext()) {
  return getGroupedTimetableMeetingRows(getCurrentCalendarWindowMeetingRows(context));
}

export function getTimetableDataState(context = getTimetableDateContext()) {
  return evaluateCalendarDataState({
    records: getTimetableMeetingRows(),
    generatedAt: getPublicTimetableGeneratedAt(),
    context,
  });
}

export function getCurrentTimetableDate() {
  return getTimetableDateContext().today;
}

export function getTomorrowTimetableDate() {
  return getTimetableDateContext().tomorrow;
}
