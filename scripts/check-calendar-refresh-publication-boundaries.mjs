import assert from 'node:assert/strict';
import fs from 'node:fs';
import './check-calendar-field-publication-diagnostics.mjs';

const workflow = fs.readFileSync('.github/workflows/calendar-unified-official-refresh.yml', 'utf8');

const orderedSteps = [
  'Refresh Japan official mother set and best available detail',
  'Re-apply frozen reviewed Calendar observations after Japan',
  'Validate Japan generated public site state',
  'Persist Japan official state before non-Japan collection',
  'Collect HKJC official window',
  'Collect UAE official window',
  'Collect KRA official window',
  'Collect TJK, SOREC, Chile and Ireland official windows',
  'Persist remaining canonical and public rolling state',
];

let previous = -1;
for (const step of orderedSteps) {
  const index = workflow.indexOf(`- name: ${step}`);
  assert.notEqual(index, -1, `missing workflow step: ${step}`);
  assert.ok(index > previous, `workflow step out of order: ${step}`);
  previous = index;
}

const japanPersist = workflow.indexOf('- name: Persist Japan official state before non-Japan collection');
const firstNonJapan = workflow.indexOf('- name: Collect HKJC official window', japanPersist);
assert.ok(japanPersist < firstNonJapan, 'Japan state must be persisted before any unrelated authority collector runs');
assert.doesNotMatch(workflow, /- name: Persist canonical and public rolling state once/, 'single end-of-workflow persistence would reintroduce cross-authority blocking');

assert.equal(
  (workflow.match(/run-sorec-official-window\.mjs/g) ?? []).length,
  2,
  'SOREC must be collected in both normal and latest-main rebuild paths',
);
assert.equal(
  (workflow.match(/--authority-id=sorec/g) ?? []).length,
  2,
  'SOREC observations must be applied in both normal and latest-main rebuild paths',
);
assert.equal(
  (workflow.match(/--artifact=\.calendar-unified\/sorec\.json/g) ?? []).length,
  4,
  'SOREC artifact must pass exclusion and apply layers in both execution paths',
);
assert.match(workflow, /--racing-system-id=sorec-racing-information-system/, 'SOREC apply path must bind the canonical racing system id');
assert.match(workflow, /--timezone=Africa\/Casablanca/, 'SOREC apply path must bind the Morocco timezone');

assert.equal(
  (workflow.match(/run-ireland-hri-official-window\.mjs/g) ?? []).length,
  2,
  'Ireland HRI must be collected in both normal and latest-main rebuild paths',
);
assert.equal(
  (workflow.match(/--authority-id=horse-racing-ireland/g) ?? []).length,
  2,
  'Ireland HRI observations must be applied in both normal and latest-main rebuild paths',
);
assert.equal(
  (workflow.match(/--artifact=\.calendar-unified\/ireland\.json/g) ?? []).length,
  4,
  'Ireland HRI artifact must pass exclusion and apply layers in both execution paths',
);
assert.equal(
  (workflow.match(/--racing-system-id=ireland-hri-racing-system/g) ?? []).length,
  2,
  'Ireland HRI apply path must bind the canonical racing system id in both execution paths',
);
assert.equal(
  (workflow.match(/--timezone=Europe\/Dublin/g) ?? []).length,
  2,
  'Ireland HRI apply path must bind the Ireland timezone in both execution paths',
);

console.log('CALENDAR_REFRESH_PUBLICATION_BOUNDARIES: pass');
console.log('SOREC_UNIFIED_REFRESH_PATHS: 2');
console.log('IRELAND_HRI_UNIFIED_REFRESH_PATHS: 2');
