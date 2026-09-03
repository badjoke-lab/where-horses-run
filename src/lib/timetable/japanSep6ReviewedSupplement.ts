import reviewedData from '../../../data/static/japan-2026-09-06-kochi-reviewed-a-plus-v1.json';

const data = reviewedData as {
  readonly records: readonly {
    readonly meeting: Record<string, unknown> & { readonly meeting_id: string };
    readonly detail: Record<string, unknown> & { readonly meeting_id: string };
  }[];
};

export const japanSep6ReviewedMeetingIds = new Set(
  data.records.map(({ meeting }) => meeting.meeting_id),
);

export const japanSep6ReviewedMeetingRows = data.records.map(({ meeting }) => meeting);
export const japanSep6ReviewedMeetingDetails = data.records.map(({ detail }) => detail);
