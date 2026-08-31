import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const refreshCorePath = fileURLToPath(new URL('./refresh-core.mjs', import.meta.url));

test('skeleton refresh reporting leaves the current timetable untouched', async () => {
  const originalCwd = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-timetable-refresh-'));
  const generatedDir = path.join(tempRoot, 'data/generated/timetable');
  const currentPath = path.join(generatedDir, 'current.json');
  const sentinelCurrent = {
    schema_version: 'current-timetable-v0',
    generated_at: '2026-08-31T00:00:00.000Z',
    records: [{ id: 'must-survive-skeleton-refresh' }]
  };

  try {
    fs.mkdirSync(generatedDir, { recursive: true });
    fs.writeFileSync(currentPath, `${JSON.stringify(sentinelCurrent, null, 2)}\n`);
    process.chdir(tempRoot);

    const refreshCore = await import(
      `${pathToFileURL(refreshCorePath).href}?preserve-current=${Date.now()}`
    );
    const report = refreshCore.writeCommandReport('refresh:timetable', []);

    assert.equal(report.mode, 'skeleton_no_live_fetch');
    assert.deepEqual(JSON.parse(fs.readFileSync(currentPath, 'utf8')), sentinelCurrent);
    assert.equal(fs.existsSync(path.join(generatedDir, 'update-report.json')), true);
    assert.equal(fs.existsSync(path.join(generatedDir, 'source-health.json')), true);
    assert.equal(fs.existsSync(path.join(generatedDir, 'promotion-status.json')), true);
  } finally {
    process.chdir(originalCwd);
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
