/** Source-scoped ATC 2026-27 fixture probe. Non-publishing. */
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
const pdfUrl='https://cdn.australianturfclub.com.au/app/uploads/2026/07/2026-27-Australian-Turf-Club-Fixture-Card.pdf';
const home='https://www.australianturfclub.com.au/races/';
const head={'user-agent':'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)','accept':'application/pdf,text/html;q=0.9'};
for(const [name,url,allow] of [['atc-calendar',home,['www.australianturfclub.com.au']],['atc-fixture-pdf',pdfUrl,['cdn.australianturfclub.com.au']],['atc-robots','https://www.australianturfclub.com.au/robots.txt',['www.australianturfclub.com.au']]]){
 try{
 const r=await fetch(url,{headers:head,signal:AbortSignal.timeout(30000)});
 if(!r.ok){console.log('ATC_PROBE '+JSON.stringify({name,http:r.status}));continue}
 if(!allow.includes(new URL(r.url).hostname))throw Error('Unreviewed redirect host');
 if(name==='atc-fixture-pdf'){
  const data=new Uint8Array(await r.arrayBuffer());if(data.length>15000000||new TextDecoder().decode(data.slice(0,5))!=='%PDF-')throw Error('PDF guard bytes='+data.length+' content-type='+r.headers.get('content-type')+' head='+new TextDecoder().decode(data.slice(0,15)).replace(/[^a-zA-Z0-9\x20-\x7e]/g,'.'));
  const doc=await getDocument({data,disableWorker:true}).promise;
  const pages=[];for(let i=1;i<=doc.numPages;i++){const t=await(await doc.getPage(i)).getTextContent();pages.push(t.items.map(x=>String(x.str??'')));}
  const first=pages[0];const txt=first.join(' | ');
  console.log('ATC_PROBE '+JSON.stringify({name,http:r.status,bytes:data.length,pages:doc.numPages,item_count:first.length,heading_context:txt.slice(0,3000),nov_position:txt.indexOf('NOV 2026'),oct_position:txt.indexOf('OCT 2026'),sep_position:txt.indexOf('SEP 2026'),dec_position:txt.indexOf('DEC 2026'),oct_sample:txt.slice(Math.max(0,txt.indexOf('OCT 2026')-90),txt.indexOf('OCT 2026')+1600),nov_sample:txt.slice(Math.max(0,txt.indexOf('NOV 2026')-90),txt.indexOf('NOV 2026')+1200)}));
 }else{
  const text=await r.text();const urls=[...text.matchAll(/(?:href|src)\s*=\s*["']([^"']*2026[^"']*(?:\.pdf|fixture)[^"']*)/gi)].map(m=>m[1]).slice(0,5);
  console.log('ATC_PROBE '+JSON.stringify({name,http:r.status,bytes:text.length,mentions_fixture_pdf:text.includes('2026-27-Australian-Turf-Club-Fixture-Card.pdf'),source_links:urls,robots_directives:name==='atc-robots'?text.split(/\r?\n/).filter(s=>/^(?:User-agent|Disallow|Allow):/i.test(s)).slice(0,25):undefined}));
 }
 }catch(e){console.log('ATC_PROBE '+JSON.stringify({name,error:String(e?.message??e)}))}
}
