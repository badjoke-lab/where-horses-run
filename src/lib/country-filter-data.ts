import { getCountries, type Country } from './data';

export type CountryDirectoryLocale = 'en' | 'ja';

export interface CountryFilterRecord {
  id: string;
  slug: string;
  href: string;
  name: string;
  alternateName: string;
  localName: string;
  summary: string;
  region: string;
  status: string;
  racingTypes: string[];
  coverageLevel: number;
  autoLevel: string;
  searchText: string;
}

export interface CountryFilterOptions {
  regions: string[];
  racingTypes: string[];
  statuses: string[];
  coverageLevels: number[];
}

type FilterableCountry = Country & {
  name_local?: string;
  racing_types?: readonly string[];
  summary_en?: string;
  summary_ja?: string;
  region?: string;
  status?: string;
  coverage_level?: number;
  auto_level?: string;
};

export function normalizeCountryFilterText(value: string): string {
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

export function getCountryFilterRecords(locale: CountryDirectoryLocale): CountryFilterRecord[] {
  const isJapanese = locale === 'ja';

  return getCountries().map((sourceCountry) => {
    const country = sourceCountry as unknown as FilterableCountry;
    const name = isJapanese ? country.name_ja : country.name_en;
    const alternateName = isJapanese ? country.name_en : country.name_ja;
    const localName = nonempty(country.name_local) ? country.name_local : '';
    const summary = isJapanese ? country.summary_ja ?? '' : country.summary_en ?? '';
    const region = nonempty(country.region) ? country.region : 'Unknown';
    const status = nonempty(country.status) ? country.status : 'unknown';
    const racingTypes = uniqueStrings([...(country.racing_types ?? [])]);
    const coverageLevel = Number.isFinite(country.coverage_level) ? Number(country.coverage_level) : 0;
    const autoLevel = nonempty(country.auto_level) ? country.auto_level : 'unknown';
    const href = isJapanese ? `/ja/countries/${country.slug}/` : `/countries/${country.slug}/`;
    const searchText = normalizeCountryFilterText([
      country.id,
      country.slug,
      country.name_en,
      country.name_ja,
      localName,
      summary,
      region,
      status,
      autoLevel,
      ...racingTypes,
    ].filter(nonempty).join(' '));

    return {
      id: country.id,
      slug: country.slug,
      href,
      name,
      alternateName,
      localName,
      summary,
      region,
      status,
      racingTypes,
      coverageLevel,
      autoLevel,
      searchText,
    };
  });
}

export function getCountryFilterOptions(records: CountryFilterRecord[]): CountryFilterOptions {
  return {
    regions: uniqueStrings(records.map((record) => record.region)),
    racingTypes: uniqueStrings(records.flatMap((record) => record.racingTypes)),
    statuses: uniqueStrings(records.map((record) => record.status)),
    coverageLevels: [...new Set(records.map((record) => record.coverageLevel))].sort((left, right) => left - right),
  };
}
