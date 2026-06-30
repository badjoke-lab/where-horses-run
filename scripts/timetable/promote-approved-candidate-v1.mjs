import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { promoteApprovedCandidateV1 } from './pipeline-v1/promotion-core.mjs';

const root = process.cwd();
const canonicalMeetingsPath = 'data/generated/timetable/canonical/meetings.json';
const canonicalDetailsPath = 'data/generated/timetable/canonical/meeting-details.json';
const authorityInventoryPath = 'data/static/authority-source-inventory.json';
const readinessRegistryPath = 'data/static/calendar-readiness-registry.json';

const args = new Map();
const flags = new Set();
for (let index = 2; index < process.argv.length; index += 1) {
  const value = process.argv[index];
  if (value === '--check' || value === '--dry-run') {
    flags.add(value.slice(2));
  } else if (value.startsWith('--')) {
    const next = process.argv[index + 1];
    if (!next || next.startsWith('--')) throw new Error(`${value} requires a value`);
    args.set(value.slice(2), next);
    index += 1;
  } else {
    throw new Error(`unsupported argument ${value}`);
  }
}

if (flags.has('check') && flags.has('dry-run')) throw new Error('--check and --dry-run are mutually exclusive');
const input = args.get('input');
if (!input) throw new Error('Usage: node scripts/timetable/promote-approved-candidate-v1.mjs --input <approved-candidate.json> [--check|--dry-run]');

const normalizedInput = input.replaceAll('\\', '/').replace(/^\.\//, '');
if (!normalizedInput.startsWith('data/candidates/') || normalizedInput.includes('..')) {
  throw new Error('input must be a repository-relative file under data/candidates/');
}

function readJson(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) throw new Error(`missing required file: ${relativePath}`);
  return JSON.parse(readFileSync(absolutePath, 'utf8'));
}

function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function atomicWrite(relativePath, content) {
  const absolutePath = path.join(root, relativePath);
  const temporaryPath = `${absolutePath}.promotion-v1.tmp`;
  writeFileSync(temporaryPath, content);
  renameSync(temporaryPath, absolutePath);
}

try {
  const result = promoteApprovedCandidateV1({
    candidate: readJson(normalizedInput),
    meetingsDataset: readJson(canonicalMeetingsPath),
    detailsDataset: readJson(canonicalDetailsPath),
    authorityInventory: readJson(authorityInventoryPath),
    readinessRegistry: readJson(readinessRegistryPath),
    inputPath: normalizedInput
  });

  const meetingsContent = serialize(result.meetingsDataset);
  const detailsContent = serialize(result.detailsDataset);

  if (flags.has('dry-run')) {
    console.log(JSON.stringify(result.summary, null, 2));
    console.log('PROMOTION_WRITE_MODE: dry-run');
    process.exit(0);
  }

  if (flags.has('check')) {
    const currentMeetings = readFileSync(path.join(root, canonicalMeetingsPath), 'utf8');
    const currentDetails = readFileSync(path.join(root, canonicalDetailsPath), 'utf8');
    if (currentMeetings !== meetingsContent || currentDetails !== detailsContent) {
      throw new Error('canonical promotion output is stale for the approved candidate');
    }
    console.log(JSON.stringify(result.summary, null, 2));
    console.log('PROMOTION_WRITE_MODE: check');
    process.exit(0);
  }

  atomicWrite(canonicalMeetingsPath, meetingsContent);
  atomicWrite(canonicalDetailsPath, detailsContent);
  console.log(JSON.stringify(result.summary, null, 2));
  console.log('PROMOTION_WRITE_MODE: canonical-only');
  console.log('PUBLIC_PROJECTION_WRITTEN: false');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
