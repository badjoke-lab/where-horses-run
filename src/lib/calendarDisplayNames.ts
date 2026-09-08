import { getCountries, getRacecourses, type Locale } from './data';

export type CalendarDisplayLocale = Locale;

const countryById = new Map(getCountries().map((country) => [country.id, country] as const));
const racecourseById = new Map(getRacecourses().map((racecourse) => [racecourse.id, racecourse] as const));

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
  aliases: string[];
} {
  const racecourse = racecourseById.get(racecourseId) as {
    name_en?: string;
    name_ja?: string;
    name_local?: string;
  } | undefined;

  const nameEn = normalizeNonEmpty(racecourse?.name_en) ?? fallbackEnglish;
  // Repository racecourse identity records are the reviewed presentation source.
  // If a reviewed Japanese name is absent, Japanese Calendar deliberately falls
  // back to the complete English/Latin name instead of synthesizing Katakana.
  const nameJa = normalizeNonEmpty(racecourse?.name_ja);
  const nameLocal = normalizeNonEmpty(racecourse?.name_local);
  const aliases = [...new Set([nameEn, nameJa, nameLocal, fallbackEnglish].filter((value): value is string => Boolean(value)))];

  return { nameEn, nameJa, nameLocal, aliases };
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
