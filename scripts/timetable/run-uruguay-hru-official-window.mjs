import fs from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  URUGUAY_AUTHORITY_ID,URUGUAY_SOURCE_ID,URUGUAY_SYSTEM_ID,URUGUAY_TIMEZONE,
  buildUruguayMeetingRecord,calendarPageUrl,discoverUruguayMonthlyPdf,parseUruguayMonthlyCalendarItems,
} from './uruguay-hru-calendar-core.mjs';

function arg(name,fallback=null){const p='--'+name+'=';const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):fallback;}
function plusDays(date,count){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){const p=new Intl.DateTimeFormat('en-CA',{timeZone:URUGUAY_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const v=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return v.year+'-'+v.month+'-'+v.day;}
function write(file,value){const t=path.resolve(file);fs.mkdirSync(path.dirname(t),{recursive:true});fs.writeFileSync(t,JSON.stringify(value,null,2)+'\n');}
function monthsInWindow(start,endExclusive){
  const out=[];let y=Number(start.slice(0,4)),m=Number(start.slice(5,7));const endY=Number(endExclusive.slice(0,4)),endM=Number(endExclusive.slice(5,7));
  while(y<endY||(y===endY&&m<=endM)){
    out.push({year:y,month:m});m++;if(m===13){m=1;y++;}
    if(out.length>4) break;
  }
  return out;
}
async function fetchText(url){
  const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5','accept-language':'es-UY,es;q=0.9,en;q=0.6'},signal:AbortSignal.timeout(25000)});
  if(!r.ok) throw new Error('HTTP '+r.status);return {text:await r.text(),finalUrl:r.url};
}
async function fetchPdfPageOne(url){
  const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':'application/pdf,*/*;q=0.8','accept-language':'es-UY,es;q=0.9,en;q=0.6'},signal:AbortSignal.timeout(25000)});
  if(!r.ok) throw new Error('HTTP '+r.status);
  const bytes=new Uint8Array(await r.arrayBuffer());
  if(bytes.length<4||String.fromCharCode(...bytes.slice(0,4))!=='%PDF') throw new Error('HRU monthly calendar response is not PDF');
  const pdf=await getDocument({data:bytes,disableWorker:true}).promise;
  const page=await pdf.getPage(1);const content=await page.getTextContent();
  return content.items.filter(i=>'str' in i).map(i=>({str:i.str,x:i.transform?.[4],y:i.transform?.[5]}));
}
function rankCounts(records){return Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));}
function completionCounts(records){return Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map(name=>[name,records.filter(r=>r.acquisition_completion?.disposition===name).length]));}

const output=arg('output'),days=Number(arg('days','30')),start=arg('as-of',localDate());
if(!output) throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>62) throw new Error('--days must be 1..62');
const end=plusDays(start,days),generatedAt=new Date().toISOString();
const sourceErrors=[],parseFailures=[],sourceWarnings=[],monthResults=[];let allRows=[];
for(const target of monthsInWindow(start,end)){
  const pageUrl=calendarPageUrl(target.year,target.month);
  try{
    const page=await fetchText(pageUrl);
    const pdfUrl=discoverUruguayMonthlyPdf(page.text,{pageUrl:page.finalUrl||pageUrl});
    if(!pdfUrl){
      sourceWarnings.push({code:'monthly_pdf_not_published',year:target.year,month:target.month,source_url:pageUrl});
      monthResults.push({year:target.year,month:target.month,status:'not_published',calendar_page_url:pageUrl,pdf_url:null,rows:0});
      continue;
    }
    try{
      const items=await fetchPdfPageOne(pdfUrl);
      const parsed=parseUruguayMonthlyCalendarItems(items,{year:target.year,month:target.month,sourceUrl:pdfUrl});
      allRows.push(...parsed.records);
      parseFailures.push(...parsed.parse_failures.map(x=>({...x,year:target.year,month:target.month,source_url:pdfUrl})));
      monthResults.push({year:target.year,month:target.month,status:parsed.parse_failures.length?'partial':'available',calendar_page_url:pageUrl,pdf_url:pdfUrl,rows:parsed.records.length});
    }catch(error){
      sourceErrors.push({stage:'monthly_calendar_pdf',year:target.year,month:target.month,source_url:pdfUrl,error:String(error?.message??error)});
      monthResults.push({year:target.year,month:target.month,status:'source_error',calendar_page_url:pageUrl,pdf_url:pdfUrl,rows:0});
    }
  }catch(error){
    sourceErrors.push({stage:'calendar_page',year:target.year,month:target.month,source_url:pageUrl,error:String(error?.message??error)});
    monthResults.push({year:target.year,month:target.month,status:'source_error',calendar_page_url:pageUrl,pdf_url:null,rows:0});
  }
}
allRows=[...new Map(allRows.map(r=>[r.date+'|'+r.racecourse_id,r])).values()].sort((a,b)=>a.date.localeCompare(b.date)||a.racecourse_id.localeCompare(b.racecourse_id));
const rows=allRows.filter(r=>r.date>=start&&r.date<end);
const records=rows.map(r=>buildUruguayMeetingRecord(r,{checkedAt:generatedAt}));
const artifact={
  schema_version:'uruguay-hru-official-window-candidates-v1',generated_at:generatedAt,country_id:'uruguay',authority_id:URUGUAY_AUTHORITY_ID,
  racing_system_id:URUGUAY_SYSTEM_ID,timezone:URUGUAY_TIMEZONE,source_id:URUGUAY_SOURCE_ID,collection_target_rank:'best_available',raw_body_retained:false,
  acquisition_attempt:{attempted_at:generatedAt,status:sourceErrors.length?'network_error':(parseFailures.length?'parse_error':'success'),source_id:URUGUAY_SOURCE_ID,route_id:'hru-monthly-calendar-pdf',error_code:sourceErrors.length?'calendar_source_failed':(parseFailures.length?'calendar_pdf_parse_failed':null)},
  discovery:{method:'official_monthly_calendar_pdf_local_venue_grid',months:monthResults,source_visible_rows:allRows.length,rank_counts:rankCounts(records),completion_counts:completionCounts(records)},
  window:{start_date:start,end_date_exclusive:end,days,coverage_claim:sourceErrors.length||parseFailures.length?'acquisition_failed_preserve_verified_state':'official_source_visible_monthly_calendar',coverage_note:'Official HRU/Maroñas monthly calendar PDF supplies the precise-date mother set for Maroñas and Las Piedras only. Overseas simulcast entries are excluded by exact local-venue allowlist. Missing future monthly PDFs are unpublished-horizon warnings, not non-running evidence.'},
  records,diagnostics:{source_errors:sourceErrors,parse_failures:parseFailures,unknown_venues:[],source_warnings:sourceWarnings},
};
write(output,artifact);
console.log(JSON.stringify({output,start_date:start,end_date_exclusive:end,source_visible_rows:allRows.length,meetings_emitted:records.length,meetings:records.map(r=>({date:r.date,racecourse_id:r.racecourse_id})),rank_counts:rankCounts(records),completion_counts:completionCounts(records),source_errors:sourceErrors.length,parse_failures:parseFailures.length,source_warnings:sourceWarnings.length,months:monthResults,raw_body_retained:false}));
