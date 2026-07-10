import fs from 'node:fs';

function replaceExact(file, before, after) {
  const original = fs.readFileSync(file, 'utf8');
  if (!original.includes(before)) throw new Error(`${file}: expected source block not found`);
  fs.writeFileSync(file, original.replace(before, after));
}

replaceExact(
  'docs/project-roadmap.md',
  'Status: active transition; PILOT-05 artifact-only detail foundation accepted, hosted HTTP detail path not evidence-backed, overall profile remains provisional, PILOT-06 runner/source-route reconciliation current.',
  'Status: active transition; PILOT-06 reviewed-import detail operator path evidence-backed, system-level fallback remains pending, overall profile remains provisional, PILOT-06B route-specific runner policy representation current.'
);

replaceExact(
  'docs/project-roadmap.md',
  `- HKJC-PILOT-06 detail runner and source-route reconciliation is current.

Next implementation unit:

\`\`\`text
HKJC-PILOT-06
HKJC detail runner and source-route reconciliation
\`\`\`

The next unit evaluates bounded local execution, reviewed-import fallback, and alternate official detail-source routes against the accepted artifact-only core. It must preserve candidate, Coverage Observation, Result Manifest, review-artifact, protected-state, and no-write boundaries. Registry detail activation remains blocked until bounded evidence succeeds.`,
  `- HKJC-PILOT-06 removed the unimplemented system-level local fallback claim and returned fallback_runner to pending;
- PILOT-06 added strict external public-safe reviewed-import input, exact input SHA-256 binding, two-stage review semantics, and network-free package generation through the accepted PILOT-05 classifier;
- reviewed-import evidence run 29106908246 succeeded with external input SHA-256 4bf489f4c6c31f9fc9c7a21606ac2625f297e6d192a6a4636933d80de29a138b;
- reviewed evidence classified the explicitly incomplete one-race meeting observation as B with first time 18:30, no last-race claim, no timetable rows, coverage partial, one unresolved meeting, runner reviewed_import, candidate needs_review, and no network/canonical/public/publication side effects;
- the reviewed-import detail operator path is evidence-backed, but system-level fallback activation remains false because the current Registry cannot represent a detail-only reviewed-import route without overstating fallback semantics for the evidence-backed Actions schedule path;
- Registry detail source/adapter remain null and supported observation ranks remain C only;
- HKJC-PILOT-06B route-specific runner policy representation is current.

Next implementation unit:

\`\`\`text
HKJC-PILOT-06B
HKJC route-specific runner policy representation
\`\`\`

The next unit represents schedule and detail runner routes separately enough to preserve the evidence-backed GitHub Actions schedule path while registering the evidence-backed reviewed-import detail operator path without overstating system-level fallback capability. It must remain backward compatible with system-level runner fields and must not enable automatic import, approval, promotion, publication, canonical write, or public write.`
);

replaceExact(
  'docs/calendar/implementation-roadmap.md',
  '- next unit: `HKJC-PILOT-06` — detail runner and source-route reconciliation across bounded local execution, reviewed-import fallback, and alternate official detail routes.',
  `- \`HKJC-PILOT-06\`: unimplemented system-level local fallback claim removed and returned to pending;
- strict external public-safe reviewed-import contract, exact SHA-256 input binding, two-stage review semantics, and network-free package generation implemented;
- reviewed-import evidence run 29106908246 succeeded with rank B, first time 18:30, coverage partial, one unresolved meeting, runner \`reviewed_import\`, candidate \`needs_review\`, and no network/canonical/public/publication side effects;
- reviewed-import detail operator path evidence-backed, but system-level fallback activation remains false because current Registry granularity cannot express a detail-only runner route without overstating schedule fallback semantics;
- Registry detail source/adapter remain inactive and supported observation ranks remain C only;
- next unit: \`HKJC-PILOT-06B\` — route-specific runner policy representation with backward-compatible system-level fields.`
);

replaceExact(
  'docs/calendar/implementation-roadmap.md',
  `6. execute HKJC-PILOT-06 detail runner and source-route reconciliation using bounded local/reviewed-import/alternate-official-route evidence
7. run Banei July Completion Audit only before an explicit full-month completeness claim
8. continue Calendar Public v1 release-readiness work in parallel
9. move to WHR-CAL-UAE-ERA after the HKJC pilot handoff boundary is explicitly reviewed`,
  `6. HKJC-PILOT-06 reviewed-import detail operator path evidence-backed; keep system-level fallback and Registry detail activation pending
7. execute HKJC-PILOT-06B route-specific runner policy representation with backward-compatible system-level runner fields
8. run Banei July Completion Audit only before an explicit full-month completeness claim
9. continue Calendar Public v1 release-readiness work in parallel
10. move to WHR-CAL-UAE-ERA after the HKJC pilot handoff boundary is explicitly reviewed`
);

replaceExact(
  'docs/calendar/README.md',
  '- [`hkjc-pilot-05-detail-route-evidence.md`](hkjc-pilot-05-detail-route-evidence.md) — hosted detail live evidence, route/session shell probes, accepted core/collector decision, blocked Registry detail activation, and PILOT-06 runner/source-route handoff.',
  '- [`hkjc-pilot-05-detail-route-evidence.md`](hkjc-pilot-05-detail-route-evidence.md) — hosted detail live evidence, route/session shell probes, accepted core/collector decision, blocked Registry detail activation, and PILOT-06 runner/source-route handoff.\n- [`hkjc-detail-runner-source-route-reconciliation.md`](hkjc-detail-runner-source-route-reconciliation.md) — PILOT-06 runner correction, external reviewed-import contract, two-stage review semantics, and Registry non-activation boundary.\n- [`hkjc-pilot-06-reviewed-import-evidence.md`](hkjc-pilot-06-reviewed-import-evidence.md) — evidence-backed reviewed-import detail operator path, rank-B bounded evidence, pending system-level fallback decision, and PILOT-06B handoff.'
);

replaceExact(
  'docs/calendar/README.md',
  `data/audits/calendar-hkjc-pilot-05-detail-route-evidence-v1.json
data/fixtures/calendar-hkjc-fixture-artifact-bridge-fixtures-v1.json`,
  `data/audits/calendar-hkjc-pilot-05-detail-route-evidence-v1.json
data/audits/calendar-hkjc-pilot-06-reviewed-import-evidence-v1.json
data/fixtures/calendar-hkjc-fixture-artifact-bridge-fixtures-v1.json`
);

console.log('HKJC_PILOT_06_EVIDENCE_SYNC: applied');
