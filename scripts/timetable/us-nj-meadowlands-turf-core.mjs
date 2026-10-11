import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const NJ_TIMEZONE = 'America/New_York';
export const NJ_AUTHORITY_ID = 'new-jersey-racing-commission';
export const NJ_SYSTEM_ID = 'us-nj-meadowlands-thoroughbred-turf-system';
export const NJ_SOURCE_ID = 'meadowlands-2026-turf-events';
export const NJ_RACECOURSE_ID = 'united-states--meadowlands-racetrack';
export const NJ_OFFICIAL_INDEX_URL =
  'https://www.njoag.gov/about/divisions-and-offices/nj-racing-commission-home/race-dates/';
export const NJ_OFFICIAL_MEET_URL = 'https://playmeadowlands.com/events/month/2026-10/';
export const NJ_EXPECTED_TURF_DATES = Object.freeze([
  '2026-09-18','2026-09-19','2026-09-25','2026-09-26',
  '2026-10-02','2026-10-03','2026-10-09','2026-10-10','2026-10-16'
]);
const mapMonth = {September:'09',October:'10'};
const pad = s => String(s).padStart(2,'0');
function text(html) {
  return String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]*>/g,' ')
    .replace(/&nbsp;|&#160;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/\s+/g,' ').trim();
}
export function parseMeadowlandsTurfMonth(html, month, sourceUrl) {
  if(![9,10].includes(month)) throw Error('Only 2026 September/October allowed');
  const v = text(html);
  if(!/Live Turf Racing/i.test(v) || !/Monmouth Park @ Meadowlands Turf Meet/i.test(v))
    throw Error('NJ Meadowlands turf event fingerprint missing');
  const regex = /Live Turf Racing\s+(September|October)\s+(\d{1,2})\s+@\s+0?7:00\s*PM/gi;
  const matching = new Set();
  for(const m of v.matchAll(regex)) {
    const mm = mapMonth[m[1][0].toUpperCase()+m[1].slice(1).toLowerCase()];
    if(Number(mm)!==month) continue;
    const d=Number(m[2]);
    const date = '2026-'+mm+'-'+pad(d);
    if(d<1||d>31||!NJ_EXPECTED_TURF_DATES.includes(date)) throw Error('Unexpected 2026 turf date '+date);
    matching.add(date);
  }
  return [...matching].sort().map(date=>({
    date, racecourse_id:NJ_RACECOURSE_ID,
    racing_system_id:NJ_SYSTEM_ID,
    racing_type:'thoroughbred-flat',
    venue_name:'Meadowlands Racetrack',
    source_url:sourceUrl
  }));
}

export function assertMeadowlandsTurfSeason(rows) {
  const dates=[...new Set(rows.map(r=>r.date))].sort();
  if(JSON.stringify(dates)!==JSON.stringify(NJ_EXPECTED_TURF_DATES))
    throw Error('NJ 2026 Meadowlands turf: source-visible dates do not match approved/reviewed nine-day season; do not publish stale state');
  return dates;
}

export function reviewMeadowlandsTurfSeason(rows) {
  const dates=[...new Set(rows.map(r=>r.date))].sort();
  if(dates.some(date=>!NJ_EXPECTED_TURF_DATES.includes(date)))
    throw Error('NJ turf source contains out-of-scope dates');
  // A regulator-approved date missing from an operator event listing is NOT cancellation.
  // Preserve source-visible dates and surface an explicit coverage discrepancy.
  if(dates.length<5) throw Error('NJ turf source-visible dates unexpectedly sparse');
  return {dates,missing_approved_dates:NJ_EXPECTED_TURF_DATES.filter(date=>!dates.includes(date))};
}

export function buildNjTurfCandidate(row,checkedAt) {
  const ev={source_id:NJ_SOURCE_ID,official_source_url:row.source_url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};
  const candidateId='us-nj-meadowlands-turf-'+row.date;
  const record={
    candidate_id:candidateId,meeting_id:candidateId,country_id:'united-states',
    authority_id:NJ_AUTHORITY_ID,racing_system_id:NJ_SYSTEM_ID,
    racecourse_id:NJ_RACECOURSE_ID,date:row.date,timezone:NJ_TIMEZONE,
    racing_type:'thoroughbred-flat',
    first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:NJ_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'meadowlands_2026_official_turf_events'},
    route_id:'njrc-meadowlands-turf-2026',confidence:'high',review_status:'needs_review',
    notes:'Exact source-visible 2026 thoroughbred turf meeting at Meadowlands Racetrack. Separate from Meadowlands Standardbred racing. No per-race post times inferred, C only. A missing source/fetch is not cancellation evidence.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:NJ_SOURCE_ID,route_id:'njrc-meadowlands-turf-2026',error_code:null},
    evidence_support:{meeting_identity:ev,meeting_date:ev}
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
