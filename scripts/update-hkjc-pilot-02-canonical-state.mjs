import fs from 'node:fs';

function replaceRequired(file, from, to, label) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(from)) throw new Error(`${label}: marker missing`);
  fs.writeFileSync(file, text.replace(from, to));
}

replaceRequired(
  'docs/calendar/hkjc-pilot-reconciliation.md',
  `- next unit is fixed as \`HKJC-PILOT-02\`.`,
  `- next unit was fixed as \`HKJC-PILOT-02\`, which is now implemented as the artifact-only live fixture acquisition bridge.`,
  'HKJC reconciliation completion state',
);
replaceRequired(
  'docs/calendar/hkjc-pilot-reconciliation.md',
  `## Next implementation unit\n\n\`\`\`text\nHKJC-PILOT-02\nHKJC artifact-only live fixture acquisition bridge\n\`\`\`\n\nGoal:\n\nMove official fixture-window acquisition into a bounded review-artifact path that feeds shared control-plane contracts without canonical or public writes.\n\nThe next unit should not begin with A+ detail activation. First it must establish a safe live schedule acquisition bridge and preserve explicit source-error/partial coverage semantics.`,
  `## Reconciliation handoff status\n\n\`HKJC-PILOT-02\` is implemented in [\`hkjc-live-fixture-artifact-bridge.md\`](hkjc-live-fixture-artifact-bridge.md).\n\nThe bridge now provides a manual artifact-only official fixture-window path with Rank C \`timetable-candidate-v1\`, Coverage Observation, Result Manifest, and collection report outputs. It rejects repository-local artifact output before network access and keeps live execution outside scheduled operation.\n\nThe next implementation unit is:\n\n\`\`\`text\nHKJC-PILOT-03\nShared Actions Job integration and reviewed live fixture evidence\n\`\`\`\n\nGoal:\n\nConnect the live fixture bridge to shared Actions Job execution, review actual live artifact evidence, and then re-evaluate whether the provisional Acquisition Registry profile can advance.\n\nA+ detail activation remains separate and must not be inferred from schedule-level C evidence.`,
  'HKJC reconciliation next unit',
);

replaceRequired(
  'docs/project-roadmap.md',
  `Status: active transition; legacy direct-write path quarantined.`,
  `Status: active transition; PILOT-02 artifact-only live fixture bridge implemented, live evidence/Registry integration pending.`,
  'project roadmap HKJC status',
);
replaceRequired(
  'docs/project-roadmap.md',
  `- current Registry detail source/adapter remain unactivated;\n- public ceiling remains A.`,
  `- current Registry detail source/adapter remain unactivated;\n- public ceiling remains A;\n- HKJC-PILOT-02 artifact-only live fixture bridge implemented;\n- official fixture-window parser emits Rank C timetable-candidate-v1 plus Coverage Observation, Result Manifest, and collection report;\n- repository-local output is rejected before network access;\n- manual live execution uses workflow_dispatch and Actions artifact upload only;\n- successful, partial, none, and parser-failure coverage semantics are fixture-tested;\n- implementation alone does not activate the provisional Registry profile.`,
  'project roadmap HKJC completed state',
);
replaceRequired(
  'docs/project-roadmap.md',
  `Next implementation unit:\n\n\`\`\`text\nHKJC-PILOT-02\nHKJC artifact-only live fixture acquisition bridge\n\`\`\`\n\nThe next unit moves official fixture-window acquisition into bounded review artifacts with explicit Coverage Observation and Result Manifest semantics. It must not begin by reactivating legacy direct canonical/public writes.`,
  `Next implementation unit:\n\n\`\`\`text\nHKJC-PILOT-03\nShared Actions Job integration and reviewed live fixture evidence\n\`\`\`\n\nThe next unit connects the live fixture bridge to shared Actions Job execution and reviews actual live artifacts before any Registry profile activation decision. Detail-source activation and A+ programme-summary acquisition remain separate later decisions.`,
  'project roadmap HKJC next unit',
);

replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `- Registry profile: provisional;\n- detail source/adapter: not activated;\n- next unit: \`HKJC-PILOT-02\` — artifact-only live fixture acquisition bridge.`,
  `- Registry profile: provisional;\n- detail source/adapter: not activated;\n- \`HKJC-PILOT-02\`: artifact-only live fixture acquisition bridge implemented;\n- PILOT-02 output: Rank C timetable-candidate-v1 + Coverage Observation + Result Manifest + collection report;\n- live trigger: manual workflow_dispatch only, artifact upload only, repository worktree clean;\n- source-error semantics: success / partial / none / parser failure validated;\n- next unit: \`HKJC-PILOT-03\` — shared Actions Job integration and reviewed live fixture evidence before Registry re-evaluation.`,
  'implementation roadmap HKJC state',
);
replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `1. Banei handoff accepted; keep manual reviewed steady-state operation while unattended execution/publication remain disabled\n2. execute HKJC-PILOT-02 artifact-only live fixture acquisition bridge under WHR-CAL-HONG-KONG-HKJC\n3. run Banei July Completion Audit only before an explicit full-month completeness claim\n4. continue Calendar Public v1 release-readiness work in parallel\n5. move to WHR-CAL-UAE-ERA after the HKJC pilot handoff boundary is explicitly reviewed`,
  `1. Banei handoff accepted; keep manual reviewed steady-state operation while unattended execution/publication remain disabled\n2. HKJC-PILOT-02 artifact-only live fixture bridge implemented under WHR-CAL-HONG-KONG-HKJC\n3. execute HKJC-PILOT-03 shared Actions Job integration and reviewed live fixture evidence\n4. run Banei July Completion Audit only before an explicit full-month completeness claim\n5. continue Calendar Public v1 release-readiness work in parallel\n6. move to WHR-CAL-UAE-ERA after the HKJC pilot handoff boundary is explicitly reviewed`,
  'implementation roadmap immediate order',
);

replaceRequired(
  'docs/calendar/acquisition-control-plane-implementation-plan.md',
  `1. keep Banei manual reviewed steady-state operation within the accepted handoff boundary\n2. begin WHR-CAL-HONG-KONG-HKJC as the next Stage 10 source-specific pilot\n3. run the Banei July whole-month Completion Audit only before an explicit July full-month completeness claim\n4. keep unattended acquisition execution, automatic approval, promotion, and publication disabled\n5. continue Calendar Public v1 release-readiness work in parallel`,
  `1. keep Banei manual reviewed steady-state operation within the accepted handoff boundary\n2. HKJC-PILOT-02 artifact-only live fixture bridge implemented under WHR-CAL-HONG-KONG-HKJC\n3. execute HKJC-PILOT-03 shared Actions Job integration and reviewed live fixture evidence before Registry re-evaluation\n4. run the Banei July whole-month Completion Audit only before an explicit July full-month completeness claim\n5. keep unattended acquisition execution, automatic approval, promotion, and publication disabled\n6. continue Calendar Public v1 release-readiness work in parallel`,
  'ACP immediate sequence HKJC PILOT-02',
);

replaceRequired(
  'docs/calendar/README.md',
  `- [\`hkjc-pilot-reconciliation.md\`](hkjc-pilot-reconciliation.md) — HKJC shared-control-plane versus legacy rolling-refresh reconciliation, direct-write quarantine, and HKJC-PILOT-02 handoff.`,
  `- [\`hkjc-pilot-reconciliation.md\`](hkjc-pilot-reconciliation.md) — HKJC shared-control-plane versus legacy rolling-refresh reconciliation and direct-write quarantine.\n- [\`hkjc-live-fixture-artifact-bridge.md\`](hkjc-live-fixture-artifact-bridge.md) — HKJC-PILOT-02 official fixture-window Rank C artifact bridge, partial/error semantics, manual live Actions route, and no-write boundary.`,
  'Calendar README HKJC docs',
);
replaceRequired(
  'docs/calendar/README.md',
  `data/audits/calendar-hkjc-pilot-reconciliation-v1.json`,
  `data/audits/calendar-hkjc-pilot-reconciliation-v1.json\ndata/fixtures/calendar-hkjc-fixture-artifact-bridge-fixtures-v1.json`,
  'Calendar README HKJC fixture index',
);
replaceRequired(
  'docs/calendar/README.md',
  `scripts/check-calendar-runner-compatibility.mjs`,
  `scripts/check-calendar-runner-compatibility.mjs\nscripts/timetable/hkjc-fixture-artifact-bridge-core.mjs\nscripts/timetable/collect-hkjc-fixture-artifacts.mjs\nscripts/check-calendar-hkjc-fixture-artifact-bridge.mjs`,
  'Calendar README HKJC script index',
);

replaceRequired(
  'docs/governance/document-authority.md',
  `- \`docs/calendar/banei-handoff-decision.md\``,
  `- \`docs/calendar/banei-handoff-decision.md\`\n- \`docs/calendar/hkjc-pilot-reconciliation.md\`\n- \`docs/calendar/hkjc-live-fixture-artifact-bridge.md\``,
  'document authority HKJC docs',
);
replaceRequired(
  'docs/governance/document-authority.md',
  `- \`scripts/check-calendar-banei-handoff-decision.mjs\``,
  `- \`scripts/check-calendar-banei-handoff-decision.mjs\`\n- \`scripts/check-calendar-hkjc-pilot-reconciliation.mjs\`\n- \`scripts/check-calendar-hkjc-fixture-artifact-bridge.mjs\``,
  'document authority HKJC checkers',
);

console.log('HKJC_PILOT_02_CANONICAL_STATE_UPDATED');
