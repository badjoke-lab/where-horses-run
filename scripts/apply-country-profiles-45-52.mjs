import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, value) => fs.writeFileSync(path.join(root, file), value);

function replaceRequired(text, before, after, label, count = 1) {
  const found = text.split(before).length - 1;
  if (found === 0 && text.includes(after)) return text;
  if (found !== count) throw new Error(`${label}: expected ${count} occurrence(s), found ${found}`);
  return text.split(before).join(after);
}

const trackerPath = 'docs/country-pages/98-country-tracker.tsv';
const trackerLines = read(trackerPath).trimEnd().split(/\r?\n/);
const headers = trackerLines[0].split('\t');
const index = Object.fromEntries(headers.map((name, position) => [name, position]));
const rows = trackerLines.slice(1).map((line) => line.split('\t'));
for (const row of rows) {
  const delivery = Number(row[index.delivery_no]);
  if (delivery < 45 || delivery > 52) continue;
  row[index.programme_status] = 'profile_ready';
  row[index.profile_status] = 'reviewed';
  row[index.en_route_status] = 'complete';
  row[index.ja_route_status] = 'complete';
  row[index.qa_status] = 'not_started';
  row[index.profile_last_reviewed] = '2026-06-20';
  row[index.page_published_at] = '';
  row[index.remarks] = 'Profile v2 and bilingual routes completed; publication QA remains.';
}
write(trackerPath, `${[headers.join('\t'), ...rows.map((row) => row.join('\t'))].join('\n')}\n`);

let startHere = read('START-HERE.md');
startHere = replaceRequired(startHere, 'Previous completed Work ID: `WHR-CAL-BACKFILL-37-52`', 'Previous completed Work ID: `WHR-CP-PROFILE-45-52`', 'START-HERE previous');
startHere = replaceRequired(startHere, 'WHR-CP-PROFILE-45-52\n```\n\nNext Work ID:\n\n```text\nWHR-CP-PUB-45-52', 'WHR-CP-PUB-45-52\n```\n\nNext Work ID:\n\n```text\nWHR-ST2-53-60', 'START-HERE current/next');
write('START-HERE.md', startHere);

let project = read('docs/project-roadmap.md');
project = replaceRequired(project, 'Current Work ID: `WHR-CP-PROFILE-45-52`', 'Current Work ID: `WHR-CP-PUB-45-52`', 'project current', 2);
project = replaceRequired(project, 'Next Work ID: `WHR-CP-PUB-45-52`', 'Next Work ID: `WHR-ST2-53-60`', 'project next');
project = replaceRequired(project, 'profile_ready:                  0\nnote_reviewed:                  8', 'profile_ready:                  8\nnote_reviewed:                  0', 'project counts');
project = replaceRequired(project, '- entries 45-52 need Profile v2 and publication.', '- entries 45-52 are profile-ready and need publication.', 'project debt');
project = replaceRequired(project, '## Phase 4 — finish entries 45-52\n\n```text\nWHR-CP-PROFILE-45-52\nWHR-CP-PUB-45-52\n```', '## Phase 4 — finish entries 45-52\n\nCompleted: `WHR-CP-PROFILE-45-52`.\n\nCurrent Work ID: `WHR-CP-PUB-45-52`\n\n```text\nWHR-CP-PROFILE-45-52\nWHR-CP-PUB-45-52\n```', 'project phase 4');
write('docs/project-roadmap.md', project);

let programme = read('docs/country-pages/programme-roadmap.md');
programme = replaceRequired(programme, 'Current Work ID: WHR-CP-PROFILE-45-52\nNext working branch: country-profiles-45-52', 'Current Work ID: WHR-CP-PUB-45-52\nNext working branch: country-pages-45-52-publication-qa', 'programme current');
programme = replaceRequired(programme, 'profile_ready:    0\nnote_reviewed:    8', 'profile_ready:    8\nnote_reviewed:    0', 'programme counts');
programme = replaceRequired(programme, 'PR #323 completes Calendar Readiness decisions for entries 37-52, bringing the cumulative state to 52 countries and 70 system/source records. Profile v2 work for entries 45-52 is now active.', 'PR #323 completes Calendar Readiness decisions for entries 37-52. Profile v2 records for entries 45-52 are complete and publication QA is now active.', 'programme paragraph');
programme = replaceRequired(programme, '| `WHR-CP-PROFILE-45-52` | next | Add Profile v2 records and reach `profile_ready`. |\n| `WHR-CP-PUB-45-52` | planned | QA and publish sixteen routes after one final rendered preview. |', '| `WHR-CP-PROFILE-45-52` | complete | Added eight reviewed Profile v2 records and reached `profile_ready`. |\n| `WHR-CP-PUB-45-52` | next | QA and publish sixteen routes after one final rendered preview. |', 'programme wave');
write('docs/country-pages/programme-roadmap.md', programme);

let calendarCheck = read('scripts/check-calendar-contracts.mjs');
calendarCheck = replaceRequired(calendarCheck, "['Current Work ID: `WHR-CAL-BACKFILL-37-52`', 'Next Work ID: `WHR-CP-PROFILE-45-52`']", "['Current Work ID: `WHR-CP-PUB-45-52`', 'Next Work ID: `WHR-ST2-53-60`']", 'calendar roadmap check');
calendarCheck = replaceRequired(calendarCheck, "['WHR-CAL-BACKFILL-37-52', 'WHR-CP-PROFILE-45-52']", "['WHR-CP-PUB-45-52', 'WHR-ST2-53-60']", 'calendar start check');
write('scripts/check-calendar-contracts.mjs', calendarCheck);

let governanceCheck = read('scripts/check-project-governance-docs.mjs');
governanceCheck = replaceRequired(governanceCheck, "'Current Work ID: `WHR-CP-PROFILE-45-52`',\n    'Next Work ID: `WHR-CP-PUB-45-52`',", "'Current Work ID: `WHR-CP-PUB-45-52`',\n    'Next Work ID: `WHR-ST2-53-60`',", 'governance roadmap');
governanceCheck = replaceRequired(governanceCheck, "'START-HERE.md': ['WHR-CP-PROFILE-45-52', 'WHR-CP-PUB-45-52', 'calendar-readiness-registry.json'],", "'START-HERE.md': ['WHR-CP-PUB-45-52', 'WHR-ST2-53-60', 'calendar-readiness-registry.json'],", 'governance start');
governanceCheck = replaceRequired(governanceCheck, "console.log('CURRENT_WORK_ID: WHR-CP-PROFILE-45-52');\nconsole.log('NEXT_WORK_ID: WHR-CP-PUB-45-52');", "console.log('CURRENT_WORK_ID: WHR-CP-PUB-45-52');\nconsole.log('NEXT_WORK_ID: WHR-ST2-53-60');", 'governance logs');
write('scripts/check-project-governance-docs.mjs', governanceCheck);

let roadmapCheck = read('scripts/check-country-page-programme-roadmap.mjs');
roadmapCheck = replaceRequired(roadmapCheck, "'Current Work ID: WHR-CP-PROFILE-45-52',\n  'Next working branch: country-profiles-45-52',", "'Current Work ID: WHR-CP-PUB-45-52',\n  'Next working branch: country-pages-45-52-publication-qa',", 'roadmap check current');
roadmapCheck = replaceRequired(roadmapCheck, "console.log('CURRENT_WORK: entries 01-52 readiness closed; current Work ID WHR-CP-PROFILE-45-52');", "console.log('CURRENT_WORK: entries 45-52 profile-ready; current Work ID WHR-CP-PUB-45-52');", 'roadmap check log');
write('scripts/check-country-page-programme-roadmap.mjs', roadmapCheck);

console.log('APPLIED_COUNTRY_PROFILES_45_52 tracker=profile_ready current=WHR-CP-PUB-45-52 next=WHR-ST2-53-60');
