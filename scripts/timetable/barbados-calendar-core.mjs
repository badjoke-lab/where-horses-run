import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const BARBADOS_TIMEZONE='America/Barbados';
export const BARBADOS_AUTHORITY_ID='barbados-turf-club';
export const BARBADOS_SYSTEM_ID='barbados-reviewed-system';
export const BARBADOS_SOURCE_ID='barbados-racing-calendar';
export const BARBADOS_DETAIL_SOURCE_ID='barbados-programmes';
export const BARBADOS_RACECOURSE_ID='barbados--garrison-savannah';
export const BARBADOS_SOURCE_URL='https://www.barbadosturfclub.org/racing-calendar/';
export const BARBADOS_PROGRAMMES_URL='https://www.barbadosturfclub.org/provisional-official-programmes/';

const MONTHS=Object.freeze({
  january:'01',february:'02',march:'03',april:'04',may:'05',june:'06',
  july:'07',august:'08',september:'09',october:'10',november:'11',december:'12'
});

function decodeHtml(value){
  return String(value??'')
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
const pad=v=>String(Number(v)).padStart(2,'0');

export function parseBarbadosRacingCalendar(html,{sourceUrl=BARBADOS_SOURCE_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('Barbados calendar HTML must be non-empty');
  const text=visibleText(html);
  if(!/2026\s+RACING\s+CALENDAR/i.test(text)) throw new Error('Barbados 2026 racing calendar fingerprint missing');
  const rows=[];
  const rx=/(?:MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)\s+(?:([A-Z]+)\s+)?(\d{1,2})(?:ST|ND|RD|TH)?(?:\s+([A-Z]+))?,?\s+2026/gi;
  for(const m of text.matchAll(rx)){
    const monthName=(m[1]||m[3]||'').toLowerCase();
    const month=MONTHS[monthName];
    if(!month) continue;
    const date='2026-'+month+'-'+pad(m[2]);
    const after=text.slice(m.index,m.index+220);
    const cancelled=/\bCANCELLED\b/i.test(after);
    rows.push({date,racecourse_id:BARBADOS_RACECOURSE_ID,venue_name:'Garrison Savannah',cancelled,source_url:sourceUrl});
  }
  return [...new Map(rows.map(r=>[r.date,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
}

function evidence(url,checkedAt){
  return {source_id:BARBADOS_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};
}

export function buildBarbadosMeetingRecord(row,{checkedAt}={}){
  const meetingId='barbados-garrison-savannah-'+row.date;
  const e=evidence(row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'barbados',
    authority_id:BARBADOS_AUTHORITY_ID,racing_system_id:BARBADOS_SYSTEM_ID,
    racecourse_id:BARBADOS_RACECOURSE_ID,date:row.date,timezone:BARBADOS_TIMEZONE,
    racing_type:'thoroughbred-flat',
    first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:BARBADOS_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'official_barbados_racing_calendar'},
    route_id:'barbados-racing-calendar-official-window',confidence:'high',review_status:'needs_review',
    notes:'Official Barbados Turf Club racing calendar confirms the meeting date at the fixed Garrison Savannah venue. Automatic schedule publication is rank C; programme-level post times remain a separate reviewed capability.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:BARBADOS_SOURCE_ID,route_id:'barbados-racing-calendar-official-window',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e}
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
