import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {BELGIUM_AUTHORITY_ID,BELGIUM_SOURCE_ID,BELGIUM_SOURCE_URL,BELGIUM_SYSTEM_ID,BELGIUM_TIMEZONE,buildBelgiumMeetingRecord,parseBelgiumTrottingPage} from './belgium-trotting-calendar-core.mjs';

function arg(n,f=null){const p='--'+n+'=';const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):f;}
function plusDays(date,count){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){const p=new Intl.DateTimeFormat('en-CA',{timeZone:BELGIUM_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const v=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return v.year+'-'+v.month+'-'+v.day;}
function write(file,value){const t=path.resolve(file);fs.mkdirSync(path.dirname(t),{recursive:true});fs.writeFileSync(t,JSON.stringify(value,null,2)+'\n');}
function ranks(records){return Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));}
function completions(records){return Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map(n=>[n,records.filter(r=>r.acquisition_completion?.disposition===n).length]));}

async function getHtml(url,{timeoutMs=25000}={}){
  try{
    const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5','accept-language':'nl-BE,nl;q=0.9,fr-BE;q=0.8,en;q=0.7'},signal:AbortSignal.timeout(timeoutMs)});
    if(!r.ok) throw new Error('HTTP '+r.status+' '+url);
    return {html:await r.text(),url:r.url||url};
  }catch(fetchError){
    try{
      const html=execFileSync('curl',['-L','--fail','--silent','--show-error','--max-time',String(Math.ceil(timeoutMs/1000)),'--user-agent','Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','--header','Accept-Language: nl-BE,nl;q=0.9,fr-BE;q=0.8,en;q=0.7',url],{encoding:'utf8',maxBuffer:12*1024*1024});
      if(!html.trim()) throw new Error('curl returned empty body');
      return {html,url};
    }catch(curlError){throw new Error('fetch failed; curl fallback failed: '+String(curlError?.message??curlError)+'; fetch error: '+String(fetchError?.message??fetchError));}
  }
}

const output=arg('output'),days=Number(arg('days','30')),start=arg('as-of',localDate());
if(!output) throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>120) throw new Error('--days must be 1..120');

const end=plusDays(start,days),generatedAt=new Date().toISOString(),sourceErrors=[],parseFailures=[],sourceWarnings=[];
let sourceUrl=BELGIUM_SOURCE_URL,allRows=[];
try{
  const page=await getHtml(BELGIUM_SOURCE_URL);
  sourceUrl=page.url||BELGIUM_SOURCE_URL;
  try{allRows=parseBelgiumTrottingPage(page.html,{sourceUrl});}
  catch(e){parseFailures.push({stage:'programme_parse',source_url:sourceUrl,error:String(e?.message??e)});}
}catch(e){sourceErrors.push({stage:'programme_fetch',source_url:BELGIUM_SOURCE_URL,error:String(e?.message??e)});}

const status=sourceErrors.length?'network_error':(parseFailures.length?'parse_error':'success');
const inWindow=allRows.filter(r=>r.date>=start&&r.date<end);
const records=status==='success'?inWindow.map(r=>buildBelgiumMeetingRecord(r,{checkedAt:generatedAt})):[];
const artifact={
  schema_version:'belgium-trotting-official-window-candidates-v1',generated_at:generatedAt,country_id:'belgium',
  authority_id:BELGIUM_AUTHORITY_ID,racing_system_id:BELGIUM_SYSTEM_ID,timezone:BELGIUM_TIMEZONE,source_id:BELGIUM_SOURCE_ID,
  collection_target_rank:'best_available',raw_body_retained:false,
  acquisition_attempt:{attempted_at:generatedAt,status,source_id:BELGIUM_SOURCE_ID,route_id:'belgium-trotting-public-races',error_code:status==='network_error'?'belgium_trotting_fetch_failed':(status==='parse_error'?'belgium_trotting_parse_failed':null)},
  discovery:{method:'official_belgian_federation_trotting_programme',source_url:sourceUrl,source_visible_rows:allRows.length,rank_counts:ranks(records),completion_counts:completions(records)},
  window:{start_date:start,end_date_exclusive:end,days,coverage_claim:status==='success'?'official_source_visible_horizon':'acquisition_failed_preserve_verified_state',coverage_note:'Automatic production route covers the current federation trotting programme only and publishes date plus mapped physical venue at C. It does not claim all Belgian flat/harness automation and does not downgrade separate reviewed countrywide A-capability evidence. Source absence is not non-running evidence.'},
  records,diagnostics:{source_errors:sourceErrors,parse_failures:parseFailures,unknown_venues:[],source_warnings:sourceWarnings}
};
write(output,artifact);
console.log(JSON.stringify({output,start_date:start,end_date_exclusive:end,source_visible_rows:allRows.length,meetings_emitted:records.length,meetings:records.map(r=>({date:r.date,racecourse_id:r.racecourse_id})),rank_counts:ranks(records),completion_counts:completions(records),source_errors:sourceErrors.length,parse_failures:parseFailures.length,raw_body_retained:false}));
