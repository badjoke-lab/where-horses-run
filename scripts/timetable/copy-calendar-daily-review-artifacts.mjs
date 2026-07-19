import fs from 'node:fs';
import path from 'node:path';

const args = new Map(
  process.argv.slice(2).map((item) => {
    const separator = item.indexOf('=');
    if (!item.startsWith('--') || separator === -1) return [item, null];
    return [item.slice(2, separator), item.slice(separator + 1)];
  }),
);

function required(name) {
  const value = args.get(name);
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`--${name}=<value> is required`);
  }
  return value;
}

function optional(name, fallback = null) {
  const value = args.get(name);
  return typeof value === 'string' && value !== '' ? value : fallback;
}

function booleanArg(name, fallback = false) {
  const value = optional(name, null);
  if (value === null) return fallback;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`--${name} must be true or false`);
}

const artifactRoot = path.resolve(required('artifact-root'));
const payloadRoot = path.resolve(required('payload-root'));
const receiptPath = path.resolve(required('receipt'));
const runId = required('run-id');
const sourceSha = required('source-sha');
const allowEmpty = booleanArg('allow-empty', false);

if (!/^[0-9]+$/.test(runId)) throw new Error('--run-id must be numeric');
if (!/^[0-9a-f]{40}$/.test(sourceSha)) throw new Error('--source-sha must be a 40-character lowercase SHA');

const mappings = Object.freeze([
  {
    source: 'generated/timetable/actions-multi-job-status',
    destination: 'data/generated/timetable/actions-multi-job-status',
  },
  {
    source: 'generated/timetable/nar-incremental-batches',
    destination: 'data/generated/timetable/nar-incremental-batches',
  },
  {
    source: 'generated/timetable/actions-multi-job',
    destination: 'data/generated/timetable/actions-multi-job',
  },
  {
    source: 'candidates/nar-incremental-batches',
    destination: 'data/candidates/nar-incremental-batches',
  },
]);

function walkJsonFiles(root) {
  const files = [];
  if (!fs.existsSync(root)) return files;
  const rootStat = fs.lstatSync(root);
  if (rootStat.isSymbolicLink()) throw new Error(`artifact root must not be a symlink: ${root}`);
  if (!rootStat.isDirectory()) throw new Error(`artifact root must be a directory: ${root}`);

  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      const stat = fs.lstatSync(fullPath);
      if (stat.isSymbolicLink()) throw new Error(`artifact symlink is forbidden: ${fullPath}`);
      if (stat.isDirectory()) {
        visit(fullPath);
        continue;
      }
      if (!stat.isFile()) throw new Error(`unsupported artifact entry: ${fullPath}`);
      if (path.extname(entry.name) !== '.json') throw new Error(`non-JSON review artifact is forbidden: ${fullPath}`);
      files.push(fullPath);
    }
  };

  visit(root);
  return files.sort();
}

function safeDestination(root, relativePath) {
  const destination = path.resolve(root, relativePath);
  const prefix = `${root}${path.sep}`;
  if (destination !== root && !destination.startsWith(prefix)) {
    throw new Error(`artifact destination escaped payload root: ${relativePath}`);
  }
  return destination;
}

const copiedByDestination = new Map();
const rootsFound = [];

for (const mapping of mappings) {
  const sourceCandidates = [
    path.join(artifactRoot, mapping.source),
    path.join(artifactRoot, 'data', mapping.source),
  ];

  for (const sourceRoot of sourceCandidates) {
    if (!fs.existsSync(sourceRoot)) continue;
    rootsFound.push(path.relative(artifactRoot, sourceRoot));
    for (const sourceFile of walkJsonFiles(sourceRoot)) {
      const relativeFile = path.relative(sourceRoot, sourceFile);
      const destinationRelative = path.join(mapping.destination, relativeFile);
      const destinationFile = safeDestination(payloadRoot, destinationRelative);
      const sourceBytes = fs.readFileSync(sourceFile);

      if (copiedByDestination.has(destinationRelative)) {
        const previousBytes = copiedByDestination.get(destinationRelative);
        if (!previousBytes.equals(sourceBytes)) {
          throw new Error(`conflicting artifact content for ${destinationRelative}`);
        }
        continue;
      }

      if (fs.existsSync(destinationFile)) {
        const existing = fs.readFileSync(destinationFile);
        if (!existing.equals(sourceBytes)) {
          throw new Error(`payload already contains different content for ${destinationRelative}`);
        }
      } else {
        fs.mkdirSync(path.dirname(destinationFile), { recursive: true });
        fs.writeFileSync(destinationFile, sourceBytes);
      }
      copiedByDestination.set(destinationRelative, sourceBytes);
    }
  }
}

if (copiedByDestination.size === 0 && !allowEmpty) {
  throw new Error('no supported review artifacts were found');
}

const receipt = {
  schema_version: 'calendar-daily-review-artifact-delivery-v1',
  generated_at: new Date().toISOString(),
  source_run_id: runId,
  source_sha: sourceSha,
  artifact_layouts_seen: [...new Set(rootsFound)].sort(),
  copied_file_count: copiedByDestination.size,
  copied_files: [...copiedByDestination.keys()].sort(),
  review_branch: 'automation/calendar-daily-acquisition-review',
  publication_boundary: {
    automatic_approval: false,
    canonical_written: false,
    public_projection_written: false,
    automatic_merge: false,
    deployment_performed: false,
  },
};

fs.mkdirSync(path.dirname(receiptPath), { recursive: true });
fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({ receipt: receiptPath, copied_file_count: receipt.copied_file_count }));
