import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = new Map(process.argv.slice(2).map((arg) => {
  const index = arg.indexOf('=');
  return index === -1 ? [arg, true] : [arg.slice(0, index), arg.slice(index + 1)];
}));

const duePlanPath = args.get('--due-plan');
const actionsPlanPath = args.get('--actions-plan');
const matrixPath = args.get('--matrix');
const collectionPlanPath = args.get('--collection-plan');
const githubOutputPath = args.get('--github-output');
if (!duePlanPath || !actionsPlanPath || !matrixPath || !collectionPlanPath || !githubOutputPath) {
  throw new Error('--due-plan, --actions-plan, --matrix, --collection-plan, and --github-output are required');
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.resolve(root, file), 'utf8'));
}

const duePlan = readJson(duePlanPath);
const actionsPlan = readJson(actionsPlanPath);
const matrix = readJson(matrixPath);

if (duePlan?.schema_version !== 'calendar-due-job-plan-v1') throw new Error('Due-job Plan schema differs');
if (duePlan.collection_plan?.schema_version !== 'calendar-collection-plan-v1') throw new Error('Collection Plan schema differs');
if (actionsPlan?.schema_version !== 'calendar-actions-multi-job-plan-v1') throw new Error('Actions Plan schema differs');
if (actionsPlan.plan_id !== duePlan.collection_plan.plan_id) throw new Error('Actions Plan plan_id differs from Due-job Collection Plan');
if (actionsPlan.campaign_id !== duePlan.collection_plan.campaign_id) throw new Error('Actions Plan campaign_id differs from Due-job Collection Plan');
if (!matrix || !Array.isArray(matrix.include)) throw new Error('Actions matrix include array is required');
if (matrix.include.length !== actionsPlan.jobs.length) throw new Error('Actions matrix size differs from hosted Job count');

const collectionOutput = path.resolve(root, collectionPlanPath);
fs.mkdirSync(path.dirname(collectionOutput), { recursive: true });
fs.writeFileSync(collectionOutput, `${JSON.stringify(duePlan.collection_plan, null, 2)}\n`);

const githubOutput = path.resolve(root, githubOutputPath);
const lines = [
  `matrix=${JSON.stringify(matrix)}`,
  `hosted_jobs=${actionsPlan.jobs.length}`,
  `plan_id=${actionsPlan.plan_id}`,
];
fs.appendFileSync(githubOutput, `${lines.join('\n')}\n`);

console.log(JSON.stringify({
  plan_id: actionsPlan.plan_id,
  hosted_jobs: actionsPlan.jobs.length,
  excluded_jobs: actionsPlan.excluded.length,
  matrix_jobs: matrix.include.length,
  collection_plan_output: path.relative(root, collectionOutput),
}));
