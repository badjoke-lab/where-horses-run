import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, value) => fs.writeFileSync(path.join(root, file), value);
const patch = (file, replacements) => {
  let value = read(file);
  for (const [before, after, label] of replacements) {
    if (value.includes(after) && !value.includes(before)) continue;
    const count = value.split(before).length - 1;
    if (count !== 1) throw new Error(`${file} ${label}: expected one occurrence, found ${count}`);
    value = value.replace(before, after);
  }
  write(file, value);
};

patch('scripts/check-country-page-programme.mjs', [
  [
    '{ published: 60, profile_ready: 0, source_tested: 0, note_reviewed: 8, page_qa: 0, not_started: 30 }',
    '{ published: 60, profile_ready: 8, source_tested: 0, note_reviewed: 0, page_qa: 0, not_started: 30 }',
    'expected counts'
  ],
  [
    "console.log('PROGRAMME_COUNTS: published=60 page_qa=0 profile_ready=0 source_tested=0 note_reviewed=8 not_started=30');",
    "console.log('PROGRAMME_COUNTS: published=60 page_qa=0 profile_ready=8 source_tested=0 note_reviewed=0 not_started=30');",
    'count log'
  ]
]);

patch('scripts/check-calendar-contracts.mjs', [
  [
    "[paths.roadmap, roadmapText, ['Current Work ID: `WHR-PROFILE-61-68`', 'Next Work ID: `WHR-PUB-61-68`']]",
    "[paths.roadmap, roadmapText, ['Current Work ID: `WHR-PUB-61-68`', 'Next Work ID: `WHR-ST2-69-76`']]",
    'roadmap IDs'
  ],
  [
    "[paths.startHere, startHereText, ['WHR-PROFILE-61-68', 'WHR-PUB-61-68']]",
    "[paths.startHere, startHereText, ['WHR-PUB-61-68', 'WHR-ST2-69-76']]",
    'START IDs'
  ],
  [
    "console.log('CURRENT_WORK_ID: WHR-PROFILE-61-68');\nconsole.log('NEXT_WORK_ID: WHR-PUB-61-68');",
    "console.log('CURRENT_WORK_ID: WHR-PUB-61-68');\nconsole.log('NEXT_WORK_ID: WHR-ST2-69-76');",
    'logs'
  ]
]);

patch('scripts/check-project-governance-docs.mjs', [
  [
    "'Current Work ID: `WHR-PROFILE-61-68`',\n    'Next Work ID: `WHR-PUB-61-68`',",
    "'Current Work ID: `WHR-PUB-61-68`',\n    'Next Work ID: `WHR-ST2-69-76`',",
    'roadmap IDs'
  ],
  [
    "'START-HERE.md': ['WHR-PROFILE-61-68', 'WHR-PUB-61-68', 'calendar-readiness-registry.json'],",
    "'START-HERE.md': ['WHR-PUB-61-68', 'WHR-ST2-69-76', 'calendar-readiness-registry.json'],",
    'START IDs'
  ],
  [
    "console.log('CURRENT_WORK_ID: WHR-PROFILE-61-68');\nconsole.log('NEXT_WORK_ID: WHR-PUB-61-68');",
    "console.log('CURRENT_WORK_ID: WHR-PUB-61-68');\nconsole.log('NEXT_WORK_ID: WHR-ST2-69-76');",
    'logs'
  ]
]);

patch('scripts/check-country-page-programme-roadmap.mjs', [
  [
    'for (const pr of [284, 311, 316, 317, 319, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 340]) {',
    'for (const pr of [284, 311, 316, 317, 319, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 340]) {',
    'PR list'
  ],
  [
    "'Current Work ID: WHR-PROFILE-61-68',\n  'Next working branch: country-profiles-61-68',",
    "'Current Work ID: WHR-PUB-61-68',\n  'Next working branch: country-publish-61-68',",
    'current phrases'
  ],
  [
    "'Latest completed Profile v2 change: PR #328',",
    "'Latest completed Profile v2 change: PR #332',",
    'latest profile'
  ],
  [
    "console.log('KEY_PRS: 284,311,316,317,319,321,322,323,324,325,326,327,328,329,330,331,340');\nconsole.log('CURRENT_WORK: entries 61-68 note-reviewed; current Work ID WHR-PROFILE-61-68');",
    "console.log('KEY_PRS: 284,311,316,317,319,321,322,323,324,325,326,327,328,329,330,331,332,340');\nconsole.log('CURRENT_WORK: entries 61-68 profile-ready; current Work ID WHR-PUB-61-68');",
    'logs'
  ]
]);

console.log('APPLIED_PROFILE_GOVERNANCE_61_68');
