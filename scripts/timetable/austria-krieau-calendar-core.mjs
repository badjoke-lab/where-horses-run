import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const AUSTRIA_TIMEZONE='Europe/Vienna';
export const AUSTRIA_AUTHORITY_ID='wiener-trabrenn-verein';
export const AUSTRIA_SYSTEM_ID='austria-krieau-calendar-system';
export const AUSTRIA_SOURCE_ID='krieau-race-calendar';
export const AUSTRIA_RACECOURSE_ID='austria--trabrennpark-krieau';
export const AUSTRIA_CALENDAR_URL='https://www.krieau.at/besucherinfos/renntermine';

const MONTHS=Object.freeze({JAN:'01',FEB:'02',MAR:'03',APR:'04',MAI:'05',JUN:'06',JUL:'07',AUG:'08',SEP:'09',OKT:'10',NOV:'11',DEZ:'12'});
function decodeHtml(v){return String(v??'').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#x([0-9a-f]+);/gi,(_,c)=>String.fromCodePoint(Number.parseInt(c,16))).replace(/&#(\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));}
export function visibleText(html){return decodeHtml(String(html??'')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
function normalize(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();}
function pad(v){return String(Number(v)).padStart(2,'0');}

export function parseKrieauCalendarHtml(html,{sourceUrl=AUSTRIA_CALENDAR_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('Krieau calendar HTML must be non-empty');
  const text=visibleText(html);
  const yearMatch=text.match(/Renntermine\s+(20\d{2})/i);
  if(!yearMatch) throw new Error('Krieau calendar year fingerprint missing');
  const year=yearMatch[1];
  const normalized=normalize(text);
  const rows=[];
  const rx=/(\d{1,2})\s+(JAN|FEB|MAR|APR|MAI|JUN|JUL|AUG|SEP|OKT|NOV|DEZ)\.?\s+[A-Z]+\s+AB\s+(\d{1,2}:\d{2})\s+UHR/g;
  for(const m of normalized.matchAll(rx)){
    const month=MONTHS[m[2]];
    if(!month) continue;
    rows.push({date:\`\${year}-\${month}-\${pad(m[1])}\`,racecourse_id:AUSTRIA_RACECOURSE_ID,venue_name:'Trabrennpark Krieau',event_start_local:m[3],source_url:sourceUrl});
  }
  const out=[...new Map(rows.map(r=>[r.date,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
  if(!out.length) throw new Error('Krieau meeting rows missing');
  return out;
}

function evidence(url,checkedAt){return {source_id:AUSTRIA_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};}
export function buildAustriaKrieauMeetingRecord(row,{checkedAt}={}){
  const meetingId='austria-krieau-'+row.date;
  const e=evidence(row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'austria',
    authority_id:AUSTRIA_AUTHORITY_ID,racing_system_id:AUSTRIA_SYSTEM_ID,
    racecourse_id:AUSTRIA_RACECOURSE_ID,date:row.date,timezone:AUSTRIA_TIMEZONE,
    racing_type:'harness-racing',first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:AUSTRIA_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'official_krieau_race_calendar_html'},
    route_id:'krieau-race-calendar',confidence:'high',review_status:'needs_review',
    notes:\`Official Krieau race calendar confirms the meeting date and physical venue. Published general event start (\${row.event_start_local}) is context only and is not promoted to race post time. Separate reviewed race newspapers retain richer A-capability evidence.\`,
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:AUSTRIA_SOURCE_ID,route_id:'krieau-race-calendar',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e},
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
