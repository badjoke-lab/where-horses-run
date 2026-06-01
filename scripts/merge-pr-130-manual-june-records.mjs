import fs from 'node:fs';

const outputPath = 'data/generated/timetable/june-2026-calendar.json';
const manualPaths = [
  'data/generated/timetable/manual-june-2026-banei.json',
  'data/generated/timetable/manual-june-2026-jra.json'
];

const data = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
const byGroup = new Map((data.record_sets || []).map((set) => [`${set.country_id}::${set.group_id}`, set]));

function addMeeting(target, meeting) {
  const key = `${meeting[0]}::${meeting[1]}`;
  const exists = target.meetings.some((item) => `${item[0]}::${item[1]}` === key);
  if (!exists) target.meetings.push(meeting);
}

for (const manualPath of manualPaths) {
  if (!fs.existsSync(manualPath)) continue;
  const manual = JSON.parse(fs.readFileSync(manualPath, 'utf8')).record_set;
  if (!manual) continue;
  const key = `${manual.country_id}::${manual.group_id}`;
  if (!byGroup.has(key)) byGroup.set(key, { ...manual, meetings: [] });
  const target = byGroup.get(key);
  target.source_trace = manual.source_trace;
  target.data_level = manual.data_level;
  for (const meeting of manual.meetings || []) addMeeting(target, meeting);
}

data.record_sets = [...byGroup.values()].map((set) => ({
  ...set,
  meetings: set.meetings.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]))
})).sort((a, b) => `${a.country_id}::${a.group_id}`.localeCompare(`${b.country_id}::${b.group_id}`));
data.source_inputs = [...new Set([...(data.source_inputs || []), ...manualPaths])];

fs.writeFileSync(outputPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(`[pr-130-manual-june] merged ${manualPaths.length} manual inputs`);
