import baneiReviewedData0907 from '../../../data/static/banei-2026-09-07-public-detail-v1.json';
import {
  kawasakiReviewedMeetingDetails,
  kawasakiReviewedMeetingIds,
  kawasakiReviewedMeetingRows,
} from './kawasakiReviewedSupplement.ts';

export const baneiReviewedMeetingIds = new Set([
  'banei-obihiro-racecourse-2026-09-07',
  ...kawasakiReviewedMeetingIds,
]);

export const baneiReviewedMeetingRows = [
  baneiReviewedData0907.meeting,
  ...kawasakiReviewedMeetingRows,
] as const;

export const baneiReviewedMeetingDetails = [
  baneiReviewedData0907.detail,
  ...kawasakiReviewedMeetingDetails,
] as const;
