// Read-only first-party Russian race-date probe. No source content retained.
const base='https://grozny-hippodrom.ru';
const log=(id,v)=>console.log('RUSSIA_GROZNY_PROBE '+JSON.stringify({id,...v}));
const read=async p=>{
 const r=await fetch(base+p,{redirect:'manual',headers:{'user-agent':'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)'},signal:AbortSignal.timeout(25000)});
 if([301,302,303,307,308,401,403,429].includes(r.status))return {status:'blocked_or_redirect',http:r.status};
 if(!r.ok)return {status:'http_error',http:r.status};
 if(!/text\/(?:html|plain)/i.test(r.headers.get('content-type')||''))return {status:'not_html',http:r.status};
 if(Number(r.headers.get('content-length')||0)>6000000)return {status:'oversized',http:r.status};
 const html=await r.text();if(html.length>6000000)return {status:'oversized',http:r.status};
 return {status:'ok',http:r.status,html};
};
try{
 const robots=await read('/robots.txt');
 if(robots.status==='blocked_or_redirect'){log('robots',{status:robots.status,http:robots.http});process.exit(0)}
 const directives=(robots.html||'').split(/\r?\n/).filter(x=>/^\s*(?:User-agent|Disallow|Allow):/i.test(x)).slice(0,50);
 log('robots',{status:robots.status,http:robots.http,readable_directives:directives});
 const denies=directives.some(x=>/^\s*Disallow:\s*\/\s*$/i.test(x));
 if(denies){log('docs',{status:'robots_deny_all'});process.exit(0)}
 const docs=await read('/docs');
 if(docs.status!=='ok'){log('docs',{status:docs.status,http:docs.http});process.exit(0)}
 const text=docs.html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
 const venue=/Грозненск.{0,25}ипподром/ui.test(text);
 const date=/30\s*(?:октября|\.10\.)\s*2026/ui.test(text);
 const closure=/Закрытия?\s+скакового\s+сезона/ui.test(text);
 log('docs',{status:'ok',http:docs.http,venue,date,closure,meeting_date:venue&&date&&closure?'2026-10-30':null,source_scope:'Grozny only'});
}catch(e){log('error',{status:'fetch_failed',name:String(e?.name||'error')})}
console.log('RUSSIA_GROZNY_PROBE_END no_candidate_or_public_write');
