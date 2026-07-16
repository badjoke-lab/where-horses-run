import baselineGlossary from '../../data/static/glossary.json';
import roleGlossaryOverlay from '../../data/static/glossary-entries-role-v1.json';

const roleOverrideById = new Map(roleGlossaryOverlay.map((entry) => [entry.id, entry]));

const mergedBaseline = baselineGlossary.map((entry) => roleOverrideById.get(entry.id) ?? entry);
const newRoleEntries = roleGlossaryOverlay.filter(
  (entry) => !baselineGlossary.some((baseline) => baseline.id === entry.id),
);

const glossary = [...mergedBaseline, ...newRoleEntries] as const;

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
