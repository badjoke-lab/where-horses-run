import { isCalendarSupportedCountry } from './calendarPublicCountrySupport';

export type PublicRacecourseCandidate = {
  country_id?: string | null;
  status?: string | null;
};

const PUBLIC_ACTIVE_STATUSES = new Set(['active', 'current']);

export function isPublicActiveRacecourse(racecourse: PublicRacecourseCandidate): boolean {
  return typeof racecourse.country_id === 'string'
    && isCalendarSupportedCountry(racecourse.country_id)
    && typeof racecourse.status === 'string'
    && PUBLIC_ACTIVE_STATUSES.has(racecourse.status);
}
