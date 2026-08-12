import fs from 'node:fs';
import path from 'node:path';

const CONTRACT_PATH = 'data/static/v1-scope-freeze-v1.json';
const AUDIT_PATH = 'data/audits/v1-scope-freeze-v1.json';
const DOC_PATH = 'docs/release/v1-scope-freeze.md';
const WORKFLOW_PATH = '.github/workflows/v1-scope-freeze.yml';
const SEO_RELEASE_PATH = 'data/static/seo-qa-release-v1.json';
const SEO_AUDIT_PATH = 'data/audits/seo-qa-release-v1.json';
const SITEMAP_CONTRACT_PATH = 'data/static/sitemap-robots-contract-v1.json';
const SITEMAP_PATH = 'dist/sitemap.xml';
const PUBLIC_MEETING_DETAILS_PATH = 'data/generated/timetable/public/meeting-details.json';

const expect = (condition, message) => { if (!condition) throw new Error(message); };
const read = (file) => fs.readFileSync(file, 'utf8');
const json = (file) => JSON.parse(read(file));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const routeFamilies = [
  'root',
  'search',
  'countries',
  'tracks',
  'types',
  'sources',
  'glossary',
  'calendar',
  'today',
  'tomorrow',
  'timetable',
  'major-countries',
  'archive',
  'about',
  'disclaimer',
  'faq',
  'methods',
];

const capabilities = [
  'static_bilingual_navigation',
  'client_side_search_and_filters',
  'country_and_area_discovery',
  'racecourse_profiles',
  'racing_type_guides',
  'official_and_reference_source_directories',
  'glossary_terms_and_related_term_navigation',
  'reviewed_calendar_today_tomorrow_and_timetable_views',
  'meeting_detail_pages_with_publication_ranks_c_through_a_plus',
  'official_live_and_replay_route_labels_without_embedding',
  'source_status_review_date_and_official_confirmation_routes',
  'complete_static_no_javascript_readability',
  'sitemap_canonical_hreflang_and_social_metadata',
];

const publicDataClasses = [
  'country_or_area_identity',
  'racecourse_identity_and_location',
  'racing_type_identity',
  'glossary_term_identity_and_reviewed_definition',
  'official_or_reference_source_route',
  'meeting_date_racecourse_country_organizer_timezone_and_source_status',
  'publication_rank',
  'first_and_last_race_time_when_rank_allows',
  'race_label_and_post_time_when_rank_allows',
  'a_plus_programme_summary_fields_when_rank_allows',
  'official_live_or_replay_availability_label',
  'last_reviewed_or_last_checked_date',
];

const excludedFeatures = [
  'user_accounts_profiles_or_login',
  'user_submissions_comments_or_editing',
  'personalization_saved_items_or_notifications',
  'public_write_api_or_user_data_api',
  'native_mobile_application',
  'live_odds_or_betting_market_data',
  'predictions_tips_picks_or_betting_advice',
  'results_payouts_or_dividend_republication',
  'complete_racecards_entries_or_participant_datasets',
  'horse_jockey_trainer_draw_weight_or_body_weight_fields',
  'video_embedding_direct_stream_urls_or_recording_redistribution',
  'unofficial_stream_mirrors',
  'real_time_or_complete_coverage_guarantee',
  'automatic_translation_or_unreviewed_content_generation',
  'automatic_publication_from_candidate_or_private_data',
  'ticketing_wagering_payment_or_other_transactional_features',
];

for (const file of [CONTRACT_PATH, AUDIT_PATH, DOC_PATH, WORKFLOW_PATH, SEO_RELEASE_PATH, SEO_AUDIT_PATH, SITEMAP_CONTRACT_PATH, SITEMAP_PATH, PUBLIC_MEETING_DETAILS_PATH]) {
  expect(fs.existsSync(file), `Required v1 scope file is missing: ${file}`);
}

const contract = json(CONTRACT_PATH);
const audit = json(AUDIT_PATH);
const seoRelease = json(SEO_RELEASE_PATH);
const seoAudit = json(SEO_AUDIT_PATH);
const sitemapContract = json(SITEMAP_CONTRACT_PATH);
const publicMeetingDetails = json(PUBLIC_MEETING_DETAILS_PATH);

expect(contract.schema_version === 'v1-scope-freeze-v1', 'v1 scope schema differs');
expect(contract.release_id === 'WHR-V1-PREPARATION-V1', 'v1 scope release ID differs');
expect(contract.work_id === 'WHR-V1-PREPARATION-V1', 'v1 scope Work ID differs');
expect(contract.implementation_unit === 'V1-SCOPE-FREEZE-01', 'v1 scope implementation unit differs');
expect(contract.status === 'complete' && contract.reviewed_at === '2026-07-18', 'v1 scope status or date differs');
expect(contract.baseline_release_id === 'WHR-SEO-PUBLIC-CONTENT-V1', 'v1 baseline release ID differs');
expect(contract.previous_implementation_unit === 'SEO-QA-RELEASE-01', 'v1 previous unit differs');
expect(contract.next_implementation_unit === 'V1-DATA-AUDIT-01', 'v1 next unit differs');
expect(exact(contract.included_route_families, routeFamilies), 'v1 route-family scope differs');
expect(exact(contract.included_capabilities, capabilities), 'v1 capability scope differs');
expect(exact(contract.included_public_data_classes, publicDataClasses), 'v1 public-data-class scope differs');
expect(exact(contract.excluded_features, excludedFeatures), 'v1 excluded-feature scope differs');

expect(exact(contract.scope_change_contract, {
  baseline_inventory_is_reference_snapshot: true,
  data_corrections_within_existing_classes_allowed: true,
  unsupported_or_stale_records_may_be_reduced_or_removed: true,
  existing_route_families_may_receive_quality_fixes: true,
  new_route_families_allowed_without_scope_review: false,
  new_public_data_classes_allowed_without_scope_review: false,
  new_user_or_transactional_features_allowed_without_scope_review: false,
  count_increase_requires_data_and_scope_review: true,
  subsequent_v1_qa_units_may_expand_scope: false,
  explicit_contract_update_required_for_scope_change: true,
}), 'v1 scope-change contract differs');
expect(Object.values(contract.v1_candidate_acceptance).every((value) => value === true), 'v1 acceptance contract differs');
expect(Object.values(contract.privacy_boundary).every((value) => value === false), 'v1 privacy boundary differs');
expect(Object.values(contract.automation_boundary).every((value) => value === false), 'v1 automation boundary differs');
for (const [key, value] of Object.entries(contract.public_boundary)) {
  const allowed = ['site_purpose_and_public_features_allowed', 'technical_architecture_and_data_policy_allowed', 'official_source_priority_allowed', 'current_public_state_and_known_limitations_allowed'].includes(key);
  expect(value === allowed, `v1 public boundary differs: ${key}`);
}

expect(audit.schema_version === 'v1-scope-freeze-audit-v1', 'v1 scope audit schema differs');
expect(audit.release_id === contract.release_id && audit.work_id === contract.work_id, 'v1 scope audit identity differs');
expect(audit.implementation_unit === contract.implementation_unit, 'v1 scope audit unit differs');
expect(audit.status === contract.status && audit.reviewed_at === contract.reviewed_at, 'v1 scope audit status or date differs');
for (const [key, value] of Object.entries(contract.baseline_inventory)) expect(audit.verified[key] === value, `v1 audit baseline differs: ${key}`);
for (const [key, value] of Object.entries({
  included_route_family_entries: routeFamilies.length,
  included_capability_entries: capabilities.length,
  included_public_data_class_entries: publicDataClasses.length,
  excluded_feature_entries: excludedFeatures.length,
})) expect(audit.verified[key] === value, `v1 audit list count differs: ${key}`);
for (const key of [
  'missing_baseline_release',
  'baseline_inventory_errors',
  'route_family_errors',
  'capability_scope_errors',
  'public_data_class_errors',
  'excluded_feature_errors',
  'scope_change_contract_errors',
  'acceptance_contract_errors',
  'public_boundary_errors',
  'privacy_boundary_errors',
  'automation_boundary_errors',
  'workflow_errors',
  'contract_errors',
  'output_errors',
]) expect(audit.verified[key] === 0, `v1 audit error count differs: ${key}`);
expect(Object.values(audit.behavior).every((value) => value === true), 'v1 scope audit behavior differs');
expect(exact(audit.public_boundary, contract.public_boundary), 'v1 audit public boundary differs');
expect(exact(audit.privacy_boundary, contract.privacy_boundary), 'v1 audit privacy boundary differs');
expect(exact(audit.automation_boundary, contract.automation_boundary), 'v1 audit automation boundary differs');
expect(audit.previous_implementation_unit === contract.previous_implementation_unit, 'v1 audit previous unit differs');
expect(audit.next_implementation_unit === contract.next_implementation_unit, 'v1 audit next unit differs');

expect(seoRelease.release_id === contract.baseline_release_id, 'v1 scope baseline release differs');
expect(seoRelease.implementation_unit === 'SEO-QA-RELEASE-01' && seoRelease.status === 'release_ready', 'v1 scope baseline release is not ready');
expect(seoAudit.release_id === seoRelease.release_id && seoAudit.status === 'release_ready', 'v1 scope baseline audit differs');
expect(Array.isArray(publicMeetingDetails.details), 'public meeting-detail collection differs');

// These released documents are historical reference snapshots. Keep them exact.
const baseline = contract.baseline_inventory;
const seoScope = seoRelease.scope;
const sitemapScope = sitemapContract.scope;
const detailScope = sitemapContract.detail_route_counts;
for (const [label, actual, expected] of [
  ['public pages', seoScope.public_pages, baseline.public_pages],
  ['English pages', seoScope.english_pages, baseline.english_pages],
  ['Japanese pages', seoScope.japanese_pages, baseline.japanese_pages],
  ['sitemap public pages', sitemapScope.sitemap_urls, baseline.public_pages],
  ['sitemap English pages', sitemapScope.english_urls, baseline.english_pages],
  ['sitemap Japanese pages', sitemapScope.japanese_urls, baseline.japanese_pages],
  ['route families', sitemapScope.route_families, baseline.route_families],
  ['country detail routes', detailScope.country_detail_routes, baseline.country_detail_routes],
  ['source-country routes', detailScope.source_country_routes, baseline.source_country_routes],
  ['meeting detail routes', detailScope.meeting_detail_routes, baseline.meeting_detail_routes],
  ['glossary term routes', detailScope.glossary_term_routes, baseline.glossary_term_routes],
  ['glossary relationship routes', detailScope.glossary_relationship_routes, baseline.glossary_relationship_routes],
  ['racecourse detail routes', detailScope.racecourse_detail_routes, baseline.racecourse_detail_routes],
  ['racing-type detail routes', detailScope.racing_type_detail_routes, baseline.racing_type_detail_routes],
  ['FAQ routes', detailScope.faq_content_routes, baseline.faq_content_routes],
  ['Methods routes', detailScope.methods_content_routes, baseline.methods_content_routes],
]) expect(actual === expected, `v1 baseline contract differs: ${label} (${actual} !== ${expected})`);

// The current rendered inventory may grow inside already-reviewed public data
// classes. Only bilingual racecourse-detail growth and bilingual meeting-detail
// growth backed by the committed public meeting-detail projection are allowed;
// no new route family, capability, public data class, or feature is permitted.
const urls = [...read(SITEMAP_PATH).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
expect(urls.length >= baseline.public_pages, `v1 rendered sitemap count regressed ${urls.length}`);
const paths = urls.map((url) => new URL(url).pathname);
const renderedFamilies = [...new Set(paths.map((pathname) => {
  const normalized = pathname.startsWith('/ja/') ? pathname.slice(3) : pathname;
  if (normalized === '/') return 'root';
  return normalized.split('/').filter(Boolean)[0];
}))].sort();
expect(exact(renderedFamilies, [...routeFamilies].sort()), `v1 rendered route families differ: ${renderedFamilies.join(', ')}`);

const count = (pattern) => paths.filter((pathname) => pattern.test(pathname)).length;
const currentRacecourseDetails = count(/^\/(?:ja\/)?tracks\/[^/]+\/$/);
const currentMeetingDetails = count(/^\/(?:ja\/)?timetable\/meetings\/[^/]+\/$/);
const racecourseDetailDelta = currentRacecourseDetails - baseline.racecourse_detail_routes;
const meetingDetailDelta = currentMeetingDetails - baseline.meeting_detail_routes;
expect(racecourseDetailDelta >= 0, `v1 racecourse detail inventory regressed ${currentRacecourseDetails}`);
expect(meetingDetailDelta >= 0, `v1 meeting detail inventory regressed ${currentMeetingDetails}`);
expect(racecourseDetailDelta % 2 === 0, `v1 racecourse detail growth is not bilingual ${racecourseDetailDelta}`);
expect(meetingDetailDelta % 2 === 0, `v1 meeting detail growth is not bilingual ${meetingDetailDelta}`);
expect(currentMeetingDetails === publicMeetingDetails.details.length * 2, `v1 meeting detail growth is not backed by public projection ${currentMeetingDetails}`);
const perLanguageDelta = (racecourseDetailDelta + meetingDetailDelta) / 2;
const currentEnglishPages = paths.filter((pathname) => !pathname.startsWith('/ja/')).length;
const currentJapanesePages = paths.filter((pathname) => pathname.startsWith('/ja/')).length;
expect(urls.length === baseline.public_pages + racecourseDetailDelta + meetingDetailDelta, `v1 rendered sitemap growth is not explained by reviewed detail routes ${urls.length}`);
expect(currentEnglishPages === baseline.english_pages + perLanguageDelta, `v1 rendered English inventory differs ${currentEnglishPages}`);
expect(currentJapanesePages === baseline.japanese_pages + perLanguageDelta, `v1 rendered Japanese inventory differs ${currentJapanesePages}`);

for (const [label, actual, expected] of [
  ['rendered country details', count(/^\/(?:ja\/)?countries\/[^/]+\/$/), baseline.country_detail_routes],
  ['rendered source-country routes', count(/^\/(?:ja\/)?sources\/[^/]+\/$/), baseline.source_country_routes],
  ['rendered glossary terms', count(/^\/(?:ja\/)?glossary\/(?!relationships\/)[^/]+\/$/), baseline.glossary_term_routes],
  ['rendered glossary relationships', count(/^\/(?:ja\/)?glossary\/relationships\/$/), baseline.glossary_relationship_routes],
  ['rendered racing-type details', count(/^\/(?:ja\/)?types\/[^/]+\/$/), baseline.racing_type_detail_routes],
  ['rendered FAQ routes', count(/^\/(?:ja\/)?faq\/$/), baseline.faq_content_routes],
  ['rendered Methods routes', count(/^\/(?:ja\/)?methods\/\/$/), baseline.methods_content_routes],
]) expect(actual === expected, `v1 rendered inventory differs: ${label} (${actual} !== ${expected})`);
expect(currentRacecourseDetails === baseline.racecourse_detail_routes + racecourseDetailDelta, 'v1 current racecourse detail inventory differs');
expect(currentMeetingDetails === baseline.meeting_detail_routes + meetingDetailDelta, 'v1 current meeting detail inventory differs');

const doc = read(DOC_PATH);
for (const marker of [
  'V1-SCOPE-FREEZE-01',
  'WHR-V1-PREPARATION-V1',
  'Public pages: 771',
  'Route families: 17',
  'A+ remains a lightweight programme summary',
  'new top-level route family',
  'scripts/check-v1-scope-freeze.mjs',
  '.github/workflows/v1-scope-freeze.yml',
  'V1-DATA-AUDIT-01',
]) expect(doc.includes(marker), `v1 scope documentation marker is missing: ${marker}`);

const workflow = read(WORKFLOW_PATH);
for (const marker of [
  'permissions:',
  'contents: read',
  'npm install --package-lock=false',
  'npm run build',
  'node scripts/check-seo-qa-release.mjs',
  'node scripts/check-v1-scope-freeze.mjs',
  'git status --porcelain',
]) expect(workflow.includes(marker), `v1 scope workflow marker is missing: ${marker}`);
for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare', 'deploy']) {
  expect(!workflow.toLowerCase().includes(forbidden.toLowerCase()), `v1 scope workflow contains forbidden marker: ${forbidden}`);
}

console.log('V1_SCOPE_FREEZE: pass');
console.log(`RELEASE_ID: ${contract.release_id}`);
console.log(`HISTORICAL_PUBLIC_PAGES: ${baseline.public_pages}`);
console.log(`CURRENT_PUBLIC_PAGES: ${urls.length}`);
console.log(`CURRENT_RACECOURSE_DETAIL_ROUTES: ${currentRacecourseDetails}`);
console.log(`CURRENT_MEETING_DETAIL_ROUTES: ${currentMeetingDetails}`);
console.log(`ROUTE_FAMILIES: ${baseline.route_families}`);
console.log(`INCLUDED_CAPABILITIES: ${capabilities.length}`);
console.log(`PUBLIC_DATA_CLASSES: ${publicDataClasses.length}`);
console.log(`EXCLUDED_FEATURES: ${excludedFeatures.length}`);
console.log('SCOPE_EXPANSION_WITHOUT_REVIEW: false');
console.log('NEXT_IMPLEMENTATION_UNIT: V1-DATA-AUDIT-01');