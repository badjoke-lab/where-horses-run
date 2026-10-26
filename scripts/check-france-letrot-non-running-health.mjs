import assert from 'node:assert/strict';
import { summarizeFranceLetrotNonRunningHealth as summarize } from './timetable/summarize-france-letrot-non-running-health.mjs';

function artifact(status, rows) {
  return { diagnostics: { non_running: {
    status,
    confirmed_non_running_count: 0,
    bulletin_results: rows.map(value => ({status: value})),
  } } };
}
const bounded = summarize(artifact('partial_success', [
  'success', 'bulletin_unavailable_404', 'bulletin_unavailable_404'
]));
assert.equal(bounded.classification, 'bounded_document_unavailable');
assert.equal(bounded.counts.success, 1);
assert.equal(bounded.counts.bulletin_unavailable_404, 2);
assert.equal(bounded.counts.source_error, 0);
assert.equal(bounded.confirmed_non_running_count, 0);

const failed = summarize(artifact('partial_success', ['success','source_error','bulletin_unavailable_404']));
assert.equal(failed.classification, 'source_or_parse_error');
assert.equal(failed.counts.source_error, 1);
const parseFailed = summarize(artifact('partial_success', ['success','unexpected_parser_status']));
assert.equal(parseFailed.classification, 'source_or_parse_error');
assert.equal(parseFailed.counts.other, 1);
assert.equal(summarize(artifact('success', ['success','success'])).classification, 'complete_for_checked_bulletins');
assert.equal(summarize(artifact('partial_success', [])).classification, 'not_verified');
assert.equal(summarize({}).classification, 'not_verified');
assert.equal(summarize(null).status, 'artifact_missing');
assert.equal(summarize(null).confirmed_non_running_count, 0);

// Availability of a PDF document is not non-running evidence.
assert.ok(!('meeting_presence_records' in bounded));
console.log('FRANCE_LETROT_NON_RUNNING_HEALTH: pass');
