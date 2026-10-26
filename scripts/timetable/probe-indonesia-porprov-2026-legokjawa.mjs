/**
 * Indonesia / PORPROV XV 2026 Berkuda Pacu official event-page probe.
 * Source/method/field scope: one organizer page; two candidate dates at Legok Jawa.
 * Read-only, no page retention or Calendar/Registry writes.
 */
const site='https://porprovbekasikota2026.id';
const page='/cabang-olahraga/berkuda-pacu';
const venueNotice='/berita/bergerak-serentak-tim-pb-porprov-xv-jabar-2026-tinjau-puluhan-venue';
const headers={'user-agent':'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)','accept':'text/html,text/plain;q=0.9'};
const log=(id,value)=>console.log('INDONESIA_PORPROV_PROBE '+JSON.stringify({id,...value}));
async function load(path){
 const res=await fetch(site+path,{redirect:'manual',headers,signal:AbortSignal.timeout(22000)});
 if([301,302,303,307,308,401,403,429].includes(res.status))return {status:'blocked_or_redirect',http:res.status};
 if(res.status===404)return {status:'missing',http:res.status};
 if(res.status!==200)return {status:'http_error',http:res.status};
 if(!/text\/(?:html|plain)/i.test(res.headers.get('content-type')||''))return {status:'not_text',http:res.status};
 if(Number(res.headers.get('content-length')||0)>1200000)return {status:'too_large',http:res.status};
 const html=await res.text();
 if(html.length>1200000)return {status:'too_large',http:res.status};
 return {status:'ok',http:200,html};
}
try{
 const robots=await load('/robots.txt');
 if(robots.status==='blocked_or_redirect'||robots.status==='http_error'){log('robots',{status:robots.status,http:robots.http,stop:true});process.exit(0)}
 const lines=(robots.html||'').split(/\r?\n/);
 let all=false;const directives=[];
 for(const raw of lines){const line=raw.replace(/#.*/,'').trim();if(/^user-agent:/i.test(line))all=/^user-agent:\s*\*\s*$/i.test(line);
  if(all&&/^(?:disallow|allow):/i.test(line))directives.push(line)}
 const disallowed=(path)=>directives.some(line=>{const m=line.match(/^disallow:\s*(.+)/i);return m&&m[1]&&path.startsWith(m[1])});
 const denies=disallowed(page);
 log('robots',{status:robots.status,http:robots.http,directives:directives.slice(0,25),event_path_disallowed:denies});
 if(denies)process.exit(0);
 const res=await load(page);
 if(res.status!=='ok'){log('event',{status:res.status,http:res.http,source_candidate:false});process.exit(0)}
 const text=res.html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/\s+/g,' ');
 const raceCategory=/Berkuda\s+Pacu/i.test(text);
 const dateRange=/0?7\s+Nov(?:ember)?\s+2026.{0,110}0?8\s+Nov(?:ember)?\s+2026/i.test(text);
 const venue=/Pacuan\s+Kuda\s+Legok\s*Jawa/i.test(text);
 log('event',{status:'ok',http:200,event:'PORPROV XV Jawa Barat 2026',raceCategory,dateRange,venue,
   event_window_dates:raceCategory&&dateRange&&venue?['2026-11-07','2026-11-08']:[],
   individual_race_days_confirmed:false,
   physical_venue:'Pacuan Kuda Legok Jawa, Pangandaran',
   countrywide_claim:false,rights_permission_not_inferred:true,
   meeting_records:[],publication_ready:false,publication_blocker:'event_range_is_not_day_specific_fixture'});
 // Separate organizer notice corroborates that Legok Jawa is a physical racing
 // venue. It does not confirm competition on either day of the event range.
 if(!disallowed(venueNotice)){
  const n=await load(venueNotice);
  const t=n.status==='ok'?n.html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' '):'';
  log('venue_crosscheck',{status:n.status,http:n.http,
    physical_track_corroborated:/pacuan\s+kuda\s+Legok\s*Jawa/i.test(t)&&/Pangandaran/i.test(t),
    source_type:'organizer_venue_inspection_report',individual_race_days_confirmed:false,publication_ready:false});
 }else log('venue_crosscheck',{status:'robots_disallowed',publication_ready:false});
}catch(e){log('error',{status:'fetch_error',name:String(e?.name||'unknown')})}
console.log('INDONESIA_PORPROV_PROBE_END no_publication');
