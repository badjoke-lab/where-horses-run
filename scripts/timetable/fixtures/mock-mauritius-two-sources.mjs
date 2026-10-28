// Local-only acquisition fixture for the actual Mauritius runner.
// It must not make HTTP requests or relax production GRA-context requirements.
const fixtureCase = process.env.MAURITIUS_FIXTURE_CASE || 'both-success';
const graHtml = '<html><body><h1>Gambling Regulatory Authority</h1><a>Horseracing</a></body></html>';
const calendarHtml = '<html><body><h1>Racing Calendar</h1><div>The Mauritius racing season runs from March to December. Below is a list of upcoming and past racing fixtures at the Champ de Mars, Port Louis.</div><div>2026 2025 2024 2023 April SAT 25 May SAT 02 SAT 16 SAT 23 SAT 30 June SAT 13 SAT 20 SAT 27 July SAT 11 SAT 18 SAT 25 August SAT 08 SUN 23 SAT 29 September SUN 06 SAT 19 October SUN 04 SAT 10 SAT 17 SAT 31 November SAT 07 SAT 14 SAT 28 December SAT 05 SUN 06 Where to?</div></body></html>';
const failGra = ['gra-timeout', 'both-timeout'].includes(fixtureCase);
const failCalendar = ['calendar-timeout', 'both-timeout'].includes(fixtureCase);
const invalidGra = fixtureCase === 'gra-invalid';
const invalidCalendar = fixtureCase === 'calendar-invalid';
let requestCount = 0;
globalThis.fetch = async function mockMauritiusFetch(url) {
  requestCount += 1;
  const target = String(url);
  if (target === 'https://gra.govmu.org/gra/') {
    if (failGra) throw new Error('GRA fixture timeout');
    return { ok: true, status: 200, url: target, text: async () => invalidGra ? '<html>no verified authority</html>' : graHtml };
  }
  if (target === 'https://supertote.mu/calendar') {
    if (failCalendar) throw new Error('Supertote fixture timeout');
    return { ok: true, status: 200, url: target, text: async () => invalidCalendar ? '<html>unrecognized template</html>' : calendarHtml };
  }
  throw new Error('Fixture attempted unexpected external URL: ' + target);
};
process.on('exit', () => {
  if (requestCount !== 2) {
    process.stderr.write('MAURITIUS_FIXTURE_EXPECTED_EXACTLY_TWO_REQUESTS: ' + requestCount + '\n');
    process.exitCode = 1;
  }
});
