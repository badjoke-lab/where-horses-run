import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, content) => fs.writeFileSync(path.join(root, file), content.endsWith('\n') ? content : `${content}\n`, 'utf8');
const replaceRequired = (text, search, replacement, label) => {
  const next = text.replace(search, replacement);
  if (next === text) throw new Error(`Required replacement failed: ${label}`);
  return next;
};

let startHere = read('START-HERE.md');
startHere = replaceRequired(startHere, /Previous completed Work ID:[\s\S]*$/, `Previous completed Work ID: \`WHR-ST2-69-76\`\n\nCurrent Work ID:\n\n\`\`\`text\nWHR-NOTE-69-76\n\`\`\`\n\nNext Work ID:\n\n\`\`\`text\nWHR-PROFILE-69-76\n\`\`\`\n`, 'START-HERE work IDs');
startHere = startHere.replace('Last reviewed: 2026-06-29', 'Last reviewed: 2026-06-30');
write('START-HERE.md', startHere);

let project = read('docs/project-roadmap.md');
project = replaceRequired(project, 'Current Work ID: `WHR-ST2-69-76`  \nNext Work ID: `WHR-NOTE-69-76`', 'Current Work ID: `WHR-NOTE-69-76`  \nNext Work ID: `WHR-PROFILE-69-76`', 'project header IDs');
project = project.replace('Last reviewed: 2026-06-29', 'Last reviewed: 2026-06-30');
project = replaceRequired(project, 'source_tested:                  0\nnot_started:                   30', 'source_tested:                  8\nnot_started:                   22', 'project counts');
project = replaceRequired(project, 'Calendar Readiness decisions are closed through entry 68, covering 68 countries and 86 system/source records.', 'Calendar Readiness decisions are closed through entry 76, covering 76 countries and 94 system/source records.', 'project readiness');
project = replaceRequired(project, 'Completed: `WHR-ST2-61-68` via PR #330, `WHR-NOTE-61-68` via PR #331, `WHR-PROFILE-61-68` via PR #332, and `WHR-PUB-61-68` via PR #333 after rendered-preview approval.\n\nCurrent Work ID: `WHR-ST2-69-76`', 'Completed: `WHR-ST2-61-68` via PR #330, `WHR-NOTE-61-68` via PR #331, `WHR-PROFILE-61-68` via PR #332, and `WHR-PUB-61-68` via PR #333 after rendered-preview approval.\n\nCompleted: `WHR-ST2-69-76` via PR #334 with eight Source Test v2 and Calendar Readiness decisions.\n\nCurrent Work ID: `WHR-NOTE-69-76`', 'project phase 5');
write('docs/project-roadmap.md', project);

let country = read('docs/country-pages/programme-roadmap.md');
country = country.replace('Last roadmap review: 2026-06-29', 'Last roadmap review: 2026-06-30');
country = replaceRequired(country, /```text\nLatest completed Source Test v2 change:[\s\S]*?Final release gate: WHR-AUDIT-COUNTRY-CALENDAR-98\n```/, '```text\nLatest completed Source Test v2 change: PR #334 — entries 69-76\nLatest completed reviewed-note change: PR #331 — entries 61-68\nLatest completed Profile v2 change: PR #332 — entries 61-68\nLatest country publication: PR #333 — entries 61-68 approved after rendered preview\nPublication gate: PR #333 — entries 61-68 published after approved rendered preview\nCurrent Work ID: WHR-NOTE-69-76\nNext working branch: country-notes-69-76\nFinal release gate: WHR-AUDIT-COUNTRY-CALENDAR-98\n```', 'country current position');
country = replaceRequired(country, 'source_tested:    0\nnot_started:     30', 'source_tested:    8\nnot_started:     22', 'country counts');
country = replaceRequired(country, 'PR #333 publishes entries 61-68 after the approved rendered preview. Source Test v2 for entries 69-76 is now active.', 'PR #334 closes Source Test v2 and Calendar Readiness for entries 69-76. Reviewed-note work for entries 69-76 is now active.', 'country active sentence');
country = replaceRequired(country, '| #333 | publication | Published entries 61-68 after rendered-preview approval. |', '| #333 | publication | Published entries 61-68 after rendered-preview approval. |\n| #334 | Source Test v2 | Closed official-source and Calendar Readiness decisions for entries 69-76. |', 'country PR row');
country = replaceRequired(country, '## 12. Remaining wave schedule', '## 12. Wave 69-76\n\nEntries: Russia, Namibia, Nigeria, Belize, Colombia, Lithuania, Estonia, and Guyana.\n\n| Work | Status | Result |\n| --- | --- | --- |\n| #334 / `WHR-ST2-69-76` | complete | Added eight Source Test v2 records, eight authority/source records, and eight Calendar Readiness decisions. |\n| `WHR-NOTE-69-76` | active | Convert the reviewed source decisions into public-safe editorial notes. |\n| `WHR-PROFILE-69-76` | queued | Add reviewed bilingual Profile v2 records and complete English/Japanese routes. |\n| `WHR-PUB-69-76` | queued | Run rendered-preview QA and publish all sixteen routes. |\n\nReadiness result: 3 prototype-ready, 3 link-only, and 2 blocked. Every technical rank and country public ceiling remains C.\n\n## 13. Remaining wave schedule', 'country wave section');
country = country.replace('## 13. Final release gate', '## 14. Final release gate');
country = country.replace('## 14. Roadmap maintenance rules', '## 15. Roadmap maintenance rules');
country = replaceRequired(country, /\| Entries \| Source test \| Reviewed note \| Profile v2 \| QA and publish \|[\s\S]*?\| 93-98 \| #336 \| #337 \| #338 \| #339 \|/, '| Entries | Source test | Reviewed note | Profile v2 | QA and publish |\n| --- | --- | --- | --- | --- |\n| 69-76 | `WHR-ST2-69-76` complete | `WHR-NOTE-69-76` active | `WHR-PROFILE-69-76` queued | `WHR-PUB-69-76` queued |\n| 77-84 | `WHR-ST2-77-84` | `WHR-NOTE-77-84` | `WHR-PROFILE-77-84` | `WHR-PUB-77-84` |\n| 85-92 | `WHR-ST2-85-92` | `WHR-NOTE-85-92` | `WHR-PROFILE-85-92` | `WHR-PUB-85-92` |\n| 93-98 | `WHR-ST2-93-98` | `WHR-NOTE-93-98` | `WHR-PROFILE-93-98` | `WHR-PUB-93-98` |', 'country remaining schedule');
write('docs/country-pages/programme-roadmap.md', country);

let readme = read('README.md');
readme = replaceRequired(readme, '28 English routes\n28 Japanese routes\n56 published bilingual routes', '68 English routes\n68 Japanese routes\n136 published bilingual routes', 'README counts');
write('README.md', readme);

console.log('ADVANCED_SOURCE_TEST_V2_69_76_DOCS current=WHR-NOTE-69-76 next=WHR-PROFILE-69-76');
