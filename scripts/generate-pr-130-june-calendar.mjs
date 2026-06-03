import fs from 'node:fs';

const month = '2026-06';
const sourcePath = 'data/static/major-country-timetable-v0.json';
const routesPath = 'data/generated/timetable/june-2026-source-routes.json';
const outputPath = 'data/generated/timetable/june-2026-calendar.json';

const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const routes = JSON.parse(fs.readFileSync(routesPath, 'utf8'));
const previous = JSON.parse(fs.readFileSync(outputPath, 'utf8'));

const grouped = new Map();
const routeByGroup = new Map((routes.routes || []).map((route) => [`${route.country_id}::${route.group_id}`, route]));

function groupKey(record) {
  return `${record.country_id}::${record.group_id}`;
}

function sourceTrace(record) {
  const sourceRecord = record.rolling_source || record.annual_source || {};
  const route = routeByGroup.get(groupKey(record));
  return {
    source_url: sourceRecord.source_url || route?.source_url,
    source_type: sourceRecord.source_type,
    source_capture_date: sourceRecord.source_capture_date,
    last_checked: record.last_checked,
    parser: route?.parser
  };
}

function addMeeting(set, date, racecourse) {
  if (!date || !racecourse) return;
  if (!date.startsWith(`${month}-`)) return;
  const exists = set.meetings.some((item) => item[0] === date && item[1] === racecourse);
  if (!exists) set.meetings.push([date, racecourse]);
}

function isAllowedRecord(record) {
  if (!record.meeting_date?.startsWith(`${month}-`)) return false;
  if (!record.country_id || !record.group_id || !record.racecourse) return false;
  if (!routeByGroup.has(groupKey(record))) return false;
  if (record.data_origin && record.data_origin !== 'real_source') return false;
  if (record.source_kind && /sample|mock|fixture_source|needs_review|not_checked/.test(record.source_kind)) return false;
  if (record.display_status && /sample|mock|needs_review|not_checked/.test(record.display_status)) return false;
  return true;
}

for (const record of source.records || []) {
  if (!isAllowedRecord(record)) continue;
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
  source_inputs: [sourcePath, routesPath],
  record_sets,
  coverage_status: previous.coverage_status || []
};

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`wrote ${record_sets.length} record_sets`);
