import assert from 'node:assert/strict';
import fs from 'node:fs';
import './check-calendar-field-publication-diagnostics.mjs';

const workflow = fs.readFileSync('.github/workflows/calendar-unified-official-refresh.yml', 'utf8');

const orderedSteps = [
  'Refresh Japan official mother set and best available detail',
  'Re-apply frozen reviewed Calendar observations after Japan',
  'Apply explicit meeting presence dispositions after Japan',
  'Validate Japan generated public site state',
  'Persist Japan official state before non-Japan collection',
  'Collect HKJC official window',
  'Collect UAE official window',
  'Collect KRA official window',
  'Collect TJK, SOREC, Chile, Ireland, Peru, Saudi, France and New Zealand official windows',
  'Apply non-Japan official observations monotonically',
  'Re-apply frozen reviewed Calendar observations',
  'Apply explicit meeting presence dispositions',
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
  6,
  'SOREC artifact must pass exclusion, canonical apply, and meeting-presence layers in both execution paths',
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
  6,
  'Ireland HRI artifact must pass exclusion, canonical apply, and meeting-presence layers in both execution paths',
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


assert.equal(
  (workflow.match(/run-peru-monterrico-official-window\.mjs/g) ?? []).length,
  2,
  'Peru Monterrico must be collected in both normal and latest-main rebuild paths',
);
assert.equal(
  (workflow.match(/--authority-id=hipodromo-de-monterrico/g) ?? []).length,
  2,
  'Peru Monterrico observations must be applied in both normal and latest-main rebuild paths',
);
assert.equal(
  (workflow.match(/--artifact=\.calendar-unified\/peru\.json/g) ?? []).length,
  6,
  'Peru Monterrico artifact must pass exclusion, canonical apply, and meeting-presence layers in both execution paths',
);
assert.equal(
  (workflow.match(/--racing-system-id=peru-monterrico-programme-system/g) ?? []).length,
  2,
  'Peru Monterrico apply path must bind the canonical racing system id in both execution paths',
);
assert.equal(
  (workflow.match(/--timezone=America\/Lima/g) ?? []).length,
  2,
  'Peru Monterrico apply path must bind the Peru timezone in both execution paths',
);


assert.equal((workflow.match(/run-saudi-jcsa-official-window\.mjs/g) ?? []).length, 2, 'Saudi JCSA must be collected in both normal and latest-main rebuild paths');
assert.equal((workflow.match(/--authority-id=jockey-club-of-saudi-arabia/g) ?? []).length, 2, 'Saudi JCSA observations must be applied in both normal and latest-main rebuild paths');
assert.equal((workflow.match(/--artifact=\.calendar-unified\/saudi-arabia\.json/g) ?? []).length, 4, 'Saudi JCSA artifact must pass exclusion and apply layers in both execution paths');
assert.equal((workflow.match(/--racing-system-id=saudi-arabia-jcsa-system/g) ?? []).length, 2, 'Saudi JCSA apply path must bind the canonical racing system id in both execution paths');
assert.equal((workflow.match(/--timezone=Asia\/Riyadh/g) ?? []).length, 2, 'Saudi JCSA apply path must bind the Saudi timezone in both execution paths');


assert.equal((workflow.match(/run-france-fnch-official-window\.mjs/g) ?? []).length, 2, 'France FNCH must be collected in both normal and latest-main rebuild paths');
assert.equal((workflow.match(/--authority-id=france-galop/g) ?? []).length, 2, 'France Galop observations must be applied in both normal and latest-main rebuild paths');
assert.equal((workflow.match(/--authority-id=letrot/g) ?? []).length, 2, 'France LETROT observations must be applied in both normal and latest-main rebuild paths');
assert.equal((workflow.match(/--artifact=\.calendar-unified\/france-galop\.json/g) ?? []).length, 6, 'France Galop artifact must pass exclusion, apply, and meeting-presence layers in both execution paths');
assert.equal((workflow.match(/--artifact=\.calendar-unified\/france-letrot\.json/g) ?? []).length, 6, 'France LETROT artifact must pass exclusion, apply, and meeting-presence layers in both execution paths');
assert.equal((workflow.match(/--racing-system-id=france-france-galop-system/g) ?? []).length, 2, 'France Galop apply path must bind the canonical racing system id in both execution paths');
assert.equal((workflow.match(/--racing-system-id=france-letrot-system/g) ?? []).length, 2, 'France LETROT apply path must bind the canonical racing system id in both execution paths');
assert.equal((workflow.match(/--timezone=Europe\/Paris/g) ?? []).length, 4, 'France apply paths must bind Europe/Paris for both systems in both execution paths');


assert.equal((workflow.match(/run-new-zealand-official-window\.mjs/g) ?? []).length, 2, 'New Zealand must be collected in both normal and latest-main rebuild paths');
assert.equal((workflow.match(/--authority-id=new-zealand-thoroughbred-racing/g) ?? []).length, 2, 'New Zealand Thoroughbred observations must be applied in both execution paths');
assert.equal((workflow.match(/--authority-id=harness-racing-new-zealand/g) ?? []).length, 2, 'New Zealand harness observations must be applied in both execution paths');
assert.equal((workflow.match(/--artifact=\.calendar-unified\/new-zealand-thoroughbred\.json/g) ?? []).length, 6, 'New Zealand Thoroughbred artifact must pass exclusion, apply, and meeting-presence layers in both execution paths');
assert.equal((workflow.match(/--artifact=\.calendar-unified\/new-zealand-harness\.json/g) ?? []).length, 6, 'New Zealand harness artifact must pass exclusion, apply, and meeting-presence layers in both execution paths');
assert.equal((workflow.match(/--racing-system-id=new-zealand-thoroughbred-system/g) ?? []).length, 2, 'New Zealand Thoroughbred apply path must bind the canonical racing system id in both execution paths');
assert.equal((workflow.match(/--racing-system-id=new-zealand-harness-system/g) ?? []).length, 2, 'New Zealand harness apply path must bind the canonical racing system id in both execution paths');
assert.equal((workflow.match(/--timezone=Pacific\/Auckland/g) ?? []).length, 4, 'New Zealand apply paths must bind Pacific/Auckland for both systems in both execution paths');

console.log('CALENDAR_REFRESH_PUBLICATION_BOUNDARIES: pass');
console.log('SOREC_UNIFIED_REFRESH_PATHS: 2');
console.log('IRELAND_HRI_UNIFIED_REFRESH_PATHS: 2');
console.log('PERU_MONTERRICO_UNIFIED_REFRESH_PATHS: 2');
console.log('SAUDI_JCSA_UNIFIED_REFRESH_PATHS: 2');
console.log('FRANCE_FNCH_UNIFIED_REFRESH_PATHS: 2');
console.log('NEW_ZEALAND_UNIFIED_REFRESH_PATHS: 2');
