import supportRegistry from '../../data/static/calendar-public-country-support-v1.json';

export type CalendarPublicCountrySupportRecord = {
  country_id: string;
  calendar_supported: boolean;
  acquisition_key: string;
};

const supportRecords = supportRegistry.countries as CalendarPublicCountrySupportRecord[];
const supportedCountryIds = new Set(
  supportRecords
    .filter((record) => record.calendar_supported)
    .map((record) => record.country_id),
);

export function isCalendarSupportedCountry(countryId: string): boolean {
  return supportedCountryIds.has(countryId);
}

export function getCalendarSupportedCountryIds(): string[] {
  return [...supportedCountryIds];
}

export function getCalendarPublicCountrySupportRecords(): CalendarPublicCountrySupportRecord[] {
  return supportRecords.map((record) => ({ ...record }));
}
