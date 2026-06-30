import fs from 'node:fs';
import { transitionFiles } from './compact-data.mjs';

const read = (file) => fs.readFileSync(file, 'utf8');
const write = (file, content) => {
  const directory = file.includes('/') ? file.slice(0, file.lastIndexOf('/')) : '.';
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(file, content);
};

let projectRoadmap = read('docs/project-roadmap.md');
projectRoadmap = projectRoadmap.replace(
  'Status: active canonical project roadmap',
  'Status: active canonical project roadmap  \nCountry-page programme: complete'
);
projectRoadmap = projectRoadmap.replace(/Current Work ID: `[^`]+`/, 'Current Work ID: `WHR-CALENDAR-MAINTENANCE`');
projectRoadmap = projectRoadmap.replace(/Next Work ID: `[^`]+`/, 'Next Work ID: `WHR-CALENDAR-MAINTENANCE`');
projectRoadmap = projectRoadmap.replace(
  /## Current position[\s\S]*?## Governing rules/,
  `## Current position

\`\`\`text
published country pages:       98
published routes:              98 EN + 98 JA = 196
Profile v2 records:            98
Calendar Readiness countries:  98
Calendar Readiness records:   116
Authority/source records:     116
country-page programme: complete
\`\`\`

The 98-country bilingual publication programme and its final canonical audit are complete. Transition overlays remain as historical evidence; active state is read from the canonical tracker and registries.

The Calendar acquisition layer remains a separate continuing programme. A closed readiness decision does not claim that a live adapter, parser, or scheduled fetch is implemented.

## Governing rules`
);
write('docs/project-roadmap.md', projectRoadmap);

let programmeRoadmap = read('docs/country-pages/programme-roadmap.md');
programmeRoadmap = programmeRoadmap.replace('Status: active canonical roadmap', 'Status: complete canonical roadmap');
programmeRoadmap = programmeRoadmap.replace(
  /## 2\. Current position[\s\S]*?## 3\. Operating model/,
  `## 2. Current position

\`\`\`text
Latest completed Source Test v2 change: PR #352 — entries 93-98
Latest completed reviewed-note change: PR #353 — entries 93-98
Latest completed Profile v2 change: PR #354 — entries 93-98
Latest country publication: PR #356 — entries 93-98
Completed Work ID: WHR-AUDIT-98
Next operating phase: WHR-CALENDAR-MAINTENANCE
Final release gate: passed
\`\`\`

Canonical tracker counts:

\`\`\`text
published:       98
page_qa:          0
profile_ready:    0
note_reviewed:    0
source_tested:    0
not_started:      0
total:           98
\`\`\`

Canonical route state:

\`\`\`text
published English routes:    98
published Japanese routes:   98
published total routes:     196
bilingual routes exactly 196
\`\`\`

The country-page programme is complete. Historical transition files remain for audit evidence but are no longer the active state source.

## 3. Operating model`
);
write('docs/country-pages/programme-roadmap.md', programmeRoadmap);

write('START-HERE.md', `# Where Horses Run — current development entry point

Status: active entry point  
Last reviewed: 2026-06-30

Read documents in this order:

1. [\`docs/governance/document-authority.md\`](docs/governance/document-authority.md)
2. [\`docs/project-roadmap.md\`](docs/project-roadmap.md)
3. [\`docs/operations/deployment-and-ci-policy.md\`](docs/operations/deployment-and-ci-policy.md)

Country-page programme:

4. [\`docs/country-pages/programme-roadmap.md\`](docs/country-pages/programme-roadmap.md)
5. [\`docs/country-pages/completion-contract.md\`](docs/country-pages/completion-contract.md)
6. [\`docs/country-pages/98-country-tracker.tsv\`](docs/country-pages/98-country-tracker.tsv)
7. [\`docs/runbooks/final-country-calendar-audit-98.md\`](docs/runbooks/final-country-calendar-audit-98.md)

Calendar work:

4. [\`docs/calendar/README.md\`](docs/calendar/README.md)
5. [\`docs/calendar/source-test-v2-contract.md\`](docs/calendar/source-test-v2-contract.md)
6. [\`docs/calendar/calendar-readiness-contract.md\`](docs/calendar/calendar-readiness-contract.md)
7. [\`docs/calendar/machine-readable-contracts.md\`](docs/calendar/machine-readable-contracts.md)
8. [\`docs/calendar/implementation-roadmap.md\`](docs/calendar/implementation-roadmap.md)
9. [\`docs/calendar/current-baseline-audit.md\`](docs/calendar/current-baseline-audit.md)

Machine-readable Calendar files:

\`\`\`text
data/static/authority-source-inventory.json
data/static/source-test-v2.schema.json
data/static/calendar-readiness.schema.json
data/static/calendar-readiness-registry.json
scripts/check-calendar-contracts.mjs
\`\`\`

Previous completed Work ID: \`WHR-AUDIT-98\`

Current Work ID:

\`\`\`text
WHR-CALENDAR-MAINTENANCE
\`\`\`

The 98-country bilingual page programme is complete at 98 English and 98 Japanese routes. Calendar acquisition and refresh implementation remain a separate continuing workstream.
`);

write(
  'docs/country-pages/transition-overlays-archive.md',
  `# Country programme transition overlays

Status: historical audit evidence  
Canonicalized by: \`WHR-AUDIT-98\`  
Date: 2026-06-30

The transition files listed below remain in the repository as immutable work-history evidence. Active programme state is read directly from \`docs/country-pages/98-country-tracker.tsv\`.

${transitionFiles.map((file) => `- \`${file}\``).join('\n')}

Do not apply these overlays to derive the current programme state after the final audit. They may still be used by archived wave validators when \`WHR_RUN_LEGACY_WAVE_VALIDATORS=1\` is explicitly set.
`
);

write('docs/runbooks/final-country-calendar-audit-98.md', `# Final country and Calendar audit — 98

Status: complete for review  
Work ID: \`WHR-AUDIT-98\`  
Date: 2026-06-30

## Canonical result

- 98 country and region tracker rows
- 98 published English routes
- 98 published Japanese routes
- 196 published routes total
- 98 Profile v2 records
- 116 canonical authority/source inventory records
- 116 canonical Calendar Readiness records
- 98 countries with closed Calendar Readiness decisions

## Canonicalization

- Applied all tracker transition overlays to the canonical tracker.
- Consolidated authority/source reference overlays into \`authority-source-inventory.json\`.
- Consolidated Source Test v2 decisions into \`calendar-readiness-registry.json\`.
- Promoted entries 77-98 into canonical \`src/lib/data.ts\` imports.
- Archived wave validators behind an explicit legacy opt-in.
- Removed build-time dependence on Profile loader mutation.
- Updated roadmap, entry-point, governance, and Calendar contract checks to the completed state.

## Public boundary

This audit does not raise any Technical Rank or Public Ceiling. Prohibited participant, betting, result, payout, complete-racecard, raw-source, embedded-video, and direct-stream fields remain excluded.

## Continuing work

Country-page publication is complete. Calendar acquisition, adapter implementation, refresh scheduling, candidate review, and recurring maintenance remain separate work under \`WHR-CALENDAR-MAINTENANCE\`.
`);

console.log('FINAL_AUDIT_98_DOCS_UPDATED');
