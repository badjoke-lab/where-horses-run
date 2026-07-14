import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

const audit = readJson('data/audits/racecourse-page-bilingual-qa-v1.json');
if (audit.schema_version !== 'racecourse-page-bilingual-qa-v1') fail('audit schema differs');
if (audit.work_id !== 'WHR-RACECOURSE-PAGES-V1') fail('audit Work ID differs');
if (audit.implementation_unit !== 'RACECOURSE-PAGE-BILINGUAL-QA-01') fail('audit implementation unit differs');
if (audit.status !== 'accepted_complete') fail('audit status differs');
if (audit.decision !== 'accepted_for_reviewed_static_public_operation') fail('release decision differs');
if (audit.discovery?.artifact_digest !== 'sha256:8d12efa25df751d233077d00dc67d09429cf774094986fa19076da240290b4c6') fail('discovery artifact digest differs');
if (audit.fixture?.reference_date !== '2026-07-14' || audit.fixture?.timezone !== 'Asia/Tokyo') fail('fixture differs');

const expectedCounts = {
  racecourses: 36,
  bilingual_pages: 72,
  route_pairs_complete: 36,
  language_valid: 72,
  titles_valid: 72,
  descriptions_valid: 72,
  canonical_valid: 72,
  self_hreflang_valid: 72,
  counterpart_hreflang_valid: 72,
  x_default_valid: 72,
  language_switch_valid: 72,
  one_h1_valid: 72,
  unique_ids_valid: 72,
  image_alt_valid: 72,
  nonempty_anchors_valid: 72,
  skip_links_valid: 72,
  main_landmarks_valid: 72,
  labeled_headers_valid: 72,
  labeled_navs_valid: 72,
  panel_labels_valid: 72,
  reference_dates_valid: 72,
  public_boundary_notices_valid: 72,
  required_section_pairs_valid: 360,
  optional_section_pairs_valid: 108,
  heading_level_pairs_valid: 36,
  errors: 0,
};
for (const [key, expected] of Object.entries(expectedCounts)) {
  if (audit.counts?.[key] !== expected) fail(`audit count ${key} expected ${expected}; found ${audit.counts?.[key]}`);
}
if (Object.values(audit.source_contracts ?? {}).some((value) => value !== true)) fail('source contracts must all be true');
if ((audit.completed_units ?? []).length !== 5 || !audit.completed_units.includes('RACECOURSE-PAGE-BILINGUAL-QA-01')) fail('completed implementation chain differs');
if (Object.values(audit.release_criteria ?? {}).some((value) => value !== true)) fail('release criteria must all be accepted');
if (Object.entries(audit.public_boundary ?? {}).some(([key, value]) => key === 'list_shape' ? value !== 'one_meeting_per_row' : value !== false)) fail('public boundary differs');
if (Object.values(audit.automation_boundary ?? {}).some((value) => value !== false)) fail('automation boundary differs');
if (audit.completed_work_id !== 'WHR-RACECOURSE-PAGES-V1') fail('completed Work ID differs');
if (audit.next_work_id !== 'WHR-GLOSSARY-DICTIONARY-V1') fail('next Work ID differs');
if (audit.next_implementation_unit !== 'GLOSSARY-SCHEMA-EXTENSION-01') fail('next implementation unit differs');

for (const file of [
  'docs/racecourses/bilingual-qa.md',
  'scripts/check-racecourse-page-bilingual-qa-rendered.mjs',
  '.github/workflows/racecourse-page-bilingual-qa.yml',
]) if (!fs.existsSync(path.join(root, file))) fail(`required permanent file missing: ${file}`);

if (errors.length) {
  console.error(`RACECOURSE_PAGE_BILINGUAL_QA_CONTRACT: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const rendered = spawnSync(process.execPath, ['scripts/check-racecourse-page-bilingual-qa-rendered.mjs'], {
  cwd: root,
  encoding: 'utf8',
});
if (rendered.stdout) process.stdout.write(rendered.stdout);
if (rendered.stderr) process.stderr.write(rendered.stderr);
if (rendered.status !== 0) process.exit(rendered.status ?? 1);

console.log('RACECOURSE_PAGE_BILINGUAL_QA_CONTRACT: pass');
console.log('RACECOURSE_PAGE_RELEASE_DECISION: accepted_for_reviewed_static_public_operation');
console.log('COMPLETED_WORK_ID: WHR-RACECOURSE-PAGES-V1');
console.log('NEXT_WORK_ID: WHR-GLOSSARY-DICTIONARY-V1');
