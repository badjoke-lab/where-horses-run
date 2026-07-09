import fs from 'node:fs';

function replaceRequired(file, from, to, label) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(from)) throw new Error(`${label}: required marker not found`);
  fs.writeFileSync(file, text.replace(from, to));
}

replaceRequired(
  'data/fixtures/calendar-collection-job-invalid-cases-v1.json',
  `    {\n      "case_id": "banei-date-window-unsupported",\n      "job": {\n        "schema_version": "calendar-collection-job-v1",\n        "job_id": "invalid-banei-window-001",\n        "campaign_id": "invalid-fixtures",\n        "system_id": "japan-banei-system",\n        "runner_policy": {\n          "mode": "registry_primary",\n          "runner": null\n        },\n        "collection_mode": "date_window",\n        "requested_scope": {\n          "start_date": "2026-08-01",\n          "end_date_exclusive": "2026-09-01",\n          "timezone": "Asia/Tokyo"\n        },\n        "rank_strategy": "best_available",\n        "target_rank": null,\n        "reason": "regular_refresh",\n        "requested_at": "2026-07-08T05:00:00Z"\n      }\n    },`,
  `    {\n      "case_id": "banei-selected-meetings-unsupported",\n      "job": {\n        "schema_version": "calendar-collection-job-v1",\n        "job_id": "invalid-banei-selected-001",\n        "campaign_id": "invalid-fixtures",\n        "system_id": "japan-banei-system",\n        "runner_policy": {\n          "mode": "registry_primary",\n          "runner": null\n        },\n        "collection_mode": "selected_meetings",\n        "requested_scope": {\n          "meeting_ids": [\n            "banei-obihiro-racecourse-2026-07-04"\n          ]\n        },\n        "rank_strategy": "best_available",\n        "target_rank": null,\n        "reason": "coverage_gap",\n        "requested_at": "2026-07-08T05:00:00Z"\n      }\n    },`,
  'Banei invalid Collection Job case',
);

replaceRequired(
  'scripts/check-calendar-collection-job.mjs',
  "'banei-date-window-unsupported',",
  "'banei-selected-meetings-unsupported',",
  'Collection Job required invalid case',
);

console.log('BANEI_COLLECTION_JOB_FIXTURE_ACTIVATION_UPDATED');
