import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
const sources = [
  {name:'meadowlands-revised',url:'https://www.njoag.gov/wp-content/uploads/2026/06/Meadowlands-Revised-World-Cup-Calendar.pdf'},
  {name:'monmouth-2026',url:'https://www.njoag.gov/wp-content/uploads/2026/04/Monmouth-race-dates-2026.pdf'}
];
const ua='WhereHorsesRun/1.0 (+https://github.com/badjoke-lab/where-horses-run)';
for (const src of sources) {
  const r=await fetch(src.url,{headers:{'user-agent':ua,'accept':'application/pdf'},signal:AbortSignal.timeout(45000)});
  if(!r.ok) throw Error(src.name+' HTTP '+r.status);
  const host=new URL(r.url).hostname;
  if (!['www.njoag.gov','njoag.gov','www.nj.gov','nj.gov'].includes(host)) throw Error('unexpected host '+host);
  const bytes=new Uint8Array(await r.arrayBuffer());
  const size=bytes.length;
  if(size<2000||size>10_000_000||String.fromCharCode(...bytes.slice(0,5))!=='%PDF-') throw Error('bad PDF bytes '+src.name);
  const pdf=await getDocument({data:bytes,disableWorker:true}).promise;
  if(pdf.numPages<1||pdf.numPages>20)throw Error('bad page count');
  const pages=[];
  for(let n=1;n<=pdf.numPages;n++){
    const p=await pdf.getPage(n), content=await p.getTextContent();
    const items=content.items.map(i=>({text:String(i.str??'').trim(),x:Math.round(i.transform?.[4]??0),y:Math.round(i.transform?.[5]??0)})).filter(i=>i.text);
    const text=items.map(i=>i.text).join(' ');
    pages.push({page:n,items:items.length,text_characters:text.length,plain_text_excerpt:text.slice(0,7500),number_samples:items.filter(i=>/^\d{1,2}$/.test(i.text)).slice(0,30),iso_dates:[...text.matchAll(/\b2026[-/]\d{1,2}[-/]\d{1,2}\b/g)].map(m=>m[0]).slice(0,40)});
  }
  console.log(JSON.stringify({source:src.name,source_url:src.url,pdf_bytes:size,pages,meeting_rows_emitted:0,production_calendar_ready:false}));
}
