import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'calendar-audit-check-'));
const repo = path.join(root, 'repo');
const artifacts = path.join(root, 'artifact');
const output = path.join(root, 'summary.json');
fs.mkdirSync(repo, { recursive: true });
fs.mkdirSync(path.join(artifacts, '.calendar-unified'), { recursive: true });
fs.mkdirSync(path.join(artifacts, 'data/generated/timetable'), { recursive: true });

function git(args, env = {}) {
  return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', env: { ...process.env, ...env } }).trim();
}
function write(rel, value) {
  const file = path.join(repo, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}
function writeArtifact(rel, value) {
  const file = path.join(artifacts, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}
function state(rank, freshness) {
  const hk = { meeting_id: 'hk-test-2026-09-11', country_id: 'hong-kong', authority_id: 'hkjc', capability_rank: rank, freshness: { generated_at: freshness, last_checked_date: '2026-09-11' } };
  const jra = { meeting_id: 'jra-test-2026-09-11', country_id: 'japan', authority_id: 'japan-racing-association', capability_rank: 'A+', freshness: { generated_at: freshness, last_checked_date: '2026-09-11' } };
  write('data/generated/timetable/canonical/meetings.json', { meetings: [hk, jra] });
  write('data/generated/timetable/canonical/meeting-details.json', { details: [] });
  write('data/generated/timetable/public/meeting-list.json', { meetings: [
    { ...hk, effective_public_rank: rank },
    { ...jra, effective_public_rank: 'A+' },
  ] });
  write('data/generated/timetable/public/meeting-details.json', { details: [] });
}

try {
  git(['init']);
  git(['config', 'user.name', 'test']);
  git(['config', 'user.email', 'test@example.invalid']);
  state('C', '2026-09-11T00:00:00Z');
  git(['add', '.']);
  git(['commit', '-m', 'base'], { GIT_AUTHOR_DATE: '2026-09-11T00:00:00Z', GIT_COMMITTER_DATE: '2026-09-11T00:00:00Z' });
  const base = git(['rev-parse', 'HEAD']);

  state('B', '2026-09-11T00:05:00Z');
  git(['add', '.']);
  git(['commit', '-m', 'data: refresh unified official rolling timetable (full)'], { GIT_AUTHOR_DATE: '2026-09-11T00:05:00Z', GIT_COMMITTER_DATE: '2026-09-11T00:05:00Z' });
  const result = git(['rev-parse', 'HEAD']);

  writeArtifact('.calendar-unified/hkjc.json', {
    generated_at: '2026-09-11T00:04:00Z',
    discovery: { detail_status_counts: { not_published: 0, source_error: 0 } },
    records: [{ meeting_id: 'hk-test-2026-09-11' }],
  });
  writeArtifact('data/generated/timetable/japan-zero-based-30d-reconciliation.json', {
    checked_at: '2026-09-11T00:03:00Z', scope: 'full', complete: true, mother_set_complete: true,
    official_meeting_count: 1, source_completeness: [],
    reconciliations: [{
      meeting_id: 'jra-test-2026-09-11', acquisition_group: 'jra', outcome: 'no_op',
      acquisition_completion: 'complete_current_best_available', official_rank: 'A+', public_rank: 'A+',
    }],
  });

  const builder = path.resolve('scripts/timetable/build-refresh-audit-summary.mjs');
  const run = spawnSync(process.execPath, [
    builder,
    `--repo-root=${repo}`,
    `--artifact-root=${artifacts}`,
    '--source-run-id=123',
    `--source-head-sha=${base}`,
    '--run-started-at=2026-09-11T00:01:00Z',
    '--run-completed-at=2026-09-11T00:10:00Z',
    '--source-conclusion=success',
    `--output=${output}`,
  ], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr || run.stdout);

  const summary = JSON.parse(fs.readFileSync(output, 'utf8'));
  assert.equal(summary.result_sha, result);
  const hk = summary.systems.find((row) => row.authority_id === 'hkjc');
  assert.equal(hk.checked, 1);
  assert.equal(hk.changed, 1);
  assert.equal(hk.promoted, 1);
  const jra = summary.systems.find((row) => row.acquisition_group === 'jra');
  assert.equal(jra.checked, 1);
  assert.equal(jra.changed, 0, 'freshness-only change must not count as substantive');
  assert.equal(jra.promoted, 0);
  console.log('refresh audit summary check: ok');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
