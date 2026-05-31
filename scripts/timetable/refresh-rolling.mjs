import { printSummary, selectSources, writeCommandReport } from './refresh-core.mjs';

const sources = selectSources('rolling');
const report = writeCommandReport('refresh:timetable:rolling', sources);
printSummary(report);
