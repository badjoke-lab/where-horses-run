import fs from 'node:fs';

const manifestPath = 'data/static/calendar-reviewed-public-observations.json';
const retired = new Set([
  'data/static/japan-2026-09-05-reviewed-a-plus-v1.json',
  'data/static/japan-2026-09-06-kochi-reviewed-a-plus-v1.json',
]);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const before = manifest.supplements.length;
manifest.supplements = manifest.supplements.filter((row) => !retired.has(row.path));
if (before - manifest.supplements.length !== retired.size) {
  throw new Error(`expected to retire ${retired.size} supplements, retired ${before - manifest.supplements.length}`);
}
if (!manifest.supplements.some((row) => row.path === 'data/static/banei-2026-09-07-public-detail-v1.json')) {
  throw new Error('banei 2026-09-07 supplement must remain');
}
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
for (const path of retired) {
  if (!fs.existsSync(path)) throw new Error(`missing retired supplement: ${path}`);
  fs.unlinkSync(path);
}
