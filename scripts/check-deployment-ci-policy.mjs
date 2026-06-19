import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const requiredFiles = [
  'docs/operations/deployment-and-ci-policy.md',
  'docs/operations/README.md',
  'docs/README.md',
  'docs/country-pages/README.md',
  'README.md',
  '.github/workflows/country-page-programme-roadmap.yml'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) fail(`missing ${file}`);
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}

const policy = read('docs/operations/deployment-and-ci-policy.md');
const requiredPolicyPhrases = [
  'Status: active canonical operations policy',
  'Cloudflare deployment is not a general CI gate',
  'wave maximum:        2 Cloudflare deployments',
  '[CF-Pages-Skip]',
  'Non-publication PRs must use a squash merge title beginning with',
  'A branch intended to receive a Cloudflare preview must begin with',
  'preview-*',
  'branch control: pending operator confirmation',
  'build cache: pending operator confirmation',
  'One build per head',
  'cancel-in-progress: true',
  'No routine self-mutating workflows',
  'Do not repeatedly poll Cloudflare deployment status',
  'https://developers.cloudflare.com/pages/platform/limits/',
  'https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/',
  'https://developers.cloudflare.com/pages/configuration/branch-build-controls/',
  'https://developers.cloudflare.com/pages/configuration/build-caching/'
];

for (const phrase of requiredPolicyPhrases) {
  if (!policy.includes(phrase)) fail(`deployment policy is missing required phrase: ${phrase}`);
}

const linkChecks = [
  ['README.md', 'docs/operations/deployment-and-ci-policy.md'],
  ['docs/README.md', 'operations/deployment-and-ci-policy.md'],
  ['docs/country-pages/README.md', '../operations/deployment-and-ci-policy.md'],
  ['docs/operations/README.md', './deployment-and-ci-policy.md']
];

for (const [file, link] of linkChecks) {
  if (!read(file).includes(link)) fail(`${file} must link to ${link}`);
}

const roadmapWorkflow = read('.github/workflows/country-page-programme-roadmap.yml');
const watchesOperations =
  roadmapWorkflow.includes("'docs/operations/**'") ||
  roadmapWorkflow.includes("'docs/operations/deployment-and-ci-policy.md'");
if (!watchesOperations) {
  fail('roadmap workflow must watch the deployment policy');
}
if (!roadmapWorkflow.includes('node scripts/check-deployment-ci-policy.mjs')) {
  fail('roadmap workflow must run the deployment policy validator');
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}

console.log('DEPLOYMENT_AND_CI_POLICY_VALID');
console.log('CLOUDFLARE_BUDGET: maximum two deployments per normal eight-entry wave');
console.log('NON_PUBLICATION_COMMITS: CF-Pages-Skip required');
console.log('PREVIEW_BRANCH_PATTERN: preview-*');
