import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';

const URL='https://malayanracing.com/pdf/MRA-Racing-Fixture-2026.pdf';

async function fetchPdf(url){
  const r=await fetch(url,{
    redirect:'follow',
    headers:{
      'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
      'accept':'application/pdf,*/*;q=0.8'
    },
    signal:AbortSignal.timeout(45000)
  });
  if(!r.ok) throw new Error('HTTP '+r.status+' '+(r.url||url));
  const bytes=new Uint8Array(await r.arrayBuffer());
  return {bytes,url:r.url||url,status:r.status,contentType:r.headers.get('content-type')};
}

const file=await fetchPdf(URL);
const pdf=await getDocument({data:file.bytes,disableWorker:true}).promise;
const pages=[];
for(let i=1;i<=pdf.numPages;i++){
  const page=await pdf.getPage(i);
  const tc=await page.getTextContent();
  const text=tc.items.map(x=>x.str).join(' ').replace(/\s+/g,' ').trim();
  pages.push({page:i,text});
}
const joined=pages.map(p=>p.text).join(' ');
const fingerprints=['Selangor','Perak','Penang','Ipoh','Sungai Besi','Kuala Lumpur','MRA'];
const hits=fingerprints.filter(x=>joined.toLowerCase().includes(x.toLowerCase()));
console.log(JSON.stringify({
  status:file.status,
  url:file.url,
  content_type:file.contentType,
  bytes:file.bytes.length,
  pages:pdf.numPages,
  fingerprints:hits,
  page_text:pages
},null,2));
if(file.bytes.length<10000||pdf.numPages<1||hits.length<1) process.exitCode=1;
