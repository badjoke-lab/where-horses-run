import hkjcNormalizedMeetingDetailsSample from '../../data/generated/timetable/hkjc-normalized-meeting-details.sample.json';

export type NormalizedTimetableMeetingTimetableRow = {
  readonly label: string;
  readonly post_time_local: string;
  readonly race_name?: string | null;
  readonly distance_m?: number | null;
  readonly surface?: string | null;
  readonly course_label?: string | null;
  readonly metadata_status?: 'verified' | 'partial' | 'pending' | null;
  readonly detail_source_label?: string;
};

export type NormalizedTimetableMeetingDetail = {
  readonly meeting_id: string;
  readonly timetable_rows: readonly NormalizedTimetableMeetingTimetableRow[];
  readonly summary_note: string;
};

const normalizedTimetableMeetingDetails: readonly NormalizedTimetableMeetingDetail[] = [
  {
    meeting_id: 'jra-tokyo-racecourse-2026-06-07',
    summary_note:
      'This manually reviewed A-level sample stores public-safe post times only. Race names, entries, odds, results, and payout data are not stored or republished.',
    timetable_rows: [
      { label: 'Race 1', post_time_local: '10:05', detail_source_label: 'Official source' },
      { label: 'Race 2', post_time_local: '10:35', detail_source_label: 'Official source' },
      { label: 'Race 3', post_time_local: '11:05', detail_source_label: 'Official source' },
      { label: 'Race 4', post_time_local: '11:35', detail_source_label: 'Official source' },
      { label: 'Race 5', post_time_local: '12:25', detail_source_label: 'Official source' },
      { label: 'Race 6', post_time_local: '12:55', detail_source_label: 'Official source' },
      { label: 'Race 7', post_time_local: '13:25', detail_source_label: 'Official source' },
      { label: 'Race 8', post_time_local: '13:55', detail_source_label: 'Official source' },
      { label: 'Race 9', post_time_local: '14:30', detail_source_label: 'Official source' },
      { label: 'Race 10', post_time_local: '15:05', detail_source_label: 'Official source' },
      { label: 'Race 11', post_time_local: '15:45', detail_source_label: 'Official source' },
      { label: 'Race 12', post_time_local: '16:30', detail_source_label: 'Official source' },
    ],
  },
  ...(hkjcNormalizedMeetingDetailsSample.details as readonly NormalizedTimetableMeetingDetail[]),
];

export function getNormalizedTimetableMeetingDetail(
  meetingId: string,
): NormalizedTimetableMeetingDetail | undefined {
  return normalizedTimetableMeetingDetails.find((detail) => detail.meeting_id === meetingId);
}
