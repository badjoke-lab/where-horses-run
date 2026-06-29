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

const evidence = JSON.parse(read('docs/runbooks/rendered-preview-61-68-evidence.json'));
if (evidence.preview_branch !== 'preview-country-pages-61-68') throw new Error('preview branch mismatch');
if (evidence.preview_trigger_commit !== '2b639f460efc1278891c79661f10e287ceaa674c') throw new Error('preview commit mismatch');
if (evidence.rendered_check_run_id !== 28369320969 || evidence.artifact_id !== 7950774820 || evidence.errors !== 0) throw new Error('preview evidence mismatch');
if (!evidence.commit_checks?.every((check) => check.status === 'completed' && check.conclusion === 'success')) throw new Error('preview checks are not successful');

const entries = [
  ['61','slovenia','Published after rendered-preview approval; federation link-only treatment retained.'],
  ['62','croatia','Published after rendered-preview approval; Zagreb manual C-level scope retained.'],
  ['63','dominican-republic','Published after rendered-preview approval; Hipódromo V Centenario single-racecourse scope retained.'],
  ['64','tunisia','Published after rendered-preview approval; manual confirmation and partial national coverage retained.'],
  ['65','lebanon','Published after rendered-preview approval; authority context remains link-only.'],
  ['66','libya','Published after rendered-preview approval; official racing route remains link-only.'],
  ['67','mainland-china','Published after rendered-preview approval; current-calendar rows remain on hold pending an official Conghua calendar.'],
  ['68','indonesia','Published after rendered-preview approval; PORDASI manual calendar treatment retained.'],
];
const trackerPath = 'docs/country-pages/98-country-tracker.tsv';
const lines = read(trackerPath).trimEnd().split(/\r?\n/);
const headers = lines[0].split('\t');
const index = Object.fromEntries(headers.map((name, position) => [name, position]));
const rows = lines.slice(1).map((line) => line.split('\t'));
for (const [deliveryNo, slug, remark] of entries) {
  const row = rows.find((candidate) => candidate[index.delivery_no] === deliveryNo);
  if (!row || row[index.slug] !== slug) throw new Error(`tracker mismatch: ${deliveryNo}-${slug}`);
  row[index.programme_status] = 'published';
  row[index.en_route_status] = 'published';
  row[index.ja_route_status] = 'published';
  row[index.qa_status] = 'passed';
  row[index.page_published_at] = '2026-06-29';
  row[index.remarks] = remark;
}
write(trackerPath, `${[headers.join('\t'), ...rows.map((row) => row.join('\t'))].join('\n')}\n`);

let value = read('START-HERE.md');
value = replaceOnce(value, 'Previous completed Work ID: `WHR-PROFILE-61-68`', 'Previous completed Work ID: `WHR-PUB-61-68`', 'START previous');
value = replaceOnce(value,
  'WHR-PUB-61-68\n```\n\nNext Work ID:\n\n```text\nWHR-ST2-69-76',
  'WHR-ST2-69-76\n```\n\nNext Work ID:\n\n```text\nWHR-NOTE-69-76',
  'START IDs');
write('START-HERE.md', value);

value = read('docs/project-roadmap.md');
value = replaceOnce(value,
  'Current Work ID: `WHR-PUB-61-68`  \nNext Work ID: `WHR-ST2-69-76`',
  'Current Work ID: `WHR-ST2-69-76`  \nNext Work ID: `WHR-NOTE-69-76`',
  'project IDs');
value = replaceOnce(value,
  'published country pages:       60\npage_qa:                        8\nprofile_ready:                  0\nnote_reviewed:                  0\nsource_tested:                  0\nnot_started:                   30\ntotal countries/regions:       98\npublished routes:              60 EN + 60 JA = 120',
  'published country pages:       68\npage_qa:                        0\nprofile_ready:                  0\nnote_reviewed:                  0\nsource_tested:                  0\nnot_started:                   30\ntotal countries/regions:       98\npublished routes:              68 EN + 68 JA = 136',
  'project counts');
value = replaceOnce(value,
  '- entries 53-60 are published after the approved rendered preview;\n- entries 61-68 are in publication QA and require one final rendered preview.',
  '- entries 53-60 are published after the approved rendered preview;\n- entries 61-68 are published after the approved rendered preview.',
  'project publication state');
value = replaceOnce(value,
  'Completed: `WHR-ST2-61-68` via PR #330, `WHR-NOTE-61-68` via PR #331, and `WHR-PROFILE-61-68` via PR #332.\n\nCurrent Work ID: `WHR-PUB-61-68`',
  'Completed: `WHR-ST2-61-68` via PR #330, `WHR-NOTE-61-68` via PR #331, `WHR-PROFILE-61-68` via PR #332, and `WHR-PUB-61-68` via PR #333 after rendered-preview approval.\n\nCurrent Work ID: `WHR-ST2-69-76`',
  'project phase');
write('docs/project-roadmap.md', value);

write('docs/runbooks/country-pages-61-68-publication-final.md', `# Country page publication — entries 61-68\n\nStatus: ready for merge after rendered-preview approval  \nWork ID: \`WHR-PUB-61-68\`  \nPR: #333  \nPublication date: 2026-06-29\n\n## Scope\n\nSlovenia, Croatia, Dominican Republic, Tunisia, Lebanon, Libya, Mainland China, and Indonesia are published in English and Japanese. Every country-level public ceiling remains C.\n\n## Rendered-preview evidence\n\n- preview branch: \`preview-country-pages-61-68\`\n- preview trigger commit: \`2b639f460efc1278891c79661f10e287ceaa674c\`\n- rendered check run: \`28369320969\`\n- Cloudflare Pages deployment: \`94121055-c2cf-4d21-bb32-16325e184a32\`\n- checked routes: 8 English + 8 Japanese\n- representative routes: Slovenia, Dominican Republic, Mainland China, and Indonesia\n- viewports: 1440x1200 and 412x915\n- artifact: \`rendered-preview-61-68\` / \`7950774820\`\n- digest: \`sha256:dbb5126e397cf026d23244b153d5029bebe37ddcf83cb2146d7a5e876ff32d00\`\n- errors: 0\n\nCanonical URLs, language alternates, H1 count, language switching, official links, empty states, CJK rendering, horizontal overflow, media exclusion, and C-level time-column suppression passed.\n\n## Boundaries retained\n\nSlovenia, Lebanon, and Libya remain link-only. Mainland China remains absent from current-calendar rows until an official Conghua calendar is reviewed. Croatia, Tunisia, and Indonesia retain manual confirmation. Dominican Republic remains limited to Hipódromo V Centenario. No runner, participant, odds, result, payout, full racecard, embedded video, or direct-stream output is introduced.\n\n## Deployment\n\nMerge PR #333 without \`[CF-Pages-Skip]\` so exactly one production deployment runs. Confirm the production check after deployment.\n\n## Next\n\n\`WHR-ST2-69-76\`\n`);
fs.rmSync(resolve('docs/runbooks/country-pages-61-68-publication-qa.md'), { force: true });
console.log('APPLIED_PUBLICATION_FINAL_TRACKER_61_68 published=68');
