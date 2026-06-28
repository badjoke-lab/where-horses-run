import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);

const requiredFiles = [
  'START-HERE.md',
  'docs/project-roadmap.md',
  'docs/governance/document-authority.md',
  'docs/governance/internal-source-handling.md',
  'docs/calendar/README.md',
  'docs/calendar/source-test-v2-contract.md',
  'docs/calendar/calendar-readiness-contract.md',
  'docs/calendar/implementation-roadmap.md',
  'docs/calendar/current-baseline-audit.md',
  'docs/country-pages/programme-roadmap-2026-06-28-addendum.md',
  'docs/country-pages/completion-contract-calendar-addendum.md',
  'docs/specs/global-timetable-architecture-2026-06-28-addendum.md',
  'docs/specs/authority-source-inventory-2026-06-28-addendum.md',
  'docs/specs/where-horses-run-v0-status.md',
];

const read = (relativePath) => {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`missing required governance file: ${relativePath}`);
    return '';
  }
  return fs.readFileSync(absolutePath, 'utf8');
};

const content = Object.fromEntries(requiredFiles.map((file) => [file, read(file)]));

const requiredPhrases = {
  'docs/project-roadmap.md': [
    'WHR-GOV-ROADMAP-01',
    'WHR-CAL-CONTRACT-02',
    'WHR-AUDIT-COUNTRY-CALENDAR-98',
    'WHR-CAL-BASELINE-RECONCILE',
    'WHR-CAL-PUBLIC-V1',
    'Technical Rank',
    'Public Ceiling',
    'Candidate generation is not publication',
  ],
  'docs/governance/document-authority.md': [
    'Authority order',
    'Conversation history and PR numbers do not replace canonical repository documents',
    'Internal-only',
  ],
  'docs/governance/internal-source-handling.md': [
    'Raw or detailed source acquisition material remains local',
    '.whr-local-source-tests/',
    'A+ is controlled medium-risk output',
    'do not commit the ZIP itself',
  ],
  'docs/calendar/source-test-v2-contract.md': [
    'automation mode',
    'Calendar Readiness',
    'Public Ceiling',
    'Entries 01-52 predate this contract',
  ],
  'docs/calendar/calendar-readiness-contract.md': [
    'automatic',
    'semi_automatic',
    'manual_import',
    'link_only',
    'blocked',
    'not_applicable',
  ],
  'docs/calendar/implementation-roadmap.md': [
    'retain',
    'repair',
    'migrate',
    'replace',
    'archive',
    'WHR-CAL-JAPAN-JRA',
    'WHR-CAL-PUBLIC-V1',
  ],
  'docs/country-pages/programme-roadmap-2026-06-28-addendum.md': [
    'Work IDs now define the schedule',
    'WHR-CP-PUB-29-36',
    'WHR-CP-PUB-37-44',
    'WHR-AUDIT-COUNTRY-CALENDAR-98',
  ],
};

for (const [file, phrases] of Object.entries(requiredPhrases)) {
  for (const phrase of phrases) {
    if (!content[file]?.includes(phrase)) fail(`${file}: missing required phrase: ${phrase}`);
  }
}

const forbiddenPublicRawPatterns = [
  /raw official body/i,
  /commit the raw html/i,
  /commit the api response/i,
  /direct stream url may be published/i,
];

for (const [file, text] of Object.entries(content)) {
  for (const pattern of forbiddenPublicRawPatterns) {
    if (pattern.test(text)) fail(`${file}: unsafe repository-boundary wording matched ${pattern}`);
  }
}

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}

console.log('PROJECT_GOVERNANCE_DOCS_VALID');
console.log(`FILES_CHECKED: ${requiredFiles.length}`);
console.log('CURRENT_WORK_ID: WHR-GOV-ROADMAP-01');
console.log('NEXT_WORK_ID: WHR-CAL-CONTRACT-02');
