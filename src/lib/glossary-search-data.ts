import {
  getGlossaryCategoryLabel,
  getGlossaryEntries,
  type GlossaryLocale,
} from './glossary-data';

export interface GlossarySearchRecord {
  id: string;
  slug: string;
  href: string;
  term: string;
  secondaryTerm: string;
  summary: string;
  category: string;
  categoryLabel: string;
  reading: string;
  aliases: string[];
  relatedCount: number;
  searchText: string;
}

export interface GlossaryCategoryOption {
  id: string;
  label: string;
  count: number;
  href: string;
}

type SearchableGlossaryEntry = {
  id: string;
  slug: string;
  term_en: string;
  term_ja: string;
  category: string;
  summary_en: string;
  summary_ja: string;
  aliases_en?: string[];
  aliases_ja?: string[];
  reading_ja?: string | null;
  pronunciation_en?: string | null;
  beginner_explanation_en?: string | null;
  beginner_explanation_ja?: string | null;
  related_term_ids?: string[];
};

export function normalizeGlossarySearchText(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

export function getGlossarySearchRecords(locale: GlossaryLocale): GlossarySearchRecord[] {
  const isJapanese = locale === 'ja';

  return getGlossaryEntries().map((rawEntry) => {
    const entry = rawEntry as unknown as SearchableGlossaryEntry;
    const aliasesEn = strings(entry.aliases_en);
    const aliasesJa = strings(entry.aliases_ja);
    const term = isJapanese ? entry.term_ja : entry.term_en;
    const secondaryTerm = isJapanese ? entry.term_en : entry.term_ja;
    const summary = isJapanese ? entry.summary_ja : entry.summary_en;
    const aliases = isJapanese ? aliasesJa : aliasesEn;
    const reading = entry.reading_ja ?? '';
    const categoryLabel = getGlossaryCategoryLabel(entry.category, locale);
    const href = isJapanese ? `/ja/glossary/${entry.slug}/` : `/glossary/${entry.slug}/`;
    const searchText = normalizeGlossarySearchText([
      entry.id,
      entry.slug,
      entry.term_en,
      entry.term_ja,
      entry.summary_en,
      entry.summary_ja,
      ...aliasesEn,
      ...aliasesJa,
      entry.reading_ja,
      entry.pronunciation_en,
      entry.beginner_explanation_en,
      entry.beginner_explanation_ja,
      entry.category,
      getGlossaryCategoryLabel(entry.category, 'en'),
      getGlossaryCategoryLabel(entry.category, 'ja'),
    ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0).join(' '));

    return {
      id: entry.id,
      slug: entry.slug,
      href,
      term,
      secondaryTerm,
      summary,
      category: entry.category,
      categoryLabel,
      reading,
      aliases,
      relatedCount: strings(entry.related_term_ids).length,
      searchText,
    };
  });
}

export function getGlossaryCategoryOptions(
  records: GlossarySearchRecord[],
  locale: GlossaryLocale,
): GlossaryCategoryOption[] {
  const counts = new Map<string, number>();
  for (const record of records) counts.set(record.category, (counts.get(record.category) ?? 0) + 1);
  const basePath = locale === 'ja' ? '/ja/glossary/' : '/glossary/';

  return [...counts.entries()]
    .map(([id, count]) => ({
      id,
      label: getGlossaryCategoryLabel(id, locale),
      count,
      href: `${basePath}?category=${encodeURIComponent(id)}`,
    }))
    .sort((left, right) => left.label.localeCompare(right.label, locale));
}
