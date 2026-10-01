import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {NETHERLANDS_AUTHORITY_ID,NETHERLANDS_SOURCE_ID,NETHERLANDS_SYSTEM_ID,NETHERLANDS_TIMEZONE,NETHERLANDS_UPCOMING_URL,buildNetherlandsMeetingRecord,parseNdrUpcomingHtml} from './netherlands-ndr-calendar-core.mjs';

function arg(n,f=null){const p='--'+n+'=';const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):f;}
function plusDays(date,count){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){const p=new Intl.DateTimeFormat('en-CA',{timeZone:NETHERLANDS_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const v=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return v.year+'-'+v.month+'-'+v.day;}
function write(file,value){const t=path.resolve(file);fs.mkdirSync(path.dirname(t),{recursive:true});fs.writeFileSync(t,JSON.stringify(value,null,2)+'\n');}
async function getHtml(url,{timeoutMs=20000}={}){
  try{
    const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5','accept-language':'nl-NL,nl;q=0.9,en;q=0.6'},signal:AbortSignal.timeout(timeoutMs)});
    if(!r.ok)throw new Error('HTTP '+r.status+' '+url);
    return {html:await r.text(),url:r.url||url};
  }catch(fetchError){
    try{
      const html=execFileSync('curl',['-L','--fail','--silent','--show-error','--max-time',String(Math.ceil(timeoutMs/1000)),'--user-agent','Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','--header','Accept-Language: nl-NL,nl;q=0.9,en;q=0.6',url],{encoding:'utf8',maxBuffer:8*1024*1024});
      if(!html.trim())throw new Error('curl returned empty body');
      return {html,url};
    }catch(curlError){
      throw new Error('fetch failed; curl fallback failed: '+String(curlError?.message??curlError)+'; fetch error: '+String(fetchError?.message??fetchError));
    }
  }
}
function ranks(records){return Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));}
function completions(records){return Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map(n=>[n,records.filter(r=>r.acquisition_completion?.disposition===n).length]));}

const output=arg('output'),days=Number(arg('days','30')),start=arg('as-of',localDate());
if(!output)throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start))throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>120)throw new Error('--days must be 1..120');

const end=plusDays(start,days),generatedAt=new Date().toISOString(),sourceErrors=[],parseFailures=[],unknownVenues=[];
let allRows=[],sourceUrl=NETHERLANDS_UPCOMING_URL;
try{
  const page=await getHtml(NETHERLANDS_UPCOMING_URL);sourceUrl=page.url||NETHERLANDS_UPCOMING_URL;
  try{
    const parsed=parseNdrUpcomingHtml(page.html,{sourceUrl});
    allRows=parsed.rows;
    unknownVenues.push(...parsed.unknown_venues);
  }catch(e){parseFailures.push({source_url:sourceUrl,error:String(e?.message??e)});}
}catch(e){sourceErrors.push({stage:'ndr_current_upcoming',source_url:NETHERLANDS_UPCOMING_URL,error:String(e?.message??e)});}

const rows=allRows.filter(r=>r.date>=start&&r.date<end),records=rows.map(r=>buildNetherlandsMeetingRecord(r,{checkedAt:generatedAt}));
const status=sourceErrors.length?'network_error':((parseFailures.length||unknownVenues.length)?'parse_error':'success');
const artifact={
  schema_version:'netherlands-ndr-official-window-candidates-v1',generated_at:generatedAt,country_id:'netherlands',
  authority_id:NETHERLANDS_AUTHORITY_ID,racing_system_id:NETHERLANDS_SYSTEM_ID,timezone:NETHERLANDS_TIMEZONE,source_id:NETHERLANDS_SOURCE_ID,
  collection_target_rank:'best_available',raw_body_retained:false,
  acquisition_attempt:{attempted_at:generatedAt,status,source_id:NETHERLANDS_SOURCE_ID,route_id:'ndr-current-upcoming',error_code:status==='network_error'?'ndr_upcoming_fetch_failed':(status==='parse_error'?'ndr_upcoming_parse_or_venue_failed':null)},
  discovery:{method:'official_ndr_current_upcoming_html',source_url:sourceUrl,source_visible_rows:allRows.length,rank_counts:ranks(records),completion_counts:completions(records)},
  window:{start_date:start,end_date_exclusive:end,days,coverage_claim:status==='success'?'official_source_visible_horizon':'acquisition_failed_preserve_verified_state',coverage_note:'Official NDR current upcoming list supplies source-visible meeting dates and venues across current Dutch draf/rensport scheduling. Permanent and temporary kortebaan venues remain separate physical venue identities. Race post times are not inferred. Source absence is not non-running evidence.'},
  records,
  diagnostics:{source_errors:sourceErrors,parse_failures:parseFailures,unknown_venues:unknownVenues,source_warnings:[]}
};
write(output,artifact);
console.log(JSON.stringify({output,start_date:start,end_date_exclusive:end,source_visible_rows:allRows.length,meetings_emitted:records.length,dates:records.map(r=>r.date),venues:[...new Set(records.map(r=>r.racecourse_id))],rank_counts:ranks(records),completion_counts:completions(records),source_errors:sourceErrors.length,parse_failures:parseFailures.length,unknown_venues:unknownVenues.length,raw_body_retained:false}));
