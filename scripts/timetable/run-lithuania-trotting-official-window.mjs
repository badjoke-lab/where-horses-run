import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {
  LITHUANIA_API_BASE,LITHUANIA_AUTHORITY_ID,LITHUANIA_SOURCE_ID,LITHUANIA_SYSTEM_ID,LITHUANIA_TIMEZONE,
  buildLithuaniaMeetingRecord,parseLithuaniaEventDetail,racecourseIdForVenueName
} from './lithuania-trotting-calendar-core.mjs';

function arg(n,f=null){const p='--'+n+'=';const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):f;}
function plusDays(date,count){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){const p=new Intl.DateTimeFormat('en-CA',{timeZone:LITHUANIA_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now),v=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return v.year+'-'+v.month+'-'+v.day;}
function write(file,value){const t=path.resolve(file);fs.mkdirSync(path.dirname(t),{recursive:true});fs.writeFileSync(t,JSON.stringify(value,null,2)+'\n');}
function ranks(records){return Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));}
function completions(records){return Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map(n=>[n,records.filter(r=>r.acquisition_completion?.disposition===n).length]));}

async function getText(url,{timeoutMs=30000,accept='text/html,application/json;q=0.9,*/*;q=0.5'}={}){
  try{
    const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':accept,'accept-language':'lt-LT,lt;q=0.9,en;q=0.7'},signal:AbortSignal.timeout(timeoutMs)});
    if(!r.ok) throw new Error('HTTP '+r.status+' '+url);
    return {text:await r.text(),url:r.url||url};
  }catch(fetchError){
    try{
      const text=execFileSync('curl',['-L','--fail','--silent','--show-error','--max-time',String(Math.ceil(timeoutMs/1000)),'--user-agent','Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','--header','Accept-Language: lt-LT,lt;q=0.9,en;q=0.7',url],{encoding:'utf8',maxBuffer:12*1024*1024});
      if(!text.trim()) throw new Error('curl returned empty body');
      return {text,url};
    }catch(curlError){
      throw new Error('fetch failed; curl fallback failed: '+String(curlError?.message??curlError)+'; fetch error: '+String(fetchError?.message??fetchError));
    }
  }
}

const output=arg('output'),days=Number(arg('days','30')),start=arg('as-of',localDate());
if(!output) throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>180) throw new Error('--days must be 1..180');
const end=plusDays(start,days),generatedAt=new Date().toISOString();
const sourceErrors=[],parseFailures=[],sourceWarnings=[],unknownVenues=[],rows=[];
const params=new URLSearchParams({start_date:start+' 00:00:00',end_date:plusDays(end,-1)+' 23:59:59',per_page:'50'});
const apiUrl=LITHUANIA_API_BASE+'?'+params.toString();
let apiEvents=[];
try{
  const page=await getText(apiUrl,{accept:'application/json,text/plain;q=0.9,*/*;q=0.5'});
  try{
    const obj=JSON.parse(page.text);
    apiEvents=(obj.events??[]).filter(e=>/Ristūnų\s+žirgų\s+lenktynės/i.test(String(e?.title??'')));
  }catch(e){parseFailures.push({stage:'events_api_parse',source_url:apiUrl,error:String(e?.message??e)});}
}catch(e){sourceErrors.push({stage:'events_api_fetch',source_url:apiUrl,error:String(e?.message??e)});}

for(const event of apiEvents){
  const date=String(event?.start_date??'').slice(0,10);
  const detailUrl=String(event?.url??'').trim();
  if(!/^20\d{2}-\d{2}-\d{2}$/.test(date)||!detailUrl) {
    parseFailures.push({stage:'event_shape',event_id:event?.id??null,error:'event date or URL missing'});
    continue;
  }
  try{
    const detail=await getText(detailUrl);
    try{
      const parsed=parseLithuaniaEventDetail(detail.text,{sourceUrl:detail.url||detailUrl});
      if(parsed.cancelled||!parsed.event_scheduled){
        sourceWarnings.push({stage:'event_presence',date,source_url:detailUrl,reason:parsed.cancelled?'cancelled_text_present':'scheduled_jsonld_missing'});
        continue;
      }
      const racecourseId=racecourseIdForVenueName(parsed.venue_name);
      if(!racecourseId){
        unknownVenues.push({date,venue_name:parsed.venue_name,source_url:detailUrl});
        continue;
      }
      rows.push({date,racecourse_id:racecourseId,venue_name:parsed.venue_name,source_url:detailUrl});
    }catch(e){parseFailures.push({stage:'event_detail_parse',date,source_url:detailUrl,error:String(e?.message??e)});}
  }catch(e){sourceErrors.push({stage:'event_detail_fetch',date,source_url:detailUrl,error:String(e?.message??e)});}
}
const status=sourceErrors.length?'network_error':(parseFailures.length?'parse_error':'success');
const records=status==='success'?rows.map(r=>buildLithuaniaMeetingRecord(r,{checkedAt:generatedAt})):[];
const artifact={
  schema_version:'lithuania-trotting-official-window-candidates-v1',generated_at:generatedAt,country_id:'lithuania',
  authority_id:LITHUANIA_AUTHORITY_ID,racing_system_id:LITHUANIA_SYSTEM_ID,timezone:LITHUANIA_TIMEZONE,source_id:LITHUANIA_SOURCE_ID,
  collection_target_rank:'best_available',raw_body_retained:false,
  acquisition_attempt:{attempted_at:generatedAt,status,source_id:LITHUANIA_SOURCE_ID,route_id:'trotting-league-events-api-official-window',error_code:status==='network_error'?'lithuania_events_fetch_failed':(status==='parse_error'?'lithuania_events_parse_failed':null)},
  discovery:{method:'official_tribe_events_api_plus_detail',source_url:apiUrl,source_visible_rows:apiEvents.length,meetings_resolved:rows.length,rank_counts:ranks(records),completion_counts:completions(records)},
  window:{start_date:start,end_date_exclusive:end,days,coverage_claim:status==='success'?'official_source_visible_horizon':'acquisition_failed_preserve_verified_state',coverage_note:'Automatic route emits only currently published RLŽL trotting events whose official detail page confirms a reviewed physical venue. Future season dates not yet present in the Events API are not inferred. Page times are not promoted to post times. Source absence/failure is not cancellation evidence.'},
  records,
  diagnostics:{source_errors:sourceErrors,parse_failures:parseFailures,unknown_venues:unknownVenues,source_warnings:sourceWarnings}
};
write(output,artifact);
console.log(JSON.stringify({output,start_date:start,end_date_exclusive:end,source_visible_rows:apiEvents.length,meetings_resolved:rows.length,meetings_emitted:records.length,dates:records.map(r=>r.date),racecourses:records.map(r=>r.racecourse_id),rank_counts:ranks(records),completion_counts:completions(records),source_errors:sourceErrors.length,parse_failures:parseFailures.length,unknown_venues:unknownVenues.length,raw_body_retained:false}));
