import fs from 'node:fs';

function replaceRequired(file, from, to, label) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(from)) throw new Error(`${label}: marker missing`);
  fs.writeFileSync(file, text.replace(from, to));
}

replaceRequired(
  'docs/project-roadmap.md',
  `## Multi-system operations expansion`,
  `## HKJC pilot\n\nStatus: active transition; legacy direct-write path quarantined.\n\nCurrent Work ID: \`WHR-CAL-HONG-KONG-HKJC\`\n\nThe first HKJC reconciliation stage found two pre-existing paths: a shared-control-plane bounded C-level executor and a historical rolling live-fetch pipeline that directly chained normalization into canonical/public writes. The adopted decision is \`transition_legacy_refresh_to_shared_control_plane\`.\n\nCompleted HKJC reconciliation state:\n\n- provisional Registry profile retained;\n- GitHub Actions primary / local fallback retained;\n- bounded date-window executor retained as safe C-level fallback foundation;\n- historical rolling evidence verified at 10 route meetings, 10 normalized records, A+ 1 / C 9;\n- historical A+ evidence retained as migration evidence only;\n- legacy \`refresh-hkjc.mjs\` default execution changed to fail closed;\n- explicit \`--legacy-research-only\` mode limited to fetch + normalize;\n- direct canonical/public writer calls removed from the legacy orchestrator;\n- current Registry detail source/adapter remain unactivated;\n- public ceiling remains A.\n\nNext implementation unit:\n\n\`\`\`text\nHKJC-PILOT-02\nHKJC artifact-only live fixture acquisition bridge\n\`\`\`\n\nThe next unit moves official fixture-window acquisition into bounded review artifacts with explicit Coverage Observation and Result Manifest semantics. It must not begin by reactivating legacy direct canonical/public writes.\n\n## Multi-system operations expansion`,
  'project roadmap HKJC section',
);

replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `HKJC and UAE inherit Pipeline v1, incremental coverage, Coverage Observation, validation responsibility, Acquisition Control Plane Job/Plan semantics, five-rank classification, human review, public boundary, freshness, fallback, rollback, and bilingual QA requirements.\n\nNo pilot may require fixed-month completeness before ordinary valid partial promotion.`,
  `HKJC and UAE inherit Pipeline v1, incremental coverage, Coverage Observation, validation responsibility, Acquisition Control Plane Job/Plan semantics, five-rank classification, human review, public boundary, freshness, fallback, rollback, and bilingual QA requirements.\n\nHKJC current transition state:\n\n- reconciliation decision: \`transition_legacy_refresh_to_shared_control_plane\`;\n- bounded shared executor: retained at C-level with publication effect none;\n- historical rolling evidence: 10 meetings, A+ 1 / C 9, migration evidence only;\n- legacy direct-write refresh: quarantined and fail closed by default;\n- Registry profile: provisional;\n- detail source/adapter: not activated;\n- next unit: \`HKJC-PILOT-02\` — artifact-only live fixture acquisition bridge.\n\nNo pilot may require fixed-month completeness before ordinary valid partial promotion.`,
  'implementation roadmap HKJC transition state',
);
replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `2. begin WHR-CAL-HONG-KONG-HKJC as the next Stage 10 source-specific pilot`,
  `2. execute HKJC-PILOT-02 artifact-only live fixture acquisition bridge under WHR-CAL-HONG-KONG-HKJC`,
  'implementation roadmap immediate HKJC unit',
);

replaceRequired(
  'docs/calendar/README.md',
  `- [\`banei-handoff-decision.md\`](banei-handoff-decision.md) — accepted manual reviewed steady-state handoff decision, no-full-month-claim boundary, and next Work ID.`,
  `- [\`banei-handoff-decision.md\`](banei-handoff-decision.md) — accepted manual reviewed steady-state handoff decision, no-full-month-claim boundary, and next Work ID.\n- [\`hkjc-pilot-reconciliation.md\`](hkjc-pilot-reconciliation.md) — HKJC shared-control-plane versus legacy rolling-refresh reconciliation, direct-write quarantine, and HKJC-PILOT-02 handoff.`,
  'Calendar README HKJC reconciliation index',
);
replaceRequired(
  'docs/calendar/README.md',
  `data/static/calendar-banei-handoff-decision-v1.json`,
  `data/static/calendar-banei-handoff-decision-v1.json\ndata/audits/calendar-hkjc-pilot-reconciliation-v1.json`,
  'Calendar README HKJC audit index',
);

replaceRequired(
  'docs/governance/document-authority.md',
  `- \`docs/calendar/banei-handoff-decision.md\``,
  `- \`docs/calendar/banei-handoff-decision.md\`\n- \`docs/calendar/hkjc-pilot-reconciliation.md\``,
  'document authority HKJC reconciliation doc',
);
replaceRequired(
  'docs/governance/document-authority.md',
  `- \`data/static/calendar-banei-handoff-decision-v1.json\``,
  `- \`data/static/calendar-banei-handoff-decision-v1.json\`\n- \`data/audits/calendar-hkjc-pilot-reconciliation-v1.json\``,
  'document authority HKJC reconciliation audit',
);
replaceRequired(
  'docs/governance/document-authority.md',
  `- \`scripts/check-calendar-banei-handoff-decision.mjs\``,
  `- \`scripts/check-calendar-banei-handoff-decision.mjs\`\n- \`scripts/check-calendar-hkjc-pilot-reconciliation.mjs\``,
  'document authority HKJC reconciliation checker',
);

console.log('HKJC_PILOT_RECONCILIATION_CANONICAL_STATE_UPDATED');
