import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function stop(message) {
  console.error(`[pr-185-jra-section-split-schema] ${message}`);
  process.exit(1);
}

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) stop(`Missing file: ${relativePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

const schema = JSON.parse(read('data/generated/timetable/pr-185-jra-section-split-schema.json'));
const notes = read('PR-185.md');

if (schema.schema_version !== 'pr-185-jra-section-split-schema-v0') stop('Unexpected schema version.');
if (!schema.depends_on?.includes('PR-132')) stop('Missing PR-132 dependency.');
if (!schema.depends_on?.includes('PR-184')) stop('Missing PR-184 dependency.');

if (!schema.section_split_problem?.required_action?.includes('split page rows')) stop('Missing split requirement.');

const summary = schema.meeting_summary_record ?? {};
if (!summary.used_by?.includes('monthly_calendar')) stop('Summary must be used by monthly calendar.');
if (summary.contains_race_rows !== false) stop('Summary must not contain race rows.');
if (!summary.rank_fields?.['B+']?.includes('first_race_time')) stop('B+ missing first_race_time.');
if (!summary.rank_fields?.['B+']?.includes('last_race_time')) stop('B+ missing last_race_time.');
if (summary.rank_fields?.['B+']?.includes('races')) stop('B+ summary must not contain races.');
if (!summary.rank_fields?.A?.includes('detail_page_path')) stop('A summary must point to detail page.');

const detail = schema.meeting_detail_record ?? {};
if (!detail.used_by?.includes('meeting_detail_page')) stop('Detail must be used by meeting detail page.');
if (detail.required_for_rank !== 'A') stop('Detail must be required for A.');
if (detail.contains_race_rows !== true) stop('Detail must contain race rows.');
if (detail.monthly_calendar_use !== false) stop('Detail must not be used by monthly calendar.');

for (const rule of ['derive B+ summary only after section split', 'monthly calendar consumes meeting_summary_record only']) {
  if (!schema.split_rules?.includes(rule)) stop(`Missing split rule: ${rule}`);
}

const bplus = schema.rank_mapping_after_split?.['B+'];
const a = schema.rank_mapping_after_split?.A;
if (bplus?.output !== 'meeting_summary_record') stop('B+ output must be summary.');
if (!bplus.fields?.includes('first_race_time') || !bplus.fields?.includes('last_race_time')) stop('B+ fields mismatch.');
if (!Array.isArray(a?.output) || !a.output.includes('meeting_detail_record')) stop('A must include detail output.');
if (a.monthly_expansion !== false) stop('A must not expand in monthly calendar.');

const decision = schema.promotion_decision ?? {};
if (decision.promote_jra_in_this_pr !== false) stop('JRA must not be promoted.');
if (decision.calendar_rows_added !== false) stop('No calendar rows should be added.');
if (decision.detail_pages_added !== false) stop('No detail pages should be added.');
if (decision.rank_change_added !== false) stop('No rank change should be added.');
if (decision.this_pr_is_schema_only !== true) stop('This PR must be schema-only.');

for (const snippet of [
  'B+ summary output',
  'A detail output',
  'B+ does not require race rows.',
  'meeting_detail_record',
  'No race rows in monthly calendar.'
]) {
  if (!notes.includes(snippet)) stop(`PR note missing: ${snippet}`);
}

console.log('[pr-185-jra-section-split-schema] PASS');
