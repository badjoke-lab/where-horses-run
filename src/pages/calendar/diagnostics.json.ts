import canonicalMeetingsData from '../../../data/generated/timetable/canonical/meetings.json';
import canonicalDetailsData from '../../../data/generated/timetable/canonical/meeting-details.json';
import publicMeetingsData from '../../../data/generated/timetable/public/meeting-list.json';
import publicDetailsData from '../../../data/generated/timetable/public/meeting-details.json';

export const prerender = true;

type TimetableRow = {
  label?: string | null;
  post_time_local?: string | null;
  race_name?: string | null;
  distance_m?: number | null;
  surface?: string | null;
  course_label?: string | null;
};

type Coverage = {
  rows: number;
  time: number;
  race_name: number;
  distance: number;
  surface: number;
  course: number;
};

const validTime = (value: unknown) => typeof value === 'string' && /^\d{2}:\d{2}$/.test(value);
const nonEmpty = (value: unknown) => typeof value === 'string' && value.trim().length > 0;

function coverage(rowsInput: unknown): Coverage {
  const rows = Array.isArray(rowsInput) ? rowsInput as TimetableRow[] : [];
  return {
    rows: rows.length,
    time: rows.filter((row) => validTime(row.post_time_local)).length,
    race_name: rows.filter((row) => nonEmpty(row.race_name)).length,
    distance: rows.filter((row) => Number.isFinite(row.distance_m) && Number(row.distance_m) > 0).length,
    surface: rows.filter((row) => nonEmpty(row.surface)).length,
    course: rows.filter((row) => nonEmpty(row.course_label)).length,
  };
}

export function GET() {
  const canonicalMeetings = (canonicalMeetingsData as any).meetings ?? [];
  const canonicalDetails = new Map(((canonicalDetailsData as any).details ?? []).map((detail: any) => [detail.meeting_id, detail]));
  const publicMeetings = new Map(((publicMeetingsData as any).meetings ?? []).map((meeting: any) => [meeting.meeting_id, meeting]));
  const publicDetails = new Map(((publicDetailsData as any).details ?? []).map((detail: any) => [detail.meeting_id, detail]));

  const meetings = canonicalMeetings.map((meeting: any) => {
    const canonicalDetail: any = canonicalDetails.get(meeting.meeting_id) ?? null;
    const publicMeeting: any = publicMeetings.get(meeting.meeting_id) ?? null;
    const publicDetail: any = publicDetails.get(meeting.meeting_id) ?? null;
    return {
      meeting_id: meeting.meeting_id,
      racecourse_id: meeting.racecourse_id,
      date: meeting.date,
      canonical_rank: meeting.capability_rank ?? null,
      effective_public_rank: publicMeeting?.effective_public_rank ?? null,
      disposition: meeting.acquisition_completion?.disposition ?? null,
      last_checked_date: meeting.freshness?.last_checked_date ?? publicMeeting?.last_checked_date ?? null,
      canonical: coverage(canonicalDetail?.timetable_rows),
      public: coverage(publicDetail?.timetable_rows),
    };
  });

  return new Response(JSON.stringify({
    generated_at: (canonicalMeetingsData as any).generated_at ?? null,
    meetings,
  }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
