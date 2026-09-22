export const SOREC_NON_RUNNING_CALENDAR_URL =
  'https://www.sorec-galop.ma/pages/course_a_venir/calendrier_course.jsf?code=CALEN&description=Calendrier+courses&fctID=1406';

export const SOREC_NON_RUNNING_SOURCE_ID = 'sorec-calendar-explicit-postponement';

function assertOfficialSource(sourceUrl) {
  const url = new URL(sourceUrl);
  if (url.protocol !== 'https:' || url.hostname !== 'www.sorec-galop.ma') {
    throw new Error('SOREC non-running evidence requires official www.sorec-galop.ma source');
  }
  if (url.pathname !== '/pages/course_a_venir/calendrier_course.jsf'\n    || url.searchParams.get('code') !== 'CALEN'\n    || url.searchParams.get('description') !== 'Calendrier courses'\n    || url.searchParams.get('fctID') !== '1406') {
    throw new Error('SOREC non-running evidence requires the official status-bearing calendar route');
  }
}

function isoDate(year, month, day) {
  const value = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? null : value;
}

function decodeCalendarKey(value) {
  const key = String(value ?? '');
  if (!/^\d{7,8}$/.test(key)) return null;

  const year = Number(key.slice(-4));
  const monthCode = Number(key.slice(-6, -4));
  const day = Number(key.slice(0, -6));
  const month = monthCode - 10;
  if (!Number.isInteger(day) || !Number.isInteger(month) || day < 1 || day > 31 || month < 1 || month > 12) return null;
  return isoDate(year, month, day);
}

function replacementDateFromMessage(message) {
  const match = String(message ?? '').match(/\bau\s+(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})\b/i);
  if (!match) return null;
  const year = match[3].length === 2 ? Number(`20${match[3]}`) : Number(match[3]);
  return isoDate(year, Number(match[2]), Number(match[1]));
}

function extractAssignedArray(html) {
  const source = String(html ?? '');
  const assignment = source.match(/\bjoursEvenement\s*=\s*(?=\[)/i);
  if (!assignment || assignment.index == null) throw new Error('SOREC calendar fingerprint missing joursEvenement assignment');

  const start = assignment.index + assignment[0].length;
  if (source[start] !== '[') throw new Error('SOREC joursEvenement assignment is not an array');

  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '[') depth += 1;
    if (char === ']') {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error('SOREC joursEvenement array did not terminate');
}

function normalizeEventRows(value) {
  if (!Array.isArray(value)) throw new Error('SOREC joursEvenement must be an array');
  const rows = [];
  for (const row of value) {
    if (!Array.isArray(row) || row.length < 3) continue;
    const [calendarKey, status, message] = row;
    if (typeof calendarKey !== 'string' || typeof status !== 'string' || typeof message !== 'string') continue;
    rows.push({
      calendar_key: calendarKey,
      calendar_date: decodeCalendarKey(calendarKey),
      status: status.trim(),
      message: message.trim(),
    });
  }
  return rows;
}

export function parseSorecPostponementEvidenceHtml(html, {
  sourceUrl = SOREC_NON_RUNNING_CALENDAR_URL,
  startDate = null,
  endDateExclusive = null,
} = {}) {
  assertOfficialSource(sourceUrl);
  const source = String(html ?? '');
  if (!/id=(["'])legende-report\1[^>]*>\s*R[ée]union\s+report[ée]e/i.test(source)) {
    throw new Error('SOREC calendar fingerprint missing Réunion reportée legend');
  }
  if (!/d\s*\+\s*["']{2}\s*\+\s*\(m\s*\+\s*10\)\s*\+\s*["']{2}\s*\+\s*y/i.test(source)) {
    throw new Error('SOREC calendar key semantics fingerprint missing');
  }

  let parsed;
  try {
    parsed = JSON.parse(extractAssignedArray(source));
  } catch (error) {
    throw new Error(`SOREC joursEvenement parse failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  const rows = normalizeEventRows(parsed);
  const grouped = new Map();
  for (const row of rows) {
    if (!row.calendar_date) continue;
    if (!grouped.has(row.calendar_key)) grouped.set(row.calendar_key, []);
    grouped.get(row.calendar_key).push(row);
  }

  const evidence = [];
  const skipped = [];
  for (const [calendarKey, siblings] of grouped) {
    const reportRows = siblings.filter((row) => row.status === 'REPOR');
    if (!reportRows.length) continue;

    const originalDate = reportRows[0].calendar_date;
    if (startDate && originalDate < startDate) continue;
    if (endDateExclusive && originalDate >= endDateExclusive) continue;

    if (siblings.length !== 1 || reportRows.length !== 1) {
      skipped.push({
        calendar_key: calendarKey,
        date: originalDate,
        reason: 'conflicting_or_duplicate_statuses',
        statuses: siblings.map((row) => row.status),
      });
      continue;
    }

    const replacementDate = replacementDateFromMessage(reportRows[0].message);
    if (!replacementDate) {
      skipped.push({ calendar_key: calendarKey, date: originalDate, reason: 'replacement_date_missing' });
      continue;
    }
    if (!(replacementDate > originalDate)) {
      skipped.push({
        calendar_key: calendarKey,
        date: originalDate,
        replacement_date: replacementDate,
        reason: 'replacement_date_not_later',
      });
      continue;
    }

    evidence.push({
      date: originalDate,
      replacement_date: replacementDate,
      status: 'REPOR',
      evidence_phrase: reportRows[0].message,
      source_id: SOREC_NON_RUNNING_SOURCE_ID,
      official_source_url: sourceUrl,
    });
  }

  evidence.sort((left, right) => left.date.localeCompare(right.date));
  return {
    evidence,
    diagnostics: {
      event_row_count: rows.length,
      report_row_count: rows.filter((row) => row.status === 'REPOR').length,
      eligible_report_count: evidence.length,
      skipped,
    },
  };
}

function isSorecCanonicalMeeting(row) {
  return row?.country_id === 'morocco'
    && row?.authority_id === 'sorec'
    && row?.racing_system_id === 'sorec-racing-information-system';
}

export function bindSorecPostponementEvidence({
  evidence,
  canonicalMeetings,
  checkedAt = new Date().toISOString(),
}) {
  if (!Array.isArray(evidence)) throw new Error('SOREC evidence must be an array');
  if (!Array.isArray(canonicalMeetings)) throw new Error('SOREC canonicalMeetings must be an array');
  const checked = new Date(checkedAt);
  if (Number.isNaN(checked.getTime())) throw new Error('SOREC checkedAt must be an ISO date-time');

  const meetingPresenceRecords = [];
  const skipped = [];
  for (const item of evidence) {
    const matches = canonicalMeetings.filter((row) => isSorecCanonicalMeeting(row) && row.date === item.date);
    const unique = [...new Map(matches.map((row) => [row.meeting_id, row])).values()];
    if (unique.length !== 1) {
      skipped.push({
        date: item.date,
        replacement_date: item.replacement_date,
        reason: unique.length === 0 ? 'canonical_binding_missing' : 'canonical_binding_ambiguous',
        match_count: unique.length,
      });
      continue;
    }

    const meeting = unique[0];
    if (typeof meeting.racecourse_id !== 'string' || !meeting.racecourse_id) {
      skipped.push({ date: item.date, reason: 'canonical_racecourse_missing', meeting_id: meeting.meeting_id });
      continue;
    }
    const expectedMeetingId = `sorec-${meeting.racecourse_id}-${item.date}`;
    if (meeting.meeting_id !== expectedMeetingId) {
      skipped.push({
        date: item.date,
        reason: 'canonical_meeting_id_mismatch',
        meeting_id: meeting.meeting_id,
        expected_meeting_id: expectedMeetingId,
      });
      continue;
    }

    meetingPresenceRecords.push({
      meeting_id: meeting.meeting_id,
      country_id: 'morocco',
      authority_id: 'sorec',
      racecourse_id: meeting.racecourse_id,
      date: item.date,
      state: 'confirmed_non_running',
      scope: 'whole_meeting',
      evidence_type: 'official_explicit_non_running',
      source_id: SOREC_NON_RUNNING_SOURCE_ID,
      official_source_url: item.official_source_url,
      checked_at: checked.toISOString(),
      evidence_phrase: item.evidence_phrase,
    });
  }

  return { meeting_presence_records: meetingPresenceRecords, diagnostics: { skipped } };
}

export function buildSorecConfirmedNonRunningRecords({
  html,
  canonicalMeetings,
  sourceUrl = SOREC_NON_RUNNING_CALENDAR_URL,
  checkedAt = new Date().toISOString(),
  startDate = null,
  endDateExclusive = null,
}) {
  const parsed = parseSorecPostponementEvidenceHtml(html, { sourceUrl, startDate, endDateExclusive });
  const bound = bindSorecPostponementEvidence({
    evidence: parsed.evidence,
    canonicalMeetings,
    checkedAt,
  });
  return {
    meeting_presence_records: bound.meeting_presence_records,
    diagnostics: {
      ...parsed.diagnostics,
      binding_skipped: bound.diagnostics.skipped,
    },
  };
}
