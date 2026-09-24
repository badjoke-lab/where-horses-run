import fs from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  GERMANY_ANNUAL_PDF_URL,
  GERMANY_AUTHORITY_ID,
  GERMANY_CALENDAR_URL,
  GERMANY_SOURCE_ID,
  GERMANY_SYSTEM_ID,
  GERMANY_TIMEZONE,
  buildGermanyMeetingRecord,
  parseGermanyAnnualCalendarText,
  parseGermanyCalendarHtml,
} from './germany-deutscher-galopp-core.mjs';

function arg(name,fallback=null){const p=`--${name}=`;const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):fallback;}
function plusDays(date,count){const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:GERMANY_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const v=Object.fromEntries(parts.filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));return `${v.year}-${v.month}-${v.day}`;}
function inWindow(date,start,end){return date>=start&&date<end;}
function write(file,value){const target=path.resolve(file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,`${JSON.stringify(value,null,2)}\n`);}
function germanDateLabel(iso){const [y,m,d]=iso.split('-').map(Number);const months=['','Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];return `${d}. ${months[m]} ${y}`;}
function calendarUrl(start,endExclusive){const end=plusDays(endExclusive,-1);const u=new URL(GERMANY_CALENDAR_URL);u.searchParams.set('art','');u.searchParams.set('jahr',start.slice(0,4));u.searchParams.set('land','8');u.searchParams.set('ort','');u.searchParams.set('laengevon','');u.searchParams.set('laengebis','');u.searchParams.set('von',germanDateLabel(start));u.searchParams.set('von_submit',start.replaceAll('-','/'));u.searchParams.set('bis',germanDateLabel(end));u.searchParams.set('bis_submit',end.replaceAll('-','/'));return u.toString();}
async function getHtml(url){const response=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5','accept-language':'de-DE,de;q=0.9,en;q=0.7'},signal:AbortSignal.timeout(20000)});if(!response.ok)throw new Error(`HTTP ${response.status}`);return {html:await response.text(),url:response.url||url};}
async function getPdfText(url){const response=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':'application/pdf,*/*;q=0.8','accept-language':'de-DE,de;q=0.9,en;q=0.7'},signal:AbortSignal.timeout(20000)});if(!response.ok)throw new Error(`HTTP ${response.status}`);const bytes=new Uint8Array(await response.arrayBuffer());if(bytes.length<4||String.fromCharCode(...bytes.slice(0,4))!=='%PDF')throw new Error('annual calendar response is not PDF');const pdf=await getDocument({data:bytes,disableWorker:true}).promise;const lines=[];for(let pageNumber=1;pageNumber<=pdf.numPages;pageNumber+=1){const page=await pdf.getPage(pageNumber);const content=await page.getTextContent();let line='';for(const item of content.items){if(!('str' in item))continue;const value=item.str.replace(/\s+/g,' ').trim();if(value)line+=`${line?' ':''}${value}`;if(item.hasEOL&&line){lines.push(line);line='';}}if(line)lines.push(line);}return lines.join('\n');}

const output=arg('output');const days=Number(arg('days','30'));const start=arg('as-of',localDate());
if(!output)throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start))throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>62)throw new Error('--days must be 1..62');
const end=plusDays(start,days);const generatedAt=new Date().toISOString();
const sourceErrors=[];const parseFailures=[];let annualRows=[];let detailRows=[];let annualStatus='success';let detailStatus='success';

try{const text=await getPdfText(GERMANY_ANNUAL_PDF_URL);const parsed=parseGermanyAnnualCalendarText(text,{year:Number(start.slice(0,4)),sourceUrl:GERMANY_ANNUAL_PDF_URL});annualRows=parsed.records;if(parsed.unknown_lines.length)parseFailures.push(...parsed.unknown_lines.map(source_text=>({stage:'annual_pdf',code:'unknown_standalone_line',source_text})));}catch(error){annualStatus='source_error';sourceErrors.push({stage:'annual_pdf',source_url:GERMANY_ANNUAL_PDF_URL,error:String(error?.message??error)});}
const requestedCalendarUrl=calendarUrl(start,end);
try{const fetched=await getHtml(requestedCalendarUrl);const parsed=parseGermanyCalendarHtml(fetched.html,{sourceUrl:fetched.url});detailRows=parsed.race_rows;parseFailures.push(...parsed.parse_failures.map(x=>({...x,stage:'calendar_html',source_url:fetched.url})));}catch(error){detailStatus='source_error';sourceErrors.push({stage:'calendar_html',source_url:requestedCalendarUrl,error:String(error?.message??error)});}

let scheduleRows=annualRows.filter(row=>inWindow(row.date,start,end));
if(!scheduleRows.length&&annualStatus!=='success'){
  const fallback=new Map();
  for(const row of detailRows.filter(row=>inWindow(row.date,start,end))) fallback.set(`${row.date}/${row.racecourse_id}`,{date:row.date,venue_label:row.venue_label,racecourse_id:row.racecourse_id,source_url:row.source_url});
  scheduleRows=[...fallback.values()];
}
const detailByMeeting=new Map();
for(const row of detailRows.filter(row=>inWindow(row.date,start,end))){const key=`${row.date}/${row.racecourse_id}`;if(!detailByMeeting.has(key))detailByMeeting.set(key,[]);detailByMeeting.get(key).push(row);}
const records=scheduleRows.map(row=>buildGermanyMeetingRecord(row,detailByMeeting.get(`${row.date}/${row.racecourse_id}`)??[],{checkedAt:generatedAt}));
const rankCounts=Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));
const completionCounts=Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map(name=>[name,records.filter(r=>r.acquisition_completion?.disposition===name).length]));

const artifact={
  schema_version:'germany-deutscher-galopp-official-window-candidates-v1',
  generated_at:generatedAt,country_id:'germany',authority_id:GERMANY_AUTHORITY_ID,racing_system_id:GERMANY_SYSTEM_ID,timezone:GERMANY_TIMEZONE,
  source_id:GERMANY_SOURCE_ID,detail_source_id:GERMANY_SOURCE_ID,collection_target_rank:'best_available',raw_body_retained:false,
  acquisition_attempt:{attempted_at:generatedAt,status:annualStatus==='success'?'success':'network_error',source_id:GERMANY_SOURCE_ID,route_id:'deutscher-galopp-annual-calendar-pdf',error_code:annualStatus==='success'?null:'annual_calendar_fetch_failed'},
  discovery:{method:'official_annual_calendar_pdf_plus_calendar_race_table',schedule_source_url:GERMANY_ANNUAL_PDF_URL,detail_source_url:requestedCalendarUrl,annual_source_status:annualStatus,detail_source_status:detailStatus,annual_rows:annualRows.length,detail_race_rows:detailRows.length,rank_counts:rankCounts,completion_counts:completionCounts},
  window:{start_date:start,end_date_exclusive:end,days,coverage_claim:annualStatus==='success'?'official_annual_calendar_mother_set':'partial_source_visible_horizon',coverage_note:'The official Deutscher Galopp annual 2026 calendar is the gallop meeting-date and venue mother set. The official race calendar table may enrich meetings with published per-race post times through rank A. Unpublished times remain C/pending. Other German horse-racing codes are outside this system scope. Source absence or acquisition failure never proves non-running.'},
  records,
  diagnostics:{source_errors:sourceErrors,parse_failures:parseFailures,annual_source_status:annualStatus,detail_source_status:detailStatus},
};
write(output,artifact);
console.log(JSON.stringify({output,start_date:start,end_date_exclusive:end,annual_rows:annualRows.length,detail_race_rows:detailRows.length,meetings_emitted:records.length,rank_counts:rankCounts,completion_counts:completionCounts,source_errors:sourceErrors.length,parse_failures:parseFailures.length,raw_body_retained:false}));
