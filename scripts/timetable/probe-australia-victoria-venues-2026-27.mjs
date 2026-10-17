import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
const release='https://www.racingvictoria.com.au/news/2026/04/30/track-enhancements-and-strategic-initiatives-shape-2026-27-victorian-race-dates';
const fallback='https://dxp-cdn.racing.com/api/public/content/Victorian_Race_Dates_2026-27_FINAL-%28EMBARGOED%29-8668576.pdf?v=073e67fe';
const headers={'user-agent':'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)','accept':'application/pdf,text/html;q=0.9'};
try{
 const pub=await fetch(release,{headers,signal:AbortSignal.timeout(25000)});
 if(!pub.ok||new URL(pub.url).hostname!=='www.racingvictoria.com.au')throw Error('official RV release '+pub.status);
 const html=await pub.text();
 if(!/528 race meetings/i.test(html))throw Error('official RV release fingerprint missing');
 const found=html.match(/(?:https:\/\/dxp-cdn\.racing\.com)?\/api\/public\/content\/[^"'<> ]*Victorian_Race_Dates_2026-27_FINAL[^"'<> ]*\.pdf[^"'<> ]*/i)?.[0];
 const pdfUrl=found?(found.startsWith('https:')?found:'https://dxp-cdn.racing.com'+found.replaceAll('&amp;','&')):fallback;
 const u=new URL(pdfUrl);if(u.hostname!=='dxp-cdn.racing.com'||!u.pathname.startsWith('/api/public/content/'))throw Error('unapproved fixture host');
 const r=await fetch(pdfUrl,{headers,signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error('approved fixture PDF '+r.status);
 const data=new Uint8Array(await r.arrayBuffer());if(data.length<20000||data.length>3000000||new TextDecoder().decode(data.slice(0,5))!=='%PDF-')throw Error('PDF format guard');
 const pdf=await getDocument({data,disableWorker:true}).promise;
 const venueNames=['Caulfield','Caulfield Heath','Sandown','Sandown Hillside','Sandown Lakeside','Mornington','Moonee Valley','Flemington'];
 const out={};for(const venue of venueNames)out[venue]={count:0,dates:[],sample:null};
 const re=/\b(\d{2})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(26|27)\s*\|\s*(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\s*\|\s*([^|]+)\s*\|/gi;
 const anomalies={};
 for(let n=1;n<=pdf.numPages;n++){
  const items=(await (await pdf.getPage(n)).getTextContent()).items.map(x=>String(x.str??'').trim()).filter(Boolean);
  const content=items.join(' | ');
  for(const m of content.matchAll(re)){
   let venue=m[5].trim();
   if(venueNames.includes(venue)){out[venue].count++;out[venue].dates.push(m[1]+'-'+m[2]+'-'+m[3]);if(!out[venue].sample)out[venue].sample=m[0].slice(0,95)}
   else anomalies[venue]=(anomalies[venue]||0)+1;
  }
 }
 console.log('RV_VENUE_PROBE '+JSON.stringify({status:'success',pdfPages:pdf.numPages,bytes:data.length,venues:out,all_other:anomalies,source:'Racing Victoria approved 2026-27 PDF; no names/images/pdf bytes copied into repo'}));
}catch(e){console.log('RV_VENUE_PROBE '+JSON.stringify({status:'failure',error:String(e?.message??e)}));process.exitCode=1}
