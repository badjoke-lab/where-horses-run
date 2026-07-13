import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildJapanCurrentWindowAuditV1, validateJapanCurrentWindowAuditV1 } from './japan-current-window-audit-core.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const argument = (name) => process.argv.find((item) => item.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;
const outputArg = argument('output');
const generatedAt = argument('generated-at') ?? new Date().toISOString();
if (!outputArg) throw new Error('--output=<path> is required');
const outputPath = path.resolve(outputArg);
const relativeOutput = path.relative(root, outputPath);
if (relativeOutput === '' || (!relativeOutput.startsWith('..') && !path.isAbsolute(relativeOutput))) {
  throw new Error('Japan current-window audit output must remain outside the repository');
}
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const audit = buildJapanCurrentWindowAuditV1({
  policy: readJson('data/static/calendar-japan-current-window-policy-v1.json'),
  canonical: readJson('data/generated/timetable/canonical/meetings.json'),
  acquisitionRegistry: readJson('data/static/calendar-acquisition-registry.json'),
  runnerCompatibility: readJson('data/static/calendar-runner-compatibility-contract-v1.json'),
  generatedAt,
});
const errors = validateJapanCurrentWindowAuditV1(audit);
if (errors.length) throw new Error(`Japan current-window audit validation failed: ${errors.join('; ')}`);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(audit, null, 2)}\n`);
console.log(JSON.stringify({
  schema_version: 'calendar-japan-current-window-audit-summary-v1',
  work_id: audit.work_id,
  implementation_unit: audit.implementation_unit,
  window: audit.window,
  canonical_generated_at: audit.canonical_generated_at,
  summary: audit.summary,
  systems: audit.systems.map((system) => ({
    system_id: system.system_id,
    canonical_meeting_count: system.canonical_meeting_count,
    rank_counts: system.rank_counts,
    target_ready_count: system.target_ready_count,
    retry_required_count: system.retry_required_count,
    operational_state: system.operational_state,
    primary_runner: system.primary_runner,
    executor_id: system.executor_id,
  })),
  output_path: outputPath,
  network_fetch: false,
  canonical_write: false,
  public_write: false,
  publication_effect: 'none',
}, null, 2));
