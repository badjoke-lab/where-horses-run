import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const SLOVENIA_TIMEZONE='Europe/Ljubljana';
export const SLOVENIA_AUTHORITY_ID='kasaska-zveza-slovenije';
export const SLOVENIA_SYSTEM_ID='slovenian-trotting-system';
export const SLOVENIA_SOURCE_ID='slovenian-trotting-calendar-2026';
export const SLOVENIA_SOURCE_URL='https://www.kasaska-zveza.si/koledar.html';

export const SLOVENIA_CURRENT_VENUES=Object.freeze({
  'KK LJUTOMER':{racecourse_id:'slovenia--hipodrom-ljutomer',venue_name:'Hipodrom Ljutomer'},
  'KK ŠENTJERNEJ':{racecourse_id:'slovenia--hipodrom-sentjernej',venue_name:'Hipodrom Šentjernej'},
  'KK KOMENDA':{racecourse_id:'slovenia--hipodrom-komenda',venue_name:'Hipodrom Komenda'},
});

function decodeHtml(v){
  return String(v??'')
    .replace(/&nbsp;|&#160;/gi,' ')
    .replace(/&amp;/gi,'&').replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/&#x([0-9a-f]+);/gi,(_,c)=>String.fromCodePoint(Number.parseInt(c,16)))
    .replace(/&#(\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));
}
export function visibleText(html){
  return decodeHtml(String(html??''))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/\s+/g,' ').trim();
}
const pad=v=>String(Number(v)).padStart(2,'0');

export function parseSloveniaCalendarPage(html,{sourceUrl=SLOVENIA_SOURCE_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('Slovenia calendar HTML must be non-empty');
  const text=visibleText(html);
  const start=text.search(/Koledar\s+dirk\s+2026\s+Datum\s+Organizator/i);
  if(start<0) throw new Error('Slovenia 2026 calendar fingerprint missing');
  const block=text.slice(start);
  const organizer='(?:KK LJUTOMER|KK ŠENTJERNEJ|KK POSAVJE KRŠKO|KK KOMENDA|KD KRIM|KD KRIŽEVCI|KK STOŽICE|KD LENART)';
  const rx=new RegExp('(\\d{1,2})\\.(\\d{1,2})\\.(2026)\\s+('+organizer+')\\b','giu');
  const rows=[];
  for(const m of block.matchAll(rx)){
    rows.push({
      date:m[3]+'-'+pad(m[2])+'-'+pad(m[1]),
      organizer:m[4].replace(/\s+/g,' ').trim().toUpperCase(),
      source_url:sourceUrl,
    });
  }
  if(rows.length<18) throw new Error('Slovenia 2026 calendar parsed fewer than 18 meetings');
  return [...new Map(rows.map(r=>[r.date+'|'+r.organizer,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
}
function evidence(url,checkedAt){
  return {source_id:SLOVENIA_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};
}
export function resolveSloveniaVenue(row){
  return SLOVENIA_CURRENT_VENUES[row.organizer]??null;
}
export function buildSloveniaMeetingRecord(row,{checkedAt}={}){
  const venue=resolveSloveniaVenue(row);
  if(!venue) throw new Error('Unmapped Slovenian organizer: '+row.organizer);
  const meetingId='slovenia-trotting-'+row.date+'-'+venue.racecourse_id.replace('slovenia--','');
  const e=evidence(row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'slovenia',
    authority_id:SLOVENIA_AUTHORITY_ID,racing_system_id:SLOVENIA_SYSTEM_ID,
    racecourse_id:venue.racecourse_id,date:row.date,timezone:SLOVENIA_TIMEZONE,
    racing_type:'harness-trot',first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:SLOVENIA_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'official_kzs_2026_calendar'},
    route_id:'slovenian-trotting-calendar-official-window',confidence:'high',review_status:'needs_review',
    notes:'Official Kasaška zveza Slovenije 2026 calendar confirms the meeting date and organizer. For the current forward window, organizer-to-physical-venue mapping is restricted to independently verified Hipodrom Ljutomer, Hipodrom Šentjernej and Hipodrom Komenda. No race times are inferred.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:SLOVENIA_SOURCE_ID,route_id:'slovenian-trotting-calendar-official-window',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e}
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
