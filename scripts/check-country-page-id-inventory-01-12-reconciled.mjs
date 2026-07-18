import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const basePath = 'data/static/country-page-id-inventory-01-12.json';
const reconciliationPath = 'data/static/country-page-id-inventory-01-12-reconciliation-v1.json';
const checkerPath = 'scripts/check-country-page-id-inventory-01-12.mjs';
const originalText = fs.readFileSync(basePath, 'utf8');
const inventory = JSON.parse(originalText);
const reconciliation = JSON.parse(fs.readFileSync(reconciliationPath, 'utf8'));

const fail = (message) => {
  console.error(`ERROR: ${message}`);
  process.exit(1);
};

if (reconciliation.schema_version !== '1.0.0') fail('reconciliation schema_version must be 1.0.0');
if (reconciliation.base_inventory !== basePath) fail('reconciliation base_inventory differs');
if (reconciliation.reviewed_at !== '2026-07-18') fail('reconciliation reviewed_at differs');
if (!Array.isArray(reconciliation.racecourse_registry_status_overrides)) fail('racecourse overrides must be an array');

const racecourses = new Map((inventory.racecourses ?? []).map((record) => [record.id, record]));
const seen = new Set();
for (const override of reconciliation.racecourse_registry_status_overrides) {
  if (!override?.id || seen.has(override.id)) fail(`invalid or duplicate reconciliation id: ${override?.id}`);
  seen.add(override.id);
  const record = racecourses.get(override.id);
  if (!record) fail(`reconciled racecourse is absent from base inventory: ${override.id}`);
  if (record.country_id !== override.country_id) fail(`reconciliation country differs: ${override.id}`);
  if (record.registry_status !== override.previous_status) fail(`reconciliation previous_status differs: ${override.id}`);
  if (override.previous_status !== 'reserved' || override.effective_status !== 'registered') {
    fail(`unsupported reconciliation transition: ${override.id}`);
  }
  record.registry_status = override.effective_status;
}

let result;
try {
  fs.writeFileSync(basePath, `${JSON.stringify(inventory, null, 2)}\n`);
  result = spawnSync(process.execPath, [checkerPath], { encoding: 'utf8' });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
} finally {
  fs.writeFileSync(basePath, originalText);
}

if (result?.status !== 0) process.exit(result?.status ?? 1);
console.log(`COUNTRY_PAGE_ID_RECONCILIATION_VALID overrides=${seen.size}`);
