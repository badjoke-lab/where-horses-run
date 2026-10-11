import fs from 'node:fs';
import path from 'node:path';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  CANADA_AUTHORITY_ID,CANADA_SOURCE_ID,CANADA_SOURCE_URL,CANADA_SYSTEM_ID,CANADA_TIMEZONE,
  buildCanadaMohawkMeetingRecord,parseAgcoMohawkCalendarItems
} from './canada-mohawk-agco-calendar-core.mjs';

function arg(n,f=null){const p='--'+n+'=';const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):f;}
function plusDays(date,count){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){const p=new Intl.DateTimeFormat('en-CA',{timeZone:CANADA_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now),v=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return v.year+'-'+v.month+'-'+v.day;}
function write(file,value){const t=path.resolve(file);fs.mkdirSync(path.dirname(t),{recursive:true});fs.writeFileSync(t,JSON.stringify(value,null,2)+'\n');}
function ranks(records){return Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));}
function completions(records){return Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map(n=>[n,records.filter(r=>r.acquisition_completion?.disposition===n).length]));}

async function getPdfItems(url,{timeoutMs=45000}={}){
  const r=await fetch(url,{
    redirect:'follow',
    headers:{
      'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
      'accept':'application/pdf,*/*;q=0.5',
      'accept-language':'en-CA,en;q=0.9'
    },
    signal:AbortSignal.timeout(timeoutMs)
  });
  if(!r.ok) throw new Error('HTTP '+r.status+' '+url);
  const bytes=new Uint8Array(await r.arrayBuffer());
  if(bytes.length<10000) throw new Error('AGCO PDF body unexpectedly small: '+bytes.length);
  const pdf=await getDocument({data:bytes,disableWorker:true}).promise;
  if(pdf.numPages!==1) throw new Error('AGCO Mohawk calendar expected 1 page, got '+pdf.numPages);
  const page=await pdf.getPage(1);
  const content=await page.getTextContent();
  const items=content.items.map(it=>({
    text:String(it.str??'').trim(),
    x:Number(it.transform?.[4]??0),
    y:Number(it.transform?.[5]??0),
    width:Number(it.width??0),
    height:Number(it.height??0)
  })).filter(x=>x.text);
  return {items,url:r.url||url,bytes:bytes.length};
}

const output=arg('output'),days=Number(arg('days','90')),start=arg('as-of',localDate());
if(!output) throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>120) throw new Error('--days must be 1..120');

const end=plusDays(start,days),generatedAt=new Date().toISOString(),sourceErrors=[],parseFailures=[],sourceWarnings=[];
let allRows=[],sourceUrl=CANADA_SOURCE_URL,pdfBytes=0;
try{
  const pdf=await getPdfItems(CANADA_SOURCE_URL); sourceUrl=pdf.url||CANADA_SOURCE_URL; pdfBytes=pdf.bytes;
  try{allRows=parseAgcoMohawkCalendarItems(pdf.items,{sourceUrl});}
  catch(e){parseFailures.push({stage:'agco_mohawk_calendar_parse',source_url:sourceUrl,error:String(e?.message??e)});}
}catch(e){
  sourceErrors.push({stage:'agco_mohawk_calendar_fetch',source_url:CANADA_SOURCE_URL,error:String(e?.message??e)});
}
const status=sourceErrors.length?'network_error':(parseFailures.length?'parse_error':'success');
const visible=allRows.filter(r=>r.date>=start&&r.date<end);
const records=status==='success'?visible.map(r=>buildCanadaMohawkMeetingRecord(r,{checkedAt:generatedAt})):[];
const artifact={
  schema_version:'canada-mohawk-agco-official-window-candidates-v1',
  generated_at:generatedAt,country_id:'canada',
  authority_id:CANADA_AUTHORITY_ID,racing_system_id:CANADA_SYSTEM_ID,timezone:CANADA_TIMEZONE,source_id:CANADA_SOURCE_ID,
  collection_target_rank:'best_available',raw_body_retained:false,
  acquisition_attempt:{
    attempted_at:generatedAt,status,source_id:CANADA_SOURCE_ID,route_id:'agco-mohawk-approved-2026-calendar',
    error_code:status==='network_error'?'agco_mohawk_calendar_fetch_failed':(status==='parse_error'?'agco_mohawk_calendar_parse_failed':null)
  },
  discovery:{
    method:'agco_approved_2026_calendar_pdf_geometry',
    source_url:sourceUrl,
    source_visible_rows:allRows.length,
    window_visible_rows:visible.length,
    pdf_bytes:pdfBytes,
    rank_counts:ranks(records),
    completion_counts:completions(records)
  },
  window:{
    start_date:start,end_date_exclusive:end,days,
    coverage_claim:status==='success'?'approved_2026_mohawk_calendar_window':'acquisition_failed_preserve_verified_state',
    coverage_note:'Automatic route emits only AGCO-approved 2026 Woodbine Mohawk Park race dates. Scope is one Ontario Standardbred venue and does not establish countrywide Canadian coverage. General post-time guidance is not promoted to meeting-specific times. Source absence, fetch failure or parser failure is not cancellation/non-running evidence.'
  },
  records,
  diagnostics:{source_errors:sourceErrors,parse_failures:parseFailures,unknown_venues:[],source_warnings:sourceWarnings}
};
write(output,artifact);
console.log(JSON.stringify({
  output,start_date:start,end_date_exclusive:end,
  source_visible_rows:allRows.length,window_rows:visible.length,meetings_emitted:records.length,
  dates:records.map(r=>r.date),rank_counts:ranks(records),completion_counts:completions(records),
  source_errors:sourceErrors.length,parse_failures:parseFailures.length,pdf_bytes:pdfBytes,raw_body_retained:false
}));
