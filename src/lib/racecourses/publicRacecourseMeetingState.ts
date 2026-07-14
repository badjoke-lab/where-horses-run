import { createCalendarDateContext } from '../timetable/calendarDateContext.mjs';
import {
  getPublicTimetableGeneratedAt,
  getPublicTimetableMeetingRowsByRacecourse,
  type PublicTimetableMeetingRow,
} from '../timetable/publicTimetableViewModel';

export type PublicRacecourseMeetingState = {
  readonly racecourse_id: string;
  readonly generated_at: string;
  readonly reference_date: string;
  readonly timezone: string;
  readonly window_start: string;
  readonly window_end_inclusive: string;
  readonly total_public_meeting_count: number;
  readonly today_meetings: readonly PublicTimetableMeetingRow[];
  readonly next_meeting_date: string | null;
  readonly next_meetings: readonly PublicTimetableMeetingRow[];
  readonly upcoming_meetings: readonly PublicTimetableMeetingRow[];
};

const byDateAndId = (left: PublicTimetableMeetingRow, right: PublicTimetableMeetingRow) =>
  left.date.localeCompare(right.date) || left.meeting_id.localeCompare(right.meeting_id);

export function getPublicRacecourseMeetingState(
  racecourseId: string,
  timezone: string,
): PublicRacecourseMeetingState {
  const context = createCalendarDateContext({ timeZone: timezone });
  const meetings = [...getPublicTimetableMeetingRowsByRacecourse(racecourseId)].sort(byDateAndId);
  const windowMeetings = meetings.filter(
    (meeting) => meeting.date >= context.windowStart && meeting.date < context.windowEndExclusive,
  );
  const todayMeetings = windowMeetings.filter((meeting) => meeting.date === context.today);
  const upcomingMeetings = windowMeetings.filter((meeting) => meeting.date > context.today);
  const nextMeetingDate = upcomingMeetings[0]?.date ?? null;
  const nextMeetings = nextMeetingDate
    ? upcomingMeetings.filter((meeting) => meeting.date === nextMeetingDate)
    : [];

  return {
    racecourse_id: racecourseId,
    generated_at: getPublicTimetableGeneratedAt(),
    reference_date: context.today,
    timezone: context.timeZone,
    window_start: context.windowStart,
    window_end_inclusive: context.windowEndInclusive,
    total_public_meeting_count: meetings.length,
    today_meetings: todayMeetings,
    next_meeting_date: nextMeetingDate,
    next_meetings: nextMeetings,
    upcoming_meetings: upcomingMeetings,
  };
}
