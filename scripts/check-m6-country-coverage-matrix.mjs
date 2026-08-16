import assert from 'node:assert/strict';
import fs from 'node:fs';

const dataModel = fs.readFileSync('src/lib/timetable/coverageDashboard.ts', 'utf8');
const component = fs.readFileSync('src/components/CountryCoverageMatrix.astro', 'utf8');
const enPage = fs.readFileSync('src/pages/about/data-coverage.astro', 'utf8');
const jaPage = fs.readFileSync('src/pages/ja/about/data-coverage.astro', 'utf8');
const enAbout = fs.readFileSync('src/pages/about/index.astro', 'utf8');
const jaAbout = fs.readFileSync('src/pages/ja/about/index.astro', 'utf8');
const routeAddition = JSON.parse(fs.readFileSync('data/static/m6-country-coverage-route-addition-v1.json', 'utf8'));
const scopeChecker = fs.readFileSync('scripts/check-v1-scope-freeze.mjs', 'utf8');
const sitemapChecker = fs.readFileSync('scripts/check-sitemap-robots.mjs', 'utf8');
const structuredDataChecker = fs.readFileSync('scripts/check-structured-data-baseline.mjs', 'utf8');
const dataAuditChecker = fs.readFileSync('scripts/check-v1-data-audit.mjs', 'utf8');
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

assert.equal(routeAddition.schema_version, 'm6-country-coverage-route-addition-v1');
assert.equal(routeAddition.work_id, 'WHR-M6-COUNTRY-COVERAGE-MATRIX');
assert.equal(routeAddition.implementation_unit, 'M6-COUNTRY-COVERAGE-MATRIX-01');
assert.equal(routeAddition.status, 'reviewed_route_addition');
assert.equal(routeAddition.route_family, 'about');
assert.equal(routeAddition.new_route_family, false);
assert.equal(routeAddition.new_public_data_class, false);
assert.deepEqual(routeAddition.routes, [
  { language: 'en', path: '/about/data-coverage/' },
  { language: 'ja', path: '/ja/about/data-coverage/' },
]);
assert.deepEqual(routeAddition.inventory_delta, {
  public_pages: 2,
  english_pages: 1,
  japanese_pages: 1,
  route_families: 0,
});
assert.ok(Object.values(routeAddition.boundary).every((value) => value === true));

for (const checker of [scopeChecker, sitemapChecker, structuredDataChecker, dataAuditChecker]) {
  assert.match(checker, /m6-country-coverage-route-addition-v1\.json/);
  assert.match(checker, /reviewedRouteAddition/);
  assert.match(checker, /\/about\/data-coverage\//);
  assert.match(checker, /\/ja\/about\/data-coverage\//);
}
assert.match(structuredDataChecker, /WebSite/);
assert.match(structuredDataChecker, /WebPage/);
assert.match(structuredDataChecker, /REVIEWED_M6_ROUTE_ADDITIONS/);
assert.match(dataAuditChecker, /REVIEWED_M6_ROUTE_ADDITIONS/);
assert.match(dataAuditChecker, /reviewed racecourse, meeting-detail, and M6 route growth/);

assert.match(workflow, /npm run build/);
assert.match(workflow, /check-m6-country-coverage-matrix\.mjs/);
assert.match(workflow, /check-sitemap-robots\.mjs/);
assert.match(workflow, /check-structured-data-baseline\.mjs/);
assert.match(workflow, /check-v1-scope-freeze\.mjs/);
assert.match(workflow, /check-v1-data-audit\.mjs/);
assert.match(workflow, /m6-country-coverage-route-addition-v1\.json/);
assert.match(workflow, /contents: read/);
assert.doesNotMatch(workflow, /contents:\s*write/);
assert.doesNotMatch(workflow, /pull-requests:\s*write/);
assert.doesNotMatch(workflow, /deploy/i);

console.log('M6 country coverage matrix check passed.');
console.log('- six target countries remain explicit');
console.log('- verified source capability is separated from reviewed public coverage');
console.log('- English/Japanese /about/data-coverage routes use the same derived data model');
console.log('- exact bilingual route additions are reviewed without changing historical v1 baselines');
console.log('- reviewed routes keep the existing WebSite/WebPage structured-data baseline only');
console.log('- v1 data audit accepts only the exact reviewed +2 route delta');
console.log('- matrix reuses existing responsive table CSS and adds no new public timetable fields');
