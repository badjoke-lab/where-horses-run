import reviewedData from '../../../data/static/japan-2026-09-05-reviewed-a-plus-v1.json';

const data = reviewedData as {
  readonly records: readonly {
    readonly meeting: Record<string, unknown> & { readonly meeting_id: string };
    readonly detail: Record<string, unknown> & { readonly meeting_id: string };
  }[];
};

export const japanSep5ReviewedMeetingIds = new Set(
  data.records.map(({ meeting }) => meeting.meeting_id),
);

export const japanSep5ReviewedMeetingRows = data.records.map(({ meeting }) => meeting);
export const japanSep5ReviewedMeetingDetails = data.records.map(({ detail }) => detail);
