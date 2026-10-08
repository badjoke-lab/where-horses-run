import fs from 'node:fs';
import path from 'node:path';
import {
  MARTINIQUE_AUTHORITY_ID,MARTINIQUE_SOURCE_ID,MARTINIQUE_SOURCE_URL,MARTINIQUE_SYSTEM_ID,MARTINIQUE_TIMEZONE,
  buildMartiniqueMeetingRecord,parseCarrereCalendarPage
} from './martinique-carrere-calendar-core.mjs';

function arg(n,f=null){const p='--'+n+'=';const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):f;}
function plusDays(date,count){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){const p=new Intl.DateTimeFormat('en-CA',{timeZone:MARTINIQUE_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now),v=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return v.year+'-'+v.month+'-'+v.day;}
function write(file,value){const t=path.resolve(file);fs.mkdirSync(path.dirname(t),{recursive:true});fs.writeFileSync(t,JSON.stringify(value,null,2)+'\n');}
function ranks(records){return Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));}
function completions(records){return Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map(n=>[n,records.filter(r=>r.acquisition_completion?.disposition===n).length]));}

async function getHtml(url,{timeoutMs=30000}={}){
  const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5','accept-language':'fr-FR,fr;q=0.9,en;q=0.7'},signal:AbortSignal.timeout(timeoutMs)});
  if(!r.ok) throw new Error('HTTP '+r.status+' '+url);
  return {html:await r.text(),url:r.url||url};
}

const output=arg('output'),days=Number(arg('days','30')),start=arg('as-of',localDate());
if(!output) throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>120) throw new Error('--days must be 1..120');
const end=plusDays(start,days),generatedAt=new Date().toISOString(),sourceErrors=[],parseFailures=[],sourceWarnings=[];
let sourceUrl=MARTINIQUE_SOURCE_URL,allRows=[];
try{
  const page=await getHtml(MARTINIQUE_SOURCE_URL);sourceUrl=page.url||MARTINIQUE_SOURCE_URL;
  try{allRows=parseCarrereCalendarPage(page.html,{sourceUrl});}
  catch(e){parseFailures.push({stage:'calendar_parse',source_url:sourceUrl,error:String(e?.message??e)});}
}catch(e){sourceErrors.push({stage:'calendar_fetch',source_url:MARTINIQUE_SOURCE_URL,error:String(e?.message??e)});}
const status=sourceErrors.length?'network_error':(parseFailures.length?'parse_error':'success');
const visible=allRows.filter(r=>r.date>=start&&r.date<end);
const records=status==='success'?visible.map(r=>buildMartiniqueMeetingRecord(r,{checkedAt:generatedAt})):[];
const artifact={
  schema_version:'martinique-carrere-official-window-candidates-v1',generated_at:generatedAt,country_id:'martinique',
  authority_id:MARTINIQUE_AUTHORITY_ID,racing_system_id:MARTINIQUE_SYSTEM_ID,timezone:MARTINIQUE_TIMEZONE,source_id:MARTINIQUE_SOURCE_ID,
  collection_target_rank:'best_available',raw_body_retained:false,
  acquisition_attempt:{attempted_at:generatedAt,status,source_id:MARTINIQUE_SOURCE_ID,route_id:'carrere-calendar-official-window',error_code:status==='network_error'?'carrere_calendar_fetch_failed':(status==='parse_error'?'carrere_calendar_parse_failed':null)},
  discovery:{method:'official_carrere_2026_calendar',source_url:sourceUrl,source_visible_rows:allRows.length,window_visible_rows:visible.length,rank_counts:ranks(records),completion_counts:completions(records)},
  window:{start_date:start,end_date_exclusive:end,days,coverage_claim:status==='success'?'official_2026_calendar_window':'acquisition_failed_preserve_verified_state',coverage_note:'Automatic route emits only source-visible 2026 Carrere calendar meeting dates at the fixed physical venue. The published Horaire is retained only as source metadata and is not interpreted as first-race post time. Source absence, fetch failure or parser failure is not cancellation/non-running evidence.'},
  records,
  diagnostics:{source_errors:sourceErrors,parse_failures:parseFailures,unknown_venues:[],source_warnings:sourceWarnings}
};
write(output,artifact);
console.log(JSON.stringify({output,start_date:start,end_date_exclusive:end,source_visible_rows:allRows.length,window_rows:visible.length,meetings_emitted:records.length,dates:records.map(r=>r.date),rank_counts:ranks(records),completion_counts:completions(records),source_errors:sourceErrors.length,parse_failures:parseFailures.length,raw_body_retained:false}));
