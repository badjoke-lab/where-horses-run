import { readFileSync, writeFileSync } from 'node:fs';

const file = 'src/lib/data.ts';
let text = readFileSync(file, 'utf8');
const replacements = [
  ["import timetables from '../../data/generated/timetables.json';\n", ''],
  ["import japanActiveTimetableRecords from '../../data/generated/japan-active-timetable-records.json';\n", ''],
  [`const mergedTimetables = {
  ...timetables,
  records: [...(timetables.records ?? []), ...(japanActiveTimetableRecords.records ?? [])],
  sources: [...new Set([...(timetables.sources ?? []), ...(japanActiveTimetableRecords.sources ?? [])])],
  notes: [...(timetables.notes ?? []), ...(japanActiveTimetableRecords.notes ?? [])]
} as const;

`, ''],
  [`    liveFetchProbeStatus,
    timetables: mergedTimetables,
    japanActiveTimetableRecords
`, `    liveFetchProbeStatus
`]
];
for (const [from, to] of replacements) {
  if (!text.includes(from)) throw new Error(`src/lib/data.ts missing cleanup marker: ${from.slice(0, 80)}`);
  text = text.replace(from, to);
}
writeFileSync(file, text);
console.log('CALENDAR_RUNTIME_IMPORT_CLEANUP_APPLIED');
