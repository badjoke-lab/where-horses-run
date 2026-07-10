import fs from 'node:fs';

function replaceRequired(file, from, to, label) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(from)) throw new Error(`${label}: marker missing`);
  fs.writeFileSync(file, text.replace(from, to));
}

replaceRequired(
  'docs/project-roadmap.md',
  `Status: active transition; legacy direct-write path quarantined.`,
  `Status: active artifact-only acquisition integration.`,
  'project roadmap HKJC status',
);
replaceRequired(
  'docs/project-roadmap.md',
  `- public ceiling remains A.\n\nNext implementation unit:\n\n\`\`\`text\nHKJC-PILOT-02\nHKJC artifact-only live fixture acquisition bridge\n\`\`\`\n\nThe next unit moves official fixture-window acquisition into bounded review artifacts with explicit Coverage Observation and Result Manifest semantics. It must not begin by reactivating legacy direct canonical/public writes.`,
  `- public ceiling remains A;\n- \`HKJC-PILOT-02\` artifact-only live fixture bridge complete with pure ST/HV fixture parsing, C-level candidate output, full/partial/none Coverage semantics, Manifest and Review Queue generation, exact batch-root artifact writing, official-host live collector, raw-body non-persistence, and canonical/public hash protection;\n- Registry activation remains separate and the current Registry still points to the dry-run schedule adapter.\n\nNext implementation unit:\n\n\`\`\`text\nHKJC-PILOT-03\nRegistry activation and runner integration\n\`\`\`\n\nThe next unit may activate the reviewed live fixture adapter in the Acquisition Registry and runner compatibility contract. It must preserve C-level schedule identity, honest partial/none coverage, review artifacts before promotion, and no direct canonical/public writes.`,
  'project roadmap HKJC next unit transition',
);

replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `- next unit: \`HKJC-PILOT-02\` — artifact-only live fixture acquisition bridge.`,
  `- \`HKJC-PILOT-02\`: complete — artifact-only official fixture-window bridge with C-level candidate, Coverage Observation, Result Manifest, Review Queue, and collection report;\n- full/partial/none coverage semantics fixture-tested;\n- official-host live collector writes only explicit batch review artifacts and does not persist raw page body;\n- Registry activation remains separate;\n- next unit: \`HKJC-PILOT-03\` — Registry activation and runner integration.`,
  'implementation roadmap HKJC bridge state',
);
replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `2. execute HKJC-PILOT-02 artifact-only live fixture acquisition bridge under WHR-CAL-HONG-KONG-HKJC`,
  `2. execute HKJC-PILOT-03 Registry activation and runner integration under WHR-CAL-HONG-KONG-HKJC`,
  'implementation roadmap immediate HKJC next unit',
);

replaceRequired(
  'docs/calendar/README.md',
  `- [\`hkjc-pilot-reconciliation.md\`](hkjc-pilot-reconciliation.md) — HKJC shared-control-plane versus legacy rolling-refresh reconciliation, direct-write quarantine, and HKJC-PILOT-02 handoff.`,
  `- [\`hkjc-pilot-reconciliation.md\`](hkjc-pilot-reconciliation.md) — HKJC shared-control-plane versus legacy rolling-refresh reconciliation, direct-write quarantine, and HKJC-PILOT-02 handoff.\n- [\`hkjc-live-fixture-artifact-bridge.md\`](hkjc-live-fixture-artifact-bridge.md) — HKJC-PILOT-02 official fixture-window parser, C-level review artifacts, coverage semantics, and live collector write boundary.`,
  'Calendar README HKJC bridge doc index',
);
replaceRequired(
  'docs/calendar/README.md',
  `data/audits/calendar-hkjc-pilot-reconciliation-v1.json`,
  `data/audits/calendar-hkjc-pilot-reconciliation-v1.json\ndata/fixtures/calendar-hkjc-live-fixture-bridge-v1.json`,
  'Calendar README HKJC bridge fixture index',
);

replaceRequired(
  'docs/governance/document-authority.md',
  `- \`docs/calendar/hkjc-pilot-reconciliation.md\``,
  `- \`docs/calendar/hkjc-pilot-reconciliation.md\`\n- \`docs/calendar/hkjc-live-fixture-artifact-bridge.md\``,
  'document authority HKJC bridge doc',
);
replaceRequired(
  'docs/governance/document-authority.md',
  `- \`data/audits/calendar-hkjc-pilot-reconciliation-v1.json\``,
  `- \`data/audits/calendar-hkjc-pilot-reconciliation-v1.json\`\n- \`data/fixtures/calendar-hkjc-live-fixture-bridge-v1.json\``,
  'document authority HKJC bridge fixture',
);
replaceRequired(
  'docs/governance/document-authority.md',
  `- \`scripts/check-calendar-hkjc-pilot-reconciliation.mjs\``,
  `- \`scripts/check-calendar-hkjc-pilot-reconciliation.mjs\`\n- \`scripts/check-calendar-hkjc-live-fixture-bridge.mjs\``,
  'document authority HKJC bridge checker',
);

console.log('HKJC_LIVE_FIXTURE_BRIDGE_CANONICAL_STATE_UPDATED');
