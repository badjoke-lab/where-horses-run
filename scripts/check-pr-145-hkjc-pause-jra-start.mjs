import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-145-hkjc-pause-jra-start] ${message}`);
  process.exit(1);
}

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) fail(`Missing file: ${relativePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

const decision = readJson('data/generated/timetable/pr-145-hkjc-pause-jra-start.json');
const notes = read('PR-145.md');

if (decision.schema_version !== 'pr-145-hkjc-pause-jra-start-v0') fail('Unexpected schema version.');
if (decision.month !== '2026-06') fail('Unexpected month.');

const hkjc = decision.hkjc_decision ?? {};
if (hkjc.country_id !== 'hong-kong') fail('Unexpected HKJC country_id.');
if (hkjc.group_id !== 'hkjc') fail('Unexpected HKJC group_id.');
if (hkjc.current_rank !== 'C') fail('HKJC must remain C.');
if (hkjc.attempted_target_rank !== 'B+') fail('HKJC attempted target must be B+.');
if (hkjc.decision !== 'pause_attempt') fail('HKJC decision must be pause_attempt.');
if (hkjc.verified_meetings !== 1) fail('HKJC verified meeting count must be 1.');
if (hkjc.unverified_meetings !== 6) fail('HKJC unverified meeting count must be 6.');
if (hkjc.full_month_promotion_allowed !== false) fail('HKJC full-month promotion must be blocked.');

const next = decision.next_candidate_decision ?? {};
if (next.primary_next_candidate !== 'JRA') fail('Primary next candidate must be JRA.');
if (next.fallback_candidate !== 'NAR') fail('Fallback candidate must be NAR.');
if (next.jra_promotion_in_this_pr !== false) fail('JRA must not be promoted in PR-145.');
if (next.nar_promotion_in_this_pr !== false) fail('NAR must not be promoted in PR-145.');

const schedule = decision.forward_schedule ?? [];
const requiredPrs = ['PR-146', 'PR-147', 'PR-148', 'PR-149A', 'PR-149B', 'PR-150A', 'PR-151A', 'PR-152A'];
for (const plannedPr of requiredPrs) {
  if (!schedule.some((item) => item.planned_pr === plannedPr)) fail(`Missing forward schedule item: ${plannedPr}`);
}

const rules = decision.global_safety_rules ?? [];
for (const phrase of ['Do not promote HKJC', 'Do not infer first_race_time', 'Do not infer last_race_time', 'Do not infer race_count', 'Do not assume contiguous numbering']) {
  if (!rules.some((rule) => rule.includes(phrase))) fail(`Missing safety rule: ${phrase}`);
}

const promotion = decision.promotion_decision ?? {};
if (promotion.promote_hkjc_in_this_pr !== false) fail('HKJC must not be promoted.');
if (promotion.promote_jra_in_this_pr !== false) fail('JRA must not be promoted.');
if (promotion.promote_nar_in_this_pr !== false) fail('NAR must not be promoted.');
if (promotion.data_rows_added_for_jra !== false) fail('No JRA rows should be added.');
if (promotion.data_rows_added_for_nar !== false) fail('No NAR rows should be added.');

const requiredNoteSnippets = [
  'HKJC remains C.',
  'JRA and NAR are not promoted in this PR.',
  'PR-146: JRA official source inventory.',
  'PR-152A: JRA promotion gate only if PR-132 rank rules are satisfied.',
  'PR-146 should add the JRA official source inventory only.'
];

for (const snippet of requiredNoteSnippets) {
  if (!notes.includes(snippet)) fail(`PR note missing required snippet: ${snippet}`);
}

console.log('[pr-145-hkjc-pause-jra-start] PASS HKJC paused / JRA next / no promotion');
