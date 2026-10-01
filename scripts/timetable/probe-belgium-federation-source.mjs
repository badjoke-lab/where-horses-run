import {execFileSync} from 'node:child_process';

const URL='https://belgiumhorseracing.be/koersen/';
async function getHtml(url){
  try{
    const r=await fetch(url,{redirect:'follow',headers:{
      'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
      'accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
      'accept-language':'nl-BE,nl;q=0.9,fr-BE;q=0.8,en;q=0.6'
    },signal:AbortSignal.timeout(20000)});
    if(!r.ok) throw new Error('HTTP '+r.status);
    return {html:await r.text(),method:'fetch',url:r.url||url};
  }catch(fetchError){
    const html=execFileSync('curl',[
      '-L','--fail','--silent','--show-error','--max-time','30',
      '--user-agent','Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
      '--header','Accept-Language: nl-BE,nl;q=0.9,fr-BE;q=0.8,en;q=0.6',
      url
    ],{encoding:'utf8',maxBuffer:12*1024*1024});
    return {html,method:'curl',url};
  }
}
function text(v){return String(v??'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();}
const page=await getHtml(URL);
const html=page.html;
const anchors=[...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
  .map(m=>({href:m[1],label:text(m[2])}))
  .filter(x=>/race\/|koers|calendar|kalender|2026|Mons|Waregem|Tongeren|Oostende/i.test(x.href+' '+x.label))
  .slice(0,120);
const dateHits=[...new Set((text(html).match(/\b(?:\d{1,2}[\/\-.]\d{1,2}[\/\-.]20\d{2}|20\d{2}[\/\-.]\d{1,2}[\/\-.]\d{1,2})\b/g)||[]))].slice(0,120);
console.log(JSON.stringify({
  method:page.method,
  url:page.url,
  html_bytes:html.length,
  title:text((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]),
  date_hits:dateHits,
  anchors
},null,2));
