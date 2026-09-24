import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('scripts/timetable/run-peru-monterrico-official-window.mjs','utf8');
assert.doesNotMatch(source,/successfulDateRequests===0\) throw new Error/, 'Peru total date API failure must not abort unified refresh');
assert.match(source,/status:'network_error'/, 'Peru total date API failure must be explicit acquisition failure');
assert.match(source,/coverage_claim:successfulDateRequests===0\?\(fallbackDiscovery\.meetings_recovered\?'source_visible_partial':'fetch_failed'\)/, 'Peru date API failure may claim only source-visible partial coverage when the official fallback actually recovers meetings; otherwise it must remain fetch_failed');
assert.match(source,/records=\[\], dates=\[\], errors=\[\]/, 'Peru failed discovery starts with zero replacement observations');
assert.match(source,/PERU_MONTERRICO_ENTRY_PROGRAMME_URL/, 'Peru recovery must use the same-authority official entry programme page');
assert.match(source,/fallbackDiscovery\.meetings_recovered===0/, 'Peru acquisition must stay failed when the fallback recovers nothing');
console.log('PERU_FETCH_FAILURE_RETENTION: pass');
