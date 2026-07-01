import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const checkOnly = process.argv.includes('--check');
const activePath = 'data/candidates/japan-nar-candidates.json';
const archivePath = 'data/archive/timetable/candidates/japan-nar-candidates.v0.json';
const controlPath = 'data/static/local-racing-pilot-control.json';
const readJson = (file) => JSON.parse(readFileSync(path.join(root, file), 'utf8'));

function fail(message) {
  console.error(`Local racing candidate generation is disabled: ${message}`);
  process.exit(1);
}

const control = readJson(controlPath);
if (control.schema_version !== 'local-racing-pilot-control-v1') fail('unexpected control schema');
if (control.work_id !== 'WHR-CAL-JAPAN-NAR') fail('unexpected Work ID');
if (control.mode !== 'link_only_review' || control.candidate_mode !== 'disabled') {
  fail('Calendar Readiness has not authorized candidate generation');
}

if (!checkOnly) {
  fail('current link-only readiness permits an official link only; review authority-specific timetable evidence and update Calendar Readiness before creating a Pipeline v1 candidate');
}

if (existsSync(path.join(root, activePath))) fail(`${activePath} must not exist`);
if (!existsSync(path.join(root, archivePath))) fail(`${archivePath} is missing`);

const archived = readJson(archivePath);
if (archived.schema_version !== 'timetable-candidates-v0') fail('legacy archive schema changed');
if (archived.source_adapter_id !== 'japan-nar-dry-run-adapter') fail('legacy archive adapter identity changed');
if (archived.generated_at !== '2026-05-29T00:00:00Z') fail('legacy archive generation timestamp changed');
if (!Array.isArray(archived.records) || archived.records.length !== 12) fail('legacy archive must retain 12 records');
if (archived.review?.review_status !== 'needs_review') fail('legacy archive review state changed');
if (!archived.records.every((record) => record.review_status === 'needs_review' && record.extraction_method === 'adapter_dry_run')) {
  fail('legacy archive record state changed');
}

console.log('Japan local-racing candidate guard passed: active candidate absent, legacy v0 artifact quarantined, link-only mode retained.');
