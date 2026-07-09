import fs from 'node:fs';

function replaceRequired(file, from, to, label) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(from)) throw new Error(`${label}: required marker not found`);
  fs.writeFileSync(file, text.replace(from, to));
}

replaceRequired(
  'scripts/check-calendar-acquisition-registry.mjs',
  `  || baneiProfile?.supports_selected_meetings !== true\n  || baneiProfile?.supports_rank_upgrade_retry !== false) {\n  fail('Banei active runner profile must preserve GitHub Actions primary routing, reviewed-import fallback, evidence-backed detail source/adapter, date-window and selected support, and disabled rank retry.');`,
  `  || baneiProfile?.supports_selected_meetings !== true\n  || baneiProfile?.supports_rank_upgrade_retry !== true) {\n  fail('Banei active runner profile must preserve GitHub Actions primary routing, reviewed-import fallback, evidence-backed detail source/adapter, date-window, selected-meeting, and rank-retry support.');`,
  'Acquisition Registry Banei retry boundary',
);
replaceRequired(
  'scripts/check-calendar-acquisition-registry.mjs',
  "console.log('BANEI_RUNNER_PROFILE: github_actions primary / reviewed_import fallback / date-window+selected enabled / rank retry disabled');",
  "console.log('BANEI_RUNNER_PROFILE: github_actions primary / reviewed_import fallback / date-window+selected+rank-retry enabled');",
  'Acquisition Registry Banei summary',
);

replaceRequired(
  'scripts/check-calendar-due-job-planner.mjs',
  `  if (jobs.some((job) => job.system_id === 'japan-banei-system')) fail('policy-disabled Banei must not receive a due Job.');\n  if (!plan.decisions.some((decision) => decision.system_id === 'japan-banei-system' && decision.trigger === 'policy_disabled' && decision.disposition === 'excluded')) fail('Banei policy-disabled decision missing.');`,
  `  const baneiRetry = jobs.find((job) => job.system_id === 'japan-banei-system' && job.reason === 'rank_upgrade_retry');\n  if (!baneiRetry) fail('Banei rank retry Job missing.');\n  else {\n    if (!exact(baneiRetry.requested_scope.meeting_ids, fixtures.expected.banei_retry_meeting_ids)) fail(\`Banei due retry IDs differ: \${JSON.stringify(baneiRetry.requested_scope.meeting_ids)}\`);\n    if (baneiRetry.collection_mode !== 'selected_meetings') fail('Banei retry Job must use selected_meetings.');\n    if (baneiRetry.target_rank !== 'A+' || baneiRetry.rank_strategy !== 'target_rank') fail('Banei retry target must resolve to A+ target_rank.');\n    if (baneiRetry.runner_policy.mode !== 'registry_primary_or_fallback') fail('Banei retry Job must preserve reviewed-import fallback eligibility.');\n  }`,
  'Due-job checker Banei activation assertions',
);
replaceRequired(
  'scripts/check-calendar-due-job-planner.mjs',
  "console.log('RANK_RETRY_BACKOFF: pass');",
  "console.log('RANK_RETRY_BACKOFF: pass');\nconsole.log('BANEI_RANK_RETRY_PLANNING: enabled / batch=2 / attempts=3');",
  'Due-job checker summary',
);

replaceRequired(
  'scripts/timetable/banei-control-plane-bridge.mjs',
  "state: 'blocked_pending_retry_execution_evidence'",
  "state: 'enabled_evidence_backed'",
  'Banei bridge activation state',
);
replaceRequired(
  'scripts/check-calendar-banei-control-plane-bridge.mjs',
  "if (output.retry_activation.state !== 'blocked_pending_retry_execution_evidence') fail('Retry activation state differs.');",
  "if (output.retry_activation.state !== 'enabled_evidence_backed') fail('Retry activation state differs.');",
  'Banei bridge checker activation state',
);
replaceRequired(
  'scripts/check-calendar-banei-control-plane-bridge.mjs',
  "if (baneiProfile.supports_rank_upgrade_retry !== false) fail('Banei rank retry must remain disabled until retry execution evidence exists.');",
  "if (baneiProfile.supports_rank_upgrade_retry !== true) fail('Banei rank retry must be enabled after retry execution proof.');",
  'Banei bridge checker Registry retry capability',
);
replaceRequired(
  'scripts/check-calendar-banei-control-plane-bridge.mjs',
  "'Retry Queue activation remains blocked',",
  "'Retry Queue capability is enabled',",
  'Banei bridge docs checker phrase',
);
replaceRequired(
  'docs/calendar/banei-control-plane-bridge.md',
  'Retry Queue activation remains blocked during this bridge stage.',
  'Retry Queue capability is enabled after the merged retry execution proof and conservative activation review.',
  'Banei bridge retry boundary heading sentence',
);
replaceRequired(
  'docs/calendar/banei-control-plane-bridge.md',
  'blocked_pending_retry_execution_evidence',
  'enabled_evidence_backed',
  'Banei bridge retry state docs',
);
replaceRequired(
  'docs/calendar/banei-control-plane-bridge.md',
  `The detail source, A+ detail adapter, selected-meeting execution, and GitHub Actions runner convergence are now evidence-backed and registered. Retry activation remains blocked because:\n\n1. retry backoff and attempt accounting have not been executed for Banei;\n2. failure isolation across retry attempts has not been proven;\n3. retry-specific Result Manifest and Review Queue behavior has not been proven;\n4. Retry Queue update behavior has not been executed;\n5. rank-upgrade retry support remains false in the Registry.`,
  `The detail source, A+ detail adapter, selected-meeting execution, GitHub Actions runner convergence, and retry execution semantics are evidence-backed and registered. The merged proof validates due/deferred selection, success removal, failure retention, attempt accounting, exponential backoff, max-attempt suppression, Result Manifest behavior, and Review Queue behavior. Registry rank-upgrade retry support is enabled.`,
  'Banei bridge retry evidence docs',
);
replaceRequired(
  'docs/calendar/banei-control-plane-bridge.md',
  'Retry Queue activation may occur only after retry execution, backoff, attempt accounting, failure isolation, and queue-update evidence is reviewed and the Registry capability is updated from that evidence.',
  'The bridge still does not write Retry Queue automatically; Queue mutation remains an explicit control-plane operation even though Registry and Due-job planning capability are enabled.',
  'Banei bridge automatic write boundary docs',
);
replaceRequired(
  'docs/calendar/banei-control-plane-bridge.md',
  '- Retry Queue activation remains blocked until retry execution, backoff, attempt-accounting, failure-isolation, and queue-update evidence exist;',
  '- Retry Queue capability is enabled from merged evidence while automatic bridge Queue writes remain disabled;',
  'Banei bridge completion bullet',
);

replaceRequired(
  'scripts/check-calendar-banei-detail-registry-activation.mjs',
  "if (baneiProfile.supports_rank_upgrade_retry !== false) fail('Banei rank-upgrade retry must remain false.');",
  "if (baneiProfile.supports_rank_upgrade_retry !== true) fail('Banei rank-upgrade retry must be enabled after proof.');",
  'Banei detail activation checker retry capability',
);
replaceRequired(
  'scripts/check-calendar-banei-detail-registry-activation.mjs',
  `  if (baneiPolicy.enabled !== false) fail('Banei Due-job policy must remain disabled.');\n  if (baneiPolicy.regular_refresh.enabled !== false) fail('Banei automatic regular refresh must remain disabled.');\n  if (baneiPolicy.coverage_gap.enabled !== false) fail('Banei automatic coverage-gap planning must remain disabled.');\n  if (baneiPolicy.source_revalidation.enabled !== false) fail('Banei automatic source revalidation must remain disabled.');\n  if (baneiPolicy.rank_retry.enabled !== false) fail('Banei automatic rank retry must remain disabled.');`,
  `  if (baneiPolicy.enabled !== true) fail('Banei Due-job system policy must be enabled for retry planning.');\n  if (baneiPolicy.regular_refresh.enabled !== false) fail('Banei automatic regular refresh must remain disabled.');\n  if (baneiPolicy.coverage_gap.enabled !== false) fail('Banei automatic coverage-gap planning must remain disabled.');\n  if (baneiPolicy.source_revalidation.enabled !== false) fail('Banei automatic source revalidation must remain disabled.');\n  if (baneiPolicy.rank_retry.enabled !== true) fail('Banei rank retry planning must be enabled.');\n  if (baneiPolicy.rank_retry.max_selected_meetings_per_job !== 2) fail('Banei retry batch limit differs.');\n  if (baneiPolicy.rank_retry.max_attempt_count !== 3) fail('Banei retry attempt limit differs.');`,
  'Banei detail activation checker policy boundary',
);
replaceRequired(
  'scripts/check-calendar-banei-detail-registry-activation.mjs',
  "'supports_rank_upgrade_retry: false',\n  'The Banei Due-job Planner system rule also remains disabled.',",
  "'supports_rank_upgrade_retry: true',\n  'The Banei Due-job Planner system rule is enabled only for bounded rank-retry planning.',",
  'Banei detail activation docs markers',
);
replaceRequired(
  'scripts/check-calendar-banei-detail-registry-activation.mjs',
  "console.log('RANK_RETRY: disabled');\nconsole.log('DUE_JOB_POLICY: disabled');",
  "console.log('RANK_RETRY: enabled');\nconsole.log('DUE_JOB_POLICY: rank-retry-only');",
  'Banei detail activation summary',
);
replaceRequired(
  'docs/calendar/banei-detail-registry-activation.md',
  'supports_rank_upgrade_retry: false',
  'supports_rank_upgrade_retry: true',
  'Banei detail activation docs retry capability',
);
replaceRequired(
  'docs/calendar/banei-detail-registry-activation.md',
  'The Banei Due-job Planner system rule also remains disabled.',
  'The Banei Due-job Planner system rule is enabled only for bounded rank-retry planning.',
  'Banei detail activation docs Due-job status',
);
replaceRequired(
  'docs/calendar/banei-detail-registry-activation.md',
  `## Why rank-upgrade retry remains disabled\n\nRank-upgrade retry requires more than an A+ parser and selected-meeting execution capability.\n\nIt still requires evidence for:\n\n\`\`\`text\nretry backoff semantics\nattempt accounting\nretry reason mapping\nfailure isolation across retry attempts\nCoverage and Result Manifest normalization after retry\nReview Queue behavior after retry\nRetry Queue update behavior\nretry-specific Due-job policy\n\`\`\`\n\nThose capabilities are not activated by this contract.`,
  `## Rank-upgrade retry activation update\n\nRank-upgrade retry is now enabled from the merged execution proof. The proof validates due/deferred selection, selected-meeting Job generation, one success and one failure-isolated partial result, success removal, failure retention, attempt accounting, 6h then 12h exponential backoff, max-attempt suppression, Coverage and Result Manifest normalization, and Review Queue behavior. The Banei Due-job rule is enabled only for bounded rank-retry planning; unrelated automation remains disabled.`,
  'Banei detail activation retry section',
);

replaceRequired(
  'docs/calendar/banei-actions-executor.md',
  `## Rank-upgrade retry boundary\n\nRank-upgrade retry remains disabled.\n\nSelected-meeting execution evidence is necessary but not sufficient for retry activation.\n\nRetry activation still requires explicit proof for:\n\n\`\`\`text\nretry backoff\nattempt accounting\nretry reason mapping\nfailure isolation across retry attempts\nRetry Queue update behavior\nretry-specific Due-job policy\n\`\`\`\n\nThe executor therefore supports selected Collection Jobs without claiming automatic retry policy.`,
  `## Rank-upgrade retry boundary\n\nRank-upgrade retry capability is enabled from merged execution proof. The proof validates due/deferred planning, selected-meeting Job generation, success removal, failure retention, attempt accounting, exponential backoff, max-attempt suppression, and Manifest/Review Queue behavior. The executor supports explicit reviewed retry Jobs. Scheduler execution remains disabled, so planning eligibility does not mean unattended execution.`,
  'Banei Actions executor retry section',
);
replaceRequired(
  'docs/calendar/banei-actions-executor.md',
  `## Due-job policy boundary\n\nThe Banei Due-job Planner rule remains disabled.\n\nThe runner may execute an explicit reviewed Collection Plan, but the daily planner does not yet generate Banei Jobs automatically.\n\nThis keeps schedule maintenance policy separate from runner capability.`,
  `## Due-job policy boundary\n\nThe Banei Due-job Planner system rule is enabled only for bounded rank-retry planning. Regular refresh, coverage-gap planning, and source revalidation remain disabled. The shared scheduler remains artifact-only and does not execute planned Jobs automatically.`,
  'Banei Actions executor Due-job section',
);
replaceRequired(
  'docs/calendar/banei-actions-executor.md',
  `- rank-upgrade retry remains disabled;\n- Banei Due-job policy remains disabled;`,
  `- rank-upgrade retry is enabled from reviewed proof;\n- Banei Due-job policy is enabled only for bounded rank-retry planning;`,
  'Banei Actions executor completion bullets',
);
replaceRequired(
  'docs/calendar/banei-actions-executor.md',
  `After the Actions executor is validated, the next source-specific Banei stage is retry execution proof.\n\nThat proof should cover:\n\n1. one explicit Retry Queue entry;\n2. due versus deferred backoff behavior;\n3. attempt count increment;\n4. selected-meeting Job generation from retry state;\n5. one successful retry and one failure-isolated case;\n6. Result Manifest and Review Queue behavior after retry;\n7. only then, Registry \`supports_rank_upgrade_retry\` and Banei Due-job retry policy activation.`,
  `The retry execution proof and conservative activation are complete. The next Banei stage is operational integration: surface due/deferred/attempt/backoff status in the normal operator view, run an explicit reviewed retry Job through the standard Actions multi-job path, and record real operational evidence while unattended execution remains disabled.`,
  'Banei Actions executor next handoff',
);

replaceRequired(
  'scripts/check-calendar-banei-retry-execution-proof.mjs',
  `let proof = null;\ntry {\n  proof = buildBaneiRetryExecutionProofV1({\n    fixture,\n    canonical_registry: registry,\n    canonical_policy: policy,`,
  `const historicalRegistry = structuredClone(registry);\nhistoricalRegistry.records.find((entry) => entry.system_id === 'japan-banei-system').supports_rank_upgrade_retry = false;\nconst historicalPolicy = structuredClone(policy);\nconst historicalRule = historicalPolicy.system_rules.find((entry) => entry.system_id === 'japan-banei-system');\nhistoricalRule.enabled = false;\nhistoricalRule.rank_retry.enabled = false;\nhistoricalRule.rank_retry.max_selected_meetings_per_job = 0;\nhistoricalRule.rank_retry.max_attempt_count = 0;\n\nlet proof = null;\ntry {\n  proof = buildBaneiRetryExecutionProofV1({\n    fixture,\n    canonical_registry: historicalRegistry,\n    canonical_policy: historicalPolicy,`,
  'Retry proof checker historical baseline',
);
replaceRequired(
  'scripts/check-calendar-banei-retry-execution-proof.mjs',
  'const proofRegistry = buildBaneiRetryProofRegistryV1(registry);\nconst proofPolicy = buildBaneiRetryProofPolicyV1(policy, fixture);',
  'const proofRegistry = buildBaneiRetryProofRegistryV1(historicalRegistry);\nconst proofPolicy = buildBaneiRetryProofPolicyV1(historicalPolicy, fixture);',
  'Retry proof checker proof clones',
);
replaceRequired(
  'scripts/check-calendar-banei-retry-execution-proof.mjs',
  `if (canonicalProfile.supports_rank_upgrade_retry !== false) fail('canonical Registry was unexpectedly activated by proof work.');\nif (canonicalRule.enabled !== false || canonicalRule.rank_retry.enabled !== false) fail('canonical Banei Due-job policy was unexpectedly activated by proof work.');`,
  `if (canonicalProfile.supports_rank_upgrade_retry !== true) fail('canonical Registry retry activation is missing after proof-based activation.');\nif (canonicalRule.enabled !== true || canonicalRule.rank_retry.enabled !== true) fail('canonical Banei rank-retry planning activation is missing.');\nif (canonicalRule.regular_refresh.enabled !== false || canonicalRule.coverage_gap.enabled !== false || canonicalRule.source_revalidation.enabled !== false) fail('unrelated Banei Due-job automation must remain disabled.');`,
  'Retry proof checker canonical activation assertions',
);
replaceRequired(
  'scripts/check-calendar-banei-retry-execution-proof.mjs',
  "console.log('CANONICAL_ACTIVATION: false');",
  "console.log('CANONICAL_ACTIVATION: retry-only enabled');",
  'Retry proof checker summary',
);
replaceRequired(
  '.github/workflows/calendar-banei-retry-execution-proof.yml',
  `      - name: Check canonical activation remains disabled\n        run: |\n          node - <<'NODE'\n          const fs = require('node:fs');\n          const registry = JSON.parse(fs.readFileSync('data/static/calendar-acquisition-registry.json', 'utf8'));\n          const policy = JSON.parse(fs.readFileSync('data/static/calendar-due-job-policy-v1.json', 'utf8'));\n          const profile = registry.records.find((entry) => entry.system_id === 'japan-banei-system');\n          const rule = policy.system_rules.find((entry) => entry.system_id === 'japan-banei-system');\n          if (profile.supports_rank_upgrade_retry !== false) throw new Error('canonical Banei Registry retry support must remain false');\n          if (rule.enabled !== false || rule.rank_retry.enabled !== false) throw new Error('canonical Banei Due-job retry policy must remain false');\n          console.log('CANONICAL_BANEI_RETRY_ACTIVATION: false');\n          NODE`,
  `      - name: Check canonical activation is proof-bounded\n        run: |\n          node - <<'NODE'\n          const fs = require('node:fs');\n          const registry = JSON.parse(fs.readFileSync('data/static/calendar-acquisition-registry.json', 'utf8'));\n          const policy = JSON.parse(fs.readFileSync('data/static/calendar-due-job-policy-v1.json', 'utf8'));\n          const profile = registry.records.find((entry) => entry.system_id === 'japan-banei-system');\n          const rule = policy.system_rules.find((entry) => entry.system_id === 'japan-banei-system');\n          if (profile.supports_rank_upgrade_retry !== true) throw new Error('canonical Banei Registry retry support must be enabled');\n          if (rule.enabled !== true || rule.rank_retry.enabled !== true) throw new Error('canonical Banei rank-retry planning must be enabled');\n          if (rule.regular_refresh.enabled || rule.coverage_gap.enabled || rule.source_revalidation.enabled) throw new Error('unrelated Banei automation must remain disabled');\n          if (rule.rank_retry.max_selected_meetings_per_job !== 2 || rule.rank_retry.max_attempt_count !== 3) throw new Error('Banei retry limits differ from proof');\n          console.log('CANONICAL_BANEI_RETRY_ACTIVATION: proof-bounded');\n          NODE`,
  'Retry proof workflow activation boundary',
);
replaceRequired(
  'docs/calendar/banei-retry-execution-proof.md',
  `## Activation boundary\n\nThis PR is evidence only.\n\nIt must not change canonical:\n\n\`\`\`text\nsupports_rank_upgrade_retry\nBanei Due-job system enabled state\nBanei rank_retry policy enabled state\n\`\`\`\n\nA later activation PR may use this evidence to enable only the proven capability.\n\nThat later PR must separately validate all shared Retry Queue, Due-job Planner, Actions executor, Registry, Manifest, Review Queue, Operations, and release gates.`,
  `## Activation boundary\n\nThe original proof PR was evidence-only and left canonical retry support disabled. A later activation PR consumed this evidence and enabled only the proven capability. Permanent proof CI now reconstructs the pre-activation Registry and Policy baseline in memory, reruns the proof, and separately verifies that current canonical activation is limited to Registry rank-retry support plus Banei rank-retry planning with proof-bounded limits.`,
  'Retry proof docs activation boundary',
);
replaceRequired(
  'docs/calendar/banei-retry-execution-proof.md',
  `After this proof is merged, the next PR may activate Banei retry capability conservatively:\n\n1. set \`supports_rank_upgrade_retry\` to true;\n2. enable Banei system policy only for \`rank_retry\`;\n3. set bounded retry batch and attempt limits from reviewed proof values;\n4. keep regular refresh, coverage-gap, source-revalidation, cross-month, and source-visible-horizon automation disabled;\n5. keep the scheduler artifact-only and non-executing;\n6. rerun Retry Queue, Due-job Planner, Banei executor, Actions multi-job, Operations, pipeline, and release gates.`,
  `The proof-based activation step is complete. The next handoff is operational integration: expose due/deferred/attempt/backoff state in the operator view, run an explicit reviewed Banei retry Job through the standard Actions multi-job path, record real operational evidence, and keep unattended execution disabled until separately approved.`,
  'Retry proof docs next handoff',
);

console.log('BANEI_RETRY_ACTIVATION_CONTRACTS_UPDATED');
