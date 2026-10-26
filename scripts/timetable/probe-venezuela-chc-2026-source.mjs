/**
 * One first-party CHC PDF request, no retries, no raw PDF or page text storage.
 * Read-only candidate discovery; NEVER publishes Venezuela meetings.
 */
import fs from 'node:fs';
import path from 'node:path';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {VEN_CHC_URL,parseChcVenezuela2026} from './venezuela-chc-2026-source-core.mjs';
const arg=(key,def=null)=>process.argv.find(x=>x.startsWith('--'+key+'='))?.slice(key.length+3)??def;
const output=arg('output');
const asOf=arg('as-of','2026-10-26');
const horizon=Number(arg('days','90'));
if(!output||!/^\d{4}-\d{2}-\d{2}$/.test(asOf)||!Number.isInteger(horizon)||horizon<1||horizon>120)throw Error('require --output and valid window');
const end=new Date(asOf+'T00:00:00Z');end.setUTCDate(end.getUTCDate()+horizon);
const until=end.toISOString().slice(0,10);
let dates=[],sourceRows=0,pages=0,error=null,issue=null;
try{
 const res=await fetch(VEN_CHC_URL,{headers:{'user-agent':'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)','accept':'application/pdf'},redirect:'follow',signal:AbortSignal.timeout(40000)});
 if(!res.ok)throw Error('CHC Venezuela HTTP '+res.status);
 const final=new URL(res.url),source=new URL(VEN_CHC_URL);
 if(final.host!==source.host||final.pathname!==source.pathname)throw Error('CHC Venezuela unreviewed redirect');
 if(Number(res.headers.get('content-length')||0)>4000000)throw Error('CHC Venezuela source size limit');
 const bytes=new Uint8Array(await res.arrayBuffer());
 if(bytes.length<1500||bytes.length>4000000||new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw Error('CHC Venezuela source signature/size');
 const pdf=await getDocument({data:bytes,disableWorker:true}).promise;
 pages=pdf.numPages;
 if(pages<3||pages>12)throw Error('CHC Venezuela page count drift');
 const tokens=[];
 for(let n=1;n<=pages;n++){const content=await(await pdf.getPage(n)).getTextContent();tokens.push(content.items.map(x=>x.str))}
 const parsed=parseChcVenezuela2026(tokens);
 sourceRows=parsed.source_classic_rows;dates=parsed.days;
}catch(e){const m=String(e?.message??e);if(/fingerprint|denominator|invalid date|unreviewed venue|page count|tokens invalid/.test(m))issue=m;else error=m}
const status=issue?'parse_error':error?'source_error':'success';
const visible=status==='success'?dates.filter(r=>r.date>=asOf&&r.date<until):[];
const artifact={
 schema_version:'venezuela-chc-2026-read-only-probe-v1',
 country_id:'venezuela',physical_venue_id:'venezuela--hipodromo-la-rinconada',
 source_url:VEN_CHC_URL,rights_status:'REVIEW_REQUIRED',production_status:'PROBE_ONLY',
 collected_at:new Date().toISOString(),window:{as_of:asOf,end_exclusive:until},
 acquisition_status:status,source_pdf_pages:pages,source_classic_rows:sourceRows,
 source_unique_dates:dates.length,dates_in_window:visible.map(x=>x.date),
 list_dates_all:dates.map(x=>x.date),
 diagnostics:{source_error:error,parse_error:issue},
 constraints:'Published 2026 selected classics only; not Venezuela national/full daily calendar. No actual ran, race times or cancellation inferred.'
};
fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});
fs.writeFileSync(output,JSON.stringify(artifact,null,2)+'\n');
console.log('VEN_CHC_READ_ONLY_PROBE '+JSON.stringify({status,sourceRows,uniqueDates:dates.length,datesInWindow:visible.map(x=>x.date),pdfPages:pages,error,issue}));
