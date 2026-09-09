const PRECISE_RANKS = new Set(['B+', 'A', 'A+']);
const DAY_ONLY_RANKS = new Set(['C', 'B']);
const CURRENT_DAY_PRECISE_STATES = new Set(['upcoming', 'running', 'ended']);

export function isPreciseMeetingPresentationRank(rank) {
  return PRECISE_RANKS.has(rank);
}

/**
 * Derive the public presentation state from reviewed rank, Calendar-day relation,
 * and the separately-derived lifecycle state.
 *
 * Lifecycle remains source/venue-local authoritative. This helper only decides
 * how that truth is presented in the active Calendar date context.
 */
export function deriveMeetingPresentationState({ rank, calendarDayState, lifecycleState }) {
  if (calendarDayState === 'future') return 'future';
  if (calendarDayState === 'today' && DAY_ONLY_RANKS.has(rank)) return 'today';

  if (calendarDayState === 'today') {
    if (PRECISE_RANKS.has(rank) && CURRENT_DAY_PRECISE_STATES.has(lifecycleState)) return lifecycleState;
    return 'unknown';
  }

  if (calendarDayState === 'past' && PRECISE_RANKS.has(rank) && lifecycleState === 'ended') return 'ended';

  return 'unknown';
}
