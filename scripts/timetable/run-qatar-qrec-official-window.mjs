import fs from 'node:fs';
import path from 'node:path';
import {QATAR_AUTHORITY_ID,QATAR_SOURCE_ID,QATAR_SOURCE_URL,QATAR_SYSTEM_ID,QATAR_TIMEZONE,buildQatarMeetingRecord,resolveQrecRacecourse} from './qatar-qrec-calendar-core.mjs';

function arg(n,f=null){const p='--'+n+'=';const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):f;}
function plusDays(date,count){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){const p=new Intl.DateTimeFormat('en-CA',{timeZone:QATAR_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now),v=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return v.year+'-'+v.month+'-'+v.day;}
function write(file,value){const t=path.resolve(file);fs.mkdirSync(path.dirname(t),{recursive:true});fs.writeFileSync(t,JSON.stringify(value,null,2)+'\n');}
function ranks(records){return Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));}
function completions(records){return Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map(n=>[n,records.filter(r=>r.acquisition_completion?.disposition===n).length]));}

async function fetchText(url,options={}){
  const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept-language':'en'},signal:AbortSignal.timeout(30000),...options});
  if(!r.ok) throw new Error('HTTP '+r.status+' '+url);
  return {text:await r.text(),url:r.url||url};
}

function extractPublicEnv(bundle){
  const base=bundle.match(/NEXT_PUBLIC_BASE_URL\|\|"([^"]+)"/)?.[1];
  const apiKey=bundle.match(/NEXT_PUBLIC_API_KEY\|\|"([^"]+)"/)?.[1];
  const grant=bundle.match(/NEXT_PUBLIC_AUTH_GRANT_TOKEN\|\|"([^"]+)"/)?.[1];
  if(!base||!apiKey||!grant) throw new Error('QREC public frontend env incomplete');
  return {base,apiKey,grant};
}

async function loadQrecMeetings(start,end){
  const page=await fetchText(QATAR_SOURCE_URL);
  const app=page.text.match(/\/_next\/static\/chunks\/pages\/_app-[^"']+\.js/);
  if(!app) throw new Error('QREC _app chunk not found');
  const bundle=(await fetchText(new URL(app[0],page.url).href)).text;
  const env=extractPublicEnv(bundle);
  const qbase=env.base.replace(/\/$/,'')+'/qrec/';
  const tokenResponse=await fetch(qbase+'token/generate',{
    method:'POST',
    headers:{
      'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
      'content-type':'application/x-www-form-urlencoded',
      'authorization':'Basic '+env.grant,
      'apiKey':env.apiKey,
      'channel':'Portal',
      'language':'en'
    },
    body:'grant_type=client_credentials',
    signal:AbortSignal.timeout(30000)
  });
  if(!tokenResponse.ok) throw new Error('QREC token HTTP '+tokenResponse.status);
  const tokenJson=await tokenResponse.json();
  const token=tokenJson?.access_token;
  if(typeof token!=='string'||!token) throw new Error('QREC token missing');
  const endpoint=new URL(qbase+'race/data');
  endpoint.searchParams.set('pageaction','jsonmeetings');
  endpoint.searchParams.set('startdate',start);
  endpoint.searchParams.set('endate',end);
  endpoint.searchParams.set('lang','en');
  const response=await fetch(endpoint,{
    headers:{
      'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
      'apiKey':env.apiKey,
      'apiToken':token,
      'authorization':'Bearer '+token,
      'channel':'Portal',
      'language':'en'
    },
    signal:AbortSignal.timeout(30000)
  });
  if(!response.ok) throw new Error('QREC meetings HTTP '+response.status);
  const json=await response.json();
  if(!Array.isArray(json?.data)) throw new Error('QREC meetings data list missing');
  return {meetings:json.data,sourceUrl:page.url};
}

const output=arg('output'),days=Number(arg('days','30')),start=arg('as-of',localDate());
if(!output) throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>120) throw new Error('--days must be 1..120');

const end=plusDays(start,days),generatedAt=new Date().toISOString();
const sourceErrors=[],parseFailures=[],sourceWarnings=[],unknownVenues=[];
let allMeetings=[],sourceUrl=QATAR_SOURCE_URL;
try{
  const result=await loadQrecMeetings(start,end);
  allMeetings=result.meetings;
  sourceUrl=result.sourceUrl;
}catch(e){
  sourceErrors.push({stage:'qrec_public_api',source_url:QATAR_SOURCE_URL,error:String(e?.message??e)});
}
const inWindow=allMeetings.filter(m=>typeof m?.date==='string'&&m.date>=start&&m.date<end);
const records=[];
if(!sourceErrors.length){
  for(const meeting of inWindow){
    const venue=resolveQrecRacecourse(meeting?.meetingName);
    if(!venue){
      unknownVenues.push({date:meeting?.date??null,meeting_name:meeting?.meetingName??null,meetid:meeting?.meetid??null});
      continue;
    }
    try{
      records.push(buildQatarMeetingRecord(meeting,{checkedAt:generatedAt,sourceUrl}));
    }catch(e){
      parseFailures.push({stage:'meeting_normalize',date:meeting?.date??null,error:String(e?.message??e)});
    }
  }
}
const attemptStatus=sourceErrors.length?'network_error':(parseFailures.length?'parse_error':'success');
const artifact={
  schema_version:'qatar-qrec-official-window-candidates-v1',
  generated_at:generatedAt,
  country_id:'qatar',
  authority_id:QATAR_AUTHORITY_ID,
  racing_system_id:QATAR_SYSTEM_ID,
  timezone:QATAR_TIMEZONE,
  source_id:QATAR_SOURCE_ID,
  collection_target_rank:'best_available',
  raw_body_retained:false,
  acquisition_attempt:{attempted_at:generatedAt,status:attemptStatus,source_id:QATAR_SOURCE_ID,route_id:'qrec-public-api-official-window',error_code:sourceErrors.length?'qrec_api_failed':(parseFailures.length?'qrec_normalize_failed':null)},
  discovery:{method:'official_qrec_public_frontend_api',source_url:sourceUrl,source_visible_rows:allMeetings.length,window_visible_rows:inWindow.length,rank_counts:ranks(records),completion_counts:completions(records)},
  window:{start_date:start,end_date_exclusive:end,days,coverage_claim:'official_api_window_filtered_locally',coverage_note:'The QREC public API can return meetings beyond the requested query range; this runner filters strictly to the requested local date window. A 00:00 postTime is unpublished, not midnight. Source absence or API failure is not cancellation/non-running evidence.'},
  records,
  diagnostics:{source_errors:sourceErrors,parse_failures:parseFailures,unknown_venues:unknownVenues,source_warnings:sourceWarnings}
};
write(output,artifact);
console.log(JSON.stringify({
  output,start_date:start,end_date_exclusive:end,api_rows:allMeetings.length,window_rows:inWindow.length,
  meetings_emitted:records.length,dates:records.map(r=>r.date),venues:[...new Set(records.map(r=>r.racecourse_id))],
  rank_counts:ranks(records),completion_counts:completions(records),
  source_errors:sourceErrors.length,parse_failures:parseFailures.length,unknown_venues:unknownVenues.length,raw_body_retained:false
}));
