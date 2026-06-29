import fs from 'node:fs';

const file = 'src/lib/data.ts';
const marker = 'const countryProfiles = buildCountryDetailProfiles(allProfilesV2);';
const original = fs.readFileSync(file, 'utf8');
const markerIndex = original.indexOf(marker);
if (markerIndex < 0) throw new Error('countryProfiles marker is missing');

const prefix = original.slice(0, markerIndex + marker.length);
const tail = `

export type Country = (typeof allCountries)[number];
export type CountryProfile = CountryDetailProfile;
export type Racecourse = (typeof allRacecourses)[number];
export type Source = (typeof allSources)[number];
export type GlossaryEntry = (typeof glossary)[number];
export type ArchiveEntry = (typeof archive)[number];

const mergedTimetables = {
  ...timetables,
  records: [...(timetables.records ?? []), ...(japanActiveTimetableRecords.records ?? [])],
  sources: [...new Set([...(timetables.sources ?? []), ...(japanActiveTimetableRecords.sources ?? [])])],
  notes: [...(timetables.notes ?? []), ...(japanActiveTimetableRecords.notes ?? [])]
} as const;

export const siteData = {
  countries: allCountries,
  countryProfiles,
  racecourses: allRacecourses,
  sources: allSources,
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
  return [...allCountries].sort((a, b) => a.name_en.localeCompare(b.name_en));
}

export function getActiveCountries(): Country[] {
  return getCountries().filter((country) => country.status === 'active');
}

export function getCountryBySlug(slug: string): Country | undefined {
  return allCountries.find((country) => country.slug === slug);
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
  return allSources.filter((source) => source.country_id === countryId);
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
`;

fs.writeFileSync(file, `${prefix}${tail}`);
console.log('REPAIRED_DATA_RUNTIME_45_52');
