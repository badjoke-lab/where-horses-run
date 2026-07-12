import {
  classifyUaeEraDetailMeeting,
  discoverUaeEraRaceNumbers,
  parseUaeEraPublicSafeRacecardHtml,
  uaeEraDetailContractV1,
} from './uae-era-detail-artifact-core.mjs';

const argument = (name) => process.argv.find((item) => item.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;
const date = argument('date');
const racecourseId = argument('racecourse-id');
const expectedRacesArg = argument('expected-races');
const expectedRaces = expectedRacesArg == null ? null : Number(expectedRacesArg);

if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date ?? ''))) throw new Error('--date=YYYY-MM-DD is required');
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(racecourseId ?? ''))) throw new Error('--racecourse-id=<stable-id> is required');
if (expectedRaces !== null && (!Number.isInteger(expectedRaces) || expectedRaces < 1 || expectedRaces > 30)) {
  throw new Error('--expected-races must be an integer from 1 through 30');
}

async function fetchOfficial(url) {
  const response = await fetch(url, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'WhereHorsesRun/1.0 public timetable research (review-only)',
    },
    redirect: 'follow',
  });
  if (!response.ok) throw new Error(`ERA detail request failed: ${response.status} ${url}`);
  const finalUrl = new URL(response.url);
  if (finalUrl.protocol !== 'https:' || finalUrl.hostname.toLowerCase() !== 'emiratesracing.com') {
    throw new Error(`ERA detail request left the official hostname: ${response.url}`);
  }
  return { body: await response.text(), final_url: response.url, status: response.status };
}

const firstUrl = `https://emiratesracing.com/racecard/${date}/1/declarations`;
const first = await fetchOfficial(firstUrl);
let raceNumbers = discoverUaeEraRaceNumbers(first.body, date);
if (raceNumbers.length === 0 && expectedRaces !== null) raceNumbers = Array.from({ length: expectedRaces }, (_, index) => index + 1);
if (raceNumbers.length === 0) throw new Error('ERA racecard page exposed no bounded race navigation');
if (raceNumbers[0] !== 1 || !raceNumbers.every((value, index) => value === index + 1)) {
  throw new Error(`ERA race navigation is not continuous from Race 1: ${JSON.stringify(raceNumbers)}`);
}
if (expectedRaces !== null && raceNumbers.length !== expectedRaces) {
  throw new Error(`ERA race navigation count differs: ${raceNumbers.length} != ${expectedRaces}`);
}

const observations = [];
for (const raceNumber of raceNumbers) {
  const sourceUrl = `https://emiratesracing.com/racecard/${date}/${raceNumber}/declarations`;
  const page = raceNumber === 1 ? first : await fetchOfficial(sourceUrl);
  const observation = parseUaeEraPublicSafeRacecardHtml(page.body, { sourceUrl });
  if (observation.racecourse_id !== racecourseId) {
    throw new Error(`ERA racecourse identity differs for Race ${raceNumber}: ${observation.racecourse_id} != ${racecourseId}`);
  }
  observations.push(observation);
}

const classification = classifyUaeEraDetailMeeting({ observations, meeting_complete: true });
const sourceErrors = observations.flatMap((row) => row.missing_fields.includes('post_time_local')
  ? [{ code: 'parser_failure', scope_ref: `${date}:race-${row.race_number}`, message: 'Official racecard page did not expose a public post time.' }]
  : []);

const output = {
  schema_version: 'calendar-uae-era-detail-live-evidence-v1',
  work_id: 'WHR-CAL-UAE-ERA-DETAIL-RECOVERY',
  implementation_unit: 'UAE-DETAIL-RECOVERY-01',
  generated_at: new Date().toISOString(),
  source: {
    source_id: uaeEraDetailContractV1.source_id,
    authority_id: uaeEraDetailContractV1.authority_id,
    official_hostname: uaeEraDetailContractV1.official_hostname,
    route_template: 'https://emiratesracing.com/racecard/{date}/{race_number}/declarations',
    response_body_retained: false,
  },
  meeting: {
    date,
    timezone: uaeEraDetailContractV1.timezone,
    racecourse_id: racecourseId,
    race_count: observations.length,
    meeting_complete: true,
  },
  classification,
  observations,
  source_errors: sourceErrors,
  safety: {
    participant_fields_retained: false,
    betting_fields_retained: false,
    result_fields_retained: false,
    payout_fields_retained: false,
    raw_html_retained: false,
    canonical_write: false,
    public_write: false,
    publication_effect: 'none',
    human_review_required: true,
  },
};

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
