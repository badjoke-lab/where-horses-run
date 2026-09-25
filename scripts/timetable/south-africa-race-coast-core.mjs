import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const SOUTH_AFRICA_TIMEZONE = 'Africa/Johannesburg';
export const RACE_COAST_AUTHORITY_ID = 'race-coast';
export const RACE_COAST_SYSTEM_ID = 'south-africa-race-coast-system';
export const RACE_COAST_SOURCE_ID = 'race-coast-fixtures';
export const RACE_COAST_FIXTURES_URL = 'https://www.racecoast.co.za/fixtures/';

const MONTHS = Object.freeze({
  JANUARY:1,FEBRUARY:2,MARCH:3,APRIL:4,MAY:5,JUNE:6,
  JULY:7,AUGUST:8,SEPTEMBER:9,OCTOBER:10,NOVEMBER:11,DECEMBER:12,
});
const VENUES = Object.freeze({
  'GREY TURF': { racecourse_id:'south-africa--hollywoodbets-greyville', venue_name:'Hollywoodbets Greyville', course_context:'turf' },
  'GREY POLY': { racecourse_id:'south-africa--hollywoodbets-greyville', venue_name:'Hollywoodbets Greyville', course_context:'poly' },
  'SCOT': { racecourse_id:'south-africa--hollywoodbets-scottsville', venue_name:'Hollywoodbets Scottsville', course_context:null },
  'DURBANVILLE': { racecourse_id:'south-africa--hollywoodbets-durbanville', venue_name:'Hollywoodbets Durbanville', course_context:null },
  'KENILWORTH': { racecourse_id:'south-africa--hollywoodbets-kenilworth', venue_name:'Hollywoodbets Kenilworth', course_context:null },
});

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, c) => String.fromCodePoint(Number.parseInt(c, 16)))
    .replace(/&#(\d+);/g, (_, c) => String.fromCodePoint(Number(c)));
}
function text(value) {
  return decodeHtml(String(value ?? '').replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ').trim();
}
function pad(value){ return String(value).padStart(2,'0'); }
export function resolveRaceCoastVenue(label) {
  const key=String(label??'').replace(/\s+/g,' ').trim().toUpperCase();
  const venue=VENUES[key];
  if(!venue) throw new Error(`Unknown Race Coast venue: ${label}`);
  return venue;
}
export function parseRaceCoastFixturesHtml(html,{year=2026,sourceUrl=RACE_COAST_FIXTURES_URL}={}) {
  if(typeof html!=='string'||!html.trim()) throw new Error('Race Coast fixtures HTML must be non-empty');
  if(!/KZN|KWAZULU|FIXTURES/i.test(text(html))) throw new Error('Race Coast fixtures fingerprint missing');
  const rows=[]; const parse_failures=[]; let month=null;
  const tr=[...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
  for(const match of tr){
    const cells=[...match[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m=>text(m[1]));
    if(cells.length<4) continue;
    const first=cells[0].toUpperCase();
    const monthRow=Boolean(MONTHS[first]);
    const continuationRow=!monthRow && first==='';
    if(monthRow) month=MONTHS[first];
    const dayText=(monthRow||continuationRow)?cells[1]:cells[0];
    const venueText=(monthRow||continuationRow)?cells[3]:cells[2];
    const day=Number(dayText);
    if(!month||!Number.isInteger(day)||day<1||day>31) continue;
    let venue;
    try { venue=resolveRaceCoastVenue(venueText); }
    catch(error){
      if(/GREY|SCOT|DURBAN|KENIL/i.test(venueText)) parse_failures.push({code:'unknown_venue',source_text:venueText});
      continue;
    }
    rows.push({
      date:`${year}-${pad(month)}-${pad(day)}`,
      source_venue_label:venueText,
      racecourse_id:venue.racecourse_id,
      venue_name:venue.venue_name,
      course_context:venue.course_context,
      source_url:sourceUrl,
    });
  }
  const unique=new Map();
  for(const row of rows) unique.set(`${row.date}|${row.racecourse_id}`,row);
  return {records:[...unique.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.racecourse_id.localeCompare(b.racecourse_id)),parse_failures};
}
function evidence(url,checkedAt){return {source_id:RACE_COAST_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};}
export function buildRaceCoastMeetingRecord(row,{checkedAt}={}) {
  const meetingId=`south-africa-race-coast-${row.racecourse_id.replace(/^south-africa--/,'')}-${row.date}`;
  const e=evidence(row.source_url??RACE_COAST_FIXTURES_URL,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'south-africa',authority_id:RACE_COAST_AUTHORITY_ID,racing_system_id:RACE_COAST_SYSTEM_ID,
    racecourse_id:row.racecourse_id,date:row.date,timezone:SOUTH_AFRICA_TIMEZONE,first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:RACE_COAST_SOURCE_ID,official_url:row.source_url??RACE_COAST_FIXTURES_URL,checked_at:checkedAt,extraction_method:'official_race_coast_fixtures_html'},
    route_id:'race-coast-fixtures-html',confidence:'high',review_status:'needs_review',
    notes:`Official Race Coast KZN & Western Cape fixture observation; source venue label: ${row.source_venue_label}${row.course_context?`; course context: ${row.course_context}`:''}. Fixture source confirms meeting date and physical racecourse only; race times are not inferred.`,
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,fixtures_url:RACE_COAST_FIXTURES_URL},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:RACE_COAST_SOURCE_ID,route_id:'race-coast-fixtures-html',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e},
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
