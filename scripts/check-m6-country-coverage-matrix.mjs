import assert from 'node:assert/strict';
import fs from 'node:fs';

const dataModel = fs.readFileSync('src/lib/timetable/coverageDashboard.ts', 'utf8');
const component = fs.readFileSync('src/components/CountryCoverageMatrix.astro', 'utf8');
const enPage = fs.readFileSync('src/pages/about/data-coverage.astro', 'utf8');
const jaPage = fs.readFileSync('src/pages/ja/about/data-coverage.astro', 'utf8');
const enAbout = fs.readFileSync('src/pages/about/index.astro', 'utf8');
const jaAbout = fs.readFileSync('src/pages/ja/about/index.astro', 'utf8');
const workflow = fs.readFileSync('.github/workflows/m6-country-coverage-matrix.yml', 'utf8');

const countryIds = [
  'japan',
  'hong-kong',
  'united-arab-emirates',
  'south-korea',
  'turkey',
  'morocco',
];
for (const countryId of countryIds) {
  assert.match(dataModel, new RegExp(`id: '${countryId}'`), `coverage model missing ${countryId}`);
}
assert.match(dataModel, /source_dimensions/);
assert.match(dataModel, /publicMetrics/);
assert.match(dataModel, /meetingListData/);
assert.match(dataModel, /meetingDetailsData/);

assert.match(component, /data-country-coverage-matrix/);
assert.match(component, /getCoverageDashboardCountries/);
assert.match(component, /Verified source capability/);
assert.match(component, /Reviewed public coverage/);
assert.match(component, /公式ソースで確認できる範囲/);
assert.match(component, /レビュー済み公開範囲/);
assert.match(component, /country\.source_dimensions/);
assert.match(component, /country\.public\.meetings/);
assert.match(component, /country\.public\.dates/);
assert.match(component, /country\.public\.racecourses/);
assert.match(component, /country\.public\.meetings_with_times/);
assert.match(component, /class="country-table"/);
assert.doesNotMatch(component, /<style>/, 'coverage matrix must reuse shared responsive table styles');
assert.doesNotMatch(component, /odds|payout|runner|jockey|trainer|raw_html|raw body|stream_url/i);

for (const [page, route, matrixCall] of [
  [enPage, '/about/data-coverage/', '<CountryCoverageMatrix />'],
  [jaPage, '/ja/about/data-coverage/', '<CountryCoverageMatrix lang="ja" />'],
]) {
  assert.match(page, /CountryCoverageMatrix/);
  assert.ok(page.includes(matrixCall), `${route} missing matrix component`);
  assert.match(page, /coverageDashboardGeneratedAt/);
  assert.match(page, /official source|公式ソース/i);
}
assert.match(enPage, /Source capability does not imply publication/);
assert.match(jaPage, /取得できることと公開することは同じではありません/);
assert.match(enAbout, /\/about\/data-coverage\//);
assert.match(jaAbout, /\/ja\/about\/data-coverage\//);

assert.match(workflow, /npm run build/);
assert.match(workflow, /check-m6-country-coverage-matrix\.mjs/);
assert.match(workflow, /contents: read/);
assert.doesNotMatch(workflow, /contents:\s*write/);
assert.doesNotMatch(workflow, /pull-requests:\s*write/);
assert.doesNotMatch(workflow, /deploy/i);

console.log('M6 country coverage matrix check passed.');
console.log('- six target countries remain explicit');
console.log('- verified source capability is separated from reviewed public coverage');
console.log('- English/Japanese /about/data-coverage routes use the same derived data model');
console.log('- matrix reuses existing responsive table CSS and adds no new public timetable fields');
