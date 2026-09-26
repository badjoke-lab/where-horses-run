import fs from 'node:fs';
import path from 'node:path';
import {
  BRAZIL_RACEDAY_URL,
  BRAZIL_SOURCE_URL,
  BRAZIL_SYSTEMS,
  BRAZIL_TIMEZONE,
  buildBrazilJcbMeetingRecord,
  parseBrazilJcbCurrentMeetings,
  parseBrazilJcbRaceday,
} from './brazil-jcb-current-meetings-core.mjs';

function arg(name,fallback=null){const p=`--${name}=`;const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):fallback;}
function plusDays(date,count){const v=new Date(`${date}T00:00:00Z`);v.setUTCDate(v.getUTCDate()+count);return v.toISOString().slice(0,10);}
function localDate(now=new Date()){const p=new Intl.DateTimeFormat('en-CA',{timeZone:BRAZIL_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const v=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return `${v.year}-${v.month}-${v.day}`;}
function inWindow(date,start,end){return date>=start&&date<end;}
function write(file,value){const target=path.resolve(file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,`${JSON.stringify(value,null,2)}\n`);}
async function getHtml(url){
  const response=await fetch(url,{redirect:'follow',headers:{
    'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
    accept:'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
    'accept-language':'pt-BR,pt;q=0.9,en;q=0.6',
  },signal:AbortSignal.timeout(20000)});
  if(!response.ok) throw new Error(`HTTP ${response.status}`);
  return {html:await response.text(),url:response.url||url};
}

const gaveaOutput=arg('gavea-output');
const cristalOutput=arg('cristal-output');
const days=Number(arg('days','30'));
const start=arg('as-of',localDate());
if(!gaveaOutput||!cristalOutput) throw new Error('--gavea-output and --cristal-output are required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>62) throw new Error('--days must be 1..62');
const end=plusDays(start,days);
const generatedAt=new Date().toISOString();

let sourceUrl=BRAZIL_SOURCE_URL;
let parsed={records:[],source_warnings:[]};
const sourceErrors=[];
const parseFailures=[];
let attemptStatus='success';
try{
  const fetched=await getHtml(BRAZIL_SOURCE_URL);
  sourceUrl=fetched.url;
  parsed=parseBrazilJcbCurrentMeetings(fetched.html,{sourceUrl:fetched.url});
  if(parsed.records.length===0){
    parseFailures.push({code:'no_routed_brazil_meetings_parsed',source_url:fetched.url});
    attemptStatus='parse_error';
  }
}catch(error){
  attemptStatus='network_error';
  sourceErrors.push({stage:'jcb_current_meetings_html',source_url:BRAZIL_SOURCE_URL,error:String(error?.message??error)});
}


const detailByKey=new Map();
const detailErrors=[];
if(!sourceErrors.length&&!parseFailures.length){
  for(const row of parsed.records.filter(r=>inWindow(r.date,start,end))){
    const detailUrl=BRAZIL_RACEDAY_URL(row.date);
    try{
      const fetched=await getHtml(detailUrl);
      const detail=parseBrazilJcbRaceday(fetched.html,{expectedSystemKey:row.system_key,expectedDate:row.date,sourceUrl:fetched.url});
      detailByKey.set(`${row.system_key}|${row.date}`,detail);
      if(detail.status==='parser_failure'){
        detailErrors.push({stage:'jcb_raceday_parse',date:row.date,system_key:row.system_key,source_url:fetched.url,error:detail.reason});
      }
    }catch(error){
      const detail={status:'source_error',rows:[],detail_url:detailUrl,reason:String(error?.message??error),evaluated_capability_rank:'A+'};
      detailByKey.set(`${row.system_key}|${row.date}`,detail);
      detailErrors.push({stage:'jcb_raceday_fetch',date:row.date,system_key:row.system_key,source_url:detailUrl,error:String(error?.message??error)});
    }
  }
}

function artifactFor(systemKey){
  const system=BRAZIL_SYSTEMS[systemKey];
  const rows=parsed.records.filter(r=>r.system_key===systemKey&&inWindow(r.date,start,end));
  const records=rows.map(r=>buildBrazilJcbMeetingRecord(r,{
    checkedAt:generatedAt,
    detail:detailByKey.get(`${r.system_key}|${r.date}`) ?? {status:'not_published',rows:[],detail_url:BRAZIL_RACEDAY_URL(r.date),evaluated_capability_rank:'A+'},
  }));
  const rankCounts=Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));
  const completionCounts=Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map(name=>[name,records.filter(r=>r.acquisition_completion?.disposition===name).length]));
  return {
    schema_version:'brazil-jcb-current-meetings-window-candidates-v1',
    generated_at:generatedAt,
    country_id:'brazil',
    authority_id:system.authority_id,
    racing_system_id:system.racing_system_id,
    timezone:BRAZIL_TIMEZONE,
    source_id:system.source_id,
    collection_target_rank:'best_available',
    raw_body_retained:false,
    acquisition_attempt:{
      attempted_at:generatedAt,status:attemptStatus,source_id:system.source_id,route_id:'jcb-current-meetings-html',
      error_code:sourceErrors.length?'jcb_current_meetings_fetch_failed':(parseFailures.length?'jcb_current_meetings_parse_failed':null),
    },
    discovery:{
      method:'official_jcb_current_meetings_html',
      source_url:sourceUrl,
      source_visible_rows:parsed.records.length,
      system_visible_rows:parsed.records.filter(r=>r.system_key===systemKey).length,
      rank_counts:rankCounts,
      detail_status_counts:Object.fromEntries(['available','not_published','source_error','parser_failure'].map(status=>[status,records.filter(r=>r.detail_observation?.status===status).length])),
      completion_counts:completionCounts,
    },
    window:{
      start_date:start,end_date_exclusive:end,days,
      coverage_claim:sourceErrors.length||parseFailures.length?'acquisition_failed_preserve_verified_state':'official_source_visible_horizon',
      coverage_note:'JCB current-meetings HTML is a short source-visible horizon. Matching JCB Raceday pages are attempted for best-available race detail through A+. Missing future dates are not evidence of non-running, and detail failure never erases stronger verified state.',
    },
    records,
    diagnostics:{source_errors:[...sourceErrors,...detailErrors.filter(e=>e.system_key===systemKey)],parse_failures:parseFailures,unknown_venues:[],source_warnings:parsed.source_warnings},
  };
}

const gavea=artifactFor('gavea');
const cristal=artifactFor('cristal');
write(gaveaOutput,gavea);
write(cristalOutput,cristal);
console.log(JSON.stringify({
  start_date:start,end_date_exclusive:end,
  source_visible_rows:parsed.records.length,
  gavea:{output:gaveaOutput,meetings_emitted:gavea.records.length,rank_counts:gavea.discovery.rank_counts},
  cristal:{output:cristalOutput,meetings_emitted:cristal.records.length,rank_counts:cristal.discovery.rank_counts},
  source_errors:sourceErrors.length,detail_errors:detailErrors.length,parse_failures:parseFailures.length,source_warnings:parsed.source_warnings.length,
  raw_body_retained:false,
}));
