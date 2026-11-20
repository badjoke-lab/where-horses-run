import { extractMonterricoEntryProgrammeLinks, PERU_MONTERRICO_ENTRY_PROGRAMME_URL } from './peru-monterrico-core.mjs';

// One-shot diagnostics only: inspect first-party public HTML, emit minimal
// metadata, never retain or print the HTML or a racecard. No access bypass.
const firstParty='https://hipodromodemonterrico.com.pe';
const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
const v=Object.fromEntries(parts.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
const today=`${v.year}-${v.month}-${v.day}`;
const plusDays=(s,n)=>{const d=new Date(s+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
const urls=[
  {label:'entry_programmes',url:PERU_MONTERRICO_ENTRY_PROGRAMME_URL},
  {label:'upcoming_programmes',url:firstParty+'/carreras-proximos-programas'},
  {label:'new_web_calendar',url:firstParty+'/monterrico/web'},
  {label:'legacy_date_api',url:firstParty+'/api/general/carreras/general/programas/fecha/'+today},
];
for(const {label,url} of urls){
  const info={label,source_url:url};
  try {
    const r=await fetch(url,{
      redirect:'follow',
      headers:{'user-agent':'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)','accept':'text/html,application/json;q=0.8,*/*;q=0.5','accept-language':'es-PE,es;q=0.9'},
      signal:AbortSignal.timeout(20000)
    });
    const contentType=r.headers.get('content-type')||'';
    info.http=r.status;info.final_url=r.url;info.content_type=contentType;
    const lengthHeader=Number(r.headers.get('content-length'));
    if(Number.isFinite(lengthHeader)&&lengthHeader>2_000_000){info.body_status='too_large';}
    else {
      const raw=await r.text();
      info.body_chars=raw.length;
      if(label==='entry_programmes'){
        const assets=[...raw.matchAll(/<script\\b[^>]*\\bsrc\\s*=\\s*["']([^"']+)["']/gi)].map(x=>new URL(x[1],r.url).href);
        const moduleAssets=[...raw.matchAll(/<link\\b[^>]*\\b(?:href)\\s*=\\s*["']([^"']+\\.js(?:\\?[^"']*)?)["']/gi)].map(x=>new URL(x[1],r.url).href);
        info.script_assets=[...new Set([...assets,...moduleAssets])].filter(x=>new URL(x).hostname==='hipodromodemonterrico.com.pe').slice(0,15);
        info.is_spa_shell=/(?:id=["']app["']|id=["']root["']|id=["']__next["'])/i.test(raw);
        info.script_tags=[...raw.matchAll(/<script[^>]*>/gi)].map(x=>x[0].slice(0,240)).slice(0,12);
        info.script_count=info.script_tags.length;
        info.script_assets=info.script_tags
          .map(tag=>tag.match(/src="([^"]+)"/i)?.[1]).filter(Boolean)
          .map(url=>new URL(url,r.url).href)
          .filter(url=>new URL(url).hostname==='hipodromodemonterrico.com.pe'&&/\\.js(?:$|\\?)/i.test(url))
          .slice(0,5);
        info.asset_link_tags=[...raw.matchAll(/<link[^>]*>/gi)].map(x=>x[0].slice(0,240))
          .filter(x=>/script|module|preload|asset/i.test(x)).slice(0,12);
        for(const asset of info.script_assets.slice(0,3)){
          try{
            const s=await fetch(asset,{signal:AbortSignal.timeout(15000)});
            const body=await s.text();
            const paths=[...body.matchAll(new RegExp('/(?:api|monterrico/api)[A-Za-z0-9_/?&=%.-]{3,130}', 'g'))]
              .map(m=>m[0]).filter(p=>/reunion|carrera|calend|program|meeting/i.test(p));
            info.module_hints??=[];
            info.module_hints.push({asset_url:asset,status:s.status,chars:body.length,api_paths:[...new Set(paths)].slice(0,25),
              mentions_reunion:/reunion|reuni[oó]n/i.test(body),mentions_racing:/carreras|racing/i.test(body)});
          }catch(e){info.module_hints??=[];info.module_hints.push({asset_url:asset,error:String(e?.message??e).slice(0,90)});}
        }
      }
      if(label==='entry_programmes'&&r.ok){
        const rows=extractMonterricoEntryProgrammeLinks(raw);
        const start=today,end=plusDays(today,30);
        info.entry_link_count=rows.length;
        info.in_window_links=rows.filter(x=>x.date>=start&&x.date<end).map(({date,reunion_id})=>({date,reunion_id})).slice(0,30);
        info.has_legacy_programme_anchor=/carreras-proximos-programas[^"']*id_reunion=/i.test(raw);
      } else if(label==='upcoming_programmes'||label==='new_web_calendar'){
        info.has_reunion_id=/id_reunion[=:"']+\\d{5,}/i.test(raw);
        info.has_calendar_section=/calendario|programaci[oó]n|pr[oó]ximas reuniones/i.test(raw);
        info.has_prog_anchor=/carreras-proximos-programas/i.test(raw);
      }
    }
  }catch(e){info.error=String(e?.message??e).slice(0,160);}
  console.log('MONTERRICO_FIRST_PARTY_PROBE '+JSON.stringify(info));
}
