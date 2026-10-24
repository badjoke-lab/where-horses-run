/**
 * Malta Equidrome independently operated official fixture source probe.
 * This does not use Malta Racing Club's 403 pages or third-party mirrors.
 * Read-only; no persistent page or racecard storage, no Calendar publication.
 */
const host='www.maltaequidrome.com';
const urls=[
 {id:'robots',path:'/robots.txt'},
 {id:'terms',path:'/terms-conditions/'},
 {id:'trot_oct',path:'/trot/?mon=10&y=2026'},
 {id:'trot_nov',path:'/trot/?mon=11&y=2026'},
 {id:'trot_dec',path:'/trot/?mon=12&y=2026'},
 {id:'events_oct',path:'/events/?month=10&year=2026'},
];
const headers={'user-agent':'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)','accept':'text/html,text/plain;q=0.9'};
const output=(id,record)=>console.log('MALTA_EQUIDROME '+JSON.stringify({id,...record}));
let robotText='',termsText='',blocked=false;
for(const t of urls){
 if(blocked){output(t.id,{status:'skipped_because_site_restriction'});continue}
 const url='https://'+host+t.path;
 try{
  const r=await fetch(url,{headers,redirect:'follow',signal:AbortSignal.timeout(22000)});
  if(new URL(r.url).hostname!==host){output(t.id,{status:'unreviewed_redirect',http:r.status});continue}
  if(!r.ok){output(t.id,{status:'http_denied_or_failed',http:r.status});continue}
  const kind=(r.headers.get('content-type')||'').toLowerCase();
  if(!/text\/html|text\/plain/.test(kind)){output(t.id,{status:'not_text',content_type:kind.split(';')[0]});continue}
  if(Number(r.headers.get('content-length')||0)>1100000){output(t.id,{status:'too_large'});continue}
  const html=await r.text();
  if(html.length>1100000){output(t.id,{status:'too_large'});continue}
  if(t.id==='robots'){
   robotText=html;
   const directives=html.split(/\r?\n/).filter(s=>/^\s*(?:User-agent|Disallow|Allow):/i.test(s)).slice(0,40);
   const denyAll=/User-agent:\s*\*\s*\r?\n\s*Disallow:\s*\/\s*(?:\r?\n|$)/i.test(html);
   output(t.id,{status:'readable',http:r.status,directives,deny_all:denyAll});
   if(denyAll)blocked=true;
   continue;
  }
  let text=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/\s+/g,' ');
  if(t.id==='terms'){
   termsText=text;
   let patterns=['robots','automated','scraping','extract','reproduce','permission','copyright','redistribut','commercial','database','license','third party'];
   const indicators=patterns.filter(x=>text.toLowerCase().includes(x));
   output(t.id,{status:'readable',http:r.status,terms_indicators:indicators,needs_human_scope_review:true,bytes:html.length});
   if(/(?:automated\s+(?:tools?|access|collection|scraping)|scraping|data\s+mining).{0,120}(?:prohibit|not\s+permit|forbid)/i.test(text))blocked=true;
   continue;
  }
  // Source snapshots are not saved. Enumerate only narrow calendar identifiers.
  const links=[...html.matchAll(/href\s*=\s*["']([^"']{1,280})["']/gi)].map(x=>x[1]);
  const meeting=[...new Set(links.filter(x=>/\/meeting\/\?id=\d+/.test(x)).map(x=>x.match(/\/meeting\/\?id=(\d+)/)?.[1]).filter(Boolean))].slice(0,35);
  const dates=[...new Set((text.match(/\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+\d{1,2}(?:st|nd|rd|th)?\s+(?:October|November|December)\s+2026\b/gi)||[]))].slice(0,50);
  output(t.id,{status:'readable',http:r.status,source_body_bytes:html.length,date_candidates:dates,meeting_id_count:meeting.length,meeting_id_samples:meeting.slice(0,12),
   source_month_evidence:meeting.length>0&&dates.length>0?'date_and_meeting_links_found':'not_confirmed',
   rights_state:termsText?'terms_seen_needs_source_specific_review':'terms_unavailable_not_clearance'});
 }catch(e){output(t.id,{status:'fetch_error',error:String(e?.name||e?.message||e).slice(0,90)})}
}
console.log('MALTA_EQUIDROME_PROBE_END no_production_candidate_or_publication');
