import fs from 'node:fs';

function replaceRequired(file, from, to, label) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(from)) throw new Error(`${label}: required marker not found`);
  fs.writeFileSync(file, text.replace(from, to));
}

replaceRequired(
  'scripts/check-calendar-acquisition-registry.mjs',
  `    if (record.system_id === 'japan-nar-system') {\n      const scheduleAdapter = readText('scripts/timetable/normalize-nar-schedule-aware-month.mjs');\n      const actionsCore = readText('scripts/timetable/nar-incremental-v2-actions-core.mjs');\n      if (!scheduleAdapter.includes('--meeting-ids=') || !actionsCore.includes('selected_meetings')) push('NAR selected-meeting adapter evidence is missing');\n    } else push(\`selected-meeting adapter support is not evidenced for \${record.system_id}\`);`,
  `    if (record.system_id === 'japan-nar-system') {\n      const scheduleAdapter = readText('scripts/timetable/normalize-nar-schedule-aware-month.mjs');\n      const actionsCore = readText('scripts/timetable/nar-incremental-v2-actions-core.mjs');\n      if (!scheduleAdapter.includes('--meeting-ids=') || !actionsCore.includes('selected_meetings')) push('NAR selected-meeting adapter evidence is missing');\n    } else if (record.system_id === 'japan-banei-system') {\n      const selectedEvidence = readText('data/fixtures/calendar-banei-runner-selected-evidence-v1.json');\n      const detailCollector = readText('scripts/timetable/collect-banei-detail-window.mjs');\n      if (!selectedEvidence.includes('\\"scope_mode\\": \\"selected_meetings\\"')\n        || !selectedEvidence.includes('\\"selected_detail_live_success\\": true')\n        || !detailCollector.includes('--meeting-ids=')) {\n        push('Banei selected-meeting adapter evidence is missing');\n      }\n    } else push(\`selected-meeting adapter support is not evidenced for \${record.system_id}\`);`,
  'Registry selected-meeting evidence branch',
);

replaceRequired(
  'scripts/check-calendar-acquisition-registry.mjs',
  `if (baneiProfile?.profile_status !== 'provisional'\n  || baneiProfile?.primary_runner !== 'reviewed_import'\n  || baneiProfile?.detail_source_id !== 'nar-banei-race-list-deba-table'\n  || baneiProfile?.detail_adapter_id !== 'banei-nar-race-list-detail-v1'\n  || baneiProfile?.supports_date_window !== true\n  || baneiProfile?.supports_selected_meetings !== false\n  || baneiProfile?.supports_rank_upgrade_retry !== false) {\n  fail('Banei detail activation must preserve provisional reviewed_import routing, evidence-backed detail source/adapter, date-window support, and disabled selected/retry capability.');\n}`,
  `if (baneiProfile?.profile_status !== 'active'\n  || baneiProfile?.primary_runner !== 'github_actions'\n  || baneiProfile?.fallback_runner !== 'reviewed_import'\n  || baneiProfile?.detail_source_id !== 'nar-banei-race-list-deba-table'\n  || baneiProfile?.detail_adapter_id !== 'banei-nar-race-list-detail-v1'\n  || baneiProfile?.supports_date_window !== true\n  || baneiProfile?.supports_selected_meetings !== true\n  || baneiProfile?.supports_rank_upgrade_retry !== false) {\n  fail('Banei active runner profile must preserve GitHub Actions primary routing, reviewed-import fallback, evidence-backed detail source/adapter, date-window and selected support, and disabled rank retry.');\n}`,
  'Registry exact Banei profile boundary',
);

replaceRequired(
  'scripts/check-calendar-acquisition-registry.mjs',
  "console.log('BANEI_DETAIL_PROFILE: live-evidence-backed detail source/adapter / date-window enabled / selected+retry disabled');",
  "console.log('BANEI_RUNNER_PROFILE: github_actions primary / reviewed_import fallback / date-window+selected enabled / rank retry disabled');",
  'Registry Banei summary marker',
);

replaceRequired(
  'data/fixtures/calendar-collection-job-invalid-cases-v1.json',
  `    {\n      "case_id": "banei-selected-meetings-unsupported",\n      "job": {\n        "schema_version": "calendar-collection-job-v1",\n        "job_id": "invalid-banei-selected-001",\n        "campaign_id": "invalid-fixtures",\n        "system_id": "japan-banei-system",\n        "runner_policy": {\n          "mode": "registry_primary",\n          "runner": null\n        },\n        "collection_mode": "selected_meetings",\n        "requested_scope": {\n          "meeting_ids": [\n            "banei-obihiro-racecourse-2026-07-04"\n          ]\n        },\n        "rank_strategy": "best_available",\n        "target_rank": null,\n        "reason": "coverage_gap",\n        "requested_at": "2026-07-08T05:00:00Z"\n      }\n    },`,
  `    {\n      "case_id": "banei-source-visible-horizon-unsupported",\n      "job": {\n        "schema_version": "calendar-collection-job-v1",\n        "job_id": "invalid-banei-source-horizon-001",\n        "campaign_id": "invalid-fixtures",\n        "system_id": "japan-banei-system",\n        "runner_policy": {\n          "mode": "registry_primary",\n          "runner": null\n        },\n        "collection_mode": "source_visible_horizon",\n        "requested_scope": {\n          "start_date": "2026-07-01",\n          "end_date_exclusive": "2026-08-01",\n          "timezone": "Asia/Tokyo"\n        },\n        "rank_strategy": "best_available",\n        "target_rank": null,\n        "reason": "regular_refresh",\n        "requested_at": "2026-07-08T05:00:00Z"\n      }\n    },`,
  'Collection Job invalid Banei capability case',
);

replaceRequired(
  'scripts/check-calendar-collection-job.mjs',
  "'banei-selected-meetings-unsupported',",
  "'banei-source-visible-horizon-unsupported',",
  'Collection Job required invalid case',
);

replaceRequired(
  'data/fixtures/calendar-collection-plans-v1.json',
  `    {\n      "schema_version": "calendar-collection-plan-v1",\n      "plan_id": "rank-isolation-plan-001",`,
  `    {\n      "schema_version": "calendar-collection-plan-v1",\n      "plan_id": "banei-actions-window-selected-001",\n      "campaign_id": "banei-july-actions-validation",\n      "created_at": "2026-07-09T06:00:00Z",\n      "jobs": [\n        {\n          "schema_version": "calendar-collection-job-v1",\n          "job_id": "banei-july-actions-window-job-001",\n          "campaign_id": "banei-july-actions-validation",\n          "system_id": "japan-banei-system",\n          "runner_policy": { "mode": "registry_primary", "runner": null },\n          "collection_mode": "date_window",\n          "requested_scope": {\n            "start_date": "2026-07-04",\n            "end_date_exclusive": "2026-07-07",\n            "timezone": "Asia/Tokyo"\n          },\n          "rank_strategy": "best_available",\n          "target_rank": null,\n          "reason": "regular_refresh",\n          "requested_at": "2026-07-09T06:00:00Z"\n        },\n        {\n          "schema_version": "calendar-collection-job-v1",\n          "job_id": "banei-july-actions-selected-job-001",\n          "campaign_id": "banei-july-actions-validation",\n          "system_id": "japan-banei-system",\n          "runner_policy": { "mode": "registry_primary", "runner": null },\n          "collection_mode": "selected_meetings",\n          "requested_scope": {\n            "meeting_ids": [\n              "banei-obihiro-racecourse-2026-07-04"\n            ]\n          },\n          "rank_strategy": "best_available",\n          "target_rank": null,\n          "reason": "coverage_gap",\n          "requested_at": "2026-07-09T06:00:00Z"\n        }\n      ]\n    },\n    {\n      "schema_version": "calendar-collection-plan-v1",\n      "plan_id": "rank-isolation-plan-001",`,
  'Banei Actions plan insertion',
);

replaceRequired(
  'scripts/check-calendar-actions-multi-job.mjs',
  `const rankIsolation = compiled.get('rank-isolation-plan-001');`,
  `const baneiActions = compiled.get('banei-actions-window-selected-001');\nif (!baneiActions || baneiActions.jobs.length !== 2 || baneiActions.excluded.length !== 0) fail('Banei Actions Plan must compile two hosted Jobs.');\nconst baneiModes = (baneiActions?.jobs ?? []).map((entry) => entry.execution.collection_mode).sort();\nif (!exact(baneiModes, ['date_window', 'selected_meetings'])) fail('Banei Actions Plan must preserve date-window and selected-meeting modes.');\nif (!(baneiActions?.jobs ?? []).every((entry) => entry.execution.executor_id === 'banei-schedule-detail-actions')) fail('Banei hosted executor mapping differs.');\nif (new Set((baneiActions?.jobs ?? []).map((entry) => entry.batch_id)).size !== 2) fail('Banei hosted Jobs must have independent batch IDs.');\nif (!(baneiActions?.jobs ?? []).every((entry) => entry.execution.runner_used === 'github_actions')) fail('Banei hosted Jobs must resolve to GitHub Actions primary runner.');\n\nconst rankIsolation = compiled.get('rank-isolation-plan-001');`,
  'Actions multi-job Banei plan assertions',
);

replaceRequired(
  'scripts/check-calendar-actions-multi-job.mjs',
  "console.log(`NAR_HKJC_HOSTED_JOBS: ${eastAsia.jobs.length}`);",
  "console.log(`NAR_HKJC_HOSTED_JOBS: ${eastAsia.jobs.length}`);\nconsole.log(`BANEI_HOSTED_JOBS: ${baneiActions.jobs.length}`);",
  'Actions checker Banei summary',
);

console.log('BANEI_ACTIONS_EXECUTOR_INTEGRATION_UPDATED');
