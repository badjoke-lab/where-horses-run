/**
 * Non-publishing PJC/PHILRACOM source probe. Do not reproduce racecards or raw documents.
 */
const sites=[
 ['pjc-fixtures','https://pjcracing.com/fixtures'],
 ['pjc-home','https://pjcracing.com/'],
 ['pjc-terms','https://pjcracing.com/terms'],
 ['pjc-robots','https://pjcracing.com/robots.txt'],
 ['philracom-calendar','https://philracom.gov.ph/racing-calendar/'],
 ['philracom-robots','https://philracom.gov.ph/robots.txt']
];
const allowed=new Set(['pjcracing.com','www.pjcracing.com','philracom.gov.ph','www.philracom.gov.ph']);
for(const [key,url] of sites){
 try{
  const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'WhereHorsesRun/1.0 (+https://github.com/badjoke-lab/where-horses-run)'},signal:AbortSignal.timeout(14000)});
  if(!allowed.has(new URL(r.url).hostname))throw Error('unapproved redirect');
  if(!r.ok){console.log('PHILIPPINES_PROBE '+JSON.stringify({key,http:r.status,status:'not_accessible'}));continue;}
  const t=await r.text();
  if(t.length>2_000_000)throw Error('oversized page');
  const sc=[...t.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m=>m[1]).filter(x=>/assets|static|app|chunk/i.test(x)).slice(0,16);
  const date=[...new Set([...t.matchAll(/2026[-/]\d{2}[-/]\d{2}|\d{1,2}\s+(?:Oct|Nov|Dec)[a-z]*\s+2026/gi)].map(z=>z[0]))].slice(0,40);
  const endpoints=[...new Set([...t.matchAll(/.{0,45}(?:api\/|\/api|fixture|event|calendar|race-planner).{0,65}/gi)].map(z=>z[0].replace(/\s+/g,' ').slice(0,120)))].slice(0,24);
  console.log('PHILIPPINES_PROBE '+JSON.stringify({key,http:r.status,chars:t.length,has2026:t.includes('2026'),date,sc,endpoints,rights_marker:/terms of service|copyright|all rights reserved|bot|automated/i.test(t)}));
 }catch(e){console.log('PHILIPPINES_PROBE '+JSON.stringify({key,error:String(e?.message??e)}))}
}
