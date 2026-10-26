import fs from 'node:fs';
import path from 'node:path';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {VEN_CHC_URL,VEN_CHC_COUNTRY,VEN_CHC_AUTHORITY,VEN_CHC_SOURCE,VEN_CHC_SYSTEM,VEN_CHC_ROUTE,VEN_CHC_TIMEZONE,parseChcVenezuela2026,buildChcVenezuelaCMeeting} from './venezuela-chc-2026-source-core.mjs';
const arg=(k,d=null)=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??d;
const localDate=()=>{const pts=new Intl.DateTimeFormat('en-CA',{timeZone:VEN_CHC_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const j=Object.fromEntries(pts.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return j.year+'-'+j.month+'-'+j.day};
const plus=(s,n)=>{const d=new Date(s+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const output=arg('output'),start=arg('as-of',localDate()),days=Number(arg('days','30'));
if(!output||!/^20\d\d-\d\d-\d\d$/.test(start)||!Number.isInteger(days)||days<1||days>120)throw Error('--output, valid --as-of, --days 1..120 required');
const now=new Date().toISOString(),end=plus(start,days),source_errors=[],parse_failures=[],source_warnings=[];
let rows=[],pdfPages=0,pdfBytes=0;
try{
 const headers={'user-agent':'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)','accept':'application/pdf','accept-language':'es,en;q=0.7'};
 const response=await fetch(VEN_CHC_URL,{headers,redirect:'follow',signal:AbortSignal.timeout(45000)});
 if(!response.ok)throw Error('CHC PDF HTTP '+response.status);
 const url=new URL(response.url),src=new URL(VEN_CHC_URL);
 if(url.host!==src.host||url.pathname!==src.pathname)throw Error('unreviewed CHC PDF redirect');
 const bytes=new Uint8Array(await response.arrayBuffer());pdfBytes=bytes.length;
 if(bytes.length<1500||bytes.length>4000000||new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw Error('CHC PDF type/size guard');
 const pdf=await getDocument({data:bytes,disableWorker:true}).promise;pdfPages=pdf.numPages;
 const pages=[];if(pdfPages<3||pdfPages>12)throw Error('CHC PDF page count drift');
 for(let p=1;p<=pdfPages;p++){const text=await(await pdf.getPage(p)).getTextContent();pages.push(text.items.map(x=>x.str))}
 rows=parseChcVenezuela2026(pages).days;
}catch(e){
 const str=String(e?.message??e);
 if(/fingerprint|token|denominator|date|page count|page structure|venue/.test(str))parse_failures.push({stage:'chc_2026_venezuela_pdf_parse',error:str});
 else source_errors.push({stage:'chc_2026_pdf_fetch',error:str});
}
if(end>'2027-01-01')source_warnings.push({note:'CHC 2026 selected classic calendar has no authority for any 2027 dated meeting; do not extrapolate'});
const status=source_errors.length?'network_error':parse_failures.length?'parse_error':'success';
const visible=rows.filter(x=>x.date>=start&&x.date<end);
const records=status==='success'?visible.map(x=>buildChcVenezuelaCMeeting(x,{checkedAt:now})):[];
const artifact={schema_version:'venezuela-chc-2026-selected-classic-dates-v1',
 generated_at:now,country_id:VEN_CHC_COUNTRY,authority_id:VEN_CHC_AUTHORITY,racing_system_id:VEN_CHC_SYSTEM,timezone:VEN_CHC_TIMEZONE,source_id:VEN_CHC_SOURCE,collection_target_rank:'best_available',raw_body_retained:false,
 acquisition_attempt:{attempted_at:now,status,source_id:VEN_CHC_SOURCE,route_id:VEN_CHC_ROUTE,error_code:status==='success'?null:'venezuela_chc_'+status},
 discovery:{method:'official_chc_2026_pdf_venezuela_selected_classic_dates_only',source_url:VEN_CHC_URL,pdf_pages:pdfPages,pdf_bytes:pdfBytes,source_visible_rows:rows.length,window_visible_rows:visible.length,rank_counts:{C:records.length}},
 window:{start_date:start,end_date_exclusive:end,days,coverage_claim:status==='success'?'selected_2026_venezuela_chc_classic_fixture_dates_at_one_venue_only':'source_failure_keep_last_verified',
 coverage_note:'CHC publication lists 25 selected 2026 classic fixture dates at La Rinconada (official April version), not normal Venezuela racing dates. No timing, actual-ran or non-running inferred.'},
 records,diagnostics:{source_errors,parse_failures,unknown_venues:[],source_warnings}};
fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});
fs.writeFileSync(path.resolve(output),JSON.stringify(artifact,null,2)+'\n');
console.log('VEN_CHC_WINDOW '+JSON.stringify({status,source_visible_rows:rows.length,window_rows:records.length,dates:records.map(x=>x.date),pdfPages,source_errors,parse_failures}));
