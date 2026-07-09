import fs from 'node:fs';

function replaceRequired(file, from, to, label) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(from)) throw new Error(`${label}: required marker not found`);
  fs.writeFileSync(file, text.replace(from, to));
}

replaceRequired(
  'scripts/timetable/banei-control-plane-bridge.mjs',
  "state: 'blocked_pending_selected_meeting_runner_and_retry_execution_evidence'",
  "state: 'blocked_pending_retry_execution_evidence'",
  'bridge retry state',
);

replaceRequired(
  'scripts/check-calendar-banei-control-plane-bridge.mjs',
  "if (output.retry_activation.state !== 'blocked_pending_selected_meeting_runner_and_retry_execution_evidence') fail('Retry activation state differs.');",
  "if (output.retry_activation.state !== 'blocked_pending_retry_execution_evidence') fail('Retry activation state differs.');",
  'bridge checker retry state',
);

replaceRequired(
  'scripts/check-calendar-banei-control-plane-bridge.mjs',
  `  if (baneiProfile.profile_status !== 'provisional') fail('Banei Registry profile must remain provisional in bridge stage.');\n  if (baneiProfile.primary_runner !== 'reviewed_import') fail('Banei bridge stage must not silently change primary runner.');\n  if (baneiProfile.detail_source_id !== 'nar-banei-race-list-deba-table') fail('Banei evidence-backed detail source differs.');\n  if (baneiProfile.detail_adapter_id !== 'banei-nar-race-list-detail-v1') fail('Banei evidence-backed detail adapter differs.');\n  if (baneiProfile.supports_date_window !== true) fail('Banei evidence-backed date-window support differs.');\n  if (baneiProfile.supports_selected_meetings !== false) fail('Banei selected-meeting support must remain disabled without live proof.');\n  if (baneiProfile.supports_rank_upgrade_retry !== false) fail('Banei rank retry must remain disabled until selected-meeting, runner, and retry execution evidence exists.');`,
  `  if (baneiProfile.profile_status !== 'active') fail('Banei Registry profile must be active after runner convergence proof.');\n  if (baneiProfile.primary_runner !== 'github_actions') fail('Banei primary runner must be github_actions after convergence proof.');\n  if (baneiProfile.fallback_runner !== 'reviewed_import') fail('Banei fallback runner must remain reviewed_import.');\n  if (baneiProfile.detail_source_id !== 'nar-banei-race-list-deba-table') fail('Banei evidence-backed detail source differs.');\n  if (baneiProfile.detail_adapter_id !== 'banei-nar-race-list-detail-v1') fail('Banei evidence-backed detail adapter differs.');\n  if (baneiProfile.supports_date_window !== true) fail('Banei evidence-backed date-window support differs.');\n  if (baneiProfile.supports_selected_meetings !== true) fail('Banei selected-meeting support must be enabled after bounded live proof.');\n  if (baneiProfile.supports_rank_upgrade_retry !== false) fail('Banei rank retry must remain disabled until retry execution evidence exists.');`,
  'bridge checker Registry boundary',
);

replaceRequired(
  'scripts/check-calendar-banei-control-plane-bridge.mjs',
  "console.log('REGISTRY_PROFILE: provisional / reviewed_import');",
  "console.log('REGISTRY_PROFILE: active / github_actions primary / reviewed_import fallback');",
  'bridge checker summary marker',
);

replaceRequired(
  'docs/calendar/banei-control-plane-bridge.md',
  'blocked_pending_selected_meeting_runner_and_retry_execution_evidence',
  'blocked_pending_retry_execution_evidence',
  'bridge docs retry state',
);

replaceRequired(
  'docs/calendar/banei-control-plane-bridge.md',
  `The detail source and A+ detail adapter are now evidence-backed and registered. Retry activation remains blocked because:\n\n1. selected-meeting execution has not been proven by bounded live evidence;\n2. system-level runner policy is not yet converged across schedule and detail paths;\n3. retry backoff and attempt accounting have not been executed for Banei;\n4. failure isolation and retry-specific Manifest semantics have not been proven;\n5. rank-upgrade retry support remains false in the Registry.`,
  `The detail source, A+ detail adapter, selected-meeting execution, and GitHub Actions runner convergence are now evidence-backed and registered. Retry activation remains blocked because:\n\n1. retry backoff and attempt accounting have not been executed for Banei;\n2. failure isolation across retry attempts has not been proven;\n3. retry-specific Result Manifest and Review Queue behavior has not been proven;\n4. Retry Queue update behavior has not been executed;\n5. rank-upgrade retry support remains false in the Registry.`,
  'bridge docs retry reasons',
);

replaceRequired(
  'docs/calendar/banei-control-plane-bridge.md',
  'Retry Queue activation may occur only after selected-meeting, runner-routing, and retry execution evidence is reviewed and the Registry capability is updated from that evidence.',
  'Retry Queue activation may occur only after retry execution, backoff, attempt accounting, failure isolation, and queue-update evidence is reviewed and the Registry capability is updated from that evidence.',
  'bridge docs retry handoff',
);

replaceRequired(
  'docs/calendar/banei-control-plane-bridge.md',
  '- Retry Queue activation remains blocked until selected-meeting, runner-routing, and retry execution evidence exist;',
  '- Retry Queue activation remains blocked until retry execution, backoff, attempt-accounting, failure-isolation, and queue-update evidence exist;',
  'bridge docs completion bullet',
);

replaceRequired(
  'scripts/check-calendar-banei-detail-registry-activation.mjs',
  `  if (baneiProfile.profile_status !== 'provisional') fail('Banei profile must remain provisional.');\n  if (baneiProfile.primary_runner !== 'reviewed_import') fail('Banei primary runner must remain reviewed_import.');\n  if (baneiProfile.fallback_runner !== null) fail('Banei fallback runner must remain null.');\n  if (baneiProfile.schedule_source_id !== 'banei-official-schedule') fail('Banei schedule source differs.');\n  if (baneiProfile.schedule_adapter_id !== 'japan-banei-dry-run-adapter') fail('Banei schedule adapter differs.');\n  if (baneiProfile.detail_source_id !== 'nar-banei-race-list-deba-table') fail('Banei detail source activation differs.');\n  if (baneiProfile.detail_adapter_id !== 'banei-nar-race-list-detail-v1') fail('Banei detail adapter activation differs.');\n  if (!exact(baneiProfile.supported_observation_ranks, ['B', 'A+'])) fail(\`Banei supported ranks differ: \${JSON.stringify(baneiProfile.supported_observation_ranks)}\`);\n  if (baneiProfile.supports_date_window !== true) fail('Banei date-window support must be true.');\n  if (baneiProfile.supports_cross_month_window !== false) fail('Banei cross-month support must remain false.');\n  if (baneiProfile.supports_selected_meetings !== false) fail('Banei selected-meeting support must remain false.');\n  if (baneiProfile.supports_source_visible_horizon !== false) fail('Banei source-visible-horizon support must remain false.');\n  if (baneiProfile.supports_rank_upgrade_retry !== false) fail('Banei rank-upgrade retry must remain false.');\n  if (!exact(baneiProfile.pending_fields, ['fallback_runner'])) fail(\`Banei pending_fields differ: \${JSON.stringify(baneiProfile.pending_fields)}\`);`,
  `  if (baneiProfile.profile_status !== 'active') fail('Banei profile must be active after runner convergence proof.');\n  if (baneiProfile.primary_runner !== 'github_actions') fail('Banei primary runner must be github_actions.');\n  if (baneiProfile.fallback_runner !== 'reviewed_import') fail('Banei fallback runner must remain reviewed_import.');\n  if (baneiProfile.schedule_source_id !== 'banei-official-schedule') fail('Banei schedule source differs.');\n  if (baneiProfile.schedule_adapter_id !== 'japan-banei-dry-run-adapter') fail('Banei schedule adapter differs.');\n  if (baneiProfile.detail_source_id !== 'nar-banei-race-list-deba-table') fail('Banei detail source activation differs.');\n  if (baneiProfile.detail_adapter_id !== 'banei-nar-race-list-detail-v1') fail('Banei detail adapter activation differs.');\n  if (!exact(baneiProfile.supported_observation_ranks, ['B', 'A+'])) fail(\`Banei supported ranks differ: \${JSON.stringify(baneiProfile.supported_observation_ranks)}\`);\n  if (baneiProfile.supports_date_window !== true) fail('Banei date-window support must be true.');\n  if (baneiProfile.supports_cross_month_window !== false) fail('Banei cross-month support must remain false.');\n  if (baneiProfile.supports_selected_meetings !== true) fail('Banei selected-meeting support must be true after live proof.');\n  if (baneiProfile.supports_source_visible_horizon !== false) fail('Banei source-visible-horizon support must remain false.');\n  if (baneiProfile.supports_rank_upgrade_retry !== false) fail('Banei rank-upgrade retry must remain false.');\n  if (!exact(baneiProfile.pending_fields, [])) fail(\`Banei pending_fields differ: \${JSON.stringify(baneiProfile.pending_fields)}\`);`,
  'detail activation checker Registry boundary',
);

replaceRequired(
  'scripts/check-calendar-banei-detail-registry-activation.mjs',
  "'BANEI_DETAIL_PROFILE: live-evidence-backed detail source/adapter',",
  "'BANEI_RUNNER_PROFILE: github_actions primary / reviewed_import fallback',",
  'detail activation checker Registry marker',
);

replaceRequired(
  'scripts/check-calendar-banei-detail-registry-activation.mjs',
  "'profile_status: provisional',",
  "'profile_status: active',",
  'detail activation docs profile marker',
);

replaceRequired(
  'scripts/check-calendar-banei-detail-registry-activation.mjs',
  "'supports_selected_meetings: false',",
  "'supports_selected_meetings: true',",
  'detail activation docs selected marker',
);

replaceRequired(
  'scripts/check-calendar-banei-detail-registry-activation.mjs',
  "console.log('SELECTED_MEETINGS: disabled');",
  "console.log('SELECTED_MEETINGS: enabled');",
  'detail activation summary selected marker',
);

replaceRequired(
  'scripts/check-calendar-banei-detail-registry-activation.mjs',
  "console.log('PROFILE_STATUS: provisional');",
  "console.log('PROFILE_STATUS: active');",
  'detail activation summary profile marker',
);

replaceRequired(
  'docs/calendar/banei-detail-registry-activation.md',
  `The Banei Registry profile remains:\n\n\`\`\`text\nprofile_status: provisional\nprimary_runner: reviewed_import\nfallback_runner: null\n\`\`\``,
  `The Banei Registry profile is now:\n\n\`\`\`text\nprofile_status: active\nprimary_runner: github_actions\nfallback_runner: reviewed_import\n\`\`\``,
  'detail activation docs profile block',
);

replaceRequired(
  'docs/calendar/banei-detail-registry-activation.md',
  `## Why the profile remains provisional\n\nOne successful GitHub Actions detail run does not by itself prove a unified system-level runner policy.\n\nThe current Banei system has two operational histories:\n\n\`\`\`text\nschedule foundation: reviewed_import / dry-run lineage\ndetail live evidence: github_actions execution environment\n\`\`\`\n\nThe Registry has one system-level primary runner and fallback runner pair.\n\nTherefore this activation does not silently switch the whole Banei system to GitHub Actions.\n\nThe profile remains provisional with:\n\n\`\`\`text\nprimary_runner: reviewed_import\npending_fields: fallback_runner\n\`\`\`\n\nA later runner-policy PR must test schedule and detail acquisition under the proposed shared runner policy before changing this boundary.`,
  `## Runner convergence update\n\nThe original detail activation proved one bounded GitHub Actions date-window detail run but did not yet prove a unified system-level runner policy. That boundary has now been superseded by permanent runner convergence evidence.\n\nThe same GitHub Actions execution environment has successfully completed:\n\n\`\`\`text\n2026 July full-month Banei schedule collection\none bounded date-window A+ detail collection\none bounded selected-meeting A+ detail collection\n\`\`\`\n\nThe Registry therefore now uses GitHub Actions as the primary runner and reviewed import as the fallback. This does not activate automatic Due-job planning or rank-upgrade retry.`,
  'detail activation docs runner convergence section',
);

replaceRequired(
  'docs/calendar/banei-detail-registry-activation.md',
  `This activation does not enable:\n\n\`\`\`text\ncross-month window\nselected meetings\nsource-visible horizon\nrank-upgrade retry\nscheduled due-job execution\nunattended publication\n\`\`\``,
  `This activation does not enable:\n\n\`\`\`text\ncross-month window\nsource-visible horizon\nrank-upgrade retry\nscheduled due-job execution\nunattended publication\n\`\`\``,
  'detail activation docs disabled capability list',
);

replaceRequired(
  'docs/calendar/banei-detail-registry-activation.md',
  `supports_cross_month_window: false\nsupports_selected_meetings: false\nsupports_source_visible_horizon: false\nsupports_rank_upgrade_retry: false`,
  `supports_cross_month_window: false\nsupports_selected_meetings: true\nsupports_source_visible_horizon: false\nsupports_rank_upgrade_retry: false`,
  'detail activation docs Registry capability block',
);

replaceRequired(
  'docs/calendar/banei-detail-registry-activation.md',
  `## Why selected-meeting support remains disabled\n\nThe collector code accepts selected meeting IDs, but the bounded live evidence run exercised date-window mode only.\n\nCode-path existence is not sufficient evidence for Registry activation.\n\nSelected-meeting activation requires its own bounded execution proof.`,
  `## Selected-meeting support update\n\nSelected-meeting support is now enabled because a bounded live GitHub Actions run successfully executed one reviewed meeting ID, produced one complete A+ candidate with 12 public-safe race rows, and recorded source_window_complete coverage with zero unresolved meetings, zero source errors, and zero blockers.`,
  'detail activation docs selected support section',
);

replaceRequired(
  'docs/calendar/banei-detail-registry-activation.md',
  `- profile remains provisional;\n- primary runner remains reviewed_import;\n- fallback runner remains pending;\n- selected-meeting support remains false;`,
  `- profile is active;\n- primary runner is github_actions;\n- fallback runner is reviewed_import;\n- selected-meeting support is true;`,
  'detail activation docs completion profile bullets',
);

replaceRequired(
  'docs/calendar/banei-detail-registry-activation.md',
  `The next Banei step is runner-policy convergence and selected-meeting execution proof.\n\nThat work should separately test:\n\n1. Banei schedule acquisition under a candidate automated runner;\n2. Banei detail date-window acquisition under the same runner;\n3. selected-meeting execution on one known reviewed meeting;\n4. shared Result Manifest and Review Queue normalization for the live detail batch;\n5. failure behavior and fallback policy.\n\nOnly after that evidence should the profile become active or rank-upgrade retry be enabled.`,
  `Runner-policy convergence and selected-meeting execution proof are complete.\n\nThe next Banei step is retry execution proof covering:\n\n1. explicit Retry Queue entry handling;\n2. due versus deferred backoff behavior;\n3. attempt-count increment;\n4. selected-meeting Job generation from retry state;\n5. one successful retry and one failure-isolated case;\n6. Result Manifest and Review Queue behavior after retry.\n\nOnly after that evidence should rank-upgrade retry or Banei Due-job retry policy be enabled.`,
  'detail activation docs next handoff',
);

console.log('BANEI_BRIDGE_POST_RUNNER_UPDATED');
