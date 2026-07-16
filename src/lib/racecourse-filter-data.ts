import { getCountries, getRacecourses, type Racecourse } from './data';
import { getRacingTypeById } from './racingTypes';

export type RacecourseDirectoryLocale = 'en' | 'ja';

export interface RacecourseFilterReference {
  id: string;
  label: string;
  href: string;
}

export interface RacecourseFilterRecord {
  id: string;
  slug: string;
  href: string;
  name: string;
  alternateName: string;
  localName: string;
  countryId: string;
  countryName: string;
  countryHref: string;
  city: string;
  region: string;
  racingTypes: RacecourseFilterReference[];
  surfaces: string[];
  direction: string;
  status: string;
  scheduleStatus: string;
  courseProfileStatus: string;
  searchText: string;
}

export interface RacecourseFilterOptions {
  countries: RacecourseFilterReference[];
  racingTypes: RacecourseFilterReference[];
  surfaces: string[];
}

type FilterableRacecourse = Racecourse & {
  name_local?: string;
  city?: string;
  region?: string;
  racing_types?: readonly string[];
  surfaces?: readonly string[];
  direction?: string;
  status?: string;
  schedule_summary?: { status?: string };
  data_status?: { course_profile?: string };
};

export function normalizeRacecourseFilterText(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function nonempty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(nonempty))].sort((left, right) => left.localeCompare(right, 'en'));
}

function humanize(value: string): string {
  return value
    .split('-')
    .map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : part)
    .join(' ');
}

export function getRacecourseFilterRecords(locale: RacecourseDirectoryLocale): RacecourseFilterRecord[] {
  const isJapanese = locale === 'ja';
  const countries = getCountries();
  const countryById = new Map(countries.map((country) => [country.id, country]));

  return getRacecourses().map((sourceRacecourse) => {
    const racecourse = sourceRacecourse as unknown as FilterableRacecourse;
    const country = countryById.get(racecourse.country_id);
    const name = isJapanese ? racecourse.name_ja : racecourse.name_en;
    const alternateName = isJapanese ? racecourse.name_en : racecourse.name_ja;
    const localName = nonempty(racecourse.name_local) ? racecourse.name_local : '';
    const countryName = country
      ? isJapanese ? country.name_ja : country.name_en
      : racecourse.country_id;
    const countryHref = country
      ? isJapanese ? `/ja/countries/${country.slug}/` : `/countries/${country.slug}/`
      : '';
    const racingTypes = uniqueStrings([...(racecourse.racing_types ?? [])]).map((id) => {
      const type = getRacingTypeById(id);
      return {
        id,
        label: type ? isJapanese ? type.name_ja : type.name_en : humanize(id),
        href: type ? isJapanese ? `/ja/types/${type.slug}/` : `/types/${type.slug}/` : '',
      };
    });
    const surfaces = uniqueStrings([...(racecourse.surfaces ?? [])]);
    const city = nonempty(racecourse.city) ? racecourse.city : '';
    const region = nonempty(racecourse.region) ? racecourse.region : '';
    const direction = nonempty(racecourse.direction) ? racecourse.direction : 'unknown';
    const status = nonempty(racecourse.status) ? racecourse.status : 'unknown';
    const scheduleStatus = nonempty(racecourse.schedule_summary?.status)
      ? racecourse.schedule_summary.status
      : 'official-link-only';
    const courseProfileStatus = nonempty(racecourse.data_status?.course_profile)
      ? racecourse.data_status.course_profile
      : 'partial';
    const href = isJapanese ? `/ja/tracks/${racecourse.slug}/` : `/tracks/${racecourse.slug}/`;
    const searchText = normalizeRacecourseFilterText([
      racecourse.id,
      racecourse.slug,
      racecourse.name_en,
      racecourse.name_ja,
      localName,
      country?.name_en,
      country?.name_ja,
      countryName,
      city,
      region,
      direction,
      status,
      scheduleStatus,
      courseProfileStatus,
      ...racingTypes.flatMap((type) => [type.id, type.label]),
      ...surfaces,
    ].filter(nonempty).join(' '));

    return {
      id: racecourse.id,
      slug: racecourse.slug,
      href,
      name,
      alternateName,
      localName,
      countryId: racecourse.country_id,
      countryName,
      countryHref,
      city,
      region,
      racingTypes,
      surfaces,
      direction,
      status,
      scheduleStatus,
      courseProfileStatus,
      searchText,
    };
  });
}

export function getRacecourseFilterOptions(records: RacecourseFilterRecord[]): RacecourseFilterOptions {
  const countryById = new Map<string, RacecourseFilterReference>();
  const racingTypeById = new Map<string, RacecourseFilterReference>();

  for (const record of records) {
    if (!countryById.has(record.countryId)) {
      countryById.set(record.countryId, {
        id: record.countryId,
        label: record.countryName,
        href: record.countryHref,
      });
    }
    for (const type of record.racingTypes) {
      if (!racingTypeById.has(type.id)) racingTypeById.set(type.id, type);
    }
  }

  return {
    countries: [...countryById.values()].sort((left, right) => left.label.localeCompare(right.label)),
    racingTypes: [...racingTypeById.values()].sort((left, right) => left.label.localeCompare(right.label)),
    surfaces: uniqueStrings(records.flatMap((record) => record.surfaces)),
  };
}
