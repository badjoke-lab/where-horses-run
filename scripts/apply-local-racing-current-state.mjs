import { readFileSync, writeFileSync } from 'node:fs';

function replace(file, pairs) {
  let text = readFileSync(file, 'utf8');
  for (const [from, to] of pairs) {
    if (!text.includes(from)) throw new Error(`${file} missing marker: ${from.slice(0, 120)}`);
    text = text.replace(from, to);
  }
  writeFileSync(file, text);
}

replace('scripts/check-calendar-baseline-reconciliation.mjs', [
  ["'docs/calendar/implementation-roadmap.md':['Status: complete','Pipeline v1 status: complete','Dynamic Dates status: complete','Operations v1 status: complete','Current Work ID: `WHR-CAL-JAPAN-JRA`']", "'docs/calendar/implementation-roadmap.md':['Status: complete','Pipeline v1 status: complete','Dynamic Dates status: complete','Operations v1 status: complete','Current Work ID: `WHR-CAL-JAPAN-NAR`','Next Work ID: `WHR-CAL-JAPAN-BANEI`']"],
  ["'docs/project-roadmap.md':['Current Work ID: `WHR-CAL-JAPAN-JRA`','Completed Work ID: `WHR-CAL-OPS-V1`']", "'docs/project-roadmap.md':['Current Work ID: `WHR-CAL-JAPAN-NAR`','Next Work ID: `WHR-CAL-JAPAN-BANEI`','Completed Work ID: `WHR-CAL-OPS-V1`']"],
  ["'START-HERE.md':['Previous completed Work ID: `WHR-CAL-OPS-V1`','WHR-CAL-JAPAN-JRA','WHR-CAL-JAPAN-NAR']", "'START-HERE.md':['Previous completed implementation Work ID: `WHR-CAL-JAPAN-JRA`','WHR-CAL-JAPAN-NAR','WHR-CAL-JAPAN-BANEI']"],
  ["console.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-JRA');", "console.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-NAR');"],
  ["console.log('NEXT_WORK_ID: WHR-CAL-JAPAN-NAR');", "console.log('NEXT_WORK_ID: WHR-CAL-JAPAN-BANEI');"]
]);

replace('scripts/check-project-governance-docs.mjs', [
  ["['Previous completed Work ID: `WHR-CAL-OPS-V1`', 'WHR-CAL-JAPAN-JRA', 'WHR-CAL-JAPAN-NAR']", "['Previous completed implementation Work ID: `WHR-CAL-JAPAN-JRA`', 'WHR-CAL-JAPAN-NAR', 'WHR-CAL-JAPAN-BANEI']"],
  ["['Country-page programme: complete', 'Current Work ID: `WHR-CAL-JAPAN-JRA`', 'Completed Work ID: `WHR-CAL-OPS-V1`', 'WHR-CAL-BASELINE-RECONCILE', '98 EN + 98 JA = 196']", "['Country-page programme: complete', 'Current Work ID: `WHR-CAL-JAPAN-NAR`', 'Next Work ID: `WHR-CAL-JAPAN-BANEI`', 'Completed Work ID: `WHR-CAL-OPS-V1`', 'WHR-CAL-BASELINE-RECONCILE', '98 EN + 98 JA = 196']"],
  ["console.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-JRA');", "console.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-NAR');"],
  ["console.log('NEXT_WORK_ID: WHR-CAL-JAPAN-NAR');", "console.log('NEXT_WORK_ID: WHR-CAL-JAPAN-BANEI');"]
]);

replace('scripts/check-calendar-contracts.mjs', [
  ["[paths.roadmap, roadmapText, ['Country-page programme: complete', 'Current Work ID: `WHR-CAL-JAPAN-JRA`', 'Completed Work ID: `WHR-CAL-OPS-V1`', 'WHR-CAL-BASELINE-RECONCILE']]", "[paths.roadmap, roadmapText, ['Country-page programme: complete', 'Current Work ID: `WHR-CAL-JAPAN-NAR`', 'Next Work ID: `WHR-CAL-JAPAN-BANEI`', 'Completed Work ID: `WHR-CAL-OPS-V1`', 'WHR-CAL-BASELINE-RECONCILE']]"],
  ["[paths.startHere, startHereText, ['Previous completed Work ID: `WHR-CAL-OPS-V1`', 'WHR-CAL-JAPAN-JRA', 'WHR-CAL-JAPAN-NAR']]", "[paths.startHere, startHereText, ['Previous completed implementation Work ID: `WHR-CAL-JAPAN-JRA`', 'WHR-CAL-JAPAN-NAR', 'WHR-CAL-JAPAN-BANEI']]"],
  ["console.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-JRA');", "console.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-NAR');"],
  ["console.log('NEXT_WORK_ID: WHR-CAL-JAPAN-NAR');", "console.log('NEXT_WORK_ID: WHR-CAL-JAPAN-BANEI');"]
]);

replace('scripts/check-calendar-pipeline-v1-release-gate.mjs', [
  ["['START-HERE.md', startHere, ['Previous completed Work ID: `WHR-CAL-OPS-V1`', 'WHR-CAL-JAPAN-JRA', 'WHR-CAL-JAPAN-NAR']]", "['START-HERE.md', startHere, ['Previous completed implementation Work ID: `WHR-CAL-JAPAN-JRA`', 'WHR-CAL-JAPAN-NAR', 'WHR-CAL-JAPAN-BANEI']]"],
  ["['docs/project-roadmap.md', projectRoadmap, ['Current Work ID: `WHR-CAL-JAPAN-JRA`', 'Completed Work ID: `WHR-CAL-OPS-V1`']]", "['docs/project-roadmap.md', projectRoadmap, ['Current Work ID: `WHR-CAL-JAPAN-NAR`', 'Next Work ID: `WHR-CAL-JAPAN-BANEI`', 'Completed Work ID: `WHR-CAL-OPS-V1`']]"],
  ["['docs/calendar/implementation-roadmap.md', implementationRoadmap, ['Pipeline v1 status: complete', 'Dynamic Dates status: complete', 'Operations v1 status: complete', 'Current Work ID: `WHR-CAL-JAPAN-JRA`']]", "['docs/calendar/implementation-roadmap.md', implementationRoadmap, ['Pipeline v1 status: complete', 'Dynamic Dates status: complete', 'Operations v1 status: complete', 'Current Work ID: `WHR-CAL-JAPAN-NAR`', 'Next Work ID: `WHR-CAL-JAPAN-BANEI`']]"],
  ["console.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-JRA');", "console.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-NAR');"],
  ["console.log('NEXT_WORK_ID: WHR-CAL-JAPAN-NAR');", "console.log('NEXT_WORK_ID: WHR-CAL-JAPAN-BANEI');"]
]);

replace('scripts/check-calendar-dynamic-dates-release-gate.mjs', [
  ["['START-HERE.md', startHere, ['Previous completed Work ID: `WHR-CAL-OPS-V1`', 'WHR-CAL-JAPAN-JRA', 'WHR-CAL-JAPAN-NAR']]", "['START-HERE.md', startHere, ['Previous completed implementation Work ID: `WHR-CAL-JAPAN-JRA`', 'WHR-CAL-JAPAN-NAR', 'WHR-CAL-JAPAN-BANEI']]"],
  ["['docs/project-roadmap.md', roadmap, ['Completed Work ID: `WHR-CAL-OPS-V1`', 'Current Work ID: `WHR-CAL-JAPAN-JRA`', 'Next Work ID: `WHR-CAL-JAPAN-NAR`']]", "['docs/project-roadmap.md', roadmap, ['Completed Work ID: `WHR-CAL-OPS-V1`', 'Current Work ID: `WHR-CAL-JAPAN-NAR`', 'Next Work ID: `WHR-CAL-JAPAN-BANEI`']]"],
  ["['docs/calendar/implementation-roadmap.md', implementationRoadmap, ['Dynamic Dates status: complete', 'Operations v1 status: complete', 'Current Work ID: `WHR-CAL-JAPAN-JRA`']]", "['docs/calendar/implementation-roadmap.md', implementationRoadmap, ['Dynamic Dates status: complete', 'Operations v1 status: complete', 'Current Work ID: `WHR-CAL-JAPAN-NAR`', 'Next Work ID: `WHR-CAL-JAPAN-BANEI`']]"],
  ["console.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-JRA');", "console.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-NAR');"],
  ["console.log('NEXT_WORK_ID: WHR-CAL-JAPAN-NAR');", "console.log('NEXT_WORK_ID: WHR-CAL-JAPAN-BANEI');"]
]);

replace('scripts/check-calendar-operations-v1-release-gate.mjs', [
  ["['START-HERE.md', startHere, ['Previous completed Work ID: `WHR-CAL-OPS-V1`', 'WHR-CAL-JAPAN-JRA', 'WHR-CAL-JAPAN-NAR']]", "['START-HERE.md', startHere, ['Previous completed implementation Work ID: `WHR-CAL-JAPAN-JRA`', 'WHR-CAL-JAPAN-NAR', 'WHR-CAL-JAPAN-BANEI']]"],
  ["['docs/project-roadmap.md', roadmap, ['Completed Work ID: `WHR-CAL-OPS-V1`', 'Current Work ID: `WHR-CAL-JAPAN-JRA`', 'Next Work ID: `WHR-CAL-JAPAN-NAR`']]", "['docs/project-roadmap.md', roadmap, ['Completed Work ID: `WHR-CAL-OPS-V1`', 'Current Work ID: `WHR-CAL-JAPAN-NAR`', 'Next Work ID: `WHR-CAL-JAPAN-BANEI`']]"],
  ["['docs/calendar/implementation-roadmap.md', implementationRoadmap, ['Operations v1 status: complete', 'Current Work ID: `WHR-CAL-JAPAN-JRA`', 'Next Work ID: `WHR-CAL-JAPAN-NAR`']]", "['docs/calendar/implementation-roadmap.md', implementationRoadmap, ['Operations v1 status: complete', 'Current Work ID: `WHR-CAL-JAPAN-NAR`', 'Next Work ID: `WHR-CAL-JAPAN-BANEI`']]"],
  ["console.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-JRA');", "console.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-NAR');"],
  ["console.log('NEXT_WORK_ID: WHR-CAL-JAPAN-NAR');", "console.log('NEXT_WORK_ID: WHR-CAL-JAPAN-BANEI');"]
]);

replace('START-HERE.md', [
  ['Previous completed Work ID: `WHR-CAL-OPS-V1`', 'Previous completed implementation Work ID: `WHR-CAL-JAPAN-JRA`'],
  ['WHR-CAL-JAPAN-JRA\n```\n\nNext Work ID:\n\n```text\nWHR-CAL-JAPAN-NAR', 'WHR-CAL-JAPAN-NAR\n```\n\nNext Work ID:\n\n```text\nWHR-CAL-JAPAN-BANEI'],
  ['The 98-country programme, Calendar baseline reconciliation, Pipeline v1, Dynamic Dates, and Operations v1 are complete. The active task is the JRA source pilot; scheduling and unattended publication remain disabled.', 'The 98-country programme, Calendar baseline reconciliation, Pipeline v1, Dynamic Dates, Operations v1, and the JRA implementation foundation are complete. JRA still awaits fresh reviewed final evidence. The active task is the regional local-racing link-only pilot; candidate generation, scheduling, and unattended publication remain disabled.'],
  ['data/static/calendar-operations-seasonal-policy.json\n', 'data/static/calendar-operations-seasonal-policy.json\ndata/static/local-racing-pilot-control.json\ndata/generated/timetable/local-racing-pilot-review.json\n'],
  ['scripts/check-calendar-operations-v1-release-gate.mjs\n', 'scripts/check-calendar-operations-v1-release-gate.mjs\nscripts/check-local-racing-pilot-foundation.mjs\n']
]);

replace('docs/calendar/current-baseline-audit.md', [
  ['Current Work ID: `WHR-CAL-JAPAN-JRA`', 'Current Work ID: `WHR-CAL-JAPAN-NAR`'],
  ['The current phase is the JRA pilot.', 'The JRA implementation foundation is complete but still awaits fresh reviewed final evidence. The current phase is the regional local-racing link-only pilot.']
]);

for (const file of ['docs/calendar/README.md', 'docs/governance/document-authority.md']) {
  let text = readFileSync(file, 'utf8');
  if (!text.includes('data/generated/timetable/local-racing-pilot-review.json')) {
    const from = file.endsWith('README.md')
      ? 'data/generated/timetable/jra-planned-program-review.json\n'
      : '- `data/generated/timetable/jra-planned-program-review.json`\n';
    const to = file.endsWith('README.md')
      ? `${from}data/generated/timetable/local-racing-pilot-review.json\ndata/archive/timetable/candidates/japan-nar-candidates.v0.json\n`
      : `${from}- \`data/generated/timetable/local-racing-pilot-review.json\`\n- \`data/archive/timetable/candidates/japan-nar-candidates.v0.json\`\n`;
    if (!text.includes(from)) throw new Error(`${file} missing review index marker.`);
    text = text.replace(from, to);
    writeFileSync(file, text);
  }
}

console.log('LOCAL_RACING_CURRENT_STATE_APPLIED');
