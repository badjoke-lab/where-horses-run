import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-146-jra-official-source-inventory] ${message}`);
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

const inventory = readJson('data/generated/timetable/pr-146-jra-official-source-inventory.json');
const notes = read('PR-146.md');

if (inventory.schema_version !== 'pr-146-jra-official-source-inventory-v0') fail('Unexpected schema version.');
if (inventory.month !== '2026-06') fail('Unexpected month.');
if (inventory.context?.previous_path !== 'HKJC paused at C after PR-145') fail('Previous path mismatch.');
if (inventory.context?.primary_next_candidate !== 'JRA') fail('Primary next candidate must be JRA.');
if (inventory.context?.fallback_candidate !== 'NAR') fail('Fallback candidate must be NAR.');

const system = inventory.system ?? {};
if (system.country_id !== 'japan') fail('Unexpected country_id.');
if (system.group_id !== 'jra') fail('Unexpected group_id.');
if (system.current_rank !== 'not_promoted_by_this_pr') fail('JRA must not be promoted in PR-146.');
if (system.time_zone !== 'Asia/Tokyo') fail('Unexpected time zone.');

const fetchStatus = inventory.fetch_status ?? {};
if (fetchStatus.assistant_web_status !== 'not_parseable_in_current_environment') fail('Fetch status must be not_parseable_in_current_environment.');
if (!fetchStatus.inventory_scope?.includes('Candidate URLs')) fail('Inventory scope must be candidate-only.');

const candidates = inventory.official_source_candidates ?? [];
if (candidates.length < 6) fail('Expected at least 6 official source candidates.');
for (const candidate of candidates) {
  if (!candidate.source_id) fail('Candidate missing source_id.');
  if (!candidate.source_url?.startsWith('https://www.jra.go.jp/')) fail(`Candidate ${candidate.source_id} must use official JRA URL.`);
  if (candidate.verification_status !== 'candidate_needs_live_check') fail(`Candidate ${candidate.source_id} must need live check.`);
  if (candidate.use_for_rank !== false) fail(`Candidate ${candidate.source_id} must not be used for rank yet.`);
}

for (const sourceId of ['jra_top', 'jra_keiba_top', 'jra_calendar_candidate', 'jra_jradb_entry_candidate', 'jra_racecard_candidate', 'jra_result_candidate']) {
  if (!candidates.some((candidate) => candidate.source_id === sourceId)) fail(`Missing candidate: ${sourceId}`);
}

const requiredVerification = inventory.required_next_verification ?? [];
for (const phrase of ['fixture dates', 'all races for one meeting', 'race_number and race_time', 'query parameters']) {
  if (!requiredVerification.some((item) => item.includes(phrase))) fail(`Missing required verification: ${phrase}`);
}

const schedule = inventory.forward_schedule ?? [];
for (const plannedPr of ['PR-147', 'PR-148', 'PR-149A', 'PR-149B', 'PR-150A', 'PR-151A', 'PR-152A']) {
  if (!schedule.some((item) => item.planned_pr === plannedPr)) fail(`Missing forward schedule item: ${plannedPr}`);
}

const decision = inventory.promotion_decision ?? {};
if (decision.promote_jra_in_this_pr !== false) fail('JRA must not be promoted.');
if (decision.promote_nar_in_this_pr !== false) fail('NAR must not be promoted.');
if (decision.data_rows_added !== false) fail('No data rows should be added.');
if (decision.snapshot_added !== false) fail('No snapshot should be added.');
if (decision.rank_change_added !== false) fail('No rank change should be added.');

const requiredNoteSnippets = [
  'This PR inventories official JRA source candidates only.',
  'JRA is not promoted in this PR.',
  'No JRA race-time rows are added in this PR.',
  'PR-147: JRA route verification plan.',
  'PR-152A: JRA promotion gate only if PR-132 rank rules are satisfied.'
];
for (const snippet of requiredNoteSnippets) {
  if (!notes.includes(snippet)) fail(`PR note missing required snippet: ${snippet}`);
}

console.log('[pr-146-jra-official-source-inventory] PASS inventory only / no promotion');
