import fs from 'node:fs';
import path from 'node:path';
import {
  SLOVENIA_AUTHORITY_ID,SLOVENIA_SOURCE_ID,SLOVENIA_SOURCE_URL,SLOVENIA_SYSTEM_ID,SLOVENIA_TIMEZONE,
  buildSloveniaMeetingRecord,parseSloveniaCalendarPage,resolveSloveniaVenue
} from './slovenia-trotting-calendar-core.mjs';

function arg(n,f=null){const p='--'+n+'=';const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):f;}
function plusDays(date,count){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){const p=new Intl.DateTimeFormat('en-CA',{timeZone:SLOVENIA_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now),v=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return v.year+'-'+v.month+'-'+v.day;}
function write(file,value){const t=path.resolve(file);fs.mkdirSync(path.dirname(t),{recursive:true});fs.writeFileSync(t,JSON.stringify(value,null,2)+'\n');}
function ranks(records){return Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));}
async function getHtml(url,{timeoutMs=30000}={}){
  const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5','accept-language':'sl,en;q=0.8'},signal:AbortSignal.timeout(timeoutMs)});
  if(!r.ok) throw new Error('HTTP '+r.status+' '+url);
  return {html:await r.text(),url:r.url||url};
}

const output=arg('output'),days=Number(arg('days','90')),start=arg('as-of',localDate());
if(!output) throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>120) throw new Error('--days must be 1..120');
const end=plusDays(start,days),generatedAt=new Date().toISOString(),sourceErrors=[],parseFailures=[],sourceWarnings=[],unknownVenues=[];
let sourceUrl=SLOVENIA_SOURCE_URL,allRows=[];
try{
  const page=await getHtml(SLOVENIA_SOURCE_URL);sourceUrl=page.url||SLOVENIA_SOURCE_URL;
  try{allRows=parseSloveniaCalendarPage(page.html,{sourceUrl});}
  catch(e){parseFailures.push({stage:'calendar_parse',source_url:sourceUrl,error:String(e?.message??e)});}
}catch(e){sourceErrors.push({stage:'calendar_fetch',source_url:SLOVENIA_SOURCE_URL,error:String(e?.message??e)});}
const status=sourceErrors.length?'network_error':(parseFailures.length?'parse_error':'success');
const visible=status==='success'?allRows.filter(r=>r.date>=start&&r.date<end):[];
const mapped=[];
for(const row of visible){
  const venue=resolveSloveniaVenue(row);
  if(!venue){unknownVenues.push({date:row.date,organizer:row.organizer});continue;}
  mapped.push(row);
}
const records=status==='success'?mapped.map(r=>buildSloveniaMeetingRecord(r,{checkedAt:generatedAt})):[];
const artifact={
  schema_version:'slovenia-trotting-official-window-candidates-v1',generated_at:generatedAt,country_id:'slovenia',
  authority_id:SLOVENIA_AUTHORITY_ID,racing_system_id:SLOVENIA_SYSTEM_ID,timezone:SLOVENIA_TIMEZONE,source_id:SLOVENIA_SOURCE_ID,
  collection_target_rank:'best_available',raw_body_retained:false,
  acquisition_attempt:{attempted_at:generatedAt,status,source_id:SLOVENIA_SOURCE_ID,route_id:'slovenian-trotting-calendar-official-window',error_code:status==='network_error'?'slovenia_calendar_fetch_failed':(status==='parse_error'?'slovenia_calendar_parse_failed':null)},
  discovery:{method:'official_kzs_2026_calendar',source_url:sourceUrl,source_visible_rows:allRows.length,window_visible_rows:visible.length,mapped_window_rows:mapped.length,rank_counts:ranks(records)},
  window:{start_date:start,end_date_exclusive:end,days,coverage_claim:status==='success'?'official_2026_calendar_window':'acquisition_failed_preserve_verified_state',coverage_note:'Automatic route emits source-visible current-window meetings only when the federation organizer has an independently verified physical racecourse mapping. Unknown future organizers are rejected rather than conflated with clubs. Source absence is not non-running evidence.'},
  records,
  diagnostics:{source_errors:sourceErrors,parse_failures:parseFailures,unknown_venues:unknownVenues,source_warnings:sourceWarnings}
};
write(output,artifact);
console.log(JSON.stringify({output,start_date:start,end_date_exclusive:end,source_visible_rows:allRows.length,window_rows:visible.length,mapped_rows:mapped.length,meetings_emitted:records.length,dates:records.map(r=>r.date),racecourses:records.map(r=>r.racecourse_id),rank_counts:ranks(records),source_errors:sourceErrors.length,parse_failures:parseFailures.length,unknown_venues:unknownVenues,raw_body_retained:false}));
