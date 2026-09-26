import fs from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  BRAZIL_CJ_AUTHORITY_ID,BRAZIL_CJ_INDEX_URL,BRAZIL_CJ_SOURCE_ID,BRAZIL_CJ_SYSTEM_ID,BRAZIL_CJ_TIMEZONE,
  buildCidadeJardimMeetingRecord,parseCidadeJardimProjectIndex,parseCidadeJardimProjectText,
} from './brazil-cidade-jardim-core.mjs';

function arg(name,fallback=null){const p=`--${name}=`;const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):fallback;}
function plusDays(date,count){const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){const p=new Intl.DateTimeFormat('en-CA',{timeZone:BRAZIL_CJ_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const v=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return `${v.year}-${v.month}-${v.day}`;}
function write(file,value){const t=path.resolve(file);fs.mkdirSync(path.dirname(t),{recursive:true});fs.writeFileSync(t,`${JSON.stringify(value,null,2)}\n`);}
function monthKeysBetween(start,endExclusive){
  const out=[]; let d=new Date(`${start.slice(0,7)}-01T00:00:00Z`); const end=new Date(`${endExclusive}T00:00:00Z`);
  while(d<end){out.push({year:d.getUTCFullYear(),month:d.getUTCMonth()+1});d.setUTCMonth(d.getUTCMonth()+1);}
  return out;
}
async function fetchText(url,accept='text/html,application/xhtml+xml;q=0.9,*/*;q=0.5'){
  const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':accept,'accept-language':'pt-BR,pt;q=0.9,en;q=0.6'},signal:AbortSignal.timeout(25000)});
  if(!r.ok) throw new Error(`HTTP ${r.status}`); return {text:await r.text(),url:r.url||url};
}
async function fetchPdfText(url){
  const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':'application/pdf,*/*;q=0.8','accept-language':'pt-BR,pt;q=0.9,en;q=0.6'},signal:AbortSignal.timeout(25000)});
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  const bytes=new Uint8Array(await r.arrayBuffer());
  if(bytes.length<4||String.fromCharCode(...bytes.slice(0,4))!=='%PDF') throw new Error('Cidade Jardim project response is not PDF');
  const pdf=await getDocument({data:bytes,disableWorker:true}).promise;
  const pageTexts=[];
  for(let n=1;n<=pdf.numPages;n++){const p=await pdf.getPage(n);const c=await p.getTextContent();pageTexts.push(c.items.filter(i=>'str' in i).map(i=>i.str).join(' '));}
  return pageTexts.join(' ');
}
function rankCounts(records){return Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));}
function completionCounts(records){return Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map(name=>[name,records.filter(r=>r.acquisition_completion?.disposition===name).length]));}

const output=arg('output'),days=Number(arg('days','30')),start=arg('as-of',localDate());
if(!output) throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>62) throw new Error('--days must be 1..62');
const end=plusDays(start,days),generatedAt=new Date().toISOString();
const sourceErrors=[],parseFailures=[],sourceWarnings=[]; let rows=[],indexUrl=BRAZIL_CJ_INDEX_URL,projectDocs=[];
try{
  const idx=await fetchText(BRAZIL_CJ_INDEX_URL); indexUrl=idx.url;
  const links=parseCidadeJardimProjectIndex(idx.text,{baseUrl:idx.url});
  for(const mk of monthKeysBetween(start,end)){
    const link=links.find(x=>x.year===mk.year&&x.month===mk.month);
    if(!link){sourceWarnings.push({code:'monthly_project_not_published',year:mk.year,month:mk.month});continue;}
    try{
      const text=await fetchPdfText(link.url); const parsed=parseCidadeJardimProjectText(text,{sourceUrl:link.url});
      rows.push(...parsed); projectDocs.push({year:mk.year,month:mk.month,url:link.url,meetings:parsed.length});
    }catch(error){parseFailures.push({year:mk.year,month:mk.month,source_url:link.url,error:String(error?.message??error)});}
  }
}catch(error){sourceErrors.push({stage:'jcsp_project_index',source_url:BRAZIL_CJ_INDEX_URL,error:String(error?.message??error)});}

rows=[...new Map(rows.filter(r=>r.date>=start&&r.date<end).map(r=>[`${r.date}|${r.racecourse_id}`,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
const records=rows.map(r=>buildCidadeJardimMeetingRecord(r,{checkedAt:generatedAt}));
const attemptStatus=sourceErrors.length?'network_error':(parseFailures.length?'partial_success':'success');
const artifact={
 schema_version:'brazil-cidade-jardim-official-window-candidates-v1',generated_at:generatedAt,country_id:'brazil',authority_id:BRAZIL_CJ_AUTHORITY_ID,
 racing_system_id:BRAZIL_CJ_SYSTEM_ID,timezone:BRAZIL_CJ_TIMEZONE,source_id:BRAZIL_CJ_SOURCE_ID,collection_target_rank:'best_available',raw_body_retained:false,
 acquisition_attempt:{attempted_at:generatedAt,status:attemptStatus,source_id:BRAZIL_CJ_SOURCE_ID,route_id:'jcsp-projeto-inscricoes-pdf',error_code:sourceErrors.length?'project_index_fetch_failed':(parseFailures.length?'monthly_project_parse_failed':null)},
 discovery:{method:'jcsp_monthly_project_index_plus_pdf',index_url:indexUrl,project_documents:projectDocs,rank_counts:rankCounts(records),completion_counts:completionCounts(records)},
 window:{start_date:start,end_date_exclusive:end,days,coverage_claim:sourceErrors.length?'acquisition_failed_preserve_verified_state':'official_monthly_project_source_visible_horizon',coverage_note:'Official JCSP Projeto de Inscrições monthly documents define source-visible meeting dates for Cidade Jardim. No post times are inferred. A missing future monthly document is a publication-state warning, not evidence of non-running.'},
 records,diagnostics:{source_errors:sourceErrors,parse_failures:parseFailures,unknown_venues:[],source_warnings:sourceWarnings},
};
write(output,artifact);
console.log(JSON.stringify({output,start_date:start,end_date_exclusive:end,project_documents:projectDocs,meetings_emitted:records.length,dates:records.map(r=>r.date),rank_counts:rankCounts(records),completion_counts:completionCounts(records),source_errors:sourceErrors.length,parse_failures:parseFailures.length,source_warnings:sourceWarnings.length,raw_body_retained:false}));
