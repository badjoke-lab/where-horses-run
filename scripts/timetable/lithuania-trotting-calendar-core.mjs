import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const LITHUANIA_TIMEZONE='Europe/Vilnius';
export const LITHUANIA_AUTHORITY_ID='trotting-horse-league';
export const LITHUANIA_SYSTEM_ID='trotting-league-system';
export const LITHUANIA_SOURCE_ID='trotting-league-events-api';
export const LITHUANIA_EVENTS_API='https://ristunusportas.lt/wp-json/tribe/events/v1/events';
export const LITHUANIA_RACECOURSE_ID='lithuania--sirvintos-hipodromas';

function decodeHtml(v){
  return String(v??'')
    .replace(/&nbsp;|&#160;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/&#x([0-9a-f]+);/gi,(_,c)=>String.fromCodePoint(Number.parseInt(c,16)))
    .replace(/&#(\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));
}
export function visibleText(html){
  return decodeHtml(String(html??''))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

export function normalizeLithuaniaVenue(event){
  const venue=String(event?.venue?.venue??event?.venue??'').trim();
  const description=visibleText(event?.description??'');
  const combined=(venue+' '+description).toLowerCase();
  if(combined.includes('širvintų hipodromas')||combined.includes('širvinų hipodromas')||combined.includes('sirvintu hipodromas')||combined.includes('sirvinu hipodromas')){
    return {racecourse_id:LITHUANIA_RACECOURSE_ID,venue_name:'Širvintų hipodromas'};
  }
  return null;
}

export function parseLithuaniaEventsApi(payload,{sourceUrl=LITHUANIA_EVENTS_API}={}){
  const obj=typeof payload==='string'?JSON.parse(payload):payload;
  const events=Array.isArray(obj?.events)?obj.events:[];
  const rows=[];
  const unknown=[];
  for(const e of events){
    const title=String(e?.title??'');
    if(!/ristūnų žirgų lenktyn|ristunu zirgu lenktyn/i.test(title)) continue;
    const start=String(e?.start_date??'');
    const date=start.slice(0,10);
    if(!/^20\d{2}-\d{2}-\d{2}$/.test(date)) continue;
    const venue=normalizeLithuaniaVenue(e);
    if(!venue){
      unknown.push({event_id:e?.id??null,title,date,url:e?.url??null});
      continue;
    }
    rows.push({
      date,
      racecourse_id:venue.racecourse_id,
      venue_name:venue.venue_name,
      event_id:e?.id??null,
      event_url:e?.url??null,
      source_url:sourceUrl,
      source_start_time:start.slice(11,16)||null,
      source_end_time:String(e?.end_date??'').slice(11,16)||null
    });
  }
  return {
    rows:[...new Map(rows.map(r=>[r.date+'|'+r.racecourse_id,r])).values()].sort((a,b)=>a.date.localeCompare(b.date)),
    unknown_venues:unknown
  };
}

function evidence(url,checkedAt){
  return {source_id:LITHUANIA_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};
}

export function buildLithuaniaMeetingRecord(row,{checkedAt}={}){
  const meetingId='lithuania-sirvintos-'+row.date;
  const e=evidence(row.event_url||row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'lithuania',
    authority_id:LITHUANIA_AUTHORITY_ID,racing_system_id:LITHUANIA_SYSTEM_ID,
    racecourse_id:row.racecourse_id,date:row.date,timezone:LITHUANIA_TIMEZONE,
    racing_type:'harness-racing',
    first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:LITHUANIA_SOURCE_ID,official_url:row.event_url||row.source_url,checked_at:checkedAt,extraction_method:'official_ristunusportas_events_api_plus_event_description'},
    route_id:'trotting-league-events-api-official-window',confidence:'high',review_status:'needs_review',
    notes:'Official Ristūnų sportas Events API supplies the event date and event route; the official event description confirms Širvintų hipodromas. Source-visible start/end times are retained only as diagnostics and are not promoted beyond rank C.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,event_url:row.event_url,source_start_time:row.source_start_time,source_end_time:row.source_end_time},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:LITHUANIA_SOURCE_ID,route_id:'trotting-league-events-api-official-window',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e}
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
