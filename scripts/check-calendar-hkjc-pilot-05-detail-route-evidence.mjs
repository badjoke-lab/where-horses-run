import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const audit = readJson('data/audits/calendar-hkjc-pilot-05-detail-route-evidence-v1.json');
const activation = readJson('data/audits/calendar-hkjc-detail-operator-activation-v1.json');
const registry = readJson('data/static/calendar-acquisition-registry.json');
const doc = readText('docs/calendar/hkjc-pilot-05-detail-route-evidence.md');

if (audit.schema_version !== 'calendar-hkjc-pilot-05-detail-route-evidence-v1') fail('audit schema differs.');
if (audit.work_id !== 'WHR-CAL-HONG-KONG-HKJC') fail('audit Work ID differs.');
if (audit.implementation_unit !== 'HKJC-PILOT-05') fail('audit implementation unit differs.');
if (Number.isNaN(Date.parse(audit.reviewed_at))) fail('reviewed_at is invalid.');

const foundation = audit.foundation_decision ?? {};
if (foundation.artifact_only_detail_core !== 'accepted') fail('historical detail core decision differs.');
if (foundation.external_review_artifact_collector !== 'accepted') fail('historical collector decision differs.');
if (foundation.github_actions_detail_runner !== 'not_evidence_backed') fail('historical hosted detail runner decision differs.');
if (foundation.registry_detail_source_activation !== false || foundation.registry_detail_adapter_activation !== false) fail('historical PILOT-05 Registry activation decision differs.');
if (foundation.supported_rank_expansion !== false) fail('historical PILOT-05 rank-expansion decision differs.');

const live = audit.bounded_live_evidence ?? {};
if (live.workflow_run_id !== 29104855428 || live.artifact_id !== 8232344596) fail('live evidence identity differs.');
if (live.artifact_digest !== 'sha256:a7eb087aa083bcbea4ddbfa465b8f52c45c175c73f5fd24147497a1c80548da1') fail('live evidence digest differs.');
if (live.observed_rank !== 'C' || live.coverage_claim !== 'none') fail('live evidence rank/coverage differs.');
if (live.records_discovered !== 1 || live.records_updated !== 0) fail('live evidence record counts differ.');
if (live.unresolved_meeting_count !== 1 || live.source_error_count !== 1) fail('live evidence unresolved/error counts differ.');
if (!exact(live.source_error_codes, ['source_unavailable'])) fail('live evidence source error codes differ.');
if (live.candidate_review_state !== 'needs_review' || live.publication_effect !== 'none') fail('live evidence review/publication state differs.');
if (live.raw_source_storage !== 'disabled' || live.canonical_write !== 'disabled' || live.public_write !== 'disabled') fail('live evidence storage/write boundary differs.');
if (live.automatic_approval !== false || live.automatic_promotion !== false || live.automatic_publication !== false) fail('live evidence automatic-action boundary differs.');
if (live.protected_state_hash_check !== 'pass' || live.repository_clean_after_run !== true) fail('live evidence immutability/cleanup proof differs.');

const routes = audit.route_probe_evidence ?? {};
if (routes.workflow_run_id !== 29105287177 || routes.artifact_id !== 8232528727) fail('route probe evidence identity differs.');
if (routes.artifact_digest !== 'sha256:564ceb3ab90f6526a2a78ff6c6e88fa25a237688c8c39f958026ba174411b0e4') fail('route probe digest differs.');
if (routes.target_meetings?.length !== 3 || routes.route_variants_per_target !== 3 || routes.total_results !== 9) fail('route probe scope differs.');
if (routes.common_http_status !== 200 || routes.common_response_bytes !== 120504 || routes.common_visible_text_chars !== 5485) fail('route probe shell summary differs.');
for (const key of ['target_post_time_shape_observed','target_race_name_shape_observed','target_distance_shape_observed','target_surface_shape_observed','raw_body_stored']) {
  if (routes[key] !== false) fail(`route probe ${key} must remain false.`);
}

const sessions = audit.session_strategy_evidence ?? {};
if (sessions.workflow_run_id !== 29105478858 || sessions.artifact_id !== 8232602372) fail('session strategy evidence identity differs.');
if (sessions.artifact_digest !== 'sha256:c3670ad0038a183b7da3b84094d029af02e4015b4d52dc12542f851c4fa5f52d') fail('session strategy digest differs.');
if (sessions.target !== '2026-07-08:HV:1') fail('session strategy target differs.');
if (!exact(sessions.strategies, ['direct-browser-headers','fixture-warmup-cookie','racecard-base-warmup-cookie'])) fail('session strategies differ.');
if (sessions.successful_http_responses !== 3 || sessions.common_http_status !== 200 || sessions.common_response_bytes !== 120504) fail('session response summary differs.');
for (const key of ['target_meeting_marker_observed','post_time_shape_observed','race_name_shape_observed','distance_shape_observed','surface_shape_observed','cookies_observed_from_warmup','raw_body_stored']) {
  if (sessions[key] !== false) fail(`session strategy ${key} must remain false.`);
}

const decision = audit.decision ?? {};
if (decision.detail_route_status !== 'hosted_http_path_not_proven') fail('historical detail route status differs.');
if (decision.do_not_infer_source_absence !== true) fail('source-absence inference guard differs.');
if (decision.keep_registry_profile_provisional !== true || decision.keep_detail_source_id_null !== true || decision.keep_detail_adapter_id_null !== true) fail('historical PILOT-05 Registry decision differs.');
if (!exact(decision.keep_supported_observation_ranks, ['C'])) fail('historical PILOT-05 supported-rank decision differs.');
if (decision.next_implementation_unit !== 'HKJC-PILOT-06') fail('next implementation unit differs.');
if (decision.next_title !== 'HKJC detail runner and source-route reconciliation') fail('next implementation title differs.');
for (const [key, value] of Object.entries(audit.boundaries ?? {})) if (value !== false) fail(`historical boundary ${key} must remain false.`);

const profile = registry.records.find((record) => record.system_id === 'hong-kong-hkjc-system');
if (!profile) fail('HKJC Registry profile missing.');
else {
  if (profile.profile_status !== 'provisional') fail('current HKJC Registry profile must remain provisional.');
  if (profile.primary_runner !== 'github_actions' || profile.fallback_runner !== null || !profile.pending_fields?.includes('fallback_runner')) fail('current HKJC runner state differs.');
  if (profile.detail_source_id !== 'hkjc-detail-reviewed-import' || profile.detail_adapter_id !== 'hkjc-detail-reviewed-import-v1') fail('current HKJC detail source/adapter activation differs.');
  if (!exact(profile.supported_observation_ranks, ['C', 'B', 'B+', 'A', 'A+'])) fail('current HKJC supported observation ranks differ.');
  if (profile.public_ceiling !== 'A') fail('current HKJC public ceiling must remain A.');
  if (profile.supports_selected_meetings !== false || profile.supports_rank_upgrade_retry !== false) fail('current HKJC retry ownership must remain pending.');
}

if (activation.schema_version !== 'calendar-hkjc-detail-operator-activation-v1'
  || activation.decision !== 'activate_operator_reviewed_detail_path') fail('current HKJC detail activation audit differs.');
if (!exact(activation.detail_route?.evidence_backed_observation_ranks, ['B', 'A+'])) fail('current activation evidence ranks differ.');
if (Object.values(activation.side_effect_boundary ?? {}).some((value) => value !== false)) fail('current activation side-effect boundary differs.');

for (const phrase of [
  'artifact-only detail core: accepted',
  'github_actions detail runner: not evidence-backed',
  'detail_source_id: null',
  'detail_adapter_id: null',
  'response bytes: 120504',
  'HKJC-PILOT-06',
]) {
  if (!doc.includes(phrase)) fail(`historical decision document missing ${phrase}.`);
}

const serialized = JSON.stringify(audit).toLowerCase();
for (const forbiddenKey of ['raw_html','source_body','horse_name','jockey_name','trainer_name','odds_value','result_payload','payout_amount','prediction','tip','stream_url']) {
  if (serialized.includes(`"${forbiddenKey}"`)) fail(`audit contains forbidden data key ${forbiddenKey}.`);
}

if (errors.length) {
  console.error(`CALENDAR_HKJC_PILOT_05_DETAIL_ROUTE_EVIDENCE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_HKJC_PILOT_05_DETAIL_ROUTE_EVIDENCE: pass');
console.log('HISTORICAL_HOSTED_DETAIL_RUNNER: not_evidence_backed');
console.log('HISTORICAL_REGISTRY_DETAIL_ACTIVATION: false');
console.log('CURRENT_OPERATOR_DETAIL_SOURCE_ADAPTER: active');
console.log('CURRENT_SUPPORTED_RANKS: C,B,B+,A,A+');
console.log('CURRENT_SELECTED_MEETING_RANK_RETRY: pending');
