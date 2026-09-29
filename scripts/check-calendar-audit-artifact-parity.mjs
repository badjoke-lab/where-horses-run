import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflowPath='.github/workflows/calendar-unified-official-refresh.yml';
const auditBuilderPath='scripts/timetable/build-refresh-audit-summary.mjs';

const workflow=fs.readFileSync(workflowPath,'utf8');
const builder=fs.readFileSync(auditBuilderPath,'utf8');

const auxiliary=new Set([
  'banei-non-running.json',
  'japan-non-running.json',
  'nar-non-running.json',
  'reviewed-public-observations.json',
]);

const workflowArtifacts=[...new Set(
  [...workflow.matchAll(/--(?:[a-z-]*output|artifact)=\.calendar-unified\/([a-z0-9-]+\.json)/g)]
    .map((match)=>match[1])
    .filter((file)=>!auxiliary.has(file))
)].sort();

const auditArtifacts=[...new Set(
  [...builder.matchAll(/file:\s*'([^']+\.json)'/g)].map((match)=>match[1])
)].sort();

const missing=workflowArtifacts.filter((file)=>!auditArtifacts.includes(file));
const extra=auditArtifacts.filter((file)=>!workflowArtifacts.includes(file));

assert.deepEqual(
  missing,
  [],
  `production Calendar artifacts missing from downstream audit SYSTEMS: ${missing.join(', ')}`,
);
assert.deepEqual(
  extra,
  [],
  `downstream audit SYSTEMS entries not emitted by unified refresh: ${extra.join(', ')}`,
);

console.log(`CALENDAR_AUDIT_ARTIFACT_PARITY: pass workflow=${workflowArtifacts.length} audit=${auditArtifacts.length}`);
