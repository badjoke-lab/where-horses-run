import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function stop(message) {
  console.error(`[pr-191-jra-calendar-day-display-adapter] ${message}`);
  process.exit(1);
}

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) stop(`Missing file: ${relativePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

const adapter = JSON.parse(read('data/generated/timetable/pr-191-jra-calendar-day-display-adapter.json'));
const notes = read('PR-191.md');

if (adapter.schema_version !== 'pr-191-jra-calendar-day-display-adapter-v0') stop('Unexpected schema version.');
for (const dep of ['PR-184', 'PR-186', 'PR-190']) {
  if (!adapter.depends_on?.includes(dep)) stop(`Missing dependency: ${dep}`);
}
if (adapter.source_records !== 'data/generated/timetable/pr-187-jra-normalized-section-records.json') stop('Unexpected source records.');

const monthly = adapter.monthly_calendar_adapter ?? {};
if (monthly.input !== 'summary_records') stop('Monthly adapter must use summary_records.');
if (monthly.output !== 'monthly_rows') stop('Monthly output mismatch.');
for (const field of ['meeting_id', 'meeting_date', 'system', 'racecourse', 'rank', 'first_race_time', 'last_race_time', 'detail_page_path', 'source_url', 'verification_status']) {
  if (!monthly.row_shape?.includes(field)) stop(`Monthly row missing field: ${field}`);
}
for (const forbidden of ['race_times', 'races', 'race_rows']) {
  if (!monthly.must_not_include?.includes(forbidden)) stop(`Monthly must_not_include missing: ${forbidden}`);
}

const day = adapter.day_page_adapter ?? {};
if (day.input !== 'summary_records') stop('Day adapter must use summary_records.');
if (day.output !== 'day_page_meetings') stop('Day output mismatch.');
for (const forbidden of ['race_times', 'races', 'race_rows']) {
  if (!day.must_not_include?.includes(forbidden)) stop(`Day must_not_include missing: ${forbidden}`);
}

const detailPolicy = adapter.detail_link_policy ?? {};
if (!detailPolicy.rank_A?.includes('detail_page_path')) stop('A detail policy must mention detail_page_path.');
if (!detailPolicy.rank_B_plus?.includes('first_race_time and last_race_time only')) stop('B+ policy mismatch.');
if (detailPolicy.detail_record_source !== 'detail_records') stop('Detail source must be detail_records.');

const rows = adapter.sample_monthly_rows ?? [];
if (rows.length !== 3) stop('Expected three sample monthly day rows.');
for (const row of rows) {
  if (!Array.isArray(row.meetings) || row.meetings.length !== 2) stop(`${row.date} should list two meeting summaries.`);
}
const dayPages = adapter.sample_day_pages ?? [];
if (dayPages.length !== 3) stop('Expected three sample day pages.');
for (const page of dayPages) {
  if (page.uses_summary_records_only !== true) stop(`${page.date} must use summary records only.`);
}

const decision = adapter.promotion_decision ?? {};
if (decision.promote_jra_in_this_pr !== false) stop('JRA must not be promoted.');
if (decision.rank_gate_applied !== false) stop('Rank gate must not be applied.');
if (decision.auto_fetch_route_added !== false) stop('Auto fetch route must not be added.');
if (decision.this_pr_adds_display_adapter_contract_only !== true) stop('This PR must add adapter contract only.');

for (const snippet of [
  'This PR defines the display adapter contract',
  'summary_records',
  'A race rows remain detail-page data only.',
  'It must not include race rows.',
  'No JRA promotion.'
]) {
  if (!notes.includes(snippet)) stop(`PR note missing: ${snippet}`);
}

console.log('[pr-191-jra-calendar-day-display-adapter] PASS');
