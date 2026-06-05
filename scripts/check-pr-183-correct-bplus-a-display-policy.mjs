import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function stop(message) {
  console.error(`[pr-183-correct-bplus-a-display-policy] ${message}`);
  process.exit(1);
}

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) stop(`Missing file: ${relativePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

const policy = JSON.parse(read('data/generated/timetable/pr-183-correct-bplus-a-display-policy.json'));
const notes = read('PR-183.md');

if (policy.schema_version !== 'pr-183-correct-bplus-a-display-policy-v0') stop('Unexpected schema version.');

const summary = policy.source_of_truth?.rank_policy_summary ?? {};
if (!summary['B+']?.includes('first_race_time plus last_race_time')) stop('B+ definition is not first plus last.');
if (!summary.A?.includes('race-by-race schedule or racecard detail')) stop('A definition is not race detail.');
if (!policy.source_of_truth?.monthly_display_policy?.includes('one row per meeting')) stop('Monthly display policy is not one row per meeting.');

const contracts = policy.rank_display_contract ?? [];
const bplus = contracts.find((item) => item.rank === 'B+');
const a = contracts.find((item) => item.rank === 'A');
if (!bplus) stop('Missing B+ contract.');
if (!a) stop('Missing A contract.');

for (const field of ['meeting_date', 'racecourse', 'rank', 'first_race_time', 'last_race_time', 'source_url', 'verification_status']) {
  if (!bplus.monthly_calendar_row.required_fields?.includes(field)) stop(`B+ missing ${field}.`);
}
if (!bplus.monthly_calendar_row.forbidden_fields?.includes('race_rows_expanded_in_monthly_calendar')) stop('B+ must not expand race rows in monthly calendar.');
if (!bplus.monthly_calendar_row.forbidden_fields?.includes('racecard_detail_fields')) stop('B+ must not contain racecard detail fields.');
if (!bplus.day_page?.includes('race-by-race display is not required for B+')) stop('B+ day page wording mismatch.');

for (const field of ['meeting_date', 'racecourse', 'rank', 'first_race_time', 'last_race_time', 'detail_page_path', 'source_url', 'verification_status']) {
  if (!a.monthly_calendar_row.required_fields?.includes(field)) stop(`A missing ${field}.`);
}
if (!a.monthly_calendar_row.forbidden_fields?.includes('race_rows_expanded_in_monthly_calendar')) stop('A must not expand race rows in monthly calendar.');
if (a.detail_page_required !== true) stop('A must require detail page.');

const decision = policy.promotion_decision ?? {};
if (decision.promote_jra_in_this_pr !== false) stop('JRA promoted unexpectedly.');
if (decision.calendar_rows_added !== false) stop('Calendar rows added unexpectedly.');
if (decision.rank_change_added !== false) stop('Rank changed unexpectedly.');

for (const snippet of [
  'B+ = first_race_time plus last_race_time captured.',
  'A = race-by-race schedule or racecard detail captured.',
  'Monthly display remains one row per meeting.',
  'B+ must not require race-by-race display.',
  'A race rows are shown only on meeting detail pages'
]) {
  if (!notes.includes(snippet)) stop(`PR note missing: ${snippet}`);
}

console.log('[pr-183-correct-bplus-a-display-policy] PASS');
