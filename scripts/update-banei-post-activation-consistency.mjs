import fs from 'node:fs';

function replaceRequired(file, from, to, label) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(from)) throw new Error(`${label}: required marker not found`);
  fs.writeFileSync(file, text.replace(from, to));
}

replaceRequired(
  'scripts/timetable/banei-control-plane-bridge.mjs',
  "state: 'blocked_pending_detail_adapter_and_registry_support'",
  "state: 'blocked_pending_selected_meeting_runner_and_retry_execution_evidence'",
  'bridge retry state',
);

replaceRequired(
  'scripts/check-calendar-banei-control-plane-bridge.mjs',
  "if (output.retry_activation.state !== 'blocked_pending_detail_adapter_and_registry_support') fail('Retry activation state differs.');",
  "if (output.retry_activation.state !== 'blocked_pending_selected_meeting_runner_and_retry_execution_evidence') fail('Retry activation state differs.');",
  'bridge checker retry state',
);

replaceRequired(
  'scripts/check-calendar-banei-control-plane-bridge.mjs',
  "  if (baneiProfile.detail_adapter_id !== null) fail('Banei detail adapter must remain null until source-specific detail implementation exists.');\n  if (baneiProfile.supports_rank_upgrade_retry !== false) fail('Banei rank retry must remain disabled until Registry support is implemented.');",
  "  if (baneiProfile.detail_source_id !== 'nar-banei-race-list-deba-table') fail('Banei evidence-backed detail source differs.');\n  if (baneiProfile.detail_adapter_id !== 'banei-nar-race-list-detail-v1') fail('Banei evidence-backed detail adapter differs.');\n  if (baneiProfile.supports_date_window !== true) fail('Banei evidence-backed date-window support differs.');\n  if (baneiProfile.supports_selected_meetings !== false) fail('Banei selected-meeting support must remain disabled without live proof.');\n  if (baneiProfile.supports_rank_upgrade_retry !== false) fail('Banei rank retry must remain disabled until selected-meeting, runner, and retry execution evidence exists.');",
  'bridge checker Registry boundary',
);

replaceRequired(
  'docs/calendar/banei-control-plane-bridge.md',
  `The blocker is explicit:\n\n\`\`\`text\nblocked_pending_detail_adapter_and_registry_support\n\`\`\`\n\nReasons:\n\n1. the Registry has no Banei detail source ID;\n2. the Registry has no Banei detail adapter ID;\n3. rank-upgrade retry support is false;\n4. selected-meeting retry support is false;\n5. no source-specific Banei detail runner has yet been validated.`,
  `The current blocker is explicit:\n\n\`\`\`text\nblocked_pending_selected_meeting_runner_and_retry_execution_evidence\n\`\`\`\n\nThe detail source and A+ detail adapter are now evidence-backed and registered. Retry activation remains blocked because:\n\n1. selected-meeting execution has not been proven by bounded live evidence;\n2. system-level runner policy is not yet converged across schedule and detail paths;\n3. retry backoff and attempt accounting have not been executed for Banei;\n4. failure isolation and retry-specific Manifest semantics have not been proven;\n5. rank-upgrade retry support remains false in the Registry.`,
  'bridge retry reasons',
);

replaceRequired(
  'docs/calendar/banei-control-plane-bridge.md',
  'The next source-specific detail implementation may activate Retry Queue only after Registry capability is updated from evidence.',
  'Retry Queue activation may occur only after selected-meeting, runner-routing, and retry execution evidence is reviewed and the Registry capability is updated from that evidence.',
  'bridge retry handoff sentence',
);

replaceRequired(
  'docs/calendar/banei-control-plane-bridge.md',
  '- Retry Queue activation remains blocked until detail adapter and Registry support exist;',
  '- Retry Queue activation remains blocked until selected-meeting, runner-routing, and retry execution evidence exist;',
  'bridge completion retry bullet',
);

replaceRequired(
  'docs/calendar/banei-control-plane-bridge.md',
  `After the bridge, the next Banei source-specific step is detail-source implementation and arbitrary-window acquisition.\n\nThat work must establish actual evidence for:\n\n\`\`\`text\ndetail source identity\ndetail adapter identity\nrunner behavior\narbitrary date-window behavior\nselected-meeting behavior if supported\nBanei-specific timetable row semantics\nBanei-safe A+ summary fields\nretry capability\n\`\`\`\n\nOnly after that evidence exists may the Registry profile and Retry Queue capability be expanded.`,
  `The detail source, A+ adapter, and bounded date-window capability are now evidence-backed.\n\nThe next Banei source-specific step is runner-policy convergence and selected-meeting execution proof. That work must establish actual evidence for:\n\n\`\`\`text\nschedule acquisition runner behavior\ndetail acquisition runner behavior\nselected-meeting execution\nretry backoff and attempt accounting\nfailure isolation\nretry-specific Result Manifest semantics\nRetry Queue update behavior\n\`\`\`\n\nOnly after that evidence exists may selected-meeting and rank-upgrade retry capability be enabled.`,
  'bridge next handoff',
);

replaceRequired(
  'scripts/check-calendar-banei-detail-registry-activation.mjs',
  "'Due-job Planner Banei policy also remains disabled'",
  "'The Banei Due-job Planner system rule also remains disabled.'",
  'activation docs marker',
);

console.log('BANEI_POST_ACTIVATION_CONSISTENCY_UPDATED');
