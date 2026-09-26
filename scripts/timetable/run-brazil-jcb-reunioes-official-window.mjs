import fs from 'node:fs';
import path from 'node:path';
import { BRAZIL_JCB_REUNIOES_URL,BRAZIL_JCB_SOURCE_ID,BRAZIL_TIMEZONE,buildBrazilJcbMeetingRecord,parseJcbReunioes } from './brazil-jcb-reunioes-core.mjs';

function arg(name,fallback=null){const p=`--${name}=`;const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):fallback;}
function plusDays(date,count){const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){const p=new Intl.DateTimeFormat('en-CA',{timeZone:BRAZIL_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const v=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return `${v.year}-${v.month}-${v.day}`;}
function write(file,value){const t=path.resolve(file);fs.mkdirSync(path.dirname(t),{recursive:true});fs.writeFileSync(t,`${JSON.stringify(value,null,2)}\n`);}
async function getHtml(url){const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5','accept-language':'pt-BR,pt;q=0.9,en;q=0.6'},signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error(`HTTP ${r.status}`);return {html:await r.text(),url:r.url||url};}
const gaveaOutput=arg('gavea-output'),cristalOutput=arg('cristal-output'),days=Number(arg('days','30')),start=arg('as-of',localDate());
if(!gaveaOutput||!cristalOutput) throw new Error('--gavea-output and --cristal-output are required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>62) throw new Error('--days must be 1..62');
const end=plusDays(start,days),generatedAt=new Date().toISOString();
let allRows=[],sourceUrl=BRAZIL_JCB_REUNIOES_URL,attemptStatus='success';const sourceErrors=[],parseFailures=[];
try{const f=await getHtml(BRAZIL_JCB_REUNIOES_URL);sourceUrl=f.url;allRows=parseJcbReunioes(f.html,{sourceUrl:f.url});if(allRows.length===0){parseFailures.push({code:'no_supported_jcb_reunioes_rows_parsed',source_url:f.url});attemptStatus='parse_error';}}
catch(error){attemptStatus='network_error';sourceErrors.push({stage:'jcb_reunioes_html',source_url:BRAZIL_JCB_REUNIOES_URL,error:String(error?.message??error)});}
const windowRows=allRows.filter(r=>r.date>=start&&r.date<end);
function artifactFor(system){
  const rows=windowRows.filter(r=>r.racing_system_id===system.racing_system_id);
  const records=rows.map(r=>buildBrazilJcbMeetingRecord(r,{checkedAt:generatedAt}));
  return {
    schema_version:'brazil-jcb-reunioes-official-window-candidates-v1',generated_at:generatedAt,country_id:'brazil',
    authority_id:system.authority_id,racing_system_id:system.racing_system_id,timezone:BRAZIL_TIMEZONE,source_id:BRAZIL_JCB_SOURCE_ID,
    collection_target_rank:'best_available',raw_body_retained:false,
    acquisition_attempt:{attempted_at:generatedAt,status:attemptStatus,source_id:BRAZIL_JCB_SOURCE_ID,route_id:'jcb-reunioes-weekly-html',error_code:sourceErrors.length?'jcb_reunioes_fetch_failed':(parseFailures.length?'jcb_reunioes_parse_failed':null)},
    discovery:{method:'jcb_reunioes_weekly_html',source_url:sourceUrl,source_visible_rows:allRows.length,supported_source_rows:allRows.filter(r=>r.racing_system_id===system.racing_system_id).length},
    window:{start_date:start,end_date_exclusive:end,days,coverage_claim:sourceErrors.length||parseFailures.length?'acquisition_failed_preserve_verified_state':'official_source_visible_horizon',coverage_note:'JCB Reuniões is treated as a source-visible weekly publication horizon. Missing future dates are not evidence of non-running. This route publishes date and physical venue at rank C only.'},
    records,diagnostics:{source_errors:sourceErrors,parse_failures:parseFailures,unknown_venues:[],source_warnings:[]}
  };
}
const gavea=artifactFor({authority_id:'jockey-club-brasileiro',racing_system_id:'brazil-gavea-system'});
const cristal=artifactFor({authority_id:'jockey-club-do-rio-grande-do-sul',racing_system_id:'brazil-cristal-system'});
write(gaveaOutput,gavea);write(cristalOutput,cristal);
console.log(JSON.stringify({gavea_output:gaveaOutput,cristal_output:cristalOutput,start_date:start,end_date_exclusive:end,source_visible_rows:allRows.length,gavea_meetings_emitted:gavea.records.length,cristal_meetings_emitted:cristal.records.length,source_errors:sourceErrors.length,parse_failures:parseFailures.length,raw_body_retained:false}));
