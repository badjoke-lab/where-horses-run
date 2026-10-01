import {execFileSync} from 'node:child_process';

const URL='https://www.mtcjockeyclub.com/form-guide/fixtures';
async function fetchText(){
  try{
    const r=await fetch(URL,{redirect:'follow',headers:{
      'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/141 Safari/537.36',
      'accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
      'accept-language':'en-US,en;q=0.9'
    },signal:AbortSignal.timeout(20000)});
    if(!r.ok) throw new Error('HTTP '+r.status+' '+(r.url||URL));
    const text=await r.text();
    return {method:'fetch',status:r.status,url:r.url||URL,text};
  }catch(fetchError){
    try{
      const text=execFileSync('curl',[
        '-L','--fail','--silent','--show-error','--max-time','20',
        '--user-agent','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/141 Safari/537.36',
        '--header','Accept-Language: en-US,en;q=0.9',URL
      ],{encoding:'utf8',maxBuffer:8*1024*1024});
      return {method:'curl',status:200,url:URL,text};
    }catch(curlError){
      throw new Error('fetch failed: '+String(fetchError?.message??fetchError)+'; curl failed: '+String(curlError?.message??curlError));
    }
  }
}
function visibleText(html){return String(html??'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();}
const page=await fetchText();
const text=visibleText(page.text);
const dateMatches=[...text.matchAll(/\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/gi)].map(m=>m[0]);
const isoMatches=[...text.matchAll(/\b20\d{2}-\d{2}-\d{2}\b/g)].map(m=>m[0]);
const octIndex=text.toLowerCase().indexOf('october');
console.log(JSON.stringify({
  method:page.method,status:page.status,url:page.url,html_bytes:page.text.length,
  date_matches:[...new Set(dateMatches)].slice(0,80),
  iso_matches:[...new Set(isoMatches)].slice(0,80),
  has_2026:/2026/.test(text),
  has_champ_de_mars:/Champ de Mars/i.test(text),
  october_context:octIndex>=0?text.slice(Math.max(0,octIndex-500),octIndex+1800):null
},null,2));
if(page.status!==200) process.exitCode=1;
if(!/2026/.test(text)) process.exitCode=1;
