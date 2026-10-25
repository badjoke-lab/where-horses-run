/**
 * Experimental, read-only BTC fixture smoke. No canonical/public writes.
 * Source-specific access and republication rights review remains open.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
 BTC_SOURCE_URL,BTC_SOURCE_ID,BTC_COUNTRY,BTC_AUTHORITY,BTC_SYSTEM,BTC_ZONE,
 parseBtcWinterFixtures2026,buildBtcCMeeting
} from './india-bangalore-winter-2026-core.mjs';
const arg=(key,d=null)=>process.argv.find(x=>x.startsWith('--'+key+'='))?.slice(key.length+3)??d;
const isoLocal=()=>{
 const v=new Intl.DateTimeFormat('en-CA',{timeZone:BTC_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const p=Object.fromEntries(v.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
 return p.year+'-'+p.month+'-'+p.day;
};
const plusDays=(x,n)=>{const d=new Date(x+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const start=arg('as-of',isoLocal()),days=Number(arg('days','30')),output=arg('output');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!Number.isInteger(days)||days<1||days>120)throw Error('valid --as-of and --days 1..120 required');
const end=plusDays(start,days),timestamp=new Date().toISOString();
const source_errors=[],parse_failures=[],source_warnings=[];
const ua='WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)';
const hostIsReviewed=u=>['bangaloreraces.com','www.bangaloreraces.com'].includes(new URL(u).hostname);
const approvedHttps=u=>new URL(u).protocol==='https:'&&hostIsReviewed(u);
let rows=[],sourceBytes=0,robotsStatus='unreviewed';
try{
 const robotsUrl='https://bangaloreraces.com/robots.txt';
 const robot=await fetch(robotsUrl,{headers:{'user-agent':ua},redirect:'follow',signal:AbortSignal.timeout(15000)});
 robotsStatus='http_'+robot.status;
 if(!approvedHttps(robot.url))throw Error('unreviewed robots redirect');
 if([401,403,429].includes(robot.status))throw Error('robots access denied '+robot.status);
 if(robot.ok){
  const text=(await robot.text()).slice(0,100000);
  // Conservative * agent disallow: if potentially blocked, skip acquisition.
  const rules=text.split(/\r?\n/);let applies=false,disallowed=false;
  for(const line of rules){
   const cleaned=line.replace(/#.*$/,'').trim();
   const agent=cleaned.match(/^user-agent:\s*(.*)$/i);
   if(agent){applies=agent[1].toLowerCase()==='*'||ua.toLowerCase().includes(agent[1].toLowerCase());continue}
   if(applies){const rule=cleaned.match(/^disallow:\s*(.*)$/i);if(rule&&rule[1]&&('/Club/Fixtures'.startsWith(rule[1])||rule[1]==='/'))disallowed=true}
  }
  if(disallowed)throw Error('BTC robots disallow fixture path');
 }
 const r=await fetch(BTC_SOURCE_URL,{
  headers:{'user-agent':ua,'accept':'text/html','accept-language':'en-IN,en;q=0.8'},
  redirect:'follow',signal:AbortSignal.timeout(25000)});
 if(!approvedHttps(r.url))throw Error('unreviewed fixture redirect');
 if(!r.ok)throw Error('BTC fixtures HTTP '+r.status);
 const type=(r.headers.get('content-type')||'').toLowerCase();
 if(!type.includes('text/html'))throw Error('BTC fixtures not HTML');
 if(Number(r.headers.get('content-length')||0)>1200000)throw Error('BTC fixtures too large');
 const html=await r.text();sourceBytes=Buffer.byteLength(html);
 if(sourceBytes>1200000)throw Error('BTC fixtures too large');
 rows=parseBtcWinterFixtures2026(html);
}catch(e){
 const message=String(e?.message??e);
 if(/heading|denominator|fixture day|invalid fixture date|duplicate|source horizon|out of order|outside source season/.test(message))
  parse_failures.push({stage:'btc_winter_parse',error:message});
 else source_errors.push({stage:'btc_official_source',error:message});
}
if(end>'2027-03-14')source_warnings.push({note:'No 2027-28 season inference; 2026-27 fixtures end 13 March 2027'});
const status=source_errors.length?'network_error':parse_failures.length?'parse_error':'success';
const visible=status==='success'?rows.filter(r=>r.date>=start&&r.date<end):[];
const records=visible.map(r=>buildBtcCMeeting(r,{checkedAt:timestamp}));
const artifact={
 schema_version:'india-bangalore-winter-2026-27-c-candidate-v1',
 generated_at:timestamp,country_id:BTC_COUNTRY,authority_id:BTC_AUTHORITY,racing_system_id:BTC_SYSTEM,
 timezone:BTC_ZONE,source_id:BTC_SOURCE_ID,rights_decision:'REVIEW_REQUIRED',
 production_status:'DRAFT_NOT_ROUTED',raw_source_retained:false,
 acquisition_attempt:{attempted_at:timestamp,status,source_id:BTC_SOURCE_ID,error_code:status==='success'?null:'btc_'+status},
 discovery:{source_url:BTC_SOURCE_URL,source_visible_rows:rows.length,source_html_bytes:sourceBytes,
   robots_status:robotsStatus,window_visible_rows:records.length,rank_counts:{C:records.length}},
 window:{start_date:start,end_date_exclusive:end,days,coverage_claim:'Bangalore Turf Club official 2026-27 winter fixture dates only; NOT all India'},
 records,diagnostics:{source_errors,parse_failures,unknown_venues:[],source_warnings}
};
if(output){fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(output,JSON.stringify(artifact,null,2)+'\n');}
console.log('INDIA_BANGALORE_C_SOURCE '+JSON.stringify({status,rows:rows.length,dates:records.map(r=>r.date),robotsStatus,source_errors,parse_failures}));
