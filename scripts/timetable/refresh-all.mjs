import { printSummary, selectAllActiveSources, writeCommandReport } from './refresh-core.mjs';

const sources = selectAllActiveSources();
const report = writeCommandReport('refresh:timetable', sources);
report.command_sequence = [
  'refresh:timetable:annual',
  'refresh:timetable:rolling',
  'refresh:timetable:race-times',
  'promote:timetable',
  'archive:timetable',
  'build:timetable',
  'report:timetable-update'
];
printSummary(report);
