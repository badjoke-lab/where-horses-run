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
