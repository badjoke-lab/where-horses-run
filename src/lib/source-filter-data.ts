import { getCountries, siteData, type Source } from './data';

export type SourceDirectoryLocale = 'en' | 'ja';

export interface SourceFilterReference {
  id: string;
  label: string;
  href: string;
}

export interface SourceFilterRecord {
  id: string;
  url: string;
  countryId: string;
  countryName: string;
  countryHref: string;
  sourceType: string;
  dataType: string;
  autoLevel: string;
  termsRisk: string;
  registryStatus: string;
  notes: string;
  searchText: string;
}

export interface SourceFilterOptions {
  countries: SourceFilterReference[];
  sourceTypes: string[];
  dataTypes: string[];
  autoLevels: string[];
  termsRisks: string[];
  registryStatuses: string[];
}

type FilterableSource = Source & {
  notes?: string;
  m3_status?: string;
  terms_risk?: string;
  source_type?: string;
  data_type?: string;
  auto_level?: string;
};

export function normalizeSourceFilterText(value: string): string {
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

export function getSourceFilterRecords(locale: SourceDirectoryLocale): SourceFilterRecord[] {
  const isJapanese = locale === 'ja';
  const countries = getCountries();
  const countryById = new Map(countries.map((country) => [country.id, country]));

  return siteData.sources
    .map((sourceRecord) => {
      const source = sourceRecord as unknown as FilterableSource;
      const country = countryById.get(source.country_id);
      const countryName = country
        ? isJapanese ? country.name_ja : country.name_en
        : source.country_id;
      const countryHref = country
        ? isJapanese ? `/ja/sources/${country.slug}/` : `/sources/${country.slug}/`
        : '';
      const sourceType = nonempty(source.source_type) ? source.source_type : 'not_recorded';
      const dataType = nonempty(source.data_type) ? source.data_type : 'not_recorded';
      const autoLevel = nonempty(source.auto_level) ? source.auto_level : 'not_recorded';
      const termsRisk = nonempty(source.terms_risk) ? source.terms_risk : 'not_recorded';
      const registryStatus = nonempty(source.m3_status) ? source.m3_status : 'not_recorded';
      const notes = nonempty(source.notes) ? source.notes : '';
      const searchText = normalizeSourceFilterText([
        source.id,
        source.url,
        source.country_id,
        country?.name_en,
        country?.name_ja,
        countryName,
        sourceType,
        dataType,
        autoLevel,
        termsRisk,
        registryStatus,
        notes,
      ].filter(nonempty).join(' '));

      return {
        id: source.id,
        url: source.url,
        countryId: source.country_id,
        countryName,
        countryHref,
        sourceType,
        dataType,
        autoLevel,
        termsRisk,
        registryStatus,
        notes,
        searchText,
      };
    })
    .sort((left, right) => left.id.localeCompare(right.id, 'en'));
}

export function getSourceFilterOptions(records: SourceFilterRecord[]): SourceFilterOptions {
  const countryById = new Map<string, SourceFilterReference>();
  for (const record of records) {
    if (!countryById.has(record.countryId)) {
      countryById.set(record.countryId, {
        id: record.countryId,
        label: record.countryName,
        href: record.countryHref,
      });
    }
  }

  return {
    countries: [...countryById.values()].sort((left, right) => left.label.localeCompare(right.label)),
    sourceTypes: uniqueStrings(records.map((record) => record.sourceType)),
    dataTypes: uniqueStrings(records.map((record) => record.dataType)),
    autoLevels: uniqueStrings(records.map((record) => record.autoLevel)),
    termsRisks: uniqueStrings(records.map((record) => record.termsRisk)),
    registryStatuses: uniqueStrings(records.map((record) => record.registryStatus)),
  };
}
