export const UAE_ERA_CURRENT_SEASON_URL = 'https://emiratesracing.com/season-calendar/current-season';
export const UAE_ERA_HOME_URL = 'https://emiratesracing.com/';

const RACECOURSE_BY_CODE = Object.freeze({
  MEY: 'meydan-racecourse',
  JEB: 'jebel-ali-racecourse',
  AEC: 'al-ain-racecourse',
  ABU: 'abu-dhabi-turf-club',
  SHJ: 'sharjah-racecourse',
});

function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
function isoFromEraDate(day, month, year) {
  return `${year}-${month}-${day}`;
}
function visibleText(html) {
  return String(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ');
}
function officialHostname(url) {
  const parsed = new URL(url);
  return parsed.protocol === 'https:' && parsed.hostname.toLowerCase() === 'emiratesracing.com';
}
function candidateUrls(startDate) {
  return [
    `${UAE_ERA_CURRENT_SEASON_URL}?fixture=${startDate}`,
    UAE_ERA_CURRENT_SEASON_URL,
    UAE_ERA_HOME_URL,
  ];
}
function browserHeaders() {
  return {
    accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
    'accept-language': 'en-AE,en;q=0.9',
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36',
  };
}

export function parseUaeEraCurrentSeasonFixtures(html, { startDate, endDateExclusive }) {
  const fixtures = [];
  const seen = new Set();
  const pattern = /\b(MEY|JEB|AEC|ABU|SHJ)\s+(\d{2})-(\d{2})-(\d{4})\b/g;
  for (const match of visibleText(html).matchAll(pattern)) {
    const [, code, day, month, year] = match;
    const date = isoFromEraDate(day, month, year);
    if (date < startDate || date >= endDateExclusive) continue;
    const racecourseId = RACECOURSE_BY_CODE[code];
    const meetingId = `era-${racecourseId}-${date}`;
    if (seen.has(meetingId)) continue;
    seen.add(meetingId);
    fixtures.push({
      meeting_id: meetingId,
      country_id: 'united-arab-emirates',
      authority_id: 'emirates-racing-authority',
      racing_system_id: 'uae-national-racing-system',
      racecourse_id: racecourseId,
      date,
      timezone: 'Asia/Dubai',
      capability_rank: 'C',
      source: {
        source_id: 'era-season-calendar',
        official_url: UAE_ERA_CURRENT_SEASON_URL,
        extraction_method: 'adapter_candidate',
      },
    });
  }
  return fixtures.sort((left, right) => left.date.localeCompare(right.date) || left.meeting_id.localeCompare(right.meeting_id));
}

export async function discoverUaeEraCurrentSeasonFixtures({ startDate, days = 30, fetchImpl = fetch }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new Error('startDate must be YYYY-MM-DD');
  if (!Number.isInteger(days) || days < 1 || days > 90) throw new Error('days must be an integer from 1 through 90');
  const endDateExclusive = addDays(startDate, days);
  const attempts = [];
  for (const url of candidateUrls(startDate)) {
    try {
      const response = await fetchImpl(url, { headers: browserHeaders(), redirect: 'follow' });
      const finalUrl = response.url || url;
      if (!response.ok) {
        attempts.push({ source_url: url, final_url: finalUrl, status: 'http_error', http_status: response.status });
        continue;
      }
      if (!officialHostname(finalUrl)) {
        attempts.push({ source_url: url, final_url: finalUrl, status: 'off_domain_redirect' });
        continue;
      }
      const html = await response.text();
      const hasCalendarFingerprint = /\b(?:MEY|JEB|AEC|ABU|SHJ)\s+\d{2}-\d{2}-\d{4}\b/.test(visibleText(html));
      if (!hasCalendarFingerprint) {
        attempts.push({ source_url: url, final_url: finalUrl, status: 'calendar_fingerprint_missing' });
        continue;
      }
      const fixtures = parseUaeEraCurrentSeasonFixtures(html, { startDate, endDateExclusive });
      attempts.push({ source_url: url, final_url: finalUrl, status: 'success', fixture_count: fixtures.length });
      return {
        official_url: UAE_ERA_CURRENT_SEASON_URL,
        fetched_url: finalUrl,
        start_date: startDate,
        end_date_exclusive: endDateExclusive,
        fixtures,
        route_attempts: attempts,
      };
    } catch (error) {
      attempts.push({ source_url: url, status: 'request_error', error: String(error?.message ?? error) });
    }
  }
  const error = new Error(`ERA current-season acquisition failed across official routes: ${attempts.map((x) => `${x.source_url}=${x.status}${x.http_status ? ':' + x.http_status : ''}`).join(', ')}`);
  error.route_attempts = attempts;
  throw error;
}

export function buildUaeEraDiscoveryFailureArtifact({ startDate, days, generatedAt, error }) {
  const endDateExclusive = addDays(startDate, days);
  return {
    schema_version: 'uae-era-official-window-candidates-v1',
    generated_at: generatedAt,
    country_id: 'united-arab-emirates',
    authority_id: 'emirates-racing-authority',
    racing_system_id: 'uae-national-racing-system',
    timezone: 'Asia/Dubai',
    source_id: 'era-season-calendar',
    source: 'era',
    country: 'United Arab Emirates',
    acquisition_attempt: {
      attempted_at: generatedAt,
      status: 'network_error',
      source_id: 'era-season-calendar',
      route_id: 'era-current-season-calendar',
      error_code: 'fetch_error',
    },
    discovery: {
      method: 'official_current_season_calendar_plus_racecards',
      schedule_source_id: 'era-season-calendar',
      schedule_source_url: UAE_ERA_CURRENT_SEASON_URL,
      official_fixture_count: 0,
      route_attempts: Array.isArray(error?.route_attempts) ? error.route_attempts : [],
    },
    window: {
      start_date: startDate,
      end_date_exclusive: endDateExclusive,
      days,
      coverage_claim: 'acquisition_failed_preserve_verified_state',
      coverage_note: 'ERA current-season acquisition failed. Existing verified canonical/public state must be preserved; absence in this artifact is not non-running evidence.',
    },
    records: [],
    meeting_presence_records: [],
    diagnostics: {
      source_errors: [{
        stage: 'current_season_calendar',
        source_url: UAE_ERA_CURRENT_SEASON_URL,
        error: String(error?.message ?? error),
      }],
      parse_failures: [],
      unknown_venues: [],
    },
  };
}
