import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {SERBIA_AUTHORITY_ID,SERBIA_CURRENT_SEASON_URL,SERBIA_SEASON_URL,SERBIA_SOURCE_ID,SERBIA_SYSTEM_ID,SERBIA_TIMEZONE,buildSerbiaMeetingRecord,parseBelgradeSeasonHtml} from './serbia-belgrade-calendar-core.mjs';

function arg(n,f=null){const p='--'+n+'=';const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):f;}
function plusDays(date,count){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){const p=new Intl.DateTimeFormat('en-CA',{timeZone:SERBIA_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const v=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return v.year+'-'+v.month+'-'+v.day;}
function write(file,value){const t=path.resolve(file);fs.mkdirSync(path.dirname(t),{recursive:true});fs.writeFileSync(t,JSON.stringify(value,null,2)+'\n');}
async function getHtml(url,{timeoutMs=20000}={}){try{const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5','accept-language':'en-US,en;q=0.9,sr;q=0.6'},signal:AbortSignal.timeout(timeoutMs)});if(!r.ok)throw new Error('HTTP '+r.status+' '+url);return {html:await r.text(),url:r.url||url};}catch(fetchError){try{const html=execFileSync('curl',['-L','--fail','--silent','--show-error','--max-time',String(Math.ceil(timeoutMs/1000)),'--user-agent','Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','--header','Accept-Language: en-US,en;q=0.9,sr;q=0.6',url],{encoding:'utf8',maxBuffer:8*1024*1024});if(!html.trim())throw new Error('curl returned empty body');return {html,url};}catch(curlError){throw new Error('fetch failed; curl fallback failed: '+String(curlError?.message??curlError)+'; fetch error: '+String(fetchError?.message??fetchError));}}}
function ranks(records){return Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));}
function completions(records){return Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map(n=>[n,records.filter(r=>r.acquisition_completion?.disposition===n).length]));}

const output=arg('output'),days=Number(arg('days','30')),start=arg('as-of',localDate());
if(!output)throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start))throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>120)throw new Error('--days must be 1..120');

const end=plusDays(start,days),generatedAt=new Date().toISOString(),sourceErrors=[],parseFailures=[],sourceWarnings=[];
let allRows=[],sourceUrl=SERBIA_CURRENT_SEASON_URL,sourceMode='current_season';

for(const candidate of [{url:SERBIA_CURRENT_SEASON_URL,mode:'current_season'},{url:SERBIA_SEASON_URL,mode:'season_2026_fallback'}]){
  if(allRows.length) break;
  try{
    const page=await getHtml(candidate.url);sourceUrl=page.url||candidate.url;sourceMode=candidate.mode;
    try{
      allRows=parseBelgradeSeasonHtml(page.html,{sourceUrl});
      if(candidate.mode!=='current_season') sourceWarnings.push({code:'used_season_2026_fallback',message:'Current-season page was unavailable or unparseable; used the official 2026 season page.'});
      sourceErrors.length=0;parseFailures.length=0;
    }catch(e){parseFailures.push({stage:candidate.mode,source_url:sourceUrl,error:String(e?.message??e)});}
  }catch(e){sourceErrors.push({stage:candidate.mode,source_url:candidate.url,error:String(e?.message??e)});}
}

const rows=allRows.filter(r=>r.date>=start&&r.date<end),records=rows.map(r=>buildSerbiaMeetingRecord(r,{checkedAt:generatedAt}));
const status=sourceErrors.length&&!allRows.length?'network_error':(parseFailures.length&&!allRows.length?'parse_error':'success');
const artifact={
  schema_version:'serbia-belgrade-official-window-candidates-v1',generated_at:generatedAt,country_id:'serbia',
  authority_id:SERBIA_AUTHORITY_ID,racing_system_id:SERBIA_SYSTEM_ID,timezone:SERBIA_TIMEZONE,source_id:SERBIA_SOURCE_ID,
  collection_target_rank:'best_available',raw_body_retained:false,
  acquisition_attempt:{attempted_at:generatedAt,status,source_id:SERBIA_SOURCE_ID,route_id:'belgrade-current-season',error_code:status==='network_error'?'belgrade_calendar_fetch_failed':(status==='parse_error'?'belgrade_calendar_parse_failed':null)},
  discovery:{method:sourceMode,source_url:sourceUrl,source_visible_rows:allRows.length,rank_counts:ranks(records),completion_counts:completions(records)},
  window:{start_date:start,end_date_exclusive:end,days,coverage_claim:status==='success'?'official_source_visible_horizon':'acquisition_failed_preserve_verified_state',coverage_note:'Official Belgrade Hippodrome current-season/2026 season pages supply source-visible meeting dates for Belgrade. This automatic route publishes rank C only. Wider Serbian coverage is not claimed and source absence is not non-running evidence.'},
  records,diagnostics:{source_errors:status==='success'?[]:sourceErrors,parse_failures:status==='success'?[]:parseFailures,unknown_venues:[],source_warnings:sourceWarnings}
};
write(output,artifact);
console.log(JSON.stringify({output,start_date:start,end_date_exclusive:end,source_mode:sourceMode,source_visible_rows:allRows.length,meetings_emitted:records.length,dates:records.map(r=>r.date),rank_counts:ranks(records),completion_counts:completions(records),source_errors:artifact.diagnostics.source_errors.length,parse_failures:artifact.diagnostics.parse_failures.length,source_warnings:sourceWarnings.length,raw_body_retained:false}));
