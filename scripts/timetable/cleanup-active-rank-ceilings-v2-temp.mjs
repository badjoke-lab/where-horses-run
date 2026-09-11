import fs from 'node:fs';
import path from 'node:path';

const read = (file) => fs.readFileSync(file, 'utf8');
const write = (file, text) => fs.writeFileSync(file, text);
const exists = (file) => fs.existsSync(file);

function walk(dir, out = []) {
  if (!exists(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function replaceRequired(file, oldValue, newValue, label = oldValue) {
  let text = read(file);
  if (!text.includes(oldValue)) throw new Error(`${file}: missing ${label}`);
  text = text.replace(oldValue, newValue);
  write(file, text);
}

function replaceRegex(file, pattern, replacement, label) {
  const text = read(file);
  const next = text.replace(pattern, replacement);
  if (next === text) throw new Error(`${file}: regex did not match ${label}`);
  write(file, next);
}

function removeLines(file, patterns) {
  if (!exists(file)) return;
  const before = read(file);
  const lines = before.split('\n');
  const next = lines.filter((line) => !patterns.some((pattern) => pattern.test(line))).join('\n');
  if (next !== before) write(file, next);
}

const ceilingKeyPattern = /(?:public|publication).*ceiling|ceiling.*(?:public|publication)/i;
const ceilingTokenPattern = /public_ceiling|publication_ceiling|expected_public_ceiling|public_ceiling_projection_required/i;

function scrubStaticJson(value) {
  if (Array.isArray(value)) {
    return value
      .filter((item) => !(typeof item === 'string' && ceilingTokenPattern.test(item)))
      .map(scrubStaticJson);
  }
  if (value && typeof value === 'object') {
    const result = {};
    for (const [key, child] of Object.entries(value)) {
      if (ceilingKeyPattern.test(key)) continue;
      if (typeof child === 'string' && child === 'public_ceiling_projection_required') {
        result[key] = 'promotion_validation_required';
        continue;
      }
      result[key] = scrubStaticJson(child);
    }
    return result;
  }
  return value;
}

for (const file of walk('data/static').filter((file) => file.endsWith('.json'))) {
  const data = JSON.parse(read(file));
  const scrubbed = scrubStaticJson(data);
  write(file, `${JSON.stringify(scrubbed, null, 2)}\n`);
}

// Acquisition registry validation: technical capability is descriptive, never a public rank cap.
{
  const file = 'scripts/check-calendar-acquisition-registry.mjs';
  let text = read(file);
  text = text.replace(/const rankOrder =[^;]+;\n/s, '');
  text = text.replace(/\n\s*if \(rankOrder\[entry\.public_ceiling\][\s\S]*?\n\s*\}/, '');
  text = text.replaceAll('public_ceiling', '');
  write(file, text);
}

// Review planning no longer creates work merely because evidence exceeds a policy ceiling.
{
  const file = 'scripts/timetable/review-cohort-planner.mjs';
  let text = read(file);
  text = text.replace("const RANK_INDEX = new Map(RANKS.map((rank, index) => [rank, index]));\n", '');
  text = text.replace("  'public_ceiling_projection_required',\n", '');
  text = text.replace(/\n  const exceedsPublicCeiling = highestRank !== null\n    && RANK_INDEX\.get\(highestRank\) > RANK_INDEX\.get\(profile\.public_ceiling\);\n/, '\n');
  text = text.replace("    promotionDependency = exceedsPublicCeiling\n      ? 'public_ceiling_projection_required'\n      : 'coverage_review_required';", "    promotionDependency = 'coverage_review_required';");
  text = text.replace("  } else if (exceedsPublicCeiling) {\n    promotionDependency = 'public_ceiling_projection_required';\n", '');
  text = text.replace("    public_ceiling: profile.public_ceiling,\n", '');
  text = text.replace("        public_ceiling: classification.public_ceiling,\n", '');
  text = text.replace("      'public_ceiling', 'public_display_risk', 'promotion_dependency', 'batch_count', 'rank_counts',", "      'public_display_risk', 'promotion_dependency', 'batch_count', 'rank_counts',");
  text = text.replace("      if (cohort.public_ceiling !== profile.public_ceiling) errors.push(`${location}.public_ceiling differs from Registry`);\n", '');
  write(file, text);
}

// Operations summary does not report a rank-ceiling dependency class.
{
  const file = 'scripts/timetable/operations-v2.mjs';
  let text = read(file);
  text = text.replace(/\n  const publicCeilingDependencies = \(reviewCohortPlan\?\.cohorts \?\? \[\]\)\n    \.filter\(\(cohort\) => cohort\.promotion_dependency === 'public_ceiling_projection_required'\)\.length;\n/, '\n');
  text = text.replace(/\n\s*public_ceiling_projection_required_count: publicCeilingDependencies,/, '');
  write(file, text);
}

// Review PR preparation keeps only evidence/coverage/source-recovery dependencies.
{
  const file = 'scripts/timetable/review-pr-preparation.mjs';
  let text = read(file);
  text = text.replace(/\n  if \(dependency === 'public_ceiling_projection_required'\) \{[\s\S]*?\n  \} else if \(dependency === 'promotion_validation_required'\) \{/, "\n  if (dependency === 'promotion_validation_required') {");
  write(file, text);
}

// Local pilot readiness checks source capability, not a configured publication rank ceiling.
{
  const file = 'scripts/timetable/build-local-racing-pilot-review.mjs';
  let text = read(file);
  text = text.replace(/\nconst ceilingPass = readinessRecord\.public_ceiling === control\.pilot\.expected_public_ceiling;/, '');
  text = text.replace(/\nif \(!ceilingPass\) blockers\.push\([^\n]+\);/, '');
  text = text.replace(/\n\s*public_ceiling: \{[\s\S]*?\n\s*\},/, '');
  text = text.replace(/\s*&& ceilingPass\n/, '\n');
  write(file, text);
}

// Active route/operator code must never assert or emit public/publication ceilings.
removeLines('scripts/timetable/hkjc-rank-upgrade-operations-core.mjs', [
  /profile\.public_ceiling/,
]);
removeLines('scripts/timetable/build-tjk-2026-09-01-approved-candidate.mjs', [
  /review\.public_ceiling/,
  /publication_ceiling:/,
]);
removeLines('scripts/timetable/tjk-bounded-adapter.mjs', [
  /revalidation\?\.public_ceiling/,
  /publication_ceiling:/,
]);
removeLines('scripts/timetable/tjk-current-bounded-adapter.mjs', [
  /public_ceiling/,
  /publication_ceiling:/,
]);
removeLines('scripts/timetable/tjk-parameterized-body-probe.mjs', [
  /public_ceiling/,
  /publication_ceiling:/,
]);
removeLines('scripts/timetable/build-calendar-jra-2026-08-29-30-reviewed-import-approved.mjs', [
  /public_ceiling/,
  /publication_ceiling:/,
]);
removeLines('scripts/timetable/japan-current-window-audit-core.mjs', [
  /public_ceiling/,
  /publication_ceiling:/,
]);
removeLines('scripts/timetable/uae-era-detail-artifact-core.mjs', [
  /public_ceiling/,
  /publication_ceiling:/,
]);

{
  const file = 'scripts/timetable/pipeline-v1/registry-overrides.mjs';
  if (exists(file)) removeLines(file, [/public_ceiling:/, /publication_ceiling:/]);
}

// Remove old ceiling assertions from timetable scripts while preserving technical capability checks.
for (const file of walk('scripts/timetable').filter((file) => file.endsWith('.mjs'))) {
  let text = read(file);
  if (!ceilingTokenPattern.test(text)) continue;
  const lines = text.split('\n');
  const next = lines.filter((line) => !ceilingTokenPattern.test(line)).join('\n');
  write(file, next);
}

console.log('ACTIVE_RANK_CEILING_CLEANUP_V2: applied');
