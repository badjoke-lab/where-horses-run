import fs from 'node:fs';
import path from 'node:path';
import {
  SAUDI_JCSA_AUTHORITY_ID,
  SAUDI_JCSA_RACES_PREFIX,
  SAUDI_JCSA_SOURCE_ID,
  SAUDI_JCSA_SYSTEM_ID,
  SAUDI_JCSA_TIMEZONE,
  buildJcsaMeetingRecord,
} from './saudi-jcsa-core.mjs';

function arg(name,fallback=null){
  const inline=process.argv.find(v=>v.startsWith('--'+name+'='));
  return inline?inline.slice(name.length+3):fallback;
}
function plusDays(date,count){
  const d=new Date(date+'T00:00:00Z'); d.setUTCDate(d.getUTCDate()+count); return d.toISOString().slice(0,10);
}
function localDate(now=new Date()){
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:SAUDI_JCSA_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const v=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  return v.year+'-'+v.month+'-'+v.day;
}
async function fetchMeeting(date){
  const url=SAUDI_JCSA_RACES_PREFIX+date.replaceAll('-','');
  const response=await fetch(url,{redirect:'follow',headers:{
    'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
    accept:'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
    'accept-language':'en-SA,en;q=0.9',
  },signal:AbortSignal.timeout(20000)});
  if(response.status===404) return {status:'no_meeting',url};
  if(!response.ok) throw new Error('HTTP '+response.status);
  return {status:'ok',url:response.url||url,html:await response.text()};
}

const output=arg('output');
const days=Number(arg('days','30'));
const start=arg('as-of',localDate());
if(!output) throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>62) throw new Error('--days must be 1..62');

const generatedAt=new Date().toISOString();
const records=[],dates=[],errors=[];
let successfulRequests=0;
for(let i=0;i<days;i+=1){
  const date=plusDays(start,i);
  try{
    const fetched=await fetchMeeting(date);
    successfulRequests+=1;
    if(fetched.status==='no_meeting'){
      dates.push({date,status:'no_meeting_observed',presence_state:'absent_unconfirmed',source_url:fetched.url});
      continue;
    }
    const record=buildJcsaMeetingRecord({date,html:fetched.html,checkedAt:generatedAt});
    if(!record){
      dates.push({date,status:'no_meeting_observed',presence_state:'absent_unconfirmed',source_url:fetched.url});
      continue;
    }
    records.push(record);
    dates.push({date,status:'present',presence_state:'present',source_url:fetched.url,racecourse_id:record.racecourse_id,rank:record.capability_rank,race_count:record.timetable_rows.length});
  }catch(error){
    const message=String(error?.message??error);
    dates.push({date,status:'source_error',presence_state:'absent_unconfirmed',source_url:SAUDI_JCSA_RACES_PREFIX+date.replaceAll('-',''),error:message});
    errors.push({date,stage:'meeting_fetch_or_parse',error:message});
  }
}
const acquisitionAttempt=successfulRequests===0?{
  attempted_at:generatedAt,status:'network_error',source_id:SAUDI_JCSA_SOURCE_ID,route_id:null,
  error_code:errors.some(x=>/timeout|aborted/i.test(x.error))?'timeout':'fetch_error'
}:{attempted_at:generatedAt,status:'success',source_id:SAUDI_JCSA_SOURCE_ID,route_id:null,error_code:null};
const ranks=Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));
const artifact={
  schema_version:'saudi-jcsa-official-window-candidates-v1',
  generated_at:generatedAt,
  country_id:'saudi-arabia',
  authority_id:SAUDI_JCSA_AUTHORITY_ID,
  racing_system_id:SAUDI_JCSA_SYSTEM_ID,
  timezone:SAUDI_JCSA_TIMEZONE,
  source_id:SAUDI_JCSA_SOURCE_ID,
  detail_source_id:SAUDI_JCSA_SOURCE_ID,
  collection_target_rank:'best_available',
  raw_body_retained:false,
  acquisition_attempt:acquisitionAttempt,
  discovery:{
    method:'official_jcsa_date_meeting_html',
    schedule_source_id:SAUDI_JCSA_SOURCE_ID,
    schedule_source_url:'https://jcsa.sa/en/races/',
    detail_source_id:SAUDI_JCSA_SOURCE_ID,
    detail_source_url:'https://jcsa.sa/en/races/',
    date_requests_successful:successfulRequests,
    date_requests_total:days,
    rank_counts:ranks,
    negative_evidence_capability:'unsupported',
  },
  window:{
    start_date:start,end_date_exclusive:plusDays(start,days),days,
    coverage_claim:successfulRequests===0?'fetch_failed':errors.length?'partial':'source_window_complete',
    coverage_note:'Each requested date is checked on the official JCSA meeting route. Missing pages or missing meeting fingerprints are absence only and never cancellation evidence. Complete post-time rows support A; meeting-only pages remain C; source/parser failures preserve existing verified state.'
  },
  records,
  diagnostics:{dates,source_errors:errors},
};
const target=path.resolve(output); fs.mkdirSync(path.dirname(target),{recursive:true}); fs.writeFileSync(target,JSON.stringify(artifact,null,2)+'\n');
console.log(JSON.stringify({output,start_date:start,end_date_exclusive:plusDays(start,days),meetings_emitted:records.length,rank_counts:ranks,successful_date_requests:successfulRequests,source_errors:errors.length,acquisition_attempt:acquisitionAttempt}));
