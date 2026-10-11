import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const THAILAND_TIMEZONE='Asia/Bangkok';
export const THAILAND_AUTHORITY_ID='rbsc';
export const THAILAND_SYSTEM_ID='thailand-rbsc-system';
export const THAILAND_SOURCE_ID='rbsc-racing-calendar';
export const THAILAND_SOURCE_URL='https://www.rbsc.org/racing/';
export const THAILAND_RACECOURSE_ID='thailand--royal-bangkok-sports-club-racecourse';

const MONTHS=Object.freeze({
  january:'01',february:'02',march:'03',april:'04',may:'05',june:'06',
  july:'07',august:'08',september:'09',october:'10',november:'11',december:'12'
});

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
const pad=v=>String(Number(v)).padStart(2,'0');

export function parseRbscRacingCalendarPage(html,{sourceUrl=THAILAND_SOURCE_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('RBSC racing HTML must be non-empty');
  const text=visibleText(html);
  const start=text.search(/RACING\s+CALENDAR\s+2026/i);
  if(start<0) throw new Error('RBSC 2026 racing-calendar fingerprint missing');
  const tail=text.slice(start);
  const end=tail.search(/\sENTRANCE\s+FEE/i);
  if(end<0) throw new Error('RBSC racing-calendar end boundary missing');
  const block=tail.slice(0,end);

  const rows=[];
  const rx=/(\d{1,2}(?:\s*(?:&|,)\s*\d{1,2})*)\s+(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\b/gi;
  for(const m of block.matchAll(rx)){
    const month=MONTHS[m[2].toLowerCase()];
    const days=[...m[1].matchAll(/\d{1,2}/g)].map(x=>Number(x[0]));
    for(const day of days){
      if(day<1||day>31) continue;
      rows.push({
        date:'2026-'+month+'-'+pad(day),
        racecourse_id:THAILAND_RACECOURSE_ID,
        venue_name:'The Royal Bangkok Sports Club Racecourse',
        source_url:sourceUrl
      });
    }
  }
  const out=[...new Map(rows.map(r=>[r.date,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
  if(out.length<24) throw new Error('RBSC 2026 racing calendar parsed fewer than 24 meetings');
  return out;
}

function evidence(url,checkedAt){
  return {source_id:THAILAND_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};
}

export function buildThailandMeetingRecord(row,{checkedAt}={}){
  const meetingId='thailand-rbsc-'+row.date;
  const e=evidence(row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'thailand',
    authority_id:THAILAND_AUTHORITY_ID,racing_system_id:THAILAND_SYSTEM_ID,
    racecourse_id:THAILAND_RACECOURSE_ID,date:row.date,timezone:THAILAND_TIMEZONE,
    racing_type:'thoroughbred-flat',
    first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:THAILAND_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'official_rbsc_racing_calendar_2026'},
    route_id:'rbsc-racing-calendar-official-window',confidence:'high',review_status:'needs_review',
    notes:'The official RBSC Racing page confirms the 2026 meeting date at the fixed Royal Bangkok Sports Club racecourse. General racing-hours guidance is not interpreted as meeting-specific first/last post time; automatic publication remains rank C.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:THAILAND_SOURCE_ID,route_id:'rbsc-racing-calendar-official-window',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e}
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
