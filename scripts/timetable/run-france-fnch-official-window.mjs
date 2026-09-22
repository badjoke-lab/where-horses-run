import fs from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  FRANCE_FNCH_CALENDAR_URL,
  FRANCE_FNCH_REGIONAL_PROGRAMME_URLS,
  FRANCE_FNCH_SOURCE_ID,
  FRANCE_GALOP_AUTHORITY_ID,
  FRANCE_GALOP_SYSTEM_ID,
  FRANCE_LETROT_AUTHORITY_ID,
  FRANCE_LETROT_SYSTEM_ID,
  FRANCE_TIMEZONE,
  buildFnchFixtureRecord,
  buildFnchProgrammeRecord,
  parseFnchRegionalProgrammePage,
} from './france-fnch-core.mjs';

function arg(name,fallback=null){const v=process.argv.find(x=>x.startsWith(`--${name}=`));return v?v.slice(name.length+3):fallback;}
function plusDays(date,count){const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:FRANCE_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const v=Object.fromEntries(parts.filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
  return `${v.year}-${v.month}-${v.day}`;
}
function inWindow(date,start,end){return date>=start&&date<end;}
async function getHtml(url){
  const response=await fetch(url,{redirect:'follow',headers:{
    'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
    accept:'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5','accept-language':'fr-FR,fr;q=0.9,en;q=0.7'
  },signal:AbortSignal.timeout(20000)});
  if(!response.ok) throw new Error(`HTTP ${response.status}`);
  return {html:await response.text(),url:response.url||url};
}
async function getPdfText(url){
  const response=await fetch(url,{redirect:'follow',headers:{
    'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
    accept:'application/pdf,*/*;q=0.8','accept-language':'fr-FR,fr;q=0.9,en;q=0.7'
  },signal:AbortSignal.timeout(20000)});
  if(!response.ok) throw new Error(`HTTP ${response.status}`);
  const bytes=new Uint8Array(await response.arrayBuffer());
  if(bytes.length<4||String.fromCharCode(...bytes.slice(0,4))!=='%PDF') throw new Error('programme response is not PDF');
  const pdf=await getDocument({data:bytes,disableWorker:true}).promise;
  const lines=[];
  for(let pageNumber=1;pageNumber<=pdf.numPages;pageNumber+=1){
    const page=await pdf.getPage(pageNumber);const content=await page.getTextContent();let line='';
    for(const item of content.items){
      if(!('str' in item)) continue;
      const value=item.str.replace(/\s+/g,' ').trim();if(value) line+=`${line?' ':''}${value}`;
      if(item.hasEOL&&line){lines.push(line);line='';}
    }
    if(line) lines.push(line);
  }
  return lines.join('\n');
}
function dedupeRows(rows){
  const map=new Map();
  for(const row of rows){
    const key=`${row.system_key}/${row.date}/${row.racecourse_id}`;
    const previous=map.get(key);
    if(!previous||(!previous.programme_url&&row.programme_url)) map.set(key,row);
  }
  return [...map.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.racecourse_id.localeCompare(b.racecourse_id)||a.system_key.localeCompare(b.system_key));
}
function artifactFor({systemKey,records,generatedAt,start,end,days,sourceErrors,parseFailures,unknownDisciplines,sourcePages}){
  const isGalop=systemKey==='galop';
  const authority_id=isGalop?FRANCE_GALOP_AUTHORITY_ID:FRANCE_LETROT_AUTHORITY_ID;
  const racing_system_id=isGalop?FRANCE_GALOP_SYSTEM_ID:FRANCE_LETROT_SYSTEM_ID;
  const selected=records.filter(r=>r.authority_id===authority_id);
  const rankCounts=Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,selected.filter(r=>r.capability_rank===rank).length]));
  const detailStatusCounts=Object.fromEntries(['available','not_published','source_error','parser_failure'].map(status=>[status,selected.filter(r=>r.detail_observation?.status===status).length]));
  return {
    schema_version:'france-fnch-official-window-candidates-v1',generated_at:generatedAt,country_id:'france',authority_id,racing_system_id,timezone:FRANCE_TIMEZONE,
    source_id:FRANCE_FNCH_SOURCE_ID,detail_source_id:FRANCE_FNCH_SOURCE_ID,collection_target_rank:'best_available',raw_body_retained:false,
    acquisition_attempt:{attempted_at:generatedAt,status:sourcePages.length?'success':'network_error',source_id:FRANCE_FNCH_SOURCE_ID,route_id:'fnch-regional-programme-index',error_code:sourcePages.length?null:'fetch_error'},
    discovery:{method:'official_fnch_regional_programme_indexes_plus_published_programme_pdfs',schedule_source_id:FRANCE_FNCH_SOURCE_ID,schedule_source_url:FRANCE_FNCH_CALENDAR_URL,detail_source_id:FRANCE_FNCH_SOURCE_ID,regional_pages:sourcePages,rank_counts:rankCounts,detail_status_counts:detailStatusCounts},
    window:{start_date:start,end_date_exclusive:end,days,coverage_claim:sourceErrors.length?'partial_source_visible_horizon':'source_visible_horizon',coverage_note:'FNCH regional programme indexes are treated as a source-visible meeting horizon, not proof that every date in the requested window has been exhaustively published. Visible meetings are attributed by discipline to France Galop or LETROT. Published official programme PDFs may supply complete per-race post times through rank A. Missing programme detail stays pending; retrieval/parser failures remain retry states; absence from FNCH pages never confirms non-running.'},
    records:selected,
    diagnostics:{source_errors:sourceErrors,parse_failures:parseFailures,unknown_disciplines:unknownDisciplines,source_pages_checked:sourcePages.length},
  };
}
function write(file,value){const target=path.resolve(file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,`${JSON.stringify(value,null,2)}\n`);}

const galopOutput=arg('galop-output');const letrotOutput=arg('letrot-output');
const days=Number(arg('days','30'));const start=arg('as-of',localDate());
if(!galopOutput||!letrotOutput) throw new Error('--galop-output=<path> and --letrot-output=<path> are required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>62) throw new Error('--days must be 1..62');
const end=plusDays(start,days);const generatedAt=new Date().toISOString();
const sourceRows=[];const sourceErrors=[];const parseFailures=[];const unknownDisciplines=[];const sourcePages=[];
for(const url of FRANCE_FNCH_REGIONAL_PROGRAMME_URLS){
  try{
    const fetched=await getHtml(url);const parsed=parseFnchRegionalProgrammePage(fetched.html,{sourceUrl:fetched.url});
    sourceRows.push(...parsed.records);parseFailures.push(...parsed.parse_failures.map(x=>({...x,source_url:fetched.url})));unknownDisciplines.push(...parsed.unknown_disciplines.map(x=>({...x,source_url:fetched.url})));
    sourcePages.push({url:fetched.url,records:parsed.records.length});
  }catch(error){sourceErrors.push({stage:'regional_programme_index',source_url:url,error:String(error?.message??error)});}
}
const rows=dedupeRows(sourceRows).filter(row=>inWindow(row.date,start,end));
const records=[];
for(const row of rows){
  if(!row.programme_url){records.push(buildFnchFixtureRecord(row,{checkedAt:generatedAt}));continue;}
  try{
    const programmeText=await getPdfText(row.programme_url);
    const record=buildFnchProgrammeRecord(row,{checkedAt:generatedAt,programmeText});records.push(record);
    if(record.detail_observation?.status==='parser_failure') parseFailures.push({stage:'programme_pdf',date:row.date,racecourse_id:row.racecourse_id,source_url:row.programme_url,error:'race_times_not_parsed'});
  }catch(error){
    records.push(buildFnchFixtureRecord(row,{checkedAt:generatedAt,detailStatus:'source_error',attemptStatus:'source_error',errorCode:'programme_fetch_failed'}));
    sourceErrors.push({stage:'programme_pdf',date:row.date,racecourse_id:row.racecourse_id,source_url:row.programme_url,error:String(error?.message??error)});
  }
}
const galop=artifactFor({systemKey:'galop',records,generatedAt,start,end,days,sourceErrors,parseFailures,unknownDisciplines,sourcePages});
const letrot=artifactFor({systemKey:'letrot',records,generatedAt,start,end,days,sourceErrors,parseFailures,unknownDisciplines,sourcePages});
write(galopOutput,galop);write(letrotOutput,letrot);
console.log(JSON.stringify({start_date:start,end_date_exclusive:end,source_pages:sourcePages.length,source_errors:sourceErrors.length,parse_failures:parseFailures.length,unknown_disciplines:unknownDisciplines.length,galop:{output:galopOutput,meetings:galop.records.length,rank_counts:galop.discovery.rank_counts,detail_status_counts:galop.discovery.detail_status_counts},letrot:{output:letrotOutput,meetings:letrot.records.length,rank_counts:letrot.discovery.rank_counts,detail_status_counts:letrot.discovery.detail_status_counts},raw_body_retained:false}));
