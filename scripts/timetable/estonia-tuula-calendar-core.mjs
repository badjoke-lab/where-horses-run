import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const ESTONIA_TIMEZONE='Europe/Tallinn';
export const ESTONIA_AUTHORITY_ID='estonian-trotting-union';
export const ESTONIA_SYSTEM_ID='tuula-trotting-system';
export const ESTONIA_SOURCE_ID='hipodroom-2026-calendar-context';
export const ESTONIA_SOURCE_URL='https://hipodroom.ee/wp-json/wp/v2/pages?slug=2026-aasta-urituste-kalender';
export const ESTONIA_CALENDAR_PAGE_URL='https://hipodroom.ee/2026-aasta-urituste-kalender/';
export const ESTONIA_RACECOURSE_ID='estonia--tuula-hipodroom';

function decodeHtml(v){
  return String(v??'')
    .replace(/&nbsp;|&#160;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/&auml;/gi,'ä')
    .replace(/&otilde;/gi,'õ')
    .replace(/&ouml;/gi,'ö')
    .replace(/&uuml;/gi,'ü')
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

function isoFromDmy(value){
  const m=String(value).match(/^(\d{2})\.(\d{2})\.(2026)$/);
  if(!m) return null;
  return m[3]+'-'+m[2]+'-'+m[1];
}

export function parseEstonia2026CalendarApi(payload,{sourceUrl=ESTONIA_CALENDAR_PAGE_URL}={}){
  const pages=typeof payload==='string'?JSON.parse(payload):payload;
  if(!Array.isArray(pages)||pages.length!==1) throw new Error('Hipodroom 2026 calendar page payload must contain exactly one page');
  const page=pages[0];
  const title=visibleText(page?.title?.rendered??'');
  if(!/2026\. aasta ürituste kalender/i.test(title)) throw new Error('Hipodroom 2026 calendar title fingerprint missing');
  const html=String(page?.content?.rendered??'');
  if(!html.trim()) throw new Error('Hipodroom 2026 calendar content missing');

  const positive=[];
  const explicitNoRacing=[];
  const headings=[...html.matchAll(/<h4\b[^>]*>([\s\S]*?)<\/h4>/gi)];
  for(const h of headings){
    const text=visibleText(h[1]);
    const dm=text.match(/\b(\d{2}\.\d{2}\.2026)\b/);
    if(!dm) continue;
    const date=isoFromDmy(dm[1]);
    if(!date) continue;
    const eventTitle=text.slice(0,dm.index).replace(/\s+/g,' ').trim();
    const row={
      date,
      title:eventTitle,
      racecourse_id:ESTONIA_RACECOURSE_ID,
      venue_name:'Tuula Hipodroom',
      source_url:sourceUrl
    };
    if(/traavivõistluseid\s+ei\s+toimu/i.test(eventTitle)){
      explicitNoRacing.push({...row,disposition:'explicit_no_trotting_races'});
      continue;
    }
    positive.push(row);
  }

  const rows=[...new Map(positive.map(r=>[r.date,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
  const excluded=[...new Map(explicitNoRacing.map(r=>[r.date,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
  if(rows.length<15) throw new Error('Hipodroom 2026 calendar parsed fewer than 15 positive trotting meetings');
  if(!excluded.some(r=>r.date==='2026-07-26')) throw new Error('Hipodroom explicit 2026-07-26 no-trotting row missing');
  return {rows,explicit_no_racing_rows:excluded,page_modified:page?.modified??null};
}

function evidence(url,checkedAt){
  return {source_id:ESTONIA_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};
}

export function buildEstoniaMeetingRecord(row,{checkedAt}={}){
  const meetingId='estonia-tuula-'+row.date;
  const e=evidence(row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'estonia',
    authority_id:ESTONIA_AUTHORITY_ID,racing_system_id:ESTONIA_SYSTEM_ID,
    racecourse_id:ESTONIA_RACECOURSE_ID,date:row.date,timezone:ESTONIA_TIMEZONE,
    racing_type:'harness-racing',
    first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:ESTONIA_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'official_hipodroom_2026_wp_page'},
    route_id:'hipodroom-2026-calendar-official-window',confidence:'high',review_status:'needs_review',
    notes:'Official Hipodroom 2026 event calendar confirms the meeting date for the reviewed Tuula Hipodroom system. Automatic publication remains rank C. A source row explicitly stating traavivõistluseid ei toimu is excluded from positive candidates; absence alone is never treated as non-running evidence.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url,event_title:row.title},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:ESTONIA_SOURCE_ID,route_id:'hipodroom-2026-calendar-official-window',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e}
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
