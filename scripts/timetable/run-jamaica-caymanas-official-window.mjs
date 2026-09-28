import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import {
  JAMAICA_AUTHORITY_ID,JAMAICA_ENTRIES_URL,JAMAICA_ENTRIES_API_URL,JAMAICA_SOURCE_ID,JAMAICA_SYSTEM_ID,JAMAICA_TIMEZONE,
  buildJamaicaMeetingRecord,parseCaymanasEntriesApi,
} from './jamaica-caymanas-core.mjs';

function arg(name,fallback=null){const p=`--${name}=`;const v=process.argv.find(x=>x.startsWith(p));return v?v.slice(p.length):fallback;}
function plusDays(date,count){const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:JAMAICA_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const v=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  return `${v.year}-${v.month}-${v.day}`;
}
function write(file,value){const t=path.resolve(file);fs.mkdirSync(path.dirname(t),{recursive:true});fs.writeFileSync(t,`${JSON.stringify(value,null,2)}\n`);}
async function getJson(url){
  const common={
    'user-agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/153 Safari/537.36',
    'accept-language':'en-JM,en;q=0.9'
  };
  const page=await fetch(JAMAICA_ENTRIES_URL,{redirect:'follow',headers:{...common,accept:'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5'},signal:AbortSignal.timeout(20000)});
  const pageHtml=await page.text();
  const setCookies=typeof page.headers.getSetCookie==='function'?page.headers.getSetCookie():[page.headers.get('set-cookie')].filter(Boolean);
  const cookie=setCookies.map(v=>String(v).split(';')[0]).filter(Boolean).join('; ');
  const csrf=(pageHtml.match(/<meta\b[^>]*name=["']csrf-token["'][^>]*content=["']([^"']+)["'][^>]*>/i)||[])[1]||'';
  const xsrfPair=setCookies.map(v=>String(v).split(';')[0]).find(v=>/^XSRF-TOKEN=/i.test(v))||'';
  const xsrf=xsrfPair?decodeURIComponent(xsrfPair.slice(xsrfPair.indexOf('=')+1)):'';
  const r=await fetch(url,{redirect:'manual',headers:{
    ...common,
    'accept':'application/json, text/plain, */*',
    'x-requested-with':'XMLHttpRequest',
    'referer':JAMAICA_ENTRIES_URL,
    ...(cookie?{'cookie':cookie}:{}),
    ...(csrf?{'x-csrf-token':csrf}:{}),
    ...(xsrf?{'x-xsrf-token':xsrf}:{})
  },signal:AbortSignal.timeout(20000)});
  const text=await r.text();
  if(r.status>=300&&r.status<400) throw new Error('HTTP '+r.status+' redirect '+(r.headers.get('location')??'')+' cookies='+setCookies.length+' csrf='+(csrf?'yes':'no'));
  if(!r.ok) throw new Error('HTTP '+r.status+' content-type='+(r.headers.get('content-type')??''));
  const contentType=r.headers.get('content-type')??'';
  if(!/json/i.test(contentType)&&!/^[\\s]*[\\[{]/.test(text)){
    throw new Error('Non-JSON response '+r.status+' '+contentType+' cookies='+setCookies.length+' csrf='+(csrf?'yes':'no')+' xsrf='+(xsrf?'yes':'no'));
  }
  return {json:JSON.parse(text),url:r.url||url,content_type:contentType};
}

function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}

async function fetchEntriesThroughBrowserSession(){
  const candidates=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'];
  const bin=candidates.find(p=>fs.existsSync(p));
  if(!bin) throw new Error('No supported Chrome/Chromium binary found');
  const port=9222;
  const profile='/tmp/whr-caymanas-'+process.pid;
  const child=spawn(bin,[
    '--headless=new','--disable-gpu','--no-sandbox','--disable-dev-shm-usage',
    '--disable-background-networking','--disable-component-update','--disable-sync',
    '--no-first-run','--no-default-browser-check','--metrics-recording-only',
    '--remote-debugging-address=127.0.0.1','--remote-debugging-port='+port,
    '--user-data-dir='+profile,JAMAICA_ENTRIES_URL
  ],{stdio:'ignore'});
  try{
    let targets=[];
    const deadline=Date.now()+12000;
    while(Date.now()<deadline){
      try{
        const r=await fetch('http://127.0.0.1:'+port+'/json/list',{signal:AbortSignal.timeout(1200)});
        if(r.ok){
          const list=await r.json();
          targets=list.filter(x=>x.type==='page'&&x.webSocketDebuggerUrl);
          if(targets.length) break;
        }
      }catch{}
      await sleep(250);
    }
    if(!targets.length) throw new Error('Chrome DevTools page target unavailable');
    const target=targets.find(x=>String(x.url).includes('caymanasracing.com'))??targets[0];
    const ws=new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('Chrome DevTools websocket timeout')),3000);
      ws.addEventListener('open',()=>{clearTimeout(timer);resolve();},{once:true});
      ws.addEventListener('error',()=>{clearTimeout(timer);reject(new Error('Chrome DevTools websocket error'));},{once:true});
    });
    let seq=0;
    const pending=new Map();
    ws.addEventListener('message',event=>{
      let msg;try{msg=JSON.parse(String(event.data));}catch{return;}
      if(msg.id&&pending.has(msg.id)){
        const h=pending.get(msg.id);pending.delete(msg.id);
        if(msg.error) h.reject(new Error(msg.error.message||'CDP error')); else h.resolve(msg.result);
      }
    });
    const send=(method,params={})=>new Promise((resolve,reject)=>{
      const id=++seq;pending.set(id,{resolve,reject});
      ws.send(JSON.stringify({id,method,params}));
      setTimeout(()=>{if(pending.delete(id)) reject(new Error('CDP '+method+' timeout'));},8000);
    });
    await send('Runtime.enable');
    let result=null;
    for(let attempt=0;attempt<24;attempt++){
      const ready=await send('Runtime.evaluate',{
        expression:"({axiosType:typeof window.axios,readyState:document.readyState,url:location.href})",
        returnByValue:true
      });
      const state=ready?.result?.value??{};
      if(state.axiosType==='function'||state.axiosType==='object'){
        const evaluated=await send('Runtime.evaluate',{
          expression:"(async()=>{try{const r=await window.axios.get('/api/site/racing-information/entries');return {ok:true,status:r.status,contentType:(r.headers&&r.headers['content-type'])||'',data:r.data};}catch(e){return {ok:false,status:(e&&e.response&&e.response.status)||0,contentType:(e&&e.response&&e.response.headers&&e.response.headers['content-type'])||'',error:String(e),data:(e&&e.response&&e.response.data)||null}}})()",
          awaitPromise:true,returnByValue:true
        });
        result=evaluated?.result?.value??null;
        if(result?.ok&&result.data&&typeof result.data==='object') break;
      }
      await sleep(500);
    }
    try{ws.close();}catch{}
    if(!result?.ok) throw new Error('Browser axios API failed status='+String(result?.status??0)+' '+String(result?.error??'').slice(0,180));
    if(!result.data||typeof result.data!=='object') throw new Error('Browser axios API returned non-object payload');
    return {json:result.data,browser:bin,status:result.status,content_type:result.contentType};
  }finally{
    try{child.kill('SIGKILL');}catch{}
    try{fs.rmSync(profile,{recursive:true,force:true});}catch{}
  }
}

const output=arg('output'),days=Number(arg('days','30')),start=arg('as-of',localDate());
if(!output) throw new Error('--output=<path> is required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>62) throw new Error('--days must be 1..62');
const end=plusDays(start,days),generatedAt=new Date().toISOString();
let sourceUrl=JAMAICA_ENTRIES_URL,allRows=[],attemptStatus='success',discoveryMethod='caymanas_entries_official_api';
const sourceErrors=[],parseFailures=[],sourceWarnings=[];
try{
  const fetched=await getJson(JAMAICA_ENTRIES_API_URL);
  allRows=parseCaymanasEntriesApi(fetched.json,{sourceUrl:JAMAICA_ENTRIES_URL});
}catch(apiError){
  const apiMsg=String(apiError?.message??apiError);
  try{
    const browserFetched=await fetchEntriesThroughBrowserSession();
    allRows=parseCaymanasEntriesApi(browserFetched.json,{sourceUrl:JAMAICA_ENTRIES_URL});
    discoveryMethod='caymanas_entries_browser_session_api';
    sourceWarnings.push({code:'caymanas_direct_api_unavailable_browser_session_fallback',source_url:JAMAICA_ENTRIES_API_URL,error:apiMsg,browser:browserFetched.browser,status:browserFetched.status,content_type:browserFetched.content_type});
  }catch(browserError){
    const browserMsg=String(browserError?.message??browserError);
    attemptStatus=/monthly fingerprint|monthly dates|API dates missing|payload/i.test(browserMsg)?'parse_error':'network_error';
    if(attemptStatus==='parse_error') parseFailures.push({code:'caymanas_entries_browser_parse_failed',source_url:JAMAICA_ENTRIES_URL,error:browserMsg,api_error:apiMsg});
    else sourceErrors.push({stage:'caymanas_entries_browser',source_url:JAMAICA_ENTRIES_URL,error:browserMsg,api_error:apiMsg});
  }
}
const rows=allRows.filter(r=>r.date>=start&&r.date<end);
const records=rows.map(r=>buildJamaicaMeetingRecord(r,{checkedAt:generatedAt}));
const rankCounts=Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));
const completionCounts=Object.fromEntries(
  ['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable']
    .map(name=>[name,records.filter(r=>r.acquisition_completion?.disposition===name).length])
);
const artifact={
  schema_version:'jamaica-caymanas-official-window-candidates-v1',
  generated_at:generatedAt,
  country_id:'jamaica',
  authority_id:JAMAICA_AUTHORITY_ID,
  racing_system_id:JAMAICA_SYSTEM_ID,
  timezone:JAMAICA_TIMEZONE,
  source_id:JAMAICA_SOURCE_ID,
  collection_target_rank:'best_available',
  raw_body_retained:false,
  acquisition_attempt:{
    attempted_at:generatedAt,status:attemptStatus,source_id:JAMAICA_SOURCE_ID,route_id:'caymanas-entries-official-api',
    error_code:sourceErrors.length?'caymanas_entries_api_fetch_failed':(parseFailures.length?'caymanas_entries_api_parse_failed':null),
  },
  discovery:{
    method:discoveryMethod,source_url:sourceUrl,source_visible_rows:allRows.length,
    rank_counts:rankCounts,completion_counts:completionCounts,
  },
  window:{
    start_date:start,end_date_exclusive:end,days,
    coverage_claim:sourceErrors.length||parseFailures.length?'acquisition_failed_preserve_verified_state':'official_source_visible_horizon',
    coverage_note:'Caymanas Entries exposes the currently published monthly race-day horizon. Unlisted future dates and later months are not evidence of non-running. This route publishes meeting date and Caymanas Park identity at rank C only.',
  },
  records,
  diagnostics:{source_errors:sourceErrors,parse_failures:parseFailures,unknown_venues:[],source_warnings:sourceWarnings},
};
write(output,artifact);
console.log(JSON.stringify({
  output,start_date:start,end_date_exclusive:end,source_visible_rows:allRows.length,meetings_emitted:records.length,
  dates:records.map(r=>r.date),rank_counts:rankCounts,completion_counts:completionCounts,
  source_errors:sourceErrors.length,parse_failures:parseFailures.length,raw_body_retained:false,
}));
