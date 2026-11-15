import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const DENMARK_TIMEZONE='Europe/Copenhagen';
export const DENMARK_AUTHORITY_ID='klampenborg-galopbane';
export const DENMARK_SYSTEM_ID='denmark-klampenborg-system';
export const DENMARK_SOURCE_ID='klampenborg-calendar';
export const DENMARK_CALENDAR_URL='https://galopbane.dk/loebskalender';
export const DENMARK_RACECOURSE_ID='denmark--klampenborg-galopbane';

const MONTHS=Object.freeze({januar:1,februar:2,marts:3,april:4,maj:5,juni:6,juli:7,august:8,september:9,oktober:10,november:11,december:12});
function decodeHtml(v){return String(v??'').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#x([0-9a-f]+);/gi,(_,c)=>String.fromCodePoint(Number.parseInt(c,16))).replace(/&#(\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));}
export function visibleText(html){return decodeHtml(String(html??'')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
function pad(v){return String(v).padStart(2,'0');}
export function parseKlampenborgCalendar(html,{sourceUrl=DENMARK_CALENDAR_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('Klampenborg calendar HTML must be non-empty');
  const text=visibleText(html);
  // The official /loebskalender URL now redirects to the 2027 ticket calendar.
  // Do not require the historical "Løbskalender 2026" heading, and do not
  // treat promotional/expiry dates as race meetings.
  const season=text.match(/Løbskalender\s+(20\d{2})\b/i)?.[1]
    ??text.match(/løbskalender\s+for\s+(20\d{2})\b/i)?.[1]
    ??text.match(/Vi\s+ses\s+i\s+(20\d{2})\b/i)?.[1];
  if(!/Løbskalender/i.test(text)||!season) throw new Error('Klampenborg racing-calendar season fingerprint missing');
  const rows=[];
  // Only calendar entries with explicit Danish date AND event start time qualify.
  // Time is retained as source_event_time, NEVER promoted to first-race post time.
  const rx=/\b([0-3]?\d)\.\s*(januar|februar|marts|april|maj|juni|juli|august|september|oktober|november|december)\s+(20\d{2})\s*(?:-\s*)?([0-2]?\d)[:.]([0-5]\d)\b/gi;
  for(const m of text.matchAll(rx)){
    if(m[3]!==season) continue;
    const prefix=text.slice(Math.max(0,m.index-55),m.index);
    if(/(?:gælder\s+t\.?o\.?m\.?|valid\s+until|udløber)\s+(?:den\s+)?$/i.test(prefix)) continue;
    const date=m[3]+'-'+pad(MONTHS[m[2].toLowerCase()])+'-'+pad(m[1]);
    if(Number(m[4])>23||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date) continue;
    const source_event_time=pad(m[4])+':'+m[5];
    rows.push({date,source_event_time,racecourse_id:DENMARK_RACECOURSE_ID,venue_name:'Klampenborg Galopbane',source_url:sourceUrl});
  }
  const out=[...new Map(rows.map(r=>[r.date,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
  if(!out.length) throw new Error('Klampenborg source-visible race dates missing');
  return out;
}
function evidence(url,checkedAt){return {source_id:DENMARK_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};}
export function buildDenmarkMeetingRecord(row,{checkedAt}={}){
  const meetingId='denmark-klampenborg-'+row.date;
  const e=evidence(row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'denmark',
    authority_id:DENMARK_AUTHORITY_ID,racing_system_id:DENMARK_SYSTEM_ID,
    racecourse_id:DENMARK_RACECOURSE_ID,date:row.date,timezone:DENMARK_TIMEZONE,
    first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:DENMARK_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'klampenborg_official_calendar_html'},
    route_id:'klampenborg-official-calendar',confidence:'high',review_status:'needs_review',
    notes:'Official Klampenborg Galopbane calendar confirms source-visible race-day date and physical venue. Displayed event time is intentionally not treated as first-race or per-race post time.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:DENMARK_SOURCE_ID,route_id:'klampenborg-official-calendar',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e},
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
