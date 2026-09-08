import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/calendar-unified-official-refresh.yml', 'utf8');

const orderedSteps = [
  'Refresh Japan official mother set and best available detail',
  'Re-apply frozen reviewed Calendar observations after Japan',
  'Validate Japan generated public site state',
  'Persist Japan official state before non-Japan collection',
  'Collect HKJC official window',
  'Collect UAE official window',
  'Collect KRA official window',
  'Collect TJK official window',
  'Enforce reviewed Calendar exclusions',
  'Apply non-Japan official observations monotonically',
  'Re-apply frozen reviewed Calendar observations',
  'Validate generated public site state',
  'Persist remaining canonical and public rolling state',
];

let previous = -1;
for (const step of orderedSteps) {
  const index = workflow.indexOf(`- name: ${step}`, previous + 1);
  assert.notEqual(index, -1, `missing workflow step: ${step}`);
  assert.ok(index > previous, `workflow step out of order: ${step}`);
  previous = index;
}

const japanPersist = workflow.indexOf('- name: Persist Japan official state before non-Japan collection');
const firstNonJapan = workflow.indexOf('- name: Collect HKJC official window', japanPersist);
assert.ok(japanPersist < firstNonJapan, 'Japan state must be persisted before any unrelated authority collector runs');
assert.doesNotMatch(workflow, /- name: Persist canonical and public rolling state once/, 'single end-of-workflow persistence would reintroduce cross-authority blocking');

const rebuildFunction = workflow.match(/refresh_non_japan_on_main\(\) \{([\s\S]*?)\n          \}/)?.[1] ?? '';
assert.ok(rebuildFunction, 'missing latest-main non-Japan rebuild function');
for (const source of ['hkjc', 'uae', 'kra', 'tjk']) {
  assert.match(
    rebuildFunction,
    new RegExp(`--output=\\.calendar-unified/${source}\\.json`),
    `${source.toUpperCase()} must be recollected after resetting to latest main`,
  );
  assert.match(
    rebuildFunction,
    new RegExp(`--artifact=\\.calendar-unified/${source}\\.json`),
    `${source.toUpperCase()} must pass through the latest-main exclusion/merge path`,
  );
}
assert.match(rebuildFunction, /apply-reviewed-calendar-observations\.mjs/, 'latest-main rebuild must preserve frozen reviewed observations');
assert.match(rebuildFunction, /npm run build/, 'latest-main rebuild must validate canonical/public output before persistence');

console.log('CALENDAR_REFRESH_PUBLICATION_BOUNDARIES: pass');
