import fs from 'node:fs';

function replaceRequired(file, from, to, label) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(from)) throw new Error(`${label}: required marker not found`);
  fs.writeFileSync(file, text.replace(from, to));
}

replaceRequired(
  'scripts/timetable/operations-v2.mjs',
  `function sourceStateFor(sourceStates, systemId) {\n  return sourceStates?.find((state) => state.system_id === systemId) ?? null;\n}\n\nfunction publicationStateFor`,
  `function sourceStateFor(sourceStates, systemId) {\n  return sourceStates?.find((state) => state.system_id === systemId) ?? null;\n}\n\nfunction retryPolicyFor(duePolicy, systemId) {\n  return duePolicy?.system_rules?.find((rule) => rule.system_id === systemId)?.rank_retry ?? null;\n}\n\nfunction retryOperationalState(entries, generatedAt, attemptLimit) {\n  let dueCount = 0;\n  let deferredCount = 0;\n  let attemptedCount = 0;\n  let attemptLimitReachedCount = 0;\n  const deferredTimes = [];\n  for (const entry of entries) {\n    const due = entry.next_eligible_retry_at === null || Date.parse(entry.next_eligible_retry_at) <= Date.parse(generatedAt);\n    if (due) dueCount += 1;\n    else {\n      deferredCount += 1;\n      deferredTimes.push(entry.next_eligible_retry_at);\n    }\n    if (entry.attempt_count > 0) attemptedCount += 1;\n    if (attemptLimit > 0 && entry.attempt_count >= attemptLimit) attemptLimitReachedCount += 1;\n  }\n  deferredTimes.sort();\n  return {\n    entry_count: entries.length,\n    due_count: dueCount,\n    deferred_count: deferredCount,\n    attempted_count: attemptedCount,\n    attempt_limit_reached_count: attemptLimitReachedCount,\n    next_eligible_at: deferredTimes[0] ?? null,\n    attempt_limit: attemptLimit,\n  };\n}\n\nfunction publicationStateFor`,
  'retry state helpers',
);

replaceRequired(
  'scripts/timetable/operations-v2.mjs',
  `function attentionFor({ sourceHealth, freshnessAge, freshnessThreshold, jobCounts, reviewReady, retryDue, promotionReady, publicationState }) {`,
  `function attentionFor({ sourceHealth, freshnessAge, freshnessThreshold, jobCounts, reviewReady, retryDue, retryDeferred, promotionReady, publicationState }) {`,
  'attention signature',
);
replaceRequired(
  'scripts/timetable/operations-v2.mjs',
  `  if (retryDue > 0) attention.push('retry_due');\n  if (promotionReady > 0) attention.push('promotion_ready');`,
  `  if (retryDue > 0) attention.push('retry_due');\n  if (retryDeferred > 0) attention.push('retry_backoff');\n  if (promotionReady > 0) attention.push('promotion_ready');`,
  'retry backoff attention',
);

replaceRequired(
  'scripts/timetable/operations-v2.mjs',
  `  const retryReasonCounts = {};\n  let retryDue = 0;\n  let retryDeferred = 0;\n  for (const entry of retryQueue.entries) {\n    retryReasonCounts[entry.retry_reason] = (retryReasonCounts[entry.retry_reason] ?? 0) + 1;\n    if (entry.next_eligible_retry_at === null || Date.parse(entry.next_eligible_retry_at) <= Date.parse(generatedAt)) retryDue += 1;\n    else retryDeferred += 1;\n  }`,
  `  const retryReasonCounts = {};\n  let retryDue = 0;\n  let retryDeferred = 0;\n  let retryAttempted = 0;\n  let retryAttemptLimitReached = 0;\n  const retryDeferredTimes = [];\n  for (const entry of retryQueue.entries) {\n    retryReasonCounts[entry.retry_reason] = (retryReasonCounts[entry.retry_reason] ?? 0) + 1;\n    if (entry.next_eligible_retry_at === null || Date.parse(entry.next_eligible_retry_at) <= Date.parse(generatedAt)) retryDue += 1;\n    else {\n      retryDeferred += 1;\n      retryDeferredTimes.push(entry.next_eligible_retry_at);\n    }\n    if (entry.attempt_count > 0) retryAttempted += 1;\n    const limit = retryPolicyFor(duePolicy, entry.system_id)?.max_attempt_count ?? 0;\n    if (limit > 0 && entry.attempt_count >= limit) retryAttemptLimitReached += 1;\n  }\n  retryDeferredTimes.sort();`,
  'global retry operational accounting',
);

replaceRequired(
  'scripts/timetable/operations-v2.mjs',
  `    const systemRetryDue = systemRetryEntries.filter((entry) => entry.next_eligible_retry_at === null || Date.parse(entry.next_eligible_retry_at) <= Date.parse(generatedAt)).length;\n    const publicationState = publicationStateFor`,
  `    const retryPolicy = retryPolicyFor(duePolicy, profile.system_id);\n    const systemRetryState = retryOperationalState(systemRetryEntries, generatedAt, retryPolicy?.max_attempt_count ?? 0);\n    const systemRetryDue = systemRetryState.due_count;\n    const publicationState = publicationStateFor`,
  'system retry state build',
);
replaceRequired(
  'scripts/timetable/operations-v2.mjs',
  `      review_ready_count: systemReviewReady,\n      retry_due_count: systemRetryDue,\n      rank_distribution: systemRanks,`,
  `      review_ready_count: systemReviewReady,\n      retry_entry_count: systemRetryState.entry_count,\n      retry_due_count: systemRetryState.due_count,\n      retry_deferred_count: systemRetryState.deferred_count,\n      retry_attempted_count: systemRetryState.attempted_count,\n      retry_attempt_limit_reached_count: systemRetryState.attempt_limit_reached_count,\n      retry_next_eligible_at: systemRetryState.next_eligible_at,\n      retry_attempt_limit: systemRetryState.attempt_limit,\n      rank_distribution: systemRanks,`,
  'system retry fields',
);
replaceRequired(
  'scripts/timetable/operations-v2.mjs',
  `        retryDue: systemRetryDue,\n        promotionReady:`,
  `        retryDue: systemRetryDue,\n        retryDeferred: systemRetryState.deferred_count,\n        promotionReady:`,
  'attention retry deferred input',
);
replaceRequired(
  'scripts/timetable/operations-v2.mjs',
  `      deferred_count: retryDeferred,\n      by_reason:`,
  `      deferred_count: retryDeferred,\n      attempted_entry_count: retryAttempted,\n      attempt_limit_reached_count: retryAttemptLimitReached,\n      next_deferred_eligible_at: retryDeferredTimes[0] ?? null,\n      by_reason:`,
  'global retry summary fields',
);

replaceRequired(
  'scripts/timetable/operations-v2.mjs',
  `  const publication = output.publication_summary;`,
  `  const retry = output.retry_summary;\n  for (const key of ['entry_count', 'due_now_count', 'deferred_count', 'attempted_entry_count', 'attempt_limit_reached_count']) {\n    if (!Number.isInteger(retry?.[key]) || retry[key] < 0) errors.push(\`retry summary \${key} invalid\`);\n  }\n  if (retry?.next_deferred_eligible_at !== null && !validDateTime(retry?.next_deferred_eligible_at)) errors.push('retry summary next deferred eligible time invalid');\n  const publication = output.publication_summary;`,
  'retry summary validation',
);
replaceRequired(
  'scripts/timetable/operations-v2.mjs',
  `      if (!SOURCE_HEALTH.includes(row.source_health)) errors.push(\`systems[\${index}] source health invalid\`);\n      if (!PUBLICATION_STATES.includes(row.publication_state))`,
  `      if (!SOURCE_HEALTH.includes(row.source_health)) errors.push(\`systems[\${index}] source health invalid\`);\n      for (const key of ['retry_entry_count', 'retry_due_count', 'retry_deferred_count', 'retry_attempted_count', 'retry_attempt_limit_reached_count', 'retry_attempt_limit']) {\n        if (!Number.isInteger(row[key]) || row[key] < 0) errors.push(\`systems[\${index}] \${key} invalid\`);\n      }\n      if (row.retry_due_count + row.retry_deferred_count !== row.retry_entry_count) errors.push(\`systems[\${index}] retry due/deferred counts do not close\`);\n      if (row.retry_next_eligible_at !== null && !validDateTime(row.retry_next_eligible_at)) errors.push(\`systems[\${index}] retry next eligible time invalid\`);\n      if (!PUBLICATION_STATES.includes(row.publication_state))`,
  'system retry validation',
);

const schemaPath = 'data/static/calendar-operations-v2.schema.json';
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
schema.$defs.retrySummary.required = ['entry_count', 'due_now_count', 'deferred_count', 'attempted_entry_count', 'attempt_limit_reached_count', 'next_deferred_eligible_at', 'by_reason'];
schema.$defs.retrySummary.properties.attempted_entry_count = { type: 'integer', minimum: 0 };
schema.$defs.retrySummary.properties.attempt_limit_reached_count = { type: 'integer', minimum: 0 };
schema.$defs.retrySummary.properties.next_deferred_eligible_at = { oneOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }] };
const systemRequired = schema.$defs.systemRow.required;
const retryFields = ['retry_entry_count', 'retry_deferred_count', 'retry_attempted_count', 'retry_attempt_limit_reached_count', 'retry_next_eligible_at', 'retry_attempt_limit'];
const retryDueIndex = systemRequired.indexOf('retry_due_count');
systemRequired.splice(retryDueIndex, 0, 'retry_entry_count');
systemRequired.splice(retryDueIndex + 2, 0, 'retry_deferred_count', 'retry_attempted_count', 'retry_attempt_limit_reached_count', 'retry_next_eligible_at', 'retry_attempt_limit');
schema.$defs.systemRow.properties.retry_entry_count = { type: 'integer', minimum: 0 };
schema.$defs.systemRow.properties.retry_deferred_count = { type: 'integer', minimum: 0 };
schema.$defs.systemRow.properties.retry_attempted_count = { type: 'integer', minimum: 0 };
schema.$defs.systemRow.properties.retry_attempt_limit_reached_count = { type: 'integer', minimum: 0 };
schema.$defs.systemRow.properties.retry_next_eligible_at = { oneOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }] };
schema.$defs.systemRow.properties.retry_attempt_limit = { type: 'integer', minimum: 0 };
schema.$defs.systemRow.properties.operator_attention.items.enum.splice(schema.$defs.systemRow.properties.operator_attention.items.enum.indexOf('promotion_ready'), 0, 'retry_backoff');
fs.writeFileSync(schemaPath, `${JSON.stringify(schema, null, 2)}\n`);

const fixturePath = 'data/fixtures/calendar-operations-v2-fixtures-v1.json';
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
fixture.expected.retry_attempted_count = 3;
fixture.expected.retry_attempt_limit_reached_count = 0;
fixture.expected.retry_next_deferred_eligible_at = '2026-07-10T00:00:00Z';
fixture.expected.system_retry_state = {
  'japan-jra-system': { entry_count: 0, due_count: 0, deferred_count: 0, attempted_count: 0, attempt_limit_reached_count: 0, next_eligible_at: null, attempt_limit: 0 },
  'japan-nar-system': { entry_count: 3, due_count: 2, deferred_count: 1, attempted_count: 2, attempt_limit_reached_count: 0, next_eligible_at: '2026-07-10T00:00:00Z', attempt_limit: 4 },
  'hong-kong-hkjc-system': { entry_count: 0, due_count: 0, deferred_count: 0, attempted_count: 0, attempt_limit_reached_count: 0, next_eligible_at: null, attempt_limit: 0 },
  'japan-banei-system': { entry_count: 2, due_count: 2, deferred_count: 0, attempted_count: 1, attempt_limit_reached_count: 0, next_eligible_at: null, attempt_limit: 3 },
};
fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);

replaceRequired(
  'scripts/check-calendar-operations-v2.mjs',
  `  if (output.retry_summary.entry_count !== expected.retry_entry_count\n    || output.retry_summary.due_now_count !== expected.retry_due_count\n    || output.retry_summary.deferred_count !== expected.retry_deferred_count) fail('Retry Queue counts differ.');`,
  `  if (output.retry_summary.entry_count !== expected.retry_entry_count\n    || output.retry_summary.due_now_count !== expected.retry_due_count\n    || output.retry_summary.deferred_count !== expected.retry_deferred_count) fail('Retry Queue counts differ.');\n  if (output.retry_summary.attempted_entry_count !== expected.retry_attempted_count) fail('Retry attempted count differs.');\n  if (output.retry_summary.attempt_limit_reached_count !== expected.retry_attempt_limit_reached_count) fail('Retry attempt-limit count differs.');\n  if (output.retry_summary.next_deferred_eligible_at !== expected.retry_next_deferred_eligible_at) fail('Retry next deferred eligible time differs.');`,
  'Operations checker global retry state',
);
replaceRequired(
  'scripts/check-calendar-operations-v2.mjs',
  `  const jra = bySystem.get('japan-jra-system');`,
  `  for (const [systemId, expectedRetry] of Object.entries(expected.system_retry_state)) {\n    const row = bySystem.get(systemId);\n    if (!row) continue;\n    const actual = {\n      entry_count: row.retry_entry_count,\n      due_count: row.retry_due_count,\n      deferred_count: row.retry_deferred_count,\n      attempted_count: row.retry_attempted_count,\n      attempt_limit_reached_count: row.retry_attempt_limit_reached_count,\n      next_eligible_at: row.retry_next_eligible_at,\n      attempt_limit: row.retry_attempt_limit,\n    };\n    if (!exact(actual, expectedRetry)) fail(\`\${systemId} retry operational state differs: \${JSON.stringify(actual)}\`);\n  }\n\n  const jra = bySystem.get('japan-jra-system');`,
  'Operations checker system retry state',
);
replaceRequired(
  'scripts/check-calendar-operations-v2.mjs',
  `    for (const attention of ['freshness', 'running_work', 'partial_result', 'review_queue', 'retry_due', 'publication_stale']) {`,
  `    for (const attention of ['freshness', 'running_work', 'partial_result', 'review_queue', 'retry_due', 'retry_backoff', 'publication_stale']) {`,
  'NAR retry backoff attention',
);
replaceRequired(
  'scripts/check-calendar-operations-v2.mjs',
  `  'Retry Queue',\n  'rank distributions',`,
  `  'Retry Queue',\n  'due versus deferred',\n  'attempt count',\n  'next eligible',\n  'retry backoff',\n  'rank distributions',`,
  'Operations docs retry markers',
);
replaceRequired(
  'scripts/check-calendar-operations-v2.mjs',
  `console.log('REVIEW_RETRY_RANK_AGGREGATION: pass');`,
  `console.log('REVIEW_RETRY_RANK_AGGREGATION: pass');\nconsole.log('RETRY_ATTEMPT_BACKOFF_STATE: pass');`,
  'Operations checker summary',
);

replaceRequired(
  'docs/calendar/operations-v2.md',
  `## Retry Queue summary`,
  `## Retry operational state\n\nOperations v2 exposes retry Queue state without executing retry Jobs. The operator view distinguishes due versus deferred entries and surfaces attempt count state, next eligible retry time, configured attempt limit, and retry backoff attention. These fields are read-only summaries derived from Retry Queue and Due-job policy inputs.\n\nPer-system rows expose:\n\n\`\`\`text\nretry_entry_count\nretry_due_count\nretry_deferred_count\nretry_attempted_count\nretry_attempt_limit_reached_count\nretry_next_eligible_at\nretry_attempt_limit\n\`\`\`\n\nA system with deferred retry work receives `retry_backoff` operator attention. A system with due work receives `retry_due`. The view does not mutate Queue state, increment attempt count, change next eligible time, or execute a Job.\n\n## Retry Queue summary`,
  'Operations docs retry operational section',
);

console.log('OPERATIONS_V2_RETRY_STATE_UPDATED');
