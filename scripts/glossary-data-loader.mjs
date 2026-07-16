import fs from 'node:fs';
import path from 'node:path';

const overlayPriority = new Map([
  ['glossary-entries-role-v1.json', 10],
  ['glossary-entries-timetable-v1.json', 20],
  ['glossary-entries-official-source-v1.json', 30],
]);

const fieldPatchPriority = new Map([
  ['glossary-fields-multilingual-v1.json', 10],
  ['glossary-fields-beginner-v1.json', 20],
]);

const relationshipPatchPriority = new Map([
  ['glossary-relationships-graph-v1.json', 10],
]);

export function loadGlossary(root = process.cwd()) {
  const staticDir = path.join(root, 'data/static');
  const baseline = JSON.parse(fs.readFileSync(path.join(staticDir, 'glossary.json'), 'utf8'));
  const overlayFiles = fs.readdirSync(staticDir)
    .filter((filename) => /^glossary-entries-.*\.json$/.test(filename))
    .sort((left, right) => {
      const priorityDifference = (overlayPriority.get(left) ?? 1000) - (overlayPriority.get(right) ?? 1000);
      return priorityDifference || left.localeCompare(right);
    });
  const fieldPatchFiles = fs.readdirSync(staticDir)
    .filter((filename) => /^glossary-fields-.*\.json$/.test(filename))
    .sort((left, right) => {
      const priorityDifference = (fieldPatchPriority.get(left) ?? 1000) - (fieldPatchPriority.get(right) ?? 1000);
      return priorityDifference || left.localeCompare(right);
    });
  const relationshipPatchFiles = fs.readdirSync(staticDir)
    .filter((filename) => /^glossary-relationships-.*\.json$/.test(filename))
    .sort((left, right) => {
      const priorityDifference = (relationshipPatchPriority.get(left) ?? 1000) - (relationshipPatchPriority.get(right) ?? 1000);
      return priorityDifference || left.localeCompare(right);
    });

  const order = baseline.map((entry) => entry.id);
  const byId = new Map(baseline.map((entry) => [entry.id, entry]));

  for (const filename of overlayFiles) {
    const records = JSON.parse(fs.readFileSync(path.join(staticDir, filename), 'utf8'));
    if (!Array.isArray(records)) throw new Error(`${filename} must contain an array`);
    for (const record of records) {
      if (!byId.has(record.id)) order.push(record.id);
      byId.set(record.id, record);
    }
  }

  for (const filename of fieldPatchFiles) {
    const patches = JSON.parse(fs.readFileSync(path.join(staticDir, filename), 'utf8'));
    if (!Array.isArray(patches)) throw new Error(`${filename} must contain an array`);
    for (const patch of patches) {
      const current = byId.get(patch.id);
      if (!current) throw new Error(`${filename} references unknown glossary ID ${patch.id}`);
      byId.set(patch.id, { ...current, ...patch });
    }
  }

  for (const filename of relationshipPatchFiles) {
    const patches = JSON.parse(fs.readFileSync(path.join(staticDir, filename), 'utf8'));
    if (!Array.isArray(patches)) throw new Error(`${filename} must contain an array`);
    for (const patch of patches) {
      const current = byId.get(patch.id);
      if (!current) throw new Error(`${filename} references unknown glossary ID ${patch.id}`);
      const related = [...current.related_term_ids];
      for (const relatedId of patch.add_related_term_ids ?? []) {
        if (!byId.has(relatedId)) throw new Error(`${filename} references unknown related glossary ID ${relatedId}`);
        if (!related.includes(relatedId)) related.push(relatedId);
      }
      byId.set(patch.id, { ...current, related_term_ids: related });
    }
  }

  return order.map((id) => byId.get(id));
}
