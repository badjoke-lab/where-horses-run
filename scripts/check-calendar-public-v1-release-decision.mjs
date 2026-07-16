import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const parse = (file) => {
  try {
    return JSON.parse(read(file));
  } catch (error) {
    fail(`${file} must parse: ${error.message}`);
    return null;
  }
};
const requireOne = (text, markers, label) => {
  if (!markers.some((marker) => text.includes(marker))) fail(`${label} missing one of: ${markers.join(' | ')}`);
};

const decision = parse('data/audits/calendar-public-v1-release-decision-v1.json');
const surface = parse('data/audits/calendar-public-v1-surface-audit-v1.json');
const pilot = parse('data/audits/calendar-public-v1-pilot-record-reconciliation-v1.json');
const operations = parse('data/audits/calendar-public-v1-operations-presentation-v1.json');
const navigation = parse('data/audits/calendar-public-v1-navigation-qa-v1.json');
const scheduledWorkflow = read('.github/workflows/timetable-scheduled-refresh.yml');
const releaseWorkflow = read('.github/workflows/calendar-public-v1-release-decision.yml');
const startHere = read('START-HERE.md');
const projectRoadmap = read('docs/project-roadmap.md');
const implementationRoadmap = read('docs/calendar/implementation-roadmap.md');
const authority = read('docs/governance/document-authority.md');
const calendarIndex = read('docs/calendar/README.md');
const releaseDoc = read('docs/calendar/public-v1-release-decision.md');

if (decision) {
  if (decision.schema_version !== 'calendar-public-v1-release-decision-v1') fail('release decision schema differs');
  if (decision.decision_id !== 'calendar-public-v1-release-2026-07-14') fail('release decision ID differs');
  if (decision.work_id !== 'WHR-CAL-PUBLIC-V1') fail('release decision Work ID differs');
  if (decision.implementation_unit !== 'PUBLIC-V1-RELEASE-DECISION-01') fail('release decision implementation unit differs');
  if (decision.status !== 'complete') fail('release decision must be complete');
  if (decision.decision !== 'accepted_for_reviewed_static_public_operation') fail('release decision value differs');
  if (decision.completion_claim !== 'calendar_public_v1_release_criteria_satisfied') fail('release completion claim differs');
  if (decision.next_work_id !== 'WHR-RACECOURSE-PAGES-V1') fail('next Work ID differs');
  if (decision.next_stage !== 'racecourse_pages_and_page_link_architecture') fail('next stage differs');

  const requiredUnits = [
    'PUBLIC-V1-SURFACE-AUDIT-01',
    'PUBLIC-V1-PILOT-RECORD-RECONCILIATION-01',
    'PUBLIC-V1-OPERATIONS-PRESENTATION-01',
    'PUBLIC-V1-NAVIGATION-QA-01',
    'PUBLIC-V1-RELEASE-DECISION-01',
  ];
  if (JSON.stringify(decision.completed_units) !== JSON.stringify(requiredUnits)) fail('completed Public v1 units differ');

  for (const [criterion, value] of Object.entries(decision.release_criteria ?? {})) {
    if (value !== true) fail(`release criterion ${criterion} must be true`);
  }
  if (Object.keys(decision.release_criteria ?? {}).length !== 10) fail('ten Public v1 release criteria are required');

  for (const [boundary, value] of Object.entries(decision.boundaries ?? {})) {
    if (value !== false) fail(`release boundary ${boundary} must remain false`);
  }
  if (Object.keys(decision.boundaries ?? {}).length < 18) fail('release boundary set is incomplete');

  if (!Array.isArray(decision.evidence_records) || decision.evidence_records.length !== 4) fail('four Public v1 evidence records are required');
  if (!Array.isArray(decision.required_validators) || decision.required_validators.length !== 8) fail('eight required validators are required');
  if (!Array.isArray(decision.public_routes) || decision.public_routes.length !== 8) fail('eight release routes are required');
  if (!Array.isArray(decision.non_claims) || decision.non_claims.length < 6) fail('release non-claims are incomplete');
  if (!Array.isArray(decision.next_stage_scope) || decision.next_stage_scope.length < 6) fail('next-stage scope is incomplete');

  for (const file of [...decision.evidence_records, ...decision.required_validators]) {
    if (!existsSync(path.join(root, file))) fail(`required release evidence missing: ${file}`);
  }
}

if (surface?.schema_version !== 'calendar-public-v1-surface-audit-v1' || surface?.work_id !== 'WHR-CAL-PUBLIC-V1') fail('surface audit identity differs');
if (!surface || Object.values(surface.release_checks ?? {}).some((value) => value !== true)) fail('surface audit release checks are incomplete');
if (surface?.boundaries && Object.values(surface.boundaries).some((value) => value !== false)) fail('surface audit boundaries changed');

if (pilot?.schema_version !== 'calendar-public-v1-pilot-record-reconciliation-v1' || pilot?.implementation_unit !== 'PUBLIC-V1-PILOT-RECORD-RECONCILIATION-01') fail('pilot reconciliation identity differs');
if (!['implemented_for_review', 'complete'].includes(pilot?.status)) fail('pilot reconciliation status differs');
if ((pilot?.pilot_systems?.length ?? 0) !== 5) fail('five maintained pilot systems are required');

if (operations?.schema_version !== 'calendar-public-v1-operations-presentation-v1' || operations?.implementation_unit !== 'PUBLIC-V1-OPERATIONS-PRESENTATION-01') fail('operations presentation identity differs');
if (!['implemented_for_review', 'complete'].includes(operations?.status)) fail('operations presentation status differs');
if ((operations?.public_routes?.length ?? 0) !== 6) fail('six operations-presentation routes are required');
if (operations?.production_derivation?.automatic_publication !== false) fail('operations presentation must keep automatic publication disabled');

if (navigation?.schema_version !== 'calendar-public-v1-navigation-qa-v1' || navigation?.implementation_unit !== 'PUBLIC-V1-NAVIGATION-QA-01') fail('navigation QA identity differs');
if (!['active', 'complete'].includes(navigation?.status)) fail('navigation QA status differs');
if ((navigation?.static_route_pairs?.length ?? 0) !== 13) fail('thirteen static bilingual route pairs are required');
if ((navigation?.dynamic_route_families?.length ?? 0) !== 6) fail('six dynamic bilingual route families are required');
if (navigation?.boundaries && Object.values(navigation.boundaries).some((value) => value !== false)) fail('navigation QA boundaries changed');

for (const [file, text, markers] of [
  ['START-HERE.md', startHere, ['Completed Work ID: `WHR-CAL-PUBLIC-V1`', 'PUBLIC-V1-RELEASE-DECISION-01', 'docs/calendar/public-v1-release-decision.md']],
  ['docs/project-roadmap.md', projectRoadmap, ['Completed Work ID: `WHR-CAL-PUBLIC-V1`', 'Calendar Public v1 release decision accepted', 'racecourse pages and page-link architecture']],
  ['docs/calendar/implementation-roadmap.md', implementationRoadmap, ['Stage 11 — Calendar public v1', 'Status: complete', 'Completed implementation unit: `PUBLIC-V1-RELEASE-DECISION-01`']],
  ['docs/governance/document-authority.md', authority, ['docs/calendar/public-v1-release-decision.md', 'data/audits/calendar-public-v1-release-decision-v1.json', 'scripts/check-calendar-public-v1-release-decision.mjs']],
  ['docs/calendar/README.md', calendarIndex, ['public-v1-release-decision.md', 'WHR-CAL-PUBLIC-V1', 'WHR-RACECOURSE-PAGES-V1']],
  ['docs/calendar/public-v1-release-decision.md', releaseDoc, ['accepted_for_reviewed_static_public_operation', 'WHR-RACECOURSE-PAGES-V1', 'unattended publication', 'Completion Audit']],
]) {
  for (const marker of markers) if (!text.includes(marker)) fail(`${file} missing ${marker}`);
}

requireOne(startHere, [
  'Current Work ID: `WHR-RACECOURSE-PAGES-V1`',
  'Completed Work ID: `WHR-RACECOURSE-PAGES-V1`',
], 'START-HERE.md post-Public-v1 transition');
requireOne(projectRoadmap, [
  'Current Work ID: `WHR-RACECOURSE-PAGES-V1`',
  'Completed Work ID: `WHR-RACECOURSE-PAGES-V1`',
], 'docs/project-roadmap.md post-Public-v1 transition');
requireOne(implementationRoadmap, [
  'Current Work ID: `WHR-RACECOURSE-PAGES-V1`',
  'Completed Work ID: `WHR-RACECOURSE-PAGES-V1`',
], 'docs/calendar/implementation-roadmap.md post-Public-v1 transition');

if (/^\s*schedule:/m.test(scheduledWorkflow) || scheduledWorkflow.includes('cron:')) fail('scheduled acquisition execution must remain disabled');
if (!releaseWorkflow.includes('contents: read')) fail('release workflow must remain read-only');
for (const forbidden of ['contents: write', 'pull-requests: write', 'create-pull-request', 'wrangler', 'cloudflare']) {
  if (releaseWorkflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`release workflow contains forbidden marker ${forbidden}`);
}

if (!existsSync(path.join(root, 'dist'))) fail('dist is missing; run npm run build before the release decision checker');

for (const validator of decision?.required_validators ?? []) {
  const result = spawnSync(process.execPath, [validator], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
  });
  process.stdout.write(result.stdout ?? '');
  process.stderr.write(result.stderr ?? '');
  if (result.status !== 0) fail(`required validator failed: ${validator}`);
}

if (errors.length) {
  console.error(`CALENDAR_PUBLIC_V1_RELEASE_DECISION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_PUBLIC_V1_RELEASE_DECISION: pass');
console.log('COMPLETED_WORK_ID: WHR-CAL-PUBLIC-V1');
console.log('DECISION: accepted_for_reviewed_static_public_operation');
console.log('NEXT_WORK_ID: WHR-RACECOURSE-PAGES-V1');
console.log('SCHEDULED_JOB_EXECUTION: false');
console.log('UNATTENDED_PUBLICATION: false');
console.log('DEPLOYMENT: false');
