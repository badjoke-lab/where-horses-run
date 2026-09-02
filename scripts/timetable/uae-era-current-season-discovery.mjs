const OFFICIAL_URL = 'https://emiratesracing.com/season-calendar/current-season';

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

export function parseUaeEraCurrentSeasonFixtures(html, { startDate, endDateExclusive }) {
  const fixtures = [];
  const seen = new Set();
  const pattern = /\b(MEY|JEB|AEC|ABU|SHJ)\s+(\d{2})-(\d{2})-(\d{4})\b/g;
  for (const match of String(html).matchAll(pattern)) {
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
        source_id: 'era-current-season-calendar',
        official_url: OFFICIAL_URL,
        extraction_method: 'adapter_candidate',
      },
    });
  }
  return fixtures.sort((left, right) => left.date.localeCompare(right.date) || left.meeting_id.localeCompare(right.meeting_id));
}

export async function discoverUaeEraCurrentSeasonFixtures({ startDate, days = 30, fetchImpl = fetch }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new Error('startDate must be YYYY-MM-DD');
  if (!Number.isInteger(days) || days < 1 || days > 90) throw new Error('days must be an integer from 1 through 90');
  const response = await fetchImpl(OFFICIAL_URL, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'WhereHorsesRun/1.0 public timetable research (review-only)',
    },
    redirect: 'follow',
  });
  if (!response.ok) throw new Error(`ERA current-season request failed: ${response.status}`);
  const finalUrl = new URL(response.url);
  if (finalUrl.protocol !== 'https:' || finalUrl.hostname.toLowerCase() !== 'emiratesracing.com') {
    throw new Error(`ERA current-season request left the official hostname: ${response.url}`);
  }
  const endDateExclusive = addDays(startDate, days);
  return {
    official_url: OFFICIAL_URL,
    start_date: startDate,
    end_date_exclusive: endDateExclusive,
    fixtures: parseUaeEraCurrentSeasonFixtures(await response.text(), { startDate, endDateExclusive }),
  };
}
