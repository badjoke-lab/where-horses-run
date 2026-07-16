import baselineGlossary from '../../data/static/glossary.json';
import roleGlossaryOverlay from '../../data/static/glossary-entries-role-v1.json';
import timetableGlossaryOverlay from '../../data/static/glossary-entries-timetable-v1.json';
import officialSourceGlossaryOverlay from '../../data/static/glossary-entries-official-source-v1.json';
import multilingualFieldPatches from '../../data/static/glossary-fields-multilingual-v1.json';
import beginnerExplanationPatches from '../../data/static/glossary-fields-beginner-v1.json';
import relationshipGraphPatches from '../../data/static/glossary-relationships-graph-v1.json';
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

for (const patch of beginnerExplanationPatches) {
  const current = byId.get(patch.id);
  if (!current) throw new Error(`Unknown beginner-explanation patch ID: ${patch.id}`);
  byId.set(patch.id, { ...current, ...patch } as GlossaryRecord);
}

for (const patch of relationshipGraphPatches) {
  const current = byId.get(patch.id);
  if (!current) throw new Error(`Unknown glossary relationship-patch ID: ${patch.id}`);
  const relatedTermIds = [...current.related_term_ids];
  for (const relatedId of patch.add_related_term_ids) {
    if (!byId.has(relatedId)) throw new Error(`Unknown related glossary ID: ${relatedId}`);
    if (!relatedTermIds.includes(relatedId)) relatedTermIds.push(relatedId);
  }
  byId.set(
    patch.id,
    { ...current, related_term_ids: relatedTermIds } as GlossaryRecord,
  );
}

const glossary = order.map((id) => byId.get(id)!);

export type GlossaryEntry = (typeof glossary)[number];
export type GlossaryLocale = 'en' | 'ja';
export type GlossaryRelationshipEdge = {
  source_id: string;
  target_id: string;
};

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

export function getGlossaryRelationshipEdges(): GlossaryRelationshipEdge[] {
  const seen = new Set<string>();
  const edges: GlossaryRelationshipEdge[] = [];

  for (const entry of glossary) {
    for (const relatedId of entry.related_term_ids) {
      const [sourceId, targetId] = [entry.id, relatedId].sort();
      const key = `${sourceId}::${targetId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ source_id: sourceId, target_id: targetId });
    }
  }

  return edges.sort((left, right) =>
    `${left.source_id}::${left.target_id}`.localeCompare(
      `${right.source_id}::${right.target_id}`,
    ),
  );
}
