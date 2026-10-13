import fs from 'node:fs';
import path from 'node:path';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {ARG_LP_AUTHORITY_ID,ARG_LP_SOURCE_ID,ARG_LP_SOURCE_URL,ARG_LP_ROUTE_ID,ARG_LP_SYSTEM_ID,ARG_LP_TIMEZONE,parseLaPlataApproved2026,buildLaPlataMeetingRecord} from './argentina-la-plata-2026-core.mjs';
const arg=(n,f=null)=>process.argv.find(z=>z.startsWith('--'+n+'='))?.slice(n.length+3)??f;
const plusDays=(date,n)=>{const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const localDate=()=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:ARG_LP_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const p=Object.fromEntries(parts.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return p.year+'-'+p.month+'-'+p.day};
const output=arg('output'),start=arg('as-of',localDate()),days=Number(arg('days','30'));
if(!output||!/^\d{4}-\d\d-\d\d$/.test(start)||!Number.isInteger(days)||days<1||days>120)throw Error('expected --output and --as-of YYYY-MM-DD, --days 1..120');
const generatedAt=new Date().toISOString(),end=plusDays(start,days),source_errors=[],parse_failures=[],source_warnings=[];
let rows=[],monthly={},pdfPages=0,pdfBytes=0;
try{
 const r=await fetch(ARG_LP_SOURCE_URL,{redirect:'follow',headers:{'user-agent':'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)','accept':'application/pdf','accept-language':'es-AR,es;q=0.9'},signal:AbortSignal.timeout(40000)});
 if(!r.ok)throw Error('La Plata resolution HTTP '+r.status);
 if(!['www.hipodromolaplata.gba.gov.ar','hipodromolaplata.gba.gov.ar'].includes(new URL(r.url).hostname))throw Error('unreviewed PDF redirect host');
 const bytes=new Uint8Array(await r.arrayBuffer());pdfBytes=bytes.length;
 if(bytes.length<10000||bytes.length>7500000||new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw Error('La Plata PDF format/size guard');
 const pdf=await getDocument({data:bytes,disableWorker:true}).promise;pdfPages=pdf.numPages;
 if(pdfPages<1||pdfPages>12)throw Error('La Plata unexpected PDF page count '+pdfPages);
 const chunks=[];for(let i=1;i<=pdfPages;i++){const c=await(await pdf.getPage(i)).getTextContent();chunks.push(...c.items.map(x=>String(x.str||'')));}
 const parsed=parseLaPlataApproved2026(chunks.join(' '),{sourceUrl:ARG_LP_SOURCE_URL});rows=parsed.rows;monthly=parsed.monthly;
}catch(e){
 // Acquisition failure is not cancellation evidence. Never emit empty-success.
 const message=String(e?.message??e);
 if(/calendar|month|Resolution|fingerprint|approved|121|duplicate|date/i.test(message))parse_failures.push({stage:'la_plata_pdf_parse',error:message});
 else source_errors.push({stage:'la_plata_pdf_fetch',error:message});
}
if(start.slice(0,4)!=='2026'||end.slice(0,4)!=='2026')source_warnings.push({note:'Only officially published 2026 dates emitted; no 2027 extrapolation'});
const status=source_errors.length?'network_error':parse_failures.length?'parse_error':'success';
const visible=rows.filter(x=>x.date>=start&&x.date<end);
const records=status==='success'?visible.map(x=>buildLaPlataMeetingRecord(x,{checkedAt:generatedAt})):[];
const ranks=Object.fromEntries(['C','B','B+','A','A+'].map(k=>[k,records.filter(x=>x.capability_rank===k).length]));
const completion=Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map(k=>[k,records.filter(x=>x.acquisition_completion?.disposition===k).length]));
const artifact={
 schema_version:'argentina-la-plata-2026-approved-candidates-v1',
 generated_at:generatedAt,country_id:'argentina',authority_id:ARG_LP_AUTHORITY_ID,racing_system_id:ARG_LP_SYSTEM_ID,timezone:ARG_LP_TIMEZONE,source_id:ARG_LP_SOURCE_ID,
 collection_target_rank:'best_available',raw_body_retained:false,
 acquisition_attempt:{attempted_at:generatedAt,status,source_id:ARG_LP_SOURCE_ID,route_id:ARG_LP_ROUTE_ID,error_code:status==='success'?null:'arg_la_plata_'+status},
 discovery:{method:'pdf_text_span_res_1024_approved_2026_calendar',source_url:ARG_LP_SOURCE_URL,source_visible_rows:rows.length,window_visible_rows:visible.length,month_counts:monthly,pdf_pages:pdfPages,pdf_bytes:pdfBytes,rank_counts:ranks,completion_counts:completion},
 window:{start_date:start,end_date_exclusive:end,days,coverage_claim:status==='success'?'single_la_plata_2026_approved_dates_only':'acquisition_failed_preserve_verified_state',coverage_note:'Argentina partial: official 2026 La Plata approved racing dates only. No national coverage, no official actual attendance or cancellation proof; source failure never implies non-running.'},
 records,diagnostics:{source_errors,parse_failures,unknown_venues:[],source_warnings}
};
fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(path.resolve(output),JSON.stringify(artifact,null,2)+'\n');
console.log('ARG_LAPLATA_WINDOW '+JSON.stringify({status,source_visible_rows:rows.length,window_rows:visible.length,emitted:records.length,dates:records.map(x=>x.date),monthly,source_errors,parse_failures,pdf_bytes:pdfBytes}));
