import fs from 'node:fs';

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
    'data/audits/calendar-operations-v1-release-gate.json\ndata/audits/calendar-public-v1-surface-audit-v1.json\ndata/audits/calendar-public-v1-pilot-record-reconciliation-v1.json\ndata/audits/calendar-public-v1-operations-presentation-v1.json\ndata/audits/calendar-public-v1-navigation-qa-v1.json\ndata/audits/calendar-public-v1-release-decision-v1.json\n',
    'START-HERE machine-readable references',
  );
  text = replaceOnce(
    text,
    'scripts/check-calendar-operations-v1-release-gate.mjs\n',
    'scripts/check-calendar-operations-v1-release-gate.mjs\nscripts/check-calendar-public-v1-surface-audit.mjs\nscripts/check-calendar-public-v1-pilot-record-reconciliation.mjs\nscripts/check-calendar-public-v1-operations-presentation.mjs\nscripts/check-calendar-public-v1-navigation-qa.mjs\nscripts/check-calendar-public-v1-release-decision.mjs\n',
    'START-HERE validator references',
  );
  text = replaceOnce(
    text,
    'Completed Work ID: `WHR-CAL-UAE-ERA`\nCurrent Work ID: `WHR-CAL-PUBLIC-V1`',
    'Completed Work ID: `WHR-CAL-UAE-ERA`\nCompleted Work ID: `WHR-CAL-PUBLIC-V1`\nCurrent Work ID: `WHR-RACECOURSE-PAGES-V1`',
    'START-HERE current work',
  );
  text = replaceOnce(
    text,
    `## Active sequence\n\n\`\`\`text\n1. audit Calendar, Today, and Tomorrow against the Stage 11 dynamic-date and one-meeting-per-row release criteria\n2. reconcile maintained approved-pilot records with visible source, coverage, freshness, rank, and honest partial-coverage states\n3. validate safe current, stale, empty, source-failure, and retry-ownership presentation without inventing missing detail\n4. complete bilingual responsive QA for Calendar, country, racecourse, and meeting navigation boundaries\n5. prepare the explicit WHR-CAL-PUBLIC-V1 release decision while unattended publication remains disabled\n\`\`\``,
    `## Active sequence\n\n\`\`\`text\n1. reconcile timetable-only venue IDs with canonical racecourse identities and fail safely when no detail page exists\n2. define one structured racecourse-page record per reviewed racecourse identity\n3. connect reviewed today and upcoming meeting state without inventing absent detail\n4. add official source, freshness, course, and distance profiles with explicit unknown states\n5. complete country, racing-type, glossary, Calendar, racecourse, and meeting page-link architecture\n6. validate bilingual responsive racecourse pages and internal-link integrity\n\`\`\``,
    'START-HERE active sequence',
  );
  text = replaceOnce(
    text,
    '## Historical compatibility markers\n',
    '## Completed Public v1 transition\n\n> Current Work ID: `WHR-CAL-PUBLIC-V1`  \n> Next Work ID: `WHR-RACECOURSE-PAGES-V1`\n\nCompleted implementation unit: `PUBLIC-V1-RELEASE-DECISION-01`\n\n## Historical compatibility markers\n',
    'START-HERE transition marker',
  );
  return text.replace('Last reviewed: 2026-07-10', 'Last reviewed: 2026-07-14');
});

update('docs/project-roadmap.md', (input) => {
  let text = input;
  text = replaceOnce(
    text,
    'Completed Work ID: `WHR-CAL-UAE-ERA`\nCurrent Work ID: `WHR-CAL-PUBLIC-V1`\nLast reviewed: 2026-07-11',
    'Completed Work ID: `WHR-CAL-UAE-ERA`\nCompleted Work ID: `WHR-CAL-PUBLIC-V1`\nCurrent Work ID: `WHR-RACECOURSE-PAGES-V1`\nLast reviewed: 2026-07-14',
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
    `## Calendar public v1\n\nWork ID: \`WHR-CAL-PUBLIC-V1\`\n\nRelease criteria:\n\n- dynamic Calendar, Today, and Tomorrow;\n- maintained approved-pilot records;\n- one meeting per list row;\n- C/B/B+/A/A+ boundaries;\n- visible source, coverage, and freshness;\n- honest partial coverage states;\n- safe stale/failure handling;\n- bilingual responsive QA;\n- operations and recovery ownership;\n- no participant, betting, result, payout, prediction, full-racecard, raw-source, embedded-video, or direct-stream output.`,
    `## Calendar public v1\n\nStatus: complete.\n\nCompleted Work ID: \`WHR-CAL-PUBLIC-V1\`\n\nCalendar Public v1 release decision accepted for reviewed static public operation. The decision is recorded in \\u`docs/calendar/public-v1-release-decision.md\\` and \\`data/audits/calendar-public-v1-release-decision-v1.json\\`.\n\nCompleted release criteria:\n\n- dynamic Calendar, Today, and Tomorrow;\n- maintained approved-pilot records;\n- one meeting per list row;\n- C/B/B+/A/A+ boundaries;\n- visible source, coverage, and freshness;\n- honest partial coverage states;\n- safe stale/failure handling;\n- bilingual responsive QA;\n- operations and recovery ownership;\n- no participant, betting, result, payout, prediction, full-racecard, raw-source, embedded-video, or direct-stream output.\n\nScheduled acquisition execution and unattended publication remain disabled.`,
    'project roadmap Public v1 section',
  );
  text = replaceOnce(
    text,
    '## Product follow-up phases\n\nAfter Calendar Public v1:\n\n1. strengthen racecourse pages and page-link architecture;',
    '## Product follow-up phases\n\nCurrent Work ID: `WHR-RACECOURSE-PAGES-V1`\n\nCurrent product stage: strengthen racecourse pages and page-link architecture.\n\n1. strengthen racecourse pages and page-link architecture;',
    'project roadmap product stage',
  );
  text = replaceOnce(
    text,
    'Completed historical implementation markers retained for release-gate compatibility:\n',
    'Completed Public v1 transition retained for release-gate compatibility:\n\n> Current Work ID: `WHR-CAL-PUBLIC-V1`  \n> Next Work ID: `WHR-RACECOURSE-PAGES-V1`\n\nCompleted historical implementation markers retained for release-gate compatibility:\n',
    'project roadmap compatibility marker',
  );
  return text;
});

update('docs/calendar/implementation-roadmap.md', (input) => {
  let text = input;
  text = text.replace('Last reviewed: 2026-07-09', 'Last reviewed: 2026-07-14');
  text = replaceOnce(
    text,
    'Completed Work ID: `WHR-CAL-UAE-ERA`\nCurrent Work ID: `WHR-CAL-PUBLIC-V1`',
    'Completed Work ID: `WHR-CAL-UAE-ERA`\nCompleted Work ID: `WHR-CAL-PUBLIC-V1`\nCurrent Work ID: `WHR-RACECOURSE-PAGES-V1`',
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
    `## Stage 11 — Calendar public v1\n\nStatus: active current programme work\nWork ID: \`WHR-CAL-PUBLIC-V1\`\nCompleted implementation unit: \\u`PUBLIC-V1-SURFACE-AUDIT-01\\`\nCompleted implementation unit: \\u`PUBLIC-V1-PILOT-RECORD-RECONCILIATION-01\\`\nCurrent implementation unit: \\u`PUBLIC-V1-OPERATIONS-PRESENTATION-01\\` — in review`,
    `## Stage 11 — Calendar public v1\n\nStatus: complete\nCompleted Work ID: \\u`WHR-CAL-PUBLIC-V1\\`\nCompleted implementation unit: \\u`PUBLIC-V1-SURFACE-AUDIT-01\\`\nCompleted implementation unit: \\u`PUBLIC-V1-PILOT-RECORD-RECONCILIATION-01\\`\nCompleted implementation unit: \\u`PUBLIC-V1-OPERATIONS-PRESENTATION-01\\`\nCompleted implementation unit: \\u`PUBLIC-V1-NAVIGATION-QA-01\\`\nCompleted implementation unit: \\u`PUBLIC-V1-RELEASE-DECISION-01\\``,
    'implementation roadmap Stage 11 header',
  );
  text = replaceOnce(
    text,
    '- automatic acquisition, queue mutation, approval, promotion, and unattended publication remain disabled.\n\n## Later product stages',
    '- automatic acquisition, queue mutation, approval, promotion, and unattended publication remain disabled.\n\nCompleted Public v1 release-decision evidence:\n\n- all ten release criteria are accepted;\n- static and dynamic English/Japanese route parity is permanently validated;\n- internal links on audited public routes resolve to rendered pages;\n- reviewed static public operation is accepted;\n- scheduled Job execution and unattended publication remain disabled;\n- completed transition: Current Work ID: `WHR-CAL-PUBLIC-V1`; Next Work ID: `WHR-RACECOURSE-PAGES-V1`.\n\n## Stage 12 — racecourse pages and page-link architecture\n\nStatus: active current programme work\nCurrent Work ID: `WHR-RACECOURSE-PAGES-V1`\n\nInitial sequence:\n\n1. reconcile timetable-only venue IDs with canonical racecourse identities;\n2. define the structured racecourse-page data contract;\n3. expose reviewed today and upcoming meeting state;\n4. add official source, freshness, course, and distance profiles without unsupported inference;\n5. connect country, type, glossary, Calendar, meeting, and racecourse navigation;\n6. validate bilingual responsive pages and internal-link integrity.\n\n## Later product stages',
    'implementation roadmap Stage 12',
  );
  text = replaceOnce(
    text,
    `\`\`\`text\n1. keep Banei, HKJC, and UAE in their accepted bounded reviewed steady-state operating modes\n2. audit dynamic Calendar, Today, and Tomorrow behavior against explicit timezone and safe empty/stale/failure rules\n3. reconcile maintained approved-pilot records with visible source, rank, coverage, freshness, review, and retry ownership\n4. verify one meeting per list row and C/B/B+/A/A+ public field boundaries across supported views\n5. complete bilingual responsive Calendar, country, racecourse, and meeting navigation QA\n6. prepare the explicit WHR-CAL-PUBLIC-V1 release decision without enabling unattended publication\n7. run source-specific Completion Audits only before making their corresponding completeness claims\n\`\`\``,
    `\`\`\`text\n1. keep Calendar Public v1 and source-specific pilots in reviewed steady-state operation\n2. reconcile timetable-only venue IDs with canonical racecourse identities\n3. define and validate structured bilingual racecourse pages\n4. connect reviewed current and upcoming meeting state to racecourse pages\n5. add course, distance, source, and freshness profiles without unsupported inference\n6. complete page-link architecture and internal-link QA\n7. run source-specific Completion Audits only before making their corresponding completeness claims\n\`\`\``,
    'implementation roadmap immediate order',
  );
  return text;
});

update('docs/governance/document-authority.md', (input) => {
  let text = input.replace('Last reviewed: 2026-07-08', 'Last reviewed: 2026-07-14');
  text = replaceOnce(
    text,
    '- `docs/calendar/dynamic-dates-release-gate.md`\n',
    '- `docs/calendar/dynamic-dates-release-gate.md`\n- `docs/calendar/public-v1-surface-audit.md`\n- `docs/calendar/public-v1-pilot-record-reconciliation.md`\n- `docs/calendar/public-v1-operations-presentation.md`\n- `docs/calendar/public-v1-navigation-qa.md`\n- `docs/calendar/public-v1-release-decision.md`\n',
    'document authority Public v1 docs',
  );
  text = replaceOnce(
    text,
    '- `data/audits/calendar-operations-v1-release-gate.json`\n',
    '- `data/audits/calendar-operations-v1-release-gate.json`\n- `data/audits/calendar-public-v1-surface-audit-v1.json`\n- `data/audits/calendar-public-v1-pilot-record-reconciliation-v1.json`\n- `data/audits/calendar-public-v1-operations-presentation-v1.json`\n- `data/audits/calendar-public-v1-navigation-qa-v1.json`\n- `data/audits/calendar-public-v1-release-decision-v1.json`\n',
    'document authority Public v1 audits',
  );
  text = replaceOnce(
    text,
    '- `scripts/check-calendar-operations-v1-release-gate.mjs`\n',
    '- `scripts/check-calendar-operations-v1-release-gate.mjs`\n- `scripts/check-calendar-public-v1-surface-audit.mjs`\n- `scripts/check-calendar-public-v1-pilot-record-reconciliation.mjs`\n- `scripts/check-calendar-public-v1-operations-presentation.mjs`\n- `scripts/check-calendar-public-v1-navigation-qa.mjs`\n- `scripts/check-calendar-public-v1-release-decision.mjs`\n',
    'document authority Public v1 validators',
  );
  return text;
});

update('docs/calendar/README.md', (input) => {
  let text = input.replace('Last reviewed: 2026-07-08', 'Last reviewed: 2026-07-14');
  text = replaceOnce(
    text,
    '- [`public-v1-operations-presentation.md`](public-v1-operations-presentation.md) — bilingual current/stale/empty/source-failure and reviewed retry-ownership presentation without internal Queue publication.\n',
    '- [`public-v1-operations-presentation.md`](public-v1-operations-presentation.md) — bilingual current/stale/empty/source-failure and reviewed retry-ownership presentation without internal Queue publication.\n- [`public-v1-navigation-qa.md`](public-v1-navigation-qa.md) — rendered bilingual route parity, canonical/hreflang, language switching, meeting back links, and internal-link integrity.\n- [`public-v1-release-decision.md`](public-v1-release-decision.md) — accepted `WHR-CAL-PUBLIC-V1` reviewed static release decision and transition to `WHR-RACECOURSE-PAGES-V1`.\n',
    'Calendar README Public v1 docs',
  );
  text = replaceOnce(
    text,
    'data/audits/calendar-public-v1-operations-presentation-v1.json\n',
    'data/audits/calendar-public-v1-operations-presentation-v1.json\ndata/audits/calendar-public-v1-navigation-qa-v1.json\ndata/audits/calendar-public-v1-release-decision-v1.json\n',
    'Calendar README Public v1 audits',
  );
  return text;
});

update('scripts/check-project-governance-docs.mjs', (input) => {
  let text = input;
  text = replaceOnce(
    text,
    "  'scripts/check-calendar-banei-handoff-decision.mjs',\n",
    "  'scripts/check-calendar-banei-handoff-decision.mjs',\n  'docs/calendar/public-v1-release-decision.md',\n  'data/audits/calendar-public-v1-release-decision-v1.json',\n  'scripts/check-calendar-public-v1-navigation-qa.mjs',\n  'scripts/check-calendar-public-v1-release-decision.mjs',\n",
    'governance required files',
  );
  text = replaceOnce(
    text,
    "  'primary runner: github_actions'\n]);",
    "  'primary runner: github_actions',\n  'Completed Work ID: `WHR-CAL-PUBLIC-V1`',\n  'Current Work ID: `WHR-RACECOURSE-PAGES-V1`'\n]);",
    'governance START-HERE phrases',
  );
  text = replaceOnce(
    text,
    "  'Current Work ID: `WHR-CAL-PUBLIC-V1`',\n  'schedule-confirmed meetings: 82',",
    "  'Completed Work ID: `WHR-CAL-PUBLIC-V1`',\n  'Current Work ID: `WHR-RACECOURSE-PAGES-V1`',\n  'Calendar Public v1 release decision accepted',\n  'schedule-confirmed meetings: 82',",
    'governance project-roadmap phrases',
  );
  text = replaceOnce(
    text,
    "  'Current Work ID: `WHR-CAL-PUBLIC-V1`',\n  'ACP-1 — NAR formal workflow dispatch — complete',",
    "  'Completed Work ID: `WHR-CAL-PUBLIC-V1`',\n  'Current Work ID: `WHR-RACECOURSE-PAGES-V1`',\n  'Completed implementation unit: `PUBLIC-V1-RELEASE-DECISION-01`',\n  'ACP-1 — NAR formal workflow dispatch — complete',",
    'governance implementation-roadmap phrases',
  );
  text = text.replace("console.log('CURRENT_WORK_ID: WHR-CAL-PUBLIC-V1');", "console.log('COMPLETED_WORK_ID: WHR-CAL-PUBLIC-V1');\nconsole.log('CURRENT_WORK_ID: WHR-RACECOURSE-PAGES-V1');");
  return text;
});

console.log('CALENDAR_PUBLIC_V1_RELEASE_DECISION_APPLIED');
