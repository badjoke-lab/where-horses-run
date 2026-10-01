import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {MALAYSIA_AUTHORITY_ID,MALAYSIA_FIXTURE_URL,MALAYSIA_SOURCE_ID,MALAYSIA_SYSTEM_ID,MALAYSIA_TIMEZONE,buildMalaysiaMeetingRecord,parseMraFixturePage} from './malaysia-mra-calendar-core.mjs';

function arg(n,f=null){const p='--'+n+'=';const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):f;}
function plusDays(date,count){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){const p=new Intl.DateTimeFormat('en-CA',{timeZone:MALAYSIA_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const v=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return v.year+'-'+v.month+'-'+v.day;}
function write(file,value){const t=path.resolve(file);fs.mkdirSync(path.dirname(t),{recursive:true});fs.writeFileSync(t,JSON.stringify(value,null,2)+'\n');}
async function fetchBytes(url,{timeoutMs=45000}={}){
  try{
    const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':'application/pdf,*/*;q=0.8'},signal:AbortSignal.timeout(timeoutMs)});
    if(!r.ok) throw new Error('HTTP '+r.status+' '+(r.url||url));
    return {bytes:new Uint8Array(await r.arrayBuffer()),url:r.url||url,mode:'fetch'};
  }catch(fetchError){
    try{
      const buf=execFileSync('curl',['-L','--fail','--silent','--show-error','--max-time',String(Math.ceil(timeoutMs/1000)),'--user-agent','Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','--header','Accept: application/pdf,*/*;q=0.8',url],{maxBuffer:12*1024*1024});
      if(!buf?.length) throw new Error('curl returned empty body');
      return {bytes:new Uint8Array(buf),url,mode:'curl'};
    }catch(curlError){throw new Error('fetch failed; curl fallback failed: '+String(curlError?.message??curlError)+'; fetch error: '+String(fetchError?.message??fetchError));}
  }
}
function ranks(records){return Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));}
function completions(records){return Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map(n=>[n,records.filter(r=>r.acquisition_completion?.disposition===n).length]));}

const output=arg('output'),days=Number(arg('days','30')),start=arg('as-of',localDate());
if(!output)throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start))throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>120)throw new Error('--days must be 1..120');

const end=plusDays(start,days),generatedAt=new Date().toISOString(),sourceErrors=[],parseFailures=[];
let allRows=[],sourceUrl=MALAYSIA_FIXTURE_URL,fetchMode=null,totals=null;
try{
  const file=await fetchBytes(MALAYSIA_FIXTURE_URL);sourceUrl=file.url;fetchMode=file.mode;
  const pdf=await getDocument({data:file.bytes,disableWorker:true}).promise;
  if(pdf.numPages!==1) throw new Error('unexpected MRA PDF pages: '+pdf.numPages);
  try{
    const parsed=await parseMraFixturePage(await pdf.getPage(1),{year:2026});
    totals=parsed.totals;
    if(totals.selangor!==61||totals.perak!==29||totals.total!==90) throw new Error('MRA fixture totals mismatch: '+JSON.stringify(totals));
    allRows=parsed.fixtures;
  }catch(e){parseFailures.push({stage:'mra_fixture_pdf',source_url:sourceUrl,error:String(e?.message??e)});}
}catch(e){sourceErrors.push({stage:'mra_fixture_pdf',source_url:MALAYSIA_FIXTURE_URL,error:String(e?.message??e)});}

const rows=allRows.filter(r=>r.date>=start&&r.date<end),records=rows.map(r=>buildMalaysiaMeetingRecord(r,{checkedAt:generatedAt}));
const status=sourceErrors.length?'network_error':(parseFailures.length?'parse_error':'success');
const artifact={
  schema_version:'malaysia-mra-official-window-candidates-v1',generated_at:generatedAt,country_id:'malaysia',
  authority_id:MALAYSIA_AUTHORITY_ID,racing_system_id:MALAYSIA_SYSTEM_ID,timezone:MALAYSIA_TIMEZONE,source_id:MALAYSIA_SOURCE_ID,
  collection_target_rank:'best_available',raw_body_retained:false,
  acquisition_attempt:{attempted_at:generatedAt,status,source_id:MALAYSIA_SOURCE_ID,route_id:'mra-fixtures',error_code:status==='network_error'?'mra_fixture_fetch_failed':(status==='parse_error'?'mra_fixture_parse_failed':null)},
  discovery:{method:'official_mra_2026_fixture_pdf_color_cells',source_url:sourceUrl,fetch_mode:fetchMode,source_visible_rows:allRows.length,fixture_totals:totals,rank_counts:ranks(records),completion_counts:completions(records)},
  window:{start_date:start,end_date_exclusive:end,days,coverage_claim:status==='success'?'official_source_visible_horizon':'acquisition_failed_preserve_verified_state',coverage_note:'Official MRA 2026 fixture PDF covers Selangor Turf Club and Perak Turf Club nationwide. Yellow cells map to Selangor and green cells map to Perak. Race post times are not inferred. Source absence is not non-running evidence.'},
  records,diagnostics:{source_errors:sourceErrors,parse_failures:parseFailures,unknown_venues:[],source_warnings:[]}
};
write(output,artifact);
console.log(JSON.stringify({output,start_date:start,end_date_exclusive:end,source_visible_rows:allRows.length,fixture_totals:totals,meetings_emitted:records.length,dates:records.map(r=>[r.date,r.racecourse_id]),rank_counts:ranks(records),completion_counts:completions(records),source_errors:sourceErrors.length,parse_failures:parseFailures.length,raw_body_retained:false}));
