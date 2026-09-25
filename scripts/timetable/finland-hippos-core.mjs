import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const FINLAND_TIMEZONE = 'Europe/Helsinki';
export const FINLAND_AUTHORITY_ID = 'suomen-hippos';
export const FINLAND_SYSTEM_ID = 'finland-suomen-hippos-harness-system';
export const FINLAND_SOURCE_ID = 'hippos-calendar-2026';
export const FINLAND_CALENDAR_URL = 'https://heppa.hippos.fi/heppa/app?page=racing/RaceCalendarEarlierYear&service=external';

const VENUES = Object.freeze([
  { aliases:['HELSINKI','VERMO'], id:'finland--vermo', name:'Vermo' },
  { aliases:['TAMPERE','TEIVO'], id:'finland--tampere', name:'Tampere' },
  { aliases:['LAHTI','JOKIMAA'], id:'finland--lahti', name:'Lahti' },
  { aliases:['KUOPIO','SORSASALO'], id:'finland--kuopio', name:'Kuopio' },
  { aliases:['SEINAJOKI'], id:'finland--seinajoki', name:'Seinäjoki' },
  { aliases:['TURKU','METSAMAKI'], id:'finland--turku', name:'Turku' },
  { aliases:['OULU','AIMARAUTIO'], id:'finland--oulu', name:'Oulu' },
  { aliases:['JYVASKYLA','KILLERI'], id:'finland--jyvaskyla', name:'Jyväskylä' },
  { aliases:['MIKKELI'], id:'finland--mikkeli', name:'Mikkeli' },
  { aliases:['KAUSTINEN','NIKULA'], id:'finland--kaustinen', name:'Kaustinen' },
  { aliases:['KOUVOLA'], id:'finland--kouvola', name:'Kouvola' },
  { aliases:['PORI'], id:'finland--pori', name:'Pori' },
  { aliases:['JOENSUU','LINNUNLAHTI'], id:'finland--joensuu', name:'Joensuu' },
  { aliases:['FORSSA','PILVENMAKI'], id:'finland--forssa', name:'Forssa' },
  { aliases:['LAPPEENRANTA'], id:'finland--lappeenranta', name:'Lappeenranta' },
  { aliases:['ROVANIEMI','MANTYVAARA'], id:'finland--rovaniemi', name:'Rovaniemi' },
  { aliases:['YLIVIESKA'], id:'finland--ylivieska', name:'Ylivieska' },
  { aliases:['TORNIO'], id:'finland--tornio', name:'Tornio' },
  { aliases:['KAJAANI'], id:'finland--kajaani', name:'Kajaani' },
]);

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&auml;/gi, 'ä').replace(/&ouml;/gi, 'ö')
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}
export function finlandVisibleText(value) {
  return decodeHtml(String(value ?? ''))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<br\s*\/?\s*>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function norm(value){
  return finlandVisibleText(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
}
function pad(value){return String(value).padStart(2,'0');}
function isoDate(value){
  const m=String(value??'').match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  return m ? `${m[3]}-${pad(m[2])}-${pad(m[1])}` : null;
}
function cellsFromRow(block){
  return [...String(block).matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m=>finlandVisibleText(m[1]));
}
export function resolveFinlandRacecourse(label){
  const n=norm(label);
  const hit=VENUES.find(v=>v.aliases.some(a=>n.includes(a)));
  return hit ? { racecourse_id:hit.id, venue_name:hit.name } : null;
}
export function parseFinlandCalendarHtml(html,{sourceUrl=FINLAND_CALENDAR_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('Finland calendar HTML must be non-empty');
  const visible=finlandVisibleText(html);
  if(!/Kilpailutiedot/i.test(visible)||!/Ravitapahtumia/i.test(visible)) throw new Error('Suomen Hippos calendar fingerprint missing');
  const records=[]; const cancelled=[]; const unknown_venues=[]; const parse_failures=[];
  for(const match of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
    const cells=cellsFromRow(match[1]);
    if(cells.length<3) continue;
    const date=isoDate(cells[0]);
    if(!date) continue;
    const timeCell=String(cells[1]??'').trim();
    const venueCell=String(cells[2]??'').trim();
    if(/PERUTTU/i.test(timeCell)||/PERUTTU/i.test(venueCell)){
      cancelled.push({date,source_text:cells.join(' | '),source_url:sourceUrl});
      continue;
    }
    const resolved=resolveFinlandRacecourse(venueCell);
    if(!resolved){
      unknown_venues.push({date,venue_label:venueCell,source_text:cells.join(' | ')});
      continue;
    }
    records.push({
      date,
      racecourse_id:resolved.racecourse_id,
      venue_name:resolved.venue_name,
      venue_label:venueCell,
      published_meeting_time_local:/^\d{1,2}:\d{2}$/.test(timeCell)?timeCell.padStart(5,'0'):null,
      source_url:sourceUrl,
    });
  }
  const unique=new Map();
  for(const row of records) unique.set(`${row.date}/${row.racecourse_id}`,row);
  return {records:[...unique.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.racecourse_id.localeCompare(b.racecourse_id)),cancelled,unknown_venues,parse_failures};
}
function evidence(url,checkedAt){return {source_id:FINLAND_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};}
export function buildFinlandMeetingRecord(row,{checkedAt}={}){
  const meetingId=`finland-hippos-${row.racecourse_id.replace(/^finland--/,'')}-${row.date}`;
  const e=evidence(row.source_url??FINLAND_CALENDAR_URL,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'finland',authority_id:FINLAND_AUTHORITY_ID,racing_system_id:FINLAND_SYSTEM_ID,
    racecourse_id:row.racecourse_id,date:row.date,timezone:FINLAND_TIMEZONE,first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:FINLAND_SOURCE_ID,official_url:row.source_url??FINLAND_CALENDAR_URL,checked_at:checkedAt,extraction_method:'official_suomen_hippos_current_calendar_html'},
    route_id:'suomen-hippos-current-calendar-html',confidence:'high',review_status:'needs_review',
    notes:`Official Suomen Hippos 2026 harness calendar observation for ${row.venue_name}. Published meeting clock ${row.published_meeting_time_local??'not published'} is retained as context only and is not promoted to first-race post time in this C-level adapter.`,
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,published_meeting_time_local:row.published_meeting_time_local},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:FINLAND_SOURCE_ID,route_id:'suomen-hippos-current-calendar-html',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e},
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
