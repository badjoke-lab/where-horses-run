import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function stop(message) {
  console.error(`[pr-237-current-timetable-data-inventory] ${message}`);
  process.exit(1);
}

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) stop(`Missing file: ${relativePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

function assertIncludes(collection, value, label) {
  if (!collection.includes(value)) stop(`${label} missing ${value}.`);
}

const doc = read('docs/runbooks/current-timetable-data-inventory.md');
const audit = JSON.parse(read('data/audits/timetable-rank-status.json'));
const notes = read('PR-237.md');

if (audit.schema_version !== 'timetable-rank-status-audit-v0') stop('Unexpected audit schema version.');
if (audit.last_checked !== '2026-06-07') stop('Unexpected last_checked date.');

for (const step of ['source_config', 'fetch_or_snapshot', 'normalize_or_canonical', 'publication_policy', 'public_view_model_or_public_json', 'pages']) {
  assertIncludes(audit.target_pipeline ?? [], step, 'Target pipeline');
}

const mergedPrs = new Set((audit.already_merged_work ?? []).map((item) => item.github_pr));
for (const pr of [221, 226, 228, 235, 236]) {
  if (!mergedPrs.has(pr)) stop(`Merged work inventory missing PR #${pr}.`);
}

const inventoryPaths = new Set((audit.inventory ?? []).map((item) => item.path));
for (const requiredPath of [
  'data/generated/timetables.json',
  'data/generated/japan-active-timetable-records.json',
  'data/generated/normalized-timetable.json',
  'data/generated/timetable/pr-185-jra-section-split-schema.json',
  'src/data/normalizedTimetableCalendarPreview.ts',
  'src/data/normalizedTimetableMeetingDetails.ts',
  'src/pages/timetable/meetings/[meeting_id].astro',
  'src/pages/calendar/index.astro',
  'src/pages/tomorrow.astro',
  'src/pages/major-countries/current-timetable.astro'
]) {
  if (!inventoryPaths.has(requiredPath)) stop(`Inventory missing ${requiredPath}.`);
}

for (const key of [
  'PR_1_current_data_inventory',
  'PR_2_rank_consistency_repair',
  'PR_3_canonical_timetable_model',
  'PR_4_existing_json_to_canonical',
  'PR_5_publication_display_policy_resolver',
  'PR_6_public_view_generation',
  'PR_7_list_pages_to_public_view',
  'PR_8_country_and_track_pages_to_public_list',
  'PR_9_meeting_detail_page_to_public_detail',
  'PR_10_legacy_input_isolation',
  'PR_11_hkjc_june_refresh',
  'PR_12_jra_acquisition_path',
  'PR_13_nar_banei_acquisition_path',
  'PR_14_us_sample_reintegration'
]) {
  if (!(key in (audit.roadmap_status ?? {}))) stop(`Roadmap status missing ${key}.`);
}

if (audit.next_pr?.roadmap_item !== 'PR-2') stop('Next PR must be roadmap PR-2.');

for (const snippet of [
  'source config',
  'fetch / snapshot',
  'normalize / canonical',
  'publication policy',
  'public view model / public JSON',
  'Pages should eventually read only the public view',
  '#221',
  '#226',
  '#228',
  '#235',
  '#236',
  'PR-2 rank consistency repair'
]) {
  if (!doc.includes(snippet)) stop(`Inventory doc missing snippet: ${snippet}`);
}

for (const snippet of [
  'No data source is promoted.',
  'No page input is changed.',
  'Next roadmap item is PR-2 rank consistency repair.'
]) {
  if (!notes.includes(snippet)) stop(`PR note missing snippet: ${snippet}`);
}

console.log('[pr-237-current-timetable-data-inventory] PASS');
