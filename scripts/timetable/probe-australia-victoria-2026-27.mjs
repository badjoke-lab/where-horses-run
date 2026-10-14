/**
 * Australian Victorian Thoroughbred 2026/27 current-source access probe.
 * Read-only. Do not publish race information or retain source files.
 * Racing Australia aggregate source is deliberately NOT accessed.
 */
const SOURCE=[
 {key:'vrc',robots:'https://www.vrc.com.au/robots.txt',url:'https://www.vrc.com.au/tickets/',type:'html'},
 {key:'rv',robots:'https://www.racingvictoria.com.au/robots.txt',url:'https://www.racingvictoria.com.au/racing/race-calendar',type:'html'},
 {key:'rv-season',robots:'https://www.racingvictoria.com.au/robots.txt',url:'https://www.racingvictoria.com.au/news/2026/04/30/track-enhancements-and-strategic-initiatives-shape-2026-27-victorian-race-dates',type:'html'},
 {key:'rv-draft-pdf',robots:'https://dxp-cdn.racing.com/robots.txt',url:'https://dxp-cdn.racing.com/api/public/content/Victorian_Race_Dates_2026-27_FINAL-%28EMBARGOED%29-8668576.pdf?v=073e67fe',type:'pdf'}
];
const HEADERS={'user-agent':'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)','accept':'text/html,application/pdf,text/plain;q=0.9'};
const allowed=new Map(),robotsText=new Map();
for(const s of SOURCE){
 const origin=new URL(s.robots).origin;if(robotsText.has(origin))continue;
 try {
  const r=await fetch(s.robots,{headers:HEADERS,redirect:'follow',signal:AbortSignal.timeout(20000)});
  const body=r.ok?(await r.text()).slice(0,120000):'';
  robotsText.set(origin,{http:r.status,body});
  console.log('AUSTRALIA_ROBOTS '+JSON.stringify({origin,http:r.status,lines:body.split(/\r?\n/).filter(x=>/^\s*(?:User-agent|Disallow|Allow|Crawl-delay):/i.test(x)).slice(0,30)}));
 }catch(e){robotsText.set(origin,{http:null,body:''});console.log('AUSTRALIA_ROBOTS '+JSON.stringify({origin,error:String(e?.message??e)}));}
}
const isDisallowed=(url)=>{
 const {origin,pathname}=new URL(url),obj=robotsText.get(origin);
 if(!obj?.body)return false;
 let scope='*',blocked=false;
 for(const line of obj.body.split(/\r?\n/)){
  const a=line.replace(/#.*/,'').trim().match(/^([^:]+):\s*(.*)$/);if(!a)continue;
  const k=a[1].trim().toLowerCase(),v=a[2].trim();
  if(k==='user-agent'){scope=v.toLowerCase();}
  if(k==='disallow'&&(scope==='*'||scope.includes('wherehorsesrun'))&&v&&pathname.startsWith(v.replace(/\*.*$/,'')))blocked=true;
  if(k==='allow'&&(scope==='*'||scope.includes('wherehorsesrun'))&&v&&pathname.startsWith(v.replace(/\*.*$/,'')))blocked=false;
 }
 return blocked;
};
const strip=(s)=>s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
for(const s of SOURCE){
 if(isDisallowed(s.url)){console.log('AUSTRALIA_SOURCE '+JSON.stringify({key:s.key,status:'robots_disallow',publication:'not_evaluated'}));continue;}
 try{
  const r=await fetch(s.url,{headers:HEADERS,redirect:'follow',signal:AbortSignal.timeout(30000)});
  const final=new URL(r.url);if(![new URL(s.url).hostname,'racingvictoria.com.au','www.racingvictoria.com.au'].includes(final.hostname))throw Error('unreviewed redirect host');
  if(!r.ok){console.log('AUSTRALIA_SOURCE '+JSON.stringify({key:s.key,status:'unreachable',http:r.status}));continue}
  if(s.type==='pdf'){
   const bytes=new Uint8Array(await r.arrayBuffer());
   const valid=new TextDecoder().decode(bytes.slice(0,5))==='%PDF-';
   console.log('AUSTRALIA_SOURCE '+JSON.stringify({key:s.key,http:r.status,pdf_magic:valid,bytes:bytes.length,draft_status:'must_confirm_approved_final'}));continue;
  }
  const raw=await r.text(),body=strip(raw);
  const dates=[...new Set([...body.matchAll(/\b(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)(?:day)?[,]?\s+\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[,]?\s+202[67]\b/gi)].map(m=>m[0]))];
  const links=[...raw.matchAll(/href=["']([^"']+)["']/gi)].map(m=>m[1]).filter(x=>/2026|2027|race.date|racing.calendar|pdf|fixture/i.test(x)).slice(0,25);
  console.log('AUSTRALIA_SOURCE '+JSON.stringify({key:s.key,http:r.status,bytes:raw.length,current_2026:body.includes('2026'),season_2027:body.includes('2027'),visible_date_tokens:dates.length,dates:dates.slice(0,32),season_528_reference:/528 race meetings/.test(body),links,publication:'not_evaluated'}));
 }catch(e){console.log('AUSTRALIA_SOURCE '+JSON.stringify({key:s.key,status:'error',error:String(e?.message??e)}))}
}
console.log('AUSTRALIA_PROBE_ONLY: no full-page, racecard or PDF content retained, no public Calendar change');
