import fs from 'node:fs';

const file = 'scripts/check-calendar-hkjc-live-fixture-bridge.mjs';
let text = fs.readFileSync(file, 'utf8');
const duplicateLine = "expectRejected('duplicate meeting identity', (input) => { input.page_results[0].content += '<div>1 Image: ST Image: D</div>'; });";
const invalidDateLine = "expectRejected('invalid real fixture date', (input) => { input.page_results[0].content = '<div>31 Image: ST Image: D</div>'; input.page_results[0].month = '2026-09'; input.requested_scope.start_date = '2026-09-01'; input.requested_scope.end_date_exclusive = '2026-10-01'; });";
if (!text.includes(duplicateLine) || !text.includes(invalidDateLine)) throw new Error('HKJC parser-failure expectation line missing');
const helper = `function expectParserFailure(label, mutate) {
  const base = structuredClone(fixtures.scenarios[0].input);
  mutate(base);
  let bridge;
  try { bridge = buildHkjcLiveFixtureBridgeV1(base); } catch (error) {
    fail(\`${label} threw instead of becoming parser_failure evidence: \${error.message}\`);
    return;
  }
  if (bridge.coverage_observation.coverage_claim !== 'none') fail(\`${label} coverage must be none.\`);
  if (bridge.coverage_observation.records_discovered !== 0) fail(\`${label} must not emit records.\`);
  if (bridge.coverage_observation.source_errors.length !== 1 || bridge.coverage_observation.source_errors[0].code !== 'parser_failure') {
    fail(\`${label} must emit one parser_failure source error.\`);
  }
}
`;
text = text.replace(duplicateLine, `${helper}expectParserFailure('duplicate meeting identity', (input) => { input.page_results[0].content += '<div>1 Image: ST Image: D</div>'; });`);
text = text.replace(invalidDateLine, "expectParserFailure('invalid real fixture date', (input) => { input.page_results[0].content = '<div>31 Image: ST Image: D</div>'; input.page_results[0].month = '2026-09'; input.requested_scope.start_date = '2026-09-01'; input.requested_scope.end_date_exclusive = '2026-10-01'; });");
fs.writeFileSync(file, text);
console.log('HKJC_LIVE_FIXTURE_BRIDGE_PARSER_FAILURE_EXPECTATIONS_UPDATED');
