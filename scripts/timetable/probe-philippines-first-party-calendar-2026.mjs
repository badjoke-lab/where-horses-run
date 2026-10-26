/**
 * Philippines first-party Calendar access reconnaissance ONLY.
 * Never writes meetings, canonical/public datasets or cached source bodies.
 * A 403/401/429 or robots denial is source-specific: no bypass or alternate proxy.
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SOURCES=[
 {id:'philracom-calendar',country:'philippines',authority:'philracom',url:'https://philracom.gov.ph/racing-calendar/',kind:'government-regulator'},
 {id:'mmtci-race-calendar',country:'philippines',authority:'metro-manila-turf-club',url:'https://mmtci.com/',kind:'racecourse-operator'},
 {id:'pjc-trainer-fixtures',country:'philippines',authority:'philippine-jockey-club',url:'https://pjcracing.com/fixtures',kind:'racecourse-operator'},
];
const UA='WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)';
const outputs=[];
const localDate=()=>new Date().toISOString().slice(0,10);
const dataRange=(s)=>({
 isoDates:[...new Set(s.match(/\b20(?:26|27)-\d{2}-\d{2}\b/g)||[])].length,
 year2026Mentions:(s.match(/\b2026\b/g)||[]).length,
 fixtureCues:/\b(?:race\s*calendar|racing\s*calendar|racing\s*schedule|trainers\s+race\s+planner|fixtures)\b/i.test(s),
 htmlCalendarTables:(s.match(/<table\b/gi)||[]).length,
});
function firstPartyAssetPaths(html,pageUrl){
 // Discover *references only*. Never request bundled JS, private APIs, embedded
 // betting/login pages or third-party frames without an additional source review.
 const base=new URL(pageUrl);
 const paths=[];
 for(const re of [/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi,/<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi]){
  for(const m of html.matchAll(re)){
   try{
    const u=new URL(m[1],base);
    if(u.protocol!=='https:'||u.hostname!==base.hostname)continue;
    if(u.username||u.password)continue;
    paths.push(u.pathname);
   }catch{}
  }
 }
 return [...new Set(paths)].slice(0,20);
}

function checkRobots(body,url,userAgent){
 let global=false,specific=false,blocked=false;
 const target=new URL(url).pathname;
 for(const raw of body.split(/\r?\n/)){
  const line=raw.replace(/#.*$/,'').trim();
  if(!line)continue;
  const m=line.match(/^User-agent:\s*(.+)$/i);
  if(m){const agent=m[1].trim().toLowerCase();global=agent==='*';specific=agent!=='*'&&userAgent.toLowerCase().includes(agent);continue}
  const dis=line.match(/^Disallow:\s*(.*)$/i);
  if(dis&&(global||specific)&&dis[1].trim()){
   const restriction=dis[1].trim();
   if(restriction==='/'||target.startsWith(restriction))blocked=true;
  }
 }
 return blocked;
}
function readPublic(url,approvedHost){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'whr-ph-source-'));
 const outfile=path.join(dir,'body');
 try{
  const raw=execFileSync('curl',[
   '--silent','--show-error','--location','--connect-timeout','8','--max-time','22',
   '--max-filesize','700000','--user-agent',UA,
   '--header','Accept: text/html,application/pdf;q=0.3',
   '--output',outfile,'--write-out','%{http_code}|%{url_effective}|%{content_type}',url
  ],{encoding:'utf8',timeout:26000,maxBuffer:80000});
  const [statusStr,actualUrl,type]=raw.trim().split('|');
  const redirect=new URL(actualUrl);
  if(redirect.protocol!=='https:'||redirect.hostname!==approvedHost)
   throw new Error('unreviewed cross-origin or non-HTTPS redirect');
  const body=fs.existsSync(outfile)?fs.readFileSync(outfile,'utf8'):'';
  return {status:Number(statusStr),type:type||'',body,finalHost:redirect.hostname};
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
}
for(const source of SOURCES){
 const host=new URL(source.url).hostname;
 const record={source_id:source.id,source_family:source.kind,source_url:source.url,
   country_id:source.country,authority_id:source.authority,as_of:localDate(),
   probe_kind:'read_only_aggregate',rights_state:'REVIEW_REQUIRED',
   production_status:'NOT_ROUTED',robots_status:null,page_http_status:null,
   page_size_bucket:null,calendar_signal:null,errors:[],skipped:false};
 try{
  let canRequest=true,robotsBody=null;
  try{
   const robots=readPublic('https://'+host+'/robots.txt',host);
   record.robots_status='http_'+robots.status;
   if(robots.status===200)robotsBody=robots.body;
   if([401,403,429].includes(robots.status))canRequest=false;
   else if(robots.status===200 && checkRobots(robots.body,source.url,UA))canRequest=false;
   else if(robots.status!==200&&robots.status!==404)canRequest=false;
   if(!canRequest)record.errors.push('robots_or_access_policy_block');
  }catch(e){
   canRequest=false;
   record.robots_status='transport_error';
   record.errors.push('robots_transport_error:'+String(e.message).split('\n')[0].slice(0,150));
  }
  if(canRequest){
   const response=readPublic(source.url,host);
   record.page_http_status=response.status;
   if([401,403,429].includes(response.status)){
    record.errors.push('source_access_denied_'+response.status);
   }else if(response.status!==200){
    record.errors.push('source_http_'+response.status);
   }else if(!response.type.toLowerCase().includes('text/html')){
    record.errors.push('source_not_html');
   }else {
    record.page_size_bucket=response.body.length<10000?'small':response.body.length<100000?'medium':'large';
    record.calendar_signal=dataRange(response.body);
    record.first_party_asset_paths=firstPartyAssetPaths(response.body,source.url);
    if(source.id==='mmtci-race-calendar' && record.first_party_asset_paths.includes('/js/calendar1.js')){
     // Public first-party calendar display asset only; no credentials,
     // betting endpoints, dynamic APIs, racecards or venue programme copied.
     const jsUrl=new URL('/js/calendar1.js',source.url).toString();
     if(robotsBody && checkRobots(robotsBody,jsUrl,UA)){
      record.calendar_script={status:'blocked_by_robots'};
     }else{
      try{
       const js=readPublic(jsUrl,host);
       const parsed=js.status===200?dataRange(js.body):null;
       record.calendar_script={status:'http_'+js.status,
        bytes_bucket:js.body.length<10000?'small':js.body.length<100000?'medium':'large',
        structural_calendar_signals:parsed,
        explicit_month_terms:/\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b/i.test(js.body),
        angular_calendar_cues:/\b(?:calendar|raceDate|meetingDate|eventDate|raceSchedule)\b/i.test(js.body)
       };
      }catch(err){record.calendar_script={status:'transport_error',error:String(err.message).split('\n')[0].slice(0,120)}}
     }
    }
   }
  } else record.skipped=true;
 }catch(e){record.errors.push('source_transport_error:'+String(e.message).split('\n')[0].slice(0,150));}
 outputs.push(record);
 console.log('PHILIPPINES_FIRST_PARTY_SOURCE '+JSON.stringify(record));
}
const report={
 schema_version:'philippines-first-party-calendar-access-probe-v1',
 timestamp:new Date().toISOString(),country_id:'philippines',
 publication_allowed:false,source_bodies_retained:false,
 source_scope:'access and structural signals only: official regulator, MMTCI and PJC. No C observations or inferred racing.',
 results:outputs
};
if(process.env.WHR_PH_SOURCE_REPORT){
 fs.mkdirSync(path.dirname(process.env.WHR_PH_SOURCE_REPORT),{recursive:true});
 fs.writeFileSync(process.env.WHR_PH_SOURCE_REPORT,JSON.stringify(report,null,2)+'\n');
}
