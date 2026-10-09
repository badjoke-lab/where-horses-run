import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const LITHUANIA_TIMEZONE='Europe/Vilnius';
export const LITHUANIA_AUTHORITY_ID='trotting-horse-league';
export const LITHUANIA_SYSTEM_ID='trotting-league-system';
export const LITHUANIA_SOURCE_ID='trotting-league-events-api';
export const LITHUANIA_API_BASE='https://ristunusportas.lt/wp-json/tribe/events/v1/events';
export const LITHUANIA_RACECOURSE_ID='lithuania--sirvintu-hipodromas';

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

function normalizeVenueName(v){
  return String(v??'').normalize('NFKC').replace(/\s+/g,' ').trim();
}
export function racecourseIdForVenueName(name){
  const v=normalizeVenueName(name).toLocaleLowerCase('lt-LT');
  if(v==='širvintų hipodromas'||v==='sirvintu hipodromas') return LITHUANIA_RACECOURSE_ID;
  return null;
}

export function parseLithuaniaEventDetail(html,{sourceUrl=null}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('Lithuania event detail HTML must be non-empty');
  const text=visibleText(html);
  if(!/Ristūnų\s+žirgų\s+lenktynės/i.test(text)) throw new Error('Lithuania trotting event fingerprint missing');
  const venueMatch=text.match(/Vieta:\s*([^:]{2,160}?)(?=\s+Data:)/i);
  if(!venueMatch) throw new Error('Lithuania event venue missing');
  const dateMatch=text.match(/Data:\s*(20\d{2})\s*m\.\s*(sausio|vasario|kovo|balandžio|gegužės|birželio|liepos|rugpjūčio|rugsėjo|spalio|lapkričio|gruodžio)\s*(\d{1,2})\s*d\./i);
  const jsonScheduled=/"eventStatus"\s*:\s*"https:\/\/schema\.org\/EventScheduled"/i.test(html);
  const cancelled=/\batšauk(?:ta|tas|tos)|\bcancelled\b/i.test(text);
  return {
    venue_name:normalizeVenueName(venueMatch[1]),
    detail_date_text:dateMatch?.[0]??null,
    event_scheduled:jsonScheduled,
    cancelled,
    source_url:sourceUrl
  };
}

function evidence(url,checkedAt){
  return {source_id:LITHUANIA_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};
}
export function buildLithuaniaMeetingRecord(row,{checkedAt}={}){
  const meetingId='lithuania-trotting-'+row.date+'-'+row.racecourse_id.replace('lithuania--','');
  const e=evidence(row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'lithuania',
    authority_id:LITHUANIA_AUTHORITY_ID,racing_system_id:LITHUANIA_SYSTEM_ID,
    racecourse_id:row.racecourse_id,date:row.date,timezone:LITHUANIA_TIMEZONE,
    racing_type:'harness-trot',
    first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:LITHUANIA_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'official_tribe_events_api_plus_event_detail'},
    route_id:'trotting-league-events-api-official-window',confidence:'high',review_status:'needs_review',
    notes:'Official RLŽL Events API supplies the source-visible event date and the official event detail confirms the physical venue. Automatic publication remains rank C; the page start time is intentionally not promoted to first-race post time.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:LITHUANIA_SOURCE_ID,route_id:'trotting-league-events-api-official-window',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e}
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
