export const PUBLIC_RACECOURSE_LOCATION_STATES = Object.freeze(new Set(['reviewed', 'source_verified']));

export function isPublishableRacecourseMapLocation(entry) {
  const location = entry?.location;
  if (!entry || typeof entry.id !== 'string' || entry.id.trim() === '') return false;
  if (!location || typeof location !== 'object' || Array.isArray(location)) return false;
  if (location.publication_state === 'hold') return false;
  if (!PUBLIC_RACECOURSE_LOCATION_STATES.has(location.verification_state)) return false;
  if (!Number.isFinite(location.latitude) || location.latitude < -90 || location.latitude > 90) return false;
  if (!Number.isFinite(location.longitude) || location.longitude < -180 || location.longitude > 180) return false;
  if (typeof location.precision !== 'string' || location.precision.trim() === '') return false;
  if (typeof location.location_last_checked !== 'string' || location.location_last_checked.trim() === '') return false;
  return true;
}
