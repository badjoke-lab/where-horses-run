import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const parse = (file) => {
  try { return JSON.parse(read(file)); }
  catch (error) { fail(`${file} must parse: ${error.message}`); return null; }
};

const manifestPath = 'data/audits/calendar-pipeline-v1-release-gate.json';
const manifest = parse(manifestPath);
const publicList = parse('data/generated/timetable/public/meeting-list.json');
const publicDetails = parse('data/generated/timetable/public/meeting-details.json');
const jraCandidates = parse('data/candidates/japan-jra-candidates.json');
const refreshWorkflow = read('.github/workflows/timetable-scheduled-refresh.yml');
const startHere = read('START-HERE.md');
const projectRoadmap = read('docs/project-roadmap.md');
const implementationRoadmap = read('docs/calendar/implementation-roadmap.md');

if (manifest) {
  if (manifest.schema_version !== 'calendar-pipeline-v1-release-gate-v1') fail('unexpected release gate schema.');
  if (manifest.work_id !== 'WHR-CAL-PIPELINE-V1' || manifest.status !== 'complete') fail('Pipeline v1 manifest must be complete.');
  if (manifest.next_work_id !== 'WHR-CAL-DYNAMIC-DATES') fail('next_work_id must be WHR-CAL-DYNAMIC-DATES.');
  if (manifest.following_work_id !== 'WHR-CAL-OPS-V1') fail('following_work_id must be WHR-CAL-OPS-V1.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(manifest.completed_at ?? '')) fail('completed_at must be YYYY-MM-DD.');

  const requiredOperational = [
    'normal_build_read_only',
    'public_runtime_reads_public_projection_only',
    'human_promotion_required',
    'public_projection_separate_from_promotion'
  ];
  requiredOperational.forEach((key) => {
    if (manifest.operational_state?.[key] !== true) fail(`operational_state.${key} must be true.`);
  });
  for (const key of ['candidate_generation_is_publication','scheduled_refresh_active','unattended_publication_active']) {
    if (manifest.operational_state?.[key] !== false) fail(`operational_state.${key} must be false.`);
  }

  const expectedLayers = [
    'static-build-boundary',
    'candidate-contract',
    'canonical-promotion',
    'deterministic-public-projection',
    'production-runtime-import-boundary',
    'jra-reference-adapter',
    'rendered-public-release-qa'
  ];
  const layers = Array.isArray(manifest.completed_layers) ? manifest.completed_layers : [];
  const layerIds = layers.map((layer) => layer.id);
  if (JSON.stringify(layerIds) !== JSON.stringify(expectedLayers)) fail('completed_layers order or membership is incorrect.');
  for (const layer of layers) {
    if (!existsSync(path.join(root, layer.contract))) fail(`missing release layer contract: ${layer.contract}`);
    if (!existsSync(path.join(root, layer.validator))) fail(`missing release layer validator: ${layer.validator}`);
  }

  const validators = Array.isArray(manifest.required_validator_order) ? manifest.required_validator_order : [];
  for (const validator of validators) {
    if (!existsSync(path.join(root, validator))) {
      fail(`missing required validator: ${validator}`);
      continue;
    }
    const result = spawnSync(process.execPath, [validator], {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024
    });
    process.stdout.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    if (result.status !== 0) fail(`required validator failed: ${validator}`);
  }
}

if (publicList?.meetings?.length !== manifest?.public_release?.meeting_count) fail('public meeting count differs from release manifest.');
if (publicDetails?.details?.length !== manifest?.public_release?.detail_count) fail('public detail count differs from release manifest.');
if (publicList?.generated_at !== publicDetails?.generated_at) fail('public projection generated_at values must match.');

if (jraCandidates?.schema_version !== 'timetable-candidate-v1') fail('JRA reference candidate must use timetable-candidate-v1.');
if (jraCandidates?.adapter_id !== manifest?.reference_adapter?.adapter_id) fail('JRA reference adapter ID differs from release manifest.');
if (jraCandidates?.records?.length !== manifest?.reference_adapter?.record_count) fail('JRA candidate count differs from release manifest.');
if (jraCandidates?.review?.status !== 'needs_review') fail('JRA candidate must remain needs_review at Pipeline v1 completion.');
if (jraCandidates?.review?.reviewed_at !== null || jraCandidates?.review?.reviewer !== null || jraCandidates?.review?.promotion_target !== null) {
  fail('JRA candidate must not claim approval at Pipeline v1 completion.');
}

if (/^\s*schedule:/m.test(refreshWorkflow) || refreshWorkflow.includes('cron:')) fail('scheduled refresh must remain paused.');
if (!refreshWorkflow.includes('workflow_dispatch:') || !refreshWorkflow.includes('default: "false"')) fail('manual refresh review must default live_fetch to false.');

for (const [file, text, markers] of [
  ['START-HERE.md', startHere, ['Previous completed implementation Work ID: `WHR-CAL-JAPAN-JRA`', 'WHR-CAL-JAPAN-NAR', 'WHR-CAL-JAPAN-BANEI']],
  ['docs/project-roadmap.md', projectRoadmap, ['Current Work ID: `WHR-CAL-JAPAN-NAR`', 'Next Work ID: `WHR-CAL-JAPAN-BANEI`', 'Completed Work ID: `WHR-CAL-OPS-V1`']],
  ['docs/calendar/implementation-roadmap.md', implementationRoadmap, ['Pipeline v1 status: complete', 'Dynamic Dates status: complete', 'Operations v1 status: complete', 'Current Work ID: `WHR-CAL-JAPAN-NAR`', 'Next Work ID: `WHR-CAL-JAPAN-BANEI`']]
]) {
  markers.forEach((marker) => { if (!text.includes(marker)) fail(`${file} must include ${marker}.`); });
}

if (!Array.isArray(manifest?.not_completed_by_pipeline_v1) || manifest.not_completed_by_pipeline_v1.length < 6) {
  fail('release manifest must list remaining dynamic-date and operations work.');
}

if (errors.length) {
  console.error(`CALENDAR_PIPELINE_V1_RELEASE_GATE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_PIPELINE_V1_RELEASE_GATE: pass');
console.log(`PUBLIC_MEETINGS: ${publicList.meetings.length}`);
console.log(`PUBLIC_DETAILS: ${publicDetails.details.length}`);
console.log(`JRA_REFERENCE_CANDIDATES: ${jraCandidates.records.length}`);
console.log('SCHEDULED_REFRESH_ACTIVE: false');
console.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-NAR');
console.log('NEXT_WORK_ID: WHR-CAL-JAPAN-BANEI');
