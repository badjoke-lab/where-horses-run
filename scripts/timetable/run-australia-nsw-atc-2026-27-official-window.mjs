import fs from 'node:fs';
import path from 'node:path';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {AU_NSW_COUNTRY,AU_NSW_AUTHORITY,AU_NSW_SYSTEM,AU_NSW_SOURCE,AU_NSW_TZ,AU_NSW_PDF,AU_NSW_RELEASE,AU_NSW_ROUTE,parseAtc2026_27FixtureTokens,buildAtcCMeeting} from './australia-nsw-atc-2026-27-core.mjs';
const arg=(k,d=null)=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??d;
const today=()=>{let p=new Intl.DateTimeFormat('en-CA',{timeZone:AU_NSW_TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());let z=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return z.year+'-'+z.month+'-'+z.day};
const plus=(s,n)=>{let d=new Date(s+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const start=arg('as-of',today()),days=Number(arg('days','30')),output=arg('output');
if(!output||!/^\d{4}-\d{2}-\d{2}$/.test(start)||!Number.isInteger(days)||days<1||days>120)throw Error('required --output, --as-of YYYY-MM-DD, --days 1..120');
const at=new Date().toISOString(),end=plus(start,days),source_errors=[],parse_failures=[],source_warnings=[];
let approved=[],monthCounts={},season=0,pages=0,pdfBytes=0,venueIds=[];
try{
 const pdf=await fetch(AU_NSW_PDF,{headers:{'user-agent':'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)','accept':'application/pdf'},signal:AbortSignal.timeout(40000)});
 if(!pdf.ok)throw Error('ATC official fixture PDF status '+pdf.status);
 if(new URL(pdf.url).hostname!=='cdn.australianturfclub.com.au')throw Error('ATC unreviewed fixture redirect host');
 const bytes=new Uint8Array(await pdf.arrayBuffer());pdfBytes=bytes.length;
 if(bytes.length<10000||bytes.length>15000000||new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw Error('ATC fixture PDF content/size guard');
 const doc=await getDocument({data:bytes,disableWorker:true}).promise;pages=doc.numPages;
 if(pages!==2)throw Error('ATC 2026-27 fixture PDF page count drift');
 const tokenPages=[];for(let i=1;i<=pages;i++){const items=await(await doc.getPage(i)).getTextContent();tokenPages.push(items.items.map(x=>x.str));}
 const parsed=parseAtc2026_27FixtureTokens(tokenPages,{url:AU_NSW_PDF});
 approved=parsed.rows;monthCounts=parsed.byMonth;season=parsed.allSourceDates;venueIds=parsed.physicalVenueIds;
}catch(e){const s=String(e?.message??e);if(/drift|fixture month|weekday|scope size|duplicate|identity|page count|sourceDate/i.test(s))parse_failures.push({stage:'atc_2026_27_fixture_parse',error:s});else source_errors.push({stage:'atc_official_pdf_fetch',error:s});}
if(end>'2027-08-01')source_warnings.push({note:'No 2027-28 extrapolation. New season must come from separately released ATC source.'});
const status=source_errors.length?'network_error':parse_failures.length?'parse_error':'success';
const visible=approved.filter(x=>x.date>=start&&x.date<end);
const records=status==='success'?visible.map(row=>buildAtcCMeeting(row,{checkedAt:at})):[];
const artifact={
 schema_version:'australia-nsw-atc-2026-27-official-v1',
 generated_at:at,country_id:AU_NSW_COUNTRY,authority_id:AU_NSW_AUTHORITY,racing_system_id:AU_NSW_SYSTEM,timezone:AU_NSW_TZ,source_id:AU_NSW_SOURCE,
 collection_target_rank:'best_available',raw_body_retained:false,
 acquisition_attempt:{attempted_at:at,status,source_id:AU_NSW_SOURCE,route_id:AU_NSW_ROUTE,error_code:status==='success'?null:'au_nsw_atc_'+status},
 discovery:{method:'atc_official_2026_27_fixture_card_pdf_date_and_physical_venue',source_url:AU_NSW_RELEASE,document_url:AU_NSW_PDF,approved_atc_dates:approved.length,all_source_dates:season,source_month_counts:monthCounts,window_visible_rows:visible.length,pdf_pages:pages,pdf_bytes:pdfBytes,venue_ids:venueIds,rank_counts:{C:records.length}},
 window:{start_date:start,end_date_exclusive:end,days,coverage_claim:status==='success'?'atc_ns_w_2026_27_physical_venues_only':'acquisition_failed_preserve_verified_state',coverage_note:'Partial Australia NSW: Australian Turf Club 2026-27 Sydney approved fixtures, 4 physical racecourses; Kensington is Royal Randwick course; provincial fixtures excluded; no other NSW racing claim. Failed acquisition is not cancellation.'},
 records,diagnostics:{source_errors,parse_failures,unknown_venues:[],source_warnings}
};
fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(path.resolve(output),JSON.stringify(artifact,null,2)+'\n');
console.log('AU_NSW_ATC_WINDOW '+JSON.stringify({status,season,approved:approved.length,visible:records.length,dates:records.map(x=>x.date+':'+x.racecourse_id),venueIds,pages,pdfBytes,source_errors,parse_failures}));
