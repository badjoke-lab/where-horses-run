const isoDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
const isoDateTime = (value) => typeof value === 'string' && value.includes('T') && !Number.isNaN(Date.parse(value));

export const validateMeeting = (data) => {
  const errors = [];
  if (!isoDateTime(data.generated_at)) errors.push('generated_at is invalid');
  if (!isoDateTime(data.capture?.fetched_at)) errors.push('capture.fetched_at is invalid');
  if (!isoDate(data.meeting?.tested_meeting_date)) errors.push('meeting.tested_meeting_date is invalid');
  if (typeof data.meeting?.racecourse !== 'string' || !data.meeting.racecourse.trim()) errors.push('meeting.racecourse is required');
  if (!Number.isInteger(data.meeting?.race_count) || data.meeting.race_count < 0) errors.push('meeting.race_count is invalid');
  if (!Number.isInteger(data.capture?.http_status) || data.capture.http_status < 100 || data.capture.http_status > 599) errors.push('capture.http_status is invalid');
  return errors;
};
