/**
 * CHC 2026 classic schedule, source-discovery only.
 * The confederation-approved classic calendar is NOT an exhaustive Ecuador
 * meeting schedule; this probe creates no candidates/publication.
 * No copied document or source page persists in artifacts.
 */
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
const source='https://confederacionhipicadelcaribe.org/wp-content/uploads/2026/04/CALENDARIO-CLASICO-CHC-2026-4.pdf';
const out=(x)=>console.log('ECUADOR_CHC '+JSON.stringify(x));
try{
 const res=await fetch(source,{headers:{'user-agent':'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)','accept':'application/pdf'},redirect:'follow',signal:AbortSignal.timeout(40000)});
 const origin=new URL(res.url);
 if(origin.hostname!=='confederacionhipicadelcaribe.org'||origin.pathname!==new URL(source).pathname){out({status:'unreviewed_redirect',http:res.status});process.exit(0);}
 if(!res.ok){out({status:'source_unavailable',http:res.status});process.exit(0);}
 const size=Number(res.headers.get('content-length')||0);
 if(size>4000000){out({status:'document_too_large'});process.exit(0);}
 const bytes=new Uint8Array(await res.arrayBuffer());
 if(bytes.length<1500||bytes.length>4000000||new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-'){out({status:'invalid_pdf',bytes:bytes.length});process.exit(0);}
 const pdf=await getDocument({data:bytes,disableWorker:true}).promise;
 if(pdf.numPages<1||pdf.numPages>24){out({status:'unexpected_page_count',page_count:pdf.numPages});process.exit(0);}
 let occurrences=[],hasTitle=false;
 for(let p=1;p<=pdf.numPages;p++){
  const t=(await(await pdf.getPage(p)).getTextContent()).items.map(z=>String(z.str||'').trim()).filter(Boolean);
  const flat=t.join(' ').replace(/\s+/g,' ');
  hasTitle ||= /CALENDARIO\s+CL[ÁA]SICO\s+2026/i.test(flat);
  // Inspect only a narrow token neighborhood for independently visible ECU
  // classic programme row. Do not emit other federations' rows/races.
  for(let i=0;i<t.length;i++){
   if(t[i]!=='ECU')continue;
   const context=t.slice(Math.max(0,i-1),Math.min(t.length,i+10));
   const safe=context.map(x=>x.slice(0,65));
   occurrences.push({page:p,token_index:i,nearby:safe});
  }
 }
 out({status:'pdf_readable',pages:pdf.numPages,bytes:bytes.length,title_match:hasTitle,ecu_occurrence_count:occurrences.length,
  ecu_sample_rows:occurrences.slice(0,18),result:'date_venue_candidate_probe_not_a_current_meeting_publication'});
}catch(e){out({status:'probe_failed',error:String(e?.message||e).slice(0,150)})}
console.log('ECUADOR_CHC_PROBE_END rights_and_current_year_date_review_required');
