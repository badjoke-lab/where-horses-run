import baselineGlossary from '../../data/static/glossary.json';
import roleGlossaryOverlay from '../../data/static/glossary-entries-role-v1.json';
import timetableGlossaryOverlay from '../../data/static/glossary-entries-timetable-v1.json';
import officialSourceGlossaryOverlay from '../../data/static/glossary-entries-official-source-v1.json';
import multilingualFieldPatches from '../../data/static/glossary-fields-multilingual-v1.json';
import categoryLabelRegistry from '../../data/static/glossary-category-labels-v1.json';

const overlays = [roleGlossaryOverlay, timetableGlossaryOverlay, officialSourceGlossaryOverlay] as const;
type GlossaryRecord =
  | (typeof baselineGlossary)[number]
  | (typeof roleGlossaryOverlay)[number]
  | (typeof timetableGlossaryOverlay)[number]
  | (typeof officialSourceGlossaryOverlay)[number];

const order = baselineGlossary.map((entry) => entry.id);
const byId = new Map<string, GlossaryRecord>(
  baselineGlossary.map((entry) => [entry.id, entry] as const),
);

for (const overlay of overlays) {
  for (const entry of overlay) {
    if (!byId.has(entry.id)) order.push(entry.id);
    byId.set(entry.id, entry);
  }
}

for (const patch of multilingualFieldPatches) {
  const current = byId.get(patch.id);
  if (!current) throw new Error(`Unknown glossary field-patch ID: ${patch.id}`);
  byId.set(patch.id, { ...current, ...patch } as GlossaryRecord);
}

const glossary = order.map((id) => byId.get(id)!);

export type GlossaryEntry = (typeof glossary)[number];
export type GlossaryLocale = 'en' | 'ja';

const categoryLabels = categoryLabelRegistry.labels as Record<
  string,
  Record<GlossaryLocale, string>
>;

export function getGlossaryEntries(): GlossaryEntry[] {
  return [...glossary].sort((a, b) => a.term_en.localeCompare(b.term_en));
}

export function getGlossaryEntryBySlug(slug: string): GlossaryEntry | undefined {
  return glossary.find((entry) => entry.slug === slug);
}

export function getMergedGlossary(): GlossaryEntry[] {
  return [...glossary];
}

export function getGlossaryCategoryLabel(
  category: string,
  locale: GlossaryLocale,
): string {
  return categoryLabels[category]?.[locale] ?? category;
}
