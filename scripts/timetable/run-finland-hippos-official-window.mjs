import fs from 'node:fs';
import path from 'node:path';
import {
  FINLAND_AUTHORITY_ID,
  FINLAND_CALENDAR_URL,
  FINLAND_SOURCE_ID,
  FINLAND_SYSTEM_ID,
  FINLAND_TIMEZONE,
  buildFinlandMeetingRecord,
  parseFinlandCalendarHtml,
} from './finland-hippos-core.mjs';

function arg(name,fallback=null){const p=`--${name}=`;const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):fallback;}
function plusDays(date,count){const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:FINLAND_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const v=Object.fromEntries(parts.filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));return `${v.year}-${v.month}-${v.day}`;}
function inWindow(date,start,end){return date>=start&&date<end;}
function write(file,value){const target=path.resolve(file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,`${JSON.stringify(value,null,2)}\n`);}
async function getHtml(url){
  const response=await fetch(url,{redirect:'follow',headers:{
    'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
    'accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
    'accept-language':'fi-FI,fi;q=0.9,en;q=0.6',
  },signal:AbortSignal.timeout(25000)});
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  return {html:await response.text(),url:response.url||url};
}

const output=arg('output');const days=Number(arg('days','30'));const start=arg('as-of',localDate());
if(!output)throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start))throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>62)throw new Error('--days must be 1..62');
const end=plusDays(start,days);const generatedAt=new Date().toISOString();
const sourceErrors=[];let allRows=[];let cancelled=[];let unknownVenues=[];let parseFailures=[];let status='success';let finalUrl=FINLAND_CALENDAR_URL;
try{
  const fetched=await getHtml(FINLAND_CALENDAR_URL);finalUrl=fetched.url;
  const parsed=parseFinlandCalendarHtml(fetched.html,{sourceUrl:fetched.url});
  allRows=parsed.records;cancelled=parsed.cancelled;unknownVenues=parsed.unknown_venues;parseFailures=parsed.parse_failures;
}catch(error){status='source_error';sourceErrors.push({stage:'calendar_html',source_url:FINLAND_CALENDAR_URL,error:String(error?.message??error)});}
const records=allRows.filter(row=>inWindow(row.date,start,end)).map(row=>buildFinlandMeetingRecord(row,{checkedAt:generatedAt}));
const rankCounts=Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));
const completionCounts=Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map(name=>[name,records.filter(r=>r.acquisition_completion?.disposition===name).length]));
const artifact={
  schema_version:'finland-hippos-official-window-candidates-v1',generated_at:generatedAt,country_id:'finland',authority_id:FINLAND_AUTHORITY_ID,racing_system_id:FINLAND_SYSTEM_ID,timezone:FINLAND_TIMEZONE,
  source_id:FINLAND_SOURCE_ID,collection_target_rank:'best_available',raw_body_retained:false,
  acquisition_attempt:{attempted_at:generatedAt,status:status==='success'?'success':'network_error',source_id:FINLAND_SOURCE_ID,route_id:'suomen-hippos-current-calendar-html',error_code:status==='success'?null:'calendar_fetch_failed'},
  discovery:{method:'official_suomen_hippos_current_2026_calendar_html',source_url:finalUrl,annual_rows:allRows.length,cancelled_rows_visible:cancelled.length,rank_counts:rankCounts,completion_counts:completionCounts},
  window:{start_date:start,end_date_exclusive:end,days,coverage_claim:status==='success'?'official_current_calendar_positive_meetings':'acquisition_failed_preserve_verified_state',coverage_note:'The official Suomen Hippos current-year calendar supplies meeting date and physical racecourse. PERUTTU rows are excluded from positive observations and handed to the separate negative-evidence lane; omission or fetch failure never proves non-running. Published meeting clock is not promoted to first-race time in this C-level adapter.'},
  records,
  diagnostics:{source_errors:sourceErrors,parse_failures:parseFailures,unknown_venues:unknownVenues,cancelled_visible:cancelled},
};
write(output,artifact);
console.log(JSON.stringify({output,start_date:start,end_date_exclusive:end,annual_rows:allRows.length,meetings_emitted:records.length,rank_counts:rankCounts,completion_counts:completionCounts,cancelled_visible:cancelled.filter(x=>inWindow(x.date,start,end)).length,source_errors:sourceErrors.length,parse_failures:parseFailures.length,unknown_venues:unknownVenues.length,raw_body_retained:false}));
