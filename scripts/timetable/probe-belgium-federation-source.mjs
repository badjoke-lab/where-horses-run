import {execFileSync} from 'node:child_process';

const URL='https://belgiumhorseracing.be/koersen/';

function decode(v){
  return String(v??'')
    .replace(/&nbsp;|&#160;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/&#x([0-9a-f]+);/gi,(_,c)=>String.fromCodePoint(Number.parseInt(c,16)))
    .replace(/&#(\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));
}
function textify(html){
  return decode(String(html??''))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
async function fetchHtml(url){
  let fetchError=null;
  try{
    const r=await fetch(url,{
      redirect:'follow',
      headers:{
        'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
        'accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
        'accept-language':'nl-BE,nl;q=0.9,fr-BE;q=0.8,en;q=0.6'
      },
      signal:AbortSignal.timeout(20000)
    });
    if(!r.ok) throw new Error('HTTP '+r.status);
    return {html:await r.text(),url:r.url||url,method:'fetch'};
  }catch(e){fetchError=e;}
  try{
    const html=execFileSync('curl',[
      '-L','--fail','--silent','--show-error','--max-time','20',
      '--user-agent','Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
      '--header','Accept-Language: nl-BE,nl;q=0.9,fr-BE;q=0.8,en;q=0.6',
      url
    ],{encoding:'utf8',maxBuffer:8*1024*1024});
    if(!html.trim()) throw new Error('curl returned empty body');
    return {html,url,method:'curl'};
  }catch(e){
    throw new Error('fetch failed: '+String(fetchError?.message??fetchError)+'; curl failed: '+String(e?.message??e));
  }
}

const page=await fetchHtml(URL);
const visible=textify(page.html);

const datePatterns=[
  /\b\d{1,2}[./-]\d{1,2}[./-]20\d{2}\b/g,
  /\b20\d{2}[./-]\d{1,2}[./-]\d{1,2}\b/g,
  /\b\d{1,2}\s+(?:januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december|janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+20\d{2}\b/giu
];
const dateHits=[];
for(const rx of datePatterns){
  for(const m of visible.matchAll(rx)){
    const i=m.index??0;
    dateHits.push({match:m[0],context:visible.slice(Math.max(0,i-90),Math.min(visible.length,i+170))});
  }
}

const anchors=[];
for(const m of page.html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
  const href=decode(m[1]).trim();
  const text=textify(m[2]);
  if(!text) continue;
  if(/koers|race|hippo|waregem|mons|ostende|oostende|tongeren|kuurne|walloni|belg/i.test(text+' '+href)){
    anchors.push({text,href});
  }
}

console.log(JSON.stringify({
  url:page.url,
  method:page.method,
  html_bytes:Buffer.byteLength(page.html),
  visible_chars:visible.length,
  has_2026:/2026/.test(visible),
  date_hits:[...new Map(dateHits.map(x=>[x.match+'|'+x.context,x])).values()].slice(0,40),
  anchor_hits:[...new Map(anchors.map(x=>[x.text+'|'+x.href,x])).values()].slice(0,60)
},null,2));

if(!/2026/.test(visible)) process.exitCode=1;
if(dateHits.length===0) process.exitCode=1;
