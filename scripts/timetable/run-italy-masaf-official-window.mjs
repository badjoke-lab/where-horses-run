import fs from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  ITALY_AUTHORITY_ID, ITALY_GALLOP_SYSTEM_ID, ITALY_NORMATIVA_URL, ITALY_SOURCE_ID,
  ITALY_TIMEZONE, ITALY_TROT_SYSTEM_ID, buildMasafMeetingRecord, parseMasafCalendarPages,
  findLatestMasafCalendarDetailUrl, findMasafCalendarPdfUrl,
} from './italy-masaf-core.mjs';

function arg(name,fallback=null){const p=`--${name}=`;const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):fallback;}
function plusDays(date,count){const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:ITALY_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const v=Object.fromEntries(parts.filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));return `${v.year}-${v.month}-${v.day}`;}
function inWindow(date,start,end){return date>=start&&date<end;}
function write(file,value){const target=path.resolve(file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,`${JSON.stringify(value,null,2)}\n`);}
async function getHtml(url){const response=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5','accept-language':'it-IT,it;q=0.9,en;q=0.6'},signal:AbortSignal.timeout(25000)});if(!response.ok)throw new Error(`HTTP ${response.status}`);return {html:await response.text(),url:response.url||url};}
async function getPdfPages(url){
  const response=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':'application/pdf,*/*;q=0.8','accept-language':'it-IT,it;q=0.9,en;q=0.6'},signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const bytes=new Uint8Array(await response.arrayBuffer());
  if(bytes.length<4||String.fromCharCode(...bytes.slice(0,4))!=='%PDF')throw new Error('MASAF calendar attachment is not PDF');
  const pdf=await getDocument({data:bytes,disableWorker:true}).promise;
  const pages=[];
  for(let pageNumber=1;pageNumber<=pdf.numPages;pageNumber+=1){
    const page=await pdf.getPage(pageNumber);const content=await page.getTextContent();
    pages.push({page_number:pageNumber,items:content.items.filter(i=>'str' in i).map(i=>({str:i.str,x:i.transform?.[4]??0,y:i.transform?.[5]??0}))});
  }
  return pages;
}

const gallopOutput=arg('gallop-output');const trotOutput=arg('trot-output');const days=Number(arg('days','30'));const start=arg('as-of',localDate());
if(!gallopOutput||!trotOutput)throw new Error('--gallop-output=<path> and --trot-output=<path> are required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start))throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>62)throw new Error('--days must be 1..62');
const end=plusDays(start,days);const generatedAt=new Date().toISOString();
const sourceErrors=[];let detailUrl=null;let pdfUrl=null;let parsed={records:[],parse_failures:[],unknown_venues:[]};let status='success';
try{
  const normative=await getHtml(ITALY_NORMATIVA_URL);
  detailUrl=findLatestMasafCalendarDetailUrl(normative.html,normative.url);
  const detail=await getHtml(detailUrl);
  pdfUrl=findMasafCalendarPdfUrl(detail.html,detail.url);
  const pages=await getPdfPages(pdfUrl);
  parsed=parseMasafCalendarPages(pages,{year:Number(start.slice(0,4)),sourceUrl:pdfUrl});
}catch(error){status='source_error';sourceErrors.push({stage:'masaf_current_calendar',source_url:pdfUrl??detailUrl??ITALY_NORMATIVA_URL,error:String(error?.message??error)});}
const current=parsed.records.filter(row=>inWindow(row.date,start,end));
const gallopRecords=current.filter(row=>row.system==='gallop').map(row=>buildMasafMeetingRecord(row,{checkedAt:generatedAt}));
const trotRecords=current.filter(row=>row.system==='trot').map(row=>buildMasafMeetingRecord(row,{checkedAt:generatedAt}));
function artifact(systemId,records){
  const rankCounts=Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));
  const completionCounts=Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map(name=>[name,records.filter(r=>r.acquisition_completion?.disposition===name).length]));
  return {schema_version:'italy-masaf-official-window-candidates-v1',generated_at:generatedAt,country_id:'italy',authority_id:ITALY_AUTHORITY_ID,racing_system_id:systemId,timezone:ITALY_TIMEZONE,source_id:ITALY_SOURCE_ID,detail_source_id:null,collection_target_rank:'best_available',raw_body_retained:false,acquisition_attempt:{attempted_at:generatedAt,status:status==='success'?'success':'network_error',source_id:ITALY_SOURCE_ID,route_id:'masaf-current-calendar-pdf',error_code:status==='success'?null:'calendar_fetch_failed'},discovery:{method:'latest_masaf_calendar_modification_page_to_allegato_1_pdf',normativa_url:ITALY_NORMATIVA_URL,detail_url:detailUrl,pdf_url:pdfUrl,annual_rows:parsed.records.length,rank_counts:rankCounts,completion_counts:completionCounts},window:{start_date:start,end_date_exclusive:end,days,coverage_claim:status==='success'?'official_national_calendar_mother_set':'acquisition_failed_preserve_verified_state',coverage_note:'MASAF ALLEGATO n. 1 is the current official 2026 national horse-racing calendar. It supplies meeting date, venue and racing-code context only; race times are not inferred. Source absence or acquisition/parser failure never proves non-running.'},records,diagnostics:{source_errors:sourceErrors,parse_failures:parsed.parse_failures,unknown_venues:parsed.unknown_venues}};
}
const gallopArtifact=artifact(ITALY_GALLOP_SYSTEM_ID,gallopRecords);const trotArtifact=artifact(ITALY_TROT_SYSTEM_ID,trotRecords);
write(gallopOutput,gallopArtifact);write(trotOutput,trotArtifact);
console.log(JSON.stringify({gallop_output:gallopOutput,trot_output:trotOutput,start_date:start,end_date_exclusive:end,detail_url:detailUrl,pdf_url:pdfUrl,annual_rows:parsed.records.length,gallop_meetings:gallopRecords.length,trot_meetings:trotRecords.length,gallop_rank_counts:gallopArtifact.discovery.rank_counts,trot_rank_counts:trotArtifact.discovery.rank_counts,source_errors:sourceErrors.length,parse_failures:parsed.parse_failures.length,unknown_venues:parsed.unknown_venues.length,raw_body_retained:false}));
