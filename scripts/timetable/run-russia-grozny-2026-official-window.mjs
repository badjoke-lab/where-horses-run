import fs from 'node:fs';
import path from 'node:path';
import {GROZNY_URL,GROZNY_COUNTRY,GROZNY_AUTHORITY,GROZNY_SOURCE,GROZNY_SYSTEM,GROZNY_ROUTE,GROZNY_TIMEZONE,parseGrozny2026Date,buildGroznyCMeeting} from './russia-grozny-2026-source-core.mjs';
const arg=(k,d)=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??d;
const dayLocal=()=>{
 const pts=new Intl.DateTimeFormat('en-CA',{timeZone:GROZNY_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const p=Object.fromEntries(pts.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
 return p.year+'-'+p.month+'-'+p.day;
};
const plus=(iso,n)=>{const d=new Date(iso+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const start=arg('as-of',dayLocal()),days=Number(arg('days','30')),output=arg('output',null);
if(!output||!/^20\d\d-\d\d-\d\d$/.test(start)||!Number.isInteger(days)||days<1||days>120)throw Error('output, valid as-of, and days 1..120 required');
const end=plus(start,days),checkedAt=new Date().toISOString();
const source_errors=[],parse_failures=[],source_warnings=[];let sourceBytes=0,rows=[],robots_status='not_checked';
const get=async(url)=>{
 const r=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(25000),headers:{
  'user-agent':'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)','accept':'text/html,text/plain;q=0.9'
 }});
 if([301,302,303,307,308].includes(r.status))throw Error('source_redirect_not_reviewed');
 if([401,403,429].includes(r.status))throw Error('source_access_denied_'+r.status);
 if(r.status!==200&&r.status!==404)throw Error('source_http_'+r.status);
 if(r.status===404)return {status:404,html:''};
 if(!/text\/(?:html|plain)/i.test(r.headers.get('content-type')||''))throw Error('source_mime_not_text');
 if(Number(r.headers.get('content-length')||0)>6000000)throw Error('source_too_large');
 const html=await r.text();if(html.length>6000000)throw Error('source_too_large');
 return {status:200,html};
};
try{
 const robots=await get('https://grozny-hippodrom.ru/robots.txt');
 robots_status='http_'+robots.status;
 if(robots.status===200){
  let active=false;
  for (let raw of robots.html.split(/\r?\n/)){
   const line=raw.replace(/#.*/,'').trim();
   if(/^user-agent:/i.test(line)){active=/^user-agent:\s*(?:\*|wherehorsesrun(?:\/1\.0)?)\s*$/i.test(line);continue}
   if(!active)continue;
   const m=line.match(/^disallow:\s*(\S+)/i);
   if(m&&m[1]&&('/docs'.startsWith(m[1])||m[1]==='/'))throw Error('source_robots_disallow_docs');
  }
 }
 const source=await get(GROZNY_URL);if(source.status!==200)throw Error('source_docs_missing');
 sourceBytes=Buffer.byteLength(source.html);
 rows=parseGrozny2026Date(source.html);
}catch(e){
 const error=String(e?.message||e);
 if(/fingerprint|notice|2026 closing/.test(error))parse_failures.push({stage:'grozny_2026_date_parser',error});
 else source_errors.push({stage:'grozny_official_html_fetch',error});
}
const status=source_errors.length?'network_error':parse_failures.length?'parse_error':'success';
const visible=status==='success'?rows.filter(r=>r.date>=start&&r.date<end):[];
const records=visible.map(x=>buildGroznyCMeeting(x,{checkedAt}));
if(end>'2026-10-31')source_warnings.push({note:'Operator-specific 2026 closing date only; no inferred next season'});
const artifact={
 schema_version:'russia-grozny-2026-single-day-c-v1',generated_at:checkedAt,
 country_id:GROZNY_COUNTRY,authority_id:GROZNY_AUTHORITY,racing_system_id:GROZNY_SYSTEM,timezone:GROZNY_TIMEZONE,source_id:GROZNY_SOURCE,
 collection_target_rank:'best_available',raw_body_retained:false,
 acquisition_attempt:{attempted_at:checkedAt,status,source_id:GROZNY_SOURCE,route_id:GROZNY_ROUTE,error_code:status==='success'?null:'grozny_'+status},
 discovery:{method:'operator_first_party_docs_2026_day_11_only',source_url:GROZNY_URL,source_visible_rows:rows.length,window_visible_rows:visible.length,source_html_bytes:sourceBytes,robots_status,rank_counts:{C:records.length}},
 window:{start_date:start,end_date_exclusive:end,days,coverage_claim:status==='success'?'Grozny official 2026 day-11 closing date only; NOT nationwide Russia':'source_failure_keep_last_verified',
 coverage_note:'One 2026 physical racecourse and one official positive date only; no post times, racecards, actual-running or negative cancellation evidence.'},
 records,diagnostics:{source_errors,parse_failures,unknown_venues:[],source_warnings}
};
fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(path.resolve(output),JSON.stringify(artifact,null,2)+'\n');
console.log('RUSSIA_GROZNY_WINDOW '+JSON.stringify({status,source_visible_rows:rows.length,window_rows:records.length,dates:records.map(r=>r.date),robots_status,source_errors,parse_failures}));
