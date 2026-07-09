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

console.log('BANEI_BRIDGE_POST_RUNNER_UPDATED');
