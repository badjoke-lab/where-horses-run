import {getDocument,OPS} from 'pdfjs-dist/legacy/build/pdf.mjs';

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
  return {bytes,byteLength:bytes.length,url:r.url||url,status:r.status,contentType:r.headers.get('content-type')};
}

const file=await fetchPdf(URL);
const pdf=await getDocument({data:file.bytes,disableWorker:true}).promise;
const pages=[];
const colorOps=[];
for(let i=1;i<=pdf.numPages;i++){
  const page=await pdf.getPage(i);
  const tc=await page.getTextContent();
  const items=tc.items.map(x=>({
    str:x.str,
    x:Number(x.transform?.[4]??0),
    y:Number(x.transform?.[5]??0),
    w:Number(x.width??0),
    h:Number(x.height??0)
  }));
  const text=items.map(x=>x.str).join(' ').replace(/\s+/g,' ').trim();
  pages.push({page:i,text,items});

  const opList=await page.getOperatorList();
  let fillColor=null;
  for(let n=0;n<opList.fnArray.length;n++){
    const fn=opList.fnArray[n];
    const args=opList.argsArray[n];
    if(fn===OPS.setFillRGBColor){
      fillColor=Array.from(args??[]).map(Number);
      colorOps.push({page:i,op:'setFillRGBColor',args:fillColor});
    }else if(fn===OPS.constructPath && fillColor){
      const c=fillColor;
      const interesting=!(c.length>=3 && c[0]>0.95 && c[1]>0.95 && c[2]>0.95) &&
                        !(c.length>=3 && c[0]<0.05 && c[1]<0.05 && c[2]<0.05);
      if(interesting) colorOps.push({page:i,op:'constructPath',fillColor:c,args});
    }else if((fn===OPS.fill||fn===OPS.eoFill||fn===OPS.fillStroke||fn===OPS.eoFillStroke)&&fillColor){
      const c=fillColor;
      const interesting=!(c.length>=3 && c[0]>0.95 && c[1]>0.95 && c[2]>0.95) &&
                        !(c.length>=3 && c[0]<0.05 && c[1]<0.05 && c[2]<0.05);
      if(interesting) colorOps.push({page:i,op:'fill',fillColor:c});
    }
  }
}
const joined=pages.map(p=>p.text).join(' ');
const fingerprints=['Selangor','Perak','MRA'];
const hits=fingerprints.filter(x=>joined.toLowerCase().includes(x.toLowerCase()));
console.log(JSON.stringify({
  status:file.status,
  url:file.url,
  content_type:file.contentType,
  bytes:file.byteLength,
  pages:pdf.numPages,
  fingerprints:hits,
  color_ops:colorOps.slice(0,1200),
  page_items:pages.map(p=>({page:p.page,items:p.items}))
},null,2));
if(file.byteLength<10000||pdf.numPages<1||hits.length<3) process.exitCode=1;
