const URL='https://www.travsport.no/sport/terminliste-2026/';
function decodeHtml(value){
  return String(value??'')
    .replace(/&nbsp;|&#160;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/&#x([0-9a-f]+);/gi,(_,c)=>String.fromCodePoint(Number.parseInt(c,16)))
    .replace(/&#(\\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));
}
function visibleText(html){
  return decodeHtml(html)
    .replace(/<script\\b[^>]*>[\\s\\S]*?<\\/script>/gi,' ')
    .replace(/<style\\b[^>]*>[\\s\\S]*?<\\/style>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/\\s+/g,' ')
    .trim();
}
const r=await fetch(URL,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5','accept-language':'nb-NO,nb;q=0.9,en;q=0.7'},signal:AbortSignal.timeout(20000)});
const html=await r.text();
const text=visibleText(html);
const dateMatches=[...text.matchAll(/\\b\\d{1,2}[.\\/-]\\d{1,2}[.\\/-]20\\d{2}\\b/g)].slice(0,120).map(m=>({index:m.index,value:m[0],context:text.slice(Math.max(0,m.index-120),Math.min(text.length,m.index+260))}));
const links=[...html.matchAll(/<a\\b[^>]*href=["']([^"']+)["'][^>]*>([\\s\\S]*?)<\\/a>/gi)].map(m=>({href:m[1],label:visibleText(m[2])})).filter(x=>/termin|2026|sport|bane|trav|kalender/i.test(x.href+' '+x.label)).slice(0,120);
console.log(JSON.stringify({status:r.status,url:r.url,content_type:r.headers.get('content-type'),html_bytes:html.length,text_bytes:text.length,text_sample:text.slice(0,12000),date_matches:dateMatches,interesting_links:links},null,2));
if(!r.ok) process.exitCode=1;
