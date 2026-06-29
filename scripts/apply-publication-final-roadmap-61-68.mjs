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
  'Latest country publication: PR #329 — entries 53-60 approved after rendered preview\nPublication gate: PR #329 — entries 53-60 published after approved rendered preview\nCurrent Work ID: WHR-PUB-61-68\nNext working branch: country-publish-61-68',
  'Latest country publication: PR #333 — entries 61-68 approved after rendered preview\nPublication gate: PR #333 — entries 61-68 published after approved rendered preview\nCurrent Work ID: WHR-ST2-69-76\nNext working branch: source-test-v2-69-76',
  'current position');
replace('Current tracker counts during publication QA 61-68:', 'Current tracker counts after publication 61-68:', 'count heading');
replace(
  'published:       60\npage_qa:          8\nprofile_ready:    0\nnote_reviewed:    0\nsource_tested:    0\nnot_started:     30',
  'published:       68\npage_qa:          0\nprofile_ready:    0\nnote_reviewed:    0\nsource_tested:    0\nnot_started:     30',
  'counts');
replace(
  'formally published English routes:   60\nformally published Japanese routes:  60\nformally published total routes:    120\npage-QA English routes:                8\npage-QA Japanese routes:               8\npage-QA total routes:                  16',
  'formally published English routes:   68\nformally published Japanese routes:  68\nformally published total routes:    136\npage-QA English routes:                0\npage-QA Japanese routes:               0\npage-QA total routes:                  0',
  'route counts');
replace(
  'PR #333 runs GitHub publication QA for entries 61-68. One final rendered preview remains required before publication.',
  'PR #333 publishes entries 61-68 after the approved rendered preview. Source Test v2 for entries 69-76 is now active.',
  'summary');
replace(
  '| #333 | publication QA | GitHub QA active; rendered preview and publication approval pending. |',
  '| #333 | publication | Published entries 61-68 after rendered-preview approval. |',
  'work table');
replace(
  '7. PR #329 must merge without `[CF-Pages-Skip]`, followed by one production-deployment confirmation.\n\n## 8. Wave 37-44',
  '7. PR #329 must merge without `[CF-Pages-Skip]`, followed by one production-deployment confirmation.\n\n### PR #333 — entries 61-68\n\nRendered preview approval:\n\n1. Cloudflare Pages deployment `94121055-c2cf-4d21-bb32-16325e184a32` succeeded from `preview-country-pages-61-68`.\n2. All 8 English and 8 Japanese routes passed rendered route checks.\n3. Slovenia, Dominican Republic, Mainland China, and Indonesia passed English/Japanese desktop 1440x1200 and Pixel 7 412x915 review.\n4. Canonical, hreflang, language switching, official links, empty states, CJK rendering, horizontal overflow, media exclusion, and C-level time-column suppression passed.\n5. Evidence artifact `rendered-preview-61-68` is artifact `7950774820` with digest `sha256:dbb5126e397cf026d23244b153d5029bebe37ddcf83cb2146d7a5e876ff32d00`; rendered run `28369320969` completed with 0 errors.\n6. Entries 61-68 are recorded as `published` on 2026-06-29.\n7. PR #333 must merge without `[CF-Pages-Skip]`, followed by one production-deployment confirmation.\n\n## 8. Wave 37-44',
  'publication gate');
replace(
  '| #333 / `WHR-PUB-61-68` | active | GitHub QA active; publish after one approved rendered preview. |',
  '| #333 / `WHR-PUB-61-68` | complete | Published all sixteen routes after approved rendered-preview QA. |',
  'wave status');

fs.writeFileSync(file, value);
console.log('APPLIED_PUBLICATION_FINAL_ROADMAP_61_68');
