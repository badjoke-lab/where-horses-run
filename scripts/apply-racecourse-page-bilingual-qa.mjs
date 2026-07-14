import fs from 'node:fs';

const replaceOnce = (text, search, replacement, label) => {
  if (!text.includes(search)) throw new Error(`${label}: expected source text not found`);
  return text.replace(search, replacement);
};
const update = (file, transform) => {
  const before = fs.readFileSync(file, 'utf8');
  const after = transform(before);
  if (after === before) throw new Error(`${file}: no change produced`);
  fs.writeFileSync(file, after);
};

fs.renameSync('scripts/audit-racecourse-page-bilingual-qa-v2.mjs', 'scripts/check-racecourse-page-bilingual-qa-rendered.mjs');
update('scripts/check-racecourse-page-bilingual-qa-rendered.mjs', (input) => input.replace(
  "schema_version: 'racecourse-page-bilingual-qa-discovery-v2'",
  "schema_version: 'racecourse-page-bilingual-qa-rendered-v1'",
));

update('START-HERE.md', (input) => {
  let text = replaceOnce(
    input,
    'Completed Work ID: `WHR-CAL-PUBLIC-V1`\nCurrent Work ID: `WHR-RACECOURSE-PAGES-V1`\nCompleted implementation unit: `RACECOURSE-PAGE-IDENTITY-RECONCILIATION-01`\nCompleted implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`\nCompleted implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`\nCompleted implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`\nCurrent implementation unit: `RACECOURSE-PAGE-BILINGUAL-QA-01`',
    'Completed Work ID: `WHR-CAL-PUBLIC-V1`\nCompleted Work ID: `WHR-RACECOURSE-PAGES-V1`\nCurrent Work ID: `WHR-GLOSSARY-DICTIONARY-V1`\nCompleted implementation unit: `RACECOURSE-PAGE-IDENTITY-RECONCILIATION-01`\nCompleted implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`\nCompleted implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`\nCompleted implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`\nCompleted implementation unit: `RACECOURSE-PAGE-BILINGUAL-QA-01`\nCurrent implementation unit: `GLOSSARY-SCHEMA-EXTENSION-01`',
    'START-HERE work transition',
  );
  return replaceOnce(
    text,
    '```text\n1. validate bilingual responsive racecourse pages, metadata, accessibility markers, and final release readiness\n```',
    '```text\n1. extend the glossary schema without weakening the public-data boundary\n2. expand racing-type, breed, role, timetable, and official-source terms\n3. add multilingual cleanup, related-term graph, beginner explanations, and glossary QA\n```',
    'START-HERE active sequence',
  );
});

update('docs/project-roadmap.md', (input) => {
  let text = replaceOnce(
    input,
    'Current Work ID: `WHR-RACECOURSE-PAGES-V1`\nCompleted implementation unit: `RACECOURSE-PAGE-IDENTITY-RECONCILIATION-01`\nCompleted implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`\nCompleted implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`\nCompleted implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`\nCurrent implementation unit: `RACECOURSE-PAGE-BILINGUAL-QA-01`\n\nCurrent product stage: all canonical racecourse pages now connect reviewed meetings, countries, racing types, glossary concepts, official routes, source registries, and coverage explanation. Next complete bilingual responsive, metadata, accessibility, and release-readiness QA.',
    'Completed Work ID: `WHR-RACECOURSE-PAGES-V1`\nCurrent Work ID: `WHR-GLOSSARY-DICTIONARY-V1`\nCompleted implementation unit: `RACECOURSE-PAGE-IDENTITY-RECONCILIATION-01`\nCompleted implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`\nCompleted implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`\nCompleted implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`\nCompleted implementation unit: `RACECOURSE-PAGE-BILINGUAL-QA-01`\nCurrent implementation unit: `GLOSSARY-SCHEMA-EXTENSION-01`\n\nRacecourse-page release decision: accepted for reviewed static public operation. All 36 canonical identities and 72 bilingual pages satisfy identity, public-timetable, profile-evidence, page-link, metadata, responsive, accessibility, language-parity, and public-boundary gates.\n\nCurrent product stage: extend the reviewed glossary contract, then expand racing-type, breed, role, timetable, and official-source terminology before search, filtering, and SEO work.',
    'project roadmap work transition',
  );
  return text;
});

update('docs/calendar/implementation-roadmap.md', (input) => {
  let text = replaceOnce(
    input,
    '## Stage 12 — racecourse pages and page-link architecture\n\nStatus: active current programme work\nCurrent Work ID: `WHR-RACECOURSE-PAGES-V1`\nCompleted implementation unit: `RACECOURSE-PAGE-IDENTITY-RECONCILIATION-01`\nCompleted implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`\nCompleted implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`\nCompleted implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`\nCurrent implementation unit: `RACECOURSE-PAGE-BILINGUAL-QA-01`\n\nIdentity reconciliation result: 26 of 26 public timetable racecourse IDs resolve to canonical bilingual pages. Public timetable connection result: all 36 bilingual racecourse pages expose reviewed Today, Next, and upcoming meeting state. Profile evidence result: thirteen former identity-only Japanese records now have official location and high-level course evidence while unsupported race-distance, lighting, elevation, season-completeness, and notable-race fields remain explicit unknowns.\n\nInitial sequence:\n\n1. validate bilingual responsive pages, metadata, accessibility markers, and final release readiness.',
    '## Stage 12 — racecourse pages and page-link architecture\n\nStatus: complete.\nCompleted Work ID: `WHR-RACECOURSE-PAGES-V1`\nNext Work ID: `WHR-GLOSSARY-DICTIONARY-V1`\nCompleted implementation unit: `RACECOURSE-PAGE-IDENTITY-RECONCILIATION-01`\nCompleted implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`\nCompleted implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`\nCompleted implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`\nCompleted implementation unit: `RACECOURSE-PAGE-BILINGUAL-QA-01`\n\nRacecourse-page release decision: accepted for reviewed static public operation. All 26 public timetable racecourse IDs resolve to canonical identities; all 36 English and 36 Japanese pages expose reviewed meeting state, explicit profile evidence boundaries, complete page-link architecture, localized metadata and language switching, responsive layout, accessibility markers, and zero rendered QA errors.\n\nThe permanent gate remains read-only. Scheduled acquisition execution and unattended publication remain disabled.',
    'implementation roadmap Stage 12 completion',
  );
  text = replaceOnce(
    text,
    '### Glossary, racing types, search, filtering, SEO\n\nImplement reviewed terminology, local names, readings/pronunciation metadata where supported, navigation, search/filtering, metadata, sitemap, canonical/hreflang, structured data, methodology, coverage, and limitations pages.',
    '### Glossary, racing types, search, filtering, SEO\n\nCurrent Work ID: `WHR-GLOSSARY-DICTIONARY-V1`\nCurrent implementation unit: `GLOSSARY-SCHEMA-EXTENSION-01`\n\nImplement reviewed terminology, local names, readings/pronunciation metadata where supported, navigation, search/filtering, metadata, sitemap, canonical/hreflang, structured data, methodology, coverage, and limitations pages. Explaining restricted concepts is allowed; republishing entries, odds, results, payouts, or other prohibited datasets is not.',
    'implementation roadmap next stage',
  );
  text = replaceOnce(
    text,
    '1. keep Calendar Public v1 and source-specific pilots in reviewed steady-state operation\n2. validate bilingual racecourse pages, metadata, accessibility markers, and release readiness\n7. run source-specific Completion Audits only before making their corresponding completeness claims',
    '1. keep Calendar Public v1 and racecourse pages in reviewed steady-state operation\n2. extend the glossary schema and dictionary evidence contract\n3. expand reviewed racing-type, breed, role, timetable, and official-source terms\n4. run source-specific Completion Audits only before making their corresponding completeness claims',
    'implementation roadmap immediate order',
  );
  return text.replace('Current programme Work ID: `WHR-RACECOURSE-PAGES-V1`.', 'Current programme Work ID: `WHR-GLOSSARY-DICTIONARY-V1`.');
});

update('docs/governance/document-authority.md', (input) => {
  let text = replaceOnce(input, '- `docs/racecourses/page-link-architecture.md`\n', '- `docs/racecourses/page-link-architecture.md`\n- `docs/racecourses/bilingual-qa.md`\n', 'authority QA document');
  text = replaceOnce(text, '- `data/audits/racecourse-page-link-architecture-v1.json`\n', '- `data/audits/racecourse-page-link-architecture-v1.json`\n- `data/audits/racecourse-page-bilingual-qa-v1.json`\n', 'authority QA audit');
  return replaceOnce(text, '- `scripts/check-racecourse-page-link-architecture.mjs`\n', '- `scripts/check-racecourse-page-link-architecture.mjs`\n- `scripts/check-racecourse-page-bilingual-qa.mjs`\n- `scripts/check-racecourse-page-bilingual-qa-rendered.mjs`\n', 'authority QA checkers');
});

update('scripts/check-project-governance-docs.mjs', (input) => {
  let text = replaceOnce(input, "  'scripts/check-racecourse-page-link-architecture.mjs',\n", "  'scripts/check-racecourse-page-link-architecture.mjs',\n  'docs/racecourses/bilingual-qa.md',\n  'data/audits/racecourse-page-bilingual-qa-v1.json',\n  'scripts/check-racecourse-page-bilingual-qa.mjs',\n  'scripts/check-racecourse-page-bilingual-qa-rendered.mjs',\n", 'governance QA files');
  text = replaceOnce(
    text,
    "  'Completed Work ID: `WHR-CAL-PUBLIC-V1`',\n  'Current Work ID: `WHR-RACECOURSE-PAGES-V1`',\n  'Completed implementation unit: `RACECOURSE-PAGE-IDENTITY-RECONCILIATION-01`',\n  'Completed implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`',\n  'Completed implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`',\n  'Completed implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`',\n  'Current implementation unit: `RACECOURSE-PAGE-BILINGUAL-QA-01'",
    "  'Completed Work ID: `WHR-CAL-PUBLIC-V1`',\n  'Completed Work ID: `WHR-RACECOURSE-PAGES-V1`',\n  'Current Work ID: `WHR-GLOSSARY-DICTIONARY-V1`',\n  'Completed implementation unit: `RACECOURSE-PAGE-IDENTITY-RECONCILIATION-01`',\n  'Completed implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`',\n  'Completed implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`',\n  'Completed implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`',\n  'Completed implementation unit: `RACECOURSE-PAGE-BILINGUAL-QA-01`',\n  'Current implementation unit: `GLOSSARY-SCHEMA-EXTENSION-01'",
    'governance START-HERE markers',
  );
  text = replaceOnce(
    text,
    "  'Current Work ID: `WHR-RACECOURSE-PAGES-V1`',\n  'Completed implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`',\n  'Completed implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`',\n  'Completed implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`',\n  'Current implementation unit: `RACECOURSE-PAGE-BILINGUAL-QA-01'",
    "  'Completed Work ID: `WHR-RACECOURSE-PAGES-V1`',\n  'Current Work ID: `WHR-GLOSSARY-DICTIONARY-V1`',\n  'Completed implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`',\n  'Completed implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`',\n  'Completed implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`',\n  'Completed implementation unit: `RACECOURSE-PAGE-BILINGUAL-QA-01`',\n  'Current implementation unit: `GLOSSARY-SCHEMA-EXTENSION-01'",
    'governance project roadmap markers',
  );
  return replaceOnce(
    text,
    "  'Current Work ID: `WHR-RACECOURSE-PAGES-V1`',\n  'Completed implementation unit: `PUBLIC-V1-RELEASE-DECISION-01`',\n  'Completed implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`',\n  'Completed implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`',\n  'Completed implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`',\n  'Current implementation unit: `RACECOURSE-PAGE-BILINGUAL-QA-01'",
    "  'Completed Work ID: `WHR-RACECOURSE-PAGES-V1`',\n  'Current Work ID: `WHR-GLOSSARY-DICTIONARY-V1`',\n  'Completed implementation unit: `PUBLIC-V1-RELEASE-DECISION-01`',\n  'Completed implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`',\n  'Completed implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`',\n  'Completed implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`',\n  'Completed implementation unit: `RACECOURSE-PAGE-BILINGUAL-QA-01`',\n  'Current implementation unit: `GLOSSARY-SCHEMA-EXTENSION-01'",
    'governance implementation roadmap markers',
  );
});

console.log('RACECOURSE_PAGE_BILINGUAL_QA_APPLIED');
