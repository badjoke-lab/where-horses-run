import fs from 'node:fs';

function replaceExact(file, before, after) {
  const original = fs.readFileSync(file, 'utf8');
  if (!original.includes(before)) throw new Error(`${file}: expected source block not found`);
  const updated = original.replace(before, after);
  fs.writeFileSync(file, updated);
}

replaceExact(
  'README.md',
  `## Development status

Active development.

Current formally published country-page scope:

\`\`\`text
68 English routes
68 Japanese routes
136 published bilingual routes
\`\`\`

The current programme is completing 98 English and 98 Japanese country/region routes while also recording Calendar Readiness for each reviewed racing system and official source.
The repository already contains Calendar, Today, Tomorrow, timetable view models, generated data, candidate/promotion foundations, and source-specific work. These are being reconciled into a maintained calendar pipeline rather than replaced by a parallel implementation.`,
  `## Development status

Active development.

Current formally published country-page scope:

\`\`\`text
98 English routes
98 Japanese routes
196 published bilingual routes
\`\`\`

The 98-country/region country-page programme and Calendar Readiness backfill are complete. JRA and NAR source pilots, the Acquisition Control Plane foundation, and Banei bounded operational integration are complete. The current source-specific Work ID is \`WHR-CAL-HONG-KONG-HKJC\`; \`WHR-CAL-UAE-ERA\` follows after the HKJC pilot handoff boundary is explicitly reviewed.
The repository contains Calendar, Today, Tomorrow, timetable view models, generated data, candidate/promotion foundations, shared acquisition/review control-plane contracts, and source-specific pilot implementations. Scheduled acquisition execution and unattended publication remain disabled unless separately approved.`
);

replaceExact(
  'START-HERE.md',
  'Last reviewed: 2026-07-08',
  'Last reviewed: 2026-07-10'
);

replaceExact(
  'START-HERE.md',
  `Completed Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`
Current Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`
Next source-specific Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\``,
  `Completed Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`
Completed Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`
Completed Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`
Current Work ID: \`WHR-CAL-HONG-KONG-HKJC\`
Next source-specific Work ID: \`WHR-CAL-UAE-ERA\``
);

replaceExact(
  'START-HERE.md',
  `## Active sequence

\`\`\`text
1. add Collection Result Manifest
2. add Review Queue
3. add Rank-aware Retry Queue
4. connect Actions and local runners to shared job semantics
5. begin Banei on the shared foundation
6. add Actions multi-job execution
7. add local multi-job execution
8. add review cohort planner
9. add automatic review PR preparation
10. add due-job planning and scheduled bounded retries
11. add Operations v2 operator view
\`\`\``,
  `## Active sequence

\`\`\`text
1. complete HKJC-PILOT-04 fixture route and parser resilience reconciliation
2. repeat bounded HKJC shared-Actions live evidence
3. explicitly review HKJC Registry activation boundary
4. keep HKJC detail-source/A+ programme-summary activation separate until evidence exists
5. hand off the source-specific sequence to WHR-CAL-UAE-ERA after HKJC review closure
\`\`\`

The Acquisition Control Plane foundation, Actions/local multi-job runners, Review Queue, Rank-aware Retry Queue, review cohort planning, review PR package preparation, Due-job planning, artifact-only scheduled planning, and Operations v2 are already implemented. Scheduled acquisition execution and unattended publication remain disabled.`
);

replaceExact(
  'docs/calendar/implementation-roadmap.md',
  `Status: JRA and NAR source pilots complete; Acquisition Control Plane complete; Banei operational integration current
Completed Work ID: \`WHR-CAL-JAPAN-JRA-A-PLUS\`  
Completed Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`  
Completed Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`
Current Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`
Next source Work ID: \`WHR-CAL-HONG-KONG-HKJC\``,
  `Status: JRA and NAR source pilots complete; Acquisition Control Plane complete; Banei operational handoff accepted; HKJC pilot current
Completed Work ID: \`WHR-CAL-JAPAN-JRA-A-PLUS\`  
Completed Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`  
Completed Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`
Completed Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`
Current Work ID: \`WHR-CAL-HONG-KONG-HKJC\`
Next source Work ID: \`WHR-CAL-UAE-ERA\``
);

console.log('CURRENT_DEVELOPMENT_ENTRYPOINT_SYNC: applied');
