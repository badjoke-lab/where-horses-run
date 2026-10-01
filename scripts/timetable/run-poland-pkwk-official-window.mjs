import fs from 'node:fs';import path from 'node:path';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {POLAND_AUTHORITY_ID,POLAND_SOURCE_ID,POLAND_SYSTEM_ID,POLAND_TIMEZONE,PKWK_INFO_URL,SOPOT_2026_URL,WARSAW_PDF_URL,buildPolandMeetingRecord,parseSopot2026Html,parseWarsawPlanPages,parseWroclawInfoHtml} from './poland-pkwk-calendar-core.mjs';

function arg(n,f=null){const p='--'+n+'=';const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):f;}
function plusDays(date,count){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){const p=new Intl.DateTimeFormat('en-CA',{timeZone:POLAND_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const v=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return v.year+'-'+v.month+'-'+v.day;}
function write(file,value){const t=path.resolve(file);fs.mkdirSync(path.dirname(t),{recursive:true});fs.writeFileSync(t,JSON.stringify(value,null,2)+'\n');}
async function get(url,accept,timeoutMs=30000){
  const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':accept,'accept-language':'pl-PL,pl;q=0.9,en;q=0.5'},signal:AbortSignal.timeout(timeoutMs)});
  if(!r.ok) throw new Error('HTTP '+r.status+' '+(r.url||url));
  return r;
}
async function pdfPages(url){
  const r=await get(url,'application/pdf,*/*;q=0.8');
  const bytes=new Uint8Array(await r.arrayBuffer());
  const pdf=await getDocument({data:bytes,disableWorker:true}).promise;
  const pages=[];
  for(let i=1;i<=pdf.numPages;i++){
    const page=await pdf.getPage(i);
    const tc=await page.getTextContent();
    pages.push({page:i,text:tc.items.map(x=>x.str).join(' ').replace(/\s+/g,' ').trim()});
  }
  return {pages,url:r.url||url};
}
async function html(url){const r=await get(url,'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',22000);return {html:await r.text(),url:r.url||url};}
function ranks(records){return Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));}
function completions(records){return Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map(n=>[n,records.filter(r=>r.acquisition_completion?.disposition===n).length]));}

const output=arg('output'),days=Number(arg('days','30')),start=arg('as-of',localDate());
if(!output)throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start))throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>120)throw new Error('--days must be 1..120');
const end=plusDays(start,days),generatedAt=new Date().toISOString(),sourceErrors=[],parseFailures=[];
let allRows=[];

try{
  const w=await pdfPages(WARSAW_PDF_URL);
  try{allRows.push(...parseWarsawPlanPages(w.pages,{sourceUrl:w.url}));}
  catch(e){parseFailures.push({stage:'warsaw_pdf',source_url:w.url,error:String(e?.message??e)});}
}catch(e){sourceErrors.push({stage:'warsaw_pdf',source_url:WARSAW_PDF_URL,error:String(e?.message??e)});}

try{
  const w=await html(PKWK_INFO_URL);
  try{allRows.push(...parseWroclawInfoHtml(w.html,{sourceUrl:w.url}));}
  catch(e){parseFailures.push({stage:'wroclaw_info',source_url:w.url,error:String(e?.message??e)});}
}catch(e){sourceErrors.push({stage:'wroclaw_info',source_url:PKWK_INFO_URL,error:String(e?.message??e)});}

try{
  const s=await html(SOPOT_2026_URL);
  try{allRows.push(...parseSopot2026Html(s.html,{sourceUrl:s.url}));}
  catch(e){parseFailures.push({stage:'sopot_2026',source_url:s.url,error:String(e?.message??e)});}
}catch(e){sourceErrors.push({stage:'sopot_2026',source_url:SOPOT_2026_URL,error:String(e?.message??e)});}

allRows=[...new Map(allRows.map(r=>[r.date+'|'+r.racecourse_id,r])).values()].sort((a,b)=>a.date.localeCompare(b.date)||a.racecourse_id.localeCompare(b.racecourse_id));
const rows=allRows.filter(r=>r.date>=start&&r.date<end),records=rows.map(r=>buildPolandMeetingRecord(r,{checkedAt:generatedAt}));
const status=sourceErrors.length?'network_error':(parseFailures.length?'parse_error':'success');
const artifact={
 schema_version:'poland-pkwk-official-window-candidates-v1',generated_at:generatedAt,country_id:'poland',
 authority_id:POLAND_AUTHORITY_ID,racing_system_id:POLAND_SYSTEM_ID,timezone:POLAND_TIMEZONE,source_id:POLAND_SOURCE_ID,
 collection_target_rank:'best_available',raw_body_retained:false,
 acquisition_attempt:{attempted_at:generatedAt,status,source_id:POLAND_SOURCE_ID,route_id:'pkwk-2026-plan',error_code:status==='network_error'?'pkwk_source_fetch_failed':(status==='parse_error'?'pkwk_source_parse_failed':null)},
 discovery:{method:'official_pkwk_warsaw_pdf_plus_wroclaw_sopot_html',source_urls:[WARSAW_PDF_URL,PKWK_INFO_URL,SOPOT_2026_URL],source_visible_rows:allRows.length,rank_counts:ranks(records),completion_counts:completions(records)},
 window:{start_date:start,end_date_exclusive:end,days,coverage_claim:status==='success'?'official_source_visible_horizon':'acquisition_failed_preserve_verified_state',coverage_note:'Official PKWK 2026 material is combined across Warszawa-Służewiec, Wrocław-Partynice and Hipodrom Sopot. Warsaw PDF OCR day digits are normalized only when the printed weekday uniquely resolves the valid 2026 calendar date. Race post times are not inferred. Source absence is not non-running evidence.'},
 records,diagnostics:{source_errors:sourceErrors,parse_failures:parseFailures,unknown_venues:[],source_warnings:[]}
};
write(output,artifact);
console.log(JSON.stringify({output,start_date:start,end_date_exclusive:end,source_visible_rows:allRows.length,meetings_emitted:records.length,dates:records.map(r=>[r.date,r.racecourse_id]),rank_counts:ranks(records),completion_counts:completions(records),source_errors:sourceErrors.length,parse_failures:parseFailures.length,raw_body_retained:false}));
