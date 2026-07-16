import { getCountries, getRacecourses } from './data';
import { getGlossaryEntries } from './glossary-data';

export type SearchLocale = 'en' | 'ja';
export type SearchRecordType = 'country' | 'racecourse' | 'glossary';

export type SearchRecord = {
  id: string;
  type: SearchRecordType;
  href: string;
  label: string;
  alternateLabel: string;
  description: string;
  meta: string;
  searchText: string;
};

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function joinSearchText(values: Array<string | null | undefined | string[]>): string {
  return normalizeSearchText(
    values
      .flatMap((value) => Array.isArray(value) ? value : [value])
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .join(' '),
  );
}

export function getGlobalSearchRecords(locale: SearchLocale): SearchRecord[] {
  const isJapanese = locale === 'ja';
  const countries = getCountries();
  const countryById = new Map(countries.map((country) => [country.id, country]));

  const countryRecords: SearchRecord[] = countries.map((country) => ({
    id: country.id,
    type: 'country',
    href: isJapanese ? `/ja/countries/${country.slug}/` : `/countries/${country.slug}/`,
    label: isJapanese ? country.name_ja : country.name_en,
    alternateLabel: isJapanese ? country.name_en : country.name_ja,
    description: isJapanese ? country.summary_ja : country.summary_en,
    meta: [country.region, country.name_local].filter(Boolean).join(' · '),
    searchText: joinSearchText([
      country.name_en,
      country.name_ja,
      country.name_local,
      country.region,
      country.racing_types,
      country.summary_en,
      country.summary_ja,
    ]),
  }));

  const racecourseRecords: SearchRecord[] = getRacecourses().map((racecourse) => {
    const country = countryById.get(racecourse.country_id);
    return {
      id: racecourse.id,
      type: 'racecourse',
      href: isJapanese ? `/ja/tracks/${racecourse.slug}/` : `/tracks/${racecourse.slug}/`,
      label: isJapanese ? racecourse.name_ja : racecourse.name_en,
      alternateLabel: isJapanese ? racecourse.name_en : racecourse.name_ja,
      description: isJapanese
        ? `${country?.name_ja ?? racecourse.country_id}にある競馬場。所在地・馬場・コース・公式リンクを確認できます。`
        : `Racecourse in ${country?.name_en ?? racecourse.country_id}. View location, surfaces, course profile, and official links.`,
      meta: [
        isJapanese ? country?.name_ja : country?.name_en,
        racecourse.city,
        racecourse.region,
      ].filter(Boolean).join(' · '),
      searchText: joinSearchText([
        racecourse.name_en,
        racecourse.name_ja,
        racecourse.name_local,
        country?.name_en,
        country?.name_ja,
        country?.name_local,
        racecourse.city,
        racecourse.region,
        racecourse.racing_types,
        racecourse.surfaces,
        racecourse.direction,
      ]),
    };
  });

  const glossaryRecords: SearchRecord[] = getGlossaryEntries().map((entry) => ({
    id: entry.id,
    type: 'glossary',
    href: isJapanese ? `/ja/glossary/${entry.slug}/` : `/glossary/${entry.slug}/`,
    label: isJapanese ? entry.term_ja : entry.term_en,
    alternateLabel: isJapanese ? entry.term_en : entry.term_ja,
    description: isJapanese ? entry.summary_ja : entry.summary_en,
    meta: entry.category,
    searchText: joinSearchText([
      entry.term_en,
      entry.term_ja,
      entry.reading_ja,
      entry.aliases_en,
      entry.aliases_ja,
      entry.summary_en,
      entry.summary_ja,
      entry.beginner_explanation_en,
      entry.beginner_explanation_ja,
      entry.category,
    ]),
  }));

  return [...countryRecords, ...racecourseRecords, ...glossaryRecords]
    .sort((left, right) => left.label.localeCompare(right.label, locale));
}
