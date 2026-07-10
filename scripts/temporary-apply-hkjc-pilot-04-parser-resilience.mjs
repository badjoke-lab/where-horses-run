import fs from 'node:fs';

function replaceExact(file, before, after) {
  const original = fs.readFileSync(file, 'utf8');
  if (!original.includes(before)) throw new Error(`${file}: expected source block not found`);
  fs.writeFileSync(file, original.replace(before, after));
}

const coreFile = 'scripts/timetable/hkjc-fixture-artifact-bridge-core.mjs';

replaceExact(
  coreFile,
  `  const unique = new Map();
  for (const meeting of meetings) unique.set(\`${'${meeting.date}:${meeting.racecourse_id}'}\`, meeting);
  return [...unique.values()].sort((a, b) => \`${'${a.date}:${a.racecourse_id}'}\`.localeCompare(\`${'${b.date}:${b.racecourse_id}'}\`));
}

function sourceErrorFromMonthResult(result) {`,
  `  const unique = new Map();
  for (const meeting of meetings) unique.set(\`${'${meeting.date}:${meeting.racecourse_id}'}\`, meeting);
  return [...unique.values()].sort((a, b) => \`${'${a.date}:${a.racecourse_id}'}\`.localeCompare(\`${'${b.date}:${b.racecourse_id}'}\`));
}

function monthOrdinal(year, month) {
  return year * 12 + (month - 1);
}

function extractFixtureNavigationMonths(html) {
  const months = new Map();
  for (const match of String(html ?? '').matchAll(/fixture\\?[^\"'<>\\s]+/gi)) {
    const raw = decodeEntities(match[0]);
    const queryIndex = raw.indexOf('?');
    if (queryIndex < 0) continue;
    const params = new URLSearchParams(raw.slice(queryIndex + 1));
    const year = Number(params.get('CalYear') ?? params.get('calyear'));
    const month = Number(params.get('CalMonth') ?? params.get('calmonth'));
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) continue;
    months.set(monthKey(year, month), { year, month, key: monthKey(year, month) });
  }
  return [...months.values()].sort((a, b) => monthOrdinal(a.year, a.month) - monthOrdinal(b.year, b.month));
}

export function classifyHkjcEmptyFixtureWindow(html, { year, month }) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error('classifyHkjcEmptyFixtureWindow requires valid year/month');
  }

  const visibleText = stripHtml(html).toLowerCase();
  const navigationMonths = extractFixtureNavigationMonths(html);
  const ordinals = navigationMonths.map((entry) => monthOrdinal(entry.year, entry.month));
  const contiguousNavigation = ordinals.every((value, index) => index === 0 || value === ordinals[index - 1] + 1);
  const hasFixtureShell = visibleText.includes('fixture')
    && (visibleText.includes('racing fixture') || visibleText.includes('race meeting') || visibleText.includes('calendar'));
  const requestedOrdinal = monthOrdinal(year, month);
  const gapBeforeNavigation = ordinals.length > 0 ? ordinals[0] - requestedOrdinal : null;
  const validEmptyWindow = hasFixtureShell
    && navigationMonths.length >= 8
    && contiguousNavigation
    && gapBeforeNavigation >= 1
    && gapBeforeNavigation <= 2;

  return {
    classification: validEmptyWindow ? 'valid_empty_window' : 'parser_failure',
    navigation_months: navigationMonths.map((entry) => entry.key),
    contiguous_navigation: contiguousNavigation,
    gap_before_navigation_months: gapBeforeNavigation,
    fixture_shell_confirmed: hasFixtureShell,
  };
}

function sourceErrorFromMonthResult(result) {`
);

replaceExact(
  coreFile,
  `  const sourceErrors = [];
  const parsedMeetings = [];
  let successfulMonths = 0;`,
  `  const sourceErrors = [];
  const parsedMeetings = [];
  const validEmptyMonths = [];
  let successfulMonths = 0;`
);

replaceExact(
  coreFile,
  `    const parsed = parseHkjcFixtureHtml(result.body, { year: month.year, month: month.month, sourceUrl: result.final_url ?? month.url });
    if (parsed.length === 0) {
      sourceErrors.push({
        code: 'parser_failure',
        scope_ref: \`month:${'${month.key}'}\`,
        message: \`HKJC fixture page returned successfully but no fixture meeting markers were parsed for ${'${month.key}'}.\`,
      });
      continue;
    }
    successfulMonths += 1;
    parsedMeetings.push(...parsed);`,
  `    const parsed = parseHkjcFixtureHtml(result.body, { year: month.year, month: month.month, sourceUrl: result.final_url ?? month.url });
    if (parsed.length === 0) {
      const emptyWindow = classifyHkjcEmptyFixtureWindow(result.body, { year: month.year, month: month.month });
      if (emptyWindow.classification === 'valid_empty_window') {
        successfulMonths += 1;
        validEmptyMonths.push(month.key);
        continue;
      }
      sourceErrors.push({
        code: 'parser_failure',
        scope_ref: \`month:${'${month.key}'}\`,
        message: \`HKJC fixture page returned successfully but neither meeting markers nor a fail-closed valid empty-window shape were confirmed for ${'${month.key}'}.\`,
      });
      continue;
    }
    successfulMonths += 1;
    parsedMeetings.push(...parsed);`
);

replaceExact(
  coreFile,
  `    requested_months: requestedMonths.map((month) => month.key),
    successful_month_count: successfulMonths,
    source_error_count: sourceErrors.length,`,
  `    requested_months: requestedMonths.map((month) => month.key),
    successful_month_count: successfulMonths,
    valid_empty_months: validEmptyMonths,
    source_error_count: sourceErrors.length,`
);

const fixtureFile = 'data/fixtures/calendar-hkjc-fixture-artifact-bridge-fixtures-v1.json';
const fixtures = JSON.parse(fs.readFileSync(fixtureFile, 'utf8'));
if (!fixtures.scenarios.some((scenario) => scenario.id === 'valid-empty-season-gap')) {
  const navBody = '<html><body><h1>Racing Fixture</h1><p>Race meeting calendar</p>'
    + [
      ['2026', '10'], ['2026', '11'], ['2026', '12'],
      ['2027', '01'], ['2027', '02'], ['2027', '03'], ['2027', '04'], ['2027', '05'], ['2027', '06'], ['2027', '07'],
    ].map(([year, month]) => `<a href="/en-us/local/information/fixture?calyear=${year}&calmonth=${month}">${year}-${month}</a>`).join('')
    + '</body></html>';
  const scenario = {
    id: 'valid-empty-season-gap',
    start_date: '2026-08-01',
    end_date_exclusive: '2026-10-01',
    generated_at: '2026-07-10T13:50:00Z',
    batch_id: 'hkjc-live-valid-empty-season-gap',
    campaign_id: 'hkjc-stage10-pilot',
    job_id: 'hkjc-live-fixture-valid-empty-season-gap',
    month_results: [
      { year: 2026, month: 8, ok: true, status: 200, final_url: 'https://racing.hkjc.com/en-us/local/information/fixture?CalMonth=08&CalYear=2026', body: navBody },
      { year: 2026, month: 9, ok: true, status: 200, final_url: 'https://racing.hkjc.com/en-us/local/information/fixture?CalMonth=09&CalYear=2026', body: navBody },
    ],
    expected: {
      coverage_claim: 'source_window_complete',
      record_count: 0,
      dates: [],
      source_error_count: 0,
      valid_empty_months: ['2026-08', '2026-09'],
    },
  };
  const parserIndex = fixtures.scenarios.findIndex((item) => item.id === 'parser-failure');
  fixtures.scenarios.splice(parserIndex < 0 ? fixtures.scenarios.length : parserIndex, 0, scenario);
  fs.writeFileSync(fixtureFile, `${JSON.stringify(fixtures, null, 2)}\n`);
}

const checkerFile = 'scripts/check-calendar-hkjc-fixture-artifact-bridge.mjs';
replaceExact(
  checkerFile,
  `if (!Array.isArray(fixtures.scenarios) || fixtures.scenarios.length < 4) fail('expected success, partial, none, and parser-failure scenarios.');`,
  `if (!Array.isArray(fixtures.scenarios) || fixtures.scenarios.length < 5) fail('expected success, partial, none, valid-empty, and parser-failure scenarios.');`
);

replaceExact(
  checkerFile,
  `  if (JSON.stringify(artifacts.coverage.source_errors) !== JSON.stringify(artifacts.manifest.source_errors)) fail(\`${'${scenario.id}'} Coverage/Manifest source errors differ.\`);

  if (artifacts.report.publication_effect !== 'none') fail(\`${'${scenario.id}'} report publication effect differs.\`);`,
  `  if (JSON.stringify(artifacts.coverage.source_errors) !== JSON.stringify(artifacts.manifest.source_errors)) fail(\`${'${scenario.id}'} Coverage/Manifest source errors differ.\`);
  const expectedValidEmptyMonths = scenario.expected.valid_empty_months ?? [];
  if (JSON.stringify(artifacts.report.valid_empty_months) !== JSON.stringify(expectedValidEmptyMonths)) fail(\`${'${scenario.id}'} valid empty month classification differs.\`);

  if (artifacts.report.publication_effect !== 'none') fail(\`${'${scenario.id}'} report publication effect differs.\`);`
);

const docFile = 'docs/calendar/hkjc-live-fixture-artifact-bridge.md';
const doc = fs.readFileSync(docFile, 'utf8');
if (!doc.includes('## PILOT-04 empty-window semantics')) {
  fs.writeFileSync(docFile, `${doc.trimEnd()}\n\n## PILOT-04 empty-window semantics\n\nA successful HTTP response with zero parsed meeting markers is no longer automatically treated as a parser failure. The bridge now applies a fail-closed source-specific empty-window classifier.\n\nA zero-meeting month is accepted as a valid empty season-gap window only when all of the following are observed together:\n\n- the page still exposes HKJC fixture/calendar shell vocabulary;\n- at least eight official fixture navigation months are present;\n- the navigation month sequence is contiguous;\n- the requested month is one or two months immediately before the first visible navigation month.\n\nThis bounded rule matches the reviewed 2026-08 and 2026-09 structure evidence, where the official source shell exposed the next fixture navigation season beginning in 2026-10. Any zero-meeting response outside this exact shape remains \`parser_failure\`.\n\nThe classifier does not activate detail acquisition, does not raise the supported observation rank above C, and does not change the review-first or no-publication boundary.\n`);
}

console.log('HKJC_PILOT_04_PARSER_RESILIENCE_UPDATE: applied');
