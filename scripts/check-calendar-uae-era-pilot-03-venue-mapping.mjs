import { validateCurrentUaeState, validateHistoricalAudit, readJson, readText } from './lib/check-uae-era-current-state.mjs';

const root = process.cwd();
const errors = [];
const audit = readJson(root, 'data/audits/calendar-uae-era-pilot-03-venue-mapping-v1.json');
const p2 = readJson(root, 'data/audits/calendar-uae-era-pilot-02-source-route-evidence-v1.json');
const probe = readText(root, 'scripts/timetable/probe_uae_era_pdf_text.py');
const doc = readText(root, 'docs/calendar/uae-era-pilot-03-venue-mapping-pdf-evidence.md');

validateHistoricalAudit({ audit, schemaVersion: 'calendar-uae-era-pilot-03-venue-mapping-v1', implementationUnit: 'UAE-PILOT-03', errors });
if (audit.source_authority !== 'emirates-racing-authority') errors.push('PILOT-03 mapping authority differs.');
for (const key of ['existing_trusted_mapping_may_be_reused', 'official_page_slug_may_seed_proposed_id', 'proposed_id_is_not_approved_mapping']) {
  if (audit.mapping_policy?.[key] !== true) errors.push(`PILOT-03 mapping policy differs: ${key}.`);
}
for (const key of ['automatic_canonical_creation', 'automatic_candidate_expansion']) {
  if (audit.mapping_policy?.[key] !== false) errors.push(`PILOT-03 mapping safety boundary differs: ${key}.`);
}
if (!Array.isArray(audit.venue_mappings) && !Array.isArray(audit.mappings)) errors.push('PILOT-03 historical venue mapping set missing.');
if (p2.schema_version !== 'calendar-uae-era-pilot-02-source-route-evidence-v1') errors.push('PILOT-02 mapping dependency differs.');
if (!probe.includes('pdf') || !doc.toLowerCase().includes('venue mapping')) errors.push('PILOT-03 mapping implementation/documentation missing.');
validateCurrentUaeState(root, errors);

if (errors.length) {
  console.error(`CALENDAR_UAE_ERA_PILOT_03_VENUE_MAPPING: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_UAE_ERA_PILOT_03_VENUE_MAPPING: pass');
console.log('HISTORICAL_MAPPING_POLICY: retained');
console.log('CURRENT_APPROVED_SCOPE: five_venues');
