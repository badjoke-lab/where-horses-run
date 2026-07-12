import fs from 'node:fs';

function replaceRequired(file, before, after) {
  const current = fs.readFileSync(file, 'utf8');
  if (!current.includes(before)) throw new Error(`${file}: required sync anchor missing`);
  fs.writeFileSync(file, current.replace(before, after));
}

function updateChecker(file) {
  let text = fs.readFileSync(file, 'utf8');
  text = text.replaceAll('Current Work ID: `WHR-CAL-UAE-ERA`', 'Current Work ID: `WHR-CAL-PUBLIC-V1`');
  text = text.replaceAll('CURRENT_WORK_ID: WHR-CAL-UAE-ERA', 'CURRENT_WORK_ID: WHR-CAL-PUBLIC-V1');
  text = text.replace(/,\s*'Next programme Work ID: `WHR-CAL-PUBLIC-V1`'/g, '');
  text = text.replace(/^\s*'Next programme Work ID: `WHR-CAL-PUBLIC-V1`',?\n/gm, '');
  text = text.replace(/^console\.log\('NEXT_PROGRAMME_WORK_ID: WHR-CAL-PUBLIC-V1'\);\n/gm, '');
  text = text.replaceAll(
    "'Completed Work ID: `WHR-CAL-HONG-KONG-HKJC`', 'Current Work ID: `WHR-CAL-PUBLIC-V1`'",
    "'Completed Work ID: `WHR-CAL-HONG-KONG-HKJC`', 'Completed Work ID: `WHR-CAL-UAE-ERA`', 'Current Work ID: `WHR-CAL-PUBLIC-V1`'",
  );
  text = text.replaceAll(
    "  'Completed Work ID: `WHR-CAL-HONG-KONG-HKJC`',\n  'Current Work ID: `WHR-CAL-PUBLIC-V1`',",
    "  'Completed Work ID: `WHR-CAL-HONG-KONG-HKJC`',\n  'Completed Work ID: `WHR-CAL-UAE-ERA`',\n  'Current Work ID: `WHR-CAL-PUBLIC-V1`',",
  );
  if (text.includes("console.log('COMPLETED_WORK_ID: WHR-CAL-HONG-KONG-HKJC');")
    && !text.includes("console.log('COMPLETED_WORK_ID: WHR-CAL-UAE-ERA');")) {
    text = text.replace(
      "console.log('COMPLETED_WORK_ID: WHR-CAL-HONG-KONG-HKJC');",
      "console.log('COMPLETED_WORK_ID: WHR-CAL-HONG-KONG-HKJC');\nconsole.log('COMPLETED_WORK_ID: WHR-CAL-UAE-ERA');",
    );
  }
  fs.writeFileSync(file, text);
}

replaceRequired(
  'START-HERE.md',
  'Completed Work ID: `WHR-CAL-HONG-KONG-HKJC`\nCurrent Work ID: `WHR-CAL-UAE-ERA`\nNext programme Work ID: `WHR-CAL-PUBLIC-V1`',
  'Completed Work ID: `WHR-CAL-HONG-KONG-HKJC`\nCompleted Work ID: `WHR-CAL-UAE-ERA`\nCurrent Work ID: `WHR-CAL-PUBLIC-V1`',
);
replaceRequired(
  'START-HERE.md',
  `1. confirm the reviewed UAE Calendar Readiness and official ERA season-calendar baseline
2. implement a bounded C-level UAE candidate generator with no-write artifact output
3. run source-specific fixture/parser evidence before any Acquisition Registry activation decision
4. explicitly review the UAE handoff boundary after bounded evidence
5. continue to WHR-CAL-PUBLIC-V1 only after the UAE source-specific boundary is reviewed`,
  `1. audit Calendar, Today, and Tomorrow against the Stage 11 dynamic-date and one-meeting-per-row release criteria
2. reconcile maintained approved-pilot records with visible source, coverage, freshness, rank, and honest partial-coverage states
3. validate safe current, stale, empty, source-failure, and retry-ownership presentation without inventing missing detail
4. complete bilingual responsive QA for Calendar, country, racecourse, and meeting navigation boundaries
5. prepare the explicit WHR-CAL-PUBLIC-V1 release decision while unattended publication remains disabled`,
);

replaceRequired(
  'docs/project-roadmap.md',
  'Completed Work ID: `WHR-CAL-UAE-ERA`\nCurrent Work ID: `WHR-CAL-UAE-ERA`\nNext programme Work ID: `WHR-CAL-PUBLIC-V1`',
  'Completed Work ID: `WHR-CAL-UAE-ERA`\nCurrent Work ID: `WHR-CAL-PUBLIC-V1`',
);
replaceRequired(
  'docs/project-roadmap.md',
  'The NAR source pilot, Acquisition Control Plane foundation, Banei bounded operational integration, HKJC source-specific pilot handoff, and UAE ERA source-specific sequence are complete. Banei, HKJC, and UAE continue under their accepted reviewed operating boundaries. UAE ERA handoff accepted for bounded manual reviewed steady-state operation. The next programme stage is `WHR-CAL-PUBLIC-V1`; the global Current Work ID switch remains a separate entrypoint synchronization step.',
  'The NAR source pilot, Acquisition Control Plane foundation, Banei bounded operational integration, HKJC source-specific pilot handoff, and UAE ERA source-specific sequence are complete. Banei, HKJC, and UAE continue under their accepted reviewed operating boundaries. UAE ERA handoff accepted for bounded manual reviewed steady-state operation. The current programme work is `WHR-CAL-PUBLIC-V1`, focused on public release criteria and an explicit reviewed release decision; unattended publication remains disabled.',
);

const implementationMarkerBefore = 'Completed Work ID: `WHR-CAL-UAE-ERA`\nCurrent Work ID: `WHR-CAL-UAE-ERA`\nNext programme Work ID: `WHR-CAL-PUBLIC-V1`';
const implementationMarkerAfter = 'Completed Work ID: `WHR-CAL-UAE-ERA`\nCurrent Work ID: `WHR-CAL-PUBLIC-V1`';
replaceRequired('docs/calendar/implementation-roadmap.md', implementationMarkerBefore, implementationMarkerAfter);
replaceRequired('docs/calendar/implementation-roadmap.md', implementationMarkerBefore, implementationMarkerAfter);
replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  'Status: JRA and NAR source pilots complete; Acquisition Control Plane complete; Banei, HKJC, and UAE ERA handoffs accepted; Calendar Public v1 entrypoint synchronization next',
  'Status: JRA and NAR source pilots complete; Acquisition Control Plane complete; Banei, HKJC, and UAE ERA handoffs accepted; Calendar Public v1 active',
);
replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  '## Stage 11 — Calendar public v1\n\nWork ID: `WHR-CAL-PUBLIC-V1`',
  '## Stage 11 — Calendar public v1\n\nStatus: active current programme work  \nWork ID: `WHR-CAL-PUBLIC-V1`',
);
replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `1. Banei handoff accepted; keep manual reviewed steady-state operation while unattended execution/publication remain disabled
2. HKJC-PILOT-02 artifact-only live fixture bridge implemented under WHR-CAL-HONG-KONG-HKJC
3. HKJC-PILOT-03 shared Actions integration complete; initial August parser_failure evidence retained as transition history
4. HKJC-PILOT-04 parser resilience and repeated bounded shared-Actions evidence complete with source_window_complete valid-empty August evidence
5. HKJC-PILOT-05 artifact-only detail foundation accepted; hosted HTTP detail runner remains unproven and Registry detail activation remains blocked
6. HKJC-PILOT-06 reviewed-import detail operator path evidence-backed; keep system-level fallback and Registry detail activation pending
7. HKJC-PILOT-06B route-specific runner policy complete; HKJC handoff accepted for bounded manual reviewed steady-state operation
8. synchronize global entrypoint markers from WHR-CAL-HONG-KONG-HKJC to WHR-CAL-UAE-ERA in a dedicated compatibility update
9. begin WHR-CAL-UAE-ERA source-specific implementation after entrypoint synchronization
10. run Banei July Completion Audit only before an explicit full-month completeness claim
11. continue Calendar Public v1 release-readiness work in parallel`,
  `1. keep Banei, HKJC, and UAE in their accepted bounded reviewed steady-state operating modes
2. audit dynamic Calendar, Today, and Tomorrow behavior against explicit timezone and safe empty/stale/failure rules
3. reconcile maintained approved-pilot records with visible source, rank, coverage, freshness, review, and retry ownership
4. verify one meeting per list row and C/B/B+/A/A+ public field boundaries across supported views
5. complete bilingual responsive Calendar, country, racecourse, and meeting navigation QA
6. prepare the explicit WHR-CAL-PUBLIC-V1 release decision without enabling unattended publication
7. run source-specific Completion Audits only before making their corresponding completeness claims`,
);
replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  'Next programme Work ID: `WHR-CAL-PUBLIC-V1`. The global Current Work ID switch remains a separate entrypoint synchronization step.',
  'Current programme Work ID: `WHR-CAL-PUBLIC-V1`. UAE maintenance may continue incrementally under the accepted handoff boundary without blocking Public v1 release-readiness work.',
);

for (const file of [
  'scripts/check-calendar-baseline-reconciliation.mjs',
  'scripts/check-calendar-dynamic-dates-release-gate.mjs',
  'scripts/check-calendar-operations-v1-release-gate.mjs',
  'scripts/check-calendar-pipeline-v1-release-gate.mjs',
  'scripts/check-project-governance-docs.mjs',
]) updateChecker(file);

let handoffChecker = fs.readFileSync('scripts/check-calendar-uae-era-handoff-decision.mjs', 'utf8');
handoffChecker = handoffChecker.replace(
  "  'global Current Work ID switch remains a separate entrypoint synchronization step',",
  "  'Current Work ID: `WHR-CAL-PUBLIC-V1`',",
);
handoffChecker = handoffChecker.replace(
  "  'entrypoint synchronization',",
  "  'Current Work ID: `WHR-CAL-PUBLIC-V1`',",
);
handoffChecker = handoffChecker.replace(
  "console.log('ENTRYPOINT_SWITCH: separate');",
  "console.log('ENTRYPOINT_SWITCH: complete');",
);
fs.writeFileSync('scripts/check-calendar-uae-era-handoff-decision.mjs', handoffChecker);

console.log('CALENDAR_PUBLIC_V1_ENTRYPOINT_SYNC: applied');