import fs from 'node:fs';
import path from 'node:path';
import {
  NJ_AUTHORITY_ID,NJ_EXPECTED_TURF_DATES,NJ_SOURCE_ID,NJ_SYSTEM_ID,NJ_TIMEZONE,
  parseMeadowlandsTurfMonth,assertMeadowlandsTurfSeason,buildNjTurfCandidate
} from './us-nj-meadowlands-turf-core.mjs';

const arg=(n,defaultValue)=>process.argv.find(x=>x.startsWith('--'+n+'='))?.slice(n.length+3)??defaultValue;
function localDate(){const p=new Intl.DateTimeFormat('en-CA',{timeZone:NJ_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const z=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return z.year+'-'+z.month+'-'+z.day;}
const start=arg('as-of',localDate()),days=Number(arg('days','90')),output=arg('output',null);
if(!output)throw Error('required --output=FILE');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start))throw Error('invalid --as-of');
if(!Number.isInteger(days)||days<1||days>120)throw Error('invalid --days');
const endDate=new Date(start+'T00:00:00Z');endDate.setUTCDate(endDate.getUTCDate()+days);const end=endDate.toISOString().slice(0,10);
const checkedAt=new Date().toISOString(),sourceErrors=[],parseFailures=[];
const all=[];
for (const month of [9,10]){
  const src='https://playmeadowlands.com/events/month/2026-'+String(month).padStart(2,'0')+'/';
  try {
    const r=await fetch(src,{headers:{'user-agent':'WhereHorsesRun/1.0 (+https://github.com/badjoke-lab/where-horses-run)','accept':'text/html'},signal:AbortSignal.timeout(30000)});
    if(!r.ok||new URL(r.url).hostname!=='playmeadowlands.com')throw Error('HTTP or host error '+r.status);
    const html=await r.text();
    all.push(...parseMeadowlandsTurfMonth(html,month,r.url));
  } catch(e) {sourceErrors.push({month,source_url:src,error:String(e?.message??e)});}
}
if(!sourceErrors.length){
  try{assertMeadowlandsTurfSeason(all);}catch(e){parseFailures.push({stage:'nine_day_season_validation',error:String(e?.message??e)});}
}
const success=sourceErrors.length===0&&parseFailures.length===0;
const activeRows=success?all.filter(r=>r.date>=start&&r.date<end):[];
const records=activeRows.map(row=>buildNjTurfCandidate(row,checkedAt));
const artifact={
  schema_version:'us-nj-meadowlands-turf-2026-window-candidates-v1',generated_at:checkedAt,
  country_id:'united-states',authority_id:NJ_AUTHORITY_ID,racing_system_id:NJ_SYSTEM_ID,
  timezone:NJ_TIMEZONE,source_id:NJ_SOURCE_ID,
  collection_target_rank:'best_available',raw_body_retained:false,
  acquisition_attempt:{attempted_at:checkedAt,status:sourceErrors.length?'network_error':parseFailures.length?'parse_error':'success',source_id:NJ_SOURCE_ID,route_id:'njrc-meadowlands-turf-2026',error_code:sourceErrors.length?'source_fetch_failed':parseFailures.length?'season_dates_mismatch':null},
  discovery:{method:'meadowlands_2026_operator_event_calendar',source_visible_rows:success?NJ_EXPECTED_TURF_DATES.length:0,window_visible_rows:records.length,rank_counts:{C:records.length,'B':0,'B+':0,'A':0,'A+':0}},
  window:{start_date:start,end_date_exclusive:end,days,coverage_claim:success?'source_visible_2026_meadowlands_turf_only':'acquisition_failed_preserve_verified_state',coverage_note:'Nine source-visible Thoroughbred turf meetings at the Meadowlands; not Standardbred, not all NJ, not U.S. nationwide. Missing or failed sources are not evidence of cancelled/non-running meetings. Beyond 2026, a new reviewed season source is required.'},
  records,diagnostics:{source_errors:sourceErrors,parse_failures:parseFailures,unknown_venues:[],source_warnings:[]}
};
const file=path.resolve(output);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(artifact,null,2)+'\n');
console.log(JSON.stringify({status:artifact.acquisition_attempt.status,source_visible_rows:artifact.discovery.source_visible_rows,window_rows:records.length,dates:records.map(r=>r.date),diagnostics:artifact.diagnostics,output}));
