import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'docs/country-pages/programme-roadmap.md');
let value = fs.readFileSync(file, 'utf8');
const replace = (before, after, label) => {
  if (value.includes(after) && !value.includes(before)) return;
  const count = value.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one occurrence, found ${count}`);
  value = value.replace(before, after);
};

replace(
  'Latest completed Profile v2 change: PR #328 — entries 53-60',
  'Latest completed Profile v2 change: PR #332 — entries 61-68',
  'latest profile');
replace(
  'Current Work ID: WHR-PROFILE-61-68\nNext working branch: country-profiles-61-68',
  'Current Work ID: WHR-PUB-61-68\nNext working branch: country-publish-61-68',
  'current position');
replace(
  'Current tracker counts after reviewed notes 61-68:',
  'Current tracker counts after Profile v2 61-68:',
  'count heading');
replace(
  'profile_ready:    0\nnote_reviewed:    8\nsource_tested:    0\nnot_started:     30',
  'profile_ready:    8\nnote_reviewed:    0\nsource_tested:    0\nnot_started:     30',
  'counts');
replace(
  'page-QA English routes:                0\npage-QA Japanese routes:               0\npage-QA total routes:                  0\nfinal target routes:                196',
  'page-QA English routes:                0\npage-QA Japanese routes:               0\npage-QA total routes:                  0\nprofile-ready English routes:           8\nprofile-ready Japanese routes:          8\nprofile-ready total routes:            16\nfinal target routes:                196',
  'route counts');
replace(
  'PR #331 completes reviewed editorial notes for entries 61-68. Profile v2 work for these entries is now active.',
  'PR #332 completes reviewed bilingual Profile v2 records for entries 61-68. QA and publication work for these entries is now active.',
  'summary');
replace(
  '| #329 | publication | Published entries 53-60 after rendered-preview approval. |',
  '| #329 | publication | Published entries 53-60 after rendered-preview approval. |\n| #330 | Source Test v2 | Closed official-source and Calendar Readiness decisions for entries 61-68. |\n| #331 | reviewed notes | Completed public-safe editorial notes for entries 61-68. |\n| #332 | Profile v2 | Added reviewed bilingual Profile v2 records and complete English/Japanese routes for entries 61-68. |',
  'completed work table');
replace(
  '| #331 / `WHR-NOTE-61-68` | complete | Added eight reviewed editorial notes with explicit scope and limitations. |\n| `WHR-PROFILE-61-68` | next | Add bilingual Profile v2 records. |\n| `WHR-PUB-61-68` | planned | QA and publish after one rendered preview. |',
  '| #331 / `WHR-NOTE-61-68` | complete | Added eight reviewed editorial notes with explicit scope and limitations. |\n| #332 / `WHR-PROFILE-61-68` | complete | Added eight reviewed bilingual Profile v2 records and complete English/Japanese routes. |\n| `WHR-PUB-61-68` | next | QA and publish after one rendered preview. |',
  'wave status');

fs.writeFileSync(file, value);
console.log('APPLIED_PROFILE_ROADMAP_61_68');
