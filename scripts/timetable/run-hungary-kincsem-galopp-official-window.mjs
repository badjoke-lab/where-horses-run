import fs from 'node:fs';import path from 'node:path';
import {HUNGARY_ANNUAL_CALENDAR_URL,HUNGARY_AUTHORITY_ID,HUNGARY_CALENDAR_INDEX_URL,HUNGARY_SOURCE_ID,HUNGARY_SYSTEM_ID,HUNGARY_TIMEZONE,buildHungaryGaloppMeetingRecord,extractPdfText,parseGaloppAnnualCalendarPdfText,parseGaloppCalendarPdfText,resolveLatestGaloppCalendar} from './hungary-kincsem-galopp-calendar-core.mjs';
function arg(n,f=null){const p='--'+n+'=';const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):f;}
function plusDays(date,count){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){const p=new Intl.DateTimeFormat('en-CA',{timeZone:HUNGARY_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const v=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return v.year+'-'+v.month+'-'+v.day;}
function write(file,value){const t=path.resolve(file);fs.mkdirSync(path.dirname(t),{recursive:true});fs.writeFileSync(t,JSON.stringify(value,null,2)+'\n');}
async function get(url,accept){const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':accept,'accept-language':'hu-HU,hu;q=0.9,en;q=0.6'},signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error('HTTP '+r.status+' '+url);return r;}
function ranks(records){return Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));}
function completions(records){return Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map(n=>[n,records.filter(r=>r.acquisition_completion?.disposition===n).length]));}

const output=arg('output'),days=Number(arg('days','62')),start=arg('as-of',localDate());
if(!output)throw new Error('--output=<path> is required');if(!/^\d{4}-\d{2}-\d{2}$/.test(start))throw new Error('--as-of must be YYYY-MM-DD');if(!Number.isInteger(days)||days<1||days>120)throw new Error('--days must be 1..120');
const end=plusDays(start,days),generatedAt=new Date().toISOString(),sourceErrors=[],parseFailures=[],sourceWarnings=[];
let allRows=[],calendarPdf=null,pdfPages=0,indexUrl=HUNGARY_CALENDAR_INDEX_URL;
try{
  const index=await get(HUNGARY_CALENDAR_INDEX_URL,'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5');indexUrl=index.url||HUNGARY_CALENDAR_INDEX_URL;
  const html=await index.text();
  calendarPdf=resolveLatestGaloppCalendar(html,{sourceUrl:indexUrl});
  const pdf=await get(calendarPdf.href,'application/pdf,*/*;q=0.5');
  const buf=await pdf.arrayBuffer();
  if(buf.byteLength<10000) throw new Error('Kincsem Galopp calendar PDF unexpectedly short');
  try{
    const extracted=await extractPdfText(new Uint8Array(buf));pdfPages=extracted.pages;
    allRows=parseGaloppCalendarPdfText(extracted.text,{sourceUrl:pdf.url||calendarPdf.href});
  }catch(e){
    sourceWarnings.push({stage:'latest_issue_parse',source_url:pdf.url||calendarPdf.href,error:String(e?.message??e),recovered_by:'annual_calendar_pdf'});
    try{
      const annual=await get(HUNGARY_ANNUAL_CALENDAR_URL,'application/pdf,*/*;q=0.5');
      const annualBuf=await annual.arrayBuffer();
      if(annualBuf.byteLength<10000) throw new Error('Kincsem annual Galopp calendar PDF unexpectedly short');
      const extracted=await extractPdfText(new Uint8Array(annualBuf));
      allRows=parseGaloppAnnualCalendarPdfText(extracted.text,{sourceUrl:annual.url||HUNGARY_ANNUAL_CALENDAR_URL});
      calendarPdf={issue:1,label:'Galopp Versenynaptár 2026 annual baseline',href:annual.url||HUNGARY_ANNUAL_CALENDAR_URL};
      pdfPages=extracted.pages;
    }catch(fallbackError){parseFailures.push({source_url:HUNGARY_ANNUAL_CALENDAR_URL,error:String(fallbackError?.message??fallbackError)});}
  }
}catch(e){sourceErrors.push({stage:'kincsem_galopp_calendar',source_url:HUNGARY_CALENDAR_INDEX_URL,error:String(e?.message??e)});}
const rows=allRows.filter(r=>r.date>=start&&r.date<end),records=rows.map(r=>buildHungaryGaloppMeetingRecord(r,{checkedAt:generatedAt}));
const artifact={schema_version:'hungary-kincsem-galopp-official-window-candidates-v1',generated_at:generatedAt,country_id:'hungary',authority_id:HUNGARY_AUTHORITY_ID,racing_system_id:HUNGARY_SYSTEM_ID,timezone:HUNGARY_TIMEZONE,source_id:HUNGARY_SOURCE_ID,collection_target_rank:'best_available',raw_body_retained:false,acquisition_attempt:{attempted_at:generatedAt,status:sourceErrors.length?'network_error':(parseFailures.length?'parse_error':'success'),source_id:HUNGARY_SOURCE_ID,route_id:'kincsem-galopp-calendar',error_code:sourceErrors.length?'kincsem_galopp_calendar_fetch_failed':(parseFailures.length?'kincsem_galopp_calendar_parse_failed':null)},discovery:{method:'official_latest_galopp_calendar_pdf',source_url:calendarPdf?.href??indexUrl,source_issue:calendarPdf?.issue??null,pdf_pages:pdfPages,source_visible_rows:allRows.length,rank_counts:ranks(records),completion_counts:completions(records)},window:{start_date:start,end_date_exclusive:end,days,coverage_claim:sourceErrors.length||parseFailures.length?'acquisition_failed_preserve_verified_state':'official_source_visible_horizon',coverage_note:'The latest official Kincsem Park Galopp calendar PDF supplies source-visible Thoroughbred meeting dates at Kincsem Park. This route does not cover Ügető harness or Agár greyhound racing. Absence is not non-running evidence.'},records,diagnostics:{source_errors:sourceErrors,parse_failures:parseFailures,unknown_venues:[],source_warnings:sourceWarnings}};
write(output,artifact);console.log(JSON.stringify({output,start_date:start,end_date_exclusive:end,source_issue:artifact.discovery.source_issue,pdf_pages:pdfPages,source_visible_rows:allRows.length,meetings_emitted:records.length,dates:records.map(r=>r.date),rank_counts:ranks(records),completion_counts:completions(records),source_errors:sourceErrors.length,parse_failures:parseFailures.length,raw_body_retained:false}));
