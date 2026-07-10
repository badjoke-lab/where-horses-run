import { buildUaeEraSeasonCalendarArtifacts } from './uae-era-season-calendar-core.mjs';

const ARTICLE_URL = 'https://emiratesracing.com/news/the-emirates-racing-authority-era-has-announced-the-official-schedule-for-the-2026-2027-uae-horse-racing-season';
const PDF_URL = 'https://d2xuc5ucjmnf40.cloudfront.net/downloads/UAE-ERA-Race-Fixture-2026-27.pdf';
const TRUSTED_VENUE_MAP = Object.freeze({
  'meydan racecourse': 'meydan-racecourse',
});
const MONTHS = Object.freeze({
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
});
const SMALL_NUMBERS = Object.freeze({ one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 });

function decodeEntities(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

export function uaeEraArticleVisibleText(html) {
  return decodeEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isoDate(day, monthName, year) {
  const month = MONTHS[String(monthName).toLowerCase()];
  if (!month) return null;
  const value = `${year}-${month}-${String(day).padStart(2, '0')}`;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? null : value;
}

function parseNumberToken(value) {
  const token = String(value ?? '').toLowerCase();
  if (/^\d+$/.test(token)) return Number(token);
  return SMALL_NUMBERS[token] ?? null;
}

function normalizeVenueLabel(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function mappedVenueId(label) {
  return TRUSTED_VENUE_MAP[normalizeVenueLabel(label).toLowerCase()] ?? null;
}

function matchCount(text, venuePattern) {
  const match = text.match(new RegExp(`${venuePattern}\\s*\\((\\d+)\\s+race meetings?\\)`, 'i'));
  return match ? Number(match[1]) : null;
}

export function parseUaeEraSeasonArticleHtml(html, { sourceUrl = ARTICLE_URL } = {}) {
  const url = new URL(sourceUrl);
  if (url.protocol !== 'https:' || url.hostname !== 'emiratesracing.com') throw new Error('sourceUrl must be official emiratesracing.com HTTPS');
  const text = uaeEraArticleVisibleText(html);
  const seasonMatch = text.match(/official schedule for the (\d{4})[–-](\d{4}) UAE horse racing season/i);
  const startMatch = text.match(/commence on (\d{1,2}) ([A-Za-z]+) (\d{4}) at ([A-Za-z ]+?)(?=\.|,| The upcoming season|$)/i);
  const totalMatch = text.match(/features? (\d+) race meetings across (\d+|one|two|three|four|five|six|seven|eight|nine|ten) racecourses/i);
  const closeMatch = text.match(/Meydan Racecourse[^.]{0,260}?conclude the season[^.]{0,260}?on (\d{1,2}) ([A-Za-z]+) (\d{4})/i);

  const openingDate = startMatch ? isoDate(startMatch[1], startMatch[2], startMatch[3]) : null;
  const openingVenue = startMatch ? normalizeVenueLabel(startMatch[4]) : null;
  const closingDate = closeMatch ? isoDate(closeMatch[1], closeMatch[2], closeMatch[3]) : null;

  const venueCounts = {
    meydan: matchCount(text, 'Meydan Racecourse'),
    abu_dhabi: matchCount(text, 'Abu Dhabi Turf Club'),
    al_ain: matchCount(text, 'Al Ain Racecourse'),
    jebel_ali: matchCount(text, 'Jebel Ali Racecourse'),
    sharjah: matchCount(text, 'Sharjah Racecourse'),
  };
  const venueCountValues = Object.values(venueCounts);
  const venueCountsComplete = venueCountValues.every(Number.isInteger);

  const mappedMeetings = [];
  const unresolvedVenueObservations = [];
  if (openingDate && openingVenue) {
    const racecourseId = mappedVenueId(openingVenue);
    if (racecourseId) {
      mappedMeetings.push({
        meeting_id: `uae-${racecourseId}-${openingDate}`,
        racecourse_id: racecourseId,
        date: openingDate,
      });
    } else {
      unresolvedVenueObservations.push({ date: openingDate, venue_label: openingVenue, reason: 'canonical_racecourse_id_not_reviewed' });
    }
  }
  if (closingDate) {
    const racecourseId = mappedVenueId('Meydan Racecourse');
    mappedMeetings.push({
      meeting_id: `uae-${racecourseId}-${closingDate}`,
      racecourse_id: racecourseId,
      date: closingDate,
    });
  }

  return {
    schema_version: 'calendar-uae-era-season-article-observation-v1',
    source_url: sourceUrl,
    season_start_year: seasonMatch ? Number(seasonMatch[1]) : null,
    season_end_year: seasonMatch ? Number(seasonMatch[2]) : null,
    opening_date: openingDate,
    opening_venue_label: openingVenue,
    closing_date: closingDate,
    total_race_meetings: totalMatch ? Number(totalMatch[1]) : null,
    total_racecourses: totalMatch ? parseNumberToken(totalMatch[2]) : null,
    venue_meeting_counts: venueCounts,
    venue_counts_complete: venueCountsComplete,
    venue_count_sum: venueCountsComplete ? venueCountValues.reduce((sum, count) => sum + count, 0) : null,
    mapped_meetings: mappedMeetings.sort((left, right) => `${left.date}:${left.meeting_id}`.localeCompare(`${right.date}:${right.meeting_id}`)),
    unresolved_venue_observations: unresolvedVenueObservations,
    pdf_url: text.includes(PDF_URL) ? PDF_URL : null,
    raw_source_storage: 'disabled',
  };
}

export function buildUaeEraArticleArtifacts({
  html,
  generatedAt,
  checkedAt,
  batchId,
  campaignId,
  jobId,
}) {
  const observation = parseUaeEraSeasonArticleHtml(html, { sourceUrl: ARTICLE_URL });
  if (!observation.opening_date || !observation.closing_date) throw new Error('official article opening/closing date structure not observed');
  if (observation.total_race_meetings !== 64 || observation.total_racecourses !== 5) throw new Error('official article season summary differs from reviewed 64-meeting / 5-racecourse structure');
  if (!observation.venue_counts_complete || observation.venue_count_sum !== 64) throw new Error('official article venue meeting counts do not close to 64');
  if (observation.mapped_meetings.length !== 1 || observation.mapped_meetings[0].racecourse_id !== 'meydan-racecourse') {
    throw new Error('trusted venue mapping must emit exactly the reviewed Meydan closing meeting');
  }
  const unresolvedDates = observation.unresolved_venue_observations.map((item) => item.date);
  const artifacts = buildUaeEraSeasonCalendarArtifacts({
    startDate: observation.opening_date,
    endDateExclusive: nextDay(observation.closing_date),
    generatedAt,
    checkedAt,
    officialSourceUrl: ARTICLE_URL,
    batchId,
    campaignId,
    jobId,
    reviewedMeetings: observation.mapped_meetings,
    windowComplete: false,
    unresolvedDates,
    sourceErrors: [],
    runnerUsed: 'github_actions',
  });
  return { observation, artifacts };
}

function nextDay(date) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}

export const UAE_ERA_SEASON_ARTICLE_V1 = Object.freeze({
  article_url: ARTICLE_URL,
  pdf_url: PDF_URL,
  trusted_venue_map: TRUSTED_VENUE_MAP,
});
