import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const resolve = (file) => path.join(root, file);
const read = (file) => fs.readFileSync(resolve(file), 'utf8');
const write = (file, value) => fs.writeFileSync(resolve(file), value);
const replaceOnce = (text, before, after, label) => {
  if (text.includes(after) && !text.includes(before)) return text;
  const count = text.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one occurrence, found ${count}`);
  return text.replace(before, after);
};

const entries = [
  ['61', 'slovenia', 'Reviewed bilingual Profile v2 completed; link-only calendar treatment retained at public ceiling C.'],
  ['62', 'croatia', 'Reviewed bilingual Profile v2 completed; Zagreb-only manual calendar scope retained at public ceiling C.'],
  ['63', 'dominican-republic', 'Reviewed bilingual Profile v2 completed; Hipódromo V Centenario single-racecourse scope retained.'],
  ['64', 'tunisia', 'Reviewed bilingual Profile v2 completed; manual confirmation and partial national coverage retained.'],
  ['65', 'lebanon', 'Reviewed bilingual Profile v2 completed; authority context remains link-only without a current calendar.'],
  ['66', 'libya', 'Reviewed bilingual Profile v2 completed; official racing route remains link-only without a current calendar.'],
  ['67', 'mainland-china', 'Reviewed bilingual Profile v2 completed; Conghua current-calendar output remains on hold.'],
  ['68', 'indonesia', 'Reviewed bilingual Profile v2 completed; PORDASI manual calendar treatment retained at public ceiling C.'],
];

const trackerPath = 'docs/country-pages/98-country-tracker.tsv';
const lines = read(trackerPath).trimEnd().split(/\r?\n/);
const headers = lines[0].split('\t');
const index = Object.fromEntries(headers.map((name, position) => [name, position]));
const rows = lines.slice(1).map((line) => line.split('\t'));
for (const [deliveryNo, slug, remark] of entries) {
  const row = rows.find((candidate) => candidate[index.delivery_no] === deliveryNo);
  if (!row || row[index.slug] !== slug) throw new Error(`tracker mismatch: ${deliveryNo}-${slug}`);
  row[index.programme_status] = 'profile_ready';
  row[index.profile_status] = 'reviewed';
  row[index.en_route_status] = 'complete';
  row[index.ja_route_status] = 'complete';
  row[index.qa_status] = 'not_started';
  row[index.profile_last_reviewed] = '2026-06-29';
  row[index.page_published_at] = '';
  row[index.remarks] = remark;
}
write(trackerPath, `${[headers.join('\t'), ...rows.map((row) => row.join('\t'))].join('\n')}\n`);

let value = read('START-HERE.md');
value = replaceOnce(value, 'Previous completed Work ID: `WHR-NOTE-61-68`', 'Previous completed Work ID: `WHR-PROFILE-61-68`', 'START previous');
value = replaceOnce(value,
  'WHR-PROFILE-61-68\n```\n\nNext Work ID:\n\n```text\nWHR-PUB-61-68',
  'WHR-PUB-61-68\n```\n\nNext Work ID:\n\n```text\nWHR-ST2-69-76',
  'START IDs');
write('START-HERE.md', value);

value = read('docs/project-roadmap.md');
value = replaceOnce(value,
  'Current Work ID: `WHR-PROFILE-61-68`  \nNext Work ID: `WHR-PUB-61-68`',
  'Current Work ID: `WHR-PUB-61-68`  \nNext Work ID: `WHR-ST2-69-76`',
  'project IDs');
value = replaceOnce(value,
  'profile_ready:                  0\nnote_reviewed:                  8\nsource_tested:                  0\nnot_started:                   30',
  'profile_ready:                  8\nnote_reviewed:                  0\nsource_tested:                  0\nnot_started:                   30',
  'project counts');
value = replaceOnce(value,
  'Completed: `WHR-ST2-61-68` via PR #330 and `WHR-NOTE-61-68` via PR #331.\n\nCurrent Work ID: `WHR-PROFILE-61-68`',
  'Completed: `WHR-ST2-61-68` via PR #330, `WHR-NOTE-61-68` via PR #331, and `WHR-PROFILE-61-68` via PR #332.\n\nCurrent Work ID: `WHR-PUB-61-68`',
  'project phase');
write('docs/project-roadmap.md', value);

write('docs/runbooks/country-profiles-61-68.md', `# Country Profile v2 — entries 61-68\n\nStatus: complete  \nWork ID: \`WHR-PROFILE-61-68\`  \nPR: #332  \nDeployment: not required\n\n## Result\n\n- 8 country records\n- 8 official source records\n- 8 reviewed bilingual Profile v2 records\n- 16 complete English/Japanese routes\n- tracker transition: \`note_reviewed\` to \`profile_ready\`\n- every country public display ceiling remains C\n\n## Retained boundaries\n\n- Slovenia, Lebanon, and Libya remain link-only.\n- Mainland China remains on hold for current-calendar rows.\n- Croatia, Tunisia, and Indonesia retain manual confirmation.\n- Dominican Republic remains limited to Hipódromo V Centenario.\n\n## Next\n\n\`WHR-PUB-61-68\`\n`);

console.log('APPLIED_PROFILE_TRACKER_61_68 profile_ready=8 current=WHR-PUB-61-68');
