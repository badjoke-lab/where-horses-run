import {
  kawasakiReviewedMeetingDetails,
  kawasakiReviewedMeetingIds,
  kawasakiReviewedMeetingRows,
} from './kawasakiReviewedSupplement.ts';

export const baneiReviewedMeetingIds = new Set([
  ...kawasakiReviewedMeetingIds,
]);

export const baneiReviewedMeetingRows = [
  ...kawasakiReviewedMeetingRows,
] as const;

export const baneiReviewedMeetingDetails = [
  ...kawasakiReviewedMeetingDetails,
] as const;
