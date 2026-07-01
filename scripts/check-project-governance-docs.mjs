import fs from 'node:fs';

const errors = [];
const files = [
  'START-HERE.md', 'docs/project-roadmap.md', 'docs/governance/document-authority.md',
  'docs/governance/internal-source-handling.md', 'docs/calendar/README.md',
  'docs/calendar/source-test-v2-contract.md', 'docs/calendar/calendar-readiness-contract.md',
  'docs/calendar/machine-readable-contracts.md', 'docs/calendar/implementation-roadmap.md',
  'docs/calendar/japan-a-plus-reconciliation-plan.md',
  'docs/calendar/current-baseline-audit.md', 'docs/calendar/baseline-reconciliation-map.md', 'docs/calendar/pipeline-v1-release-gate.md', 'docs/calendar/dynamic-dates-release-gate.md', 'docs/calendar/operations-v1-contract.md', 'docs/calendar/operations-v1-release-gate.md', 'docs/country-pages/completion-contract.md',
  'data/static/source-test-v2.schema.json', 'data/static/calendar-readiness.schema.json',
  'data/static/calendar-readiness-registry.json', 'data/static/calendar-readiness-japan-v2.json', 'data/static/japan-a-plus-policy.json', 'data/static/local-racing-pilot-control-v2.json', 'data/static/banei-pilot-control.json',
  'data/audits/calendar-baseline-migration-map.json', 'data/audits/calendar-pipeline-v1-release-gate.json', 'data/audits/calendar-dynamic-dates-release-gate.json', 'data/audits/calendar-operations-v1-release-gate.json', 'data/static/calendar-operations-control.json', 'data/static/calendar-operations-seasonal-policy.json', 'docs/runbooks/final-country-calendar-audit-98.md'
];
for (const file of files) if (!fs.existsSync(file)) errors.push('missing: ' + file);
const start = fs.readFileSync('START-HERE.md', 'utf8');
const roadmap = fs.readFileSync('docs/project-roadmap.md', 'utf8');
const implementationRoadmap = fs.readFileSync('docs/calendar/implementation-roadmap.md', 'utf8');
const registry = fs.readFileSync('data/static/calendar-readiness-registry.json', 'utf8');
const japanReadiness = fs.readFileSync('data/static/calendar-readiness-japan-v2.json', 'utf8');
const japanPolicy = fs.readFileSync('data/static/japan-a-plus-policy.json', 'utf8');

for (const phrase of ['WHR-CAL-JAPAN-A-PLUS-RECONCILE', 'WHR-CAL-JAPAN-JRA-A-PLUS', 'docs/calendar/japan-a-plus-reconciliation-plan.md']) {
  if (!start.includes(phrase)) errors.push('START-HERE missing ' + phrase);
}
for (const phrase of ['Country-page programme: complete', 'Current Work ID: `WHR-CAL-JAPAN-A-PLUS-RECONCILE`', 'Next Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`', 'Completed Work ID: `WHR-CAL-OPS-V1`', 'WHR-CAL-BASELINE-RECONCILE', '98 EN + 98 JA = 196']) {
  if (!roadmap.includes(phrase)) errors.push('roadmap missing ' + phrase);
}
for (const phrase of ['Current Work ID: `WHR-CAL-JAPAN-A-PLUS-RECONCILE`', 'Next Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`', 'JRA central racing: Technical Rank A+ / Public Ceiling A+', 'NAR and local-government racing: Technical Rank A+ / Public Ceiling A+', 'Banei Tokachi: Technical Rank A+ / Public Ceiling A+']) {
  if (!implementationRoadmap.includes(phrase)) errors.push('implementation roadmap missing ' + phrase);
}
for (const phrase of ['"bootstrap_status": "complete"', '"countries_with_closed_decision": 98', '"readiness_records": 116', '"next_backfill_work_ids": []']) {
  if (!registry.includes(phrase)) errors.push('registry missing ' + phrase);
}
for (const systemId of ['japan-jra-system', 'japan-nar-system', 'japan-banei-system']) {
  if (!japanReadiness.includes(`"system_id": "${systemId}"`)) errors.push('Japan readiness missing ' + systemId);
  if (!japanPolicy.includes(`"system_id":"${systemId}"`)) errors.push('Japan policy missing ' + systemId);
}
if ((japanReadiness.match(/"technical_rank": "A\+"/g) ?? []).length !== 3) errors.push('Japan readiness must contain three A+ technical ranks.');
if ((japanReadiness.match(/"public_ceiling": "A\+"/g) ?? []).length !== 3) errors.push('Japan readiness must contain three A+ public ceilings.');

if (errors.length) {
  for (const error of errors) console.error('ERROR: ' + error);
  process.exit(1);
}
console.log('PROJECT_GOVERNANCE_DOCS_VALID');
console.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-A-PLUS-RECONCILE');
console.log('NEXT_WORK_ID: WHR-CAL-JAPAN-JRA-A-PLUS');
