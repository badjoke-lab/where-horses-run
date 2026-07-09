import fs from 'node:fs';

function replaceRequired(file, from, to, label) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(from)) throw new Error(`${label}: marker missing`);
  fs.writeFileSync(file, text.replace(from, to));
}

replaceRequired(
  'docs/project-roadmap.md',
  `- guarded explicit Retry Queue state apply and rollback with reviewed approval artifact, exact SHA-256 stale-write guards, durable atomic replacement, pre-apply backup, and rollback evidence.`,
  `- guarded explicit Retry Queue state apply and rollback with reviewed approval artifact, exact SHA-256 stale-write guards, durable atomic replacement, pre-apply backup, and rollback evidence;\n- freshness and rollback operating evidence connecting the successful reviewed Banei Job to Operations v2 freshness state, proving 1-hour current state, 168-hour freshness attention with source health still healthy, byte-for-byte rollback restore, and stale apply/rollback rejection.`,
  'project roadmap Banei operating evidence completion',
);
replaceRequired(
  'docs/project-roadmap.md',
  `Current handoff: proposal-only reconciliation and guarded explicit Retry Queue state apply/rollback are complete. The current work is Banei freshness and rollback operating evidence, followed by bilingual QA and remaining public-display review before any broader public rollout.`,
  `Current handoff: proposal-only reconciliation, guarded explicit Retry Queue state apply/rollback, and freshness/rollback operating evidence are complete. The current work is Banei bilingual QA and remaining public-display review before any broader public rollout.`,
  'project roadmap Banei current handoff',
);

replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `14. guarded explicit Queue state apply and rollback with reviewed approval artifact, exact source/proposal/target SHA-256 binding, stale-write rejection, durable atomic replacement, pre-apply backup, and rollback evidence.`,
  `14. guarded explicit Queue state apply and rollback with reviewed approval artifact, exact source/proposal/target SHA-256 binding, stale-write rejection, durable atomic replacement, pre-apply backup, and rollback evidence;\n15. freshness and rollback operating evidence connecting reviewed successful Banei Job evidence to Operations v2, proving freshness age 1 hour without freshness attention, 168-hour freshness attention with source health still healthy, byte-for-byte rollback restore, and stale apply/rollback rejection.`,
  'implementation roadmap Banei completed operating evidence',
);
replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `Current sequence:\n\n1. complete Banei freshness and rollback operating evidence;\n2. complete bilingual QA and remaining public-display review;\n3. use July whole-month validation only for explicit Completion Audit claims;\n4. preserve human review before promotion/publication;\n5. decide the Banei handoff boundary explicitly before the next source-specific pilot.`,
  `Current sequence:\n\n1. complete Banei bilingual QA and remaining public-display review;\n2. use July whole-month validation only for explicit Completion Audit claims;\n3. preserve human review before promotion/publication;\n4. decide the Banei handoff boundary explicitly before the next source-specific pilot.`,
  'implementation roadmap Banei current sequence',
);

replaceRequired(
  'docs/calendar/acquisition-control-plane-implementation-plan.md',
  `The foundation programme is complete. Guarded explicit Banei Retry Queue state apply and rollback are also implemented with reviewed approval binding, exact SHA-256 stale-write guards, durable atomic replacement, backup-first rollback evidence, and explicit operator-only mutation. The current handoff sequence is:\n\n\`\`\`text\n1. complete Banei freshness and rollback operating evidence\n2. complete Banei bilingual QA and remaining public-display review\n3. keep manual reviewed retry execution while unattended execution remains disabled\n4. decide Banei handoff completion explicitly\n5. then begin the next source-specific pilot\n\`\`\``,
  `The foundation programme is complete. Guarded explicit Banei Retry Queue state apply and rollback are implemented with reviewed approval binding, exact SHA-256 stale-write guards, durable atomic replacement, backup-first rollback evidence, and explicit operator-only mutation. Freshness and rollback operating evidence is also complete: reviewed successful Banei Job evidence now proves Operations v2 freshness current and threshold-breach states while keeping source health separate, and rollback rehearsal proves byte-for-byte restore plus stale apply/rollback rejection. The current handoff sequence is:\n\n\`\`\`text\n1. complete Banei bilingual QA and remaining public-display review\n2. keep manual reviewed retry execution while unattended execution remains disabled\n3. decide Banei handoff completion explicitly\n4. then begin the next source-specific pilot\n\`\`\``,
  'ACP immediate sequence after Banei operating evidence',
);

console.log('BANEI_OPERATING_EVIDENCE_ROADMAP_STATE_UPDATED');
