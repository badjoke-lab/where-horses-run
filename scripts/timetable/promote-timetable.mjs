import { printSummary, selectAllActiveSources, writeCommandReport } from './refresh-core.mjs';

const sources = selectAllActiveSources();
const report = writeCommandReport('promote:timetable', sources);
report.promotion_scope = {
  includes: ['D', 'C', 'B', 'A_upcoming', 'A_race_day'],
  excludes: ['A_archived', 'cancelled_archived'],
  note: 'Promotion logic will be populated by future parser-backed PRs. PR-109 only fixes the command contract.'
};
printSummary(report);
