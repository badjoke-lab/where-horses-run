import fs from 'node:fs';
import path from 'node:path';
import {NORWAY_DNT_TIMEZONE,NORWAY_DNT_AUTHORITY_ID,NORWAY_DNT_SYSTEM_ID,NORWAY_DNT_SOURCE_ID,NORWAY_DNT_CALENDAR_URL,buildDntMeetingRecord,parseDntCalendarHtml} from './norway-dnt-core.mjs';
function arg(name,fallback=null){const p=`--${name}=`;const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):fallback;}
function plusDays(date,count){const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){const p=new Intl.DateTimeFormat('en-CA',{timeZone:NORWAY_DNT_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const v=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return `${v.year}-${v.month}-${v.day}`;}
function write(file,value){const t=path.resolve(file);fs.mkdirSync(path.dirname(t),{recursive:true});fs.writeFileSync(t,`${JSON.stringify(value,null,2)}\n`);}
async function getHtml(url){const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5','accept-language':'nb-NO,nb;q=0.9,en;q=0.7'},signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error(`HTTP ${r.status}`);return{html:await r.text(),url:r.url||url};}
const output=arg('output'),days=Number(arg('days','30')),start=arg('as-of',localDate());
if(!output)throw new Error('--output=<path> is required');if(!/^\d{4}-\d{2}-\d{2}$/.test(start))throw new Error('--as-of must be YYYY-MM-DD');if(!Number.isInteger(days)||days<1||days>62)throw new Error('--days must be 1..62');
const end=plusDays(start,days),generatedAt=new Date().toISOString();
let allRows=[];const sourceErrors=[],parseFailures=[],unknownVenues=[];let attemptStatus='success',sourceUrl=NORWAY_DNT_CALENDAR_URL;
try{const f=await getHtml(NORWAY_DNT_CALENDAR_URL);sourceUrl=f.url;const parsed=parseDntCalendarHtml(f.html,{sourceUrl:f.url});allRows=parsed.records;parseFailures.push(...parsed.parse_failures);unknownVenues.push(...parsed.unknown_venues);}
catch(error){attemptStatus='network_error';sourceErrors.push({stage:'dnt_calendar_html',source_url:NORWAY_DNT_CALENDAR_URL,error:String(error?.message??error)});}
const rows=allRows.filter(r=>r.date>=start&&r.date<end);const records=rows.map(r=>buildDntMeetingRecord(r,{checkedAt:generatedAt}));
const rankCounts=Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));
const completionCounts=Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map(name=>[name,records.filter(r=>r.acquisition_completion?.disposition===name).length]));
const artifact={schema_version:'norway-dnt-official-window-candidates-v1',generated_at:generatedAt,country_id:'norway',authority_id:NORWAY_DNT_AUTHORITY_ID,racing_system_id:NORWAY_DNT_SYSTEM_ID,timezone:NORWAY_DNT_TIMEZONE,source_id:NORWAY_DNT_SOURCE_ID,collection_target_rank:'best_available',raw_body_retained:false,
acquisition_attempt:{attempted_at:generatedAt,status:attemptStatus,source_id:NORWAY_DNT_SOURCE_ID,route_id:'dnt-current-calendar-html',error_code:sourceErrors.length?'dnt_calendar_fetch_failed':null},
discovery:{method:'official_dnt_current_calendar_html',source_url:sourceUrl,source_visible_rows:allRows.length,rank_counts:rankCounts,completion_counts:completionCounts},
window:{start_date:start,end_date_exclusive:end,days,coverage_claim:sourceErrors.length?'acquisition_failed_preserve_verified_state':'official_source_visible_horizon',coverage_note:'The official DNT Løpsdagskalender supplies the currently published harness meeting dates and physical racecourses. Entry deadlines are not race post times. Source omission or acquisition failure never confirms non-running.'},
records,diagnostics:{source_errors:sourceErrors,parse_failures:parseFailures,unknown_venues:unknownVenues,source_warnings:[]}};
write(output,artifact);console.log(JSON.stringify({output,start_date:start,end_date_exclusive:end,source_visible_rows:allRows.length,meetings_emitted:records.length,venues:[...new Set(records.map(r=>r.racecourse_id))],rank_counts:rankCounts,completion_counts:completionCounts,source_errors:sourceErrors.length,parse_failures:parseFailures.length,unknown_venues:unknownVenues.length,raw_body_retained:false}));
