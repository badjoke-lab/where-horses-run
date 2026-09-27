import fs from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  SPAIN_AUTHORITY_ID,
  SPAIN_AUTUMN_PDF_URL,
  SPAIN_JCE_AUTUMN_PDF_URL,
  SPAIN_AUTUMN_PDF_FALLBACK_URL,
  SPAIN_SOURCE_ID,
  SPAIN_SYSTEM_ID,
  SPAIN_TIMEZONE,
  SPAIN_RACECOURSE_ID,
  buildZarzuelaMeetingRecord,
  parseZarzuelaAutumnProgrammeText,
} from './spain-zarzuela-core.mjs';

function arg(name, fallback = null) { const p=`--${name}=`; const v=process.argv.find((x)=>x.startsWith(p)); return v ? v.slice(p.length) : fallback; }
function plusDays(date,count){const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:SPAIN_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const v=Object.fromEntries(parts.filter((p)=>p.type!=='literal').map((p)=>[p.type,p.value]));return `${v.year}-${v.month}-${v.day}`;}
function inWindow(date,start,end){return date>=start&&date<end;}
function write(file,value){const target=path.resolve(file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,`${JSON.stringify(value,null,2)}\n`);}
async function getPdfText(url){const response=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':'application/pdf,*/*;q=0.8','accept-language':'es-ES,es;q=0.9,en;q=0.7'},signal:AbortSignal.timeout(20000)});if(!response.ok)throw new Error(`HTTP ${response.status}`);const bytes=new Uint8Array(await response.arrayBuffer());if(bytes.length<4||String.fromCharCode(...bytes.slice(0,4))!=='%PDF')throw new Error('Zarzuela programme response is not PDF');const pdf=await getDocument({data:bytes,disableWorker:true}).promise;const lines=[];for(let pageNumber=1;pageNumber<=pdf.numPages;pageNumber+=1){const page=await pdf.getPage(pageNumber);const content=await page.getTextContent();let line='';for(const item of content.items){if(!('str' in item))continue;const value=item.str.replace(/\s+/g,' ').trim();if(value)line+=`${line?' ':''}${value}`;if(item.hasEOL&&line){lines.push(line);line='';}}if(line)lines.push(line);}return lines.join('\n');}

const output=arg('output');const days=Number(arg('days','30'));const start=arg('as-of',localDate());
if(!output)throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start))throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>62)throw new Error('--days must be 1..62');
const end=plusDays(start,days);const generatedAt=new Date().toISOString();
const sourceErrors=[];const parseFailures=[];let annualRows=[];let annualStatus='source_error';let scheduleSourceUrl=SPAIN_AUTUMN_PDF_URL;
for(const sourceUrl of [SPAIN_JCE_AUTUMN_PDF_URL,SPAIN_AUTUMN_PDF_URL,SPAIN_AUTUMN_PDF_FALLBACK_URL]){
  try{
    const text=await getPdfText(sourceUrl);
    annualRows=parseZarzuelaAutumnProgrammeText(text,{year:Number(start.slice(0,4)),sourceUrl});
    annualStatus='success';
    scheduleSourceUrl=sourceUrl;
    break;
  }catch(error){
    sourceErrors.push({stage:'autumn_programme_pdf',source_url:sourceUrl,error:String(error?.message??error)});
  }
}

const scheduleRows=annualRows.filter((row)=>inWindow(row.date,start,end));
const records=scheduleRows.map((row)=>buildZarzuelaMeetingRecord(row,[],{
  checkedAt:generatedAt,
  detailStatus:'available',
  detailUrl:null,
}));
const rankCounts=Object.fromEntries(['C','B','B+','A','A+'].map((rank)=>[rank,records.filter((r)=>r.capability_rank===rank).length]));
const completionCounts=Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map((name)=>[name,records.filter((r)=>r.acquisition_completion?.disposition===name).length]));
const scheduleRecovered=annualStatus==='success';
const artifact={schema_version:'spain-zarzuela-official-window-candidates-v1',generated_at:generatedAt,country_id:'spain',authority_id:SPAIN_AUTHORITY_ID,racing_system_id:SPAIN_SYSTEM_ID,timezone:SPAIN_TIMEZONE,source_id:SPAIN_SOURCE_ID,detail_source_id:SPAIN_SOURCE_ID,collection_target_rank:'best_available',raw_body_retained:false,acquisition_attempt:{attempted_at:generatedAt,status:scheduleRecovered?'success':'network_error',source_id:SPAIN_SOURCE_ID,route_id:'zarzuela-approved-programme-pdf',error_code:scheduleRecovered?null:'programme_fetch_failed'},discovery:{method:'jce_approved_zarzuela_programme_pdf',schedule_source_url:scheduleSourceUrl,annual_rows:annualRows.length,rank_counts:rankCounts,completion_counts:completionCounts},window:{start_date:start,end_date_exclusive:end,days,coverage_claim:annualStatus==='success'?'official_season_programme_mother_set':'acquisition_failed_preserve_verified_state',coverage_note:'The Jockey Club Español-approved Hipódromo de la Zarzuela autumn programme is the production meeting mother set and supplies verified meeting identity/date through rank C. The organizer-hosted detail pages are not production-connected while their TLS chain is not reliably reachable from GitHub Actions. No higher detail rank is claimed until a stable official route is independently verified. Wider Spanish venue and racing-code coverage remains outside this bounded subsystem.'},records,diagnostics:{source_errors:sourceErrors,parse_failures:parseFailures,annual_source_status:annualStatus}};
write(output,artifact);
console.log(JSON.stringify({output,start_date:start,end_date_exclusive:end,annual_rows:annualRows.length,meetings_emitted:records.length,rank_counts:rankCounts,completion_counts:completionCounts,source_errors:sourceErrors.length,parse_failures:parseFailures.length,raw_body_retained:false}));
