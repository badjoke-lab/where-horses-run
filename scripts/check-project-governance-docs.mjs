import fs from 'node:fs';

const errors = [];
const files = [
  'START-HERE.md', 'docs/project-roadmap.md', 'docs/governance/document-authority.md',
  'docs/governance/internal-source-handling.md', 'docs/calendar/README.md',
  'docs/calendar/source-test-v2-contract.md', 'docs/calendar/calendar-readiness-contract.md',
  'docs/calendar/machine-readable-contracts.md', 'docs/calendar/implementation-roadmap.md',
  'docs/calendar/current-baseline-audit.md', 'docs/calendar/baseline-reconciliation-map.md', 'docs/calendar/pipeline-v1-release-gate.md', 'docs/calendar/dynamic-dates-release-gate.md', 'docs/country-pages/completion-contract.md',
  'data/static/source-test-v2.schema.json', 'data/static/calendar-readiness.schema.json',
  'data/static/calendar-readiness-registry.json', 'data/audits/calendar-baseline-migration-map.json', 'data/audits/calendar-pipeline-v1-release-gate.json', 'data/audits/calendar-dynamic-dates-release-gate.json', 'docs/runbooks/final-country-calendar-audit-98.md'
];
for (const file of files) if (!fs.existsSync(file)) errors.push('missing: ' + file);
const start = fs.readFileSync('START-HERE.md', 'utf8');
const roadmap = fs.readFileSync('docs/project-roadmap.md', 'utf8');
const registry = fs.readFileSync('data/static/calendar-readiness-registry.json', 'utf8');
for (const phrase of ['Previous completed Work ID: `WHR-CAL-DYNAMIC-DATES`', 'WHR-CAL-OPS-V1', 'WHR-CAL-JAPAN-JRA']) if (!start.includes(phrase)) errors.push('START-HERE missing ' + phrase);
for (const phrase of ['Country-page programme: complete', 'Current Work ID: `WHR-CAL-OPS-V1`', 'Completed Work ID: `WHR-CAL-DYNAMIC-DATES`', 'WHR-CAL-BASELINE-RECONCILE', '98 EN + 98 JA = 196']) if (!roadmap.includes(phrase)) errors.push('roadmap missing ' + phrase);
for (const phrase of ['"bootstrap_status": "complete"', '"countries_with_closed_decision": 98', '"readiness_records": 116', '"next_backfill_work_ids": []']) if (!registry.includes(phrase)) errors.push('registry missing ' + phrase);
if (errors.length) {
  for (const error of errors) console.error('ERROR: ' + error);
  process.exit(1);
}
console.log('PROJECT_GOVERNANCE_DOCS_VALID');
console.log('CURRENT_WORK_ID: WHR-CAL-OPS-V1');
console.log('NEXT_WORK_ID: WHR-CAL-JAPAN-JRA');
