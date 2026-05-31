import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-122-current-source-freshness] ${message}`);
  process.exit(1);
}

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) fail(`Missing file: ${relativePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

const component = read('src/components/CurrentTimetableRecords.astro');

for (const text of [
  'Freshness',
  'Freshness basis',
  'Source trace and freshness',
  'Source capture date',
  'Last checked',
  'Promotes from',
  'Freshness status'
]) {
  if (!component.includes(text)) fail(`Missing display text: ${text}`);
}

for (const field of [
  'record.freshness.status',
  'record.freshness.basis',
  'record.source_trace.source_capture_date',
  'record.source_trace.last_checked',
  'record.source_trace.promotes_from'
]) {
  if (!component.includes(field)) fail(`Missing field: ${field}`);
}

console.log('[pr-122-current-source-freshness] PASS');
