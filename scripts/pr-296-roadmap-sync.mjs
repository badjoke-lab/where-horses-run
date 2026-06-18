import fs from 'node:fs';

const file = 'docs/country-pages/programme-roadmap.md';
let text = fs.readFileSync(file, 'utf8');
const updates = [
  ['Merged through: PR #295', 'Merged through: PR #296'],
  ['Latest confirmed merge: PR #295', 'Latest confirmed merge: PR #296'],
  ['Working PR: #296', 'Working PR: #297'],
  ['Working branch: country-pages-13-20-publication-qa', 'Working branch: country-source-tests-21-28'],
  ['Next PR: #297', 'Next PR: #298'],
  ['published:       12', 'published:       20'],
  ['profile_ready:    8', 'profile_ready:    0'],
  ['formally published English routes:   12', 'formally published English routes:   20'],
  ['formally published Japanese routes:  12', 'formally published Japanese routes:  20'],
  ['formally published total routes:     24', 'formally published total routes:     40'],
  ['merged:        #284-#295 = 12 PRs', 'merged:        #284-#296 = 13 PRs'],
  ['in progress:   #296', 'in progress:   #297'],
  ['remaining after #296: #297-#337', 'remaining after #297: #298-#337'],
  ['| #296 | in progress |', '| #296 | merged |']
];
for (const [before, after] of updates) {
  if (!text.includes(before)) throw new Error(`missing roadmap marker: ${before}`);
  text = text.replace(before, after);
}
fs.writeFileSync(file, text);
