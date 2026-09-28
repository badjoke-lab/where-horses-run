import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';
export const CZECH_TIMEZONE='Europe/Prague';
export const CZECH_AUTHORITY_ID='czech-racing-calendar';
export const CZECH_SYSTEM_ID='czech-national-calendar-system';
export const CZECH_SOURCE_ID='dostihy-calendar';
export const CZECH_CALENDAR_URL='https://www.dostihy.cz/kalendar-akci';
export const CZECH_VENUES=Object.freeze({
  praha:{racecourse_id:'czech-republic--chuchle-arena-praha',venue_name:'Chuchle Arena Praha'},
  pardubice:{racecourse_id:'czech-republic--pardubice-racecourse',venue_name:'Dostihové závodiště Pardubice'},
  'karlovy vary':{racecourse_id:'czech-republic--karlovy-vary-racecourse',venue_name:'Dostihové závodiště Karlovy Vary'},
  most:{racecourse_id:'czech-republic--hipodrom-most',venue_name:'Hipodrom Most'},
  slusovice:{racecourse_id:'czech-republic--slusovice-racecourse',venue_name:'Dostihové závodiště Slušovice'},
  'lysa nad labem':{racecourse_id:'czech-republic--lysa-nad-labem-racecourse',venue_name:'Dostihové závodiště Lysá nad Labem'},
  brno:{racecourse_id:'czech-republic--brno-dvorska-racecourse',venue_name:'Dostihové závodiště Brno-Dvorska'},
  kolesa:{racecourse_id:'czech-republic--kolesa-racecourse',venue_name:'Závodiště Kolesa'},
  netolice:{racecourse_id:'czech-republic--netolice-racecourse',venue_name:'Dostihové závodiště Netolice'},
});
function decodeHtml(v){return String(v??'').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#x([0-9a-f]+);/gi,(_,c)=>String.fromCodePoint(Number.parseInt(c,16))).replace(/&#(\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));}
export function visibleText(html){return decodeHtml(String(html??'')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
export function normalizeVenue(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();}
function absolute(h,b){return new URL(decodeHtml(h),b).toString();}
function pad(v){return String(v).padStart(2,'0');}
export function extractCzechEventLinks(html,{sourceUrl=CZECH_CALENDAR_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('Czech calendar HTML must be non-empty');
  const out=[];
  for(const m of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
    const href=absolute(m[1],sourceUrl);
    if(/^https:\/\/www\.dostihy\.cz\/kalendar-akci\/[a-z0-9-]+\/?$/i.test(href)) out.push(href.replace(/\/$/,''));
  }
  return [...new Set(out)];
}
export function parseCzechEventDetail(html,{sourceUrl}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('Czech event detail HTML must be non-empty');
  const text=visibleText(html);
  const d=text.match(/(?:Datum konání:|Due date:)\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(20\d{2})/i);
  if(!d) throw new Error('Czech event date fingerprint missing');
  const v=text.match(/(?:Štítky:|Stitky:|Tags:)\s*([^#]{1,160}?)(?=\s+(?:Datum konání:|Due date:|Date:|Datum:))/i);
  if(!v) throw new Error('Czech event venue fingerprint missing');
  const sourceVenue=v[1].trim();
  return {date:`${d[3]}-${pad(d[2])}-${pad(d[1])}`,source_venue_label:sourceVenue,venue:CZECH_VENUES[normalizeVenue(sourceVenue)]??null,source_url:sourceUrl};
}
function evidence(url,checkedAt){return {source_id:CZECH_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};}
export function buildCzechMeetingRecord(row,{checkedAt}={}){
  const meetingId=`czech-national-${row.racecourse_id.replace(/^czech-republic--/,'')}-${row.date}`;
  const e=evidence(row.source_url,checkedAt);
  const record={candidate_id:meetingId,meeting_id:meetingId,country_id:'czech-republic',authority_id:CZECH_AUTHORITY_ID,racing_system_id:CZECH_SYSTEM_ID,racecourse_id:row.racecourse_id,date:row.date,timezone:CZECH_TIMEZONE,first_race_time_local:null,last_race_time_local:null,timetable_rows:[],source:{source_id:CZECH_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'official_national_calendar_event_detail'},route_id:'dostihy-national-calendar',confidence:'high',review_status:'needs_review',notes:'Official Dostihy.cz national calendar confirms meeting date and physical venue. General event timing is not promoted to race post time by this rank-C route.',detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:CZECH_SOURCE_ID,route_id:'dostihy-national-calendar',error_code:null},evidence_support:{meeting_identity:e,meeting_date:e}};
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
