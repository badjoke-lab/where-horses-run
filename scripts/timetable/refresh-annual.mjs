import { printSummary, selectSources, writeCommandReport } from './refresh-core.mjs';

const sources = selectSources('annual');
const report = writeCommandReport('refresh:timetable:annual', sources);
printSummary(report);
