import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function stop(message) {
  console.error(`[pr-187-jra-normalized-section-records] ${message}`);
  process.exit(1);
}

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) stop(`Missing file: ${relativePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

const data = JSON.parse(read('data/generated/timetable/pr-187-jra-normalized-section-records.json'));
const notes = read('PR-187.md');

if (data.schema_version !== 'pr-187-jra-normalized-section-records-v0') stop('Unexpected schema version.');
if (!data.depends_on?.includes('PR-184')) stop('Missing PR-184 dependency.');
if (!data.depends_on?.includes('PR-186')) stop('Missing PR-186 dependency.');

const summaries = data.summary_records ?? [];
const details = data.detail_records ?? [];
if (summaries.length !== 6) stop(`Expected 6 summary records, got ${summaries.length}.`);
if (details.length !== 6) stop(`Expected 6 detail records, got ${details.length}.`);

const expectedIds = [
  'jra-2026-01-04-nakayama',
  'jra-2026-01-04-kyoto',
  'jra-2026-01-10-nakayama',
  'jra-2026-01-10-kyoto',
  'jra-2026-01-11-nakayama',
  'jra-2026-01-11-kyoto'
];

for (const id of expectedIds) {
  const summary = summaries.find((item) => item.meeting_id === id);
  const detail = details.find((item) => item.meeting_id === id);
  if (!summary) stop(`Missing summary ${id}.`);
  if (!detail) stop(`Missing detail ${id}.`);
  if (summary.rank !== 'A') stop(`${id} rank must be A-capable in normalized records.`);
  if (!summary.first_race_time || !summary.last_race_time) stop(`${id} missing first/last time.`);
  if (summary.race_count !== 12) stop(`${id} race_count must be 12.`);
  if (!summary.detail_page_path) stop(`${id} missing detail_page_path.`);
  if (!summary.source_url?.startsWith('https://www.jra.go.jp/')) stop(`${id} source URL must be official JRA.`);
  if (!Array.isArray(detail.race_times) || detail.race_times.length !== 12) stop(`${id} detail must have 12 race times.`);
  if (!detail.race_source_url?.startsWith('https://www.jra.go.jp/')) stop(`${id} detail source URL must be official JRA.`);
}

const boundary = data.display_boundary ?? {};
if (boundary.monthly_calendar_uses !== 'summary_records_only') stop('Monthly calendar must use summary records only.');
if (boundary.meeting_detail_pages_use !== 'detail_records') stop('Detail pages must use detail records.');
if (!boundary.bplus_summary_shape?.includes('first_race_time') || !boundary.bplus_summary_shape?.includes('last_race_time')) stop('B+ summary shape mismatch.');
if (!boundary.a_detail_shape?.includes('detail_page_path') || !boundary.a_detail_shape?.includes('race_times')) stop('A detail shape mismatch.');

const decision = data.promotion_decision ?? {};
if (decision.promote_jra_in_this_pr !== false) stop('JRA must not be promoted.');
if (decision.calendar_adapter_added !== false) stop('Calendar adapter must not be added.');
if (decision.detail_pages_added !== false) stop('Detail pages must not be added.');
if (decision.rank_gate_applied !== false) stop('Rank gate must not be applied.');
if (decision.this_pr_adds_normalized_records_only !== true) stop('This PR must add normalized records only.');

for (const snippet of [
  'This PR creates normalized JRA section records',
  'summary_records',
  'detail_records',
  'Monthly calendar must not expand race rows.',
  'No JRA promotion.'
]) {
  if (!notes.includes(snippet)) stop(`PR note missing: ${snippet}`);
}

console.log('[pr-187-jra-normalized-section-records] PASS');
