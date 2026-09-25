import fs from 'node:fs';
import path from 'node:path';
import { RACE_COAST_AUTHORITY_ID,RACE_COAST_FIXTURES_URL,RACE_COAST_SOURCE_ID,RACE_COAST_SYSTEM_ID,SOUTH_AFRICA_TIMEZONE,buildRaceCoastMeetingRecord,parseRaceCoastFixturesHtml } from './south-africa-race-coast-core.mjs';

function arg(name,fallback=null){const p=`--${name}=`;const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):fallback;}
function plusDays(date,count){const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:SOUTH_AFRICA_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const v=Object.fromEntries(parts.filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));return `${v.year}-${v.month}-${v.day}`;}
function write(file,value){const target=path.resolve(file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,`${JSON.stringify(value,null,2)}\n`);}
async function getHtml(url){const response=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5','accept-language':'en-ZA,en;q=0.9'},signal:AbortSignal.timeout(25000)});if(!response.ok)throw new Error(`HTTP ${response.status}`);return {html:await response.text(),url:response.url||url};}

const output=arg('output');const days=Number(arg('days','30'));const start=arg('as-of',localDate());
if(!output)throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start))throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>62)throw new Error('--days must be 1..62');
const end=plusDays(start,days),generatedAt=new Date().toISOString();
let allRows=[];const sourceErrors=[];const parseFailures=[];let finalUrl=RACE_COAST_FIXTURES_URL;let attemptStatus='success';
try{
  const fetched=await getHtml(RACE_COAST_FIXTURES_URL);finalUrl=fetched.url;
  const parsed=parseRaceCoastFixturesHtml(fetched.html,{year:Number(start.slice(0,4)),sourceUrl:finalUrl});
  allRows=parsed.records;parseFailures.push(...parsed.parse_failures);
}catch(error){attemptStatus='network_error';sourceErrors.push({stage:'race_coast_fixtures',source_url:RACE_COAST_FIXTURES_URL,error:String(error?.message??error)});}
const rows=allRows.filter(row=>row.date>=start&&row.date<end);
const records=rows.map(row=>buildRaceCoastMeetingRecord(row,{checkedAt:generatedAt}));
const rankCounts=Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));
const completionCounts=Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map(name=>[name,records.filter(r=>r.acquisition_completion?.disposition===name).length]));
const artifact={schema_version:'south-africa-race-coast-official-window-candidates-v1',generated_at:generatedAt,country_id:'south-africa',authority_id:RACE_COAST_AUTHORITY_ID,racing_system_id:RACE_COAST_SYSTEM_ID,timezone:SOUTH_AFRICA_TIMEZONE,source_id:RACE_COAST_SOURCE_ID,collection_target_rank:'best_available',raw_body_retained:false,acquisition_attempt:{attempted_at:generatedAt,status:attemptStatus,source_id:RACE_COAST_SOURCE_ID,route_id:'race-coast-fixtures-html',error_code:sourceErrors.length?'fixtures_fetch_failed':null},discovery:{method:'official_race_coast_kzn_western_cape_fixtures_html',source_url:finalUrl,annual_rows:allRows.length,rank_counts:rankCounts,completion_counts:completionCounts},window:{start_date:start,end_date_exclusive:end,days,coverage_claim:sourceErrors.length?'acquisition_failed_preserve_verified_state':'operator_wide_fixture_calendar',coverage_note:'Official Race Coast fixtures cover its KwaZulu-Natal and Western Cape racecourses. This is operator-specific South Africa coverage and does not claim 4Racing coverage. Fixture absence or acquisition/parser failure never proves non-running.'},records,diagnostics:{source_errors:sourceErrors,parse_failures:parseFailures,unknown_venues:parseFailures.filter(x=>x.code==='unknown_venue'),source_warnings:[]}};
write(output,artifact);
console.log(JSON.stringify({output,start_date:start,end_date_exclusive:end,annual_rows:allRows.length,meetings_emitted:records.length,venues:[...new Set(records.map(r=>r.racecourse_id))],rank_counts:rankCounts,completion_counts:completionCounts,source_errors:sourceErrors.length,parse_failures:parseFailures.length,raw_body_retained:false}));
