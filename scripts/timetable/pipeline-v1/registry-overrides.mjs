function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function clone(value) {
  return structuredClone(value);
}

function uniqueBy(items, keyOf, label) {
  const seen = new Set();
  for (const item of items) {
    const key = keyOf(item);
    assert(typeof key === 'string' && key, `${label} has an empty key`);
    assert(!seen.has(key), `${label} has duplicate key ${key}`);
    seen.add(key);
  }
}

export function resolveCalendarReadinessRegistry(baseRegistry, japanOverride, runtimeControl) {
  assert(baseRegistry?.schema_version === 'calendar-readiness-registry-v1', 'base Calendar Readiness registry schema is invalid');
  assert(Array.isArray(baseRegistry.records), 'base Calendar Readiness records must be an array');
  assert(japanOverride?.schema_version === 'japan-calendar-readiness-v2', 'Japan Calendar Readiness override schema is invalid');
  assert(Array.isArray(japanOverride.records), 'Japan Calendar Readiness override records must be an array');
  assert(runtimeControl?.schema_version === 'japan-a-plus-runtime-control-v1', 'Japan A+ runtime control schema is invalid');
  assert(Array.isArray(runtimeControl.records), 'Japan A+ runtime control records must be an array');
  uniqueBy(japanOverride.records, (record) => record.authority_source_key, 'Japan Calendar Readiness override');
  uniqueBy(runtimeControl.records, (record) => record.system_id, 'Japan A+ runtime control');

  const resolved = clone(baseRegistry);
  for (const override of japanOverride.records) {
    const matches = resolved.records.filter((record) =>
      record.authority_source_key === override.authority_source_key && record.system_id === override.system_id
    );
    assert(matches.length === 1, `Japan Calendar Readiness override expected one base record for ${override.authority_source_key}, found ${matches.length}`);
    const runtimeMatches = runtimeControl.records.filter((record) => record.system_id === override.system_id);
    assert(runtimeMatches.length === 1, `Japan A+ runtime control expected one record for ${override.system_id}, found ${runtimeMatches.length}`);
    const runtime = runtimeMatches[0];
    const index = resolved.records.indexOf(matches[0]);
    resolved.records[index] = {
      ...matches[0],
      technical_rank: override.technical_rank,
      public_ceiling: override.public_ceiling,
      confirmed_fields: {
        ...matches[0].confirmed_fields,
        ...(runtime.confirmed_fields ?? {})
      },
      readiness: override.readiness,
      implementation_status: override.implementation_status,
      automation_mode: override.automation_mode,
      fallback: override.fallback,
      public_projection_activation: runtime.public_projection_activation,
      evidence_reviewed_at: japanOverride.approved_at,
      notes: `${matches[0].notes} Superseded for active resolution by ${japanOverride.schema_version}.`
    };
  }
  return resolved;
}

export function resolveAuthoritySourceInventory(baseInventory, japanOverride) {
  assert(baseInventory?.schema_version === 'authority-source-inventory-v1', 'base Authority/Source inventory schema is invalid');
  assert(Array.isArray(baseInventory.records), 'base Authority/Source records must be an array');
  assert(japanOverride?.schema_version === 'authority-source-inventory-japan-v2', 'Japan Authority/Source override schema is invalid');
  assert(Array.isArray(japanOverride.records), 'Japan Authority/Source override records must be an array');
  uniqueBy(japanOverride.records, (record) => record.authority_source_key, 'Japan Authority/Source override');

  const resolved = clone(baseInventory);
  for (const override of japanOverride.records) {
    const matches = resolved.records.filter((record) =>
      `${record.country_id}/${record.authority_id}/${record.official_source_id}` === override.authority_source_key
    );
    assert(matches.length === 1, `Japan Authority/Source override expected one base record for ${override.authority_source_key}, found ${matches.length}`);
    const index = resolved.records.indexOf(matches[0]);
    resolved.records[index] = {
      ...matches[0],
      capability_rank: override.capability_rank,
      source_status: override.source_status,
      adapter_candidate_status: override.adapter_candidate_status,
      notes: override.notes
    };
  }
  return resolved;
}
