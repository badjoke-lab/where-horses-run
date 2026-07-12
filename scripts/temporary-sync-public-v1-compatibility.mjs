import fs from 'node:fs';

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function replaceRequired(file, before, after) {
  const current = fs.readFileSync(file, 'utf8');
  if (!current.includes(before)) throw new Error(`${file}: required synchronization anchor missing`);
  fs.writeFileSync(file, current.replace(before, after));
}

const operationsFixturesPath = 'data/fixtures/calendar-operations-v2-fixtures-v1.json';
const operationsFixtures = readJson(operationsFixturesPath);
if (operationsFixtures.expected?.system_count !== 4) {
  throw new Error(`unexpected Operations v2 fixture system_count ${operationsFixtures.expected?.system_count}`);
}
operationsFixtures.expected.system_count = 5;
writeJson(operationsFixturesPath, operationsFixtures);

const readinessCheckerPath = 'scripts/check-calendar-readiness-backfill-37-52.mjs';
replaceRequired(
  readinessCheckerPath,
  "const expected = { malaysia:1, thailand:1, philippines:1, mauritius:1, argentina:1, germany:1, italy:2, spain:1, norway:2, finland:1, netherlands:1, switzerland:2, poland:1, romania:1, serbia:1, slovakia:1 };\n",
  "const expected = { malaysia:1, thailand:1, philippines:1, mauritius:1, argentina:1, germany:1, italy:2, spain:1, norway:2, finland:1, netherlands:1, switzerland:2, poland:1, romania:1, serbia:1, slovakia:1 };\nconst postBackfillTransitionIds = new Set([\n  'united-arab-emirates--uae-national-racing-system--era-season-calendar',\n]);\n",
);
replaceRequired(
  readinessCheckerPath,
  "const baselineRecords = (registry.records ?? []).filter((record) => first52Countries.has(record.country_id));\nif (baselineRecords.length !== 70) fail(`entries 01-52 must retain 70 readiness records; found ${baselineRecords.length}`);\nconst baselineCounts = countBy(baselineRecords);\nif (baselineCounts.prototype_ready !== 35 || baselineCounts.manual_ready !== 27 || baselineCounts.blocked !== 4 || baselineCounts.link_only !== 4) fail('entries 01-52 readiness mix is invalid');\n",
  "const baselineRecords = (registry.records ?? []).filter((record) => first52Countries.has(record.country_id));\nif (baselineRecords.length !== 70) fail(`entries 01-52 must retain 70 readiness records including reviewed transitions; found ${baselineRecords.length}`);\nconst historicalBaselineRecords = baselineRecords.map((record) => postBackfillTransitionIds.has(record.readiness_id)\n  ? { ...record, readiness: 'manual_ready' }\n  : record);\nconst baselineCounts = countBy(historicalBaselineRecords);\nif (baselineCounts.prototype_ready !== 35 || baselineCounts.manual_ready !== 27 || baselineCounts.blocked !== 4 || baselineCounts.link_only !== 4) fail('historical entries 01-52 readiness mix is invalid');\n\nconst uaeTransition = (registry.records ?? []).find((record) => postBackfillTransitionIds.has(record.readiness_id));\nif (!uaeTransition) fail('UAE source-pilot transition readiness record is missing');\nelse {\n  if (uaeTransition.country_tracker_delivery_no !== '01') fail('UAE transition delivery number differs');\n  if (uaeTransition.readiness !== 'prototype_ready') fail('UAE transition readiness differs');\n  if (uaeTransition.implementation_status !== 'fixture_validated') fail('UAE transition implementation status differs');\n  if ((uaeTransition.racecourse_ids ?? []).length !== 5) fail('UAE transition must retain five approved racecourse IDs');\n}\n",
);

console.log('PUBLIC_V1_COMPATIBILITY_SYNC: applied');
console.log('OPERATIONS_V2_SYSTEM_COUNT: 5');
console.log('HISTORICAL_BACKFILL_COUNT: 70');
console.log('POST_BACKFILL_TRANSITION_COUNT: 1');
