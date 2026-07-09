import fs from 'node:fs';

function replaceRequired(file, from, to, label) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(from)) throw new Error(`${label}: marker missing`);
  fs.writeFileSync(file, text.replace(from, to));
}

replaceRequired(
  'docs/project-roadmap.md',
  `- proposal-only post-run Retry Queue reconciliation with input Queue immutability.`,
  `- proposal-only post-run Retry Queue reconciliation with input Queue immutability;\n- guarded explicit Retry Queue state apply and rollback with reviewed approval artifact, exact SHA-256 stale-write guards, durable atomic replacement, pre-apply backup, and rollback evidence.`,
  'project roadmap completed Banei foundations',
);
replaceRequired(
  'docs/project-roadmap.md',
  `Current handoff: proposal-only reconciliation is complete. Any authoritative Queue state application remains a separate explicit operator action requiring stale-write protection, atomic replacement semantics, and rollback evidence. Banei freshness, rollback, bilingual QA, and remaining public-display review stay ahead of any broader public rollout.`,
  `Current handoff: proposal-only reconciliation and guarded explicit Retry Queue state apply/rollback are complete. The current work is Banei freshness and rollback operating evidence, followed by bilingual QA and remaining public-display review before any broader public rollout.`,
  'project roadmap current Banei handoff',
);

replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `13. proposal-only Queue reconciliation with no automatic Queue write.`,
  `13. proposal-only Queue reconciliation with no automatic Queue write;\n14. guarded explicit Queue state apply and rollback with reviewed approval artifact, exact source/proposal/target SHA-256 binding, stale-write rejection, durable atomic replacement, pre-apply backup, and rollback evidence.`,
  'implementation roadmap Banei completed sequence',
);
replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `Current sequence:\n\n1. keep authoritative Queue application separate until stale-write guard, atomic replacement, and rollback evidence exist;\n2. complete Banei freshness and rollback operating evidence;\n3. complete bilingual QA and remaining public-display review;\n4. use July whole-month validation only for explicit Completion Audit claims;\n5. preserve human review before promotion/publication.`,
  `Current sequence:\n\n1. complete Banei freshness and rollback operating evidence;\n2. complete bilingual QA and remaining public-display review;\n3. use July whole-month validation only for explicit Completion Audit claims;\n4. preserve human review before promotion/publication;\n5. decide the Banei handoff boundary explicitly before the next source-specific pilot.`,
  'implementation roadmap Banei current sequence',
);

replaceRequired(
  'docs/calendar/acquisition-control-plane-implementation-plan.md',
  `The foundation programme is complete. The current handoff sequence is:\n\n\`\`\`text\n1. keep Banei authoritative Queue application separate until stale-write, atomic replacement, and rollback safeguards exist\n2. complete Banei freshness and rollback operating evidence\n3. complete Banei bilingual QA and remaining public-display review\n4. keep manual reviewed retry execution while unattended execution remains disabled\n5. decide Banei handoff completion explicitly\n6. then begin the next source-specific pilot\n\`\`\``,
  `The foundation programme is complete. Guarded explicit Banei Retry Queue state apply and rollback are also implemented with reviewed approval binding, exact SHA-256 stale-write guards, durable atomic replacement, backup-first rollback evidence, and explicit operator-only mutation. The current handoff sequence is:\n\n\`\`\`text\n1. complete Banei freshness and rollback operating evidence\n2. complete Banei bilingual QA and remaining public-display review\n3. keep manual reviewed retry execution while unattended execution remains disabled\n4. decide Banei handoff completion explicitly\n5. then begin the next source-specific pilot\n\`\`\``,
  'ACP implementation current handoff sequence',
);

replaceRequired(
  'docs/calendar/banei-retry-reconciliation.md',
  `Status: active operator proposal contract`,
  `Status: completed proposal stage; guarded state apply is defined separately`,
  'reconciliation status',
);
replaceRequired(
  'docs/calendar/banei-retry-reconciliation.md',
  `## Next handoff\n\nAfter proposal-only reconciliation is stable, a later explicit Queue state-update command may be considered.\n\nThat command must require:\n\n1. a reviewed reconciliation proposal;\n2. an exact source Queue digest or equivalent stale-write guard;\n3. explicit operator action;\n4. atomic replacement semantics;\n5. rollback evidence;\n6. no coupling to automatic acquisition execution.\n\nUntil then, reconciliation remains proposal-only.`,
  `## Next handoff\n\nThe guarded explicit Queue state-update command is implemented in \`docs/calendar/banei-retry-queue-state-apply.md\`.\n\nIt requires:\n\n1. a reviewed reconciliation proposal;\n2. a reviewed approval artifact bound to exact source Queue, proposal, and target Queue SHA-256 digests;\n3. exact stale-write guards;\n4. explicit operator \`--apply\` action;\n5. durable same-directory atomic replacement semantics;\n6. backup and rollback evidence written before replacement;\n7. explicit operator \`--restore\` action with a stale rollback guard;\n8. no coupling to automatic acquisition execution, approval, promotion, publication, or deployment.\n\nReconciliation itself remains proposal-only. Banei now moves to freshness and rollback operating evidence, bilingual QA, and remaining public-display review.`,
  'reconciliation next handoff',
);

console.log('BANEI_QUEUE_APPLY_ROADMAP_STATE_UPDATED');
