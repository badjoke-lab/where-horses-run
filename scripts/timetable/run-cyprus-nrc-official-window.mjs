import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {CYPRUS_AUTHORITY_ID,CYPRUS_SCHEDULE_URL,CYPRUS_SOURCE_ID,CYPRUS_SYSTEM_ID,CYPRUS_TIMEZONE,buildCyprusMeetingRecord,parseNrcSchedulePage,parseNrcSchedulePdfText} from './cyprus-nrc-calendar-core.mjs';

function arg(n,f=null){const p='--'+n+'=';const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):f;}
function plusDays(date,count){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){const p=new Intl.DateTimeFormat('en-CA',{timeZone:CYPRUS_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const v=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return v.year+'-'+v.month+'-'+v.day;}
function write(file,value){const t=path.resolve(file);fs.mkdirSync(path.dirname(t),{recursive:true});fs.writeFileSync(t,JSON.stringify(value,null,2)+'\n');}
function ranks(records){return Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));}
function completions(records){return Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map(n=>[n,records.filter(r=>r.acquisition_completion?.disposition===n).length]));}

async function getHtml(url,{timeoutMs=20000}={}){
  try{
    const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5','accept-language':'en-US,en;q=0.9,el;q=0.7'},signal:AbortSignal.timeout(timeoutMs)});
    if(!r.ok) throw new Error('HTTP '+r.status+' '+url);
    return {html:await r.text(),url:r.url||url};
  }catch(fetchError){
    try{
      const html=execFileSync('curl',['-L','--fail','--silent','--show-error','--max-time',String(Math.ceil(timeoutMs/1000)),'--user-agent','Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','--header','Accept-Language: en-US,en;q=0.9,el;q=0.7',url],{encoding:'utf8',maxBuffer:8*1024*1024});
      if(!html.trim()) throw new Error('curl returned empty body');
      return {html,url};
    }catch(curlError){throw new Error('fetch failed; curl fallback failed: '+String(curlError?.message??curlError)+'; fetch error: '+String(fetchError?.message??fetchError));}
  }
}

async function getBuffer(url,{timeoutMs=20000}={}){
  try{
    const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':'application/pdf,*/*;q=0.5'},signal:AbortSignal.timeout(timeoutMs)});
    if(!r.ok) throw new Error('HTTP '+r.status+' '+url);
    const buf=Buffer.from(await r.arrayBuffer());
    if(!buf.length) throw new Error('empty PDF '+url);
    return {buffer:buf,url:r.url||url};
  }catch(fetchError){
    try{
      const buf=execFileSync('curl',['-L','--fail','--silent','--show-error','--max-time',String(Math.ceil(timeoutMs/1000)),'--user-agent','Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',url],{encoding:null,maxBuffer:8*1024*1024});
      if(!buf?.length) throw new Error('curl returned empty PDF');
      return {buffer:buf,url};
    }catch(curlError){throw new Error('fetch failed; curl fallback failed: '+String(curlError?.message??curlError)+'; fetch error: '+String(fetchError?.message??fetchError));}
  }
}

async function pdfText(buffer){
  const doc=await getDocument({data:new Uint8Array(buffer),disableWorker:true}).promise;
  const pages=[];
  for(let i=1;i<=doc.numPages;i+=1){
    const page=await doc.getPage(i);
    const content=await page.getTextContent();
    pages.push(content.items.map(x=>x.str??'').join(' '));
  }
  return pages.join('\n');
}

function monthsForWindow(start,days){
  const set=new Set();
  for(let i=0;i<days;i+=1){
    const d=new Date(start+'T00:00:00Z');
    d.setUTCDate(d.getUTCDate()+i);
    set.add(d.getUTCMonth()+1);
  }
  return [...set];
}

const output=arg('output'),days=Number(arg('days','30')),start=arg('as-of',localDate());
if(!output) throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>120) throw new Error('--days must be 1..120');

const end=plusDays(start,days),generatedAt=new Date().toISOString(),sourceErrors=[],parseFailures=[],sourceWarnings=[];
let allRows=[],scheduleUrl=CYPRUS_SCHEDULE_URL,links=[];

try{
  const page=await getHtml(CYPRUS_SCHEDULE_URL);
  scheduleUrl=page.url||CYPRUS_SCHEDULE_URL;
  try{links=parseNrcSchedulePage(page.html,{sourceUrl:scheduleUrl});}
  catch(e){parseFailures.push({stage:'schedule_page',source_url:scheduleUrl,error:String(e?.message??e)});}
}catch(e){sourceErrors.push({stage:'schedule_page',source_url:CYPRUS_SCHEDULE_URL,error:String(e?.message??e)});}

if(links.length){
  const byMonth=new Map(links.map(x=>[x.month,x]));
  for(const month of monthsForWindow(start,days)){
    const link=byMonth.get(month);
    if(!link){parseFailures.push({stage:'monthly_link',month,error:'official monthly schedule link missing'});continue;}
    try{
      const pdf=await getBuffer(link.url);
      try{
        const text=await pdfText(pdf.buffer);
        allRows.push(...parseNrcSchedulePdfText(text,{sourceUrl:pdf.url||link.url}));
      }catch(e){parseFailures.push({stage:'monthly_pdf_parse',month,source_url:link.url,error:String(e?.message??e)});}
    }catch(e){sourceErrors.push({stage:'monthly_pdf_fetch',month,source_url:link.url,error:String(e?.message??e)});}
  }
}

allRows=[...new Map(allRows.map(r=>[r.date,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
const status=sourceErrors.length?'network_error':(parseFailures.length?'parse_error':'success');
const inWindow=allRows.filter(r=>r.date>=start&&r.date<end);
const records=status==='success'?inWindow.map(r=>buildCyprusMeetingRecord(r,{checkedAt:generatedAt})):[];
const artifact={
  schema_version:'cyprus-nrc-official-window-candidates-v1',generated_at:generatedAt,country_id:'cyprus',
  authority_id:CYPRUS_AUTHORITY_ID,racing_system_id:CYPRUS_SYSTEM_ID,timezone:CYPRUS_TIMEZONE,source_id:CYPRUS_SOURCE_ID,
  collection_target_rank:'best_available',raw_body_retained:false,
  acquisition_attempt:{attempted_at:generatedAt,status,source_id:CYPRUS_SOURCE_ID,route_id:'nrc-meetings-schedule',error_code:status==='network_error'?'nrc_schedule_fetch_failed':(status==='parse_error'?'nrc_schedule_parse_failed':null)},
  discovery:{method:'official_nrc_schedule_page_and_monthly_pdfs',source_url:scheduleUrl,source_visible_rows:allRows.length,source_documents:links.filter(x=>monthsForWindow(start,days).includes(x.month)).map(x=>x.url),rank_counts:ranks(records),completion_counts:completions(records)},
  window:{start_date:start,end_date_exclusive:end,days,coverage_claim:status==='success'?'official_source_visible_horizon':'acquisition_failed_preserve_verified_state',coverage_note:'Nicosia Race Club is the sole authorised Cyprus organiser and states that all races are held at Nicosia Racecourse. The automatic route publishes official monthly-PDF meeting dates plus that physical venue at rank C. Performance Start Time is not interpreted as race post time; source absence is not non-running evidence.'},
  records,diagnostics:{source_errors:sourceErrors,parse_failures:parseFailures,unknown_venues:[],source_warnings:sourceWarnings}
};
write(output,artifact);
console.log(JSON.stringify({output,start_date:start,end_date_exclusive:end,source_visible_rows:allRows.length,meetings_emitted:records.length,dates:records.map(r=>r.date),rank_counts:ranks(records),completion_counts:completions(records),source_errors:sourceErrors.length,parse_failures:parseFailures.length,raw_body_retained:false}));
