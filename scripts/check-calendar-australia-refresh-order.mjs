import fs from 'node:fs';
import assert from 'node:assert/strict';

const paths = [
  '.github/workflows/calendar-unified-official-refresh.yml',
  '.github/workflows/calendar-near-official-refresh.yml',
];
const source = 'node scripts/timetable/run-australia-victoria-flemington-2026-27-official-window.mjs';
const apply = '      - name: Apply Australia Victoria Flemington approved C dates';
const collect = '      - name: Apply non-Japan official observations monotonically';
const review = '      - name: Re-apply frozen reviewed Calendar observations\n';
for (const path of paths) {
  const text = fs.readFileSync(path, 'utf8');
  const sourceIndex = text.indexOf(source);
  const collectIndex = text.indexOf(collect);
  const applyIndex = text.indexOf(apply);
  const reviewIndex = text.indexOf(review);
  assert.ok(sourceIndex >= 0, `Flemington collector missing in ${path}`);
  assert.ok(collectIndex > sourceIndex, `non-Japan apply must follow collection in ${path}`);
  assert.ok(applyIndex > collectIndex, `Flemington apply must follow collection and non-Japan apply in ${path}`);
  assert.ok(reviewIndex > applyIndex, `reviewed observations must be restored after Flemington apply in ${path}`);
  assert.equal(text.split(apply).length, 2, `Flemington must have exactly one standalone apply in ${path}`);
  const block = text.slice(applyIndex, reviewIndex);
  assert.ok(block.includes('--artifact=.calendar-unified/australia-victoria-flemington.json'));
  assert.ok(block.includes('--racing-system-id=australia-victoria-flemington-thoroughbred-system'));
}
console.log('AUSTRALIA_FLEMINGTON_REFRESH_ORDER: pass 2 workflows');
