import { validateCurrentUaeState, validateHistoricalAudit, readJson, readText } from './lib/check-uae-era-current-state.mjs';

const root = process.cwd();
const errors = [];
const audit = readJson(root, 'data/audits/calendar-uae-era-pilot-03-pdf-evidence-v1.json');
const mapping = readJson(root, 'data/audits/calendar-uae-era-pilot-03-venue-mapping-v1.json');
const p2 = readJson(root, 'data/audits/calendar-uae-era-pilot-02-source-route-evidence-v1.json');
const doc = readText(root, 'docs/calendar/uae-era-pilot-03-venue-mapping-pdf-evidence.md');

validateHistoricalAudit({ audit, schemaVersion: 'calendar-uae-era-pilot-03-pdf-evidence-v1', implementationUnit: 'UAE-PILOT-03', errors });
if (audit.evidence_run?.workflow_run_id !== 29141771555 || audit.evidence_run?.artifact_id !== 8245387666) errors.push('PILOT-03 PDF evidence identity differs.');
if (audit.evidence_run?.artifact_digest !== 'sha256:cf32b5bf6015dd6d30543239a13a402b43db37f3c18f8e2157180525fae00ed3') errors.push('PILOT-03 PDF artifact digest differs.');
if (audit.evidence_run?.venue_pages?.page_count !== 5 || audit.evidence_run?.venue_pages?.all_pages_reachable !== true || audit.evidence_run?.venue_pages?.all_final_hosts_official !== true) errors.push('PILOT-03 five-venue page evidence differs.');
if (mapping.schema_version !== 'calendar-uae-era-pilot-03-venue-mapping-v1' || mapping.implementation_unit !== 'UAE-PILOT-03') errors.push('PILOT-03 mapping dependency differs.');
if (p2.schema_version !== 'calendar-uae-era-pilot-02-source-route-evidence-v1') errors.push('PILOT-02 dependency differs.');
for (const phrase of ['UAE-PILOT-03', 'venue mapping', 'PDF', 'review']) {
  if (!doc.toLowerCase().includes(phrase.toLowerCase())) errors.push(`PILOT-03 document missing ${phrase}.`);
}
validateCurrentUaeState(root, errors);

if (errors.length) {
  console.error(`CALENDAR_UAE_ERA_PILOT_03_PDF_EVIDENCE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_UAE_ERA_PILOT_03_PDF_EVIDENCE: pass');
console.log('HISTORICAL_EVIDENCE: five_venue_pdf_review');
console.log('CURRENT_STATE: advanced_without_rewriting_history');
