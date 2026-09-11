import { isCalendarSupportedCountry } from './calendarPublicCountrySupport';

export type PublicRacecourseCandidate = {
  id?: string | null;
  country_id?: string | null;
  status?: string | null;
};

const PUBLIC_ACTIVE_STATUSES = new Set(['active', 'current']);

// Legacy duplicate identities must not create a second public racecourse row.
// Hipódromo Chile is canonically `hipodromo-chile`; the older country-page
// record remains in the enrichment dataset until that source file is retired.
const LEGACY_DUPLICATE_PUBLIC_IDS = new Set([
  'hipodromo-chile-racecourse',
]);

export function isPublicActiveRacecourse(racecourse: PublicRacecourseCandidate): boolean {
  return typeof racecourse.country_id === 'string'
    && isCalendarSupportedCountry(racecourse.country_id)
    && typeof racecourse.status === 'string'
    && PUBLIC_ACTIVE_STATUSES.has(racecourse.status)
    && (typeof racecourse.id !== 'string' || !LEGACY_DUPLICATE_PUBLIC_IDS.has(racecourse.id));
}
