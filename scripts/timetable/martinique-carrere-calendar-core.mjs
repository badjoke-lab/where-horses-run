import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const MARTINIQUE_TIMEZONE='America/Martinique';
export const MARTINIQUE_AUTHORITY_ID='hippodrome-de-carrere';
export const MARTINIQUE_SYSTEM_ID='martinique-reviewed-system';
export const MARTINIQUE_SOURCE_ID='carrere-calendar';
export const MARTINIQUE_SOURCE_URL='https://hippodromedecarrere.fr/index.php/calendrier/';
export const MARTINIQUE_RACECOURSE_ID='martinique--hippodrome-de-carrere';

function decodeHtml(v){
  return String(v??'')
    .replace(/&nbsp;|&#160;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/&eacute;/gi,'é')
    .replace(/&egrave;/gi,'è')
    .replace(/&agrave;/gi,'à')
    .replace(/&ocirc;/gi,'ô')
    .replace(/&ucirc;/gi,'û')
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
const pad=v=>String(Number(v)).padStart(2,'0');

export function parseCarrereCalendarPage(html,{sourceUrl=MARTINIQUE_SOURCE_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('Carrere calendar HTML must be non-empty');
  const text=visibleText(html);
  const start=text.search(/Calendrier\s+2026\s+Date\s+Hippodrome\s+Horaire\s+Courses/i);
  if(start<0) throw new Error('Carrere 2026 calendar fingerprint missing');
  const tail=text.slice(start);
  const end=tail.search(/\s2025\s+Date\s+Hippodrome\s+Horaire\s+Courses/i);
  const block=end>=0?tail.slice(0,end):tail;
  const rows=[];
  const rx=/(\d{2})\/(\d{2})\/(2026)\s+LA\s+MARTINIQUE\s+(\d{1,2})h(\d{2})\s+Plat\s*:\s*(\d+)/gi;
  for(const m of block.matchAll(rx)){
    rows.push({
      date:m[3]+'-'+m[2]+'-'+m[1],
      racecourse_id:MARTINIQUE_RACECOURSE_ID,
      venue_name:'Hippodrome de Carrère',
      published_meeting_time:m[4].padStart(2,'0')+':'+m[5],
      published_race_count:Number(m[6]),
      source_url:sourceUrl
    });
  }
  if(rows.length<10) throw new Error('Carrere 2026 calendar parsed fewer than 10 meetings');
  return [...new Map(rows.map(r=>[r.date,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
}

function evidence(url,checkedAt){
  return {source_id:MARTINIQUE_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};
}

export function buildMartiniqueMeetingRecord(row,{checkedAt}={}){
  const meetingId='martinique-carrere-'+row.date;
  const e=evidence(row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'martinique',
    authority_id:MARTINIQUE_AUTHORITY_ID,racing_system_id:MARTINIQUE_SYSTEM_ID,
    racecourse_id:MARTINIQUE_RACECOURSE_ID,date:row.date,timezone:MARTINIQUE_TIMEZONE,
    racing_type:'thoroughbred-flat',
    first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:MARTINIQUE_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'official_carrere_2026_calendar'},
    route_id:'carrere-calendar-official-window',confidence:'high',review_status:'needs_review',
    notes:'Official Hippodrome de Martinique 2026 calendar confirms the meeting date and fixed Carrere venue. The page also publishes a meeting Horaire and race count, but the automatic public route remains rank C and does not interpret Horaire as first-race post time.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:MARTINIQUE_SOURCE_ID,route_id:'carrere-calendar-official-window',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e}
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
