/**
 * Read-only Malta third-party fixture discovery.
 * MaltaTrotRacing is NOT assumed to be a racing authority or licensed feed.
 * Does not create meeting candidates, save raw source, or publish to Calendar.
 * At most one robots request, one landing request and one 2026 list request.
 */
const host='www.maltatrotracing.com';
const root='https://'+host;
const agent='WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)';
const out=(id,obj)=>console.log('MALTA_INDEPENDENT_DISCOVERY '+JSON.stringify({id,...obj}));
const policy='REVIEW_REQUIRED_NOT_FOR_PRODUCTION';
const get=async path=>{
  const r=await fetch(root+path,{headers:{'user-agent':agent,'accept':'text/html,text/plain;q=0.9'},
    signal:AbortSignal.timeout(17000),redirect:'follow'});
  const dest=new URL(r.url);
  if(dest.hostname!==host||dest.protocol!=='https:')throw Error('unreviewed_redirect');
  return r;
};
let robotsStatus='not_checked',disallow=[],denied=false;
try{
  const r=await get('/robots.txt');robotsStatus='http_'+r.status;
  if(r.ok){
    const txt=(await r.text()).slice(0,120000);
    let agents=[],active=false;
    for(const line of txt.split(/\r?\n/)){
      const clean=line.replace(/#.*$/,'').trim();
      if(!clean){if(active){agents=[];active=false}continue}
      const m=clean.match(/^user-agent:\s*(.+)$/i);
      if(m){if(active){agents=[];active=false}agents.push(m[1].trim().toLowerCase());continue}
      if(agents.length){active=true;if(agents.includes('*')||agents.some(x=>agent.toLowerCase().includes(x))){
        const d=clean.match(/^disallow:\s*(\S*)/i);if(d&&d[1])disallow.push(d[1]);
      }}
    }
  }
  out('robots',{status:robotsStatus,disallow_count:disallow.length});
}catch(e){out('robots',{status:'fetch_failed',reason:String(e?.message||e).slice(0,90)});}
for(const {id,path} of [{id:'landing',path:'/'},{id:'fixture_list',path:'/races'}]){
  if(disallow.some(p=>path.startsWith(p))){
    out(id,{status:'robots_disallow',rights_state:policy});continue;
  }
  try{
    const r=await get(path);
    if(!r.ok){out(id,{status:'http_'+r.status,rights_state:policy});continue}
    const ct=(r.headers.get('content-type')||'').toLowerCase();
    if(!ct.includes('text/html')){out(id,{status:'unexpected_media_type',rights_state:policy});continue}
    if(Number(r.headers.get('content-length')||0)>900000){out(id,{status:'oversize',rights_state:policy});continue}
    const html=await r.text();
    if(html.length>900000){out(id,{status:'oversize',rights_state:policy});continue}
    const plain=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
      .replace(/<[^>]+>/g,' ').replace(/&(?:nbsp|amp);/gi,' ')
      .replace(/\s+/g,' ');
    const has2026=/\b2026\b/.test(plain);
    const hasVenue=/malta\s+equidrome/i.test(plain);
    const hasUpcoming=/upcoming\s+meetings|upcoming\s+racing|next\s+meeting/i.test(plain);
    const dates=[...new Set((plain.match(/\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:day)?\s+\d{1,2}\s+(?:Oct|Nov|Dec)(?:ober|ember)?\s+2026\b/gi)||[]))].slice(0,12);
    // Some frameworks serialize date-only values rather than visible English labels.
    const isoDates=[...new Set((html.match(/\b2026[-/](?:10|11|12)[-/]\d{2}\b/g)||[]))].slice(0,20);
    const legalPaths=[...new Set([...html.matchAll(/href\s*=\s*["']([^"']{1,200})["']/gi)]
      .map(x=>x[1]).filter(x=>/terms|legal|privacy|conditions/i.test(x)).slice(0,12))];
    out(id,{status:'readable',http:r.status,has2026,hasVenue,hasUpcoming,
      dated_fixture_hints:dates,iso_date_hints:isoDates,legal_link_hints:legalPaths,
      source_class:'independent_third_party_not_verified_official',
      rights_state:policy,no_production_candidate:true});
  }catch(e){out(id,{status:'fetch_failed',reason:String(e?.message||e).slice(0,90),rights_state:policy})}
}
// The same source links to these first-party legal pages. Check only their
// existence and restriction signals; never log the copyrighted terms text.
const legalPath='/terms-of-use';
if(disallow.some(p=>legalPath.startsWith(p))){
  out('terms',{status:'robots_disallow',rights_state:policy});
}else{
  try{
    const r=await get(legalPath);
    const ct=(r.headers.get('content-type')||'').toLowerCase();
    if(!r.ok||!ct.includes('text/html')){
      out('terms',{status:'http_'+r.status,rights_state:policy});
    }else if(Number(r.headers.get('content-length')||0)>250000){
      out('terms',{status:'oversize',rights_state:policy});
    }else{
      const html=(await r.text()).slice(0,250000);
      const txt=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
        .replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').toLowerCase();
      out('terms',{status:'readable',http:r.status,
        restriction_signals:{
          automated: /automated|bot|robot|scrap(?:e|ing)|crawl(?:ing)?|data mining/.test(txt),
          redistribution: /redistribut|republish|reproduc|copying|duplicate/.test(txt),
          commercial: /commercial|business purpose|for profit/.test(txt),
          copyright: /copyright|intellectual property|all rights reserved/.test(txt)
        },
        assessment:'human_scope_review_required',rights_state:policy});
    }
  }catch(e){out('terms',{status:'fetch_failed',reason:String(e?.message||e).slice(0,90),rights_state:policy});}
}
console.log('MALTA_INDEPENDENT_DISCOVERY_END source_discovery_only_no_raw_source_or_racecard_storage_no_production');