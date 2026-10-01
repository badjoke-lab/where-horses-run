import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';

const URL='https://pkwk.org/wp-content/uploads/2026/01/Warszawa-plan-gonitw-2026.pdf';

async function fetchPdf(url){
  const r=await fetch(url,{redirect:'follow',headers:{
    'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
    'accept':'application/pdf,*/*;q=0.8'
  },signal:AbortSignal.timeout(30000)});
  if(!r.ok) throw new Error('HTTP '+r.status+' '+(r.url||url));
  const bytes=new Uint8Array(await r.arrayBuffer());
  return {bytes,url:r.url||url,status:r.status,contentType:r.headers.get('content-type')};
}
async function extract(bytes){
  const pdf=await getDocument({data:bytes,disableWorker:true}).promise;
  const pages=[];
  for(let i=1;i<=pdf.numPages;i++){
    const page=await pdf.getPage(i);
    const tc=await page.getTextContent();
    const text=tc.items.map(x=>x.str).join(' ').replace(/\s+/g,' ').trim();
    pages.push({page:i,text});
  }
  return pages;
}
const file=await fetchPdf(URL);
const pages=await extract(file.bytes);
const text=pages.map(p=>p.text).join(' ');
const dmy=[...text.matchAll(/\b(\d{1,2})[.\-/](\d{1,2})[.\-/](20\d{2})\b/g)].map(m=>m[0]);
const dotShort=[...text.matchAll(/\b(\d{1,2})[.](\d{1,2})[.](?:26|2026)\b/g)].map(m=>m[0]);
const monthWords=[...text.matchAll(/\b(\d{1,2})\s+(stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|wrzesnia|października|pazdziernika|listopada|grudnia)\s+(20\d{2})\b/gi)].map(m=>m[0]);
const venues=['Warszawa','Służewiec','Sluzewiec','Wrocław','Wroclaw','Partynice','Sopot'];
const venueHits=venues.filter(v=>text.toLowerCase().includes(v.toLowerCase()));
const pageSummaries=pages.map(p=>({
  page:p.page,
  hasOctober:/paździer|pazdzier|10[.\-/]/i.test(p.text),
  venueHits:venues.filter(v=>p.text.toLowerCase().includes(v.toLowerCase())),
  excerpt:p.text.slice(0,1800)
}));
console.log(JSON.stringify({
  status:file.status,url:file.url,content_type:file.contentType,bytes:file.bytes.length,pages:pages.length,
  dmy_dates:[...new Set(dmy)].slice(0,160),
  dot_short_dates:[...new Set(dotShort)].slice(0,160),
  month_word_dates:[...new Set(monthWords)].slice(0,160),
  venue_hits:venueHits,
  page_summaries:pageSummaries
},null,2));
if(file.bytes.length<10000) process.exitCode=1;
if(!venueHits.length) process.exitCode=1;
