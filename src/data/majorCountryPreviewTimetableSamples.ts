import batch001PreviewTimetableSamples from '../../data/static/preview-timetable-samples-batch-001.json';
import batch002PreviewTimetableSamples from '../../data/static/preview-timetable-samples-batch-002.json';

type PreviewRace = {
  race_number: number;
  race_time: string;
  label: string;
};

export type PreviewTimetableSample = {
  preview_id: string;
  country_id: string;
  group_id: string;
  display_country: string;
  display_system: string;
  display_racecourse: string;
  display_meeting_date: string;
  display_first_race_time: string;
  display_races: PreviewRace[];
  official_source_url: string;
  source_capture_date: string;
  status_label: string;
  user_notice: string;
};

const sortPreviewSamples = (left: PreviewTimetableSample, right: PreviewTimetableSample) => {
  const leftKey = [
    left.display_country,
    left.display_system,
    left.display_meeting_date,
    left.display_racecourse,
  ].join('\u0000');
  const rightKey = [
    right.display_country,
    right.display_system,
    right.display_meeting_date,
    right.display_racecourse,
  ].join('\u0000');

  return leftKey.localeCompare(rightKey, 'en');
};

export const allPreviewTimetableSamples = [
  ...(batch001PreviewTimetableSamples.records as PreviewTimetableSample[]),
  ...(batch002PreviewTimetableSamples.records as PreviewTimetableSample[]),
].filter(
  (record) => record.country_id !== 'singapore' && `${record.country_id}/${record.group_id}` !== 'singapore/singapore-turf-club-legacy',
).sort(sortPreviewSamples);

export const previewTimetableSummary = {
  total_samples: allPreviewTimetableSamples.length,
  countries: [...new Set(allPreviewTimetableSamples.map((record) => record.display_country))].sort((left, right) =>
    left.localeCompare(right, 'en'),
  ),
  systems: [...new Set(allPreviewTimetableSamples.map((record) => record.display_system))].sort((left, right) =>
    left.localeCompare(right, 'en'),
  ),
  source_capture_dates: [...new Set(allPreviewTimetableSamples.map((record) => record.source_capture_date))].sort(),
  active_group_count: new Set(allPreviewTimetableSamples.map((record) => `${record.country_id}/${record.group_id}`)).size,
  legacy_group_count: 0,
  notice: [
    'Static manual samples only.',
    'This is not live coverage.',
    'Full country/date/racecourse coverage is not complete.',
  ],
};
