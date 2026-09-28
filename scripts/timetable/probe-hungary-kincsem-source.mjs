import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const CAL='https://kincsempark.hu/galopp-szakma-informaciok/';
const PROGRAM='https://kincsempark.hu/versenyprogramok/';
function decode(v){return String(v??'').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#x([0-9a-f]+);/gi,(_,c)=>String.fromCodePoint(parseInt(c,16))).replace(/&#(\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));}
function strip(v){return decode(String(v??'').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();}
function anchors(html,base){const out=[];for(const m of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi))out.push({href:new URL(decode(m[1]),base).toString(),text:strip(m[2])});return out;}
async function get(url,type='text/html'){const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':type},signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error('HTTP '+r.status+' '+url);return r;}
async function pdfText(url){const r=await get(url,'application/pdf,*/*;q=0.5');const buf=await r.arrayBuffer();const byteLength=buf.byteLength;const bytes=new Uint8Array(buf);const doc=await pdfjsLib.getDocument({data:bytes,useSystemFonts:true,disableFontFace:true}).promise;let text='';for(let i=1;i<=doc.numPages;i++){const p=await doc.getPage(i);const tc=await p.getTextContent();text+=' '+tc.items.map(x=>x.str).join(' ');}return {pages:doc.numPages,bytes:byteLength,text:text.replace(/\s+/g,' ').trim()};}

const calRes=await get(CAL);const calHtml=await calRes.text();const calAnchors=anchors(calHtml,calRes.url||CAL);
const target=calAnchors.find(a=>/Galopp Versenynapt[aá]r 2026\/12/i.test(a.text)) || calAnchors.find(a=>/2026\/12/.test(a.text));
if(!target) throw new Error('2026/12 galopp calendar link not found');
const pdf=await pdfText(target.href);
const months={oktober:'10',november:'11'};
const meetingDates=[];
for(const m of pdf.text.matchAll(/(?:^|\s)nap\s*,?\s*2\s*0\s*2\s*6\s*\.\s*(okt[oó]ber|november)\s*(\d{1,2})\s*\./gi)){
  const key=m[1].normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const month=months[key];
  if(month) meetingDates.push('2026-'+month+'-'+String(Number(m[2])).padStart(2,'0'));
}
const uniqueMeetingDates=[...new Set(meetingDates)].sort();
const looseDateContexts=[...pdf.text.matchAll(/2\s*0\s*2\s*6\s*\.\s*(okt[oó]ber|november)\s*(\d{1,2})\s*\./gi)].map(m=>m[0]).slice(0,100);
const prRes=await get(PROGRAM);const prHtml=await prRes.text();const prAnchors=anchors(prHtml,prRes.url||PROGRAM);
const pdfLinks=prAnchors.filter(a=>/versenyprogram_2026_/i.test(a.href));
const classified=pdfLinks.map(a=>({href:a.href,name:a.href.split('/').pop(),horse:/_(galopp|ugeto)\.pdf$/i.test(a.href)||/versenyprogram_2026_\d{2}_\d{2}\.pdf$/i.test(a.href),greyhound:/_agar\.pdf$/i.test(a.href)}));
console.log(JSON.stringify({calendar_page:calRes.url||CAL,target_pdf:target,pdf_pages:pdf.pages,pdf_bytes:pdf.bytes,meeting_dates:uniqueMeetingDates,loose_date_contexts:looseDateContexts,pdf_text_sample:pdf.text.slice(0,3000),programme_page:prRes.url||PROGRAM,programme_links:classified.slice(0,30),programme_counts:{total:classified.length,horse:classified.filter(x=>x.horse&&!x.greyhound).length,greyhound:classified.filter(x=>x.greyhound).length}}));
if(pdf.pages<1||pdf.bytes<10000) process.exitCode=1;
if(!/okt[oó]ber|november/i.test(pdf.text)) process.exitCode=1;
if(uniqueMeetingDates.length<2) process.exitCode=1;
if(!uniqueMeetingDates.some(x=>x.startsWith('2026-10-'))) process.exitCode=1;
