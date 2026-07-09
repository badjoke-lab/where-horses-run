import fs from 'node:fs';

function replaceRequired(file, from, to, label) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(from)) throw new Error(`${label}: marker missing`);
  fs.writeFileSync(file, text.replace(from, to));
}

replaceRequired(
  'docs/project-roadmap.md',
  `- freshness and rollback operating evidence connecting the successful reviewed Banei Job to Operations v2 freshness state, proving 1-hour current state, 168-hour freshness attention with source health still healthy, byte-for-byte rollback restore, and stale apply/rollback rejection.`,
  `- freshness and rollback operating evidence connecting the successful reviewed Banei Job to Operations v2 freshness state, proving 1-hour current state, 168-hour freshness attention with source health still healthy, byte-for-byte rollback restore, and stale apply/rollback rejection;\n- bilingual and public-display QA with separate Banei detail-source Readiness, legacy schedule-source link-only isolation, one-meeting-per-list-row enforcement, A/A+ downgrade and field-switch tests, Japanese meeting-detail routing, localized Banei list labels, and rendered English/Japanese fixture verification without committed public JSON mutation.`,
  'project roadmap completed Banei QA',
);
replaceRequired(
  'docs/project-roadmap.md',
  `Current handoff: proposal-only reconciliation, guarded explicit Retry Queue state apply/rollback, and freshness/rollback operating evidence are complete. The current work is Banei bilingual QA and remaining public-display review before any broader public rollout.`,
  `Current handoff: proposal-only reconciliation, guarded explicit Retry Queue state apply/rollback, freshness/rollback operating evidence, and bilingual/public-display QA are complete. The current work is an explicit Banei handoff decision. July whole-month Completion Audit is required only if the handoff makes an explicit full-month completeness claim; otherwise it is not a blocker.`,
  'project roadmap Banei current handoff',
);

replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `15. freshness and rollback operating evidence connecting reviewed successful Banei Job evidence to Operations v2, proving freshness age 1 hour without freshness attention, 168-hour freshness attention with source health still healthy, byte-for-byte rollback restore, and stale apply/rollback rejection.`,
  `15. freshness and rollback operating evidence connecting reviewed successful Banei Job evidence to Operations v2, proving freshness age 1 hour without freshness attention, 168-hour freshness attention with source health still healthy, byte-for-byte rollback restore, and stale apply/rollback rejection;\n16. bilingual and public-display QA with separate detail-source Readiness, legacy schedule-source C/link-only preservation, one-meeting-per-list-row enforcement, A/A+ downgrade and item-switch validation, Japanese meeting-detail routing, localized Banei list labels, and rendered English/Japanese fixture verification.`,
  'implementation roadmap completed Banei QA',
);
replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `Current sequence:\n\n1. complete Banei bilingual QA and remaining public-display review;\n2. use July whole-month validation only for explicit Completion Audit claims;\n3. preserve human review before promotion/publication;\n4. decide the Banei handoff boundary explicitly before the next source-specific pilot.`,
  `Current sequence:\n\n1. decide whether the Banei handoff requires an explicit July full-month completeness claim;\n2. if that claim is required, run the separate July whole-month Completion Audit; otherwise do not treat full-month validation as a handoff blocker;\n3. preserve human review before promotion/publication and keep unattended execution disabled;\n4. record the explicit Banei handoff decision before the next source-specific pilot.`,
  'implementation roadmap Banei next sequence',
);

replaceRequired(
  'docs/calendar/acquisition-control-plane-implementation-plan.md',
  `The foundation programme is complete. Guarded explicit Banei Retry Queue state apply and rollback are implemented with reviewed approval binding, exact SHA-256 stale-write guards, durable atomic replacement, backup-first rollback evidence, and explicit operator-only mutation. Freshness and rollback operating evidence is also complete: reviewed successful Banei Job evidence now proves Operations v2 freshness current and threshold-breach states while keeping source health separate, and rollback rehearsal proves byte-for-byte restore plus stale apply/rollback rejection. The current handoff sequence is:\n\n\`\`\`text\n1. complete Banei bilingual QA and remaining public-display review\n2. keep manual reviewed retry execution while unattended execution remains disabled\n3. decide Banei handoff completion explicitly\n4. then begin the next source-specific pilot\n\`\`\``,
  `The foundation programme is complete. Guarded explicit Banei Retry Queue state apply and rollback are implemented with reviewed approval binding, exact SHA-256 stale-write guards, durable atomic replacement, backup-first rollback evidence, and explicit operator-only mutation. Freshness and rollback operating evidence is complete, and bilingual/public-display QA is also complete: the separate Banei detail source now resolves through A+ Readiness while the legacy schedule source remains C/link-only, list/detail boundaries are fixture-tested, downgrade and item-switch paths are proven, and English/Japanese rendered routes are verified without committed public JSON mutation. The current handoff sequence is:\n\n\`\`\`text\n1. decide whether the Banei handoff requires an explicit July full-month completeness claim\n2. if required, run the separate July whole-month Completion Audit; otherwise do not treat it as a blocker\n3. keep manual reviewed retry execution while unattended execution remains disabled\n4. record Banei handoff completion explicitly\n5. then begin the next source-specific pilot\n\`\`\``,
  'ACP immediate sequence after Banei QA',
);

console.log('BANEI_BILINGUAL_QA_ROADMAP_STATE_UPDATED');
