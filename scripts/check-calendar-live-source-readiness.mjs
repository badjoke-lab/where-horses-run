import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadCalendarReadinessV1 } from './timetable/load-calendar-readiness.mjs';
import { loadAuthoritySourceInventoryV1 } from './timetable/load-authority-source-inventory.mjs';
import { buildPublicProjectionV1, reconcilePublicProjectionV1 } from './timetable/pipeline-v1/public-projection-core.mjs';
import { validatePublicationSnapshotPairV1 } from './timetable/calendar-authority-metadata.mjs';

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const canonicalMeetings = read('data/generated/timetable/canonical/meetings.json');
const canonicalDetails = read('data/generated/timetable/canonical/meeting-details.json');
const policyData = read('src/data/publicationDisplayPolicies.json');
const readinessRegistry = loadCalendarReadinessV1(process.cwd());
const sourceAliases = read('data/static/timetable-source-aliases-v1.json');
const inventory = loadAuthoritySourceInventoryV1(process.cwd());
const publicList = read('data/generated/timetable/public/meeting-list.json');
const publicDetails = read('data/generated/timetable/public/meeting-details.json');
const inputs = { canonicalMeetings, canonicalDetails, policyData, readinessRegistry, sourceAliases };
const before = JSON.stringify({ canonicalMeetings, canonicalDetails, publicList, publicDetails });
const readinessKeys = new Set(readinessRegistry.records.map((row) => row.authority_source_key));
const inventoryKeys = new Set(inventory.records.map((row) => `${row.country_id}/${row.authority_id}/${row.official_source_id}`));
const aliasKeys = new Set();
for (const alias of sourceAliases.aliases) {
  const prefix = `${alias.country_id}/${alias.authority_id}/`;
  const key = prefix + alias.legacy_source_id;
  assert(!aliasKeys.has(key), `duplicate alias ${key}`);
  aliasKeys.add(key);
  assert(readinessKeys.has(prefix + alias.canonical_source_id), `alias target lacks readiness: ${key}`);
  assert(inventoryKeys.has(prefix + alias.canonical_source_id), `alias target lacks registered authority/source: ${key}`);
  assert(alias.reason?.trim(), `alias has no review rationale: ${key}`);
}
// Validate the new records against the same bounded registry shape as the base.
const schema = read('data/static/calendar-readiness.schema.json');
for (const row of read('data/static/calendar-readiness-live-official-v1.json').records) {
  assert.deepEqual(Object.keys(row).sort(), [...schema.required_record_fields].sort());
  assert(inventoryKeys.has(row.authority_source_key));
  for (const [field, value] of Object.entries(row)) {
    if (schema[`${field}_enum`]) assert(schema[`${field}_enum`].includes(value), `${row.readiness_id}: ${field}`);
  }
  assert(Object.values(row.confirmed_fields).every((value) => typeof value === 'boolean'));
  assert(fs.existsSync(row.source_test_ref));
}

// Real committed canonical records cover every saved source, not just synthetic Wave 4 fixtures.
const projected = buildPublicProjectionV1(inputs);
assert.deepEqual(validatePublicationSnapshotPairV1(projected.meetingListDataset, projected.meetingDetailsDataset), []);
assert.deepEqual(buildPublicProjectionV1(inputs), projected, 'readiness projection must be deterministic');

const jra = canonicalMeetings.meetings.find((row) => row.meeting_id === 'jra-hanshin-racecourse-2026-09-21');
assert(jra, 'keep the incident fixture in canonical history');
assert.equal(jra.source_trace.source_id, 'jra-racing-calendar-programme');
const jraDecision = projected.audit.decisions.find((row) => row.meeting_id === jra.meeting_id);
assert.equal(jraDecision.canonical_source_id, 'jra-programme');
assert.equal(jraDecision.readiness_id, 'japan--japan-jra-system--jra-programme');
assert.equal(jraDecision.effective_public_rank, jra.capability_rank);
assert(jraDecision.include_in_public_list);

// Exercise every explicit binding, including producer identities absent from today's saved data.
for (const alias of sourceAliases.aliases) {
  const template = canonicalMeetings.meetings.find((row) => row.country_id === alias.country_id && row.authority_id === alias.authority_id);
  assert(template, `no canonical authority fixture for ${alias.legacy_source_id}`);
  const meeting = { ...template, source_trace: { ...template.source_trace, source_id: alias.legacy_source_id } };
  const result = buildPublicProjectionV1({ ...inputs,
    canonicalMeetings: { ...canonicalMeetings, meetings: [meeting] },
    canonicalDetails: { ...canonicalDetails, details: [] },
  });
  assert.equal(result.audit.decisions[0].canonical_source_id, alias.canonical_source_id);
}

const unknown = { ...jra, source_trace: { ...jra.source_trace, source_id: 'unreviewed-jra-programme' } };
assert.throws(() => buildPublicProjectionV1({ ...inputs,
  canonicalMeetings: { ...canonicalMeetings, meetings: [unknown] },
  canonicalDetails: { ...canonicalDetails, details: [] },
}), /has no Calendar Readiness record or reviewed alias/);
const missingTarget = structuredClone(readinessRegistry);
missingTarget.records = missingTarget.records.filter((row) => row.authority_source_key !== 'japan/jra/jra-programme');
assert.throws(() => buildPublicProjectionV1({ ...inputs, readinessRegistry: missingTarget }), /no Calendar Readiness record/);

// Mapping does not relax readiness eligibility or field permissions. Rank follows verified evidence; legacy ceilings do not downgrade it.
const restricted = structuredClone(readinessRegistry);
const jraReadiness = restricted.records.find((row) => row.authority_source_key === 'japan/jra/jra-programme');
jraReadiness.public_ceiling = 'A';
jraReadiness.confirmed_fields.race_name = false;
const limited = buildPublicProjectionV1({ ...inputs, readinessRegistry: restricted });
assert.equal(
  limited.meetingListDataset.meetings.find((row) => row.meeting_id === jra.meeting_id).effective_public_rank,
  jra.capability_rank,
  'legacy Readiness ceiling must not downgrade verified canonical capability',
);
assert(limited.meetingDetailsDataset.details.find((row) => row.meeting_id === jra.meeting_id).timetable_rows.every((row) => !('race_name' in row)));
jraReadiness.readiness = 'blocked';
assert(!buildPublicProjectionV1({ ...inputs, readinessRegistry: restricted }).meetingListDataset.meetings.some((row) => row.meeting_id === jra.meeting_id));

// Production uses scoped reconciliation: unrelated historical public rows remain untouched.
const scoped = reconcilePublicProjectionV1({ ...inputs, existingMeetingList: publicList,
  existingMeetingDetails: publicDetails, scopeMeetingIds: [jra.meeting_id],
});
const byId = (rows) => [...rows].sort((a, b) => a.meeting_id.localeCompare(b.meeting_id));
assert.deepEqual(byId(scoped.meetingListDataset.meetings.filter((row) => row.meeting_id !== jra.meeting_id)), byId(publicList.meetings.filter((row) => row.meeting_id !== jra.meeting_id)));
const excluded = reconcilePublicProjectionV1({ ...inputs, existingMeetingList: publicList,
  existingMeetingDetails: publicDetails, scopeMeetingIds: [jra.meeting_id], excludedMeetingIds: [jra.meeting_id],
});
assert(!excluded.meetingListDataset.meetings.some((row) => row.meeting_id === jra.meeting_id));
assert(!excluded.meetingDetailsDataset.details.some((row) => row.meeting_id === jra.meeting_id));
assert.equal(JSON.stringify({ canonicalMeetings, canonicalDetails, publicList, publicDetails }), before, 'projection must not mutate canonical or saved public inputs');
console.log(`CALENDAR_LIVE_SOURCE_READINESS: pass canonical_meetings=${canonicalMeetings.meetings.length} aliases=${sourceAliases.aliases.length}; unknown sources fail closed; exclusions/field permissions/scoped retention preserved; legacy rank ceilings do not downgrade evidence`);
