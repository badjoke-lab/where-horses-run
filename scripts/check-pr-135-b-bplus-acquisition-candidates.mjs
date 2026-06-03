import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-135-b-bplus-acquisition-candidates] ${message}`);
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

const matrix = readJson('data/generated/timetable/pr-135-b-bplus-acquisition-candidates.json');
const notes = read('PR-135.md');

if (matrix.schema_version !== 'pr-135-b-bplus-acquisition-candidates-v0') fail('Unexpected schema version.');
if (matrix.month !== '2026-06') fail('Unexpected month.');
if (!matrix.rank_definitions_source?.includes('pr-132')) fail('Missing PR-132 rank definition source.');
if (!matrix.current_rank_matrix_source?.includes('pr-133')) fail('Missing PR-133 rank matrix source.');
if (matrix.scope_rules.B.includes('last_race_time')) fail('B must not require last_race_time.');
if (!matrix.scope_rules['B+'].includes('last_race_time')) fail('B+ must require last_race_time.');
if (!matrix.scope_rules['B+'].includes('not meeting_end_time')) fail('B+ must forbid meeting_end_time confusion.');

const requiredPriority = [
  'hong-kong/hkjc',
  'japan/jra',
  'japan/nar',
  'ireland/hri',
  'united-kingdom/bha'
];

for (const key of requiredPriority) {
  if (!matrix.priority_order.includes(key)) fail(`Missing required priority candidate: ${key}`);
}

const candidates = matrix.candidates ?? [];
if (candidates.length < 5) fail('Expected at least five B/B+ candidates.');

for (const candidate of candidates) {
  const key = `${candidate.country_id}/${candidate.group_id}`;
  if (candidate.current_rank !== 'C') fail(`${key}: B/B+ candidates must currently be C.`);
  if (!['B', 'B+'].includes(candidate.target_rank)) fail(`${key}: target_rank must be B or B+.`);
  if (!candidate.source_url?.startsWith('https://')) fail(`${key}: source_url missing.`);
  if (!candidate.current_parser) fail(`${key}: current_parser missing.`);
  if (!candidate.investigation_goal) fail(`${key}: investigation_goal missing.`);
  if (!candidate.do_not_promote_until) fail(`${key}: do_not_promote_until missing.`);
  if (!candidate.next_action) fail(`${key}: next_action missing.`);
  if (!candidate.required_fields?.includes('first_race_time')) fail(`${key}: first_race_time required.`);
  if (!candidate.required_fields?.includes('time_zone')) fail(`${key}: time_zone required.`);
  if (!candidate.required_fields?.includes('time_source_url')) fail(`${key}: time_source_url required.`);
  if (candidate.target_rank === 'B+' && !candidate.required_fields.includes('last_race_time')) {
    fail(`${key}: B+ candidate must require last_race_time.`);
  }
}

const blockedOrLater = matrix.blocked_or_later ?? [];
if (blockedOrLater.length === 0) fail('Expected blocked_or_later notes.');
for (const item of blockedOrLater) {
  if (!item.reason?.includes('C is still blocked')) fail(`${item.country_id}/${item.group_id}: blocker note must keep C blocked.`);
}

const requiredNoteSnippets = [
  'PR-135 does not promote any records.',
  'B promotion requires',
  'B+ promotion requires',
  'not a meeting end time',
  'PR-136 should start B / B+ data insertion'
];

for (const snippet of requiredNoteSnippets) {
  if (!notes.includes(snippet)) fail(`PR note missing required snippet: ${snippet}`);
}

console.log(`[pr-135-b-bplus-acquisition-candidates] PASS ${candidates.length} candidates / ${blockedOrLater.length} blocked-or-later notes`);
