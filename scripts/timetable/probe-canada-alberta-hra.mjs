/** Read-only source/access test; do not republish source bodies. */
const BASE='https://www.thehorses.com';
const paths=['/racetracks/race-calendar','/robots.txt','/'];
for(const p of paths){
 try{
 const r=await fetch(BASE+p,{redirect:'follow',headers:{'user-agent':'WhereHorsesRun/1.0 (+https://github.com/badjoke-lab/where-horses-run)'},signal:AbortSignal.timeout(25000)});
 if(!['www.thehorses.com','thehorses.com'].includes(new URL(r.url).hostname))throw Error('unexpected redirect host');
 if(!r.ok){console.log('HRA_SOURCE '+JSON.stringify({path:p,http:r.status,status:'not_accessible'}));continue;}
 const body=await r.text();if(body.length>3500000)throw Error('oversized');
 const events=[...new Set([...body.matchAll(/.{0,65}(?:Century Mile|Century Downs|Standardbred|Lethbridge|October|2026-10-|2026\/10\/|2026-10).{0,130}/gi)].map(m=>m[0].replace(/\s+/g,' ').slice(0,195)))].slice(0,70);
 if(p==='/robots.txt')console.log('HRA_ROBOTS '+JSON.stringify(body.slice(0,1700)));
 if(p==='/racetracks/race-calendar'){
   for(const d of [14,16,17,23,24,30,31]){
     const idx=body.indexOf('/eventsbyday/2026/10/'+d+'/-');
     console.log('HRA_DAY_CONTEXT '+JSON.stringify({day:d,html_segment:idx<0?null:body.slice(idx,idx+1850)}));
   }
   console.log('HRA_TERMS_LINKS '+JSON.stringify([...body.matchAll(/href=["']([^"']*(?:terms|copyright|privacy)[^"']*)["']/gi)].map(m=>m[1]).slice(0,20)));
 }
 const dates=[...new Set([...body.matchAll(/(?:2026[-/]10[-/]\d{2}|\d{1,2}\s+October\s+2026)/gi)].map(x=>x[0]))].slice(0,70);
 console.log('HRA_SOURCE '+JSON.stringify({path:p,http:r.status,bytes:body.length,dates,events,script_src:[...body.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(z=>z[1]).slice(0,20),calendar_form:/event|calendar|month/i.test(body)}));
 }catch(e){console.log('HRA_SOURCE '+JSON.stringify({path:p,error:String(e?.message??e)}))}
}
