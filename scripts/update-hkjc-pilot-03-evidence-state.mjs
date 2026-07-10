import fs from 'node:fs';

function replaceRequired(file, from, to, label) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(from)) throw new Error(`${label}: marker missing`);
  fs.writeFileSync(file, text.replace(from, to));
}

replaceRequired(
  'docs/calendar/hkjc-shared-actions-live-evidence.md',
  'Status: active evidence stage  ',
  'Status: completed evidence review; profile remains provisional  ',
  'PILOT-03 document status',
);
replaceRequired(
  'docs/calendar/hkjc-shared-actions-live-evidence.md',
  `Actual evidence values are added only after the live run completes and is inspected.`,
  `The reviewed actual live evidence is:\n\n\`\`\`text\nworkflow_run_id: 29094860976\nbatch_id: nar-hkjc-actions-window-001-hkjc-august-actions-plan-job-001-run-001\nrequested_scope: 2026-08-01 through 2026-08-29 exclusive\ncoverage_claim: none\nobserved_scope: not_observed\nrecords_discovered: 0\nrecords_updated: 0\nsource_error_count: 1\nsource_error_code: parser_failure\nsource_error_scope: month:2026-08\njob_status: source_error\nenvelope_review_state: needs_review\nprotected state hash check: pass\nrepository clean after cleanup: true\npublication_effect: none\ncanonical_write_enabled: false\npublic_write_enabled: false\nautomatic_approval_enabled: false\nautomatic_promotion_enabled: false\nautomatic_publication_enabled: false\n\`\`\`\n\nThe shared Actions execution path, artifact transport, summary generation, protected-state verification, upload, cleanup, and clean-worktree proof all succeeded. The official fixture request returned a response, but the August 2026 page produced no recognized fixture markers. The bridge therefore classified the run as fail-closed \`parser_failure\` with \`coverage_claim: none\`.\n\nThis evidence does not justify Registry activation. The HKJC profile remains provisional and the next unit is route/parser resilience reconciliation.`,
  'PILOT-03 actual evidence section',
);
replaceRequired(
  'docs/calendar/hkjc-shared-actions-live-evidence.md',
  `Its exact scope depends on the PILOT-03 live evidence decision.\n\nPossible scope after a successful schedule-path review:\n\n\`\`\`text\ndetail-source inventory and bounded detail-adapter transition planning\n\`\`\`\n\nPossible scope after source instability:\n\n\`\`\`text\nschedule-source resilience, alternate official route review, or fallback strategy\n\`\`\`\n\nPILOT-04 must not be selected until PILOT-03 evidence is reviewed.`,
  `The reviewed PILOT-03 evidence selects:\n\n\`\`\`text\nHKJC official fixture route and parser resilience reconciliation\n\`\`\`\n\nPILOT-04 must review the current official fixture page structure and any alternate official fixture route, improve parser resilience using public-safe fixture evidence, and repeat bounded shared-Actions evidence before Registry activation is reconsidered.\n\nDetail-source inventory and bounded detail-adapter transition planning are deferred until the schedule path produces reviewed successful evidence.`,
  'PILOT-04 selected scope',
);

replaceRequired(
  'docs/project-roadmap.md',
  `Status: active transition; PILOT-02 artifact-only live fixture bridge implemented, live evidence/Registry integration pending.`,
  `Status: active transition; PILOT-03 shared Actions integration and live evidence review complete, profile remains provisional, PILOT-04 parser resilience current.`,
  'project roadmap HKJC status',
);
replaceRequired(
  'docs/project-roadmap.md',
  `- implementation alone does not activate the provisional Registry profile.`,
  `- implementation alone does not activate the provisional Registry profile;\n- HKJC-PILOT-03 connected the live fixture bridge to the shared Actions Job path;\n- actual live evidence run 29094860976 completed the shared execution, artifact upload, protected-state hash check, cleanup, and clean-worktree proof;\n- reviewed live result: coverage \`none\`, 0 discovered records, one \`parser_failure\` for \`month:2026-08\`, Job status \`source_error\`;\n- Registry remains provisional and detail source/adapter remain unactivated;\n- HKJC-PILOT-04 official fixture route and parser resilience reconciliation is current.`,
  'project roadmap HKJC PILOT-03 evidence',
);
replaceRequired(
  'docs/project-roadmap.md',
  `HKJC-PILOT-03\nShared Actions Job integration and reviewed live fixture evidence`,
  `HKJC-PILOT-04\nHKJC official fixture route and parser resilience reconciliation`,
  'project roadmap next unit title',
);
replaceRequired(
  'docs/project-roadmap.md',
  `The next unit connects the live fixture bridge to shared Actions Job execution and reviews actual live artifacts before any Registry profile activation decision. Detail-source activation and A+ programme-summary acquisition remain separate later decisions.`,
  `The next unit reviews the official HKJC fixture page structure or alternate official fixture route, improves parser resilience using public-safe evidence, and repeats bounded shared-Actions evidence before Registry activation is reconsidered. Detail-source activation and A+ programme-summary acquisition remain deferred.`,
  'project roadmap next unit goal',
);

replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `- next unit: \`HKJC-PILOT-03\` — shared Actions Job integration and reviewed live fixture evidence before Registry re-evaluation.`,
  `- \`HKJC-PILOT-03\`: shared Actions Job integration implemented and actual live evidence reviewed;\n- reviewed live result: coverage \`none\`, 0 discovered records, one \`parser_failure\` for August 2026, Job status \`source_error\`;\n- shared execution, artifact upload, protected-state hash verification, cleanup, and clean-worktree proof succeeded;\n- Registry profile remains provisional and detail source/adapter remain inactive;\n- next unit: \`HKJC-PILOT-04\` — official fixture route and parser resilience reconciliation, followed by repeated bounded shared-Actions evidence before Registry activation reconsideration.`,
  'implementation roadmap HKJC evidence',
);
replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `3. execute HKJC-PILOT-03 shared Actions Job integration and reviewed live fixture evidence`,
  `3. HKJC-PILOT-03 shared Actions integration and live evidence review complete; profile remains provisional after parser_failure evidence\n4. execute HKJC-PILOT-04 official fixture route and parser resilience reconciliation, then repeat bounded shared-Actions evidence`,
  'implementation roadmap immediate order PILOT-04',
);
replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `4. run Banei July Completion Audit only before an explicit full-month completeness claim\n5. continue Calendar Public v1 release-readiness work in parallel\n6. move to WHR-CAL-UAE-ERA after the HKJC pilot handoff boundary is explicitly reviewed`,
  `5. run Banei July Completion Audit only before an explicit full-month completeness claim\n6. continue Calendar Public v1 release-readiness work in parallel\n7. move to WHR-CAL-UAE-ERA after the HKJC pilot handoff boundary is explicitly reviewed`,
  'implementation roadmap immediate order renumber',
);

replaceRequired(
  'docs/calendar/acquisition-control-plane-implementation-plan.md',
  `3. execute HKJC-PILOT-03 shared Actions Job integration and reviewed live fixture evidence before Registry re-evaluation`,
  `3. HKJC-PILOT-03 shared Actions integration and reviewed live evidence complete; Registry remains provisional after parser_failure evidence\n4. execute HKJC-PILOT-04 official fixture route and parser resilience reconciliation, then repeat bounded shared-Actions evidence before Registry activation reconsideration`,
  'ACP immediate sequence PILOT-04',
);
replaceRequired(
  'docs/calendar/acquisition-control-plane-implementation-plan.md',
  `4. run the Banei July whole-month Completion Audit only before an explicit July full-month completeness claim\n5. keep unattended acquisition execution, automatic approval, promotion, and publication disabled\n6. continue Calendar Public v1 release-readiness work in parallel`,
  `5. run the Banei July whole-month Completion Audit only before an explicit July full-month completeness claim\n6. keep unattended acquisition execution, automatic approval, promotion, and publication disabled\n7. continue Calendar Public v1 release-readiness work in parallel`,
  'ACP immediate sequence renumber',
);

replaceRequired(
  'docs/calendar/README.md',
  `- [\`hkjc-live-fixture-artifact-bridge.md\`](hkjc-live-fixture-artifact-bridge.md) — HKJC-PILOT-02 official fixture-window Rank C artifact bridge, partial/error semantics, manual live Actions route, and no-write boundary.`,
  `- [\`hkjc-live-fixture-artifact-bridge.md\`](hkjc-live-fixture-artifact-bridge.md) — HKJC-PILOT-02 official fixture-window Rank C artifact bridge, partial/error semantics, manual live Actions route, and no-write boundary.\n- [\`hkjc-shared-actions-live-evidence.md\`](hkjc-shared-actions-live-evidence.md) — HKJC-PILOT-03 shared Actions integration, reviewed parser-failure live evidence, provisional Registry decision, and PILOT-04 handoff.`,
  'Calendar README HKJC PILOT-03 doc',
);

let governance = fs.readFileSync('docs/governance/document-authority.md', 'utf8');
governance = governance.replace(
  `- \`docs/calendar/hkjc-live-fixture-artifact-bridge.md\`\n- \`docs/calendar/hkjc-pilot-reconciliation.md\``,
  `- \`docs/calendar/hkjc-live-fixture-artifact-bridge.md\`\n- \`docs/calendar/hkjc-shared-actions-live-evidence.md\``
);
governance = governance.replace(
  `- \`data/audits/calendar-hkjc-pilot-reconciliation-v1.json\``,
  `- \`data/audits/calendar-hkjc-pilot-reconciliation-v1.json\`\n- \`data/audits/calendar-hkjc-pilot-03-live-evidence-v1.json\``
);
governance = governance.replace(
  `- \`scripts/check-calendar-hkjc-fixture-artifact-bridge.mjs\`\n- \`scripts/check-calendar-hkjc-pilot-reconciliation.mjs\``,
  `- \`scripts/check-calendar-hkjc-fixture-artifact-bridge.mjs\`\n- \`scripts/check-calendar-hkjc-shared-actions-live-evidence.mjs\`\n- \`scripts/check-calendar-hkjc-pilot-03-live-evidence-decision.mjs\``
);
fs.writeFileSync('docs/governance/document-authority.md', governance);

console.log('HKJC_PILOT_03_EVIDENCE_STATE_UPDATED');
