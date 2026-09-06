const RANKS = Object.freeze(['C', 'B', 'B+', 'A', 'A+']);

export function validPostTime(value) {
  return typeof value === 'string' && /^\d{2}:\d{2}$/.test(value);
}

function raceNumberFromLabel(label) {
  if (typeof label !== 'string') return null;
  const match = label.match(/(?:Race\s*|^)(\d{1,2})(?:\s*R)?$/i) ?? label.match(/^(\d{1,2})R$/i);
  return match ? Number(match[1]) : null;
}

function normalizeEvidenceRows(rows = []) {
  return (Array.isArray(rows) ? rows : []).map((row, index) => ({
    label: row?.label ?? row?.race_label ?? `Race ${index + 1}`,
    post_time_local: row?.post_time_local ?? row?.post_time ?? null,
    race_name: row?.race_name ?? null,
    distance_m: row?.distance_m ?? null,
    surface: row?.surface ?? null,
    course_label: row?.course_label ?? null,
  }));
}

function rowHasRaceTime(row) {
  return typeof row?.label === 'string'
    && row.label.length > 0
    && validPostTime(row.post_time_local);
}

function rowHasAPlusMetadata(row) {
  return rowHasRaceTime(row)
    && typeof row.race_name === 'string'
    && row.race_name.length > 0
    && Number.isInteger(row.distance_m)
    && row.distance_m > 0
    && typeof row.surface === 'string'
    && row.surface.length > 0
    && typeof row.course_label === 'string'
    && row.course_label.length > 0;
}

function rowsAreContinuous(rows) {
  if (!rows.length || !rows.every(rowHasRaceTime)) return false;
  const numbers = rows.map((row) => raceNumberFromLabel(row.label));
  if (numbers.every(Number.isInteger)) return numbers.every((number, index) => number === index + 1);
  return new Set(rows.map((row) => row.label)).size === rows.length;
}

/**
 * Derive the best available timetable rank only from normalized evidence.
 * Any adapter/collector-declared capability rank is intentionally ignored.
 */
export function deriveBestAvailableRank(record, rows = record?.timetable_rows ?? []) {
  const normalizedRows = normalizeEvidenceRows(rows);
  if (rowsAreContinuous(normalizedRows)) {
    return normalizedRows.every(rowHasAPlusMetadata) ? 'A+' : 'A';
  }

  const first = record?.first_race_time_local ?? normalizedRows[0]?.post_time_local ?? null;
  const last = record?.last_race_time_local ?? normalizedRows.at(-1)?.post_time_local ?? null;
  if (validPostTime(first) && validPostTime(last)) return 'B+';
  if (validPostTime(first)) return 'B';
  return 'C';
}

export function rankIndex(value) {
  return RANKS.indexOf(value);
}
