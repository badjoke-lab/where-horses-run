import fs from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  BRAZIL_SOROCABA_AUTHORITY_ID,BRAZIL_SOROCABA_CALENDAR_URL,BRAZIL_SOROCABA_SOURCE_ID,BRAZIL_SOROCABA_SYSTEM_ID,BRAZIL_SOROCABA_TIMEZONE,
  buildSorocabaMeetingRecord,parseSorocabaCalendarItems,
} from './brazil-sorocaba-core.mjs';

function arg(name,fallback=null){const p=`--${name}=`;const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):fallback;}
function plusDays(date,count){const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){const p=new Intl.DateTimeFormat('en-CA',{timeZone:BRAZIL_SOROCABA_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const v=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return `${v.year}-${v.month}-${v.day}`;}
function write(file,value){const t=path.resolve(file);fs.mkdirSync(path.dirname(t),{recursive:true});fs.writeFileSync(t,`${JSON.stringify(value,null,2)}\n`);}
async function fetchPdfItems(url){
  const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':'application/pdf,*/*;q=0.8','accept-language':'pt-BR,pt;q=0.9,en;q=0.6'},signal:AbortSignal.timeout(25000)});
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  const bytes=new Uint8Array(await r.arrayBuffer());
  if(bytes.length<4||String.fromCharCode(...bytes.slice(0,4))!=='%PDF') throw new Error('Sorocaba calendar response is not PDF');
  const pdf=await getDocument({data:bytes,disableWorker:true}).promise;
  const items=[];
  for(let n=1;n<=pdf.numPages;n++){
    const page=await pdf.getPage(n);const content=await page.getTextContent();
    for(const item of content.items.filter(i=>'str'in i)) items.push({str:item.str,x:item.transform?.[4],y:item.transform?.[5],page_number:n});
  }
  return items;
}
function rankCounts(records){return Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));}
function completionCounts(records){return Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map(name=>[name,records.filter(r=>r.acquisition_completion?.disposition===name).length]));}

const output=arg('output'),days=Number(arg('days','30')),start=arg('as-of',localDate());
if(!output) throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>62) throw new Error('--days must be 1..62');
const end=plusDays(start,days),generatedAt=new Date().toISOString();
const sourceErrors=[],parseFailures=[];let allRows=[];
try{
  const items=await fetchPdfItems(BRAZIL_SOROCABA_CALENDAR_URL);
  allRows=parseSorocabaCalendarItems(items,{year:Number(start.slice(0,4)),sourceUrl:BRAZIL_SOROCABA_CALENDAR_URL});
  if(!allRows.length) parseFailures.push({code:'no_calendar_dates_parsed',source_url:BRAZIL_SOROCABA_CALENDAR_URL});
}catch(error){sourceErrors.push({stage:'sorocaba_calendar_pdf',source_url:BRAZIL_SOROCABA_CALENDAR_URL,error:String(error?.message??error)});}
const rows=allRows.filter(r=>r.date>=start&&r.date<end);
const records=rows.map(r=>buildSorocabaMeetingRecord(r,{checkedAt:generatedAt}));
const artifact={
  schema_version:'brazil-sorocaba-official-window-candidates-v1',generated_at:generatedAt,country_id:'brazil',authority_id:BRAZIL_SOROCABA_AUTHORITY_ID,
  racing_system_id:BRAZIL_SOROCABA_SYSTEM_ID,timezone:BRAZIL_SOROCABA_TIMEZONE,source_id:BRAZIL_SOROCABA_SOURCE_ID,collection_target_rank:'best_available',raw_body_retained:false,
  acquisition_attempt:{attempted_at:generatedAt,status:sourceErrors.length?'network_error':(parseFailures.length?'parse_error':'success'),source_id:BRAZIL_SOROCABA_SOURCE_ID,route_id:'sorocaba-calendar-2026-pdf',error_code:sourceErrors.length?'calendar_pdf_fetch_failed':(parseFailures.length?'calendar_pdf_parse_failed':null)},
  discovery:{method:'official_annual_calendar_pdf',source_url:BRAZIL_SOROCABA_CALENDAR_URL,annual_rows:allRows.length,rank_counts:rankCounts(records),completion_counts:completionCounts(records)},
  window:{start_date:start,end_date_exclusive:end,days,coverage_claim:sourceErrors.length||parseFailures.length?'acquisition_failed_preserve_verified_state':'official_annual_calendar',coverage_note:'Official Jockey Club de Sorocaba annual calendar supplies the precise-date mother set for the current season. No first-race or per-race time is inferred. Acquisition or parser failure never proves non-running.'},
  records,diagnostics:{source_errors:sourceErrors,parse_failures:parseFailures,unknown_venues:[],source_warnings:[]},
};
write(output,artifact);
console.log(JSON.stringify({output,start_date:start,end_date_exclusive:end,annual_rows:allRows.length,meetings_emitted:records.length,dates:records.map(r=>r.date),rank_counts:rankCounts(records),completion_counts:completionCounts(records),source_errors:sourceErrors.length,parse_failures:parseFailures.length,raw_body_retained:false}));
