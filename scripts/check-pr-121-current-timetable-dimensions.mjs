import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-121-current-timetable-dimensions] ${message}`);
  process.exit(1);
}

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) fail(`Missing file: ${relativePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

const page = read('src/pages/major-countries/current-timetable.astro');
const component = read('src/components/CurrentTimetableDimensions.astro');

if (!page.includes('CurrentTimetableDimensions')) fail('Page must import and render CurrentTimetableDimensions.');
if (!page.includes('function countBy')) fail('Page must define countBy for dimension summaries.');

for (const prop of ['countries', 'groups', 'dates', 'racecourses']) {
  if (!page.includes(`${prop}={`)) fail(`Page must pass ${prop} to the dimensions component.`);
  if (!component.includes(prop)) fail(`Component must reference ${prop}.`);
}

for (const label of ['By country', 'By system', 'By date', 'By racecourse']) {
  if (!component.includes(label)) fail(`Component must render ${label}.`);
}

if (!component.includes('records')) fail('Component must show record counts.');
if (!component.includes('dimension-grid')) fail('Component must provide a dimension grid wrapper.');

console.log('[pr-121-current-timetable-dimensions] PASS');
