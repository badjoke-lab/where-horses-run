import fs from 'node:fs';
import path from 'node:path';
import {
  SAUDI_JCSA_AUTHORITY_ID,
  SAUDI_JCSA_RACES_BASE,
  SAUDI_JCSA_SOURCE_ID,
  SAUDI_JCSA_SYSTEM_ID,
  SAUDI_JCSA_TIMEZONE,
  SAUDI_JCSA_TAIF_VENUE_URL,
  SAUDI_JCSA_RIYADH_VENUE_URL,
  buildJcsaFixtureRecord,
  buildJcsaMeetingRecord,
  parseJcsaRacePage,
  parseJcsaVenueFixtures,
  parseJcsaVenueSeason,
  resolveJcsaVenueForDate,
} from './saudi-jcsa-core.mjs';

function arg(name,fallback=null){const v=process.argv.find(x=>x.startsWith('--'+name+'='));return v?v.slice(name.length+3):fallback;}
function plusDays(date,count){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:SAUDI_JCSA_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const v=Object.fromEntries(parts.filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
  return v.year+'-'+v.month+'-'+v.day;
}
async function get(url){
  const response=await fetch(url,{redirect:'follow',headers:{
    'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
    accept:'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
    'accept-language':'en-SA,en;q=0.9'
  },signal:AbortSignal.timeout(20000)});
  if(response.status===404) return {status:404,body:'',url:response.url||url};
  if(!response.ok) throw new Error('HTTP '+response.status);
  return {status:response.status,body:await response.text(),url:response.url||url};
}

const output=arg('output');
const days=Number(arg('days','30'));
const start=arg('as-of',localDate());
if(!output) throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>62) throw new Error('--days must be 1..62');

const generatedAt=new Date().toISOString();
const records=[],dates=[],errors=[];
let seasons=[];
const fixtureByDate=new Map();
let venueFetches=0;
for(const def of [
  {key:'taif',url:SAUDI_JCSA_TAIF_VENUE_URL},
  {key:'riyadh',url:SAUDI_JCSA_RIYADH_VENUE_URL},
]){
  try{
    const res=await get(def.url);
    if(res.status!==200) throw new Error('HTTP '+res.status);
    const season=parseJcsaVenueSeason(res.body,{venueKey:def.key});
    seasons.push(season);
    for(const fixture of parseJcsaVenueFixtures(res.body,{venueKey:def.key})){
      fixtureByDate.set(fixture.date,{...fixture,venue:season,official_url:res.url});
    }
    venueFetches+=1;
  }catch(error){
    errors.push({stage:'venue_season',venue:def.key,source_url:def.url,error:String(error?.message??error)});
  }
}

let successfulDateRequests=0;
for(let i=0;i<days;i+=1){
  const date=plusDays(start,i);
  const venue=resolveJcsaVenueForDate(date,seasons);
  if(!venue){
    dates.push({date,status:'outside_verified_venue_season'});
    continue;
  }
  const url=SAUDI_JCSA_RACES_BASE+date.replaceAll('-','');
  try{
    const res=await get(url);
    successfulDateRequests+=1;
    if(res.status===404){
      const fixture=fixtureByDate.get(date);
      if(fixture){
        records.push(buildJcsaFixtureRecord({date,venue,meetingNo:fixture.meeting_no,checkedAt:generatedAt,officialUrl:fixture.official_url}));
        dates.push({date,status:'present_pending_detail',racecourse_id:venue.racecourse_id,source_url:fixture.official_url,meeting_no:fixture.meeting_no,capability_rank:'C'});
      } else {
        dates.push({date,status:'absent_unconfirmed',racecourse_id:venue.racecourse_id,source_url:url});
      }
      continue;
    }
    const parsed=parseJcsaRacePage(res.body,{expectedDate:date,venue});
    if(parsed.status!=='present'){
      const fixture=fixtureByDate.get(date);
      if(fixture){
        records.push(buildJcsaFixtureRecord({date,venue,meetingNo:fixture.meeting_no,checkedAt:generatedAt,officialUrl:fixture.official_url}));
        dates.push({date,status:'present_pending_detail',racecourse_id:venue.racecourse_id,source_url:fixture.official_url,meeting_no:fixture.meeting_no,capability_rank:'C',detail_reason:parsed.reason});
      } else {
        dates.push({date,status:'absent_unconfirmed',racecourse_id:venue.racecourse_id,source_url:res.url,reason:parsed.reason});
      }
      continue;
    }
    const record=buildJcsaMeetingRecord({date,venue,raceHtml:res.body,checkedAt:generatedAt});
    records.push(record);
    dates.push({date,status:'present',racecourse_id:venue.racecourse_id,source_url:res.url,meeting_no:parsed.meeting_no,race_count:record.timetable_rows.length,capability_rank:record.capability_rank});
  }catch(error){
    const message=String(error?.message??error);
    dates.push({date,status:'fetch_failed',racecourse_id:venue.racecourse_id,source_url:url,error:message});
    errors.push({date,stage:'race_page',racecourse_id:venue.racecourse_id,source_url:url,error:message});
  }
}

const totalAttempted=successfulDateRequests+errors.filter(e=>e.stage==='race_page').length;
const acquisitionAttempt=venueFetches===0||totalAttempted===0?{
  attempted_at:generatedAt,status:'network_error',source_id:SAUDI_JCSA_SOURCE_ID,route_id:null,error_code:'fetch_error'
}:{
  attempted_at:generatedAt,status:'success',source_id:SAUDI_JCSA_SOURCE_ID,route_id:null,error_code:null
};
const rankCounts=Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));
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
    method:'official_jcsa_venue_seasons_plus_date_race_pages',
    schedule_source_id:SAUDI_JCSA_SOURCE_ID,
    schedule_source_url:'https://www.jcsa.sa/en/races/',
    detail_source_id:SAUDI_JCSA_SOURCE_ID,
    detail_source_url:SAUDI_JCSA_RACES_BASE,
    verified_venue_seasons:seasons,
    visible_fixture_dates:[...fixtureByDate.keys()].sort(),
    rank_counts:rankCounts,
  },
  window:{
    start_date:start,
    end_date_exclusive:plusDays(start,days),
    days,
    coverage_claim:venueFetches===0?'fetch_failed':errors.length?'partial':'source_window_complete',
    coverage_note:'JCSA venue pages establish current Taif/Riyadh season bounds and explicitly visible upcoming fixtures. Each in-season date is checked directly against the official JCSA race route. A visible official venue fixture remains valid C when race detail is not yet published. Otherwise a missing meeting fingerprint is absent_unconfirmed only; fetch/parse failures are acquisition failures and never confirmed_non_running.'
  },
  records,
  diagnostics:{dates,source_errors:errors},
};
const target=path.resolve(output);
fs.mkdirSync(path.dirname(target),{recursive:true});
fs.writeFileSync(target,JSON.stringify(artifact,null,2)+'\n');
console.log(JSON.stringify({output,start_date:start,end_date_exclusive:plusDays(start,days),meetings_emitted:records.length,rank_counts:rankCounts,venue_seasons:seasons.map(s=>({racecourse_id:s.racecourse_id,start_date:s.start_date,end_date:s.end_date})),successful_date_requests:successfulDateRequests,source_errors:errors.length,raw_body_retained:false}));
