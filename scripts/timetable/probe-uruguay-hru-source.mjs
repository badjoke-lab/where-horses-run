import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const UA='Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)';
async function fetchText(url){
  const r=await fetch(url,{redirect:'follow',headers:{'user-agent':UA,'accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5','accept-language':'es-UY,es;q=0.9,en;q=0.6'},signal:AbortSignal.timeout(25000)});
  const text=await r.text();
  console.log(JSON.stringify({kind:'http',url,final_url:r.url,status:r.status,content_type:r.headers.get('content-type'),bytes:text.length}));
  return {r,text};
}
function decode(v){return String(v??'').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&nbsp;|&#160;/gi,' ');}
function strip(v){return decode(String(v??'').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();}
function absolute(href,base){try{return new URL(decode(href),base).toString();}catch{return href;}}
function extractAnchors(html,base){
  const out=[];
  for(const m of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) out.push({href:absolute(m[1],base),text:strip(m[2])});
  return out;
}
function extractScripts(html,base){
  return [...html.matchAll(/<script\b[^>]*src=["']([^"']+)["']/gi)].map(m=>absolute(m[1],base));
}

const calendarUrl='https://www.maronas.com.uy/hipodromos/agencias-hipicas/calendario';
const hipicaUrl='https://hipica.maronas.com.uy/';
const cal=await fetchText(calendarUrl);
const anchors=extractAnchors(cal.text,cal.r.url||calendarUrl);
console.log('CALENDAR_ANCHORS');
for(const a of anchors.filter(a=>/pdf|calend|files\.php|hipica|racing/i.test(a.href+' '+a.text))) console.log(JSON.stringify(a));
console.log('CALENDAR_SCRIPTS');
for(const s of extractScripts(cal.text,cal.r.url||calendarUrl)) console.log(s);

const pdfAnchor=anchors.find(a=>/\.pdf(?:$|\?)/i.test(a.href)||/calendario mensual/i.test(a.text));
if(pdfAnchor){
  const r=await fetch(pdfAnchor.href,{redirect:'follow',headers:{'user-agent':UA,'accept':'application/pdf,*/*;q=0.8'},signal:AbortSignal.timeout(25000)});
  const bytes=new Uint8Array(await r.arrayBuffer());
  console.log(JSON.stringify({kind:'pdf',url:pdfAnchor.href,final_url:r.url,status:r.status,content_type:r.headers.get('content-type'),bytes:bytes.length,magic:String.fromCharCode(...bytes.slice(0,4))}));
  if(bytes.length>4&&String.fromCharCode(...bytes.slice(0,4))==='%PDF'){
    const pdf=await getDocument({data:bytes,disableWorker:true}).promise;
    console.log('PDF_PAGES '+pdf.numPages);
    for(let n=1;n<=Math.min(pdf.numPages,8);n++){
      const p=await pdf.getPage(n); const c=await p.getTextContent();
      const text=c.items.filter(i=>'str' in i).map(i=>i.str).join(' ').replace(/\s+/g,' ').trim();
      console.log('PDF_PAGE_'+n+' '+text.slice(0,12000));
    }
  }
}

const hip=await fetchText(hipicaUrl);
console.log('HIPICA_ANCHORS');
for(const a of extractAnchors(hip.text,hip.r.url||hipicaUrl).filter(a=>/Racing|Programa|Resultado|Calend|Date|Meeting/i.test(a.href+' '+a.text))) console.log(JSON.stringify(a));
console.log('HIPICA_SCRIPTS');
for(const s of extractScripts(hip.text,hip.r.url||hipicaUrl)) console.log(s);
