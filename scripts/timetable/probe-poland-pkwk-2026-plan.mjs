import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';

const SOURCES=[
  {id:'warszawa',venue:'Warszawa-Służewiec',url:'https://pkwk.org/wp-content/uploads/2026/01/Warszawa-plan-gonitw-2026.pdf',fingerprints:['Warszawa','Służewiec']},
  {id:'wroclaw',venue:'Wrocław-Partynice',url:'https://pkwk.org/wp-content/uploads/2026/05/Zatwierdzone-zmiany-do-Roczny-Plan-Gonitw-Wroclaw-2026-pule-nagrod_warunki-gonitw-13052026.pdf',fingerprints:['Wrocław','Partynice']},
  {id:'sopot',venue:'Hipodrom Sopot',url:'https://pkwk.org/wp-content/uploads/2026/06/Zatwierdzony-Plan-Gonitw-Hipodrom-Sopot-2026.pdf',fingerprints:['Sopot']}
];
async function fetchPdf(url){
  const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':'application/pdf,*/*;q=0.8'},signal:AbortSignal.timeout(30000)});
  if(!r.ok) throw new Error('HTTP '+r.status+' '+(r.url||url));
  const bytes=new Uint8Array(await r.arrayBuffer());
  const byteLength=bytes.length;
  return {bytes,byteLength,url:r.url||url,status:r.status,contentType:r.headers.get('content-type')};
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
function headingCandidates(pages){
  const out=[];
  for(const p of pages){
    const t=p.text;
    if(!/Dzie[nń]/i.test(t)) continue;
    const matches=[...t.matchAll(/Dzie[nń]\s+\d+\s*[-–—]?\s*[^.]{0,120}?(?:kwietnia|maja|czerwca|lipca|sierpnia|wrze[sś]nia|pa[zźż]dziernika|listopada|grudnia)/gi)].map(m=>m[0]);
    out.push({page:p.page,matches:matches.slice(0,8),excerpt:t.slice(0,1400)});
  }
  return out;
}
const results=[];
let failed=false;
for(const src of SOURCES){
  try{
    const file=await fetchPdf(src.url);
    const pages=await extract(file.bytes);
    const text=pages.map(p=>p.text).join(' ');
    const venueHits=src.fingerprints.filter(v=>text.toLowerCase().includes(v.toLowerCase()));
    const result={
      id:src.id,venue:src.venue,status:file.status,url:file.url,content_type:file.contentType,bytes:file.byteLength,pages:pages.length,
      venue_hits:venueHits,
      headings:headingCandidates(pages),
      october_pages:pages.filter(p=>/pa[zźż]dzier|10[.\-/]/i.test(p.text)).map(p=>({page:p.page,excerpt:p.text.slice(0,1800)}))
    };
    if(file.byteLength<10000||venueHits.length===0||pages.length===0) failed=true;
    results.push(result);
  }catch(error){
    failed=true;
    results.push({id:src.id,venue:src.venue,error:String(error?.message??error)});
  }
}
console.log(JSON.stringify({sources:results},null,2));
if(failed) process.exitCode=1;
