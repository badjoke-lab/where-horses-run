import fs from 'node:fs';
import path from 'node:path';
import {
  BAHRAIN_TIMEZONE,
  BTC_AUTHORITY_ID,
  BTC_DETAIL_SOURCE_ID,
  BTC_RACECARD_BASE_URL,
  BTC_SCHEDULE_SOURCE_ID,
  BTC_SEASON_PROGRAMME_URL,
  BTC_SYSTEM_ID,
  buildBtcDetailedRecord,
  buildBtcFixtureRecord,
  parseBtcRacecardPage,
  parseBtcSeasonProgrammePage,
} from './bahrain-btc-core.mjs';

function arg(name,fallback=null){const value=process.argv.find(item=>item.startsWith(`--${name}=`));return value?value.slice(name.length+3):fallback;}
function plusDays(date,count){const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:BAHRAIN_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const values=Object.fromEntries(parts.filter(part=>part.type!=='literal').map(part=>[part.type,part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
function inWindow(date,start,end){return date>=start&&date<end;}
function write(file,value){const target=path.resolve(file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,`${JSON.stringify(value,null,2)}\n`);}
async function fetchHtml(url,{allowNotPublished=false}={}){
  const response=await fetch(url,{
    redirect:'follow',
    headers:{
      'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
      accept:'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
      'accept-language':'en-GB,en;q=0.9',
    },
    signal:AbortSignal.timeout(20000),
  });
  if(allowNotPublished&&[404,410].includes(response.status)) return {status:'not_published',url:response.url||url,html:null};
  if(!response.ok) throw new Error(`HTTP ${response.status}`);
  return {status:'success',url:response.url||url,html:await response.text()};
}

const output=arg('output');
const days=Number(arg('days','30'));
const start=arg('as-of',localDate());
if(!output) throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>62) throw new Error('--days must be 1..62');
const end=plusDays(start,days);
const generatedAt=new Date().toISOString();

const sourceErrors=[];
const parseFailures=[];
let scheduleRows=[];
let scheduleUrl=BTC_SEASON_PROGRAMME_URL;
let scheduleStatus='source_error';
try{
  const schedule=await fetchHtml(BTC_SEASON_PROGRAMME_URL);
  scheduleUrl=schedule.url;
  try{
    scheduleRows=parseBtcSeasonProgrammePage(schedule.html,{sourceUrl:schedule.url});
    scheduleStatus='success';
  }catch(error){
    parseFailures.push({stage:'season_programme',source_url:schedule.url,error:String(error?.message??error)});
    scheduleStatus='parser_failure';
  }
}catch(error){
  sourceErrors.push({stage:'season_programme',source_url:BTC_SEASON_PROGRAMME_URL,error:String(error?.message??error)});
}
const rows=scheduleRows.filter(row=>inWindow(row.date,start,end));
const records=[];
for(const row of rows){
  const detailUrl=`${BTC_RACECARD_BASE_URL}/${row.date}/1/entries`;
  try{
    const fetched=await fetchHtml(detailUrl,{allowNotPublished:true});
    if(fetched.status==='not_published'){
      records.push(buildBtcFixtureRecord(row,{checkedAt:generatedAt}));
      continue;
    }
    try{
      const detail=parseBtcRacecardPage(fetched.html,{date:row.date,sourceUrl:fetched.url});
      records.push(buildBtcDetailedRecord(row,detail,{checkedAt:generatedAt}));
    }catch(error){
      records.push(buildBtcFixtureRecord(row,{checkedAt:generatedAt,detailStatus:'parser_failure',attemptStatus:'parser_failure',errorCode:'race_times_not_parsed'}));
      parseFailures.push({stage:'racecard',date:row.date,source_url:fetched.url,error:String(error?.message??error)});
    }
  }catch(error){
    records.push(buildBtcFixtureRecord(row,{checkedAt:generatedAt,detailStatus:'source_error',attemptStatus:'source_error',errorCode:'racecard_fetch_failed'}));
    sourceErrors.push({stage:'racecard',date:row.date,source_url:detailUrl,error:String(error?.message??error)});
  }
}
const rankCounts=Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(row=>row.capability_rank===rank).length]));
const detailStatusCounts=Object.fromEntries(['available','not_published','source_error','parser_failure'].map(status=>[status,records.filter(row=>row.detail_observation?.status===status).length]));
const artifact={
  schema_version:'bahrain-btc-official-window-candidates-v1',
  generated_at:generatedAt,
  country_id:'bahrain',
  authority_id:BTC_AUTHORITY_ID,
  racing_system_id:BTC_SYSTEM_ID,
  timezone:BAHRAIN_TIMEZONE,
  source_id:BTC_SCHEDULE_SOURCE_ID,
  detail_source_id:BTC_DETAIL_SOURCE_ID,
  collection_target_rank:'best_available',
  raw_body_retained:false,
  acquisition_attempt:{
    attempted_at:generatedAt,
    status:scheduleStatus,
    source_id:BTC_SCHEDULE_SOURCE_ID,
    route_id:'btc-season-programme',
    error_code:scheduleStatus==='success'?null:(scheduleStatus==='parser_failure'?'season_programme_parse_failed':'season_programme_fetch_failed'),
  },
  discovery:{
    method:'official_btc_season_programme_plus_racecard_navigation',
    schedule_source_id:BTC_SCHEDULE_SOURCE_ID,
    schedule_source_url:scheduleUrl,
    detail_source_id:BTC_DETAIL_SOURCE_ID,
    season_rows:scheduleRows.length,
    rank_counts:rankCounts,
    detail_status_counts:detailStatusCounts,
  },
  window:{
    start_date:start,
    end_date_exclusive:end,
    days,
    coverage_claim:scheduleStatus==='success'?'official_season_programme':'source_unavailable_preserve_verified_state',
    coverage_note:'Bahrain Turf Club season programme supplies the official meeting-date mother set for the sole Bahrain racing venue. Published racecard navigation may promote a meeting to rank A with complete per-race post times. Detail absence stays pending; source or parser failure never confirms non-running and never erases stronger verified state.',
  },
  records,
  diagnostics:{
    source_errors:sourceErrors,
    parse_failures:parseFailures,
    unknown_venues:[],
    source_warnings:[],
  },
};
write(output,artifact);
console.log(JSON.stringify({
  output,
  start_date:start,
  end_date_exclusive:end,
  season_rows:scheduleRows.length,
  meetings_emitted:records.length,
  rank_counts:rankCounts,
  detail_status_counts:detailStatusCounts,
  source_errors:sourceErrors.length,
  parse_failures:parseFailures.length,
  raw_body_retained:false,
}));
