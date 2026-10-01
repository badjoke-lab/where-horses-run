import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {ROMANIA_AUTHORITY_ID,ROMANIA_CATEGORY_URL,ROMANIA_SOURCE_ID,ROMANIA_SYSTEM_ID,ROMANIA_TIMEZONE,buildRomaniaPloiestiMeetingRecord,extractPloiestiArticleLinks,parsePloiestiArticleHtml} from './romania-ploiesti-calendar-core.mjs';

function arg(n,f=null){const p='--'+n+'=';const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):f;}
function plusDays(date,count){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){const p=new Intl.DateTimeFormat('en-CA',{timeZone:ROMANIA_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const v=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return v.year+'-'+v.month+'-'+v.day;}
function write(file,value){const t=path.resolve(file);fs.mkdirSync(path.dirname(t),{recursive:true});fs.writeFileSync(t,JSON.stringify(value,null,2)+'\n');}
async function getHtml(url,{timeoutMs=20000}={}){try{const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5','accept-language':'ro-RO,ro;q=0.9,en;q=0.6'},signal:AbortSignal.timeout(timeoutMs)});if(!r.ok)throw new Error('HTTP '+r.status+' '+url);return {html:await r.text(),url:r.url||url};}catch(fetchError){try{const html=execFileSync('curl',['-L','--fail','--silent','--show-error','--max-time',String(Math.ceil(timeoutMs/1000)),'--user-agent','Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','--header','Accept-Language: ro-RO,ro;q=0.9,en;q=0.6',url],{encoding:'utf8',maxBuffer:8*1024*1024});if(!html.trim())throw new Error('curl returned empty body');return {html,url};}catch(curlError){throw new Error('fetch failed; curl fallback failed: '+String(curlError?.message??curlError)+'; fetch error: '+String(fetchError?.message??fetchError));}}}
function ranks(records){return Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));}
function completions(records){return Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map(n=>[n,records.filter(r=>r.acquisition_completion?.disposition===n).length]));}

const output=arg('output'),days=Number(arg('days','30')),start=arg('as-of',localDate());
if(!output)throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start))throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>120)throw new Error('--days must be 1..120');

const end=plusDays(start,days),generatedAt=new Date().toISOString(),sourceErrors=[],parseFailures=[],sourceWarnings=[];
let articleLinks=[],rows=[];
try{
  const category=await getHtml(ROMANIA_CATEGORY_URL);
  articleLinks=extractPloiestiArticleLinks(category.html).slice(0,16);
  if(!articleLinks.length) parseFailures.push({stage:'category_links',source_url:category.url||ROMANIA_CATEGORY_URL,error:'No current CSM Ploiesti horse-racing article links found'});
}catch(e){sourceErrors.push({stage:'category',source_url:ROMANIA_CATEGORY_URL,error:String(e?.message??e)});}

for(const url of articleLinks){
  try{
    const page=await getHtml(url);
    try{
      rows.push(...parsePloiestiArticleHtml(page.html,{sourceUrl:page.url||url}));
    }catch(e){parseFailures.push({stage:'article_parse',source_url:url,error:String(e?.message??e)});}
  }catch(e){sourceWarnings.push({code:'article_fetch_failed',source_url:url,error:String(e?.message??e)});}
}
rows=[...new Map(rows.map(r=>[r.date,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
const windowRows=rows.filter(r=>r.date>=start&&r.date<end);
const records=windowRows.map(r=>buildRomaniaPloiestiMeetingRecord(r,{checkedAt:generatedAt}));
const fatalNetwork=sourceErrors.length>0&&!rows.length;
const fatalParse=parseFailures.length>0&&!rows.length&&!fatalNetwork;
const status=fatalNetwork?'network_error':(fatalParse?'parse_error':'success');
const artifact={
  schema_version:'romania-ploiesti-official-window-candidates-v1',generated_at:generatedAt,country_id:'romania',
  authority_id:ROMANIA_AUTHORITY_ID,racing_system_id:ROMANIA_SYSTEM_ID,timezone:ROMANIA_TIMEZONE,source_id:ROMANIA_SOURCE_ID,
  collection_target_rank:'best_available',raw_body_retained:false,
  acquisition_attempt:{attempted_at:generatedAt,status,source_id:ROMANIA_SOURCE_ID,route_id:'ploiesti-racing-notices',error_code:status==='network_error'?'ploiesti_notice_fetch_failed':(status==='parse_error'?'ploiesti_notice_parse_failed':null)},
  discovery:{method:'official_csm_ploiesti_recent_notices',source_url:ROMANIA_CATEGORY_URL,article_links_checked:articleLinks.length,source_visible_rows:rows.length,rank_counts:ranks(records),completion_counts:completions(records)},
  window:{start_date:start,end_date_exclusive:end,days,coverage_claim:status==='success'?'official_source_visible_horizon':'acquisition_failed_preserve_verified_state',coverage_note:'Official CSM Ploiesti horse-racing notices are scanned for explicit upcoming-meeting statements. Publication dates are never treated as meeting dates. Automatic output is rank C only; wider Romanian coverage is not claimed and source absence is not non-running evidence.'},
  records,diagnostics:{source_errors:status==='success'?[]:sourceErrors,parse_failures:status==='success'?[]:parseFailures,unknown_venues:[],source_warnings:sourceWarnings}
};
write(output,artifact);
console.log(JSON.stringify({output,start_date:start,end_date_exclusive:end,article_links_checked:articleLinks.length,source_visible_rows:rows.length,meetings_emitted:records.length,dates:records.map(r=>r.date),rank_counts:ranks(records),completion_counts:completions(records),source_errors:artifact.diagnostics.source_errors.length,parse_failures:artifact.diagnostics.parse_failures.length,source_warnings:sourceWarnings.length,raw_body_retained:false}));
