import baneiReviewedData0906 from '../../../data/static/banei-2026-09-06-public-detail-v1.json';
import baneiReviewedData0907 from '../../../data/static/banei-2026-09-07-public-detail-v1.json';

export const baneiReviewedMeetingIds = new Set([
  'banei-obihiro-racecourse-2026-09-06',
  'banei-obihiro-racecourse-2026-09-07',
]);

export const baneiReviewedMeetingRows = [
  baneiReviewedData0906.meeting,
  baneiReviewedData0907.meeting,
] as const;

export const baneiReviewedMeetingDetails = [
  baneiReviewedData0906.detail,
  baneiReviewedData0907.detail,
] as const;
