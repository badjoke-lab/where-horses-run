import fs from 'node:fs';
import path from 'node:path';

const outputPath = 'data/generated/timetable/june-2026-calendar.json';
const manualDir = 'data/generated/timetable';
const manualPaths = fs.readdirSync(manualDir)
  .filter((fileName) => /^manual-june-2026-.+\.json$/.test(fileName))
  .map((fileName) => path.join(manualDir, fileName))
  .sort();

const data = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
const byGroup = new Map((data.record_sets || []).map((set) => [`${set.country_id}::${set.group_id}`, set]));

function addMeeting(target, meeting) {
  const key = `${meeting[0]}::${meeting[1]}`;
  const exists = target.meetings.some((item) => `${item[0]}::${item[1]}` === key);
  if (!exists) target.meetings.push(meeting);
}

for (const manualPath of manualPaths) {
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
await import('./apply-profile-v2-85-92-loader.mjs');
if (fs.existsSync('docs/country-pages/98-country-publication-transitions-77-84.tsv')) {
  await import('./check-country-page-publication-77-84.mjs');
}
if (fs.existsSync('docs/country-pages/98-country-publication-transitions-85-92.tsv')) {
  await import('./check-country-page-publication-85-92.mjs');
}
