import {execFileSync} from 'node:child_process';

const URL='https://belgiumhorseracing.be/koersen/';
async function fetchText(){
  try{
    const r=await fetch(URL,{redirect:'follow',headers:{
      'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/141 Safari/537.36',
      'accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
      'accept-language':'nl-BE,nl;q=0.9,fr-BE;q=0.8,en;q=0.6'
    },signal:AbortSignal.timeout(20000)});
    if(!r.ok) throw new Error('HTTP '+r.status+' '+(r.url||URL));
    return {method:'fetch',status:r.status,url:r.url||URL,text:await r.text()};
  }catch(fetchError){
    try{
      const text=execFileSync('curl',[
        '-L','--fail','--silent','--show-error','--max-time','25',
        '--user-agent','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/141 Safari/537.36',
        '--header','Accept-Language: nl-BE,nl;q=0.9,fr-BE;q=0.8,en;q=0.6',URL
      ],{encoding:'utf8',maxBuffer:12*1024*1024});
      return {method:'curl',status:200,url:URL,text};
    }catch(curlError){
      throw new Error('fetch failed: '+String(fetchError?.message??fetchError)+'; curl failed: '+String(curlError?.message??curlError));
    }
  }
}
function visibleText(html){return String(html??'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/\s+/g,' ').trim();}
const page=await fetchText();
const text=visibleText(page.text);
const dmy=[...text.matchAll(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](20\d{2})\b/g)].map(m=>m[0]);
const written=[...text.matchAll(/\b(\d{1,2})\s+(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december|janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+(20\d{2})\b/gi)].map(m=>m[0]);
const venues=['Mons-Ghlin','Waregem','Oostende','Kuurne','Tongeren','Wallonie','Mons','Waregem Koerse'];
const venueHits=venues.filter(v=>text.toLowerCase().includes(v.toLowerCase()));
const idx=text.search(/oktober|octobre/i);
console.log(JSON.stringify({
  method:page.method,status:page.status,url:page.url,html_bytes:page.text.length,
  dmy_dates:[...new Set(dmy)].slice(0,120),
  written_dates:[...new Set(written)].slice(0,120),
  venue_hits:venueHits,
  has_2026:/2026/.test(text),
  october_context:idx>=0?text.slice(Math.max(0,idx-800),idx+3500):text.slice(0,5000)
},null,2));
if(page.status!==200) process.exitCode=1;
if(!/2026/.test(text)) process.exitCode=1;
