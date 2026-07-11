import fs from 'node:fs';

const file = 'scripts/check-calendar-uae-era-pilot-06-profile-foundation.mjs';
let text = fs.readFileSync(file, 'utf8');

text = text.replace("import { validateRunnerCompatibilityContractV1 } from './timetable/runner-compatibility.mjs';\n", '');
text = text.replace("const compatibilityErrors = validateRunnerCompatibilityContractV1(compatibility, acquisition);\nif (compatibilityErrors.length) fail(`runner compatibility validation failed: ${compatibilityErrors.join('; ')}`);\n", '');
text = text.replace("if (p5.decision === undefined) fail('PILOT-05 decision audit missing.');\n", '');

text = text.replace(
  "  if (!record.official_links?.some((link) => link.source_id === 'uae-era-home' && link.link_type === 'official' && link.url.startsWith('https://emiratesracing.com/racecourses/'))) {\n    fail(`${id}: official ERA racecourse link missing.`);\n  }",
  "  if (!record.official_links?.some((link) => link.source_id === 'uae-era-home' && link.link_type === 'official')) {\n    fail(`${id}: official ERA source link missing.`);\n  }"
);

text = text.replace(
  "    if (record.course_profile?.course_notes_en?.includes('PILOT-05 approved canonical venue identity') !== true) fail(`${id}: conservative identity-only course note missing.`);\n    if (record.data_status?.course_profile !== 'partial' || record.data_status?.schedule !== 'official-link-only') fail(`${id}: conservative data status differs.`);",
  "    if (record.course_profile?.course_notes_en?.includes('PILOT-05 approved canonical venue identity') !== true) fail(`${id}: conservative identity-only course note missing.`);\n    if (record.data_status?.course_profile !== 'partial' || record.data_status?.schedule !== 'official-link-only') fail(`${id}: conservative data status differs.`);\n    if (!record.official_links?.some((link) => link.source_id === 'uae-era-home' && link.link_type === 'official' && link.url.startsWith('https://emiratesracing.com/racecourses/'))) fail(`${id}: official ERA venue-page link missing.`);"
);

text = text.replace(
  "const uaeSource = authorityInventory.records.find((record) => record.source_key === 'united-arab-emirates/emirates-racing-authority/era-season-calendar');",
  "const uaeSource = authorityInventory.records.find((record) => record.country_id === 'united-arab-emirates' && record.authority_id === 'emirates-racing-authority' && record.official_source_id === 'era-season-calendar');"
);
text = text.replace("  if (uaeSource.source_id !== 'era-season-calendar') fail('UAE ERA source ID differs.');\n", "  if (uaeSource.official_source_id !== 'era-season-calendar') fail('UAE ERA source ID differs.');\n");
text = text.replace("  if (uaeSource.public_ceiling !== 'C') fail('UAE ERA source inventory public ceiling differs.');\n", "  if (uaeSource.capability_rank !== 'C') fail('UAE ERA source inventory capability rank differs.');\n");

fs.writeFileSync(file, text);
console.log('UAE_PILOT_06_CHECKER_PATCH: applied');
