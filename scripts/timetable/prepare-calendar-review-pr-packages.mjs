import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './load-calendar-acquisition-registry.mjs';
import { planReviewCohortsV1 } from './review-cohort-planner.mjs';
import { prepareReviewPrPackagesV1 } from './review-pr-preparation.mjs';

const root = process.cwd();
const args = new Map(process.argv.slice(2).map((arg) => {
  const index = arg.indexOf('=');
  return index === -1 ? [arg, true] : [arg.slice(0, index), arg.slice(index + 1)];
}));

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.resolve(root, file), 'utf8'));
}

const outputPath = args.get('--output');
if (!outputPath) throw new Error('--output=<path> is required');
const registry = loadCalendarAcquisitionRegistryV1(root);

let queue;
let artifactCatalog;
let canonicalMeetings;
let retryQueue;
const fixturePath = args.get('--fixture');
if (fixturePath) {
  const fixture = readJson(fixturePath);
  queue = fixture.queue;
  artifactCatalog = fixture.artifact_catalog;
  canonicalMeetings = fixture.canonical_meetings;
  retryQueue = fixture.retry_queue;
} else {
  const required = ['--review-queue', '--artifact-catalog', '--canonical-meetings', '--retry-queue'];
  for (const key of required) if (!args.get(key)) throw new Error(`${key}=<path> is required without --fixture`);
  queue = readJson(args.get('--review-queue'));
  artifactCatalog = readJson(args.get('--artifact-catalog'));
  const canonical = readJson(args.get('--canonical-meetings'));
  canonicalMeetings = Array.isArray(canonical) ? canonical : canonical.meetings;
  retryQueue = readJson(args.get('--retry-queue'));
}

const cohortPlan = planReviewCohortsV1(queue, registry);
const packages = prepareReviewPrPackagesV1(cohortPlan, {
  review_queue: queue,
  registry,
  artifact_catalog: artifactCatalog,
  canonical_meetings: canonicalMeetings,
  retry_queue: retryQueue,
});

const output = path.resolve(root, outputPath);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(packages, null, 2)}\n`);
console.log(JSON.stringify({
  package_count: packages.packages.length,
  output: path.relative(root, output),
  pull_request_created: false,
  human_review_required: true,
}));
