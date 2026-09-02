import baselineGlossary from '../../data/static/glossary.json';
import roleGlossaryOverlay from '../../data/static/glossary-entries-role-v1.json';
import timetableGlossaryOverlay from '../../data/static/glossary-entries-timetable-v1.json';
import officialSourceGlossaryOverlay from '../../data/static/glossary-entries-official-source-v1.json';
import coreRacingGlossaryOverlay from '../../data/static/glossary-entries-core-racing-v1.json';
import coreRacingExtraGlossaryOverlay from '../../data/static/glossary-entries-core-racing-extra-v1.json';
import coreRacingMoreGlossaryOverlay from '../../data/static/glossary-entries-core-racing-more-v1.json';
import publicCopyPatches from '../../data/static/glossary-public-copy-v1.json';
import multilingualFieldPatches from '../../data/static/glossary-fields-multilingual-v1.json';
import beginnerExplanationPatches from '../../data/static/glossary-fields-beginner-v1.json';
import relationshipGraphPatches from '../../data/static/glossary-relationships-graph-v1.json';
import categoryLabelRegistry from '../../data/static/glossary-category-labels-v1.json';

const overlays = [
  roleGlossaryOverlay,
  timetableGlossaryOverlay,
  officialSourceGlossaryOverlay,
  coreRacingGlossaryOverlay,
  coreRacingExtraGlossaryOverlay,
  coreRacingMoreGlossaryOverlay,
] as const;
type GlossaryRecord =
  | (typeof baselineGlossary)[number]
  | (typeof roleGlossaryOverlay)[number]
  | (typeof timetableGlossaryOverlay)[number]
  | (typeof officialSourceGlossaryOverlay)[number]
  | (typeof coreRacingGlossaryOverlay)[number]
  | (typeof coreRacingExtraGlossaryOverlay)[number]
  | (typeof coreRacingMoreGlossaryOverlay)[number];

const hiddenPublicGlossaryIds = new Set([
  'fixture',
  'official-source',
  'official-calendar',
  'official-racecard',
  'link-first-source',
  'source-status',
  'governing-body',
  'racing-authority',
  'racecourse-operator',
]);

const publicCopyLegacyIdMap: Record<string, string> = {
  'all-weather-course': 'all-weather',
  'course-using-both-directions': 'both-directions-course',
  'clerk-of-the-scales': 'clerk-of-scales',
};

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

for (const patch of publicCopyPatches) {
  const targetId = publicCopyLegacyIdMap[patch.id] ?? patch.id;
  const current = byId.get(targetId);
  if (!current) throw new Error(`Unknown public glossary copy-patch ID: ${patch.id}`);
  byId.set(targetId, { ...current, ...patch, id: targetId } as GlossaryRecord);
}

const glossary = order.map((id) => byId.get(id)!);
const publicGlossary = glossary.filter((entry) => !hiddenPublicGlossaryIds.has(entry.id));

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
  return [...publicGlossary].sort((a, b) => a.term_en.localeCompare(b.term_en));
}

export function getGlossaryEntryBySlug(slug: string): GlossaryEntry | undefined {
  return publicGlossary.find((entry) => entry.slug === slug);
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

  for (const entry of publicGlossary) {
    for (const relatedId of entry.related_term_ids) {
      if (hiddenPublicGlossaryIds.has(relatedId)) continue;
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
