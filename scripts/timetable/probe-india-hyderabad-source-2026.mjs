/**
 * Source-scoped India C route discovery (read-only, non-publishing).
 * Prints small structural diagnostics, not downloaded source text.
 * A 200 is NOT evidence of data rights, nor of current meeting dates.
 */
const sources=[
 {id:'hyderabad-official',url:'https://www.hydraces.com/'},
 {id:'hyderabad-race-calendar',url:'https://www.hydraces.com/racecalendar'},
 {id:'hyderabad-robots',url:'https://www.hydraces.com/robots.txt'},
 {id:'hyderabad-home-host',url:'https://d1mowe151t0ail.cloudfront.net/'},
 {id:'bangalore-club-fixtures',url:'https://www.bangaloreraces.com/Club/Fixtures'},
 {id:'bangalore-robots',url:'https://www.bangaloreraces.com/robots.txt'},
 {id:'rwitc-home',url:'https://www.rwitc.com/'}
];
const allow=new Set(['www.hydraces.com','hydraces.com','d1mowe151t0ail.cloudfront.net','www.bangaloreraces.com','bangaloreraces.com','www.rwitc.com','rwitc.com']);
const eventPattern=/(?:20(?:25|26|27)[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]20(?:25|26|27))/g;
for(const s of sources){
 try{
  const resp=await fetch(s.url,{redirect:'follow',signal:AbortSignal.timeout(18000),headers:{'user-agent':'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)','accept':'text/html,text/plain;q=0.9','accept-language':'en-IN,en;q=0.8'}});
  const location=new URL(resp.url);
  if(!allow.has(location.hostname))throw Error('source redirect to unreviewed domain '+location.hostname);
  if(!resp.ok){console.log('INDIA_SOURCE '+JSON.stringify({id:s.id,http:resp.status,result:'not_usable_without_separate_source'}));continue}
  const len=Number(resp.headers.get('content-length'))||0;if(len>1500000)throw Error('body too large');
  const data=await resp.text();if(data.length>1500000)throw Error('body too large after transfer');
  const dates=[...new Set((data.match(eventPattern)||[]))].slice(0,30);
  const links=[...data.matchAll(/(?:href|src)\s*=\s*["']([^"']{1,350})["']/gi)].map(x=>x[1]);
  const relevant=[...new Set(links.filter(x=>/fixture|racecalendar|race-calendar|raceschedule|race-schedule|calendar|terms|policy/i.test(x)).slice(0,60))];
  const span=data.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
  const markers=['racing fixtures','fixtures','race calendar','winter meeting','2026','2027','racecard','terms','copyright'].filter(x=>span.toLowerCase().includes(x));
  console.log('INDIA_SOURCE '+JSON.stringify({id:s.id,http:resp.status,host:location.hostname,route:location.pathname,bytes:data.length,dates,markers,links:relevant,robots_lines:s.id.includes('robots')?data.split(/\r?\n/).filter(x=>/^(?:User-agent|Disallow|Allow):/i.test(x)).slice(0,50):undefined}));
 }catch(e){console.log('INDIA_SOURCE '+JSON.stringify({id:s.id,error:String(e?.message??e)}));}
}
