/**
 * Bounded read-only Malta Racing Club 2026 source probe.
 * No publishing, no persistence of source bodies or calendar candidates.
 */
const BASE='https://maltaracingclub.com';
const UA='WhereHorsesRun/1.0 (+https://github.com/badjoke-lab/where-horses-run)';
const sources=[
  ['calendar',BASE+'/index.php/calendar.php'],
  ['news',BASE+'/news.php?p=1'],
  ['home',BASE+'/'],
  ['robots',BASE+'/robots.txt'],
];
const allowed=new Set(['maltaracingclub.com','www.maltaracingclub.com']);
const results=[];
for(const [name,url] of sources){
  try {
    const r=await fetch(url,{redirect:'follow',headers:{'user-agent':UA,accept:'text/html,text/plain;q=0.9'},signal:AbortSignal.timeout(18000)});
    if(!allowed.has(new URL(r.url).hostname)) throw Error('Unexpected redirect host');
    if(!r.ok){results.push({name,http:r.status,final_host:new URL(r.url).hostname,status:'source_blocked_not_ready'});console.log('MALTA_SOURCE_BLOCKED '+JSON.stringify(results.at(-1)));continue;}
    const body=await r.text();
    if(body.length>2_000_000) throw Error('Unexpected large page');
    const links=[...body.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)].map(m=>m[1].replaceAll('&amp;','&'));
    const relevant=[...new Set(links.filter(x=>/calendar|newsdetails|meeting|fixture|\.pdf/i.test(x)))].slice(0,30);
    const dates=[...new Set([...body.matchAll(/(?:\b\d{1,2}\s+(?:october|november|december)\s+2026\b|\b2026[-/]\d\d[-/]\d\d\b)/gi)].map(x=>x[0]))].slice(0,50);
    const item={name,http:r.status,final_host:new URL(r.url).hostname,bytes:body.length,
      current_year_marker:/2026/.test(body),calendar_2026_news:/Racing Calendar till the end of 2026/i.test(body),
      no_upcoming_events:/No upcoming events scheduled/i.test(body),dates,links:relevant};
    results.push(item);console.log('MALTA_SOURCE '+JSON.stringify(item));
  }catch(e){const item={name,error:String(e?.message??e)};results.push(item);console.log('MALTA_SOURCE '+JSON.stringify(item));}
}
console.log('MALTA_PROBE_RESULT '+JSON.stringify({scope:'malta-2026-current-official-fixtures',probe_only:true,publication_changed:false,source_reachable:results.some(x=>x.http===200&&x.name==='calendar'),production_ready:false,results}));
