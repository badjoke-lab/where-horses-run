import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { executeTjkScheduledDryRun } from './run-m5-tjk-scheduled-dry-run.mjs';
import { buildTjkScheduledRankCCandidate } from './timetable/tjk-current-future-rank-c-adapter.mjs';

const SUCCESS_DIR = 'artifacts/m5-scheduled/contract-success';
const ERROR_DIR = 'artifacts/m5-scheduled/contract-error';
const RUN_AT = '2026-08-16T02:00:00Z';
const ENTRY_URL = 'https://www.tjk.org/TR/YarisSever/Info/Page/GunlukYarisProgrami';
const FUTURE_URL = 'https://www.tjk.org/TR/YarisSever/Info/Page/GunlukYarisProgrami?QueryParameter_Tarih=17%2F08%2F2026';
const ANKARA_DETAIL = 'https://www.tjk.org/TR/YarisSever/Info/Sehir/GunlukYarisProgrami?QueryParameter_Tarih=16%2F08%2F2026&SehirAdi=Ankara&SehirId=5';
const ISTANBUL_DETAIL = 'https://www.tjk.org/TR/YarisSever/Info/Sehir/GunlukYarisProgrami?QueryParameter_Tarih=17%2F08%2F2026&SehirAdi=%C4%B0stanbul&SehirId=3';

const entryHtml = `
<a href="/TR/YarisSever/Info/Sehir/GunlukYarisProgrami?QueryParameter_Tarih=16%2F08%2F2026&amp;SehirAdi=Ankara&amp;SehirId=5">Ankara (50. Y.G.)</a>
<a href="${FUTURE_URL.replaceAll('&', '&amp;')}">17.08.2026</a>
<a href="https://evil.example/TR/YarisSever/Info/Sehir/GunlukYarisProgrami?QueryParameter_Tarih=16%2F08%2F2026&amp;SehirAdi=Fake&amp;SehirId=99">Fake</a>`;
const futureHtml = `
<a href="/TR/YarisSever/Info/Sehir/GunlukYarisProgrami?QueryParameter_Tarih=17%2F08%2F2026&amp;SehirAdi=%C4%B0stanbul&amp;SehirId=3">İstanbul (50. Y.G.)</a>`;
const ankaraDetailHtml = '<main>1. Koşu: 14:00 2. Koşu: 14:30 3. Koşu: 15:00</main>';
const istanbulDetailHtml = '<main>Programme listed; post times pending.</main>';

function okFetch(url) {
  const body = url === ENTRY_URL ? entryHtml
    : url === FUTURE_URL ? futureHtml
      : url === ANKARA_DETAIL ? ankaraDetailHtml
        : url === ISTANBUL_DETAIL ? istanbulDetailHtml
          : null;
  assert.notEqual(body, null, `unexpected fixture fetch: ${url}`);
  return Promise.resolve({ ok: true, status: 200, text: async () => body });
}

function errorFetch() {
  return Promise.resolve({ ok: false, status: 503, text: async () => '<html>not retained</html>' });
}

function fixedClock() {
  return new Date('2026-08-16T02:00:01Z');
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
}

for (const dir of [SUCCESS_DIR, ERROR_DIR]) fs.rmSync(path.resolve(dir), { recursive: true, force: true });

try {
  const success = await executeTjkScheduledDryRun({ runAt: RUN_AT, outputDir: SUCCESS_DIR, fetchImpl: okFetch, clock: fixedClock });
  assert.equal(success.ok, true);
  assert.equal(success.status, 'success_candidate_generated');
  assert.equal(success.candidateCount, 2);
  assert.match(success.candidateSha256, /^[a-f0-9]{64}$/);

  const candidate = readJson(success.candidatePath);
  assert.equal(candidate.schema_version, 'timetable-candidate-v1');
  assert.equal(candidate.adapter_id, 'tjk-scheduled-current-future-best-available-v1');
  assert.equal(candidate.candidate_rank, 'A');
  assert.equal(candidate.publication_ceiling, 'A');
  assert.equal(candidate.collection_target_rank, 'best_available');
  assert.equal(candidate.technical_capability_rank, 'A+');
  assert.deepEqual(candidate.rank_counts, { C: 1, A: 1 });
  assert.equal(candidate.review.status, 'pending');
  assert.equal(candidate.publication_effect, 'none');
  assert.deepEqual(candidate.records.map((record) => [record.date, record.source_venue_label, record.candidate_rank]), [
    ['2026-08-16', 'Ankara', 'A'],
    ['2026-08-17', 'İstanbul', 'C'],
  ]);

  const ankara = candidate.records[0];
  assert.equal(ankara.publication_ceiling, 'A');
  assert.equal(ankara.first_race_time_local, '14:00');
  assert.equal(ankara.last_race_time_local, '15:00');
  assert.equal(ankara.timetable_rows.length, 3);
  assert.equal(ankara.review_status, 'pending');
  assert.equal(ankara.public_racecourse_identity_status, 'unregistered-not-authorized-by-scheduled-discovery');

  const istanbul = candidate.records[1];
  assert.equal(istanbul.publication_ceiling, 'A');
  assert.equal(istanbul.first_race_time_local, null);
  assert.equal(istanbul.last_race_time_local, null);
  assert.deepEqual(istanbul.timetable_rows, []);
  assert.equal(istanbul.review_status, 'pending');

  const runLog = readJson(success.runLogPath);
  assert.equal(runLog.schema, 'scheduled-candidate-run-log-v1');
  assert.equal(runLog.run_mode, 'dry_run');
  assert.equal(runLog.status, 'success_candidate_generated');
  assert.equal(runLog.candidate.count, 2);
  assert.equal(runLog.candidate.sha256, success.candidateSha256);
  assert.equal(runLog.effects.human_review_required, true);
  for (const key of ['candidate_approved', 'promotion_invoked', 'canonical_write', 'public_projection_write', 'merge', 'deploy']) {
    assert.equal(runLog.effects[key], false, `${key} must remain false`);
  }

  const sourceBatch = readJson(success.sourceBatchPath);
  assert.equal(sourceBatch.raw_body_retained, false);
  assert.equal(Object.hasOwn(sourceBatch, 'raw_body'), false);
  assert.deepEqual(sourceBatch.discovery.rank_counts, { C: 1, A: 1 });
  assert.throws(
    () => buildTjkScheduledRankCCandidate(sourceBatch, { today: '2026-08-15' }),
    /effective_today must match the explicit Turkey run date/,
  );

  const diffHtml = fs.readFileSync(path.resolve(success.diffPath), 'utf8');
  assert.match(diffHtml, /REVIEW ONLY — NOT PUBLICATION/);
  assert.match(diffHtml, /noindex,nofollow,noarchive/);
  assert.doesNotMatch(diffHtml, /<button\b/i);
  assert.doesNotMatch(diffHtml, /<form\b/i);

  const failed = await executeTjkScheduledDryRun({ runAt: RUN_AT, outputDir: ERROR_DIR, fetchImpl: errorFetch, clock: fixedClock });
  assert.equal(failed.ok, false);
  assert.equal(failed.status, 'source_error');
  assert.equal(failed.candidatePath, null);
  assert.equal(failed.diffPath, null);
  const failedLog = readJson(failed.runLogPath);
  assert.equal(failedLog.status, 'source_error');
  assert.equal(failedLog.candidate.count, 0);
  assert.equal(failedLog.candidate.artifact_path, null);
  assert.equal(failedLog.candidate.sha256, null);
  assert.equal(failedLog.effects.public_projection_write, false);
  assert.equal(fs.existsSync(path.resolve(`${ERROR_DIR}/candidate.json`)), false);
  assert.equal(fs.existsSync(path.resolve(`${ERROR_DIR}/source-batch.json`)), false);
  assert.equal(fs.existsSync(path.resolve(`${ERROR_DIR}/candidate-diff.html`)), false);
  assert.doesNotMatch(fs.readFileSync(path.resolve(failed.runLogPath), 'utf8'), /<html>/i);

  const workflow = fs.readFileSync(path.resolve('.github/workflows/calendar-tjk-current-future-candidates.yml'), 'utf8');
  assert.match(workflow, /schedule:\s*\n\s*- cron: '17 1 \* \* \*'/);
  assert.match(workflow, /permissions:\s*\n\s*contents: read/);
  assert.doesNotMatch(workflow, /contents:\s*write/);
  assert.doesNotMatch(workflow, /pull-requests:\s*write/);
  assert.doesNotMatch(workflow, /promote:timetable|promote-timetable|public_projection_write:\s*true|canonical_write:\s*true/i);
  assert.match(workflow, /live-read-only-collection:\s*\n\s*if: github\.event_name != 'pull_request'/);
  assert.match(workflow, /run-m5-tjk-scheduled-dry-run\.mjs/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /artifacts\/m5-scheduled/);

  console.log('M5 GitHub Actions dry-run check passed.');
  console.log('- scheduled TJK live discovery preserves C/A best-available detail observations');
  console.log('- A is emitted only for complete contiguous Race 1-N post-time rows; detail-unavailable meetings remain C');
  console.log('- success writes source batch + candidate + run log + review diff artifact only');
  console.log('- source failure writes run log only and retains no raw response body');
  console.log('- workflow is read-only and contains no promotion/publication/merge/deploy capability');
} finally {
  for (const dir of [SUCCESS_DIR, ERROR_DIR]) fs.rmSync(path.resolve(dir), { recursive: true, force: true });
}
