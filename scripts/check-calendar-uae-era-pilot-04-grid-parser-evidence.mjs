import { validateCurrentUaeState, validateHistoricalAudit, readJson, readText, exact } from './lib/check-uae-era-current-state.mjs';

const root = process.cwd();
const errors = [];
const audit = readJson(root, 'data/audits/calendar-uae-era-pilot-04-grid-parser-evidence-v1.json');
const p3 = readJson(root, 'data/audits/calendar-uae-era-pilot-03-pdf-evidence-v1.json');
const mapping = readJson(root, 'data/audits/calendar-uae-era-pilot-03-venue-mapping-v1.json');
const doc = readText(root, 'docs/calendar/uae-era-pilot-04-coordinate-grid-parser.md');

validateHistoricalAudit({ audit, schemaVersion: 'calendar-uae-era-pilot-04-grid-parser-evidence-v1', implementationUnit: 'UAE-PILOT-04', errors });
const evidence = audit.evidence_run ?? {};
if (evidence.workflow_run_id !== 29142374154 || evidence.artifact_id !== 8245577585) errors.push('PILOT-04 evidence identity differs.');
if (evidence.artifact_digest !== 'sha256:139343efe9771fd6a3a41cb15741961632bcddf739ab9ba447b3f8081eeee847') errors.push('PILOT-04 artifact digest differs.');
if (evidence.coordinate_summary?.page_count !== 1 || evidence.grid_parser?.observation_count !== 64) errors.push('PILOT-04 parser evidence closure differs.');
if (!exact(evidence.grid_parser?.month_meeting_counts, { '2026-10': 4, '2026-11': 11, '2026-12': 10, '2027-01': 13, '2027-02': 11, '2027-03': 10, '2027-04': 5 })) errors.push('PILOT-04 month counts differ.');
if (evidence.coordinate_summary?.raw_pdf_stored !== false || evidence.coordinate_summary?.raw_text_stored !== false || evidence.coordinate_summary?.unapproved_text_emitted !== false) errors.push('PILOT-04 raw-source boundary differs.');
if (p3.schema_version !== 'calendar-uae-era-pilot-03-pdf-evidence-v1' || mapping.schema_version !== 'calendar-uae-era-pilot-03-venue-mapping-v1') errors.push('PILOT-04 historical dependencies differ.');
for (const phrase of ['UAE-PILOT-04', 'coordinate', 'grid', '64']) {
  if (!doc.toLowerCase().includes(phrase.toLowerCase())) errors.push(`PILOT-04 document missing ${phrase}.`);
}
validateCurrentUaeState(root, errors);

if (errors.length) {
  console.error(`CALENDAR_UAE_ERA_PILOT_04_GRID_PARSER_EVIDENCE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_UAE_ERA_PILOT_04_GRID_PARSER_EVIDENCE: pass');
console.log('HISTORICAL_GRID_OBSERVATIONS: 64');
console.log('CURRENT_STATE: advanced_without_rewriting_history');
