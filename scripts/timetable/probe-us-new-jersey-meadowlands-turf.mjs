// Read-only cross-check for the NJRC 2026 nine-day Meadowlands turf allotment.
// Physical venue is Meadowlands; racing code is Thoroughbred turf, not Standardbred.
const ua='WhereHorsesRun/1.0 (+https://github.com/badjoke-lab/where-horses-run)';
for (const url of [
  'https://playmeadowlands.com/events/month/2026-09/',
  'https://playmeadowlands.com/events/month/2026-10/'
]){
  try {
    const r=await fetch(url,{headers:{'user-agent':ua,'accept':'text/html'},signal:AbortSignal.timeout(30000)});
    const html=await r.text();
    const text=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/&#\d+;/g,' ').replace(/\s+/g,' ');
    const hits=[];
    const rx=/Live Turf Racing/gi;
    for(const m of text.matchAll(rx)) hits.push(text.slice(Math.max(0,m.index-130),m.index+230));
    const dateMatches=[...new Set([...html.matchAll(/2026[-/](?:09|10)[-/]\d{2}/g)].map(m=>m[0]))].slice(0,60);
    console.log(JSON.stringify({url,http:r.status,host:new URL(r.url).hostname,bytes:Buffer.byteLength(html),turf_mentions:hits.length,turf_context:hits.slice(0,16),date_matches:dateMatches,production_ready:false}));
  } catch(e) {
    console.log(JSON.stringify({url,error:String(e?.message??e),production_ready:false}));
  }
}
