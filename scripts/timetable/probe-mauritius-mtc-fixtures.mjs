import {execFileSync} from 'node:child_process';

const URL='https://www.mtcjockeyclub.com/form-guide/fixtures';
async function getHtml(url){
  try{
    const r=await fetch(url,{redirect:'follow',headers:{
      'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
      'accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
      'accept-language':'en-US,en;q=0.9'
    },signal:AbortSignal.timeout(20000)});
    if(!r.ok) throw new Error('HTTP '+r.status);
    return {html:await r.text(),method:'fetch',url:r.url||url};
  }catch(fetchError){
    const html=execFileSync('curl',[
      '-L','--fail','--silent','--show-error','--max-time','30',
      '--user-agent','Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
      '--header','Accept-Language: en-US,en;q=0.9',
      url
    ],{encoding:'utf8',maxBuffer:12*1024*1024});
    return {html,method:'curl',url};
  }
}
function visible(v){return String(v??'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();}
const page=await getHtml(URL);
const text=visible(page.html);
const dateHits=[...new Set(text.match(/\b(?:\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+2026|(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+2026)\b/gi)||[])];
const anchors=[...page.html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
  .map(m=>({href:m[1],label:visible(m[2])}))
  .filter(x=>/fixture|race|card|meeting|2026/i.test(x.href+' '+x.label))
  .slice(0,160);
console.log(JSON.stringify({method:page.method,url:page.url,html_bytes:page.html.length,date_hits:dateHits,anchors},null,2));
