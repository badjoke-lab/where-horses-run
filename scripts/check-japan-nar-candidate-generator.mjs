import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (file) => JSON.parse(readFileSync(path.join(root, file), 'utf8'));

const activePath = 'data/candidates/japan-nar-candidates.json';
const archivePath = 'data/archive/timetable/candidates/japan-nar-candidates.v0.json';
const controlPath = 'data/static/local-racing-pilot-control.json';
const commandPath = 'scripts/generate-japan-nar-candidates.mjs';

if (existsSync(path.join(root, activePath))) fail('Active file must be absent.');
if (!existsSync(path.join(root, archivePath))) fail('Historical archive is missing.');

const control = readJson(controlPath);
if (control.mode !== 'link_only_review') fail('Mode must remain link_only_review.');
if (control.candidate_mode !== 'disabled') fail('Candidate mode must remain disabled.');
if (control.expected_technical_rank !== 'C' || control.expected_public_ceiling !== 'C') fail('Rank boundary must remain C/C.');

const archived = readJson(archivePath);
if (archived.schema_version !== 'timetable-candidates-v0') fail('Historical schema changed.');
if (archived.source_adapter_id !== 'japan-nar-dry-run-adapter') fail('Historical adapter identity changed.');
if (archived.generated_at !== '2026-05-29T00:00:00Z') fail('Historical timestamp changed.');
if (archived.country_id !== 'japan') fail('Historical country changed.');
if (archived.review?.review_status !== 'needs_review') fail('Historical review state changed.');
if ((archived.records ?? []).length !== 12) fail('Historical record count must remain 12.');

for (const record of archived.records ?? []) {
  if (record.racing_system_id !== 'nar') fail(`${record.candidate_id}: system identity changed.`);
  if (record.source_id !== 'japan-nar-home') fail(`${record.candidate_id}: source identity changed.`);
  if (record.extraction_method !== 'adapter_dry_run') fail(`${record.candidate_id}: extraction method changed.`);
  if (record.review_status !== 'needs_review') fail(`${record.candidate_id}: review state changed.`);
}

const checkRun = spawnSync(process.execPath, [commandPath, '--check'], { cwd: root, encoding: 'utf8' });
if (checkRun.status !== 0) fail(`Guard check failed: ${checkRun.stderr || checkRun.stdout}`);
if (!checkRun.stdout.includes('legacy v0 artifact quarantined')) fail('Guard success marker is missing.');

const blockedRun = spawnSync(process.execPath, [commandPath], { cwd: root, encoding: 'utf8' });
if (blockedRun.status === 0) fail('Direct execution must be rejected in link-only mode.');
if (!`${blockedRun.stderr}${blockedRun.stdout}`.includes('current link-only readiness')) fail('Boundary explanation is missing.');

const source = readFileSync(path.join(root, commandPath), 'utf8');
for (const marker of ['writeFileSync', 'mkdirSync', 'data/generated/japan-active-timetable-records.json']) {
  if (source.includes(marker)) fail(`Retired writer marker remains: ${marker}.`);
}

if (errors.length) {
  console.error('Japan local-racing quarantine check failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Japan local-racing quarantine check passed.');
console.log('ACTIVE_FILE_PRESENT: false');
console.log('ARCHIVED_RECORDS: 12');
console.log('DIRECT_EXECUTION_ENABLED: false');
