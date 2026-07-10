import fs from 'node:fs';

function replaceExact(file, before, after) {
  const original = fs.readFileSync(file, 'utf8');
  if (!original.includes(before)) throw new Error(`${file}: expected source block not found`);
  fs.writeFileSync(file, original.replace(before, after));
}

replaceExact(
  'docs/project-roadmap.md',
  'Status: active transition; PILOT-04 parser resilience and repeated shared-Actions live evidence complete, schedule path accepted, overall profile remains provisional, PILOT-05 detail adapter migration current.',
  'Status: active transition; PILOT-05 artifact-only detail foundation accepted, hosted HTTP detail path not evidence-backed, overall profile remains provisional, PILOT-06 runner/source-route reconciliation current.'
);

replaceExact(
  'docs/project-roadmap.md',
  `- HKJC-PILOT-05 artifact-only timetable detail adapter migration is current.

Next implementation unit:

\`\`\`text
HKJC-PILOT-05
HKJC artifact-only timetable detail adapter migration
\`\`\`

The next unit migrates only reviewed public-safe race timetable fields from the quarantined racecard fetch/normalization logic into a bounded artifact-only detail acquisition path. It must emit candidate, Coverage Observation, Result Manifest, and review artifacts without canonical/public writes. Any detail-source, detail-adapter, A, or A+ activation remains a later explicit evidence decision.`,
  `- HKJC-PILOT-05 added and permanently validated the artifact-only detail core, five-rank classifier fixtures, external review-artifact collector, and read-only bounded live evidence path;
- the first bounded hosted detail run remained C / coverage none with one unresolved meeting and one source_unavailable error while all protected-state and no-write boundaries passed;
- three reviewed meetings × three official route forms produced nine HTTP 200 responses with the same 120504-byte shell and no target post-time, race-name, distance, or surface shapes;
- browser-like headers, fixture warmup, and racecard-base warmup strategies also returned the same shell without target detail markers;
- the artifact-only core and collector foundation are accepted, but the GitHub Actions HTTP detail runner is not evidence-backed;
- the Registry profile remains provisional, detail source/adapter remain null, and supported observation ranks remain C only;
- HKJC-PILOT-06 detail runner and source-route reconciliation is current.

Next implementation unit:

\`\`\`text
HKJC-PILOT-06
HKJC detail runner and source-route reconciliation
\`\`\`

The next unit evaluates bounded local execution, reviewed-import fallback, and alternate official detail-source routes against the accepted artifact-only core. It must preserve candidate, Coverage Observation, Result Manifest, review-artifact, protected-state, and no-write boundaries. Registry detail activation remains blocked until bounded evidence succeeds.`
);

replaceExact(
  'docs/calendar/implementation-roadmap.md',
  '- next unit: `HKJC-PILOT-05` — artifact-only timetable detail adapter migration from reviewed public-safe legacy fetch/normalization logic.',
  `- \`HKJC-PILOT-05\`: artifact-only detail core, five-rank fixtures, external review-artifact collector, and bounded hosted evidence path implemented;
- PILOT-05 hosted live evidence remained C / coverage \`none\` with one unresolved meeting and one \`source_unavailable\` error while protected-state and no-write proofs passed;
- three reviewed meetings × three official route forms produced nine HTTP 200 responses with the same 120504-byte shell and no target timetable field shapes;
- browser-header and official warmup session strategies also returned the same shell;
- detail core and collector foundation accepted, GitHub Actions HTTP detail runner not evidence-backed;
- Registry detail source/adapter remain inactive and supported observation ranks remain C only;
- next unit: \`HKJC-PILOT-06\` — detail runner and source-route reconciliation across bounded local execution, reviewed-import fallback, and alternate official detail routes.`
);

replaceExact(
  'docs/calendar/implementation-roadmap.md',
  `5. execute HKJC-PILOT-05 artifact-only timetable detail adapter migration; keep detail activation and A/A+ decisions explicit and evidence-bound
6. run Banei July Completion Audit only before an explicit full-month completeness claim
7. continue Calendar Public v1 release-readiness work in parallel
8. move to WHR-CAL-UAE-ERA after the HKJC pilot handoff boundary is explicitly reviewed`,
  `5. HKJC-PILOT-05 artifact-only detail foundation accepted; hosted HTTP detail runner remains unproven and Registry detail activation remains blocked
6. execute HKJC-PILOT-06 detail runner and source-route reconciliation using bounded local/reviewed-import/alternate-official-route evidence
7. run Banei July Completion Audit only before an explicit full-month completeness claim
8. continue Calendar Public v1 release-readiness work in parallel
9. move to WHR-CAL-UAE-ERA after the HKJC pilot handoff boundary is explicitly reviewed`
);

replaceExact(
  'docs/calendar/README.md',
  '- [`hkjc-pilot-04-live-evidence.md`](hkjc-pilot-04-live-evidence.md) — HKJC-PILOT-04 fail-closed empty-window semantics, successful repeated shared-Actions evidence, evidence-backed schedule-path decision, provisional full-profile boundary, and PILOT-05 handoff.',
  '- [`hkjc-pilot-04-live-evidence.md`](hkjc-pilot-04-live-evidence.md) — HKJC-PILOT-04 fail-closed empty-window semantics, successful repeated shared-Actions evidence, evidence-backed schedule-path decision, provisional full-profile boundary, and PILOT-05 handoff.\n- [`hkjc-detail-artifact-core.md`](hkjc-detail-artifact-core.md) — HKJC-PILOT-05 public-safe five-rank detail core, external review-artifact collector, output guard, and Registry non-activation boundary.\n- [`hkjc-pilot-05-detail-route-evidence.md`](hkjc-pilot-05-detail-route-evidence.md) — hosted detail live evidence, route/session shell probes, accepted core/collector decision, blocked Registry detail activation, and PILOT-06 runner/source-route handoff.'
);

replaceExact(
  'docs/calendar/README.md',
  `data/audits/calendar-hkjc-pilot-04-live-evidence-v1.json
data/fixtures/calendar-hkjc-fixture-artifact-bridge-fixtures-v1.json`,
  `data/audits/calendar-hkjc-pilot-04-live-evidence-v1.json
data/audits/calendar-hkjc-pilot-05-detail-route-evidence-v1.json
data/fixtures/calendar-hkjc-fixture-artifact-bridge-fixtures-v1.json
data/fixtures/calendar-hkjc-detail-artifact-core-fixtures-v1.json
data/fixtures/calendar-hkjc-detail-live-smoke-spec-v1.json`
);

console.log('HKJC_PILOT_05_DECISION_SYNC: applied');
