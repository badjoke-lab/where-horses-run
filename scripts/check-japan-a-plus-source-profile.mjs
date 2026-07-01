import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const parse = (file) => {
  try {
    return JSON.parse(readFileSync(path.join(root, file), 'utf8'));
  } catch (error) {
    fail(`${file} must parse: ${error.message}`);
    return null;
  }
};

const policy = parse('data/static/japan-a-plus-policy.json');
const readiness = parse('data/static/calendar-readiness-japan-v2.json');
const sources = parse('data/static/authority-source-inventory-japan-v2.json');
const profileFile = parse('data/static/country-profiles-v2-13-japan.json');
const summary = parse('docs/timetable-source-tests/13-japan/final-summary.json');
const narControl = parse('data/static/local-racing-pilot-control-v2.json');
const baneiControl = parse('data/static/banei-pilot-control.json');

const expectedSystems = [
  ['japan-jra-system', 'japan/jra/jra-programme'],
  ['japan-nar-system', 'japan/nar-local-government-racing/nar-monthly-convene-info'],
  ['japan-banei-system', 'japan/banei-tokachi/banei-official-schedule']
];

if (policy?.schema_version !== 'japan-a-plus-policy-v1') fail('Japan policy schema is invalid.');
if (readiness?.schema_version !== 'japan-calendar-readiness-v2') fail('Japan readiness v2 schema is invalid.');
if (sources?.schema_version !== 'authority-source-inventory-japan-v2') fail('Japan authority/source v2 schema is invalid.');

for (const [systemId, sourceKey] of expectedSystems) {
  const policyRecord = policy?.records?.find((record) => record.system_id === systemId);
  const readinessRecord = readiness?.records?.find((record) => record.system_id === systemId);
  const sourceRecord = sources?.records?.find((record) => record.system_id === systemId);

  if (!policyRecord) fail(`missing policy record ${systemId}`);
  if (!readinessRecord) fail(`missing readiness record ${systemId}`);
  if (!sourceRecord) fail(`missing authority/source v2 record ${systemId}`);

  if (policyRecord && (policyRecord.technical_rank !== 'A+' || policyRecord.public_ceiling !== 'A+')) {
    fail(`${systemId} policy must be A+/A+.`);
  }
  if (readinessRecord) {
    if (readinessRecord.authority_source_key !== sourceKey) fail(`${systemId} readiness source key is incorrect.`);
    if (readinessRecord.technical_rank !== 'A+' || readinessRecord.public_ceiling !== 'A+') fail(`${systemId} readiness must be A+/A+.`);
    if (readinessRecord.readiness !== 'prototype_ready' || readinessRecord.implementation_status !== 'prototype') fail(`${systemId} readiness state is incorrect.`);
    if (readinessRecord.automation_mode !== 'semi_automatic') fail(`${systemId} must remain semi_automatic.`);
  }
  if (sourceRecord) {
    if (sourceRecord.authority_source_key !== sourceKey) fail(`${systemId} authority/source key is incorrect.`);
    if (sourceRecord.capability_rank !== 'A+') fail(`${systemId} authority/source capability must be A+.`);
    if (!['verified', 'partial'].includes(sourceRecord.source_status)) fail(`${systemId} source status is invalid.`);
    if (sourceRecord.adapter_candidate_status !== 'candidate') fail(`${systemId} adapter candidate status must be candidate.`);
  }
}

if (new Set(policy?.records?.map((record) => record.system_id)).size !== 3) fail('Japan policy must contain exactly three unique systems.');
if (new Set(readiness?.records?.map((record) => record.system_id)).size !== 3) fail('Japan readiness must contain exactly three unique systems.');
if (new Set(sources?.records?.map((record) => record.system_id)).size !== 3) fail('Japan authority/source v2 must contain exactly three unique systems.');

const profile = Array.isArray(profileFile) ? profileFile[0] : null;
if (!profile || profile.country_id !== 'japan') fail('Japan Profile v2 is missing.');
if (profile) {
  if (profile.public_display_ceiling !== 'A+') fail('Japan Profile v2 public ceiling must be A+.');
  if (profile.last_reviewed !== '2026-07-02') fail('Japan Profile v2 review date must be 2026-07-02.');
  const profileSystemIds = profile.systems?.map((record) => record.id) ?? [];
  if (JSON.stringify(profileSystemIds) !== JSON.stringify(expectedSystems.map(([systemId]) => systemId))) fail('Japan Profile v2 system order or membership is incorrect.');
  if (!profile.coverage_note_en?.includes('Technical Rank A+ and Public Ceiling A+')) fail('Japan Profile v2 English A+ coverage note is missing.');
  if (!profile.coverage_note_ja?.includes('技術ランク・公開上限ともA+')) fail('Japan Profile v2 Japanese A+ coverage note is missing.');
}

if (summary) {
  if (summary.country !== 'Japan' || summary.status !== 'Partial') fail('Japan source summary identity/status is incorrect.');
  if (summary.technical_rank !== 'A+' || summary.public_ceiling !== 'A+') fail('Japan source summary must be A+/A+.');
  if (JSON.stringify(summary.systems) !== JSON.stringify(['JRA', 'NAR and local-government racing', 'Banei Tokachi'])) fail('Japan source summary system split is incorrect.');
  if (!summary.decision?.includes('human-approved publication')) fail('Japan source summary must preserve human-approved publication.');
}

if (narControl) {
  if (narControl.expected_technical_rank !== 'A+' || narControl.expected_public_ceiling !== 'A+') fail('NAR control must be A+/A+.');
  if (narControl.canonical_write_mode !== 'human_approval_only' || narControl.public_write_mode !== 'human_approval_only') fail('NAR writes must remain human-approved.');
  if (narControl.schedule_mode !== 'disabled') fail('NAR schedule must remain disabled.');
}
if (baneiControl) {
  if (baneiControl.expected_technical_rank !== 'A+' || baneiControl.expected_public_ceiling !== 'A+') fail('Banei control must be A+/A+.');
  if (baneiControl.public_write_mode !== 'human_approval_only' || baneiControl.schedule_mode !== 'disabled') fail('Banei publication/schedule boundary changed.');
}

const prohibited = /(?:raw_html|full_racecard|horse_names|jockeys|trainers|odds|results|payouts|predictions|direct_stream_url)/i;
for (const [label, value] of [['policy', policy], ['readiness', readiness], ['sources', sources], ['profile', profileFile], ['summary', summary]]) {
  if (prohibited.test(JSON.stringify(value))) fail(`${label} contains a prohibited public field marker.`);
}

if (errors.length) {
  console.error(`JAPAN_A_PLUS_SOURCE_PROFILE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('JAPAN_A_PLUS_SOURCE_PROFILE: pass');
console.log('SYSTEMS: 3');
console.log('TECHNICAL_RANK: A+');
console.log('PUBLIC_CEILING: A+');
console.log('UNATTENDED_PUBLICATION: disabled');
