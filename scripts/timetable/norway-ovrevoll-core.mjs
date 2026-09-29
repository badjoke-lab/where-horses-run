import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const NORWAY_TIMEZONE='Europe/Oslo';
export const NORWAY_OVREVOLL_AUTHORITY_ID='ovrevoll';
export const NORWAY_OVREVOLL_SYSTEM_ID='norway-ovrevoll-gallop-system';
export const NORWAY_OVREVOLL_SOURCE_ID='ovrevoll-fixtures';
export const NORWAY_OVREVOLL_RACECOURSE_ID='norway--ovrevoll';
export const NORWAY_OVREVOLL_FIXTURES_URL='https://ovrevoll.travsport.no/Galoppbanen/Terminliste-fixtures/';

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
function pad(v){return String(v).padStart(2,'0');}

export function parseOvrevollFixturesHtml(html,{sourceUrl=NORWAY_OVREVOLL_FIXTURES_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('Øvrevoll fixtures HTML must be non-empty');
  const text=visibleText(html);
  if(!/Terminliste\s*\(fixtures\)\s*Øvrevoll\s*Galoppbane\s*2026/i.test(text)) throw new Error('Øvrevoll 2026 fixtures fingerprint missing');
  const scoped=text.split(/Terminliste Øvrevoll 2026/i).slice(-1)[0]||text;
  const rx=/(\d{1,2})\s+(\d{1,2})\.(\d{2})\.(2026)|\b(\d{1,2})\.(\d{2})\.(2026)\b/g;
  const rows=[];
  for(const m of scoped.matchAll(rx)){
    const day=Number(m[2]??m[5]), month=Number(m[3]??m[6]), year=Number(m[4]??m[7]);
    if(!day||!month||year!==2026) continue;
    const start=(m.index??0)+m[0].length;
    const tail=scoped.slice(start,start+180);
    const time=(tail.match(/\b([01]?\d|2[0-3])[.:](\d{2})\b/)||[]);
    const comment=tail
      .replace(/^\s*(Mandag|Tirsdag|Onsdag|Torsdag|Fredag|Lørdag|Søndag)\b/i,'')
      .replace(/^\s*([01]?\d|2[0-3])[.:]\d{2}\b/,'')
      .split(/\b\d{1,2}\s+\d{1,2}\.\d{2}\.2026\b|\b\d{1,2}\.\d{2}\.2026\b/)[0]
      .replace(/\s+/g,' ').trim();
    rows.push({
      date:`${year}-${pad(month)}-${pad(day)}`,
      racecourse_id:NORWAY_OVREVOLL_RACECOURSE_ID,
      venue_label:'Øvrevoll',
      published_meeting_time_local:time.length?`${pad(time[1])}:${time[2]}`:null,
      comment:comment||null,
      source_url:sourceUrl,
    });
  }
  const unique=new Map(rows.map(r=>[r.date,r]));
  const out=[...unique.values()].sort((a,b)=>a.date.localeCompare(b.date));
  if(out.length<20) throw new Error(`Øvrevoll fixture row count unexpectedly low: ${out.length}`);
  return out;
}
function evidence(url,checkedAt){return{source_id:NORWAY_OVREVOLL_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};}
export function buildOvrevollMeetingRecord(row,{checkedAt}={}){
  const meetingId=`norway-ovrevoll-${row.date}`;
  const e=evidence(row.source_url??NORWAY_OVREVOLL_FIXTURES_URL,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'norway',
    authority_id:NORWAY_OVREVOLL_AUTHORITY_ID,racing_system_id:NORWAY_OVREVOLL_SYSTEM_ID,
    racecourse_id:NORWAY_OVREVOLL_RACECOURSE_ID,date:row.date,timezone:NORWAY_TIMEZONE,
    first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:NORWAY_OVREVOLL_SOURCE_ID,official_url:row.source_url??NORWAY_OVREVOLL_FIXTURES_URL,checked_at:checkedAt,extraction_method:'ovrevoll_2026_fixture_html'},
    route_id:'ovrevoll-2026-fixture-html',confidence:'high',review_status:'needs_review',
    notes:`Official Øvrevoll 2026 fixture observation. Published event start ${row.published_meeting_time_local??'unknown'} is retained as context only and is not promoted to first-race time.`,
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:NORWAY_OVREVOLL_FIXTURES_URL,published_meeting_time_local:row.published_meeting_time_local,comment:row.comment},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:NORWAY_OVREVOLL_SOURCE_ID,route_id:'ovrevoll-2026-fixture-html',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e},
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
