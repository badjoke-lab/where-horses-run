import fs from 'node:fs';

const block = (...lines) => lines.join('\n');

const replaceOnce = (text, search, replacement, label) => {
  if (!text.includes(search)) throw new Error(`${label}: expected source text not found`);
  return text.replace(search, replacement);
};

const update = (file, transform) => {
  const before = fs.readFileSync(file, 'utf8');
  const after = transform(before);
  if (after === before) throw new Error(`${file}: no change produced`);
  fs.writeFileSync(file, after);
};

update('START-HERE.md', (input) => {
  let text = input;
  text = replaceOnce(
    text,
    'docs/calendar/operations-v1-release-gate.md\n',
    'docs/calendar/operations-v1-release-gate.md\ndocs/calendar/public-v1-release-decision.md\n',
    'START-HERE required reading',
  );
  text = replaceOnce(
    text,
    'data/audits/calendar-operations-v1-release-gate.json\n',
    block(
      'data/audits/calendar-operations-v1-release-gate.json',
      'data/audits/calendar-public-v1-surface-audit-v1.json',
      'data/audits/calendar-public-v1-pilot-record-reconciliation-v1.json',
      'data/audits/calendar-public-v1-operations-presentation-v1.json',
      'data/audits/calendar-public-v1-navigation-qa-v1.json',
      'data/audits/calendar-public-v1-release-decision-v1.json',
      '',
    ),
    'START-HERE machine-readable references',
  );
  text = replaceOnce(
    text,
    'scripts/check-calendar-operations-v1-release-gate.mjs\n',
    block(
      'scripts/check-calendar-operations-v1-release-gate.mjs',
      'scripts/check-calendar-public-v1-surface-audit.mjs',
      'scripts/check-calendar-public-v1-pilot-record-reconciliation.mjs',
      'scripts/check-calendar-public-v1-operations-presentation.mjs',
      'scripts/check-calendar-public-v1-navigation-qa.mjs',
      'scripts/check-calendar-public-v1-release-decision.mjs',
      '',
    ),
    'START-HERE validator references',
  );
  text = replaceOnce(
    text,
    block(
      'Completed Work ID: `WHR-CAL-UAE-ERA`',
      'Current Work ID: `WHR-CAL-PUBLIC-V1`',
    ),
    block(
      'Completed Work ID: `WHR-CAL-UAE-ERA`',
      'Completed Work ID: `WHR-CAL-PUBLIC-V1`',
      'Current Work ID: `WHR-RACECOURSE-PAGES-V1`',
    ),
    'START-HERE current work',
  );
  text = replaceOnce(
    text,
    block(
      '## Active sequence',
      '',
      '```text',
      '1. audit Calendar, Today, and Tomorrow against the Stage 11 dynamic-date and one-meeting-per-row release criteria',
      '2. reconcile maintained approved-pilot records with visible source, coverage, freshness, rank, and honest partial-coverage states',
      '3. validate safe current, stale, empty, source-failure, and retry-ownership presentation without inventing missing detail',
      '4. complete bilingual responsive QA for Calendar, country, racecourse, and meeting navigation boundaries',
      '5. prepare the explicit WHR-CAL-PUBLIC-V1 release decision while unattended publication remains disabled',
      '```',
    ),
    block(
      '## Active sequence',
      '',
      '```text',
      '1. reconcile timetable-only venue IDs with canonical racecourse identities and fail safely when no detail page exists',
      '2. define one structured racecourse-page record per reviewed racecourse identity',
      '3. connect reviewed today and upcoming meeting state without inventing absent detail',
      '4. add official source, freshness, course, and distance profiles with explicit unknown states',
      '5. complete country, racing-type, glossary, Calendar, racecourse, and meeting page-link architecture',
      '6. validate bilingual responsive racecourse pages and internal-link integrity',
      '```',
    ),
    'START-HERE active sequence',
  );
  text = replaceOnce(
    text,
    '## Historical compatibility markers\n',
    block(
      '## Completed Public v1 transition',
      '',
      '> Current Work ID: `WHR-CAL-PUBLIC-V1`  ',
      '> Next Work ID: `WHR-RACECOURSE-PAGES-V1`',
      '',
      'Completed implementation unit: `PUBLIC-V1-RELEASE-DECISION-01`',
      '',
      '## Historical compatibility markers',
      '',
    ),
    'START-HERE transition marker',
  );
  return text.replace('Last reviewed: 2026-07-10', 'Last reviewed: 2026-07-14');
});

update('docs/project-roadmap.md', (input) => {
  let text = input;
  text = replaceOnce(
    text,
    block(
      'Completed Work ID: `WHR-CAL-UAE-ERA`',
      'Current Work ID: `WHR-CAL-PUBLIC-V1`',
      'Last reviewed: 2026-07-11',
    ),
    block(
      'Completed Work ID: `WHR-CAL-UAE-ERA`',
      'Completed Work ID: `WHR-CAL-PUBLIC-V1`',
      'Current Work ID: `WHR-RACECOURSE-PAGES-V1`',
      'Last reviewed: 2026-07-14',
    ),
    'project roadmap header',
  );
  text = replaceOnce(
    text,
    'The NAR source pilot, Acquisition Control Plane foundation, Banei bounded operational integration, HKJC source-specific pilot handoff, and UAE ERA source-specific sequence are complete. Banei, HKJC, and UAE continue under their accepted reviewed operating boundaries. UAE ERA handoff accepted for bounded manual reviewed steady-state operation. The current programme work is `WHR-CAL-PUBLIC-V1`, focused on public release criteria and an explicit reviewed release decision; unattended publication remains disabled.',
    'The NAR source pilot, Acquisition Control Plane foundation, Banei bounded operational integration, HKJC source-specific pilot handoff, UAE ERA source-specific sequence, and Calendar Public v1 release decision are complete. Banei, HKJC, and UAE continue under their accepted reviewed operating boundaries. Calendar Public v1 release decision accepted for reviewed static public operation. The current programme work is `WHR-RACECOURSE-PAGES-V1`, focused on canonical racecourse pages and page-link architecture; unattended publication remains disabled.',
    'project roadmap current position',
  );
  text = replaceOnce(
    text,
    block(
      '## Calendar public v1',
      '',
      'Work ID: `WHR-CAL-PUBLIC-V1`',
      '',
      'Release criteria:',
      '',
      '- dynamic Calendar, Today, and Tomorrow;',
      '- maintained approved-pilot records;',
      '- one meeting per list row;',
      '- C/B/B+/A/A+ boundaries;',
      '- visible source, coverage, and freshness;',
      '- honest partial coverage states;',
      '- safe stale/failure handling;',
      '- bilingual responsive QA;',
      '- operations and recovery ownership;',
      '- no participant, betting, result, payout, prediction, full-racecard, raw-source, embedded-video, or direct-stream output.',
    ),
    block(
      '## Calendar public v1',
      '',
      'Status: complete.',
      '',
      'Completed Work ID: `WHR-CAL-PUBLIC-V1`',
      '',
      'Calendar Public v1 release decision accepted for reviewed static public operation. The decision is recorded in `docs/calendar/public-v1-release-decision.md` and `data/audits/calendar-public-v1-release-decision-v1.json`.',
      '',
      'Completed release criteria:',
      '',
      '- dynamic Calendar, Today, and Tomorrow;',
      '- maintained approved-pilot records;',
      '- one meeting per list row;',
      '- C/B/B+/A/A+ boundaries;',
      '- visible source, coverage, and freshness;',
      '- honest partial coverage states;',
      '- safe stale/failure handling;',
      '- bilingual responsive QA;',
      '- operations and recovery ownership;',
      '- no participant, betting, result, payout, prediction, full-racecard, raw-source, embedded-video, or direct-stream output.',
      '',
      'Scheduled acquisition execution and unattended publication remain disabled.',
    ),
    'project roadmap Public v1 section',
  );
  text = replaceOnce(
    text,
    block(
      '## Product follow-up phases',
      '',
      'After Calendar Public v1:',
      '',
      '1. strengthen racecourse pages and page-link architecture;',
    ),
    block(
      '## Product follow-up phases',
      '',
      'Current Work ID: `WHR-RACECOURSE-PAGES-V1`',
      '',
      'Current product stage: strengthen racecourse pages and page-link architecture.',
      '',
      '1. strengthen racecourse pages and page-link architecture;',
    ),
    'project roadmap product stage',
  );
  text = replaceOnce(
    text,
    'Completed historical implementation markers retained for release-gate compatibility:\n',
    block(
      'Completed Public v1 transition retained for release-gate compatibility:',
      '',
      '> Current Work ID: `WHR-CAL-PUBLIC-V1`  ',
      '> Next Work ID: `WHR-RACECOURSE-PAGES-V1`',
      '',
      'Completed historical implementation markers retained for release-gate compatibility:',
      '',
    ),
    'project roadmap compatibility marker',
  );
  return text;
});

update('docs/calendar/implementation-roadmap.md', (input) => {
  let text = input.replace('Last reviewed: 2026-07-09', 'Last reviewed: 2026-07-14');
  text = replaceOnce(
    text,
    block(
      'Completed Work ID: `WHR-CAL-UAE-ERA`',
      'Current Work ID: `WHR-CAL-PUBLIC-V1`',
    ),
    block(
      'Completed Work ID: `WHR-CAL-UAE-ERA`',
      'Completed Work ID: `WHR-CAL-PUBLIC-V1`',
      'Current Work ID: `WHR-RACECOURSE-PAGES-V1`',
    ),
    'implementation roadmap Stage 5',
  );
  text = replaceOnce(
    text,
    'Status: JRA and NAR source pilots complete; Acquisition Control Plane complete; Banei, HKJC, and UAE ERA handoffs accepted; Calendar Public v1 active',
    'Status: JRA and NAR source pilots complete; Acquisition Control Plane complete; Banei, HKJC, and UAE ERA handoffs accepted; Calendar Public v1 complete',
    'implementation roadmap Stage 6 status',
  );
  text = replaceOnce(
    text,
    block(
      '## Stage 11 — Calendar public v1',
      '',
      'Status: active current programme work',
      'Work ID: `WHR-CAL-PUBLIC-V1`',
      'Completed implementation unit: `PUBLIC-V1-SURFACE-AUDIT-01`',
      'Completed implementation unit: `PUBLIC-V1-PILOT-RECORD-RECONCILIATION-01`',
      'Current implementation unit: `PUBLIC-V1-OPERATIONS-PRESENTATION-01` — in review',
    ),
    block(
      '## Stage 11 — Calendar public v1',
      '',
      'Status: complete',
      'Completed Work ID: `WHR-CAL-PUBLIC-V1`',
      'Completed implementation unit: `PUBLIC-V1-SURFACE-AUDIT-01`',
      'Completed implementation unit: `PUBLIC-V1-PILOT-RECORD-RECONCILIATION-01`',
      'Completed implementation unit: `PUBLIC-V1-OPERATIONS-PRESENTATION-01`',
      'Completed implementation unit: `PUBLIC-V1-NAVIGATION-QA-01`',
      'Completed implementation unit: `PUBLIC-V1-RELEASE-DECISION-01`',
    ),
    'implementation roadmap Stage 11 header',
  );
  text = replaceOnce(
    text,
    '- automatic acquisition, queue mutation, approval, promotion, and unattended publication remain disabled.\n\n## Later product stages',
    block(
      '- automatic acquisition, queue mutation, approval, promotion, and unattended publication remain disabled.',
      '',
      'Completed Public v1 release-decision evidence:',
      '',
      '- all ten release criteria are accepted;',
      '- static and dynamic English/Japanese route parity is permanently validated;',
      '- internal links on audited public routes resolve to rendered pages;',
      '- reviewed static public operation is accepted;',
      '- scheduled Job execution and unattended publication remain disabled;',
      '- completed transition: Current Work ID: `WHR-CAL-PUBLIC-V1`; Next Work ID: `WHR-RACECOURSE-PAGES-V1`.',
      '',
      '## Stage 12 — racecourse pages and page-link architecture',
      '',
      'Status: active current programme work',
      'Current Work ID: `WHR-RACECOURSE-PAGES-V1`',
      '',
      'Initial sequence:',
      '',
      '1. reconcile timetable-only venue IDs with canonical racecourse identities;',
      '2. define the structured racecourse-page data contract;',
      '3. expose reviewed today and upcoming meeting state;',
      '4. add official source, freshness, course, and distance profiles without unsupported inference;',
      '5. connect country, type, glossary, Calendar, meeting, and racecourse navigation;',
      '6. validate bilingual responsive pages and internal-link integrity.',
      '',
      '## Later product stages',
    ),
    'implementation roadmap Stage 12',
  );
  text = replaceOnce(
    text,
    block(
      '```text',
      '1. keep Banei, HKJC, and UAE in their accepted bounded reviewed steady-state operating modes',
      '2. audit dynamic Calendar, Today, and Tomorrow behavior against explicit timezone and safe empty/stale/failure rules',
      '3. reconcile maintained approved-pilot records with visible source, rank, coverage, freshness, review, and retry ownership',
      '4. verify one meeting per list row and C/B/B+/A/A+ public field boundaries across supported views',
      '5. complete bilingual responsive Calendar, country, racecourse, and meeting navigation QA',
      '6. prepare the explicit WHR-CAL-PUBLIC-V1 release decision without enabling unattended publication',
      '7. run source-specific Completion Audits only before making their corresponding completeness claims',
      '```',
    ),
    block(
      '```text',
      '1. keep Calendar Public v1 and source-specific pilots in reviewed steady-state operation',
      '2. reconcile timetable-only venue IDs with canonical racecourse identities',
      '3. define and validate structured bilingual racecourse pages',
      '4. connect reviewed current and upcoming meeting state to racecourse pages',
      '5. add course, distance, source, and freshness profiles without unsupported inference',
      '6. complete page-link architecture and internal-link QA',
      '7. run source-specific Completion Audits only before making their corresponding completeness claims',
      '```',
    ),
    'implementation roadmap immediate order',
  );
  return text;
});

update('docs/governance/document-authority.md', (input) => {
  let text = input.replace('Last reviewed: 2026-07-08', 'Last reviewed: 2026-07-14');
  text = replaceOnce(
    text,
    '- `docs/calendar/dynamic-dates-release-gate.md`\n',
    block(
      '- `docs/calendar/dynamic-dates-release-gate.md`',
      '- `docs/calendar/public-v1-surface-audit.md`',
      '- `docs/calendar/public-v1-pilot-record-reconciliation.md`',
      '- `docs/calendar/public-v1-operations-presentation.md`',
      '- `docs/calendar/public-v1-navigation-qa.md`',
      '- `docs/calendar/public-v1-release-decision.md`',
      '',
    ),
    'document authority Public v1 docs',
  );
  text = replaceOnce(
    text,
    '- `data/audits/calendar-operations-v1-release-gate.json`\n',
    block(
      '- `data/audits/calendar-operations-v1-release-gate.json`',
      '- `data/audits/calendar-public-v1-surface-audit-v1.json`',
      '- `data/audits/calendar-public-v1-pilot-record-reconciliation-v1.json`',
      '- `data/audits/calendar-public-v1-operations-presentation-v1.json`',
      '- `data/audits/calendar-public-v1-navigation-qa-v1.json`',
      '- `data/audits/calendar-public-v1-release-decision-v1.json`',
      '',
    ),
    'document authority Public v1 audits',
  );
  text = replaceOnce(
    text,
    '- `scripts/check-calendar-operations-v1-release-gate.mjs`\n',
    block(
      '- `scripts/check-calendar-operations-v1-release-gate.mjs`',
      '- `scripts/check-calendar-public-v1-surface-audit.mjs`',
      '- `scripts/check-calendar-public-v1-pilot-record-reconciliation.mjs`',
      '- `scripts/check-calendar-public-v1-operations-presentation.mjs`',
      '- `scripts/check-calendar-public-v1-navigation-qa.mjs`',
      '- `scripts/check-calendar-public-v1-release-decision.mjs`',
      '',
    ),
    'document authority Public v1 validators',
  );
  return text;
});

update('docs/calendar/README.md', (input) => {
  let text = input.replace('Last reviewed: 2026-07-08', 'Last reviewed: 2026-07-14');
  text = replaceOnce(
    text,
    '- [`public-v1-operations-presentation.md`](public-v1-operations-presentation.md) — bilingual current/stale/empty/source-failure and reviewed retry-ownership presentation without internal Queue publication.\n',
    block(
      '- [`public-v1-operations-presentation.md`](public-v1-operations-presentation.md) — bilingual current/stale/empty/source-failure and reviewed retry-ownership presentation without internal Queue publication.',
      '- [`public-v1-navigation-qa.md`](public-v1-navigation-qa.md) — rendered bilingual route parity, canonical/hreflang, language switching, meeting back links, and internal-link integrity.',
      '- [`public-v1-release-decision.md`](public-v1-release-decision.md) — accepted `WHR-CAL-PUBLIC-V1` reviewed static release decision and transition to `WHR-RACECOURSE-PAGES-V1`.',
      '',
    ),
    'Calendar README Public v1 docs',
  );
  text = replaceOnce(
    text,
    'data/audits/calendar-public-v1-operations-presentation-v1.json\n',
    block(
      'data/audits/calendar-public-v1-operations-presentation-v1.json',
      'data/audits/calendar-public-v1-navigation-qa-v1.json',
      'data/audits/calendar-public-v1-release-decision-v1.json',
      '',
    ),
    'Calendar README Public v1 audits',
  );
  return text;
});

update('scripts/check-project-governance-docs.mjs', (input) => {
  let text = input;
  text = replaceOnce(
    text,
    "  'scripts/check-calendar-banei-handoff-decision.mjs',\n",
    block(
      "  'scripts/check-calendar-banei-handoff-decision.mjs',",
      "  'docs/calendar/public-v1-release-decision.md',",
      "  'data/audits/calendar-public-v1-release-decision-v1.json',",
      "  'scripts/check-calendar-public-v1-navigation-qa.mjs',",
      "  'scripts/check-calendar-public-v1-release-decision.mjs',",
      '',
    ),
    'governance required files',
  );
  text = replaceOnce(
    text,
    "  'primary runner: github_actions'\n]);",
    block(
      "  'primary runner: github_actions',",
      "  'Completed Work ID: `WHR-CAL-PUBLIC-V1`',",
      "  'Current Work ID: `WHR-RACECOURSE-PAGES-V1`'",
      ']);',
    ),
    'governance START-HERE phrases',
  );
  text = replaceOnce(
    text,
    block(
      "  'Current Work ID: `WHR-CAL-PUBLIC-V1`',",
      "  'schedule-confirmed meetings: 82',",
    ),
    block(
      "  'Completed Work ID: `WHR-CAL-PUBLIC-V1`',",
      "  'Current Work ID: `WHR-RACECOURSE-PAGES-V1`',",
      "  'Calendar Public v1 release decision accepted',",
      "  'schedule-confirmed meetings: 82',",
    ),
    'governance project-roadmap phrases',
  );
  text = replaceOnce(
    text,
    block(
      "  'Current Work ID: `WHR-CAL-PUBLIC-V1`',",
      "  'ACP-1 — NAR formal workflow dispatch — complete',",
    ),
    block(
      "  'Completed Work ID: `WHR-CAL-PUBLIC-V1`',",
      "  'Current Work ID: `WHR-RACECOURSE-PAGES-V1`',",
      "  'Completed implementation unit: `PUBLIC-V1-RELEASE-DECISION-01`',",
      "  'ACP-1 — NAR formal workflow dispatch — complete',",
    ),
    'governance implementation-roadmap phrases',
  );
  text = text.replace(
    "console.log('CURRENT_WORK_ID: WHR-CAL-PUBLIC-V1');",
    block(
      "console.log('COMPLETED_WORK_ID: WHR-CAL-PUBLIC-V1');",
      "console.log('CURRENT_WORK_ID: WHR-RACECOURSE-PAGES-V1');",
    ),
  );
  return text;
});

console.log('CALENDAR_PUBLIC_V1_RELEASE_DECISION_APPLIED');
