import fs from 'node:fs';
import path from 'node:path';
import { loadGlossary } from './glossary-data-loader.mjs';

const root = process.cwd();
const parse = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const baseline = parse('data/static/glossary.json');
const order = baseline.map((entry) => entry.id);
const byId = new Map(baseline.map((entry) => [entry.id, entry]));
for (const filename of ['glossary-entries-role-v1.json', 'glossary-entries-timetable-v1.json', 'glossary-entries-official-source-v1.json']) {
  for (const record of parse(`data/static/${filename}`)) {
    if (!byId.has(record.id)) order.push(record.id);
    byId.set(record.id, record);
  }
}
for (const patch of parse('data/static/glossary-fields-multilingual-v1.json')) {
  byId.set(patch.id, { ...byId.get(patch.id), ...patch });
}
for (const patch of parse('data/static/glossary-relationships-graph-v1.json')) {
  const current = byId.get(patch.id);
  const related = [...current.related_term_ids];
  for (const id of patch.add_related_term_ids ?? []) if (!related.includes(id)) related.push(id);
  byId.set(patch.id, { ...current, related_term_ids: related });
}
const before = order.map((id) => byId.get(id));
const after = loadGlossary(root);
const patches = parse('data/static/glossary-fields-beginner-v1.json');
const patchIds = new Set(patches.map((patch) => patch.id));
const strip = (entry) => {
  const { beginner_explanation_en, beginner_explanation_ja, ...rest } = entry;
  return rest;
};
const result = {
  before_count: before.length,
  before_paired: before.filter((entry) => entry.beginner_explanation_en && entry.beginner_explanation_ja).length,
  before_missing_ids: before.filter((entry) => !entry.beginner_explanation_en && !entry.beginner_explanation_ja).map((entry) => entry.id),
  before_unpaired_ids: before.filter((entry) => Boolean(entry.beginner_explanation_en) !== Boolean(entry.beginner_explanation_ja)).map((entry) => entry.id),
  after_count: after.length,
  after_missing_ids: after.filter((entry) => !entry.beginner_explanation_en || !entry.beginner_explanation_ja).map((entry) => entry.id),
  summary_copy_ids_all: after.filter((entry) => entry.beginner_explanation_en === entry.summary_en || entry.beginner_explanation_ja === entry.summary_ja).map((entry) => entry.id),
  summary_copy_ids_patched: after.filter((entry) => patchIds.has(entry.id) && (entry.beginner_explanation_en === entry.summary_en || entry.beginner_explanation_ja === entry.summary_ja)).map((entry) => entry.id),
  non_beginner_changed_ids: after.filter((entry) => JSON.stringify(strip(entry)) !== JSON.stringify(strip(byId.get(entry.id)))).map((entry) => entry.id),
  patch_ids: patches.map((patch) => patch.id),
};
const output = `${JSON.stringify(result, null, 2)}\n`;
fs.writeFileSync(path.join(root, 'beginner-diagnostics.json'), output);
console.log(`BEGINNER_DIAGNOSTICS=${JSON.stringify(result)}`);
