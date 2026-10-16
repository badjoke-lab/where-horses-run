import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflows = [
  ['unified', '.github/workflows/calendar-unified-official-refresh.yml', 'unified-smoke'],
  ['near', '.github/workflows/calendar-near-official-refresh.yml', 'near-smoke'],
];

for (const [label, path, smokeGroup] of workflows) {
  const text = fs.readFileSync(path, 'utf8');
  assert.match(text, /stage_remaining_state\(\)\s*\{/, label + ': stage_remaining_state helper missing');
  // Regression: an official artifact must be collected and screened before
  // its apply step. Flemington previously ran during the Japan phase and
  // failed every unified/near production refresh with ENOENT.
  const flemingtonCollect = text.indexOf(
    'node scripts/timetable/run-australia-victoria-flemington-2026-27-official-window.mjs',
  );
  const exclusions = text.indexOf('      - name: Enforce reviewed Calendar exclusions');
  const flemingtonApply = text.indexOf('      - name: Apply Australia Victoria Flemington approved C dates');
  const nonJapanApply = text.indexOf('      - name: Apply non-Japan official observations monotonically');
  assert.ok(
    flemingtonCollect >= 0 && exclusions > flemingtonCollect
      && flemingtonApply > exclusions && nonJapanApply > flemingtonApply,
    label + ': Flemington collection/exclusions must precede its one official apply step',
  );
  assert.equal(
    text.split('      - name: Apply Australia Victoria Flemington approved C dates').length - 1,
    1, label + ': Flemington apply step must occur exactly once',
  );

  assert.match(text, /wait_for_main_quiet\(\)\s*\{/, label + ': wait_for_main_quiet helper missing');
  assert.match(text, /required_stable_seconds=600/, label + ': 10-minute main quiet gate missing');
  assert.match(text, /max_wait_seconds=1800/, label + ': bounded quiet wait missing');
  assert.match(text, /max_attempts=5/, label + ': persistence retry budget missing');
  assert.match(text, /calendar-unified-family-\$\{\{ github\.event_name == 'pull_request'/, label + ': shared production concurrency family missing');
  assert.ok(text.includes("'" + smokeGroup + "' || 'production'"), label + ': expected smoke/production concurrency split missing');
  assert.match(text, /Rolling-state persistence exhausted \$max_attempts bounded candidate attempts/, label + ': terminal persistence guard missing');
}
const near = fs.readFileSync('.github/workflows/calendar-near-official-refresh.yml', 'utf8');
assert.match(near, /pull_request:\s*\n\s+paths:/, 'near: pull_request smoke trigger missing');


// Every standalone country refresh must recover safely when another lane
// advances main. Check dynamically so newly onboarded country workflows are
// covered without maintaining a manual list.
const countryWorkflows = fs.readdirSync('.github/workflows')
  .filter((name) => /^calendar-.+-official-refresh\.yml$/.test(name))
  .filter((name) => !['calendar-unified-official-refresh.yml', 'calendar-near-official-refresh.yml'].includes(name))
  .sort();
assert.ok(countryWorkflows.length > 0, 'standalone country refresh workflows missing');
for (const name of countryWorkflows) {
  const path = '.github/workflows/' + name;
  const text = fs.readFileSync(path, 'utf8');
  assert.match(text, /^\s*-\s*name:\s*Persist\b.+/m, name + ': named persistence step missing');
  assert.match(text, /node scripts\/check-calendar-public-map-parity\.mjs/, name + ': map parity validator missing');
  if (text.includes('persist_country_on_main')) {
    assert.match(text, /source scripts\/timetable\/persist-country-on-main\.sh/, name + ': persistence helper not sourced');
    assert.match(text, /recollect_on_main\(\)\s*\{/, name + ': latest-main recollection callback missing');
    assert.match(text, /persist_country_on_main\s+'[^']+'/, name + ': persistence helper not invoked');
  } else {
    // Three older routes use an equivalent inline bounded rebuild loop.
    assert.match(text, /git fetch origin main/, name + ': latest main is never fetched');
    assert.match(text, /git reset --hard "\$remote_main"/, name + ': latest-main rebuild missing');
    assert.match(text, /for attempt in 1 2 3; do/, name + ': bounded persistence retry missing');
    assert.match(text, /git push origin "\$candidate_sha:main"/, name + ': guarded candidate push missing');
  }
}

console.log('CALENDAR_PERSISTENCE_CONTENTION_CONTRACT: pass (' + countryWorkflows.length + ' country workflows)');
