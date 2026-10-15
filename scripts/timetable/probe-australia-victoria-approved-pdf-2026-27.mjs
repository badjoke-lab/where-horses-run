/** Probe Racing Victoria 2026-27 *published* fixture PDF; extract only non-copyright date facts for Flemington. No PDF retention. */
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
const publication='https://www.racingvictoria.com.au/news/2026/04/30/track-enhancements-and-strategic-initiatives-shape-2026-27-victorian-race-dates';
const fallback='https://dxp-cdn.racing.com/api/public/content/Victorian_Race_Dates_2026-27_FINAL-%28EMBARGOED%29-8668576.pdf?v=073e67fe';
const headers={'user-agent':'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)','accept':'application/pdf,text/html;q=0.9'};
const source=await fetch(publication,{headers,signal:AbortSignal.timeout(30000)});
if(!source.ok)throw Error('official release publication HTTP '+source.status);
const news=await source.text();
if(!/2026-27 Victorian Race Dates/i.test(news)||!/528 race meetings/i.test(news))throw Error('2026-27 approved/publication source fingerprint missing');
const link=news.match(/(?:https:\/\/dxp-cdn\.racing\.com)?\/api\/public\/content\/[^"'<> ]*Victorian_Race_Dates_2026-27_FINAL[^"'<> ]*\.pdf[^"'<> ]*/i)?.[0];
const officialPdf=link?(link.startsWith('https:')?link:'https://dxp-cdn.racing.com'+link.replaceAll('&amp;','&')):fallback;
if(new URL(officialPdf).hostname!=='dxp-cdn.racing.com'||!new URL(officialPdf).pathname.startsWith('/api/public/content/'))throw Error('unreviewed PDF host/path');
const response=await fetch(officialPdf,{headers,signal:AbortSignal.timeout(30000)});
if(!response.ok)throw Error('official fixture PDF HTTP '+response.status);
const bytes=new Uint8Array(await response.arrayBuffer());
if(bytes.length<20000||bytes.length>3000000||new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw Error('fixture PDF content/size invalid');
const pdf=await getDocument({data:bytes,disableWorker:true}).promise;
const hits=[],pages=[];
for(let i=1;i<=pdf.numPages;i++){
 const p=await pdf.getPage(i);const c=await p.getTextContent();
 const lines=c.items.map(x=>String(x.str??'')).filter(x=>x.trim());
 const joined=lines.join(' | ');
 const matches=[...joined.matchAll(/FLEMINGTON/gi)].slice(0,30).map(m=>({before:joined.slice(Math.max(0,m.index-110),m.index).trim(),after:joined.slice(m.index,m.index+140).trim()}));
 if(matches.length){hits.push(...matches.map(x=>({page:i,...x})));pages.push({page:i,line_count:lines.length,match_count:matches.length})}
}
console.log('AUSTRALIA_VICTORIA_2026_27_APPROVED_PDF '+JSON.stringify({publication_http:source.status,pdf_http:response.status,pdf_bytes:bytes.length,pdf_pages:pdf.numPages,venue_pages:pages,venue_sample:hits.slice(0,35),source_pdf_publicly_linked:!!link,year_scope:'2026-27',retained_pdf:false,publication_note:'PDF published via RV 30-Apr-2026 528-meeting approved announcement; source document is not re-published'}));
if(hits.length<2)throw Error('insufficient source Flemington records for production');
