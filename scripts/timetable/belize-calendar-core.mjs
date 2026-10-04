import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';
export const BELIZE_TIMEZONE='America/Belize';
export const BELIZE_AUTHORITY_ID='horse-racing-investments-limited';
export const BELIZE_SYSTEM_ID='national-racing-schedule';
export const BELIZE_SOURCE_ID='horse-racing-belize-schedule';
export const BELIZE_SOURCE_URL='https://horseracingbelize.com/schedule/';
const VENUES=Object.freeze({'peter august stadium':{racecourse_id:'belize--peter-august-stadium-racetrack',venue_name:'Peter August Stadium Racetrack'},"people's stadium":{racecourse_id:'belize--peoples-stadium',venue_name:"People's Stadium"},'castleton race track':{racecourse_id:'belize--castleton-race-track',venue_name:'Castleton Race Track'}});
const MONTHS=Object.freeze({january:'01',february:'02',march:'03',april:'04',may:'05',june:'06',july:'07',august:'08',september:'09',october:'10',november:'11',december:'12'});
function decodeHtml(v){return String(v??'').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&rsquo;|&#8217;/gi,"'").replace(/&#x([0-9a-f]+);/gi,(_,c)=>String.fromCodePoint(Number.parseInt(c,16))).replace(/&#(\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));}
export function visibleText(html){return decodeHtml(String(html??'')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
const pad=v=>String(Number(v)).padStart(2,'0');
const venueKey=v=>String(v).replace(/[’]/g,"'").trim().replace(/\s+/g,' ').toLowerCase();
export function parseBelizeSchedulePage(html,{sourceUrl=BELIZE_SOURCE_URL}={}){
 if(typeof html!=='string'||!html.trim())throw new Error('Belize schedule HTML must be non-empty');
 const text=visibleText(html);if(!/Race\s+Dates\s+2026/i.test(text))throw new Error('Belize 2026 schedule fingerprint missing');
 const rows=[],unknown=[],rx=/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s*(2026)\s+([^\d]{2,80}?)(?=\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s*2026\b|$)/giu;
 for(const m of text.matchAll(rx)){const label=m[4].trim().replace(/\s+/g,' '),venue=VENUES[venueKey(label)];if(!venue){unknown.push(label);continue;}rows.push({date:m[3]+'-'+MONTHS[m[1].toLowerCase()]+'-'+pad(m[2]),source_venue_label:label,racecourse_id:venue.racecourse_id,venue_name:venue.venue_name,source_url:sourceUrl});}
 if(unknown.length)throw new Error('Unknown Belize schedule venue labels: '+[...new Set(unknown)].join(', '));
 const out=[...new Map(rows.map(r=>[r.date+'|'+r.racecourse_id,r])).values()].sort((a,b)=>a.date.localeCompare(b.date)||a.racecourse_id.localeCompare(b.racecourse_id));if(!out.length)throw new Error('Belize 2026 schedule rows missing');return out;
}
function evidence(url,checkedAt){return {source_id:BELIZE_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};}
export function buildBelizeMeetingRecord(row,{checkedAt}={}){const slug=row.racecourse_id.split('--')[1],meetingId='belize-'+row.date+'-'+slug,e=evidence(row.source_url,checkedAt);const record={candidate_id:meetingId,meeting_id:meetingId,country_id:'belize',authority_id:BELIZE_AUTHORITY_ID,racing_system_id:BELIZE_SYSTEM_ID,racecourse_id:row.racecourse_id,date:row.date,timezone:BELIZE_TIMEZONE,racing_type:'thoroughbred-flat',first_race_time_local:null,last_race_time_local:null,timetable_rows:[],source:{source_id:BELIZE_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'official_horse_racing_belize_schedule'},route_id:'belize-official-window',confidence:'high',review_status:'needs_review',notes:'Official Horse Racing Belize schedule confirms meeting date and mapped physical venue. This automatic route is rank C only and does not infer race post times, cancellation or closure.',detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:BELIZE_SOURCE_ID,route_id:'belize-official-window',error_code:null},evidence_support:{meeting_identity:e,meeting_date:e}};const capability_rank=deriveBestAvailableRank(record,[]);record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});return {...record,capability_rank};}
