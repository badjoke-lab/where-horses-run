import fs from 'node:fs';

function replaceExact(file, before, after) {
  const original = fs.readFileSync(file, 'utf8');
  if (!original.includes(before)) throw new Error(`${file}: expected source block not found`);
  fs.writeFileSync(file, original.replace(before, after));
}

const registryPath = 'data/static/calendar-acquisition-registry.json';
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const hkjc = registry.records.find((record) => record.system_id === 'hong-kong-hkjc-system');
if (!hkjc) throw new Error('HKJC Registry profile missing');
hkjc.operator_notes = 'Provisional overall HKJC Stage 10 profile with evidence-backed schedule path. PILOT-03 shared Actions execution first observed parser_failure for August 2026. PILOT-04 structure review added fail-closed valid empty-window semantics and repeated the same bounded shared Actions Job successfully: source_window_complete, zero records, zero source errors, valid empty month 2026-08, protected-state hashes unchanged, and clean cleanup. The current schedule source hkjc-fixture-list and schedule adapter hkjc-fixture-artifact-bridge-v1 are accepted for the proven C-level date-window path. The overall profile remains provisional because the Registry active-profile contract requires a complete detail path; detail source and adapter remain pending. Next unit: HKJC-PILOT-05 artifact-only timetable detail adapter migration. Historical A+ evidence remains migration evidence only.';
fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);

replaceExact(
  'docs/project-roadmap.md',
  'Status: active transition; PILOT-03 shared Actions integration and live evidence review complete, profile remains provisional, PILOT-04 parser resilience current.',
  'Status: active transition; PILOT-04 parser resilience and repeated shared-Actions live evidence complete, schedule path accepted, overall profile remains provisional, PILOT-05 detail adapter migration current.'
);

replaceExact(
  'docs/project-roadmap.md',
  `- HKJC-PILOT-04 official fixture route and parser resilience reconciliation is current.

Next implementation unit:

\`\`\`text
HKJC-PILOT-04
HKJC official fixture route and parser resilience reconciliation
\`\`\`

The next unit reviews the official HKJC fixture page structure or alternate official fixture route, improves parser resilience using public-safe evidence, and repeats bounded shared-Actions evidence before Registry activation is reconsidered. Detail-source activation and A+ programme-summary acquisition remain deferred.`,
  `- HKJC-PILOT-04 reviewed July, August, and September 2026 public-safe source structure and added fail-closed empty-window semantics;
- the repeated shared Actions live run 29102195265 completed successfully with coverage \`source_window_complete\`, 0 discovered records, 0 source errors, \`valid_empty_months: [\"2026-08\"]\`, protected-state hash pass, artifact upload, cleanup, and clean-worktree proof;
- the C-level date-window schedule source/adapter path is accepted as evidence-backed;
- the overall Registry profile remains provisional because \`detail_source_id\` and \`detail_adapter_id\` remain intentionally pending under the complete-path active-profile contract;
- HKJC-PILOT-05 artifact-only timetable detail adapter migration is current.

Next implementation unit:

\`\`\`text
HKJC-PILOT-05
HKJC artifact-only timetable detail adapter migration
\`\`\`

The next unit migrates only reviewed public-safe race timetable fields from the quarantined racecard fetch/normalization logic into a bounded artifact-only detail acquisition path. It must emit candidate, Coverage Observation, Result Manifest, and review artifacts without canonical/public writes. Any detail-source, detail-adapter, A, or A+ activation remains a later explicit evidence decision.`
);

replaceExact(
  'docs/calendar/implementation-roadmap.md',
  `- \`HKJC-PILOT-03\`: shared Actions Job integration implemented and actual live evidence reviewed;
- reviewed live result: coverage \`none\`, 0 discovered records, one \`parser_failure\` for August 2026, Job status \`source_error\`;
- shared execution, artifact upload, protected-state hash verification, cleanup, and clean-worktree proof succeeded;
- Registry profile remains provisional and detail source/adapter remain inactive;
- next unit: \`HKJC-PILOT-04\` — official fixture route and parser resilience reconciliation, followed by repeated bounded shared-Actions evidence before Registry activation reconsideration.`,
  `- \`HKJC-PILOT-03\`: shared Actions Job integration implemented; first August live evidence returned coverage \`none\` with \`parser_failure\`;
- \`HKJC-PILOT-04\`: public-safe source structure reviewed and fail-closed valid empty-window semantics implemented;
- repeated live run 29102195265: coverage \`source_window_complete\`, 0 records, 0 source errors, valid empty month 2026-08, Job status \`success\`;
- shared execution, artifact upload, protected-state hash verification, cleanup, and clean-worktree proof succeeded;
- C-level date-window schedule source/adapter path accepted as evidence-backed;
- overall Registry profile remains provisional because detail source/adapter remain inactive under the complete-path active-profile contract;
- next unit: \`HKJC-PILOT-05\` — artifact-only timetable detail adapter migration from reviewed public-safe legacy fetch/normalization logic.`
);

replaceExact(
  'docs/calendar/implementation-roadmap.md',
  `2. HKJC-PILOT-02 artifact-only live fixture bridge implemented under WHR-CAL-HONG-KONG-HKJC
3. HKJC-PILOT-03 shared Actions integration and live evidence review complete; profile remains provisional after parser_failure evidence
4. execute HKJC-PILOT-04 official fixture route and parser resilience reconciliation, then repeat bounded shared-Actions evidence
5. run Banei July Completion Audit only before an explicit full-month completeness claim
6. continue Calendar Public v1 release-readiness work in parallel
7. move to WHR-CAL-UAE-ERA after the HKJC pilot handoff boundary is explicitly reviewed`,
  `2. HKJC-PILOT-02 artifact-only live fixture bridge implemented under WHR-CAL-HONG-KONG-HKJC
3. HKJC-PILOT-03 shared Actions integration complete; initial August parser_failure evidence retained as transition history
4. HKJC-PILOT-04 parser resilience and repeated bounded shared-Actions evidence complete with source_window_complete valid-empty August evidence
5. execute HKJC-PILOT-05 artifact-only timetable detail adapter migration; keep detail activation and A/A+ decisions explicit and evidence-bound
6. run Banei July Completion Audit only before an explicit full-month completeness claim
7. continue Calendar Public v1 release-readiness work in parallel
8. move to WHR-CAL-UAE-ERA after the HKJC pilot handoff boundary is explicitly reviewed`
);

replaceExact(
  'docs/calendar/acquisition-control-plane-implementation-plan.md',
  '- the shared control-plane foundation and Banei bounded operational integration are complete; Banei handoff is accepted for manual reviewed steady-state operation and HKJC is the active source-specific pilot.',
  '- the shared control-plane foundation and Banei bounded operational integration are complete; Banei handoff is accepted for manual reviewed steady-state operation and HKJC is the active source-specific pilot; HKJC-PILOT-04 repeated bounded shared-Actions evidence completed with `source_window_complete`, zero records, zero source errors, and a reviewed valid empty August 2026 window, so the C-level schedule path is accepted while the full profile remains provisional and HKJC-PILOT-05 detail adapter migration is current.'
);

replaceExact(
  'docs/calendar/hkjc-pilot-reconciliation.md',
  `The next implementation unit is:

\`\`\`text
HKJC-PILOT-03
Shared Actions Job integration and reviewed live fixture evidence
\`\`\`

Goal:

Connect the live fixture bridge to shared Actions Job execution, review actual live artifact evidence, and then re-evaluate whether the provisional Acquisition Registry profile can advance.

A+ detail activation remains separate and must not be inferred from schedule-level C evidence.`,
  `PILOT-03 and PILOT-04 are now complete transition stages. PILOT-03 connected the live fixture bridge to shared Actions execution and exposed an August 2026 parser-failure ambiguity. PILOT-04 reviewed public-safe fixture structure, added fail-closed valid empty-window semantics, and repeated the same bounded shared Actions Job successfully with \`source_window_complete\`, zero records, zero source errors, and valid empty month 2026-08.

The current implementation unit is:

\`\`\`text
HKJC-PILOT-05
HKJC artifact-only timetable detail adapter migration
\`\`\`

Goal:

Migrate only reviewed public-safe timetable fields from the quarantined racecard fetch and normalization logic into the current candidate, Coverage Observation, Result Manifest, and review-artifact boundary without restoring direct canonical/public writes.

Detail-source activation, detail-adapter activation, A/A+ capability decisions, and any public programme-summary change remain separate explicit evidence decisions.`
);

replaceExact(
  'docs/calendar/README.md',
  '- [`hkjc-shared-actions-live-evidence.md`](hkjc-shared-actions-live-evidence.md) — HKJC-PILOT-03 shared Actions integration, reviewed parser-failure live evidence, provisional Registry decision, and PILOT-04 handoff.',
  '- [`hkjc-shared-actions-live-evidence.md`](hkjc-shared-actions-live-evidence.md) — HKJC-PILOT-03 shared Actions integration, reviewed parser-failure live evidence, provisional Registry decision, and PILOT-04 handoff.\n- [`hkjc-pilot-04-live-evidence.md`](hkjc-pilot-04-live-evidence.md) — HKJC-PILOT-04 fail-closed empty-window semantics, successful repeated shared-Actions evidence, evidence-backed schedule-path decision, provisional full-profile boundary, and PILOT-05 handoff.'
);

replaceExact(
  'docs/calendar/README.md',
  'data/audits/calendar-hkjc-pilot-reconciliation-v1.json\ndata/fixtures/calendar-hkjc-fixture-artifact-bridge-fixtures-v1.json',
  'data/audits/calendar-hkjc-pilot-reconciliation-v1.json\ndata/audits/calendar-hkjc-pilot-03-live-evidence-v1.json\ndata/audits/calendar-hkjc-pilot-04-live-evidence-v1.json\ndata/fixtures/calendar-hkjc-fixture-artifact-bridge-fixtures-v1.json'
);

console.log('HKJC_PILOT_04_DECISION_SYNC: applied');
