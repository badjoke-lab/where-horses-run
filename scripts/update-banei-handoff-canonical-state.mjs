import fs from 'node:fs';

function replaceRequired(file, from, to, label) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(from)) throw new Error(`${label}: marker missing`);
  fs.writeFileSync(file, text.replace(from, to));
}

replaceRequired(
  'docs/project-roadmap.md',
  `Status: active operational integration.`,
  `Status: handoff accepted; manual reviewed steady-state operation.`,
  'project roadmap Banei status',
);
replaceRequired(
  'docs/project-roadmap.md',
  `- bilingual and public-display QA with separate Banei detail-source Readiness, legacy schedule-source link-only isolation, one-meeting-per-list-row enforcement, A/A+ downgrade and field-switch tests, Japanese meeting-detail routing, localized Banei list labels, and rendered English/Japanese fixture verification without committed public JSON mutation.`,
  `- bilingual and public-display QA with separate Banei detail-source Readiness, legacy schedule-source link-only isolation, one-meeting-per-list-row enforcement, A/A+ downgrade and field-switch tests, Japanese meeting-detail routing, localized Banei list labels, and rendered English/Japanese fixture verification without committed public JSON mutation;\n- Banei handoff accepted for manual reviewed steady-state operation with bounded operational integration complete, no July full-month completeness claim, no unattended execution/publication, and next Work ID \`WHR-CAL-HONG-KONG-HKJC\`.`,
  'project roadmap Banei handoff completion bullet',
);
replaceRequired(
  'docs/project-roadmap.md',
  `Current handoff: proposal-only reconciliation, guarded explicit Retry Queue state apply/rollback, freshness/rollback operating evidence, and bilingual/public-display QA are complete. The current work is an explicit Banei handoff decision. July whole-month Completion Audit is required only if the handoff makes an explicit full-month completeness claim; otherwise it is not a blocker.`,
  `Current handoff: Banei handoff accepted for manual reviewed steady-state operation. The accepted claim is bounded operational integration complete, not July full-month completeness. The separate July whole-month Completion Audit remains unperformed and is required only before an explicit July full-month completeness claim. The next Work ID is \`WHR-CAL-HONG-KONG-HKJC\`.`,
  'project roadmap Banei current handoff',
);

replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `16. bilingual and public-display QA with separate detail-source Readiness, legacy schedule-source C/link-only preservation, one-meeting-per-list-row enforcement, A/A+ downgrade and item-switch validation, Japanese meeting-detail routing, localized Banei list labels, and rendered English/Japanese fixture verification.`,
  `16. bilingual and public-display QA with separate detail-source Readiness, legacy schedule-source C/link-only preservation, one-meeting-per-list-row enforcement, A/A+ downgrade and item-switch validation, Japanese meeting-detail routing, localized Banei list labels, and rendered English/Japanese fixture verification;\n17. Banei handoff decision accepted for manual reviewed steady-state operation with bounded operational integration complete, no July full-month completeness claim, unattended execution/publication disabled, and next Work ID \`WHR-CAL-HONG-KONG-HKJC\`.`,
  'implementation roadmap Banei handoff completion',
);
replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `Current sequence:\n\n1. decide whether the Banei handoff requires an explicit July full-month completeness claim;\n2. if that claim is required, run the separate July whole-month Completion Audit; otherwise do not treat full-month validation as a handoff blocker;\n3. preserve human review before promotion/publication and keep unattended execution disabled;\n4. record the explicit Banei handoff decision before the next source-specific pilot.`,
  `Current sequence:\n\n1. keep Banei in manual reviewed steady-state operation with unattended execution, approval, promotion, and publication disabled;\n2. begin Stage 10 work under \`WHR-CAL-HONG-KONG-HKJC\`;\n3. run the separate Banei July whole-month Completion Audit only before making an explicit July full-month completeness claim;\n4. continue Calendar Public v1 release-readiness work in parallel.`,
  'implementation roadmap current sequence',
);
replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `\`\`\`text\n1. Banei authoritative Queue apply remains separate until stale-write, atomic replacement, and rollback safeguards exist\n2. complete Banei freshness and rollback operating evidence\n3. complete Banei bilingual QA and remaining public-display review\n4. keep reviewed manual retry execution while unattended execution remains disabled\n5. begin the next source pilot only after the Banei handoff boundary is explicitly accepted\n6. continue Calendar Public v1 release-readiness work\n\`\`\``,
  `\`\`\`text\n1. Banei handoff accepted; keep manual reviewed steady-state operation while unattended execution/publication remain disabled\n2. begin WHR-CAL-HONG-KONG-HKJC as the next Stage 10 source-specific pilot\n3. run Banei July Completion Audit only before an explicit full-month completeness claim\n4. continue Calendar Public v1 release-readiness work in parallel\n5. move to WHR-CAL-UAE-ERA after the HKJC pilot handoff boundary is explicitly reviewed\n\`\`\``,
  'implementation roadmap immediate execution order',
);

replaceRequired(
  'docs/calendar/acquisition-control-plane-implementation-plan.md',
  `The foundation programme is complete. Guarded explicit Banei Retry Queue state apply and rollback are implemented with reviewed approval binding, exact SHA-256 stale-write guards, durable atomic replacement, backup-first rollback evidence, and explicit operator-only mutation. Freshness and rollback operating evidence is complete, and bilingual/public-display QA is also complete: the separate Banei detail source now resolves through A+ Readiness while the legacy schedule source remains C/link-only, list/detail boundaries are fixture-tested, downgrade and item-switch paths are proven, and English/Japanese rendered routes are verified without committed public JSON mutation. The current handoff sequence is:\n\n\`\`\`text\n1. decide whether the Banei handoff requires an explicit July full-month completeness claim\n2. if required, run the separate July whole-month Completion Audit; otherwise do not treat it as a blocker\n3. keep manual reviewed retry execution while unattended execution remains disabled\n4. record Banei handoff completion explicitly\n5. then begin the next source-specific pilot\n\`\`\``,
  `The foundation programme is complete. Banei guarded Queue state apply/rollback, freshness and rollback operating evidence, bilingual/public-display QA, and the explicit handoff decision are complete. Banei handoff accepted means bounded operational integration is complete for manual reviewed steady-state operation; it does not claim July full-month completeness, and unattended execution remains disabled. The current handoff sequence is:\n\n\`\`\`text\n1. keep Banei manual reviewed steady-state operation within the accepted handoff boundary\n2. begin WHR-CAL-HONG-KONG-HKJC as the next Stage 10 source-specific pilot\n3. run the Banei July whole-month Completion Audit only before an explicit July full-month completeness claim\n4. keep unattended acquisition execution, automatic approval, promotion, and publication disabled\n5. continue Calendar Public v1 release-readiness work in parallel\n\`\`\``,
  'ACP immediate sequence after Banei handoff',
);

replaceRequired(
  'docs/calendar/README.md',
  `- [\`banei-a-plus-full-month-plan.md\`](banei-a-plus-full-month-plan.md) — queued Banei incremental plan and separate July completion audit.`,
  `- [\`banei-a-plus-full-month-plan.md\`](banei-a-plus-full-month-plan.md) — queued Banei incremental plan and separate July completion audit.\n- [\`banei-retry-reconciliation.md\`](banei-retry-reconciliation.md) — proposal-only post-run Retry Queue reconciliation boundary.\n- [\`banei-retry-queue-state-apply.md\`](banei-retry-queue-state-apply.md) — reviewed approval, SHA-256 stale-write guards, atomic Queue replacement, and explicit rollback contract.\n- [\`banei-freshness-rollback-operating-evidence.md\`](banei-freshness-rollback-operating-evidence.md) — reviewed successful Job freshness states and rollback rehearsal evidence.\n- [\`banei-bilingual-public-display-qa.md\`](banei-bilingual-public-display-qa.md) — separate detail-source Readiness, list/detail boundary, A/A+ switch, and rendered English/Japanese QA.\n- [\`banei-handoff-decision.md\`](banei-handoff-decision.md) — accepted manual reviewed steady-state handoff decision, no-full-month-claim boundary, and next Work ID.`,
  'Calendar README Banei document index',
);
replaceRequired(
  'docs/calendar/README.md',
  `data/static/calendar-due-job-plan.schema.json`,
  `data/static/calendar-due-job-plan.schema.json\ndata/static/calendar-readiness-banei-detail-v1.json\ndata/static/calendar-banei-retry-queue-apply-approval.schema.json\ndata/static/calendar-banei-handoff-decision.schema.json\ndata/static/calendar-banei-handoff-decision-v1.json`,
  'Calendar README Banei machine-readable index',
);

replaceRequired(
  'docs/governance/document-authority.md',
  `- \`docs/calendar/banei-a-plus-full-month-plan.md\``,
  `- \`docs/calendar/banei-a-plus-full-month-plan.md\`\n- \`docs/calendar/banei-retry-reconciliation.md\`\n- \`docs/calendar/banei-retry-queue-state-apply.md\`\n- \`docs/calendar/banei-freshness-rollback-operating-evidence.md\`\n- \`docs/calendar/banei-bilingual-public-display-qa.md\`\n- \`docs/calendar/banei-handoff-decision.md\``,
  'document authority Banei human-readable set',
);
replaceRequired(
  'docs/governance/document-authority.md',
  `- \`data/static/calendar-operations-seasonal-policy.json\``,
  `- \`data/static/calendar-operations-seasonal-policy.json\`\n- \`data/static/calendar-readiness-banei-detail-v1.json\`\n- \`data/static/calendar-banei-retry-queue-apply-approval.schema.json\`\n- \`data/static/calendar-banei-handoff-decision.schema.json\`\n- \`data/static/calendar-banei-handoff-decision-v1.json\``,
  'document authority Banei machine-readable set',
);
replaceRequired(
  'docs/governance/document-authority.md',
  `- \`scripts/check-calendar-operations-v1-release-gate.mjs\``,
  `- \`scripts/check-calendar-operations-v1-release-gate.mjs\`\n- \`scripts/check-calendar-banei-retry-queue-state-apply.mjs\`\n- \`scripts/check-calendar-banei-freshness-rollback-operating-evidence.mjs\`\n- \`scripts/check-calendar-banei-bilingual-public-display-qa.mjs\`\n- \`scripts/check-calendar-banei-handoff-decision.mjs\``,
  'document authority Banei checker set',
);

console.log('BANEI_HANDOFF_CANONICAL_STATE_UPDATED');
