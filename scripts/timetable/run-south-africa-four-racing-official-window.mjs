import fs from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { FOUR_RACING_AUTHORITY_ID,FOUR_RACING_FIXTURE_PDF_URL,FOUR_RACING_SOURCE_ID,FOUR_RACING_SYSTEM_ID,SOUTH_AFRICA_TIMEZONE,buildFourRacingMeetingRecord,discoverNationalFixtureVersion,parseFourRacingNationalFixturePages } from './south-africa-four-racing-core.mjs';

function arg(name,fallback=null){const p=`--${name}=`;const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):fallback;}
function plusDays(date,count){const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:SOUTH_AFRICA_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const v=Object.fromEntries(parts.filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));return `${v.year}-${v.month}-${v.day}`;}
function write(file,value){const target=path.resolve(file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,`${JSON.stringify(value,null,2)}\n`);}
async function getPdfPages(url){
 const response=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':'application/pdf,*/*;q=0.8','accept-language':'en-ZA,en;q=0.9'},signal:AbortSignal.timeout(25000)});
 if(!response.ok)throw new Error(`HTTP ${response.status}`);
 const bytes=new Uint8Array(await response.arrayBuffer());
 if(bytes.length<4||String.fromCharCode(...bytes.slice(0,4))!=='%PDF')throw new Error('South Africa national fixture response is not PDF');
 const pdf=await getDocument({data:bytes,disableWorker:true}).promise;const pages=[];
 for(let pageNumber=1;pageNumber<=pdf.numPages;pageNumber+=1){const page=await pdf.getPage(pageNumber);const content=await page.getTextContent();pages.push({page_number:pageNumber,items:content.items.filter(item=>'str'in item).map(item=>({str:item.str,x:item.transform?.[4],y:item.transform?.[5],width:item.width,height:item.height}))});}
 return pages;
}
function counts(records){return Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));}

const output=arg('output');const days=Number(arg('days','30'));const start=arg('as-of',localDate());
if(!output)throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start))throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>62)throw new Error('--days must be 1..62');
const end=plusDays(start,days),generatedAt=new Date().toISOString();
let allRows=[];let parseFailures=[];let unknownVenues=[];let sourceUrl=FOUR_RACING_FIXTURE_PDF_URL;let version=null;const sourceErrors=[];
try{
 const pages=await getPdfPages(FOUR_RACING_FIXTURE_PDF_URL);
 version=discoverNationalFixtureVersion(pages);
 const parsed=parseFourRacingNationalFixturePages(pages,{year:Number(start.slice(0,4)),sourceUrl});
 allRows=parsed.records;parseFailures=parsed.parse_failures;unknownVenues=parsed.unknown_venues;
}catch(error){sourceErrors.push({stage:'national_fixture_pdf',source_url:FOUR_RACING_FIXTURE_PDF_URL,error:String(error?.message??error)});}
const rows=allRows.filter(row=>row.date>=start&&row.date<end);
const records=rows.map(row=>buildFourRacingMeetingRecord(row,{checkedAt:generatedAt}));
const artifact={
 schema_version:'south-africa-four-racing-official-window-candidates-v1',generated_at:generatedAt,country_id:'south-africa',authority_id:FOUR_RACING_AUTHORITY_ID,racing_system_id:FOUR_RACING_SYSTEM_ID,timezone:SOUTH_AFRICA_TIMEZONE,source_id:FOUR_RACING_SOURCE_ID,collection_target_rank:'best_available',raw_body_retained:false,
 acquisition_attempt:{attempted_at:generatedAt,status:sourceErrors.length?'network_error':'success',source_id:FOUR_RACING_SOURCE_ID,route_id:'sa-horseracing-national-fixtures-pdf',error_code:sourceErrors.length?'fixture_pdf_fetch_failed':null},
 discovery:{method:'joint_4racing_race_coast_2026_national_fixture_pdf',source_url:sourceUrl,fixture_version:version,annual_4racing_rows:allRows.length,rank_counts:counts(records)},
 window:{start_date:start,end_date_exclusive:end,days,coverage_claim:sourceErrors.length?'acquisition_failed_preserve_verified_state':'four_racing_operator_scope_from_joint_national_fixture_calendar',coverage_note:'The jointly maintained South Africa 2026 National Fixtures PDF supplies the precise-date mother set for the 4Racing Highveld and Eastern Cape scope. TURF(I/S), VAAL(/CL) and FAIR(P/T/T-P) are normalized to three physical racecourses. No first-race or per-race time is inferred. Source omission, acquisition failure or parser failure never proves non-running.'},
 records,diagnostics:{source_errors:sourceErrors,parse_failures:parseFailures,unknown_venues:unknownVenues,source_warnings:[]}
};
write(output,artifact);
console.log(JSON.stringify({output,start_date:start,end_date_exclusive:end,fixture_version:version,annual_4racing_rows:allRows.length,meetings_emitted:records.length,venues:[...new Set(records.map(r=>r.racecourse_id))].sort(),rank_counts:counts(records),source_errors:sourceErrors.length,parse_failures:parseFailures.length,unknown_venues:unknownVenues.length,raw_body_retained:false}));
