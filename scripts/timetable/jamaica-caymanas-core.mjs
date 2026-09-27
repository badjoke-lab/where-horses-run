import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const JAMAICA_TIMEZONE = 'America/Jamaica';
export const JAMAICA_AUTHORITY_ID = 'caymanas-park-svrel';
export const JAMAICA_SYSTEM_ID = 'jamaica-reviewed-system';
export const JAMAICA_SOURCE_ID = 'caymanas-entries';
export const JAMAICA_RACECOURSE_ID = 'jamaica--caymanas-park';
export const JAMAICA_ENTRIES_URL = 'https://www.caymanasracing.com/racing-information/entries';

const MONTHS = Object.freeze({
  january:1,february:2,march:3,april:4,may:5,june:6,
  july:7,august:8,september:9,october:10,november:11,december:12,
});
const WEEKDAYS='Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday';

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
function validDate(year,month,day){
  const d=new Date(Date.UTC(year,month-1,day));
  return d.getUTCFullYear()===year&&d.getUTCMonth()===month-1&&d.getUTCDate()===day;
}

export function parseCaymanasEntries(html,{sourceUrl=JAMAICA_ENTRIES_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('Caymanas Entries HTML must be non-empty');
  const text=visibleText(html);
  const heading=text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\s+Overnight\s+Programmes\b/i);
  if(!heading) throw new Error('Caymanas Entries monthly fingerprint missing');
  const month=MONTHS[heading[1].toLowerCase()];
  const year=Number(heading[2]);
  const tail=text.slice((heading.index??0)+heading[0].length);
  const stopMatch=tail.match(/\b(?:Racing Navigation|Race Results|About Us|Resources|Legal|Connect With Us)\b/i);
  const scoped=stopMatch?tail.slice(0,stopMatch.index):tail;
  const rx=new RegExp(`\\b(${WEEKDAYS})\\s+([0-3]?\\d)\\b`,'gi');
  const rows=[];
  for(const m of scoped.matchAll(rx)){
    const day=Number(m[2]);
    if(!validDate(year,month,day)) continue;
    rows.push({
      date:`${year}-${pad(month)}-${pad(day)}`,
      weekday:m[1],
      racecourse_id:JAMAICA_RACECOURSE_ID,
      venue_name:'Caymanas Park',
      source_url:sourceUrl,
    });
  }
  const unique=new Map();
  for(const row of rows) unique.set(row.date,row);
  const out=[...unique.values()].sort((a,b)=>a.date.localeCompare(b.date));
  if(out.length===0) throw new Error('Caymanas Entries monthly dates missing');
  return out;
}

function evidence(url,checkedAt){
  return {source_id:JAMAICA_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};
}
export function buildJamaicaMeetingRecord(row,{checkedAt}={}){
  const meetingId=`jamaica-caymanas-park-${row.date}`;
  const e=evidence(row.source_url??JAMAICA_ENTRIES_URL,checkedAt);
  const record={
    candidate_id:meetingId,
    meeting_id:meetingId,
    country_id:'jamaica',
    authority_id:JAMAICA_AUTHORITY_ID,
    racing_system_id:JAMAICA_SYSTEM_ID,
    racecourse_id:JAMAICA_RACECOURSE_ID,
    date:row.date,
    timezone:JAMAICA_TIMEZONE,
    first_race_time_local:null,
    last_race_time_local:null,
    timetable_rows:[],
    source:{
      source_id:JAMAICA_SOURCE_ID,
      official_url:row.source_url??JAMAICA_ENTRIES_URL,
      checked_at:checkedAt,
      extraction_method:'caymanas_entries_monthly_html',
    },
    route_id:'caymanas-entries-monthly-html',
    confidence:'high',
    review_status:'needs_review',
    notes:'Official Caymanas Park Entries page confirms source-visible race-day date and the single physical racecourse. Race-card fields, participants, betting, results and post times are not inferred by this rank-C route.',
    detail_observation:{
      status:'not_applicable',
      evaluated_capability_rank:'C',
      race_count:0,
      calendar_url:row.source_url??JAMAICA_ENTRIES_URL,
    },
    acquisition_attempt:{
      attempted_at:checkedAt,
      status:'success',
      source_id:JAMAICA_SOURCE_ID,
      route_id:'caymanas-entries-monthly-html',
      error_code:null,
    },
    evidence_support:{meeting_identity:e,meeting_date:e},
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion(
    {...record,capability_rank},
    {technical_capability_rank:'C'},
  );
  return {...record,capability_rank};
}
