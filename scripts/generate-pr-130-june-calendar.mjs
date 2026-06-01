import fs from 'node:fs';

const month = '2026-06';
const sourcePath = 'data/static/major-country-timetable-v0.json';
const outputPath = 'data/generated/timetable/june-2026-calendar.json';

const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const previous = JSON.parse(fs.readFileSync(outputPath, 'utf8'));

const grouped = new Map();

function groupKey(record) {
  return `${record.country_id}::${record.group_id}`;
}

function sourceTrace(record) {
  const sourceRecord = record.rolling_source || record.annual_source || {};
  return {
    source_url: sourceRecord.source_url,
    source_type: sourceRecord.source_type,
    source_capture_date: sourceRecord.source_capture_date,
    last_checked: record.last_checked,
    parser: record.group_id
  };
}

function addMeeting(set, date, racecourse) {
  if (!date || !racecourse) return;
  if (!date.startsWith(`${month}-`)) return;
  const exists = set.meetings.some((item) => item[0] === date && item[1] === racecourse);
  if (!exists) set.meetings.push([date, racecourse]);
}

for (const record of source.records || []) {
  if (!record.meeting_date?.startsWith(`${month}-`)) continue;
  if (!record.country_id || !record.group_id || !record.racecourse) continue;
  const key = groupKey(record);
  if (!grouped.has(key)) {
    grouped.set(key, {
      country_id: record.country_id,
      country_label: record.country_name,
      group_id: record.group_id,
      group_label: record.group_name,
      data_level: record.first_race_time ? 'B' : 'C',
      source_trace: sourceTrace(record),
      meetings: []
    });
  }
  addMeeting(grouped.get(key), record.meeting_date, record.racecourse);
}

for (const set of previous.record_sets || []) {
  const key = `${set.country_id}::${set.group_id}`;
  if (!grouped.has(key)) grouped.set(key, { ...set, meetings: [] });
  const target = grouped.get(key);
  for (const [date, racecourse] of set.meetings || []) addMeeting(target, date, racecourse);
  if (!target.source_trace?.source_url) target.source_trace = set.source_trace;
}

const record_sets = [...grouped.values()]
  .map((set) => ({
    ...set,
    meetings: set.meetings.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]))
  }))
  .sort((a, b) => `${a.country_id}::${a.group_id}`.localeCompare(`${b.country_id}::${b.group_id}`));

const output = {
  schema_version: 'june-2026-calendar-v0',
  generated_at: '2026-06-01T00:00:00Z',
  month,
  mode: 'real_source_monthly_calendar_records',
  source_inputs: [sourcePath],
  record_sets,
  coverage_status: previous.coverage_status || []
};

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`wrote ${record_sets.length} record_sets`);
