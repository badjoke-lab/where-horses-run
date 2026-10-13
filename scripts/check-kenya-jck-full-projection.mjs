import assert from 'node:assert/strict';
import fs from 'node:fs';

// Verify every source-observed meeting from the full Kenya window survived
// canonical application and public projection. A successful fetch or a
// green map-parity check by itself does not establish full-window coverage.
function arg(name, fallback) {
  const prefix = `--${name}=`;
  const value = process.argv.find((item) => item.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
}
function load(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
const artifact = load(arg('artifact', '.calendar-kenya/kenya.json'));
const canonical = load(arg('canonical', 'data/generated/timetable/canonical/meetings.json'));
const publicData = load(arg('public', 'data/generated/timetable/public/meeting-list.json'));

assert.equal(artifact.country_id, 'kenya');
assert.equal(artifact.window?.days, 180, 'full-window proof requires the 180-day source window');
assert.equal(artifact.acquisition_attempt?.status, 'success', 'Kenya acquisition failed');
assert.equal(artifact.diagnostics?.source_errors?.length ?? 0, 0, 'source errors present');
assert.equal(artifact.diagnostics?.parse_failures?.length ?? 0, 0, 'parser failures present');
assert.ok(Array.isArray(artifact.records), 'Kenya source records missing');
assert.equal(artifact.records.length, artifact.discovery?.window_visible_rows, 'source-window count mismatch');
assert.ok(Array.isArray(canonical.meetings), 'canonical meetings missing');
assert.ok(Array.isArray(publicData.meetings), 'public meetings missing');

const ids = new Set();
const canonicalById = new Map(canonical.meetings.map((row) => [row.meeting_id, row]));
const publicById = new Map(publicData.meetings.map((row) => [row.meeting_id, row]));
for (const record of artifact.records) {
  const id = record.meeting_id;
  assert.ok(id && !ids.has(id), `missing or duplicate source meeting ID: ${id}`);
  ids.add(id);
  const actualCanonical = canonicalById.get(id);
  const actualPublic = publicById.get(id);
  assert.ok(actualCanonical, `Kenya full meeting missing from canonical: ${id}`);
  assert.ok(actualPublic, `Kenya full meeting missing from public: ${id}`);
  for (const [label, actual] of [['canonical', actualCanonical], ['public', actualPublic]]) {
    assert.equal(actual.country_id, 'kenya', `${label} country mismatch: ${id}`);
    assert.equal(actual.date, record.date, `${label} date mismatch: ${id}`);
    assert.equal(actual.racecourse_id, record.racecourse_id, `${label} venue mismatch: ${id}`);
  }
}
console.log(`KENYA_JCK_FULL_PROJECTION: pass (${ids.size} full-window meetings in canonical and public)`);
