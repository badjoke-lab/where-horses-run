import baselineGlossary from '../../data/static/glossary.json';
import roleGlossaryOverlay from '../../data/static/glossary-entries-role-v1.json';
import timetableGlossaryOverlay from '../../data/static/glossary-entries-timetable-v1.json';
import officialSourceGlossaryOverlay from '../../data/static/glossary-entries-official-source-v1.json';

const overlays = [roleGlossaryOverlay, timetableGlossaryOverlay, officialSourceGlossaryOverlay] as const;
const order = baselineGlossary.map((entry) => entry.id);
const byId = new Map(baselineGlossary.map((entry) => [entry.id, entry]));

for (const overlay of overlays) {
  for (const entry of overlay) {
    if (!byId.has(entry.id)) order.push(entry.id);
    byId.set(entry.id, entry);
  }
}

const glossary = order.map((id) => byId.get(id)!);

export type GlossaryEntry = (typeof glossary)[number];

export function getGlossaryEntries(): GlossaryEntry[] {
  return [...glossary].sort((a, b) => a.term_en.localeCompare(b.term_en));
}

export function getGlossaryEntryBySlug(slug: string): GlossaryEntry | undefined {
  return glossary.find((entry) => entry.slug === slug);
}

export function getMergedGlossary(): GlossaryEntry[] {
  return [...glossary];
}
