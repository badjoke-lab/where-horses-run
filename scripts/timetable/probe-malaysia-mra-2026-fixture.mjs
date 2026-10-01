import {getDocument,OPS} from 'pdfjs-dist/legacy/build/pdf.mjs';

const URL='https://malayanracing.com/pdf/MRA-Racing-Fixture-2026.pdf';
const MONTHS=Object.freeze({JANUARY:'01',FEBRUARY:'02',MARCH:'03',APRIL:'04',MAY:'05',JUNE:'06',JULY:'07',AUGUST:'08',SEPTEMBER:'09',OCTOBER:'10',NOVEMBER:'11',DECEMBER:'12'});
const COLORS=Object.freeze({
  '255,255,0':{club:'selangor',racecourse_id:'malaysia--selangor-turf-club'},
  '146,208,80':{club:'perak',racecourse_id:'malaysia--perak-turf-club'}
});

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
function rectChunks(args){
  const nums=args?.[1]??[];
  const out=[];
  for(let i=0;i+7<nums.length;i+=8){
    const xs=[nums[i],nums[i+2],nums[i+4],nums[i+6]].map(Number);
    const ys=[nums[i+1],nums[i+3],nums[i+5],nums[i+7]].map(Number);
    out.push({x1:Math.min(...xs),x2:Math.max(...xs),y1:Math.min(...ys),y2:Math.max(...ys)});
  }
  return out;
}

const file=await fetchPdf(URL);
const pdf=await getDocument({data:file.bytes,disableWorker:true}).promise;
const fixtures=[];
const diagnostics=[];
for(let i=1;i<=pdf.numPages;i++){
  const page=await pdf.getPage(i);
  const tc=await page.getTextContent();
  const items=tc.items.map(x=>({str:String(x.str??'').trim(),x:Number(x.transform?.[4]??0),y:Number(x.transform?.[5]??0),w:Number(x.width??0)}));
  const monthRows=new Map();
  for(const item of items){
    const month=MONTHS[item.str.toUpperCase()];
    if(!month) continue;
    const rowItems=items.filter(x=>/^\d{1,2}$/.test(x.str)&&Math.abs(x.y-item.y)<0.2);
    monthRows.set(Number(month),rowItems);
  }
  const opList=await page.getOperatorList();
  let fillColor=null;
  for(let n=0;n<opList.fnArray.length;n++){
    const fn=opList.fnArray[n],args=opList.argsArray[n];
    if(fn===OPS.setFillRGBColor){
      fillColor=Array.from(args??[]).map(Number);
      continue;
    }
    if(fn!==OPS.constructPath||!fillColor) continue;
    const meta=COLORS[fillColor.join(',')];
    if(!meta) continue;
    for(const rect of rectChunks(args)){
      const month=Math.round((rect.y1-90.080002)/43.84)+1;
      if(month<1||month>12) continue;
      const x1=rect.x1*0.75,x2=rect.x2*0.75;
      const candidates=(monthRows.get(month)??[]).filter(item=>{
        const cx=item.x+(item.w/2);
        return cx>=x1-0.5&&cx<=x2+0.5;
      });
      if(!candidates.length) diagnostics.push({code:'date_not_found',month,rect,fillColor,x1,x2});
      for(const item of candidates){
        fixtures.push({
          date:'2026-'+String(month).padStart(2,'0')+'-'+String(Number(item.str)).padStart(2,'0'),
          club:meta.club,
          racecourse_id:meta.racecourse_id,
          color:fillColor
        });
      }
    }
  }
}
const unique=[...new Map(fixtures.map(x=>[x.date+'|'+x.club,x])).values()].sort((a,b)=>a.date.localeCompare(b.date)||a.club.localeCompare(b.club));
const selangor=unique.filter(x=>x.club==='selangor');
const perak=unique.filter(x=>x.club==='perak');
console.log(JSON.stringify({
  status:file.status,url:file.url,content_type:file.contentType,bytes:file.byteLength,pages:pdf.numPages,
  totals:{selangor:selangor.length,perak:perak.length,total:unique.length},
  october:unique.filter(x=>x.date.startsWith('2026-10-')),
  fixtures:unique,
  diagnostics
},null,2));
if(file.byteLength<10000||pdf.numPages!==1) process.exitCode=1;
if(selangor.length!==61||perak.length!==29||unique.length!==90||diagnostics.length) process.exitCode=1;
