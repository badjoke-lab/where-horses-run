import { printSummary, selectSources, writeCommandReport } from './refresh-core.mjs';

const sources = selectSources('racecard');
const report = writeCommandReport('refresh:timetable:race-times', sources);
printSummary(report);
