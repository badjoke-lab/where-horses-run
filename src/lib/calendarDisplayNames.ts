import racecourseDisplayRegistry from '../../data/static/racecourse-display-names-v1.json';
import { getCountries, getRacecourses } from './data';

export type CalendarDisplayLocale = 'en' | 'ja';

type ReviewedJapaneseNameStatus = 'established' | 'reviewed_transliteration' | 'none';
type RacecourseDisplayRegistryEntry = {
  racecourse_id: string;
  name_en: string;
  name_local: string | null;
  name_ja: string | null;
  name_ja_status: ReviewedJapaneseNameStatus;
  search_aliases: string[];
};

const countryById = new Map(getCountries().map((country) => [country.id, country] as const));
const racecourseById = new Map(getRacecourses().map((racecourse) => [racecourse.id, racecourse] as const));
const displayEntryByRacecourseId = new Map(
  (racecourseDisplayRegistry.entries as RacecourseDisplayRegistryEntry[])
    .map((entry) => [entry.racecourse_id, entry] as const),
);

const authorityCompactLabelById: Record<string, string> = {
  jra: 'JRA',
  hkjc: 'HKJC',
  'nar-local-government-racing': 'NAR',
  'banei-tokachi': 'Banei Tokachi',
  'emirates-racing-authority': 'ERA',
  'korea-racing-authority': 'KRA',
  kra: 'KRA',
  'turkiye-jokey-kulubu': 'TJK',
  tjk: 'TJK',
};

const authorityCompactLabelJaById: Record<string, string> = {
  ...authorityCompactLabelById,
  'banei-tokachi': 'ばんえい十勝',
};

const normalizeNonEmpty = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

export function getCalendarCountryDisplayName(
  countryId: string,
  fallback: string,
  locale: CalendarDisplayLocale,
): string {
  const country = countryById.get(countryId) as { name_en?: string; name_ja?: string } | undefined;
  if (!country) return fallback;
  if (locale === 'ja') return normalizeNonEmpty(country.name_ja) ?? normalizeNonEmpty(country.name_en) ?? fallback;
  return normalizeNonEmpty(country.name_en) ?? fallback;
}

export function getCalendarAuthorityDisplayName(
  authorityId: string,
  fallback: string,
  locale: CalendarDisplayLocale,
): string {
  const labels = locale === 'ja' ? authorityCompactLabelJaById : authorityCompactLabelById;
  return labels[authorityId] ?? fallback;
}

export function getCalendarRacecourseDisplayNames(
  racecourseId: string,
  fallbackEnglish: string,
): {
  nameEn: string;
  nameJa: string | null;
  nameLocal: string | null;
  nameJaStatus: ReviewedJapaneseNameStatus;
  aliases: string[];
} {
  const racecourse = racecourseById.get(racecourseId) as {
    name_en?: string;
    name_local?: string;
  } | undefined;
  const reviewed = displayEntryByRacecourseId.get(racecourseId);

  const nameEn = normalizeNonEmpty(reviewed?.name_en) ?? normalizeNonEmpty(racecourse?.name_en) ?? fallbackEnglish;
  const nameLocal = normalizeNonEmpty(reviewed?.name_local) ?? normalizeNonEmpty(racecourse?.name_local);
  const nameJaStatus: ReviewedJapaneseNameStatus = reviewed?.name_ja_status ?? 'none';
  const nameJa = nameJaStatus === 'established' || nameJaStatus === 'reviewed_transliteration'
    ? normalizeNonEmpty(reviewed?.name_ja)
    : null;
  const aliases = [...new Set([
    nameEn,
    nameJa,
    nameLocal,
    fallbackEnglish,
    ...(reviewed?.search_aliases ?? []),
  ].filter((value): value is string => Boolean(value)))];

  return { nameEn, nameJa, nameLocal, nameJaStatus, aliases };
}

export function getCalendarRacecourseDisplayName(
  racecourseId: string,
  fallbackEnglish: string,
  locale: CalendarDisplayLocale,
): string {
  const names = getCalendarRacecourseDisplayNames(racecourseId, fallbackEnglish);
  return locale === 'ja' ? names.nameJa ?? names.nameEn : names.nameEn;
}

export function getCalendarRacecourseSearchAliases(
  racecourseId: string,
  fallbackEnglish: string,
): string[] {
  return getCalendarRacecourseDisplayNames(racecourseId, fallbackEnglish).aliases;
}
