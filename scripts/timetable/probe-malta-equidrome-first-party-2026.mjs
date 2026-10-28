/**
 * Malta Equidrome first-party, read-only source probe (2026).
 * No meeting insertion, racecard/content/media retention, or other domain.
 */
const ROOT='https://www.maltaequidrome.com',UA='WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)';
const PATHS=[['terms','/terms-conditions/'],['trot_nov','/trot/?mon=11&y=2026'],['events_nov','/events/?month=11&year=2026'],['trot_dec','/trot/?mon=12&y=2026']];
function plain(s){return String(s).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&(?:nbsp|#160);/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();}
function signals(html){
 const t=plain(html);
 const labels=[...new Set(t.match(/\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+\d{1,2}(?:st|nd|rd|th)?\s+(?:November|December)\s+2026\b/gi)||[])].slice(0,20);
 const ids=[...new Set([...html.matchAll(/(?:\/meeting\/?\?id=)(\d+)/gi)].map(x=>x[1]))].slice(0,25);
 return {month_header:/\bNovember\s+2026\b/i.test(t),date_labels:labels,meeting_id_count:ids.length,meeting_id_samples:ids.slice(0,12),calendar_racing_cue:/\b(?:racing calendar|trot|meeting)\b/i.test(t),date_and_meeting_link_visible:labels.length>0&&ids.length>0};
}
function allowed(robots,target){
 const blocks=[];let block={agents:[],rules:[]};
 const flush=()=>{if(block.agents.length)blocks.push(block);block={agents:[],rules:[]}};
 for(const lineRaw of robots.split(/\r?\n/)){
  const line=lineRaw.replace(/#.*/,'').trim();if(!line)continue;
  let m=line.match(/^User-agent:\s*(.+)$/i);
  if(m){if(block.rules.length)flush();block.agents.push(m[1].trim().toLowerCase());continue;}
  m=line.match(/^(Allow|Disallow):\s*(.*)$/i);
  if(m&&block.agents.length)block.rules.push({kind:m[1].toLowerCase(),path:m[2].trim()});
 }
 flush();
 const path=new URL(target,ROOT).pathname;
 const rules=blocks.filter(b=>b.agents.some(a=>a==='*'||UA.toLowerCase().includes(a))).flatMap(b=>b.rules).filter(r=>r.path&&path.startsWith(r.path)).sort((a,b)=>b.path.length-a.path.length||(a.kind==='disallow'?-1:1));
 return !rules.length||rules[0].kind==='allow';
}
async function get(url,max=950000){
 try{
  const r=await fetch(url,{headers:{'User-Agent':UA,Accept:'text/html,text/plain;q=0.9'},redirect:'manual',signal:AbortSignal.timeout(18000)});
  if(r.status!==200)return {status:'http_'+r.status};
  if(new URL(r.url).origin!==new URL(url).origin)return {status:'unexpected_redirect'};
  if(!/^text\/(?:html|plain)\b/i.test(r.headers.get('content-type')||''))return {status:'unexpected_mime'};
  if(Number(r.headers.get('content-length')||0)>max)return {status:'too_large'};
  const body=await r.text();if(body.length>max)return {status:'too_large'};
  return {status:'ok',body};
 }catch(e){return {status:'fetch_error',error_name:String(e?.name||'Error').slice(0,40)};}
}
function tests(){
 if(allowed('User-agent: *\nDisallow: /trot/','/trot/?mon=11'))throw Error('robots deny');
 if(!allowed('User-agent: *\nDisallow: /private/\nAllow: /trot/','/trot/?mon=11'))throw Error('robots allow');
 const hit=signals('<h2>November 2026</h2><a href="/meeting/?id=1090">Sunday, 8th November 2026</a> Trot');
 if(hit.date_labels.length!==1||hit.meeting_id_count!==1||!hit.date_and_meeting_link_visible)throw Error('positive fixture');
 if(signals('November 2026 Coming soon').date_and_meeting_link_visible)throw Error('negative fixture');
 console.log('MALTA_EQUIDROME_FIRST_PARTY_SELF_TEST_PASS');
}
if(process.argv.includes('--self-test'))tests();
else{
 const robots=await get(ROOT+'/robots.txt',150000),out=[];
 if(robots.status!=='ok')out.push({id:'robots',status:robots.status});
 else{
  out.push({id:'robots',status:'ok'});
  for(const [id,path] of PATHS){
   if(!allowed(robots.body,path)){out.push({id,status:'robots_denied'});continue}
   const page=await get(ROOT+path);
   if(page.status!=='ok'){out.push({id,status:page.status});continue}
   if(id==='terms'){
    const t=plain(page.body).toLowerCase();
    const indicators=['automated','scraping','database','commercial','redistribut','reproduc','copyright','permission','data mining','rights reserved'].filter(x=>t.includes(x));
    out.push({id,status:'ok',terms_indicators:indicators,source_specific_review_required:true});
   }else out.push({id,status:'ok',...signals(page.body)});
  }
 }
 console.log('MALTA_EQUIDROME_FIRST_PARTY_PROBE '+JSON.stringify({checked_at:new Date().toISOString(),results:out,
  c_candidate_structurally_visible:out.some(x=>x.date_and_meeting_link_visible===true),
  rights_status:'REVIEW_REQUIRED',production_routing:false,canonical_writes:false,public_writes:false,source_bodies_retained:false}));
}