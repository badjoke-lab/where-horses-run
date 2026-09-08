const PRECISE_RANKS = new Set(['B+', 'A', 'A+']);
const DAY_ONLY_RANKS = new Set(['C', 'B']);
const PRECISE_STATES = new Set(['upcoming', 'running', 'ended']);

export function isPreciseMeetingPresentationRank(rank) {
  return PRECISE_RANKS.has(rank);
}

export function deriveMeetingPresentationState({ rank, calendarDayState, lifecycleState }) {
  if (calendarDayState === 'today' && DAY_ONLY_RANKS.has(rank)) return 'today';
  if (PRECISE_RANKS.has(rank) && PRECISE_STATES.has(lifecycleState)) return lifecycleState;
  return 'unknown';
}
