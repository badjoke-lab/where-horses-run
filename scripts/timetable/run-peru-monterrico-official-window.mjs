import fs from 'node:fs';
import path from 'node:path';
import {
  PERU_MONTERRICO_AUTHORITY_ID,
  PERU_MONTERRICO_DATE_API_PREFIX,
  PERU_MONTERRICO_ENTRY_PROGRAMME_URL,
  PERU_MONTERRICO_PROGRAMME_URL,
  PERU_MONTERRICO_REUNION_API_PREFIX,
  PERU_MONTERRICO_SOURCE_ID,
  PERU_MONTERRICO_SYSTEM_ID,
  PERU_MONTERRICO_TIMEZONE,
  buildMonterricoApiMeetingRecord,
  buildMonterricoFallbackRecord,
  buildMonterricoMeetingRecord,
  extractMonterricoEntryProgrammeLinks,
  extractMonterricoReunionIds,
} from './peru-monterrico-core.mjs';

function arg(name, fallback=null) {
  const value=process.argv.find(v=>v.startsWith('--'+name+'='));
  return value ? value.slice(name.length+3) : fallback;
}
function plusDays(date,count) {
  const d=new Date(date+'T00:00:00Z');
  d.setUTCDate(d.getUTCDate()+count);
  return d.toISOString().slice(0,10);
}
function localDate(now=new Date()) {
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:PERU_MONTERRICO_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const v=Object.fromEntries(parts.filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
  return v.year+'-'+v.month+'-'+v.day;
}
async function get(url,accept) {
  const response=await fetch(url,{redirect:'follow',headers:{
    'user-agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',
    accept,
    'accept-language':'es-PE,es;q=0.9,en;q=0.7',
    referer:'https://hipodromodemonterrico.com.pe/programa-de-entradas',
    origin:'https://hipodromodemonterrico.com.pe',
    'x-requested-with':'XMLHttpRequest'
  },signal:AbortSignal.timeout(20000)});
  if(!response.ok) throw new Error('HTTP '+response.status);
  return {body:await response.text(),contentType:response.headers.get('content-type')??'',url:response.url||url};
}
async function discover(date) {
  const url=PERU_MONTERRICO_DATE_API_PREFIX+date;
  const response=await get(url,'application/json,text/plain;q=0.9,*/*;q=0.5');
  let payload;
  try { payload=JSON.parse(response.body); } catch { throw new Error('invalid_json'); }
  return { ids:extractMonterricoReunionIds(payload), url:response.url };
}
async function entryProgrammeLinks() {
  const response=await get(PERU_MONTERRICO_ENTRY_PROGRAMME_URL,'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5');
  if(!/html/i.test(response.contentType) && !/<html\b/i.test(response.body)) throw new Error('unexpected_content_type:'+response.contentType);
  return { links:extractMonterricoEntryProgrammeLinks(response.body), url:response.url };
}

async function programme(reunionId) {
  const url=PERU_MONTERRICO_REUNION_API_PREFIX+encodeURIComponent(reunionId);
  const response=await get(url,'application/json,text/plain;q=0.9,*/*;q=0.5');
  let payload;
  try { payload=JSON.parse(response.body); } catch { throw new Error('invalid_json'); }
  return { payload,url:response.url };
}

const output=arg('output');
const days=Number(arg('days','30'));
const start=arg('as-of',localDate());
if(!output) throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>62) throw new Error('--days must be 1..62');

const generatedAt=new Date().toISOString();
const records=[], dates=[], errors=[];
let successfulDateRequests=0;
for(let i=0;i<days;i+=1) {
  const date=plusDays(start,i);
  let found;
  try {
    found=await discover(date);
    successfulDateRequests+=1;
  } catch(error) {
    const message=String(error?.message??error);
    dates.push({date,status:'source_error',reunion_ids:[]});
    errors.push({date,stage:'date_discovery',source_url:PERU_MONTERRICO_DATE_API_PREFIX+date,error:message});
    continue;
  }
  if(found.ids.length===0) {
    dates.push({date,status:'no_meeting_observed',source_url:found.url,reunion_ids:[]});
    continue;
  }
  if(found.ids.length!==1) {
    dates.push({date,status:'conflict',source_url:found.url,reunion_ids:found.ids});
    errors.push({date,stage:'date_discovery',source_url:found.url,error:'multiple_reunion_ids:'+found.ids.join(',')});
    continue;
  }
  const reunionId=found.ids[0];
  try {
    const p=await programme(reunionId);
    const record=buildMonterricoApiMeetingRecord({date,reunionId,programmePayload:p.payload,checkedAt:generatedAt,sourceUrl:p.url});
    records.push(record);
    dates.push({date,status:'available',source_url:p.url,reunion_ids:found.ids,race_count:record.timetable_rows.length,capability_rank:record.capability_rank});
  } catch(error) {
    const message=String(error?.message??error);
    const pending=/complete race table/i.test(message);
    records.push(buildMonterricoFallbackRecord({date,reunionId,checkedAt:generatedAt,status:pending?'not_published':'source_error',errorCode:pending?'programme_not_published':'programme_fetch_or_parse_failed'}));
    dates.push({date,status:pending?'not_published':'source_error',reunion_ids:found.ids,error:message});
    errors.push({date,stage:'programme_detail',source_url:PERU_MONTERRICO_REUNION_API_PREFIX+reunionId,error:message});
  }
}

const failedDiscoveryDates=new Set(errors.filter(row=>row.stage==='date_discovery').map(row=>row.date));
const fallbackDiscovery={
  attempted:false,
  status:'not_needed',
  source_url:PERU_MONTERRICO_ENTRY_PROGRAMME_URL,
  links_found:0,
  links_in_window:0,
  meetings_recovered:0,
  errors:[]
};
if(failedDiscoveryDates.size) {
  fallbackDiscovery.attempted=true;
  try {
    const entry=await entryProgrammeLinks();
    const end=plusDays(start,days);
    const visible=entry.links.filter(row=>row.date>=start && row.date<end);
    fallbackDiscovery.status='success';
    fallbackDiscovery.source_url=entry.url;
    fallbackDiscovery.links_found=entry.links.length;
    fallbackDiscovery.links_in_window=visible.length;
    const existingDates=new Set(records.map(row=>row.date));
    for(const row of visible) {
      if(!failedDiscoveryDates.has(row.date) || existingDates.has(row.date)) continue;
      try {
        const p=await programme(row.reunion_id);
        const record=buildMonterricoApiMeetingRecord({date:row.date,reunionId:row.reunion_id,programmePayload:p.payload,checkedAt:generatedAt,sourceUrl:p.url});
        record.route_id='monterrico-entry-programme-to-reunion-api';
        record.source.extraction_method='official_entry_programme_reunion_api_fallback';
        record.acquisition_attempt.route_id='monterrico-entry-programme-to-reunion-api';
        records.push(record);
        existingDates.add(row.date);
        fallbackDiscovery.meetings_recovered+=1;
        const dateRow=dates.find(item=>item.date===row.date);
        if(dateRow) Object.assign(dateRow,{status:'fallback_available',source_url:p.url,reunion_ids:[row.reunion_id],race_count:record.timetable_rows.length,capability_rank:record.capability_rank});
      } catch(error) {
        fallbackDiscovery.errors.push({date:row.date,reunion_id:row.reunion_id,stage:'programme_detail',source_url:row.programme_url,error:String(error?.message??error)});
      }
    }
  } catch(error) {
    fallbackDiscovery.status='source_error';
    fallbackDiscovery.errors.push({stage:'entry_programme_discovery',source_url:PERU_MONTERRICO_ENTRY_PROGRAMME_URL,error:String(error?.message??error)});
  }
}

const acquisitionAttempt=successfulDateRequests===0 && fallbackDiscovery.meetings_recovered===0 ? {
  attempted_at:generatedAt,
  status:'network_error',
  source_id:PERU_MONTERRICO_SOURCE_ID,
  route_id:null,
  error_code:errors.some(row=>/timeout|timed out|aborted/i.test(row.error))?'timeout':'fetch_error'
} : {
  attempted_at:generatedAt,
  status:'success',
  source_id:PERU_MONTERRICO_SOURCE_ID,
  route_id:successfulDateRequests===0?'monterrico-entry-programme-fallback':null,
  error_code:null
};

const rankCounts=Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));
const detailCounts=Object.fromEntries(['available','not_published','source_error'].map(status=>[status,records.filter(r=>r.detail_observation?.status===status).length]));
const artifact={
  schema_version:'peru-monterrico-official-window-candidates-v1',
  generated_at:generatedAt,
  country_id:'peru',
  authority_id:PERU_MONTERRICO_AUTHORITY_ID,
  racing_system_id:PERU_MONTERRICO_SYSTEM_ID,
  timezone:PERU_MONTERRICO_TIMEZONE,
  source_id:PERU_MONTERRICO_SOURCE_ID,
  detail_source_id:PERU_MONTERRICO_SOURCE_ID,
  collection_target_rank:'best_available',
  raw_body_retained:false,
  acquisition_attempt:acquisitionAttempt,
  discovery:{
    method:'official_monterrico_date_api_plus_reunion_api_with_official_entry_fallback',
    schedule_source_id:PERU_MONTERRICO_SOURCE_ID,
    schedule_source_url:PERU_MONTERRICO_PROGRAMME_URL,
    detail_source_id:PERU_MONTERRICO_SOURCE_ID,
    detail_source_url:PERU_MONTERRICO_REUNION_API_PREFIX,
    fallback_schedule_source_url:PERU_MONTERRICO_ENTRY_PROGRAMME_URL,
    fallback_discovery:fallbackDiscovery,
    date_requests_successful:successfulDateRequests,
    date_requests_total:days,
    rank_counts:rankCounts,
    detail_status_counts:detailCounts
  },
  window:{
    start_date:start,
    end_date_exclusive:plusDays(start,days),
    days,
    coverage_claim:successfulDateRequests===0?(fallbackDiscovery.meetings_recovered?'source_visible_partial':'fetch_failed'):errors.length?'partial':'source_window_complete',
    coverage_note:'Every requested date is attempted through the official Monterrico date API. Discovered reunion ids are resolved through the same official site reunion JSON API, whose carreras array supplies complete per-race times, names and distances through rank A. If date discovery fails, the official Programa de Entradas page remains a source-visible fallback. Unresolved dates remain explicit acquisition gaps rather than false no-meeting observations.'
  },
  records,
  diagnostics:{dates,source_errors:errors}
};
const target=path.resolve(output);
fs.mkdirSync(path.dirname(target),{recursive:true});
fs.writeFileSync(target,JSON.stringify(artifact,null,2)+'\n');
console.log(JSON.stringify({output,start_date:start,end_date_exclusive:plusDays(start,days),meetings_emitted:records.length,rank_counts:rankCounts,detail_status_counts:detailCounts,successful_date_requests:successfulDateRequests,source_errors:errors.length,fallback_discovery:fallbackDiscovery,raw_body_retained:false}));
