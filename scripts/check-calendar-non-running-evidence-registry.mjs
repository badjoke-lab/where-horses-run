import fs from 'node:fs';

function readJson(path) { return JSON.parse(fs.readFileSync(path, 'utf8')); }
function assert(condition, message) { if (!condition) throw new Error(message); }

const registry = readJson('data/static/calendar-non-running-evidence-registry-v1.json');
const support = readJson('data/static/calendar-public-country-support-v1.json');

assert(registry.schema_version === 'calendar-non-running-evidence-registry-v1', 'non-running registry schema_version mismatch');
assert(Array.isArray(registry.records) && registry.records.length > 0, 'non-running registry has no records');

const modes = new Set(['automated', 'reviewed', 'unsupported']);
const automation = new Set(['active', 'candidate', 'not_implemented']);
const seenRecords = new Set();
const seenSystems = new Set();
const countries = new Set();

for (const row of registry.records) {
  assert(typeof row.record_id === 'string' && row.record_id, 'non-running record has no record_id');
  assert(!seenRecords.has(row.record_id), `duplicate non-running record_id ${row.record_id}`);
  seenRecords.add(row.record_id);
  assert(typeof row.system_id === 'string' && row.system_id, `${row.record_id} has no system_id`);
  assert(!seenSystems.has(row.system_id), `duplicate non-running system_id ${row.system_id}`);
  seenSystems.add(row.system_id);
  assert(typeof row.country_id === 'string' && row.country_id, `${row.record_id} has no country_id`);
  assert(typeof row.authority_id === 'string' && row.authority_id, `${row.record_id} has no authority_id`);
  assert(modes.has(row.mode), `${row.record_id} has invalid mode ${row.mode}`);
  assert(automation.has(row.automation_status), `${row.record_id} has invalid automation_status ${row.automation_status}`);
  assert(row.source_absence_policy === 'absent_unconfirmed', `${row.record_id} must preserve source absence as absent_unconfirmed`);
  assert(row.acquisition_failure_policy === 'preserve_verified_state', `${row.record_id} must preserve verified state on acquisition failure`);
  assert(row.partial_race_policy === 'never_promote_to_whole_meeting', `${row.record_id} must not promote partial race cancellation`);
  assert(row.replacement_date_policy === 'independent_meeting_only', `${row.record_id} must not infer replacement dates`);
  assert(Array.isArray(row.evidence_urls), `${row.record_id} evidence_urls must be an array`);
  if (row.mode === 'unsupported') {
    assert(row.automation_status === 'not_implemented', `${row.record_id} unsupported mode cannot claim automation`);
    assert(row.whole_meeting_non_running === 'not_proven', `${row.record_id} unsupported mode cannot claim whole-meeting support`);
  } else {
    assert(row.whole_meeting_non_running === 'supported', `${row.record_id} supported mode must prove whole-meeting evidence`);
    assert(row.evidence_urls.length > 0, `${row.record_id} supported mode requires official evidence source URL(s)`);
  }
  if (row.mode === 'automated') assert(row.automation_status === 'active', `${row.record_id} automated mode must be active`);
  if (row.automation_status === 'active') assert(row.mode === 'automated', `${row.record_id} active automation must use automated mode`);
  countries.add(row.country_id);
}

const supportedCountries = (support.countries ?? []).filter((row) => row.calendar_supported === true).map((row) => row.country_id);
const missingCountries = supportedCountries.filter((countryId) => !countries.has(countryId));
assert(missingCountries.length === 0, `production Calendar countries missing non-running classification: ${missingCountries.join(', ')}`);

for (const systemId of ['japan-jra-system', 'japan-nar-system', 'japan-banei-system']) {
  assert(seenSystems.has(systemId), `Japan production system missing non-running classification: ${systemId}`);
}

const counts = Object.fromEntries([...modes].map((mode) => [mode, registry.records.filter((row) => row.mode === mode).length]));
console.log(JSON.stringify({
  schema_version: registry.schema_version,
  production_country_count: supportedCountries.length,
  classified_country_count: new Set(registry.records.map((row) => row.country_id)).size,
  classified_system_count: registry.records.length,
  mode_counts: counts,
  unclassified_production_countries: missingCountries
}));
