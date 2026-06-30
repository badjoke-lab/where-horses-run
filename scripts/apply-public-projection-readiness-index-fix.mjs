import { readFileSync, writeFileSync } from 'node:fs';

const file = 'scripts/timetable/pipeline-v1/public-projection-core.mjs';
let text = readFileSync(file, 'utf8');

const oldIndex = `function buildReadinessIndex(readinessRegistry) {
  assert(readinessRegistry?.schema_version === 'calendar-readiness-registry-v1', 'Calendar Readiness registry schema is invalid');
  assert(Array.isArray(readinessRegistry.records), 'Calendar Readiness records must be an array');
  const index = new Map();
  for (const record of readinessRegistry.records) {
    assert(typeof record.authority_source_key === 'string' && record.authority_source_key, \`readiness \${record.readiness_id ?? 'unknown'} has no authority_source_key\`);
    assert(!index.has(record.authority_source_key), \`duplicate Calendar Readiness authority_source_key \${record.authority_source_key}\`);
    index.set(record.authority_source_key, record);
  }
  return index;
}`;

const newIndex = `function buildReadinessIndex(readinessRegistry) {
  assert(readinessRegistry?.schema_version === 'calendar-readiness-registry-v1', 'Calendar Readiness registry schema is invalid');
  assert(Array.isArray(readinessRegistry.records), 'Calendar Readiness records must be an array');
  const index = new Map();
  for (const record of readinessRegistry.records) {
    assert(typeof record.authority_source_key === 'string' && record.authority_source_key, \`readiness \${record.readiness_id ?? 'unknown'} has no authority_source_key\`);
    const records = index.get(record.authority_source_key) ?? [];
    records.push(record);
    index.set(record.authority_source_key, records);
  }
  return index;
}

function chooseReadiness(records, canonicalRecord, key) {
  assert(records.length > 0, \`\${canonicalRecord.meeting_id} has no Calendar Readiness record for \${key}\`);
  if (records.length === 1) return records[0];

  const racecourseMatches = records.filter((record) =>
    Array.isArray(record.racecourse_ids) && record.racecourse_ids.includes(canonicalRecord.racecourse_id)
  );
  if (racecourseMatches.length === 1) return racecourseMatches[0];

  const broadMatches = records.filter((record) =>
    ['countrywide', 'authority_wide'].includes(record.coverage_scope) &&
    (!Array.isArray(record.racecourse_ids) || record.racecourse_ids.length === 0 || record.racecourse_ids.includes(canonicalRecord.racecourse_id))
  );
  if (broadMatches.length === 1) return broadMatches[0];

  throw new Error(\`\${canonicalRecord.meeting_id} has ambiguous Calendar Readiness records for \${key}: \${records.map((record) => record.readiness_id).join(', ')}\`);
}`;

const oldResolve = `function resolveReadiness(record, readinessIndex, aliasIndex) {
  const sourceId = record.source_trace?.source_id;
  assert(typeof sourceId === 'string' && sourceId, \`\${record.meeting_id} has no canonical source ID\`);
  const directKey = \`\${record.country_id}/\${record.authority_id}/\${sourceId}\`;
  let readiness = readinessIndex.get(directKey);
  let canonicalSourceId = sourceId;
  let aliasId = null;

  if (!readiness) {
    const alias = aliasIndex.get(directKey);
    assert(alias, \`\${record.meeting_id} source \${directKey} has no Calendar Readiness record or reviewed alias\`);
    canonicalSourceId = alias.canonical_source_id;
    aliasId = alias.legacy_source_id;
    const canonicalKey = \`\${record.country_id}/\${record.authority_id}/\${canonicalSourceId}\`;
    readiness = readinessIndex.get(canonicalKey);
    assert(readiness, \`\${record.meeting_id} alias target \${canonicalKey} has no Calendar Readiness record\`);
  }

  return { readiness, canonicalSourceId, aliasId };
}`;

const newResolve = `function resolveReadiness(record, readinessIndex, aliasIndex) {
  const sourceId = record.source_trace?.source_id;
  assert(typeof sourceId === 'string' && sourceId, \`\${record.meeting_id} has no canonical source ID\`);
  const directKey = \`\${record.country_id}/\${record.authority_id}/\${sourceId}\`;
  let readinessKey = directKey;
  let readinessRecords = readinessIndex.get(directKey) ?? [];
  let canonicalSourceId = sourceId;
  let aliasId = null;

  if (readinessRecords.length === 0) {
    const alias = aliasIndex.get(directKey);
    assert(alias, \`\${record.meeting_id} source \${directKey} has no Calendar Readiness record or reviewed alias\`);
    canonicalSourceId = alias.canonical_source_id;
    aliasId = alias.legacy_source_id;
    readinessKey = \`\${record.country_id}/\${record.authority_id}/\${canonicalSourceId}\`;
    readinessRecords = readinessIndex.get(readinessKey) ?? [];
  }

  const readiness = chooseReadiness(readinessRecords, record, readinessKey);
  return { readiness, canonicalSourceId, aliasId };
}`;

for (const [oldText, newText, label] of [
  [oldIndex, newIndex, 'readiness index'],
  [oldResolve, newResolve, 'readiness resolver']
]) {
  if (!text.includes(oldText)) throw new Error(`missing ${label} replacement marker`);
  text = text.replace(oldText, newText);
}

writeFileSync(file, text);
console.log('PUBLIC_PROJECTION_READINESS_INDEX_FIX_APPLIED');
