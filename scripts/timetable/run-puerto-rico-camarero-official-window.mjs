import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {
  PUERTO_RICO_AUTHORITY_ID,
  PUERTO_RICO_SOURCE_ID,
  PUERTO_RICO_SOURCE_URL,
  PUERTO_RICO_SYSTEM_ID,
  PUERTO_RICO_TIMEZONE,
  buildCamareroMeetingRecord,
  parseCamareroEntriesPage
} from './puerto-rico-camarero-calendar-core.mjs';

function arg(n,f=null){const p='--'+n+'=';const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):f;}
function plusDays(date,count){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:PUERTO_RICO_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const v=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  return v.year+'-'+v.month+'-'+v.day;
}
function write(file,value){const t=path.resolve(file);fs.mkdirSync(path.dirname(t),{recursive:true});fs.writeFileSync(t,JSON.stringify(value,null,2)+'\n');}
function ranks(records){return Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));}
function completions(records){return Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map(n=>[n,records.filter(r=>r.acquisition_completion?.disposition===n).length]));}

async function getHtml(url,{timeoutMs=30000}={}){
  try{
    const r=await fetch(url,{
      redirect:'follow',
      headers:{
        'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
        'accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
        'accept-language':'es-PR,es;q=0.9,en;q=0.7'
      },
      signal:AbortSignal.timeout(timeoutMs)
    });
    if(!r.ok) throw new Error('HTTP '+r.status+' '+url);
    return {html:await r.text(),url:r.url||url};
  }catch(fetchError){
    try{
      const html=execFileSync('curl',[
        '-L','--fail','--silent','--show-error',
        '--retry','3','--retry-delay','2','--retry-all-errors',
        '--connect-timeout','20','--max-time',String(Math.ceil(timeoutMs/1000)),
        '--user-agent','Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
        '--header','Accept-Language: es-PR,es;q=0.9,en;q=0.7',
        url
      ],{encoding:'utf8',maxBuffer:12*1024*1024});
      if(!html.trim()) throw new Error('curl returned empty body');
      return {html,url};
    }catch(curlError){
      throw new Error('fetch failed; curl fallback failed: '+String(curlError?.message??curlError)+'; fetch error: '+String(fetchError?.message??fetchError));
    }
  }
}

const output=arg('output'),days=Number(arg('days','30')),start=arg('as-of',localDate());
if(!output) throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>120) throw new Error('--days must be 1..120');

const end=plusDays(start,days),generatedAt=new Date().toISOString();
const sourceErrors=[],parseFailures=[],sourceWarnings=[],allRows=[];
const forwardWeeks=Math.min(18,Math.ceil(days/7)+1);

for(let i=0;i<=forwardWeeks;i++){
  const url=i===0?PUERTO_RICO_SOURCE_URL:PUERTO_RICO_SOURCE_URL+'?semana=-'+i;
  try{
    const page=await getHtml(url);
    try{
      const rows=parseCamareroEntriesPage(page.html,{sourceUrl:page.url||url,allowEmpty:i!==0});
      allRows.push(...rows);
      if(i!==0&&rows.length===0){
        sourceWarnings.push({stage:'future_week_unpublished',source_url:page.url||url,week_offset:i,note:'No official entry dates are published for this future week yet; this is not non-running evidence.'});
      }
    }catch(e){
      if(i===0) parseFailures.push({stage:'current_entries_parse',source_url:page.url||url,error:String(e?.message??e)});
      else sourceWarnings.push({stage:'future_entries_parse',source_url:page.url||url,week_offset:i,error:String(e?.message??e)});
    }
  }catch(e){
    if(i===0) sourceErrors.push({stage:'current_entries_fetch',source_url:url,error:String(e?.message??e)});
    else sourceWarnings.push({stage:'future_entries_fetch',source_url:url,week_offset:i,error:String(e?.message??e)});
  }
}

const rows=[...new Map(allRows.map(r=>[r.date+'|'+r.racecourse_id,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
const status=sourceErrors.length?'network_error':(parseFailures.length?'parse_error':'success');
const inWindow=rows.filter(r=>r.date>=start&&r.date<end);
const records=status==='success'?inWindow.map(r=>buildCamareroMeetingRecord(r,{checkedAt:generatedAt})):[];
const artifact={
  schema_version:'puerto-rico-camarero-official-window-candidates-v1',
  generated_at:generatedAt,
  country_id:'puerto-rico',
  authority_id:PUERTO_RICO_AUTHORITY_ID,
  racing_system_id:PUERTO_RICO_SYSTEM_ID,
  timezone:PUERTO_RICO_TIMEZONE,
  source_id:PUERTO_RICO_SOURCE_ID,
  collection_target_rank:'best_available',
  raw_body_retained:false,
  acquisition_attempt:{
    attempted_at:generatedAt,
    status,
    source_id:PUERTO_RICO_SOURCE_ID,
    route_id:'puerto-rico-camarero-inscripciones',
    error_code:status==='network_error'?'puerto_rico_camarero_fetch_failed':(status==='parse_error'?'puerto_rico_camarero_parse_failed':null)
  },
  discovery:{
    method:'official_camarero_entries',
    source_url:PUERTO_RICO_SOURCE_URL,
    source_visible_rows:rows.length,
    rank_counts:ranks(records),
    completion_counts:completions(records)
  },
  window:{
    start_date:start,
    end_date_exclusive:end,
    days,
    coverage_claim:status==='success'?'official_source_visible_horizon':'acquisition_failed_preserve_verified_state',
    coverage_note:'Automatic production covers only official Camarero Inscripciones dates currently published for forthcoming local race days. Empty future week shells are unpublished horizon, not proof of non-running. The separate reviewed A-capability programme evidence is preserved and not downgraded.'
  },
  records,
  diagnostics:{
    source_errors:sourceErrors,
    parse_failures:parseFailures,
    unknown_venues:[],
    source_warnings:sourceWarnings
  }
};
write(output,artifact);
console.log(JSON.stringify({
  output,
  start_date:start,
  end_date_exclusive:end,
  source_visible_rows:rows.length,
  meetings_emitted:records.length,
  meetings:records.map(r=>({date:r.date,racecourse_id:r.racecourse_id})),
  rank_counts:ranks(records),
  completion_counts:completions(records),
  source_errors:sourceErrors.length,
  parse_failures:parseFailures.length,
  source_warnings:sourceWarnings.length,
  raw_body_retained:false
}));
