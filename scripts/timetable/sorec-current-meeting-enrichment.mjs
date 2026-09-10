import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { resolveSorecRacecourseId } from './sorec-programme-reunion-core.mjs';

export const SOREC_CURRENT_MEETING_FALLBACK_URL = 'https://www.turf-fr.com/reunion-courses-marocaines';

const MONTHS = Object.freeze({
  JAN: '01', FEV: '02', FEB: '02', MAR: '03', AVR: '04', APR: '04', MAI: '05', MAY: '05', JUN: '06', JUI: '07', JUL: '07', AOU: '08', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
});

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&eacute;/gi, 'é')
    .replace(/&Eacute;/g, 'É')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

function normalize(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

function isoDate(day, monthToken, year) {
  const month = MONTHS[monthToken];
  if (!month) return null;
  return `${year}-${month}-${String(day).padStart(2, '0')}`;
}

export function parseSorecCurrentMeetingFallbackHtml(html) {
  if (typeof html !== 'string' || html.trim() === '') throw new Error('Morocco current-meeting fallback body must be non-empty HTML');
  const text = normalize(decodeHtml(html));
  const heading = text.match(/R\d+\s+([A-Z -]+?)\s+(\d{1,2})\s+([A-Z]{3})\s+(20\d{2})\b/);
  if (!heading) throw new Error('Morocco current-meeting fallback fingerprint missing meeting heading');
  const [, venueLabel, rawDay, monthToken, year] = heading;
  const date = isoDate(Number(rawDay), monthToken, year);
  const racecourseId = resolveSorecRacecourseId(venueLabel.trim());
  if (!date || !racecourseId) throw new Error(`Morocco current-meeting fallback could not resolve ${venueLabel.trim()} ${rawDay} ${monthToken} ${year}`);

  const times = new Map();
  for (const match of text.matchAll(/\bC(\d{1,2})\s+(\d{1,2}:\d{2})(?::\d{2})?\b/g)) {
    const raceNumber = Number(match[1]);
    if (raceNumber >= 1 && raceNumber <= 30 && !times.has(raceNumber)) times.set(raceNumber, match[2].padStart(5, '0'));
  }
  const raceNumbers = [...times.keys()].sort((a, b) => a - b);
  const continuous = raceNumbers.length > 0 && raceNumbers.every((value, index) => value === index + 1);
  if (!continuous) throw new Error(`Morocco current-meeting fallback did not expose a continuous race-time sequence: ${JSON.stringify(raceNumbers)}`);
  return {
    date,
    racecourse_id: racecourseId,
    timetable_rows: raceNumbers.map((raceNumber) => ({ label: `Race ${raceNumber}`, post_time_local: times.get(raceNumber) })),
  };
}

export function enrichSorecRecordFromCurrentMeeting(record, { html, enrichmentUrl = SOREC_CURRENT_MEETING_FALLBACK_URL }) {
  const parsed = parseSorecCurrentMeetingFallbackHtml(html);
  if (parsed.date !== record.date || parsed.racecourse_id !== record.racecourse_id) return null;
  const enriched = {
    ...record,
    first_race_time_local: parsed.timetable_rows[0].post_time_local,
    last_race_time_local: parsed.timetable_rows.at(-1).post_time_local,
    timetable_rows: parsed.timetable_rows,
    enrichment_evidence: {
      source_id: 'turf-fr-sorec-derived-current-meeting',
      source_url: enrichmentUrl,
      source_status: 'secondary_sorec_attributed',
      role: 'race_time_enrichment',
    },
    notes: `${record.notes ?? ''} Race-time rows enriched from a current-day secondary page that attributes the programme to SOREC; official SOREC remains the meeting authority source.`.trim(),
  };
  return { ...enriched, capability_rank: deriveBestAvailableRank(enriched, enriched.timetable_rows) };
}
