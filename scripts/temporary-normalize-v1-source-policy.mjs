import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dataModule = fs.readFileSync(path.join(root, 'src/lib/data.ts'), 'utf8');
const sourceImports = [...dataModule.matchAll(/import\s+([A-Za-z0-9_]+)\s+from\s+['"]\.\.\/\.\.\/(data\/static\/[^'"]+\.json)['"]/g)]
  .filter(([, variable, file]) => variable === 'sources' || variable.startsWith('countryPageSources') || file === 'data/static/racecourse-link-amendments-v1.json')
  .map(([, variable, file]) => ({ variable, file }));

const fallbackNotes = new Map([
  ['uruguay-hru-home', 'Official source link used for Uruguay racing-organisation confirmation. Current timetable coverage is stated separately.'],
  ['sweden-svensk-galopp-calendar', 'Official source link used for Swedish racing-calendar confirmation. Complete programme details remain on the official page.'],
  ['denmark-dansk-galop-home', 'Official source link used for Danish racing-organisation confirmation. Current timetable coverage is stated separately.'],
  ['denmark-klampenborg-home', 'Official source link used for Klampenborg racecourse confirmation. Complete programme details remain on the official page.'],
  ['czech-racing-calendar', 'Official source link used for Czech racing-calendar confirmation. Complete programme details remain on the official page.'],
  ['czech-chuchle-home', 'Official source link used for Chuchle racecourse confirmation. Current timetable coverage is stated separately.'],
  ['czech-most-home', 'Official source link used for Most racecourse confirmation. Current timetable coverage is stated separately.'],
]);
const removedFields = ['terms_risk', 'm3_status', 'm3_notes'];
const report = {
  schemaVersion: 'v1-source-policy-normalization-v1',
  files: sourceImports.length,
  sourceRecords: 0,
  removed: Object.fromEntries(removedFields.map((field) => [field, 0])),
  notesAdded: 0,
  notesAddedIds: [],
  changedFiles: [],
};

function normalizeRecord(record) {
  const next = { ...record };
  for (const field of removedFields) {
    if (Object.hasOwn(next, field)) {
      delete next[field];
      report.removed[field] += 1;
    }
  }
  if ((typeof next.notes !== 'string' || !next.notes.trim()) && fallbackNotes.has(next.id)) {
    next.notes = fallbackNotes.get(next.id);
    report.notesAdded += 1;
    report.notesAddedIds.push(next.id);
  }
  return next;
}

for (const { file } of sourceImports) {
  const absolute = path.join(root, file);
  const data = JSON.parse(fs.readFileSync(absolute, 'utf8'));
  let next;
  let count = 0;
  if (file === 'data/static/racecourse-link-amendments-v1.json') {
    const rows = Array.isArray(data.source_records) ? data.source_records : [];
    count = rows.length;
    next = { ...data, source_records: rows.map(normalizeRecord) };
  } else if (Array.isArray(data)) {
    count = data.length;
    next = data.map(normalizeRecord);
  } else if (Array.isArray(data.sources)) {
    count = data.sources.length;
    next = { ...data, sources: data.sources.map(normalizeRecord) };
  } else {
    throw new Error(`Unsupported source registry shape: ${file}`);
  }
  report.sourceRecords += count;
  const before = `${JSON.stringify(data, null, 2)}\n`;
  const after = `${JSON.stringify(next, null, 2)}\n`;
  if (before !== after) {
    fs.writeFileSync(absolute, after);
    report.changedFiles.push(file);
  }
}

if (report.sourceRecords !== 171) throw new Error(`Expected 171 source records, got ${report.sourceRecords}`);
if (report.removed.terms_risk !== 171) throw new Error(`Expected 171 terms_risk removals, got ${report.removed.terms_risk}`);
if (report.removed.m3_status !== 163) throw new Error(`Expected 163 m3_status removals, got ${report.removed.m3_status}`);
if (report.removed.m3_notes !== 163) throw new Error(`Expected 163 m3_notes removals, got ${report.removed.m3_notes}`);
if (report.notesAdded !== 7) throw new Error(`Expected 7 note additions, got ${report.notesAdded}`);

fs.writeFileSync(path.join(root, 'v1-source-policy-normalization.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
