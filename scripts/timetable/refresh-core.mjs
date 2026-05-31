import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registryPath = path.join(root, 'data/source-registry/major-country-sources.json');
const outputDir = path.join(root, 'data/generated/timetable');

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function writeJson(relativePath, data) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

export function loadRegistry() {
  return readJson(registryPath);
}

export function selectSources(kind) {
  const registry = loadRegistry();
  return registry.sources.filter((source) => source.source_kind === kind && source.status !== 'legacy');
}

export function selectAllActiveSources() {
  const registry = loadRegistry();
  return registry.sources.filter((source) => source.status !== 'legacy');
}

export function createBaseReport(commandName, sources) {
  const now = new Date().toISOString();
  return {
    schema_version: 'timetable-update-report-v0',
    generated_at: now,
    command: commandName,
    mode: 'skeleton_no_live_fetch',
    sources_checked: sources.map((source) => ({
      country_id: source.country_id,
      group_id: source.group_id,
      source_kind: source.source_kind,
      parser: source.parser,
      target_level: source.target_level,
      status: 'registered_not_fetched'
    })),
    new_records: 0,
    promoted_records: {
      D_to_C: 0,
      C_to_B: 0,
      C_to_A: 0,
      B_to_A: 0
    },
    stale_records: 0,
    parser_errors: [],
    warnings: [
      'PR-109 defines command structure only; live fetch and source-specific parser implementations are intentionally out of scope.'
    ]
  };
}

export function writeCommandReport(commandName, sources) {
  fs.mkdirSync(outputDir, { recursive: true });
  const report = createBaseReport(commandName, sources);
  writeJson('data/generated/timetable/update-report.json', report);
  writeJson('data/generated/timetable/source-health.json', {
    schema_version: 'timetable-source-health-v0',
    generated_at: report.generated_at,
    mode: 'skeleton_no_live_fetch',
    sources: report.sources_checked.map((source) => ({
      ...source,
      health_status: 'unknown_until_fetch_implemented'
    }))
  });
  writeJson('data/generated/timetable/promotion-status.json', {
    schema_version: 'timetable-promotion-status-v0',
    generated_at: report.generated_at,
    mode: 'skeleton_no_live_fetch',
    promotion_policy: {
      D: 'retry annual or rolling sources until C, unless off-season or archived',
      C: 'retry rolling or racecard sources until B or A',
      B: 'retry racecard sources until A',
      A: 'skip promotion, but refresh until archived when meeting is complete'
    },
    queued_groups: [...new Set(report.sources_checked.map((source) => `${source.country_id}/${source.group_id}`))]
  });
  writeJson('data/generated/timetable/current.json', {
    schema_version: 'current-timetable-v0',
    generated_at: report.generated_at,
    mode: 'skeleton_no_live_fetch',
    records: [],
    note: 'Current timetable generation will be populated by future parser-backed refresh PRs.'
  });
  return report;
}

export function printSummary(report) {
  console.log(`[${report.command}] ${report.mode}`);
  console.log(`sources_checked=${report.sources_checked.length}`);
  console.log(`new_records=${report.new_records}`);
  console.log(`promoted_records=${JSON.stringify(report.promoted_records)}`);
}
