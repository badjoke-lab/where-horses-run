import countries from '../../data/static/countries.json';
import legacyCountryProfiles from '../../data/static/country-profiles.json';
import countryProfilesV2 from '../../data/static/country-profiles-v2.json';
import racecourses from '../../data/static/racecourses.json';
import racecourseExtensions from '../../data/static/racecourses-extensions.json';
import racecourseProfileOverrides from '../../data/static/racecourse-profile-overrides.json';
import sources from '../../data/static/sources.json';
import glossary from '../../data/static/glossary.json';
import archive from '../../data/static/archive.json';
import countryRacingInventory from '../../data/static/country-racing-inventory.json';
import latest from '../../data/generated/latest.json';
import today from '../../data/generated/today.json';
import tomorrow from '../../data/generated/tomorrow.json';
import calendar30d from '../../data/generated/calendar-30d.json';
import fetchStatus from '../../data/generated/fetch-status.json';
import liveFetchProbeStatus from '../../data/generated/live-fetch-probe-status.json';
import timetables from '../../data/generated/timetables.json';
import japanActiveTimetableRecords from '../../data/generated/japan-active-timetable-records.json';
import {
  buildCountryDetailProfiles,
  type CountryDetailProfile
} from './country-profile-runtime';

export type Locale = 'en' | 'ja';

const racecourseOverrideById = new Map(racecourseProfileOverrides.map((override) => [override.id, override]));
const allRacecourses = [...racecourses, ...racecourseExtensions].map((racecourse) => ({
  ...racecourse,
  ...(racecourseOverrideById.get(racecourse.id) ?? {})
})) as const;
const countryProfiles = buildCountryDetailProfiles(countryProfilesV2, legacyCountryProfiles);

export type Country = (typeof countries)[number];
export type CountryProfile = CountryDetailProfile;
export type Racecourse = (typeof allRacecourses)[number];
export type Source = (typeof sources)[number];
export type GlossaryEntry = (typeof glossary)[number];
export type ArchiveEntry = (typeof archive)[number];

const mergedTimetables = {
  ...timetables,
  records: [...(timetables.records ?? []), ...(japanActiveTimetableRecords.records ?? [])],
  sources: [...new Set([...(timetables.sources ?? []), ...(japanActiveTimetableRecords.sources ?? [])])],
  notes: [...(timetables.notes ?? []), ...(japanActiveTimetableRecords.notes ?? [])]
} as const;

export const siteData = {
  countries,
  countryProfiles,
  racecourses: allRacecourses,
  sources,
  glossary,
  archive,
  countryRacingInventory,
  generated: {
    latest,
    today,
    tomorrow,
    calendar30d,
    fetchStatus,
    liveFetchProbeStatus,
    timetables: mergedTimetables,
    japanActiveTimetableRecords
  }
} as const;

export function getCountries(): Country[] {
  return [...countries].sort((a, b) => a.name_en.localeCompare(b.name_en));
}

export function getActiveCountries(): Country[] {
  return getCountries().filter((country) => country.status === 'active');
}

export function getCountryBySlug(slug: string): Country | undefined {
  return countries.find((country) => country.slug === slug);
}

export function getCountryProfileByCountryId(countryId: string): CountryProfile | undefined {
  return countryProfiles.find((profile) => profile.country_id === countryId);
}

export function getCountryProfileBySlug(slug: string): CountryProfile | undefined {
  return countryProfiles.find((profile) => profile.slug === slug);
}

export function getRacecourses(): Racecourse[] {
  return [...allRacecourses].sort((a, b) => a.name_en.localeCompare(b.name_en));
}

export function getRacecoursesByCountryId(countryId: string): Racecourse[] {
  return getRacecourses().filter((racecourse) => racecourse.country_id === countryId);
}

export function getRacecourseBySlug(slug: string): Racecourse | undefined {
  return allRacecourses.find((racecourse) => racecourse.slug === slug);
}

export function getSourcesByCountryId(countryId: string): Source[] {
  return sources.filter((source) => source.country_id === countryId);
}

export function getGlossaryEntries(): GlossaryEntry[] {
  return [...glossary].sort((a, b) => a.term_en.localeCompare(b.term_en));
}

export function getGlossaryEntryBySlug(slug: string): GlossaryEntry | undefined {
  return glossary.find((entry) => entry.slug === slug);
}

export function getArchiveEntries(): ArchiveEntry[] {
  return [...archive].sort((a, b) => a.name_en.localeCompare(b.name_en));
}
