import fs from 'node:fs';
import path from 'node:path';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {ONTARIO_THREE_SOURCES,ONTARIO_THREE_TIMEZONE,ONTARIO_THREE_AUTHORITY,parseOntarioThreePdfItems,buildOntarioThreeMeeting} from './canada-ontario-three-agco-2026-core.mjs';

const arg=(n,f=null)=>process.argv.find(x=>x.startsWith('--'+n+'='))?.slice(n.length+3)??f;
function localDate(){
 const p=new Intl.DateTimeFormat('en-CA',{timeZone:ONTARIO_THREE_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const x=Object.fromEntries(p.filter(k=>k.type!=='literal').map(k=>[k.type,k.value]));
 return x.year+'-'+x.month+'-'+x.day;
}
const start=arg('as-of',localDate()),days=Number(arg('days','30')),dir=arg('output-dir');
if(!dir)throw Error('required --output-dir');
if(!/^\d{4}-\d\d-\d\d$/.test(start)||!Number.isInteger(days)||days<1||days>120)throw Error('bad Ontario date window');
const stop=new Date(start+'T00:00:00Z');stop.setUTCDate(stop.getUTCDate()+days);const end=stop.toISOString().slice(0,10);
const generatedAt=new Date().toISOString();fs.mkdirSync(dir,{recursive:true});
async function sourcePdf(source){
 const r=await fetch(source.url,{redirect:'follow',headers:{'user-agent':'WhereHorsesRun/1.0 (+https://github.com/badjoke-lab/where-horses-run)','accept':'application/pdf'},signal:AbortSignal.timeout(45000)});
 const host=new URL(r.url).hostname;
 if(!r.ok||!['agco.ca','www.agco.ca'].includes(host))throw Error('AGCO source HTTP/host failure '+r.status+' '+host);
 const bytes=new Uint8Array(await r.arrayBuffer());
 if(bytes.length<5000||bytes.length>8_000_000||String.fromCharCode(...bytes.slice(0,5))!=='%PDF-')throw Error('AGCO unexpected PDF body');
 const doc=await getDocument({data:bytes,disableWorker:true}).promise;
 if(doc.numPages!==1)throw Error('AGCO 2026 PDF page count changed');
 const c=await (await doc.getPage(1)).getTextContent();
 return {bytes:bytes.length,items:c.items.map(x=>({text:String(x.str??'').trim(),x:Number(x.transform?.[4]),y:Number(x.transform?.[5])})),url:r.url};
}
const result=[];
for(const source of ONTARIO_THREE_SOURCES){
 const source_errors=[],parse_failures=[];
 let rows=[],size=0;
 try{
  const pdf=await sourcePdf(source);size=pdf.bytes;
  try{rows=parseOntarioThreePdfItems(pdf.items,source);}catch(e){parse_failures.push({error:String(e?.message??e),stage:'agco_pdf_parse'});}
 }catch(e){source_errors.push({error:String(e?.message??e),stage:'agco_pdf_fetch'});}
 const status=source_errors.length?'network_error':parse_failures.length?'parse_error':'success';
 const current=rows.filter(x=>x.date>=start&&x.date<end);
 const records=status==='success'?current.map(x=>buildOntarioThreeMeeting(x,source,generatedAt)):[];
 const artifact={
  schema_version:'canada-ontario-agco-three-2026-window-candidates-v1',generated_at:generatedAt,
  country_id:'canada',authority_id:ONTARIO_THREE_AUTHORITY,racing_system_id:source.system_id,
  timezone:ONTARIO_THREE_TIMEZONE,source_id:source.source_id,collection_target_rank:'best_available',raw_body_retained:false,
  acquisition_attempt:{attempted_at:generatedAt,status,source_id:source.source_id,route_id:'agco-2026-'+source.key,
   error_code:source_errors.length?'agco_source_fetch_failed':parse_failures.length?'agco_source_parse_failed':null},
  discovery:{method:'agco_approved_2026_calendar_pdf_geometry',source_url:source.url,source_visible_rows:status==='success'?rows.length:0,window_visible_rows:records.length,pdf_bytes:size,
   rank_counts:{C:records.length,B:0,'B+':0,A:0,'A+':0}},
  window:{start_date:start,end_date_exclusive:end,days,coverage_claim:status==='success'?'ontario_agco_2026_single_venue_approved_dates':'acquisition_failed_preserve_verified_state',
   coverage_note:'AGCO-approved 2026 dates at only this physical Ontario venue and racing code; does not guarantee event was held. Never infer cancellations from missing records. No 2027 recurrence or all-Canada coverage.'},
  records,diagnostics:{source_errors,parse_failures,unknown_venues:[],source_warnings:[]}
 };
 const file=path.join(dir,source.key+'.json');fs.writeFileSync(file,JSON.stringify(artifact,null,2)+'\n');
 result.push({key:source.key,status,approved_source_rows:rows.length,records:records.length,dates:records.map(x=>x.date),source_errors:source_errors.length,parse_failures:parse_failures.length,file});
}
console.log('ONTARIO_THREE_AGCO_2026_C '+JSON.stringify({date_start:start,date_end_exclusive:end,results:result}));
