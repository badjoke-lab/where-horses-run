const RANKS = Object.freeze(['C', 'B', 'B+', 'A', 'A+']);
const RANK_INDEX = new Map(RANKS.map((rank, index) => [rank, index]));
const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const A_PLUS_ROW_FIELDS = Object.freeze([
  'label',
  'post_time_local',
  'race_name',
  'distance_m',
  'surface',
  'course_label',
]);

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validTime(value) {
  return typeof value === 'string' && TIME_RE.test(value);
}

function validDistance(value) {
  return Number.isInteger(value) && value > 0;
}

function hasMeetingIdentity(observation) {
  return Boolean(
    observation
    && nonEmptyString(observation.meeting_id)
    && nonEmptyString(observation.date)
    && nonEmptyString(observation.racecourse_id)
  );
}

function validARow(row) {
  return row && nonEmptyString(row.label) && validTime(row.post_time_local);
}

function validAPlusRow(row) {
  return validARow(row)
    && nonEmptyString(row.race_name)
    && validDistance(row.distance_m)
    && nonEmptyString(row.surface)
    && nonEmptyString(row.course_label);
}

export function classifyTimetableObservationV1(observation) {
  const errors = [];
  if (!hasMeetingIdentity(observation)) errors.push('meeting identity requires meeting_id, date, and racecourse_id');

  const first = observation?.first_race_time_local ?? null;
  const last = observation?.last_race_time_local ?? null;
  const rows = observation?.timetable_rows ?? [];

  if (first !== null && !validTime(first)) errors.push('first_race_time_local must be null or HH:MM');
  if (last !== null && !validTime(last)) errors.push('last_race_time_local must be null or HH:MM');
  if (last !== null && first === null) errors.push('last race time cannot exist without first race time');
  if (!Array.isArray(rows)) errors.push('timetable_rows must be an array');

  if (Array.isArray(rows) && rows.length > 0) {
    if (first === null || last === null) errors.push('per-race rows require first and last race times');
    rows.forEach((row, index) => {
      if (!validARow(row)) errors.push(`timetable_rows[${index}] requires non-empty label and valid post_time_local`);
    });
    if (rows.length > 0 && validTime(first) && validARow(rows[0]) && rows[0].post_time_local !== first) {
      errors.push('first_race_time_local must match first row post_time_local');
    }
    if (rows.length > 0 && validTime(last) && validARow(rows.at(-1)) && rows.at(-1).post_time_local !== last) {
      errors.push('last_race_time_local must match last row post_time_local');
    }
  }

  if (errors.length) return Object.freeze({ ok: false, rank: null, errors: Object.freeze(errors) });

  let rank = 'C';
  if (first !== null) rank = 'B';
  if (first !== null && last !== null) rank = 'B+';
  if (Array.isArray(rows) && rows.length > 0) {
    rank = rows.every(validAPlusRow) ? 'A+' : 'A';
  }

  return Object.freeze({ ok: true, rank, errors: Object.freeze([]) });
}

export function resolveMonotonicReviewedRankV1(currentReviewedRank, observedRank) {
  if (!RANK_INDEX.has(currentReviewedRank)) throw new Error(`unknown current reviewed rank: ${currentReviewedRank}`);
  if (!RANK_INDEX.has(observedRank)) throw new Error(`unknown observed rank: ${observedRank}`);
  return RANK_INDEX.get(observedRank) > RANK_INDEX.get(currentReviewedRank)
    ? observedRank
    : currentReviewedRank;
}

export function compareTimetableRanksV1(left, right) {
  if (!RANK_INDEX.has(left) || !RANK_INDEX.has(right)) throw new Error(`unknown rank comparison: ${left} / ${right}`);
  return Math.sign(RANK_INDEX.get(left) - RANK_INDEX.get(right));
}

export const fiveRankClassifierV1Contract = Object.freeze({
  ranks: RANKS,
  aPlusRowFields: A_PLUS_ROW_FIELDS,
});
