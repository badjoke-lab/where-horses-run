/**
 * CHC first-party legal/robots access discovery only.
 * Do not store HTML, third-party terms, PDF, cards, or other source bodies.
 * A successful response does not authorize publication.
 */
const base='https://confederacionhipicadelcaribe.org';
const endpoints=[
 {id:'robots',path:'/robots.txt'},
 {id:'home',path:'/'},
 {id:'terminos',path:'/terminos-y-condiciones/'},
 {id:'politica',path:'/politica-de-privacidad/'}
];
const output=(v)=>console.log('CHC_ACCESS_SIGNAL '+JSON.stringify(v));
for(const item of endpoints){
 try{
  const r=await fetch(base+item.path,{headers:{'User-Agent':'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)','Accept':'text/plain,text/html;q=0.9'},redirect:'follow',signal:AbortSignal.timeout(12000)});
  const u=new URL(r.url);
  if(u.hostname!=='confederacionhipicadelcaribe.org'){output({id:item.id,status:'unreviewed_redirect',http:r.status});continue}
  if(!r.ok){output({id:item.id,status:'not_accessible',http:r.status});continue}
  const type=(r.headers.get('content-type')||'').toLowerCase();
  if(!type.includes('text/') || Number(r.headers.get('content-length')||0)>300000){output({id:item.id,status:'uninspected_media_or_size',http:r.status});continue}
  const body=await r.text();
  if(body.length>300000){output({id:item.id,status:'oversize'});continue}
  if(item.id==='robots'){
   output({id:item.id,status:'readable',http:r.status,directives:body.split(/\r?\n/).filter(x=>/^\s*(?:user-agent|allow|disallow|crawl-delay):/i.test(x)).slice(0,40)});
   continue;
  }
  const links=[...body.matchAll(/href\s*=\s*["']([^"'<>]+)["']/gi)].map(x=>x[1]);
  const legal=[];
  for(const link of links){
   try{const u=new URL(link,r.url);if(u.hostname==='confederacionhipicadelcaribe.org'&&/(terms|terminos|condiciones|legal|pol[ií]tica|privacidad|derechos|licencia|copyright)/i.test(u.pathname))legal.push(u.origin+u.pathname)}catch{}
  }
  const simplified=body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').toLowerCase();
  const keywords=['licencia','copyright','reproducci','extracci','automatiz','autorizaci','uso comercial','reservados'].filter(x=>simplified.includes(x));
  output({id:item.id,status:'readable',http:r.status,legal_link_candidates:[...new Set(legal)].slice(0,20),terms_keywords_present:keywords,content_disposition:r.headers.get('content-disposition')||null});
 }catch(e){output({id:item.id,status:'fetch_error',reason:String(e?.name||e?.message||e).slice(0,90)})}
}
console.log('CHC_ACCESS_REVIEW_END no_assumed_rights_or_publication');
