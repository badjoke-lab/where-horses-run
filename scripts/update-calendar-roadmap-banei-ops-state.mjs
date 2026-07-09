import fs from 'node:fs';

function replaceRequired(file, from, to, label) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(from)) throw new Error(`${label}: required marker not found`);
  fs.writeFileSync(file, text.replace(from, to));
}

// Project roadmap.
replaceRequired(
  'docs/project-roadmap.md',
  `Completed Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`\nCurrent Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`\nNext source-specific Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`\nLast reviewed: 2026-07-08`,
  `Completed Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`\nCompleted Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`\nCurrent Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`\nNext source-specific Work ID: \`WHR-CAL-HONG-KONG-HKJC\`\nLast reviewed: 2026-07-09`,
  'project roadmap header state',
);
replaceRequired(
  'docs/project-roadmap.md',
  `The NAR source pilot publication sequence is complete and the Acquisition Control Plane is current.`,
  `The NAR source pilot and Acquisition Control Plane foundation are complete. Banei A+ is the current source-specific work, now in operational integration after source, adapter, runner, retry, operator-view, manual operator, and proposal-only Queue reconciliation foundations were validated.`,
  'project roadmap current summary',
);
replaceRequired(
  'docs/project-roadmap.md',
  `The Acquisition Registry, Collection Job, Collection Plan, shared five-rank classifier, Collection Result Manifest, Review Queue, Rank-aware Retry Queue, runner-neutral compatibility foundation, Actions multi-job execution, local multi-job execution with JRA shared local Job integration, Review Cohort Planner, deterministic review PR package preparation, and policy-driven Due-job Planner with artifact-only daily scheduling are implemented. Operations v2 operator view is current shared work.`,
  `The Acquisition Registry, Collection Job, Collection Plan, shared five-rank classifier, Collection Result Manifest, Review Queue, Rank-aware Retry Queue, runner-neutral compatibility foundation, Actions multi-job execution, local multi-job execution with JRA shared local Job integration, Review Cohort Planner, deterministic review PR package preparation, policy-driven Due-job Planner with artifact-only daily scheduling, and Operations v2 operator view are implemented. Operations v2 also exposes retry due/deferred, attempt-count, next-eligible, backoff, and attempt-limit state without executing Jobs or mutating Queue state.`,
  'project roadmap control-plane completion summary',
);
replaceRequired(
  'docs/project-roadmap.md',
  `Status: NAR source pilot complete; shared control-plane foundation current\nCompleted Work ID: \`WHR-CAL-JAPAN-JRA-A-PLUS\`  \nCompleted Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`\nCurrent Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`\nNext source-specific Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\``,
  `Status: JRA and NAR source pilots complete; Acquisition Control Plane complete; Banei operational integration current\nCompleted Work ID: \`WHR-CAL-JAPAN-JRA-A-PLUS\`  \nCompleted Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`  \nCompleted Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`\nCurrent Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`\nNext source-specific Work ID: \`WHR-CAL-HONG-KONG-HKJC\``,
  'project roadmap Japan activation state',
);
replaceRequired(
  'docs/project-roadmap.md',
  `15. Operations v2 operator view — current.`,
  `15. Operations v2 operator view — complete, including retry attempt/backoff state.`,
  'project roadmap ACP-15 status',
);
replaceRequired(
  'docs/project-roadmap.md',
  `## Banei A+\n\nBanei follows the minimum shared control-plane foundation.\n\nBanei inherits common incremental, validation, Job/Plan, rank, review, and retry contracts but uses Banei-specific source routes, terminology, distance interpretation, and course semantics.\n\nBanei must not inherit NAR flat-racing parser assumptions.\n\nOrdinary Banei updates may be partial and irregular. July full-month completeness remains a separate Completion Audit claim.`,
  `## Banei A+\n\nStatus: active operational integration.\n\nBanei follows the completed shared control-plane foundation and uses Banei-specific source routes, terminology, distance interpretation, and course semantics. It does not inherit NAR flat-racing parser assumptions. Ordinary Banei updates may be partial and irregular; July full-month completeness remains a separate Completion Audit claim.\n\nCompleted Banei foundations:\n\n- July full-month schedule foundation with 12 reviewed meeting dates;\n- shared control-plane bridge with C/B/B+ schedule evidence;\n- Banei-specific RaceList/DebaTable A+ adapter;\n- bounded live A+ evidence with 12 public-safe timetable rows;\n- Banei detail Authority Source Inventory and Registry activation;\n- GitHub Actions runner convergence for full-month schedule, date-window detail, and selected-meeting detail;\n- shared Banei Actions executor with schedule fallback plus A+ replacement;\n- rank-upgrade retry proof, bounded retry activation, and Due-job planning limits;\n- Operations v2 due/deferred, attempt-count, next-eligible, backoff, and attempt-limit state;\n- successful reviewed retry Job through the standard Actions planner and dispatcher;\n- formal manual workflow_dispatch operator route for the reviewed retry Plan;\n- proposal-only post-run Retry Queue reconciliation with input Queue immutability.\n\nCurrent Banei boundary:\n\n\`\`\`text\nprimary runner: github_actions\nfallback runner: reviewed_import\ndate-window: enabled\nselected-meeting: enabled\nrank-upgrade retry planning: enabled\nregular refresh planning: disabled\ncoverage-gap planning: disabled\nsource revalidation planning: disabled\nscheduler Job execution: disabled\nautomatic approval/promotion/publication: disabled\n\`\`\`\n\nCurrent handoff: proposal-only reconciliation is complete. Any authoritative Queue state application remains a separate explicit operator action requiring stale-write protection, atomic replacement semantics, and rollback evidence. Banei freshness, rollback, bilingual QA, and remaining public-display review stay ahead of any broader public rollout.`,
  'project roadmap Banei section',
);
replaceRequired(
  'docs/project-roadmap.md',
  `Operations v2 operator view — current`,
  `Operations v2 operator view — complete, including retry operational state`,
  'project roadmap multi-system Operations status',
);

// Calendar implementation roadmap.
replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `Last reviewed: 2026-07-08`,
  `Last reviewed: 2026-07-09`,
  'implementation roadmap review date',
);
replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `Completed Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`\nCurrent Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`\nNext source-specific Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\``,
  `Completed Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`  \nCompleted Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`\nCurrent Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`\nNext source-specific Work ID: \`WHR-CAL-HONG-KONG-HKJC\``,
  'implementation roadmap Stage 5 work IDs',
);
replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `Status: NAR source pilot complete; shared control-plane foundation current\nCompleted Work ID: \`WHR-CAL-JAPAN-JRA-A-PLUS\`  \nCompleted Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`\nCurrent Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`\nNext source Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\``,
  `Status: JRA and NAR source pilots complete; Acquisition Control Plane complete; Banei operational integration current\nCompleted Work ID: \`WHR-CAL-JAPAN-JRA-A-PLUS\`  \nCompleted Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`  \nCompleted Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`\nCurrent Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`\nNext source Work ID: \`WHR-CAL-HONG-KONG-HKJC\``,
  'implementation roadmap Stage 6 status',
);
replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `6. shared Registry / Job / Plan / Queue integration is next.`,
  `6. shared Registry / Job / Plan / Queue integration is complete; NAR remains in steady-state retry maintenance.`,
  'implementation roadmap NAR maintenance handoff',
);
replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `## Stage 7 — Acquisition Control Plane foundation\n\nWork ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\``,
  `## Stage 7 — Acquisition Control Plane foundation\n\nStatus: complete.\n\nCompleted Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\``,
  'implementation roadmap ACP stage status',
);
replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `### Banei A+ — subsequent\n\nBanei inherits the shared control-plane and incremental contracts but uses Banei-specific source routes, terminology, distance interpretation, and course semantics.\n\nBanei sequence:\n\n1. register runner/source/adapter profile;\n2. implement arbitrary-window Schedule/Detail acquisition;\n3. classify best available rank across C/B/B+/A/A+;\n4. preserve meeting identity while higher detail is pending;\n5. emit Coverage Observation and rank-aware retry state;\n6. review/promote valid partial batches independently;\n7. use July whole-month validation only for an explicit Completion Audit claim;\n8. complete freshness, rollback, and bilingual QA.`,
  `### Banei A+ — active operational integration\n\nBanei inherits the shared control-plane and incremental contracts but uses Banei-specific source routes, terminology, distance interpretation, and course semantics.\n\nCompleted sequence:\n\n1. runner/source/adapter profile and Banei-specific Authority Source Inventory;\n2. full-month schedule foundation and bounded date-window/selected-meeting detail acquisition;\n3. C/B/B+ schedule evidence and A+ detail classification;\n4. schedule fallback preservation while higher detail is unresolved;\n5. Coverage Observation, Result Manifest, Review Queue, and rank-aware retry integration;\n6. GitHub Actions primary runner convergence with reviewed-import fallback;\n7. shared Banei Actions executor and standard Actions multi-job routing;\n8. retry execution proof with due/deferred planning, success removal, failure retention, attempt accounting, backoff, and max-attempt suppression;\n9. proof-bounded retry planning activation with unrelated Banei automation disabled;\n10. Operations v2 retry operational state;\n11. successful reviewed retry Job through the standard planner/dispatcher;\n12. formal manual operator route;\n13. proposal-only Queue reconciliation with no automatic Queue write.\n\nCurrent sequence:\n\n1. keep authoritative Queue application separate until stale-write guard, atomic replacement, and rollback evidence exist;\n2. complete Banei freshness and rollback operating evidence;\n3. complete bilingual QA and remaining public-display review;\n4. use July whole-month validation only for explicit Completion Audit claims;\n5. preserve human review before promotion/publication.`,
  'implementation roadmap Banei status',
);
replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `## Operations v2 — current\n\nBuild the unified operator view over due plans, Collection Jobs, Result Manifests, Review Queue, Retry Queue, source health, freshness, promotion state, and publication state.`,
  `## Operations v2 — complete\n\nThe unified read-only operator view covers due plans, Collection Jobs, Result Manifests, Review Queue, Retry Queue, source health, freshness, promotion state, publication state, and retry operational state including due/deferred counts, attempt counts, next-eligible time, backoff attention, and attempt limits. It does not execute Jobs or mutate Queue state.`,
  'implementation roadmap Operations v2 status',
);
replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  `\`\`\`text\n1. implement local multi-job execution and JRA shared local Job path\n2. begin Banei source-specific implementation on the satisfied minimum gate\n3. add review cohort planning\n4. add automatic review PR preparation\n5. add due-job planning and scheduled bounded retries\n6. add Operations v2 operator view\n\`\`\``,
  `\`\`\`text\n1. Banei authoritative Queue apply remains separate until stale-write, atomic replacement, and rollback safeguards exist\n2. complete Banei freshness and rollback operating evidence\n3. complete Banei bilingual QA and remaining public-display review\n4. keep reviewed manual retry execution while unattended execution remains disabled\n5. begin the next source pilot only after the Banei handoff boundary is explicitly accepted\n6. continue Calendar Public v1 release-readiness work\n\`\`\``,
  'implementation roadmap immediate execution order',
);

// Acquisition control-plane implementation plan.
replaceRequired(
  'docs/calendar/acquisition-control-plane-implementation-plan.md',
  `Status: adopted programme plan  \nWork ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`  \nLast reviewed: 2026-07-08`,
  `Status: completed foundation programme; retained as canonical implementation history  \nWork ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`  \nLast reviewed: 2026-07-09`,
  'ACP implementation plan header',
);
replaceRequired(
  'docs/calendar/acquisition-control-plane-implementation-plan.md',
  `- Banei remains the next source-specific pilot after the shared control-plane foundation is established.`,
  `- the shared control-plane foundation is complete and Banei is the active source-specific operational integration work.`,
  'ACP starting point Banei marker',
);
replaceRequired(
  'docs/calendar/acquisition-control-plane-implementation-plan.md',
  `Current shared work:\n\n\`\`\`text\nWHR-CAL-ACQUISITION-CONTROL-PLANE\n\`\`\`\n\nSubsequent source-specific work:\n\n\`\`\`text\nWHR-CAL-JAPAN-BANEI-A-PLUS\n\`\`\``,
  `Completed shared work:\n\n\`\`\`text\nWHR-CAL-ACQUISITION-CONTROL-PLANE\n\`\`\`\n\nCurrent source-specific work:\n\n\`\`\`text\nWHR-CAL-JAPAN-BANEI-A-PLUS\n\`\`\`\n\nNext source-specific work:\n\n\`\`\`text\nWHR-CAL-HONG-KONG-HKJC\n\`\`\``,
  'ACP Work IDs current state',
);
replaceRequired(
  'docs/calendar/acquisition-control-plane-implementation-plan.md',
  `## Stage ACP-15 — Operations v2 operator view\n\nStatus: current.`,
  `## Stage ACP-15 — Operations v2 operator view\n\nStatus: complete. The read-only operator view covers acquisition state, Review Queue, Retry Queue, rank distributions, source health, freshness, promotion/publication state, and retry due/deferred, attempt-count, next-eligible, backoff, and attempt-limit state without Job execution or Queue mutation.`,
  'ACP-15 completion status',
);
replaceRequired(
  'docs/calendar/acquisition-control-plane-implementation-plan.md',
  `Actions matrix and full scheduler completion are not prerequisites for starting Banei.\n\nThis prevents overbuilding the control plane while still ensuring Banei enters the shared operating model from its first implementation.`,
  `Actions matrix and full scheduler completion were not prerequisites for starting Banei. The handoff gate is satisfied and the later Actions/local multi-job, review, scheduling, and Operations stages are also complete. Banei now operates on the shared model.`,
  'ACP Banei handoff status',
);
replaceRequired(
  'docs/calendar/acquisition-control-plane-implementation-plan.md',
  `The immediate sequence is:\n\n\`\`\`text\n1. merge this documentation alignment\n2. finish current NAR 82-meeting review/promotion/publication sequence\n3. close temporary diagnostic PRs #430 and #435 without merge\n4. formalize NAR Actions manual dispatch\n5. implement Acquisition Registry\n6. implement Job and Plan schemas\n7. implement five-rank classifier contract tests\n8. implement Review Queue and Rank-aware Retry Queue foundations\n9. connect Actions and local runners to common job semantics\n10. begin Banei on the shared foundation\n11. expand multi-system execution\n12. add automatic review PR preparation\n13. add due-job scheduling and automatic bounded retries\n\`\`\``,
  `The foundation programme is complete. The current handoff sequence is:\n\n\`\`\`text\n1. keep Banei authoritative Queue application separate until stale-write, atomic replacement, and rollback safeguards exist\n2. complete Banei freshness and rollback operating evidence\n3. complete Banei bilingual QA and remaining public-display review\n4. keep manual reviewed retry execution while unattended execution remains disabled\n5. decide Banei handoff completion explicitly\n6. then begin the next source-specific pilot\n\`\`\``,
  'ACP immediate sequence current state',
);

console.log('CALENDAR_ROADMAP_BANEI_OPS_STATE_UPDATED');
