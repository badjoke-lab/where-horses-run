import fs from 'node:fs';

const SOURCES = {
  index: 'https://www.britishhorseracing.com/press_releases/',
  whole: 'https://www.britishhorseracing.com/press_releases/bha-confirms-abandonment-of-four-fixtures-following-met-office-extreme-heat-warning/',
  transfer: 'https://www.britishhorseracing.com/press_releases/bha-confirms-the-transfer-of-three-chelmsford-city-fixtures/',
  partial: 'https://www.britishhorseracing.com/press_releases/bha-confirms-abandonment-of-steeple-chases-at-fontwell-on-sunday-22-february/',
};

function decode(v){
  return String(v??'').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&')
    .replace(/&#39;|&apos;|&rsquo;/gi,"'").replace(/&#x([0-9a-f]+);/gi,(_,x)=>String.fromCodePoint(Number.parseInt(x,16))).replace(/&#(\d+);/g,(_,x)=>String.fromCodePoint(Number(x))).replace(/\s+/g,' ').trim();
}
function fold(v){return decode(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
async function fetchPage(url){
  try{
    const r=await fetch(url,{redirect:'follow',headers:{
      'user-agent':'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)',
      accept:'text/html,application/xhtml+xml,*/*;q=0.8',
      'accept-language':'en-GB,en;q=0.9'
    },signal:AbortSignal.timeout(20000)});
    const body=await r.text();
    return {requested_url:url,final_url:r.url,status:r.status,ok:r.ok,bytes:Buffer.byteLength(body),content_type:r.headers.get('content-type'),body};
  }catch(error){return {requested_url:url,ok:false,error:error instanceof Error?error.message:String(error),body:''};}
}
function candidates(html){
  const out=new Map();
  for(const m of String(html??'').matchAll(/href\s*=\s*["']([^"']*\/press_releases\/[^"'?#]+)["']/gi)){
    let u;try{u=new URL(m[1],SOURCES.index).toString();}catch{continue;}
    if(/\/press_releases\/?$/.test(new URL(u).pathname)) continue;
    const ctx=decode(String(html).slice(Math.max(0,(m.index??0)-1000),(m.index??0)+800));
    if(!/(abandon|transfer|cancel|postpon)/i.test(fold(ctx))) continue;
    if(!out.has(u)) out.set(u,ctx.slice(0,1000));
  }
  return [...out.entries()].map(([url,context])=>({url,context})).slice(0,60);
}
function fingerprint(key,html){
  const s=fold(html);
  const common={authority:s.includes('british horseracing authority')||s.includes('bha')};
  if(key==='whole') return {...common,match:s.includes('abandonment of four fixtures')&&s.includes('kempton park')&&s.includes('salisbury')&&s.includes('worcester')&&s.includes('ffos las')&&s.includes('abandoned')};
  if(key==='transfer') return {...common,match:s.includes('three upcoming fixtures scheduled to take place at chelmsford city racecourse')&&s.includes('have been transferred')&&s.includes('sunday 2 august will be cancelled')};
  if(key==='partial') return {...common,match:s.includes('two steeple chases scheduled to take place at fontwell')&&s.includes('have been abandoned')&&s.includes('fixture now will consist of six races')};
  return common;
}

const results={};
for(const [key,url] of Object.entries(SOURCES)){
  const row=await fetchPage(url);
  results[key]={requested_url:url,final_url:row.final_url??null,status:row.status??null,ok:row.ok,bytes:row.bytes??0,error:row.error??null,
    fingerprints:fingerprint(key,row.body),text_sample:decode(row.body).slice(0,2800)};
}
results.index.candidates=candidates((await fetchPage(SOURCES.index)).body);
const artifact={schema_version:'uk-bha-non-running-route-probe-v1',generated_at:new Date().toISOString(),results};
fs.writeFileSync('probe-uk-bha-non-running.json',JSON.stringify(artifact,null,2)+'\n');
console.log(JSON.stringify(artifact,null,2));
for(const key of Object.keys(SOURCES)) if(!results[key].ok) throw new Error('BHA source failed: '+key);
for(const key of ['whole','transfer','partial']) if(!results[key].fingerprints.match) throw new Error('BHA fixture fingerprint missing: '+key);
if(!results.index.fingerprints.authority) throw new Error('BHA press releases index fingerprint missing');
