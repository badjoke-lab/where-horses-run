import fs from 'node:fs';
import path from 'node:path';
import {
  ESTONIA_AUTHORITY_ID,ESTONIA_SOURCE_ID,ESTONIA_SOURCE_URL,ESTONIA_SYSTEM_ID,ESTONIA_TIMEZONE,
  buildEstoniaMeetingRecord,parseEstonia2026CalendarApi
} from './estonia-tuula-calendar-core.mjs';

function arg(n,f=null){const p='--'+n+'=';const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):f;}
function plusDays(date,count){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){const p=new Intl.DateTimeFormat('en-CA',{timeZone:ESTONIA_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now),v=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return v.year+'-'+v.month+'-'+v.day;}
function write(file,value){const t=path.resolve(file);fs.mkdirSync(path.dirname(t),{recursive:true});fs.writeFileSync(t,JSON.stringify(value,null,2)+'\n');}
function ranks(records){return Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));}
function completions(records){return Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map(n=>[n,records.filter(r=>r.acquisition_completion?.disposition===n).length]));}

async function getJson(url,{timeoutMs=30000}={}){
  const r=await fetch(url,{redirect:'follow',headers:{
    'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
    'accept':'application/json,text/plain;q=0.9,*/*;q=0.5',
    'accept-language':'et-EE,et;q=0.9,en;q=0.7'
  },signal:AbortSignal.timeout(timeoutMs)});
  if(!r.ok) throw new Error('HTTP '+r.status+' '+url);
  return {json:await r.json(),url:r.url||url};
}

const output=arg('output'),days=Number(arg('days','30')),start=arg('as-of',localDate());
if(!output) throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>180) throw new Error('--days must be 1..180');
const end=plusDays(start,days),generatedAt=new Date().toISOString(),sourceErrors=[],parseFailures=[],sourceWarnings=[];
let rows=[],excluded=[],sourceUrl=ESTONIA_SOURCE_URL,pageModified=null;
try{
  const page=await getJson(ESTONIA_SOURCE_URL); sourceUrl=page.url||ESTONIA_SOURCE_URL;
  try{
    const parsed=parseEstonia2026CalendarApi(page.json);
    rows=parsed.rows; excluded=parsed.explicit_no_racing_rows; pageModified=parsed.page_modified;
  }catch(e){
    parseFailures.push({stage:'calendar_parse',source_url:sourceUrl,error:String(e?.message??e)});
  }
}catch(e){
  sourceErrors.push({stage:'calendar_fetch',source_url:ESTONIA_SOURCE_URL,error:String(e?.message??e)});
}
const status=sourceErrors.length?'network_error':(parseFailures.length?'parse_error':'success');
const visible=rows.filter(r=>r.date>=start&&r.date<end);
const records=status==='success'?visible.map(r=>buildEstoniaMeetingRecord(r,{checkedAt:generatedAt})):[];
const artifact={
  schema_version:'estonia-tuula-official-window-candidates-v1',generated_at:generatedAt,country_id:'estonia',
  authority_id:ESTONIA_AUTHORITY_ID,racing_system_id:ESTONIA_SYSTEM_ID,timezone:ESTONIA_TIMEZONE,source_id:ESTONIA_SOURCE_ID,
  collection_target_rank:'best_available',raw_body_retained:false,
  acquisition_attempt:{attempted_at:generatedAt,status,source_id:ESTONIA_SOURCE_ID,route_id:'hipodroom-2026-calendar-official-window',error_code:status==='network_error'?'estonia_calendar_fetch_failed':(status==='parse_error'?'estonia_calendar_parse_failed':null)},
  discovery:{method:'official_hipodroom_2026_wp_page',source_url:sourceUrl,source_visible_rows:rows.length+excluded.length,positive_rows:rows.length,explicit_no_racing_rows:excluded,page_modified:pageModified,window_visible_rows:visible.length,rank_counts:ranks(records),completion_counts:completions(records)},
  window:{start_date:start,end_date_exclusive:end,days,coverage_claim:status==='success'?'official_2026_calendar_window':'acquisition_failed_preserve_verified_state',coverage_note:'Automatic route emits source-visible 2026 positive trotting dates at fixed Tuula Hipodroom. The explicit 26 July source row stating traavivõistluseid ei toimu is excluded from positive candidates. Source absence, fetch failure or parser failure is not cancellation/non-running evidence.'},
  records,
  diagnostics:{source_errors:sourceErrors,parse_failures:parseFailures,unknown_venues:[],source_warnings:sourceWarnings,explicit_no_racing_rows:excluded}
};
write(output,artifact);
console.log(JSON.stringify({output,start_date:start,end_date_exclusive:end,source_visible_rows:rows.length+excluded.length,positive_rows:rows.length,explicit_no_racing_rows:excluded.map(r=>r.date),window_rows:visible.length,meetings_emitted:records.length,dates:records.map(r=>r.date),rank_counts:ranks(records),completion_counts:completions(records),source_errors:sourceErrors.length,parse_failures:parseFailures.length,raw_body_retained:false}));
