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

// Record the exact week and source response without copying bulletin text
// or fabricating a per-request check time from the artifact timestamp.
const traced = summarize({
  generated_at: '2026-10-28T15:56:44Z',
  diagnostics: { non_running: {
    status: 'partial_success',
    confirmed_non_running_count: 0,
    bulletin_results: [
      {
        source_url: 'https://pro.letrot.com/example/publication?annee=2026&semaine=43&type=BULLETIN',
        status: 'success'
      },
      {
        source_url: 'https://pro.letrot.com/example/publication?annee=2026&semaine=44&type=BULLETIN',
        status: 'bulletin_unavailable_404', error: 'HTTP 404'
      },
      {
        source_url: 'not-a-url',
        status: 'source_error', error: 'network failure',
        checked_at: '2026-10-28T15:56:20Z'
      }
    ]
  } }
});
assert.equal(traced.artifact_generated_at, '2026-10-28T15:56:44Z');
assert.equal(traced.bulletins.length, 3);
assert.deepEqual(traced.bulletins.map(item => [item.bulletin_year, item.bulletin_week]), [[2026,43],[2026,44],[null,null]]);
assert.equal(traced.bulletins[1].status, 'bulletin_unavailable_404');
assert.equal(traced.bulletins[1].error, 'HTTP 404');
assert.equal(traced.bulletins[1].checked_at, null, 'artifact timestamp must not be represented as a source request check time');
assert.equal(traced.bulletins[2].checked_at, '2026-10-28T15:56:20Z');
assert.ok(!('meeting_presence_records' in traced));
assert.deepEqual(summarize(null).bulletins, []);

// Availability of a PDF document is not non-running evidence.
assert.ok(!('meeting_presence_records' in bounded));
console.log('FRANCE_LETROT_NON_RUNNING_HEALTH: pass');
