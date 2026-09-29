import fs from 'node:fs';
import path from 'node:path';
import {
  NORWAY_TIMEZONE,NORWAY_OVREVOLL_AUTHORITY_ID,NORWAY_OVREVOLL_SYSTEM_ID,NORWAY_OVREVOLL_SOURCE_ID,
  NORWAY_OVREVOLL_FIXTURES_URL,buildOvrevollMeetingRecord,parseOvrevollFixturesHtml
} from './norway-ovrevoll-core.mjs';
function arg(name,fallback=null){const p=`--${name}=`;const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):fallback;}
function plusDays(date,count){const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){const p=new Intl.DateTimeFormat('en-CA',{timeZone:NORWAY_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const v=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return `${v.year}-${v.month}-${v.day}`;}
function write(file,value){const t=path.resolve(file);fs.mkdirSync(path.dirname(t),{recursive:true});fs.writeFileSync(t,`${JSON.stringify(value,null,2)}\n`);}
async function getHtml(url){const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5','accept-language':'nb-NO,nb;q=0.9,en;q=0.7'},signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error(`HTTP ${r.status}`);return{html:await r.text(),url:r.url||url};}
const output=arg('output'),days=Number(arg('days','30')),start=arg('as-of',localDate());
if(!output)throw new Error('--output=<path> is required');if(!/^\d{4}-\d{2}-\d{2}$/.test(start))throw new Error('--as-of must be YYYY-MM-DD');if(!Number.isInteger(days)||days<1||days>62)throw new Error('--days must be 1..62');
const end=plusDays(start,days),generatedAt=new Date().toISOString();
let allRows=[];const sourceErrors=[],parseFailures=[];let attemptStatus='success',sourceUrl=NORWAY_OVREVOLL_FIXTURES_URL;
try{const f=await getHtml(NORWAY_OVREVOLL_FIXTURES_URL);sourceUrl=f.url;allRows=parseOvrevollFixturesHtml(f.html,{sourceUrl:f.url});}
catch(error){attemptStatus='network_error';sourceErrors.push({stage:'ovrevoll_fixture_html',source_url:NORWAY_OVREVOLL_FIXTURES_URL,error:String(error?.message??error)});}
const rows=allRows.filter(r=>r.date>=start&&r.date<end);
const records=rows.map(r=>buildOvrevollMeetingRecord(r,{checkedAt:generatedAt}));
const rankCounts=Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));
const completionCounts=Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map(name=>[name,records.filter(r=>r.acquisition_completion?.disposition===name).length]));
const artifact={schema_version:'norway-ovrevoll-official-window-candidates-v1',generated_at:generatedAt,country_id:'norway',authority_id:NORWAY_OVREVOLL_AUTHORITY_ID,racing_system_id:NORWAY_OVREVOLL_SYSTEM_ID,timezone:NORWAY_TIMEZONE,source_id:NORWAY_OVREVOLL_SOURCE_ID,collection_target_rank:'best_available',raw_body_retained:false,
acquisition_attempt:{attempted_at:generatedAt,status:attemptStatus,source_id:NORWAY_OVREVOLL_SOURCE_ID,route_id:'ovrevoll-2026-fixture-html',error_code:sourceErrors.length?'ovrevoll_fixture_fetch_failed':null},
discovery:{method:'official_ovrevoll_2026_fixture_html',source_url:sourceUrl,annual_rows:allRows.length,rank_counts:rankCounts,completion_counts:completionCounts},
window:{start_date:start,end_date_exclusive:end,days,coverage_claim:sourceErrors.length?'acquisition_failed_preserve_verified_state':'official_annual_calendar_source_visible_horizon',coverage_note:'The official Øvrevoll 2026 fixture list is the gallop meeting-date mother set. Published event start is context only and is not treated as first-race post time. Source omission or acquisition failure never confirms non-running.'},
records,diagnostics:{source_errors:sourceErrors,parse_failures:parseFailures,unknown_venues:[],source_warnings:[]}};
write(output,artifact);
console.log(JSON.stringify({output,start_date:start,end_date_exclusive:end,annual_rows:allRows.length,meetings_emitted:records.length,dates:records.map(r=>r.date),rank_counts:rankCounts,completion_counts:completionCounts,source_errors:sourceErrors.length,parse_failures:parseFailures.length,raw_body_retained:false}));
