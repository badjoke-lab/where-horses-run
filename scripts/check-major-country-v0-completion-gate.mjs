import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const planPath = 'data/static/major-country-manual-source-snapshot-plan.json';
const gatePath = 'data/static/major-country-v0-completion-gate.json';
const sourceGroupsPath = 'data/static/major-country-acquisition-source-groups.json';
const auditPath = 'data/static/major-country-sample-extraction-audit-matrix.json';
const packagePath = 'package.json';
const scriptPath = 'scripts/check-major-country-v0-completion-gate.mjs';

const completedArtifacts = [
  'data/static/major-country-racing-inventory.json',
  'data/static/major-country-acquisition-test-matrix.json',
  sourceGroupsPath,
  'data/static/major-country-sample-acquisition-fixtures.json',
  'data/static/major-country-sample-acquisition-output-snapshots.json',
  'data/static/major-country-parser-contracts.json',
  'data/static/major-country-sample-extraction-snapshots.json',
  auditPath,
];
const expectedPrs = ['PR-088', 'PR-089', 'PR-090', 'PR-091', 'PR-092', 'PR-093', 'PR-094', 'PR-095'];
const expectedCountries = [
  'japan',
  'hong-kong',
  'united-arab-emirates',
  'united-kingdom',
  'ireland',
  'france',
  'united-states',
  'canada',
  'australia',
  'new-zealand',
  'south-africa',
  'south-korea',
  'singapore',
];
const requiredMinimumTargets = [
  'racecourse_inventory_or_meeting_context',
  'annual_or_rolling_fixture',
  'first_race_time',
  'per_race_time',
  'official_source_url',
  'source_capture_date',
];
const requiredBasis = [
  'inventory',
  'acquisition_matrix',
  'source_groups',
  'sample_fixtures',
  'parser_contracts',
  'extraction_audit_matrix',
];
const requiredBeforeLiveExtraction = [
  'one verified manual static source snapshot',
  'one normalized sample record',
  'source URL trace',
  'confirmation that no odds/payouts/predictions/tips are included',
];
const explicitNotComplete = [
  'no live fetch runtime',
  'no parser implementation',
  'no real source snapshots captured yet',
  'no real normalized timetable records generated yet',
  'no public timetable UI for major-country data yet',
  'no cron or scheduled update process',
  'no raw source body storage',
  'no generated live timetable records',
  'no odds',
  'no payouts',
  'no predictions',
  'no tips',
];
const prohibitedKeys = new Set([
  'raw_body',
  'raw_html',
  'raw_source_body',
  'source_body',
  'html',
  'body',
  'odds',
  'payouts',
  'predictions',
  'tips',
  'timetable_records',
  'generated_timetable',
]);
const prohibitedTextPatterns = [
  { pattern: new RegExp(`\\b${['fet', 'ch'].join('')}\\s*\\(`), label: 'live fetch runtime' },
  { pattern: /\bglobalThis\[['"]fetch['"]\]\s*\(/, label: 'live fetch runtime' },
  { pattern: /\bhttps?\.request\s*\(/, label: 'HTTP request runtime' },
  { pattern: /\bhttps?\.get\s*\(/, label: 'HTTP request runtime' },
  { pattern: /\b(?:import\s+[^;]*(?:cheerio|jsdom|puppeteer|playwright)|from\s+['"][^'"]*(?:cheerio|jsdom|puppeteer|playwright)[^'"]*['"]|require\(\s*['"][^'"]*(?:cheerio|jsdom|puppeteer|playwright)[^'"]*['"]\s*\))/, label: 'scraping dependency' },
  { pattern: /\b(?:function|const|let|var)\s+parse(?:Race|Fixture|Racecard|Timetable)\b/, label: 'parser implementation' },
  { pattern: /\bclass\s+parse(?:Race|Fixture|Racecard|Timetable)\b/i, label: 'parser implementation' },
];
const errors = [];

function fail(message) {
  errors.push(message);
}

function readText(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) {
    fail(`${relativePath} must exist.`);
    return null;
  }
  return readFileSync(absolutePath, 'utf8');
}

function readJson(relativePath) {
  const text = readText(relativePath);
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`${relativePath} must parse as JSON: ${error.message}`);
    return null;
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function key(countryId, groupId) {
  return `${countryId}/${groupId}`;
}

function requireIncludes(array, value, label) {
  if (!Array.isArray(array) || !array.includes(value)) fail(`${label} must include ${value}.`);
}

function requireAllIncludes(array, values, label) {
  for (const value of values) requireIncludes(array, value, label);
}

function walk(value, visitor, pathParts = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walk(entry, visitor, [...pathParts, String(index)]));
    return;
  }
  if (!isPlainObject(value)) return;
  visitor(value, pathParts);
  for (const [objectKey, entry] of Object.entries(value)) walk(entry, visitor, [...pathParts, objectKey]);
}

const plan = readJson(planPath);
const gate = readJson(gatePath);
const sourceGroups = readJson(sourceGroupsPath);
const audit = readJson(auditPath);
const packageJson = readJson(packagePath);
for (const artifact of completedArtifacts) readJson(artifact);

const sourceGroupKeys = new Map();
for (const country of sourceGroups?.countries ?? []) {
  for (const group of country.acquisition_groups ?? []) {
    sourceGroupKeys.set(key(country.country_id, group.group_id), {
      country_id: country.country_id,
      group_id: group.group_id,
      update_model: country.update_model,
    });
  }
}
const auditKeys = new Map();
for (const country of audit?.countries ?? []) {
  for (const group of country.audit_groups ?? []) auditKeys.set(key(group.country_id, group.group_id), group);
}
const planEntries = [];
const planCountries = new Map();
for (const country of plan?.countries ?? []) {
  planCountries.set(country.country_id, country);
  for (const group of country.manual_snapshot_groups ?? []) planEntries.push(group);
}
const planKeys = new Map(planEntries.map((entry) => [key(entry.country_id, entry.group_id), entry]));

if (plan?.countries_count !== 13) fail(`${planPath}.countries_count must be 13.`);
if (plan?.acquisition_group_count !== 25) fail(`${planPath}.acquisition_group_count must be 25.`);
for (const countryId of expectedCountries) {
  if (!planCountries.has(countryId)) fail(`${planPath} must include country ${countryId}.`);
}
if (planEntries.length !== 25) fail(`${planPath} must include 25 acquisition groups.`);
if (sourceGroupKeys.size !== 25) fail(`${sourceGroupsPath} must include 25 acquisition groups.`);
if (auditKeys.size !== 25) fail(`${auditPath} must include 25 audit groups.`);

for (const [entryKey, expected] of sourceGroupKeys) {
  if (!planKeys.has(entryKey)) fail(`${planPath} missing PR-090 acquisition group ${entryKey}.`);
  const auditEntry = auditKeys.get(entryKey);
  if (!auditEntry) fail(`${auditPath} missing PR-090 acquisition group ${entryKey}.`);
  if (auditEntry && auditEntry.update_model !== expected.update_model) fail(`${auditPath} ${entryKey} update_model must match PR-090.`);
}
for (const entry of planEntries) {
  const entryKey = key(entry.country_id, entry.group_id);
  const label = `${planPath}:${entryKey}`;
  if (!sourceGroupKeys.has(entryKey)) fail(`${label} must correspond to a PR-090 acquisition group.`);
  const auditEntry = auditKeys.get(entryKey);
  if (!auditEntry) fail(`${label} must correspond to a PR-095 audit matrix entry.`);
  if (entry.update_model !== auditEntry?.update_model) fail(`${label}.update_model must match PR-095.`);
  if (entry.country_id === 'singapore') continue;

  if (entry.manual_snapshot_required !== true) fail(`${label}.manual_snapshot_required must be true.`);
  if (entry.traceability_status_from_pr095 !== 'ready_for_manual_source_snapshot') fail(`${label}.traceability_status_from_pr095 must be ready_for_manual_source_snapshot.`);
  if (auditEntry?.traceability_status !== 'ready_for_manual_source_snapshot') fail(`${label} PR-095 traceability status must be ready_for_manual_source_snapshot.`);
  if (entry.snapshot_capture_mode !== 'manual_static_source_snapshot') fail(`${label}.snapshot_capture_mode must be manual_static_source_snapshot.`);
  if (!isNonEmptyString(entry.user_visible_goal)) fail(`${label}.user_visible_goal must be a non-empty string.`);
  if (!isNonEmptyString(entry.operator_or_system_scope)) fail(`${label}.operator_or_system_scope must be a non-empty string.`);
  if (!isNonEmptyString(entry.annual_vs_rolling_handling)) fail(`${label}.annual_vs_rolling_handling must be a non-empty string.`);
  if (!/annual|season/i.test(entry.annual_vs_rolling_handling) || !/coarse schedule/i.test(entry.annual_vs_rolling_handling)) {
    fail(`${label}.annual_vs_rolling_handling must state annual/season fixture is only a coarse schedule source.`);
  }
  if (!/rolling|racecard|entries|declarations|daily race/i.test(entry.annual_vs_rolling_handling) || !/final/i.test(entry.annual_vs_rolling_handling)) {
    fail(`${label}.annual_vs_rolling_handling must state rolling race information is required before final timing.`);
  }
  requireAllIncludes(entry.snapshot_source_basis, requiredBasis, `${label}.snapshot_source_basis`);
  requireAllIncludes(entry.minimum_snapshot_targets, requiredMinimumTargets, `${label}.minimum_snapshot_targets`);
  requireAllIncludes(entry.required_before_live_extraction, requiredBeforeLiveExtraction, `${label}.required_before_live_extraction`);
  if (entry.next_phase !== 'manual_static_source_snapshots') fail(`${label}.next_phase must be manual_static_source_snapshots.`);
}

const singaporeCountry = planCountries.get('singapore');
const singaporeGroups = singaporeCountry?.manual_snapshot_groups ?? [];
if (singaporeGroups.length !== 1 || singaporeGroups[0]?.group_id !== 'singapore-turf-club-legacy') {
  fail('Singapore must contain only singapore-turf-club-legacy.');
}
const singapore = singaporeGroups[0];
if (singapore) {
  if (singapore.update_model !== 'legacy_no_active_racing') fail('Singapore update_model must be legacy_no_active_racing.');
  if (singapore.traceability_status_from_pr095 !== 'legacy_inventory_only') fail('Singapore traceability_status_from_pr095 must be legacy_inventory_only.');
  if (singapore.manual_snapshot_required !== false) fail('Singapore manual_snapshot_required must be false.');
  if (singapore.snapshot_capture_mode !== 'legacy_inventory_only') fail('Singapore snapshot_capture_mode must be legacy_inventory_only.');
  if (!Array.isArray(singapore.minimum_snapshot_targets) || singapore.minimum_snapshot_targets.length !== 0) fail('Singapore must have no active timetable targets.');
  if (singapore.minimum_snapshot_targets?.includes('first_race_time') || singapore.minimum_snapshot_targets?.includes('per_race_time')) {
    fail('Singapore must not require first_race_time or per_race_time targets.');
  }
  if (!Array.isArray(singapore.required_before_live_extraction) || singapore.required_before_live_extraction.length !== 0) fail('Singapore required_before_live_extraction must be empty.');
  if (singapore.next_phase !== 'keep_legacy_inventory_only') fail('Singapore next_phase must be keep_legacy_inventory_only.');
}
const auditSingapore = auditKeys.get('singapore/singapore-turf-club-legacy');
if (auditSingapore?.traceability_status !== 'legacy_inventory_only') fail('Singapore must remain legacy_inventory_only in PR-095.');

if (gate?.schema_version !== 'major-country-v0-completion-gate-v0') fail(`${gatePath}.schema_version must be major-country-v0-completion-gate-v0.`);
if (gate?.scope !== 'major-countries-v0') fail(`${gatePath}.scope must be major-countries-v0.`);
if (gate?.status !== 'static_acquisition_readiness_complete') fail(`${gatePath}.status must be static_acquisition_readiness_complete.`);
if (gate?.countries_count !== 13) fail(`${gatePath}.countries_count must be 13.`);
if (gate?.acquisition_group_count !== 25) fail(`${gatePath}.acquisition_group_count must be 25.`);
requireAllIncludes(gate?.preparation_prs, expectedPrs, `${gatePath}.preparation_prs`);
requireAllIncludes(gate?.completed_artifacts, completedArtifacts, `${gatePath}.completed_artifacts`);
if (!isNonEmptyString(gate?.user_visible_status) || !/does not yet show real major-country timetable data/i.test(gate.user_visible_status)) {
  fail(`${gatePath}.user_visible_status must clearly say real timetable UI is not complete.`);
}
if (!isNonEmptyString(gate?.operation_status) || !/Manual source snapshots.*still not complete/i.test(gate.operation_status)) {
  fail(`${gatePath}.operation_status must clearly say manual source snapshots are still not complete.`);
}
requireAllIncludes(gate?.explicit_not_complete, explicitNotComplete, `${gatePath}.explicit_not_complete`);
requireIncludes(gate?.next_phase, 'manual_static_source_snapshots', `${gatePath}.next_phase`);
if (gate?.next_pr !== 'PR-097') fail(`${gatePath}.next_pr must be PR-097.`);

for (const [entryKey, auditEntry] of auditKeys) {
  if (auditEntry.traceability_status === 'ready_for_manual_source_snapshot' && !planKeys.has(entryKey)) {
    fail(`PR-095 ready_for_manual_source_snapshot entry ${entryKey} must appear in the plan.`);
  }
}

for (const [relativePath, data] of [
  [planPath, plan],
  [gatePath, gate],
]) {
  walk(data, (object, pathParts) => {
    for (const objectKey of Object.keys(object)) {
      if (prohibitedKeys.has(objectKey)) fail(`${relativePath}:${pathParts.concat(objectKey).join('.')} must not add prohibited field ${objectKey}.`);
    }
  });
}

for (const [relativePath, text] of [
  [planPath, readText(planPath) ?? ''],
  [gatePath, readText(gatePath) ?? ''],
  [scriptPath, readText(scriptPath) ?? ''],
]) {
  for (const { pattern, label } of prohibitedTextPatterns) {
    if (pattern.test(text)) fail(`${relativePath} must not add ${label}.`);
  }
}
for (const dependency of ['cheerio', 'jsdom', 'puppeteer', 'playwright']) {
  if (packageJson?.dependencies?.[dependency] || packageJson?.devDependencies?.[dependency]) {
    fail(`${packagePath} must not add scraping dependency ${dependency}.`);
  }
}
if (!packageJson?.scripts?.['validate:major-country-v0-completion-gate']?.includes(scriptPath)) {
  fail(`${packagePath} must define validate:major-country-v0-completion-gate.`);
}
const checkScript = packageJson?.scripts?.check ?? '';
const auditValidation = 'validate:major-country-sample-extraction-audit-matrix';
const gateValidation = 'validate:major-country-v0-completion-gate';
if (!checkScript.includes(gateValidation)) fail(`${packagePath} check script must include ${gateValidation}.`);
if (checkScript.includes(auditValidation) && checkScript.includes(gateValidation) && checkScript.indexOf(gateValidation) < checkScript.indexOf(auditValidation)) {
  fail(`${packagePath} check script must run ${gateValidation} after ${auditValidation}.`);
}

if (errors.length > 0) {
  console.error('Major-country v0 completion gate validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Validated major-country v0 completion gate: ${planEntries.length} acquisition groups across ${expectedCountries.length} countries.`);
