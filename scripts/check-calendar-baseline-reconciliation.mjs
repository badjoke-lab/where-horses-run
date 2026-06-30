import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => {
  const full = path.join(root, file);
  if (!existsSync(full)) {
    fail(`${file} must exist.`);
    return '';
  }
  return readFileSync(full, 'utf8');
};
const parse = (file) => {
  try { return JSON.parse(read(file)); }
  catch (error) { fail(`${file} must parse: ${error.message}`); return null; }
};
const list = (value, label) => {
  if (!Array.isArray(value) || !value.length || value.some((entry) => typeof entry !== 'string' || !entry.trim())) {
    fail(`${label} must be a non-empty string array.`);
    return [];
  }
  if (new Set(value).size !== value.length) fail(`${label} has duplicates.`);
  return value;
};
const same = (actual, expected, label) => {
  actual = list(actual, label);
  if (actual.length !== expected.length || expected.some((value, index) => actual[index] !== value)) fail(`${label} is incorrect.`);
};

const map = parse('data/audits/calendar-baseline-migration-map.json');
const pkg = parse('package.json');
const schedule = read('.github/workflows/timetable-scheduled-refresh.yml');
const classes = ['retain', 'repair', 'migrate', 'replace', 'archive'];
const priorities = ['critical', 'high', 'medium', 'low'];
const domains = ['contracts','canonical_registries','publication_policy','source_routes','snapshot_contracts','adapters','fixtures','candidate_generation','promotion','canonical_generation','public_projection','runtime_pages','legacy_inputs','build_commands','fixed_dates','refresh_workflows','source_pilots','manual_seeds','pr_specific_artifacts','research_evidence','operations'];

if (map) {
  if (map.schema_version !== 'calendar-baseline-migration-map-v1') fail('unexpected schema_version.');
  if (map.work_id !== 'WHR-CAL-BASELINE-RECONCILE' || map.status !== 'reviewed_complete') fail('baseline map must be reviewed_complete.');
  if (map.next_work_id !== 'WHR-CAL-PIPELINE-V1') fail('next_work_id must be WHR-CAL-PIPELINE-V1.');
  if (!/^[0-9a-f]{40}$/.test(map.reviewed_against ?? '')) fail('reviewed_against must be a full SHA.');
  same(map.classification_order, classes, 'classification_order');
  same(map.priority_order, priorities, 'priority_order');
  same(map.required_domains, domains, 'required_domains');
  Object.entries(map.principles ?? {}).forEach(([key, value]) => { if (value !== true) fail(`principles.${key} must be true.`); });
  if (list(map.prohibited_public_outputs, 'prohibited_public_outputs').length < 15) fail('public-output exclusion list is incomplete.');
  for (const id of ['read-only-normal-build','pause-incomplete-scheduled-refresh']) {
    if (!map.immediate_safeguards?.some((item) => item.id === id && item.implemented_in_this_change === true)) fail(`missing safeguard ${id}.`);
  }
  const sequence = list(map.execution_sequence, 'execution_sequence');
  ['WHR-CAL-PIPELINE-V1','WHR-CAL-DYNAMIC-DATES','WHR-CAL-OPS-V1'].forEach((value, index) => { if (sequence[index] !== value) fail(`execution sequence must start with ${value}.`); });

  if (!Array.isArray(map.components) || map.components.length < 30) fail('at least 30 component groups are required.');
  else {
    const ids = new Set();
    const seenDomains = new Set();
    const counts = Object.fromEntries(classes.map((value) => [value, 0]));
    for (const [index, item] of map.components.entries()) {
      const label = `components[${index}]`;
      if (!item.component_id || ids.has(item.component_id)) fail(`${label}.component_id must be unique.`); else ids.add(item.component_id);
      if (!domains.includes(item.domain)) fail(`${label}.domain is invalid.`); else seenDomains.add(item.domain);
      if (!classes.includes(item.classification)) fail(`${label}.classification is invalid.`); else counts[item.classification] += 1;
      if (!priorities.includes(item.priority)) fail(`${label}.priority is invalid.`);
      if (item.delete_in_this_change !== false) fail(`${label}.delete_in_this_change must be false.`);
      list(item.paths, `${label}.paths`).filter((value) => !value.includes('*') && !value.includes('?') && !value.includes('[')).forEach((value) => { if (!existsSync(path.join(root, value))) fail(`${label} missing path ${value}.`); });
      list(item.target_work_ids, `${label}.target_work_ids`);
    }
    domains.forEach((value) => { if (!seenDomains.has(value)) fail(`missing domain ${value}.`); });
    classes.forEach((value) => { if (!counts[value]) fail(`missing ${value} decision.`); });
    const byId = new Map(map.components.map((item) => [item.component_id, item]));
    for (const id of ['june-build-mutation','refresh-skeleton','legacy-canonical-builder']) if (byId.get(id)?.classification !== 'replace') fail(`${id} must be replace.`);
    if (byId.get('scheduled-refresh-workflow')?.classification !== 'repair') fail('scheduled-refresh-workflow must be repair.');
    if (byId.get('public-display-boundary')?.classification !== 'retain') fail('public-display-boundary must be retain.');
  }
}

if (pkg) {
  const check = pkg.scripts?.check ?? '';
  if (pkg.scripts?.build !== 'astro build') fail('normal build must be read-only.');
  if (check.includes('merge:june-2026-manual-records')) fail('normal check must not merge June data.');
  if (pkg.scripts?.['validate:calendar-baseline-reconciliation'] !== 'node scripts/check-calendar-baseline-reconciliation.mjs') fail('missing package validator command.');
  if (!check.includes('validate:calendar-baseline-reconciliation')) fail('normal check must include baseline validation.');
}
if (schedule.includes('cron:') || /^\s*schedule:/m.test(schedule)) fail('incomplete refresh schedule must be paused.');
if (!schedule.includes('workflow_dispatch:') || !schedule.includes('default: "false"')) fail('manual refresh must default to no live fetch.');

for (const [file, markers] of Object.entries({
  'docs/calendar/baseline-reconciliation-map.md':['Normal build is read-only','Incomplete daily refresh is paused'],
  'docs/calendar/current-baseline-audit.md':['Status: reconciled'],
  'docs/runbooks/current-timetable-data-inventory.md':['Status: superseded'],
  'docs/calendar/implementation-roadmap.md':['Status: complete','Status: current'],
  'docs/project-roadmap.md':['Current Work ID: `WHR-CAL-PIPELINE-V1`'],
  'START-HERE.md':['WHR-CAL-PIPELINE-V1','WHR-CAL-DYNAMIC-DATES'],
})) {
  const text = read(file);
  markers.forEach((marker) => { if (!text.includes(marker)) fail(`${file} must include ${marker}.`); });
}

if (errors.length) {
  console.error(`CALENDAR_BASELINE_RECONCILIATION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
const counts = map.components.reduce((out, item) => ({ ...out, [item.classification]: (out[item.classification] ?? 0) + 1 }), {});
console.log(`CALENDAR_BASELINE_RECONCILIATION: pass components=${map.components.length} retain=${counts.retain} repair=${counts.repair} migrate=${counts.migrate} replace=${counts.replace} archive=${counts.archive}`);
console.log('CURRENT_WORK_ID: WHR-CAL-PIPELINE-V1');
console.log('NEXT_WORK_ID: WHR-CAL-DYNAMIC-DATES');
