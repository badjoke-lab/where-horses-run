/**
 * Indonesia 2026 Piala Raja HB X Cup: read-only SOURCE RECONCILIATION.
 * Never inserts meeting dates or reads any racecard, media, betting or API.
 * Purpose: independently check one organiser fixture article against an
 * independently published public-information schedule with a different date.
 * A successful probe is NOT permission to publish or a production collector.
 */
const sources=[
 {id:'sarga_organiser',url:'https://news.sarga.co/id/event/jadwal-kalender-pacuan-kuda-indonesias-horse-racing-2026-delapan-seri-bergengsi-siap-digelar-mvk.html'},
 {id:'infopublik_public_information',url:'https://infopublik.id/kategori/nasional-sosial-budaya/960088/empat-pordasi-tetapkan-agenda-kompetisi-2026'}
];
const ua='WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)';
const requestHeaders={'user-agent':ua,accept:'text/html,text/plain;q=0.9'};
function visibleText(html){
 return String(html).replace(/<script\\b[^>]*>[\\s\\S]*?<\\/script>/gi,' ')
  .replace(/<style\\b[^>]*>[\\s\\S]*?<\\/style>/gi,' ')
  .replace(/<[^>]*>/g,' ').replace(/&(?:nbsp|#160);/gi,' ')
  .replace(/&amp;/gi,'&').replace(/\\s+/g,' ').trim();
}
function sourceSignals(html){
 const text=visibleText(html);
 const anchor=/Piala\\s+Raja\\s+(?:HB\\s*X|Hamengku\\s+Buwono\\s*X)\\s+Cup\\s+2026/i.exec(text);
 const context=anchor?text.slice(Math.max(0,anchor.index-160),anchor.index+400):'';
 const dates=[];
 if(/(?:6\\s+Desember\\s+2026|6\\s+December\\s+2026)/i.test(context) && /Sultan\\s+Agung/i.test(context))dates.push('2026-12-06');
 // Government's 2026 annual-agenda notice names a planned November date.
 // This is a conflict signal, NOT a cancellation or a final revised date.
 if(/(?:15\\s+November\\s+(?:2026)?)/i.test(context) && /Sultan\\s+Agung/i.test(context))dates.push('2026-11-15');
 return {event_named:Boolean(anchor),venue_named:/Sultan\\s+Agung/i.test(context),
  date_claims:[...new Set(dates)],race_meetings_confirmed:false};
}
function robotsAllowed(body,target){
 const path=new URL(target).pathname;
 const blocks=[];let agents=[],rules=[];let hasDirective=false;
 const flush=()=>{if(agents.length)blocks.push({agents:[...agents],rules:[...rules]});agents=[];rules=[];hasDirective=false;};
 for(const raw of body.split(/\\r?\\n/)){
  const line=raw.replace(/#.*$/,'').trim();
  if(!line)continue;
  const m=line.match(/^user-agent:\\s*(.+)$/i);
  if(m){if(hasDirective)flush();agents.push(m[1].trim().toLowerCase());continue;}
  const d=line.match(/^(allow|disallow):\\s*(.*)$/i);
  if(d&&agents.length){hasDirective=true;rules.push({kind:d[1].toLowerCase(),path:d[2].trim()});}
 }
 flush();
 const relevant=blocks.filter(b=>b.agents.some(a=>a==='*'||ua.toLowerCase().includes(a)));
 const matching=relevant.flatMap(b=>b.rules)
   .filter(x=>x.path && (x.path==='/'||path.startsWith(x.path)))
   .sort((a,b)=>b.path.length-a.path.length);
 return matching.length===0||matching[0].kind==='allow';
}
async function fetchBounded(url){
 const response=await fetch(url,{headers:requestHeaders,redirect:'manual',signal:AbortSignal.timeout(17000)});
 if(response.status!==200)return {status:'http_'+response.status};
 if((new URL(response.url)).origin!==(new URL(url)).origin)return {status:'unexpected_origin'};
 if(!/^text\\/(?:html|plain)(?:;|$)/i.test(response.headers.get('content-type')||''))return {status:'unexpected_content_type'};
 const size=Number(response.headers.get('content-length')||0);
 if(size>650000)return {status:'too_large'};
 const body=await response.text();
 if(body.length>650000)return {status:'too_large'};
 return {status:'ok',body};
}
async function check(source){
 const url=new URL(source.url);
 const robotsUrl=url.origin+'/robots.txt';
 try{
  const robots=await fetchBounded(robotsUrl);
  if(robots.status!=='ok')return {source_id:source.id,status:'robots_'+robots.status,claims:[]};
  if(!robotsAllowed(robots.body,url.href))return {source_id:source.id,status:'robots_denied',claims:[]};
  const page=await fetchBounded(url.href);
  if(page.status!=='ok')return {source_id:source.id,status:page.status,claims:[]};
  const signals=sourceSignals(page.body);
  return {source_id:source.id,status:'readable',claims:signals.date_claims,
   event_named:signals.event_named,venue_named:signals.venue_named};
 }catch(error){return {source_id:source.id,status:'request_error',error_type:String(error?.name||'Error').slice(0,60),claims:[]};}
}
function selfTest(){
 const tests=[
  ['Piala Raja HB X Cup 2026 akan berlangsung di Sultan Agung pada 6 Desember 2026',['2026-12-06']],
  ['Piala Raja HB X Cup 2026 direncanakan 15 November di Stadion Sultan Agung',['2026-11-15']],
  ['Piala Raja HB X Cup 2026 diumumkan; lokasi belum ditentukan',[]],
  ['Pertandingan sepak bola 6 Desember 2026 di Sultan Agung',[]]
 ];
 for(const [s,expected]of tests){
  if(JSON.stringify(sourceSignals(s).date_claims)!==JSON.stringify(expected))throw Error('source signal self-test failure');
 }
 if(robotsAllowed('User-agent: *\\nDisallow: /id/','https://news.sarga.co/id/event/foo'))throw Error('robots denial test failure');
 if(!robotsAllowed('User-agent: *\\nDisallow: /private/','https://news.sarga.co/id/event/foo'))throw Error('robots allowance test failure');
 console.log('INDONESIA_DEC2026_SELF_TEST_PASS');
}
if(process.argv.includes('--self-test'))selfTest();
else{
 const results=[];
 for(const s of sources)results.push(await check(s));
 const distinct=[...new Set(results.flatMap(x=>x.claims))];
 console.log('INDONESIA_DEC2026_SCOPED_PROBE '+JSON.stringify({
  checked_at:new Date().toISOString(),source_results:results,
  date_conflict:distinct.length>1,source_visible_date_claims:distinct,
  status:'DISCOVERY_ONLY',production_routing:false,canonical_writes:false,
  public_writes:false,rights_status:'REVIEW_REQUIRED',
  blocker:'Current date/venue conflict resolution and source/method/publication terms review required. No national coverage.'
 }));
}
