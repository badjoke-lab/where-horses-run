import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const NORWAY_DNT_TIMEZONE='Europe/Oslo';
export const NORWAY_DNT_AUTHORITY_ID='det-norske-travselskap';
export const NORWAY_DNT_SYSTEM_ID='norway-dnt-harness-system';
export const NORWAY_DNT_SOURCE_ID='dnt-terminliste-2026';
export const NORWAY_DNT_CALENDAR_URL='https://old.travsport.no/Sport/Terminliste/';

const VENUES=Object.freeze({
  'Varig Orkla Arena':'norway--varig-orkla-arena',
  'Bjerke Travbane':'norway--bjerke-travbane',
  'Forus Travbane':'norway--forus-travbane',
  'Klosterskogen Travbane':'norway--klosterskogen-travbane',
  'Momarken Travbane':'norway--momarken-travbane',
  'Jarlsberg Travbane':'norway--jarlsberg-travbane',
  'Sørlandets Travpark':'norway--sorlandets-travpark',
  'Biri Travbane':'norway--biri-travbane',
  'Bergen Travpark':'norway--bergen-travpark',
  'Harstad Travpark':'norway--harstad-travpark'
});
function decodeHtml(value){return String(value??'').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#x([0-9a-f]+);/gi,(_,c)=>String.fromCodePoint(Number.parseInt(c,16))).replace(/&#(\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));}
function cellText(html){return decodeHtml(String(html??'')).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
function pad(v){return String(v).padStart(2,'0');}
export function resolveDntRacecourse(label){return VENUES[String(label??'').trim()]??null;}
export function parseDntCalendarHtml(html,{sourceUrl=NORWAY_DNT_CALENDAR_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('DNT calendar HTML must be non-empty');
  if(!/Terminliste|Løpsdagskalender/i.test(cellText(html))) throw new Error('DNT calendar fingerprint missing');
  const records=[],unknown_venues=[],parse_failures=[];
  for(const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
    const cells=[...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m=>cellText(m[1]));
    if(cells.length<2) continue;
    const dm=cells[0].match(/^(\d{1,2})\.(\d{1,2})\.(20\d{2})$/);
    if(!dm) continue;
    const date=`${dm[3]}-${pad(dm[2])}-${pad(dm[1])}`;
    const venue_label=cells[1].trim();
    const racecourse_id=resolveDntRacecourse(venue_label);
    if(!racecourse_id){unknown_venues.push({date,venue_label,source_text:cells.join(' | ')});continue;}
    records.push({date,venue_label,racecourse_id,entry_deadline_text:cells[2]||null,source_url:sourceUrl});
  }
  const unique=new Map(records.map(r=>[`${r.date}/${r.racecourse_id}`,r]));
  const out=[...unique.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.racecourse_id.localeCompare(b.racecourse_id));
  if(out.length===0&&!unknown_venues.length) parse_failures.push({code:'dnt_calendar_rows_missing'});
  return {records:out,unknown_venues,parse_failures};
}
function evidence(url,checkedAt){return{source_id:NORWAY_DNT_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};}
export function buildDntMeetingRecord(row,{checkedAt}={}){
  const meetingId=`norway-${row.racecourse_id}-${row.date}`;
  const e=evidence(row.source_url??NORWAY_DNT_CALENDAR_URL,checkedAt);
  const record={candidate_id:meetingId,meeting_id:meetingId,country_id:'norway',authority_id:NORWAY_DNT_AUTHORITY_ID,racing_system_id:NORWAY_DNT_SYSTEM_ID,racecourse_id:row.racecourse_id,date:row.date,timezone:NORWAY_DNT_TIMEZONE,first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:NORWAY_DNT_SOURCE_ID,official_url:row.source_url??NORWAY_DNT_CALENDAR_URL,checked_at:checkedAt,extraction_method:'dnt_official_current_calendar_html'},
    route_id:'dnt-current-calendar-html',confidence:'high',review_status:'needs_review',
    notes:`Official DNT Løpsdagskalender observation; source venue label: ${row.venue_label}. Entry deadline text is retained only as source context and is not a race post time.`,
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:NORWAY_DNT_CALENDAR_URL,entry_deadline_text:row.entry_deadline_text},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:NORWAY_DNT_SOURCE_ID,route_id:'dnt-current-calendar-html',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e}};
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
