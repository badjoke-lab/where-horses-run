import crypto from 'node:crypto';

export const TOKAI_OFFICIAL_PDF_URL = 'https://www.kasamatsu-keiba.com/resources/pdfs/news/2026/1768888484_abd42430844a7f06de8d.pdf';
export const TOKAI_OFFICIAL_PDF_SHA256 = '1cefd5c92bc170f56acb1883219f795233a38a698b7919cd42836cc2dfb21e56';
export const TOKAI_VERIFIED_WINDOW = Object.freeze({ start: '2026-09-01', end: '2026-10-03' });

const TOKAI_VENUES = {
  nagoya: { racecourse_id: 'nagoya-racecourse', venue_code: '24' },
  kasamatsu: { racecourse_id: 'kasamatsu-racecourse', venue_code: '23' },
};

// Exact dates transcribed from the pinned official FY2026 Tokai joint schedule
// and cross-checked against the NAR monthly convene source. The PDF hash is
// mandatory: if the official file changes, this bounded transcription is no
// longer treated as complete until it is reviewed against the new bytes.
const VERIFIED_DATES = Object.freeze({
  nagoya: Object.freeze([
    '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04',
    '2026-09-07',
    '2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18',
    '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02',
  ]),
  kasamatsu: Object.freeze([
    '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11',
    '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25',
  ]),
});

function meetingRow(venueKey, date, sourceUrl) {
  const venue = TOKAI_VENUES[venueKey];
  return {
    meeting_id: `nar-${venue.racecourse_id}-${date}`,
    date,
    authority_id: 'nar-local-government-racing',
    racing_system_id: 'japan-nar-system',
    racecourse_id: venue.racecourse_id,
    venue_code: venue.venue_code,
    source_id: 'tokai-region-joint-official-calendar',
    source_label: '令和8年度東海地区競馬開催日程',
    official_source_url: sourceUrl,
  };
}

function withinVerifiedWindow(date) {
  return date >= TOKAI_VERIFIED_WINDOW.start && date <= TOKAI_VERIFIED_WINDOW.end;
}

export function selectTokaiVerifiedMeetings(dates, sourceUrl = TOKAI_OFFICIAL_PDF_URL) {
  const allowed = new Set(dates ?? []);
  return Object.entries(VERIFIED_DATES).flatMap(([venueKey, venueDates]) => venueDates
      .filter((date) => allowed.has(date))
      .map((date) => meetingRow(venueKey, date, sourceUrl)))
    .sort((a, b) => a.date.localeCompare(b.date) || a.meeting_id.localeCompare(b.meeting_id));
}

async function fetchPinnedPdf(fetchImpl) {
  const response = await fetchImpl(TOKAI_OFFICIAL_PDF_URL, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)',
      accept: 'application/pdf',
      'accept-language': 'ja,en;q=.7',
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${TOKAI_OFFICIAL_PDF_URL}`);
  const finalUrl = new URL(response.url || TOKAI_OFFICIAL_PDF_URL);
  if (finalUrl.protocol !== 'https:' || finalUrl.hostname !== 'www.kasamatsu-keiba.com') {
    throw new Error(`unexpected Tokai official redirect: ${finalUrl.toString()}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  if (sha256 !== TOKAI_OFFICIAL_PDF_SHA256) {
    throw new Error(`Tokai official PDF hash changed: ${sha256}`);
  }
  return { url: finalUrl.toString(), bytes: bytes.length, sha256 };
}

export async function discoverTokaiOfficial30d({ dates, fetchImpl = fetch }) {
  if (!Array.isArray(dates) || !dates.length) throw new Error('Tokai official discovery requires dates');
  const requested = [...dates].sort();
  const unsupportedDates = requested.filter((date) => !withinVerifiedWindow(date));
  const failures = [];
  let source = null;
  try {
    source = await fetchPinnedPdf(fetchImpl);
  } catch (error) {
    failures.push({ source_url: TOKAI_OFFICIAL_PDF_URL, reason: String(error?.message ?? error) });
  }

  if (unsupportedDates.length) {
    failures.push({
      source_url: TOKAI_OFFICIAL_PDF_URL,
      reason: `outside_verified_transcription_window:${unsupportedDates[0]}..${unsupportedDates.at(-1)}`,
    });
  }

  const meetings = source ? selectTokaiVerifiedMeetings(requested, source.url) : [];
  const completeness = failures.length === 0 ? 'complete' : source ? 'partial' : 'failed';

  return {
    meetings,
    completeness: {
      source_id: 'tokai-region-joint-official-calendar',
      role: 'mother_set',
      requested_window: { start: requested[0], end: requested.at(-1) },
      result: completeness,
      completeness,
      parsed_meeting_count: meetings.length,
      parsed_detail_count: 0,
      pending_count: unsupportedDates.length,
      failure_count: failures.length,
      source_visible_horizon: completeness === 'complete' ? requested.at(-1) : TOKAI_VERIFIED_WINDOW.end,
      source_urls: [source?.url ?? TOKAI_OFFICIAL_PDF_URL],
      source_sha256: source?.sha256 ?? null,
      source_bytes: source?.bytes ?? null,
      verified_transcription_window: TOKAI_VERIFIED_WINDOW,
      failures,
    },
  };
}
