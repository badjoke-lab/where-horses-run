const GENERIC_NAR_RACE_NAMES = new Set([
  '特別',
  '重賞',
  '準重賞',
  '一般',
  '新馬',
  '未勝利',
]);

export function normalizeNarRaceName(value) {
  const normalized = String(value ?? '').replace(/[\s\u3000]+/g, ' ').trim();
  if (!normalized) return null;
  if (GENERIC_NAR_RACE_NAMES.has(normalized)) return null;
  return normalized;
}

export function isGenericNarRaceName(value) {
  const normalized = String(value ?? '').replace(/[\s\u3000]+/g, ' ').trim();
  return GENERIC_NAR_RACE_NAMES.has(normalized);
}

export function genericNarRaceNames() {
  return [...GENERIC_NAR_RACE_NAMES];
}
