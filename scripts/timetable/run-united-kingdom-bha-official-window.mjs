import fs from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  BHA_2026_FIXTURE_PDF_URL,
  BHA_AUTHORITY_ID,
  BHA_FULL_YEAR_URL,
  BHA_SOURCE_ID,
  BHA_SYSTEM_ID,
  UNITED_KINGDOM_TIMEZONE,
  applyReviewedBhaSupplement,
  buildBhaFixtureRecord,
  parseBhaFixturePdfItems,
  parseBhaFullYearPage,
} from './united-kingdom-bha-core.mjs';
import { BHA_NON_RUNNING_SOURCE_ID,BHA_PRESS_RELEASES_URL,bindBhaNonRunningEvidence,discoverBhaNonRunningArticles,parseBhaNonRunningArticle } from './united-kingdom-bha-non-running-evidence.mjs';

function arg(name,fallback=null){
  const value=process.argv.find(item=>item.startsWith(`--${name}=`));
  return value?value.slice(name.length+3):fallback;
}
function plusDays(date,count){
  const d=new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate()+count);
  return d.toISOString().slice(0,10);
}
function localDate(now=new Date()){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:UNITED_KINGDOM_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const values=Object.fromEntries(parts.filter(part=>part.type!=='literal').map(part=>[part.type,part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
function inWindow(date,start,end){return date>=start&&date<end;}
function write(file,value){
  const target=path.resolve(file);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,`${JSON.stringify(value,null,2)}\n`);
}
async function getHtml(url){
  const response=await fetch(url,{
    redirect:'follow',
    headers:{
      'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
      accept:'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
      'accept-language':'en-GB,en;q=0.9',
    },
    signal:AbortSignal.timeout(20000),
  });
  if(!response.ok) throw new Error(`HTTP ${response.status}`);
  return {html:await response.text(),url:response.url||url};
}
async function getPdfItems(url){
  const response=await fetch(url,{
    redirect:'follow',
    headers:{
      'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
      accept:'application/pdf,*/*;q=0.8',
      'accept-language':'en-GB,en;q=0.9',
    },
    signal:AbortSignal.timeout(30000),
  });
  if(!response.ok) throw new Error(`HTTP ${response.status}`);
  const bytes=new Uint8Array(await response.arrayBuffer());
  if(bytes.length<4||String.fromCharCode(...bytes.slice(0,4))!=='%PDF') throw new Error('BHA fixture response is not PDF');
  const pdf=await getDocument({data:bytes,disableWorker:true}).promise;
  const items=[];
  for(let pageNumber=1;pageNumber<=pdf.numPages;pageNumber+=1){
    const page=await pdf.getPage(pageNumber);
    const content=await page.getTextContent();
    for(const item of content.items){
      if(!('str' in item)) continue;
      const value=String(item.str??'').replace(/\s+/g,' ').trim();
      if(!value) continue;
      items.push({
        page:pageNumber,
        str:value,
        x:Number(item.transform?.[4]??0),
        y:Number(item.transform?.[5]??0),
      });
    }
  }
  return items;
}
function readCanonicalMeetings(file){if(!fs.existsSync(file))return [];const data=JSON.parse(fs.readFileSync(file,'utf8'));return Array.isArray(data?.meetings)?data.meetings:[];}
function loadSupplement(){
  const file=path.resolve('data/static/bha-public-timetable-supplement-v1.json');
  if(!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file,'utf8'));
}

const output=arg('output');
const days=Number(arg('days','30'));
const start=arg('as-of',localDate());
const canonicalPath=arg('canonical','data/generated/timetable/canonical/meetings.json');
if(!output) throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>62) throw new Error('--days must be 1..62');
const year=Number(start.slice(0,4));
const end=plusDays(start,days);
if(Number(end.slice(0,4))!==year&&end.slice(5)!=='01-01'){
  throw new Error('BHA window currently requires one fixture-list year; split cross-year refresh at 1 January');
}
const generatedAt=new Date().toISOString();

let landingUrl=BHA_FULL_YEAR_URL;
let fixturePdfUrl=year===2026?BHA_2026_FIXTURE_PDF_URL:null;
const sourceWarnings=[];
try{
  const landing=await getHtml(BHA_FULL_YEAR_URL);
  landingUrl=landing.url;
  fixturePdfUrl=parseBhaFullYearPage(landing.html,{year,sourceUrl:landing.url})??fixturePdfUrl;
}catch(error){
  sourceWarnings.push({stage:'full_year_landing',source_url:BHA_FULL_YEAR_URL,error:String(error?.message??error)});
}
if(!fixturePdfUrl) throw new Error(`No BHA fixture PDF discovered for ${year}`);

const items=await getPdfItems(fixturePdfUrl);
let rows=parseBhaFixturePdfItems(items,{year,sourceUrl:fixturePdfUrl});
const supplement=loadSupplement();
if(supplement) rows=applyReviewedBhaSupplement(rows,supplement);
rows=rows.filter(row=>inWindow(row.date,start,end));
if(!rows.length) throw new Error('BHA fixture PDF produced zero meetings in requested window');

const records=rows.map(row=>buildBhaFixtureRecord(row,{checkedAt:generatedAt}));
const canonicalRows=readCanonicalMeetings(canonicalPath);
const nonRunningArticles=[];const nonRunningEvidence=[];let nonRunningStatus='source_error';let nonRunningSourceUrl=BHA_PRESS_RELEASES_URL;
try{
  const index=await getHtml(BHA_PRESS_RELEASES_URL);nonRunningSourceUrl=index.url;
  const discovery=discoverBhaNonRunningArticles(index.html,{sourceUrl:index.url});
  for(const sourceUrl of discovery.article_urls){
    try{
      const article=await getHtml(sourceUrl);
      const parsed=parseBhaNonRunningArticle(article.html,{sourceUrl:article.url,startDate:start,endDateExclusive:end});
      nonRunningEvidence.push(...parsed.evidence);
      nonRunningArticles.push({source_url:article.url,status:'success',...parsed.diagnostics});
    }catch(error){
      nonRunningArticles.push({source_url:sourceUrl,status:'source_error',error:String(error?.message??error)});
    }
  }
  nonRunningStatus=nonRunningArticles.some(row=>row.status==='source_error')?'partial_success':'success';
}catch(error){
  nonRunningArticles.push({source_url:BHA_PRESS_RELEASES_URL,status:'source_error',error:String(error?.message??error)});
}
const boundNonRunning=bindBhaNonRunningEvidence({evidence:nonRunningEvidence,canonicalMeetings:canonicalRows,checkedAt:generatedAt});
const nonRunningDiagnostics={
  status:nonRunningStatus,source_id:BHA_NON_RUNNING_SOURCE_ID,source_url:nonRunningSourceUrl,
  candidate_article_count:nonRunningArticles.length,accepted_evidence_count:nonRunningEvidence.length,
  confirmed_non_running_count:boundNonRunning.meeting_presence_records.length,
  article_results:nonRunningArticles,binding_skipped:boundNonRunning.diagnostics.skipped,
};
const artifact={
  schema_version:'united-kingdom-bha-official-window-candidates-v1',
  generated_at:generatedAt,
  country_id:'united-kingdom',
  authority_id:BHA_AUTHORITY_ID,
  racing_system_id:BHA_SYSTEM_ID,
  timezone:UNITED_KINGDOM_TIMEZONE,
  source_id:BHA_SOURCE_ID,
  collection_target_rank:'best_available',
  raw_body_retained:false,
  acquisition_attempt:{
    attempted_at:generatedAt,
    status:'success',
    source_id:BHA_SOURCE_ID,
    route_id:'bha-annual-fixture-pdf',
    error_code:null,
  },
  discovery:{
    method:'official_bha_full_year_fixture_pdf_plus_reviewed_transfer_overrides',
    landing_url:landingUrl,
    fixture_pdf_url:fixturePdfUrl,
    annual_rows:items.length,
    reviewed_supplement_applied:Boolean(supplement),
    non_running_source_id:BHA_NON_RUNNING_SOURCE_ID,
    non_running_source_status:nonRunningStatus,
    rank_counts:{C:records.length,B:0,'B+':0,A:0,'A+':0},
  },
  window:{
    start_date:start,
    end_date_exclusive:end,
    days,
    coverage_claim:'official_annual_fixture_list_with_reviewed_overrides',
    coverage_note:'BHA annual fixture-list evidence supplies meeting date and racecourse only. Reviewed BHA transfer corrections are applied where present. Race times are not inferred, and source absence or acquisition failure is never treated as non-running evidence.',
  },
  records,
  meeting_presence_records:boundNonRunning.meeting_presence_records,
  diagnostics:{
    source_warnings:sourceWarnings,
    unknown_venues:[],
    detail_conflict:[],
    non_running:nonRunningDiagnostics,
  },
};
write(output,artifact);
console.log(JSON.stringify({
  output,
  start_date:start,
  end_date_exclusive:end,
  meetings_emitted:records.length,
  rank_counts:artifact.discovery.rank_counts,
  fixture_pdf_url:fixturePdfUrl,
  reviewed_supplement_applied:Boolean(supplement),
  source_warnings:sourceWarnings.length,
  confirmed_non_running_count:artifact.meeting_presence_records.length,
  non_running_source_status:nonRunningStatus,
  raw_body_retained:false,
}));
