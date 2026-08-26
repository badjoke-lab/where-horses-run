import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { promoteApprovedCandidateV1 } from './pipeline-v1/promotion-core.mjs';
import { loadAuthoritySourceInventoryV1 } from './load-authority-source-inventory.mjs';
import { loadCalendarReadinessV1 } from './load-calendar-readiness.mjs';

const root = process.cwd();
const canonicalMeetingsPath = 'data/generated/timetable/canonical/meetings.json';
const canonicalDetailsPath = 'data/generated/timetable/canonical/meeting-details.json';

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
  const candidate = readJson(normalizedInput);
  const currentMeetingsDataset = readJson(canonicalMeetingsPath);
  const currentDetailsDataset = readJson(canonicalDetailsPath);
  const result = promoteApprovedCandidateV1({
    candidate,
    meetingsDataset: currentMeetingsDataset,
    detailsDataset: currentDetailsDataset,
    authorityInventory: loadAuthoritySourceInventoryV1(root),
    readinessRegistry: loadCalendarReadinessV1(root),
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
    // An older approved candidate may remain fully applied after later reviewed
    // promotions advance the dataset-level generated_at timestamp. Preserve the
    // current top-level timestamps for semantic comparison; every canonical
    // record, detail, input source and ordering must still match exactly.
    const expectedMeetingsDataset = {
      ...result.meetingsDataset,
      generated_at: currentMeetingsDataset.generated_at,
    };
    const expectedDetailsDataset = {
      ...result.detailsDataset,
      generated_at: currentDetailsDataset.generated_at,
    };
    const currentMeetings = serialize(currentMeetingsDataset);
    const currentDetails = serialize(currentDetailsDataset);
    const expectedMeetings = serialize(expectedMeetingsDataset);
    const expectedDetails = serialize(expectedDetailsDataset);
    if (currentMeetings !== expectedMeetings || currentDetails !== expectedDetails) {
      throw new Error('canonical promotion output is stale for the approved candidate');
    }
    console.log(JSON.stringify(result.summary, null, 2));
    console.log('PROMOTION_CHECK_TIMESTAMP_MODE: preserve-current-generated-at');
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
