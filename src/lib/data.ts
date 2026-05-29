import countries from '../../data/static/countries.json';
import racecourses from '../../data/static/racecourses.json';
import sources from '../../data/static/sources.json';
import glossary from '../../data/static/glossary.json';
import archive from '../../data/static/archive.json';
import latest from '../../data/generated/latest.json';
import today from '../../data/generated/today.json';
import tomorrow from '../../data/generated/tomorrow.json';
import calendar30d from '../../data/generated/calendar-30d.json';
import fetchStatus from '../../data/generated/fetch-status.json';
import liveFetchProbeStatus from '../../data/generated/live-fetch-probe-status.json';
import timetables from '../../data/generated/timetables.json';

export type Locale = 'en' | 'ja';

export type Country = (typeof countries)[number];
export type Racecourse = (typeof racecourses)[number];
export type Source = (typeof sources)[number];
export type GlossaryEntry = (typeof glossary)[number];
export type ArchiveEntry = (typeof archive)[number];

export const siteData = {
  countries,
  racecourses,
  sources,
  glossary,
  archive,
  generated: {
    latest,
    today,
    tomorrow,
    calendar30d,
    fetchStatus,
    liveFetchProbeStatus,
    timetables
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

export function getRacecourses(): Racecourse[] {
  return [...racecourses].sort((a, b) => a.name_en.localeCompare(b.name_en));
}

export function getRacecoursesByCountryId(countryId: string): Racecourse[] {
  return getRacecourses().filter((racecourse) => racecourse.country_id === countryId);
}

export function getRacecourseBySlug(slug: string): Racecourse | undefined {
  return racecourses.find((racecourse) => racecourse.slug === slug);
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
