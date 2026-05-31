import { printSummary, selectAllActiveSources, writeCommandReport } from './refresh-core.mjs';

const sources = selectAllActiveSources();
const report = writeCommandReport('archive:timetable', sources);
report.archive_scope = {
  archives: ['A_completed_after_final_check', 'cancelled_completed_after_final_check'],
  does_not_archive: ['D', 'C', 'B', 'A_upcoming', 'A_race_day'],
  note: 'Archive behavior will be populated by future PRs after current timetable records carry lifecycle_status.'
};
printSummary(report);
