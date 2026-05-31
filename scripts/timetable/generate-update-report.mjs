import { printSummary, selectAllActiveSources, writeCommandReport } from './refresh-core.mjs';

const sources = selectAllActiveSources();
const report = writeCommandReport('report:timetable-update', sources);
report.report_scope = {
  summarizes: ['new records', 'promotions', 'stale records', 'source health', 'parser errors'],
  note: 'PR-109 defines the report contract for future generated data update PRs.'
};
printSummary(report);
