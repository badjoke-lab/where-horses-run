import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const surfaces = [
  'src/layouts/BaseLayout.astro',
  'src/components/TimetableMeetingList.astro',
  'src/components/MeetingTimezoneProjection.astro',
];
const expected = [
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Hong_Kong',
  'Asia/Dubai',
  'Europe/Istanbul',
  'UTC',
];
const expectedSet = new Set(expected);
const literalPattern = /['"]((?:(?:Africa|America|Antarctica|Arctic|Asia|Atlantic|Australia|Europe|Indian|Pacific)\/[A-Za-z0-9_+\-/]+)|UTC)['"]/g;

for (const relativePath of surfaces) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
  if (source.includes('Intl.supportedValuesOf')) {
    throw new Error(`${relativePath}: public timezone selector must not expand from Intl.supportedValuesOf`);
  }

  const found = new Set(Array.from(source.matchAll(literalPattern), (match) => match[1]));
  const missing = expected.filter((zone) => !found.has(zone));
  const unexpected = [...found].filter((zone) => !expectedSet.has(zone)).sort();
  if (missing.length || unexpected.length) {
    throw new Error(
      `${relativePath}: display timezone contract mismatch; missing=[${missing.join(', ')}] unexpected=[${unexpected.join(', ')}]`,
    );
  }
}

console.log(`Display timezone contract OK: ${expected.join(', ')}`);
