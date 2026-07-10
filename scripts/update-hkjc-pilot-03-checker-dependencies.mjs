import fs from 'node:fs';

function replaceRequired(file, from, to, label) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(from)) throw new Error(`${label}: marker missing`);
  fs.writeFileSync(file, text.replace(from, to));
}

replaceRequired(
  'scripts/check-calendar-acquisition-registry.mjs',
  `  ['hong-kong-hkjc-dry-run-adapter', { path: 'data/candidates/hong-kong-hkjc-candidates.json', marker: '"source_adapter_id": "hong-kong-hkjc-dry-run-adapter"' }],`,
  `  ['hong-kong-hkjc-dry-run-adapter', { path: 'data/candidates/hong-kong-hkjc-candidates.json', marker: '"source_adapter_id": "hong-kong-hkjc-dry-run-adapter"' }],\n  ['hkjc-fixture-artifact-bridge-v1', { path: 'scripts/timetable/hkjc-fixture-artifact-bridge-core.mjs', marker: "const ADAPTER_ID = 'hkjc-fixture-artifact-bridge-v1'" }],`,
  'Acquisition Registry HKJC adapter evidence',
);

replaceRequired(
  'scripts/check-calendar-hkjc-pilot-reconciliation.mjs',
  `  for (const key of ['system_id', 'profile_status', 'primary_runner', 'fallback_runner', 'schedule_source_id', 'detail_source_id', 'schedule_adapter_id', 'detail_adapter_id', 'public_ceiling']) {\n    if (profile[key] !== expected[key]) fail(\`Registry audit mismatch for \${key}: \${profile[key]} != \${expected[key]}\`);\n  }`,
  `  for (const key of ['system_id', 'profile_status', 'primary_runner', 'fallback_runner', 'schedule_source_id', 'detail_source_id', 'detail_adapter_id', 'public_ceiling']) {\n    if (profile[key] !== expected[key]) fail(\`Registry audit mismatch for \${key}: \${profile[key]} != \${expected[key]}\`);\n  }\n  if (profile.schedule_adapter_id !== 'hkjc-fixture-artifact-bridge-v1') fail('current HKJC schedule adapter must point to PILOT-02 artifact bridge.');`,
  'HKJC reconciliation current Registry adapter progression',
);

console.log('HKJC_PILOT_03_CHECKER_DEPENDENCIES_UPDATED');
