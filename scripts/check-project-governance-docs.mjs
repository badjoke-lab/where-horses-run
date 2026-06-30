import fs from 'node:fs';

const errors = [];
const files = [
  'START-HERE.md',
  'docs/project-roadmap.md',
  'docs/governance/document-authority.md',
  'docs/governance/internal-source-handling.md',
  'docs/calendar/README.md',
  'docs/calendar/source-test-v2-contract.md',
  'docs/calendar/calendar-readiness-contract.md',
  'docs/calendar/machine-readable-contracts.md',
  'docs/calendar/implementation-roadmap.md',
  'docs/calendar/current-baseline-audit.md',
  'docs/country-pages/programme-roadmap-2026-06-28-addendum.md',
  'docs/country-pages/completion-contract-calendar-addendum.md',
  'data/static/source-test-v2.schema.json',
  'data/static/calendar-readiness.schema.json',
  'data/static/calendar-readiness-registry.json'
];
for (const file of files) if (!fs.existsSync(file)) errors.push('missing: ' + file);

const start = fs.readFileSync('START-HERE.md', 'utf8');
const roadmap = fs.readFileSync('docs/project-roadmap.md', 'utf8');
const registry = fs.readFileSync('data/static/calendar-readiness-registry.json', 'utf8');
for (const phrase of ['WHR-NOTE-69-76', 'WHR-PROFILE-69-76', 'WHR-PUB-69-76']) if (!start.includes(phrase)) errors.push('START-HERE missing ' + phrase);
for (const phrase of ['Current Work ID: `WHR-PROFILE-69-76`', 'Next Work ID: `WHR-PUB-69-76`', 'WHR-AUDIT-COUNTRY-CALENDAR-98', 'WHR-CAL-BASELINE-RECONCILE', 'WHR-CAL-PUBLIC-V1']) if (!roadmap.includes(phrase)) errors.push('roadmap missing ' + phrase);
for (const phrase of ['"countries_with_closed_decision": 76', '"readiness_records": 94', '"WHR-ST2-77-84"']) if (!registry.includes(phrase)) errors.push('registry missing ' + phrase);

if (errors.length) {
  for (const error of errors) console.error('ERROR: ' + error);
  process.exit(1);
}
console.log('PROJECT_GOVERNANCE_DOCS_VALID');
console.log('CURRENT_WORK_ID: WHR-PROFILE-69-76');
console.log('NEXT_WORK_ID: WHR-PUB-69-76');
