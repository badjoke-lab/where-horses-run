import fs from 'node:fs';

function replaceExact(file, before, after) {
  const original = fs.readFileSync(file, 'utf8');
  if (!original.includes(before)) throw new Error(`${file}: expected source block not found`);
  fs.writeFileSync(file, original.replace(before, after));
}

replaceExact(
  'docs/project-roadmap.md',
  'Status: active transition; PILOT-06 reviewed-import detail operator path evidence-backed, system-level fallback remains pending, overall profile remains provisional, PILOT-06B route-specific runner policy representation current.',
  'Status: HKJC handoff accepted; bounded manual reviewed steady-state operation, overall Registry profile remains provisional, next source-specific Work ID is WHR-CAL-UAE-ERA while the global Current Work ID switch remains a separate entrypoint synchronization step.'
);

replaceExact(
  'docs/project-roadmap.md',
  `- HKJC-PILOT-06B route-specific runner policy representation is current.

Next implementation unit:

\`\`\`text
HKJC-PILOT-06B
HKJC route-specific runner policy representation
\`\`\`

The next unit represents schedule and detail runner routes separately enough to preserve the evidence-backed GitHub Actions schedule path while registering the evidence-backed reviewed-import detail operator path without overstating system-level fallback capability. It must remain backward compatible with system-level runner fields and must not enable automatic import, approval, promotion, publication, canonical write, or public write.`,
  `- HKJC-PILOT-06B route-specific runner policy representation is complete and validated against Acquisition Registry, Collection Job, Collection Plan, Due-job Planner, runner compatibility, and Operations v2;
- the schedule route remains GitHub Actions / collection_job / C evidence with automatic execution disabled;
- the detail route remains reviewed_import / operator_only / B evidence and is rejected from generic Collection Job and Due-job Planner selection;
- system-level Registry fallback remains null and pending, Registry detail source/adapter remain null, and Registry supported observation ranks remain C only;
- HKJC handoff accepted for bounded manual reviewed steady-state operation;
- no full detail completeness, full-season completeness, automatic detail acquisition, system-wide fallback, or unattended publication claim is made;
- the next source-specific Work ID is \`WHR-CAL-UAE-ERA\`;
- the global Current Work ID switch remains a separate entrypoint synchronization step so historical release-gate current-state markers are updated deliberately rather than implicitly.

Handoff decision:

\`\`\`text
HKJC-HANDOFF-01
accept_manual_reviewed_steady_state_handoff
completed Work ID: WHR-CAL-HONG-KONG-HKJC
next Work ID: WHR-CAL-UAE-ERA
\`\`\`

HKJC maintenance may continue incrementally under explicit schedule Jobs and operator-reviewed detail imports without blocking UAE source-specific implementation.`
);

replaceExact(
  'docs/calendar/implementation-roadmap.md',
  '- next unit: `HKJC-PILOT-06B` — route-specific runner policy representation with backward-compatible system-level fields.',
  `- \`HKJC-PILOT-06B\`: route-specific runner policy supplement complete;
- schedule route is GitHub Actions / collection_job / C evidence and detail route is reviewed_import / operator_only / B evidence;
- generic HKJC reviewed_import Collection Jobs and Due-job Planner detail-route selection are rejected;
- Registry system-level fallback remains null and pending, Registry detail source/adapter remain null, and supported observation ranks remain C only;
- HKJC handoff accepted for bounded manual reviewed steady-state operation;
- next source-specific Work ID: \`WHR-CAL-UAE-ERA\`;
- the global Current Work ID change is a separate entrypoint synchronization step.`
);

replaceExact(
  'docs/calendar/implementation-roadmap.md',
  `7. execute HKJC-PILOT-06B route-specific runner policy representation with backward-compatible system-level runner fields
8. run Banei July Completion Audit only before an explicit full-month completeness claim
9. continue Calendar Public v1 release-readiness work in parallel
10. move to WHR-CAL-UAE-ERA after the HKJC pilot handoff boundary is explicitly reviewed`,
  `7. HKJC-PILOT-06B route-specific runner policy complete; HKJC handoff accepted for bounded manual reviewed steady-state operation
8. synchronize global entrypoint markers from WHR-CAL-HONG-KONG-HKJC to WHR-CAL-UAE-ERA in a dedicated compatibility update
9. begin WHR-CAL-UAE-ERA source-specific implementation after entrypoint synchronization
10. run Banei July Completion Audit only before an explicit full-month completeness claim
11. continue Calendar Public v1 release-readiness work in parallel`
);

replaceExact(
  'docs/calendar/README.md',
  '- [`hkjc-pilot-06-reviewed-import-evidence.md`](hkjc-pilot-06-reviewed-import-evidence.md) — evidence-backed reviewed-import detail operator path, rank-B bounded evidence, pending system-level fallback decision, and PILOT-06B handoff.',
  '- [`hkjc-pilot-06-reviewed-import-evidence.md`](hkjc-pilot-06-reviewed-import-evidence.md) — evidence-backed reviewed-import detail operator path, rank-B bounded evidence, pending system-level fallback decision, and PILOT-06B handoff.\n- [`hkjc-route-specific-runner-policy.md`](hkjc-route-specific-runner-policy.md) — PILOT-06B schedule/detail route split, operator-only detail isolation, backward-compatible Registry semantics, and Operations supplement.\n- [`hkjc-handoff-decision.md`](hkjc-handoff-decision.md) — accepted bounded manual reviewed steady-state HKJC handoff, explicit non-claims, and next Work ID `WHR-CAL-UAE-ERA`.'
);

replaceExact(
  'docs/calendar/README.md',
  `data/audits/calendar-hkjc-pilot-06-reviewed-import-evidence-v1.json
data/fixtures/calendar-hkjc-fixture-artifact-bridge-fixtures-v1.json`,
  `data/audits/calendar-hkjc-pilot-06-reviewed-import-evidence-v1.json
data/audits/calendar-hkjc-handoff-decision-v1.json
data/fixtures/calendar-hkjc-fixture-artifact-bridge-fixtures-v1.json`
);

console.log('HKJC_HANDOFF_ROADMAP_SYNC: applied');
