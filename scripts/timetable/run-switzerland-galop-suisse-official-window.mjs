import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {GALOP_SUISSE_AUTHORITY_ID,GALOP_SUISSE_SOURCE_ID,GALOP_SUISSE_SYSTEM_ID,GALOP_SUISSE_URL,IENA_HOME_URL,SWISS_TIMEZONE,buildGalopSuisseRecord,parseGalopSuisseHomepage,parseIenaGallopHomepage} from './switzerland-galop-suisse-calendar-core.mjs';

function arg(n,f=null){const p='--'+n+'=';const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):f;}
function plusDays(date,count){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){const p=new Intl.DateTimeFormat('en-CA',{timeZone:SWISS_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const v=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return v.year+'-'+v.month+'-'+v.day;}
function write(file,value){const t=path.resolve(file);fs.mkdirSync(path.dirname(t),{recursive:true});fs.writeFileSync(t,JSON.stringify(value,null,2)+'\n');}
async function getHtml(url,{timeoutMs=20000}={}){try{const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5','accept-language':'fr-CH,fr;q=0.9,de;q=0.7,en;q=0.5'},signal:AbortSignal.timeout(timeoutMs)});if(!r.ok)throw new Error('HTTP '+r.status+' '+url);return {html:await r.text(),url:r.url||url};}catch(fetchError){try{const html=execFileSync('curl',['-L','--fail','--silent','--show-error','--max-time',String(Math.ceil(timeoutMs/1000)),'--user-agent','Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','--header','Accept-Language: fr-CH,fr;q=0.9,de;q=0.7,en;q=0.5',url],{encoding:'utf8',maxBuffer:8*1024*1024});if(!html.trim())throw new Error('curl returned empty body');return {html,url};}catch(curlError){throw new Error('fetch failed; curl fallback failed: '+String(curlError?.message??curlError)+'; fetch error: '+String(fetchError?.message??fetchError));}}}
function ranks(records){return Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));}
function completions(records){return Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map(n=>[n,records.filter(r=>r.acquisition_completion?.disposition===n).length]));}

const output=arg('output'),days=Number(arg('days','30')),start=arg('as-of',localDate());
if(!output)throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start))throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>120)throw new Error('--days must be 1..120');

const end=plusDays(start,days),generatedAt=new Date().toISOString(),sourceErrors=[],parseFailures=[],sourceWarnings=[];
let allRows=[];
for(const source of [
  {url:GALOP_SUISSE_URL,kind:'galop_suisse',parse:parseGalopSuisseHomepage},
  {url:IENA_HOME_URL,kind:'iena_home',parse:parseIenaGallopHomepage}
]){
  try{
    const page=await getHtml(source.url);
    try{
      const rows=source.parse(page.html,{sourceUrl:page.url||source.url});
      allRows.push(...rows);
    }catch(e){parseFailures.push({stage:source.kind,source_url:page.url||source.url,error:String(e?.message??e)});}
  }catch(e){sourceErrors.push({stage:source.kind,source_url:source.url,error:String(e?.message??e)});}
}
allRows=[...new Map(allRows.map(r=>[r.date+'|'+r.racecourse_id,r])).values()].sort((a,b)=>a.date.localeCompare(b.date)||a.racecourse_id.localeCompare(b.racecourse_id));
const rows=allRows.filter(r=>r.date>=start&&r.date<end),records=rows.map(r=>buildGalopSuisseRecord(r,{checkedAt:generatedAt}));
const hardFailure=sourceErrors.length===2||parseFailures.length===2;
const status=hardFailure?(sourceErrors.length===2?'network_error':'parse_error'):'success';
if(status==='success'&&(sourceErrors.length||parseFailures.length)) sourceWarnings.push({code:'partial_official_route_recovered',message:'One official Swiss gallop page failed but the complementary official page remained available; preserve diagnostics and source-visible records.'});
const artifact={
  schema_version:'switzerland-galop-suisse-official-window-candidates-v1',generated_at:generatedAt,country_id:'switzerland',
  authority_id:GALOP_SUISSE_AUTHORITY_ID,racing_system_id:GALOP_SUISSE_SYSTEM_ID,timezone:SWISS_TIMEZONE,source_id:GALOP_SUISSE_SOURCE_ID,
  collection_target_rank:'best_available',raw_body_retained:false,
  acquisition_attempt:{attempted_at:generatedAt,status,source_id:GALOP_SUISSE_SOURCE_ID,route_id:'galop-suisse-calendar',error_code:status==='network_error'?'galop_suisse_fetch_failed':(status==='parse_error'?'galop_suisse_parse_failed':null)},
  discovery:{method:'official_galop_suisse_plus_iena_html',source_urls:[GALOP_SUISSE_URL,IENA_HOME_URL],source_visible_rows:allRows.length,rank_counts:ranks(records),completion_counts:completions(records)},
  window:{start_date:start,end_date_exclusive:end,days,coverage_claim:status==='success'?'official_source_visible_horizon':'acquisition_failed_preserve_verified_state',coverage_note:'Galop Suisse current meetings plus IENA current Avenches gallop events supply the source-visible Swiss gallop horizon. Event start context is not promoted to race post time. Absence is not non-running evidence.'},
  records,diagnostics:{source_errors:sourceErrors,parse_failures:parseFailures,unknown_venues:[],source_warnings:sourceWarnings}
};
write(output,artifact);
console.log(JSON.stringify({output,start_date:start,end_date_exclusive:end,source_visible_rows:allRows.length,meetings_emitted:records.length,dates:records.map(r=>r.date),venues:[...new Set(records.map(r=>r.racecourse_id))],rank_counts:ranks(records),completion_counts:completions(records),source_errors:sourceErrors.length,parse_failures:parseFailures.length,source_warnings:sourceWarnings.length,raw_body_retained:false}));
