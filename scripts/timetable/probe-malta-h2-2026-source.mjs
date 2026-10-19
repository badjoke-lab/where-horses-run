/**
 * Source-discovery only: Malta Racing Club 2026 Q4 published schedule.
 * No production observations, no source HTML/image/PDF or racecard retained.
 * HTTP success or visible fixtures do not constitute permission for recurring
 * extraction or republication. Respect denial/403; do not bypass.
 */
const headers = {
  'user-agent': 'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)',
  accept: 'text/html,text/plain;q=0.9',
};
const roots = new Set(['maltaracingclub.com','www.maltaracingclub.com']);
const targets = [
  {id:'robots',url:'https://www.maltaracingclub.com/robots.txt'},
  {id:'news_current',url:'https://www.maltaracingclub.com/news.php?p=1'},
  {id:'calendar',url:'https://www.maltaracingclub.com/calendar.php'},
  {id:'calendar_legacy',url:'https://maltaracingclub.com/index.php/calendar.php'},
];
function collectLinks(html,base){
 const all=[...html.matchAll(/(?:href|src)\s*=\s*["']([^"'<>]{1,320})["']/gi)].map(x=>x[1]);
 return [...new Set(all)].flatMap(x=>{
  try{const u=new URL(x.replaceAll('&amp;','&'),base);if(!roots.has(u.hostname))return [];
   if(!/(calendar|newsdetails|2026|terms|privacy|pdf|\.png|\.jpe?g)/i.test(u.pathname))return [];
   return [u.origin+u.pathname+(u.search&&u.pathname.includes('newsdetails')?u.search:'')];
  }catch{return []}
 }).slice(0,28);
}
function probePrint(id,data){console.log('MALTA_SOURCE '+JSON.stringify({source:id,...data}));}
let robotsText='';
for(const t of targets){
 try{
  const response=await fetch(t.url,{headers,signal:AbortSignal.timeout(18000),redirect:'follow'});
  const u=new URL(response.url);
  if(!roots.has(u.hostname)){probePrint(t.id,{status:'redirect_unreviewed',http:response.status});continue}
  if(!response.ok){probePrint(t.id,{status:'not_accessible',http:response.status});continue}
  const size=Number(response.headers.get('content-length')||0);
  if(size>1250000){probePrint(t.id,{status:'source_too_large'});continue}
  const type=(response.headers.get('content-type')||'').toLowerCase();
  if(!type.includes('html')&&!type.includes('text/plain')){probePrint(t.id,{status:'unexpected_media_type',type:type.split(';')[0]});continue}
  const body=await response.text();
  if(body.length>1250000){probePrint(t.id,{status:'source_too_large'});continue}
  if(t.id==='robots'){
   robotsText=body;
   probePrint(t.id,{status:'readable',http:response.status,robot_directives:body.split(/\r?\n/).filter(x=>/^\s*(?:User-agent|Disallow|Allow):/i.test(x)).slice(0,35)});
   continue;
  }
  const denyAll=/User-agent:\s*\*\s*(?:\r?\n)(?:[^\r\n]*\r?\n)*?Disallow:\s*\/\s*(?:\r?\n|$)/i.test(robotsText);
  if(denyAll){probePrint(t.id,{status:'robots_disallow_all_probe_not_used'});continue}
  const text=body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ');
  const newsPhrase=/racing\s+calend(?:a|ar)r?\s+till\s+the\s+end\s+of\s+2026/i.test(text);
  const dates=[...new Set([...(text.match(/\b(?:\d{1,2}\s+(?:October|November|December)\s+2026|2026[-/]\d{1,2}[-/]\d{1,2})\b/gi)||[])])].slice(0,40);
  const links=collectLinks(body,response.url);
  probePrint(t.id,{status:'readable',http:response.status,bytes:body.length,
    q4_2026_announcement:newsPhrase,dates_seen:dates,
    official_internal_link_hints:links,
    has_calendar_word:/calendar/i.test(text),
    result_class:dates.length?'visible_dates_require_semantic_and_rights_review':newsPhrase?'announcement_no_parseable_dates':'no_current_dated_fixture_evidence'
  });
 }catch(e){probePrint(t.id,{status:'fetch_failed',reason:String(e?.name||e?.message||e).slice(0,90)})}
}
console.log('MALTA_PROBE_COMPLETION source_discovery_only_no_calendar_candidate_no_rights_clearance');
