import fs from 'node:fs';
import path from 'node:path';

export function loadGlossary(root = process.cwd()) {
  const staticDir = path.join(root, 'data/static');
  const baseline = JSON.parse(fs.readFileSync(path.join(staticDir, 'glossary.json'), 'utf8'));
  const overlayFiles = fs.readdirSync(staticDir)
    .filter((filename) => /^glossary-entries-.*\.json$/.test(filename))
    .sort();

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

  return order.map((id) => byId.get(id));
}
