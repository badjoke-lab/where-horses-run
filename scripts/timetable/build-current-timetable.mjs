import { printSummary, selectAllActiveSources, writeCommandReport } from './refresh-core.mjs';

const sources = selectAllActiveSources();
const report = writeCommandReport('build:timetable', sources);
report.build_scope = {
  reads: ['future parsed annual records', 'future parsed rolling records', 'future parsed race-time records'],
  writes: ['data/generated/timetable/current.json'],
  note: 'PR-109 fixes the generated current timetable contract; parser-backed records arrive in later PRs.'
};
printSummary(report);
