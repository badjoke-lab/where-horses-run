/**
 * Argentina La Plata 2026 official resolution probe.
 * Strictly read-only; no generated public meetings, no PDF retention.
 */
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
const RESOLUTION='https://www.hipodromolaplata.gba.gov.ar/hplp/ih_carreraspdf/10_resoluciones/2025-11-27_resolucion.pdf';
const urls=[
 ['laplata-pdf',RESOLUTION],
 ['laplata-robots','https://www.hipodromolaplata.gba.gov.ar/robots.txt'],
 ['laplata-legal','https://www.hipodromolaplata.gba.gov.ar/h/info_legales.php'],
 ['sanluis-2026-bulletin','https://boletinoficial.sanluis.gov.ar/Boletins/VerBoletin/16027'],
 ['lapunta-official','https://hipodromolapunta.com.ar/']
];
const allow=new Set(['www.hipodromolaplata.gba.gov.ar','hipodromolaplata.gba.gov.ar','boletinoficial.sanluis.gov.ar','hipodromolapunta.com.ar','www.hipodromolapunta.com.ar']);
const months=['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
for(const [key,url] of urls){
 try{
  const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)','accept':'application/pdf,text/html,text/plain;q=0.9'},signal:AbortSignal.timeout(30000)});
  const host=new URL(r.url).hostname;if(!allow.has(host))throw Error('unreviewed redirect host: '+host);
  if(!r.ok){console.log('ARG_SOURCE '+JSON.stringify({key,status:'unreachable',http:r.status}));continue}
  const bytes=new Uint8Array(await r.arrayBuffer());if(bytes.length>7500000)throw Error('source too large');
  if(key!=='laplata-pdf'){
   const txt=new TextDecoder().decode(bytes);
   console.log('ARG_SOURCE '+JSON.stringify({key,http:r.status,bytes:bytes.length,year2026:txt.includes('2026'),calendar_terms:/calendario|calend[aá]rio|carreras|hip[oó]dromo/i.test(txt),auto_terms:/autom[aá]tic|scrap|bot|reproducci[oó]n|copyright|todos los derechos/i.test(txt),robots_disallow_calendars:key==='laplata-robots'?txt.split('\n').filter(s=>/Disallow|User-agent/i.test(s)).slice(0,25):undefined}));
   continue;
  }
  if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw Error('not PDF');
  const pdf=await getDocument({data:bytes,disableWorker:true}).promise;
  let items=[],pages=pdf.numPages;
  for(let i=1;i<=pages;i++){const p=await pdf.getPage(i);const c=await p.getTextContent();items.push(...c.items.map(x=>String(x.str||'')));}
  const text=items.join(' ').replace(/\s+/g,' '),start=text.indexOf('CALENDARIO HIPICO 2026');
  const tail=start<0?'':text.slice(start,Math.min(text.length,start+18000));
  const monthly={};
  for(let i=0;i<months.length;i++){
   const begin=tail.indexOf(months[i]+':');const next=i<11?tail.indexOf(months[i+1]+':',Math.max(0,begin+1)):-1;
   const segment=begin<0?'':tail.slice(begin+months[i].length+1,next>=0?next:begin+850);
   const extracted=[...segment.matchAll(/\b(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s+(\d{1,2})\b/gi)].map(z=>Number(z[1]));
   monthly[months[i]]={found:begin>=0,day_tokens:extracted.length,distinct:[...new Set(extracted)].sort((a,b)=>a-b)};
  }
  console.log('ARG_PDF '+JSON.stringify({http:r.status,bytes:bytes.length,pages,item_count:items.length,calendar_fingerprint:start>=0,resolution_fingerprint:/Res\.?\s*1024/.test(text),monthly,year2026:text.includes('2026'),note:'parsed date facts only; not evidence of all scheduled meetings or permissions'}));
 }catch(e){console.log('ARG_SOURCE '+JSON.stringify({key,error:String(e?.message??e)}))}
}
