const fs = require('node:fs');

const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, s) => fs.writeFileSync(p, s.endsWith('\n') ? s : `${s}\n`);

const slugs = ['russia','namibia','nigeria','belize','colombia','lithuania','estonia','guyana'];
const remarks = {
  russia: 'Published after rendered-preview approval; Rostov-only official-link treatment retained at public ceiling C.',
  namibia: 'Published after rendered-preview approval; official sport-governance context remains link-only and national racing coverage unresolved.',
  nigeria: 'Published after rendered-preview approval; federation route remains link-only until stable upcoming meeting rows are published.',
  belize: 'Published after rendered-preview approval; bounded C-level meeting-date and venue guidance retained.',
  colombia: 'Published after rendered-preview approval; regulatory context retained and current-calendar output remains blocked.',
  lithuania: 'Published after rendered-preview approval; bounded C-level trotting meeting-date and venue guidance retained.',
  estonia: 'Published after rendered-preview approval; bounded C-level Tuula meeting-date and venue guidance retained.',
  guyana: 'Published after rendered-preview approval; legal-context treatment retained and current-calendar output remains blocked.',
};

{
  const p = 'docs/country-pages/98-country-tracker.tsv';
  const lines = read(p).trimEnd().split(/\r?\n/);
  const headers = lines[0].split('\t');
  const ix = Object.fromEntries(headers.map((h, i) => [h, i]));
  const rows = lines.slice(1).map((line) => line.split('\t'));
  for (const row of rows) {
    const slug = row[ix.slug];
    if (!slugs.includes(slug)) continue;
    row[ix.programme_status] = 'published';
    row[ix.en_route_status] = 'published';
    row[ix.ja_route_status] = 'published';
    row[ix.qa_status] = 'passed';
    row[ix.page_published_at] = '2026-06-30';
    row[ix.remarks] = remarks[slug];
  }
  write(p, [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n'));
}

{
  const p = 'START-HERE.md';
  let s = read(p);
  s = s.replace(/Previous completed Work ID: `[^`]+`[\s\S]*?Next Work ID:\n\n```text\n[^\n]+\n```/,
`Previous completed Work ID: \`WHR-PUB-69-76\`

Current Work ID:

\`\`\`text
WHR-ST2-77-84
\`\`\`

Next Work ID:

\`\`\`text
WHR-NOTE-77-84
\`\`\``);
  write(p, s);
}

{
  const p = 'docs/project-roadmap.md';
  let s = read(p);
  s = s.replace('Current Work ID: `WHR-PUB-69-76`', 'Current Work ID: `WHR-ST2-77-84`');
  s = s.replace('Next Work ID: `WHR-ST2-77-84`', 'Next Work ID: `WHR-NOTE-77-84`');
  s = s.replace('published country pages:       68', 'published country pages:       76');
  s = s.replace('profile_ready:                  8', 'profile_ready:                  0');
  s = s.replace('published routes:              68 EN + 68 JA = 136', 'published routes:              76 EN + 76 JA = 152');
  s = s.replace('- entries 61-68 are published after the approved rendered preview.', '- entries 61-68 are published after the approved rendered preview;\n- entries 69-76 are published after the approved rendered preview.');
  s = s.replace('Completed: `WHR-PROFILE-69-76` via PR #337 with eight reviewed bilingual Profile v2 records and complete English/Japanese routes.\n\nCurrent Work ID: `WHR-PUB-69-76`',
    'Completed: `WHR-PROFILE-69-76` via PR #338 with eight reviewed bilingual Profile v2 records and complete English/Japanese routes.\n\nCompleted: `WHR-PUB-69-76` via PR #340 after rendered-preview approval.\n\nCurrent Work ID: `WHR-ST2-77-84`');
  write(p, s);
}

{
  const p = 'docs/country-pages/programme-roadmap.md';
  let s = read(p);
  s = s.replace(/Latest completed Source Test v2 change:[\s\S]*?Final release gate: WHR-AUDIT-COUNTRY-CALENDAR-98/,
`Latest completed Source Test v2 change: PR #335 — entries 69-76
Latest completed reviewed-note change: PR #336 — entries 69-76
Latest completed Profile v2 change: PR #338 — entries 69-76
Latest country publication: PR #340 — entries 69-76 approved after rendered preview
Publication gate: PR #340 — entries 69-76 published after approved rendered preview
Current Work ID: WHR-ST2-77-84
Next working branch: source-test-v2-77-84
Final release gate: WHR-AUDIT-COUNTRY-CALENDAR-98`);
  s = s.replace('Current tracker counts after Profile v2 69-76:', 'Current tracker counts after publication 69-76:');
  s = s.replace('published:       68', 'published:       76');
  s = s.replace('profile_ready:    8', 'profile_ready:    0');
  s = s.replace('formally published English routes:   68', 'formally published English routes:   76');
  s = s.replace('formally published Japanese routes:  68', 'formally published Japanese routes:  76');
  s = s.replace('formally published total routes:    136', 'formally published total routes:    152');
  s = s.replace('profile-ready English routes:           8', 'profile-ready English routes:           0');
  s = s.replace('profile-ready Japanese routes:          8', 'profile-ready Japanese routes:          0');
  s = s.replace('profile-ready total routes:            16', 'profile-ready total routes:             0');
  s = s.replace('PR #337 completes reviewed bilingual Profile v2 records for entries 69-76. QA and publication work for entries 69-76 is now active.',
    'PR #340 publishes entries 69-76 after successful rendered-preview QA. Source Test v2 for entries 77-84 is now active.');
  s = s.replace('| #337 | Profile v2 | Added reviewed bilingual Profile v2 records and complete English/Japanese routes for entries 69-76. |',
    '| #337 | closed, superseded | Replaced by clean Profile v2 PR #338 after stacked-history recovery. |\n| #338 | Profile v2 | Added reviewed bilingual Profile v2 records and complete English/Japanese routes for entries 69-76. |\n| #339 | preview-only | Ran rendered QA for entries 69-76; not merged. |\n| #340 | publication | Published entries 69-76 after rendered-preview approval. |');
  s = s.replace('| #337 / `WHR-PROFILE-69-76` | complete | Added eight reviewed bilingual Profile v2 records and complete English/Japanese routes. |\n| `WHR-PUB-69-76` | active | Run rendered-preview QA and publish all sixteen routes. |',
    '| #338 / `WHR-PROFILE-69-76` | complete | Added eight reviewed bilingual Profile v2 records and complete English/Japanese routes. |\n| #340 / `WHR-PUB-69-76` | complete | Published all sixteen routes after successful rendered-preview QA. |');
  s = s.replace('| 69-76 | `WHR-ST2-69-76` complete | `WHR-NOTE-69-76` complete | `WHR-PROFILE-69-76` complete | `WHR-PUB-69-76` active |',
    '| 69-76 | `WHR-ST2-69-76` complete | `WHR-NOTE-69-76` complete | `WHR-PROFILE-69-76` complete | `WHR-PUB-69-76` complete |');
  s = s.replace('### PR #340 — full programme audit\n\nPR #340 adds no new country scope.',
    '### Work ID `WHR-AUDIT-COUNTRY-CALENDAR-98` — full programme audit\n\nThe final audit adds no new country scope. Its eventual PR number is assigned only when that work begins.');
  s = s.replace('The programme closes only after PR #340 is merged and the tracker reports 98 published rows.',
    'The programme closes only after `WHR-AUDIT-COUNTRY-CALENDAR-98` is merged and the tracker reports 98 published rows.');
  write(p, s);
}

{
  const p = 'scripts/check-country-page-programme.mjs';
  let s = read(p);
  s = s.replace("'slovenia', 'croatia', 'dominican-republic', 'tunisia', 'lebanon', 'libya', 'mainland-china', 'indonesia'\n];",
    "'slovenia', 'croatia', 'dominican-republic', 'tunisia', 'lebanon', 'libya', 'mainland-china', 'indonesia',\n  'russia', 'namibia', 'nigeria', 'belize', 'colombia', 'lithuania', 'estonia', 'guyana'\n];");
  s = s.replace('{ published: 68, profile_ready: 8, source_tested: 0, note_reviewed: 0, page_qa: 0, not_started: 22 }',
    '{ published: 76, profile_ready: 0, source_tested: 0, note_reviewed: 0, page_qa: 0, not_started: 22 }');
  s = s.replace('PROGRAMME_COUNTS: published=68 page_qa=0 profile_ready=8 source_tested=0 note_reviewed=0 not_started=22',
    'PROGRAMME_COUNTS: published=76 page_qa=0 profile_ready=0 source_tested=0 note_reviewed=0 not_started=22');
  write(p, s);
}
{
  const p = 'scripts/check-country-page-programme-roadmap.mjs';
  let s = read(p);
  s = s.replace("['Current Work ID: WHR-PUB-69-76', 'Next working branch: country-publish-69-76', 'Latest completed Source Test v2 change: PR #335', 'Latest completed reviewed-note change: PR #336', 'Latest completed Profile v2 change: PR #337', 'Publication gate: PR #333', 'Final release gate: WHR-AUDIT-COUNTRY-CALENDAR-98', 'tracker rows exactly 98', 'bilingual routes exactly 196']",
    "['Current Work ID: WHR-ST2-77-84', 'Next working branch: source-test-v2-77-84', 'Latest completed Source Test v2 change: PR #335', 'Latest completed reviewed-note change: PR #336', 'Latest completed Profile v2 change: PR #338', 'Latest country publication: PR #340', 'Publication gate: PR #340', 'Final release gate: WHR-AUDIT-COUNTRY-CALENDAR-98', 'tracker rows exactly 98', 'bilingual routes exactly 196']");
  s = s.replace('entries 69-76 profile-ready; current Work ID WHR-PUB-69-76', 'entries 69-76 published; current Work ID WHR-ST2-77-84');
  write(p, s);
}
{
  const p = 'scripts/check-project-governance-docs.mjs';
  let s = read(p);
  s = s.replace("['WHR-PROFILE-69-76', 'WHR-PUB-69-76', 'WHR-ST2-77-84']", "['WHR-PUB-69-76', 'WHR-ST2-77-84', 'WHR-NOTE-77-84']");
  s = s.replace("['Current Work ID: `WHR-PUB-69-76`', 'Next Work ID: `WHR-ST2-77-84`", "['Current Work ID: `WHR-ST2-77-84`', 'Next Work ID: `WHR-NOTE-77-84`");
  s = s.replace('CURRENT_WORK_ID: WHR-PUB-69-76', 'CURRENT_WORK_ID: WHR-ST2-77-84');
  s = s.replace('NEXT_WORK_ID: WHR-ST2-77-84', 'NEXT_WORK_ID: WHR-NOTE-77-84');
  write(p, s);
}
{
  const p = 'scripts/check-calendar-contracts.mjs';
  let s = read(p);
  s = s.replace("['Current Work ID: `WHR-PUB-69-76`', 'Next Work ID: `WHR-ST2-77-84`']", "['Current Work ID: `WHR-ST2-77-84`', 'Next Work ID: `WHR-NOTE-77-84`']");
  s = s.replace("['WHR-PROFILE-69-76', 'WHR-PUB-69-76', 'WHR-ST2-77-84']", "['WHR-PUB-69-76', 'WHR-ST2-77-84', 'WHR-NOTE-77-84']");
  s = s.replace('CURRENT_WORK_ID: WHR-PUB-69-76', 'CURRENT_WORK_ID: WHR-ST2-77-84');
  s = s.replace('NEXT_WORK_ID: WHR-ST2-77-84', 'NEXT_WORK_ID: WHR-NOTE-77-84');
  write(p, s);
}

{
  let s = read('scripts/check-country-page-publication-61-68.mjs');
  s = s.replaceAll('61-68', '69-76').replaceAll('61_68', '69_76');
  s = s.replace("['61', 'slovenia'],\n  ['62', 'croatia'],\n  ['63', 'dominican-republic'],\n  ['64', 'tunisia'],\n  ['65', 'lebanon'],\n  ['66', 'libya'],\n  ['67', 'mainland-china'],\n  ['68', 'indonesia'],",
    "['69', 'russia'],\n  ['70', 'namibia'],\n  ['71', 'nigeria'],\n  ['72', 'belize'],\n  ['73', 'colombia'],\n  ['74', 'lithuania'],\n  ['75', 'estonia'],\n  ['76', 'guyana'],");
  s = s.replace("for (const slug of ['slovenia', 'lebanon', 'libya'])", "for (const slug of ['russia', 'namibia', 'nigeria', 'colombia', 'guyana'])");
  s = s.replace("for (const slug of ['croatia', 'dominican-republic', 'tunisia', 'indonesia'])", "for (const slug of ['belize', 'lithuania', 'estonia'])");
  s = s.replace("if (!profiles.get('mainland-china')?.calendar_guidance_en?.includes('Do not create current meeting rows')) fail('mainland-china must retain current-calendar hold guidance');",
    "for (const slug of ['colombia', 'guyana']) {\n  if (!profiles.get(slug)?.calendar_guidance_en?.includes('do not add current meeting rows')) fail(`${slug} must retain current-calendar hold guidance`);\n}");
  write('scripts/check-country-page-publication-69-76.mjs', s);
}

fs.mkdirSync('docs/runbooks', { recursive: true });
write('docs/runbooks/rendered-preview-69-76-evidence.json', JSON.stringify({
  work_id: 'WHR-PUB-69-76',
  preview_pr: 339,
  preview_branch: 'preview-country-pages-69-76',
  preview_head: '0f084cd65e9dfce48ec422375ba2a86cec9da149',
  rendered_run_id: 28420131078,
  rendered_job_id: 84211300489,
  artifact_id: 7970924909,
  artifact_name: 'rendered-preview-69-76',
  artifact_digest: 'sha256:856882e1088dcc002628b4f988d691c7fec5c6165e51aa20f087eba4c0b799d9',
  checked_at: '2026-06-30T04:24:46.242Z',
  routes: 16,
  viewport_checks: 32,
  representative_screenshots: 16,
  representatives: ['russia','belize','colombia','estonia'],
  viewports: [{id:'desktop',width:1440,height:1200},{id:'pixel-7',width:412,height:915}],
  errors: 0,
  result: 'passed',
  cloudflare_external_deployment_id: null,
  cloudflare_note: 'No external deployment identifier was exposed through the connected GitHub checks; the same publication tree passed local production-preview rendered QA in GitHub Actions.'
}, null, 2));

write('docs/runbooks/country-pages-69-76-publication-final.md', `# Country pages 69-76 publication final

Status: ready to publish  
Work ID: \`WHR-PUB-69-76\`  
PR: #340  
Publication date: 2026-06-30

## Result

- 8 English routes
- 8 Japanese routes
- 76 published countries/regions
- 152 published bilingual routes
- every public display ceiling remains C

## Rendered QA

- Preview PR: #339
- Preview head: \`0f084cd65e9dfce48ec422375ba2a86cec9da149\`
- GitHub Actions run: \`28420131078\`
- Artifact: \`rendered-preview-69-76\` / \`7970924909\`
- Digest: \`sha256:856882e1088dcc002628b4f988d691c7fec5c6165e51aa20f087eba4c0b799d9\`
- 16 routes, 32 viewport checks, 16 screenshots, 0 errors

Russia, Belize, Colombia, and Estonia passed English/Japanese desktop and Pixel 7 screenshot capture. All routes returned HTTP 200 with one H1, no horizontal overflow, no embedded media, an official external link, language switching, an empty-state safeguard, and no C-level start-time or timezone table headers.

## Boundary notes

- Russia, Namibia, and Nigeria remain official-link-first.
- Belize, Lithuania, and Estonia retain bounded C-level meeting-date and venue guidance.
- Colombia and Guyana remain blocked from current-calendar rows.
- No runners, participants, odds, results, payouts, complete racecards, embedded video, or direct-stream output is introduced.

## Next

\`WHR-ST2-77-84\`
`);

write('.github/workflows/country-page-publication-69-76.yml', `name: Country page publication 69-76

on:
  pull_request:
    paths:
      - 'START-HERE.md'
      - 'docs/project-roadmap.md'
      - 'docs/country-pages/**'
      - 'docs/calendar/**'
      - 'docs/governance/**'
      - 'docs/runbooks/country-pages-69-76-publication-final.md'
      - 'docs/runbooks/rendered-preview-69-76-evidence.json'
      - 'data/static/country-page-countries-69-76.json'
      - 'data/static/country-page-sources-69-76.json'
      - 'data/static/country-profiles-v2-6*.json'
      - 'data/static/country-profiles-v2-7*.json'
      - 'src/**'
      - 'scripts/check-country-page-publication-69-76.mjs'
      - 'scripts/check-country-profiles-69-76.mjs'
      - 'scripts/check-country-detail-profile-runtime.mjs'
      - 'scripts/check-country-page-programme.mjs'
      - 'scripts/check-country-page-programme-roadmap.mjs'
      - 'scripts/check-project-governance-docs.mjs'
      - 'scripts/check-calendar-contracts.mjs'
      - '.github/workflows/country-page-publication-69-76.yml'
  push:
    branches: [main]

concurrency:
  group: \${{ github.workflow }}-\${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22.12.0
      - run: npm install
      - run: npm run build
      - run: node scripts/check-country-page-publication-69-76.mjs
      - run: node scripts/check-country-profiles-69-76.mjs
      - run: node scripts/check-country-detail-profile-runtime.mjs
      - run: node scripts/check-country-page-programme.mjs
      - run: node scripts/check-country-page-programme-roadmap.mjs
      - run: node scripts/check-project-governance-docs.mjs
      - run: node scripts/check-calendar-contracts.mjs
`);
