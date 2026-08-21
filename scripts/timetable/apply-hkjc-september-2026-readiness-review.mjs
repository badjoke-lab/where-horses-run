import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registryPath = path.join(root, 'data/static/calendar-readiness-registry.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

const readinessId = 'hong-kong--hong-kong-hkjc-system--hkjc-fixture-list';
const record = registry.records.find((item) => item.readiness_id === readinessId);
if (!record) throw new Error(`Missing readiness record: ${readinessId}`);
if (record.country_id !== 'hong-kong') throw new Error('HKJC readiness country differs');
if (record.system_id !== 'hong-kong-hkjc-system') throw new Error('HKJC readiness system differs');
if (record.authority_source_key !== 'hong-kong/hkjc/hkjc-fixture-list') throw new Error('HKJC readiness authority source differs');
if (record.coverage_scope !== 'authority_wide') throw new Error('HKJC fixture readiness is no longer authority-wide');
if (record.source_status !== 'verified') throw new Error('HKJC fixture readiness source is no longer verified');
if (record.readiness !== 'prototype_ready') throw new Error('HKJC fixture readiness is no longer prototype_ready');

const allowedBefore = [
  ['sha-tin-racecourse'],
  ['sha-tin-racecourse', 'happy-valley-racecourse'],
];
if (!allowedBefore.some((expected) => JSON.stringify(record.racecourse_ids) === JSON.stringify(expected))) {
  throw new Error(`Unexpected HKJC fixture racecourse scope: ${JSON.stringify(record.racecourse_ids)}`);
}

record.racecourse_ids = ['sha-tin-racecourse', 'happy-valley-racecourse'];
record.checked_date = '2026-08-20';
record.evidence_reviewed_at = '2026-08-20';
record.notes = 'Reviewed HKJC fixture scope covers both Sha Tin and Happy Valley. September 2026 daily-acquisition evidence confirmed meeting identities at both venues; publication remains independently rank-capped by reviewed Candidate data.';

fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({
  readiness_id: readinessId,
  racecourse_ids: record.racecourse_ids,
  checked_date: record.checked_date,
  evidence_reviewed_at: record.evidence_reviewed_at,
}));
