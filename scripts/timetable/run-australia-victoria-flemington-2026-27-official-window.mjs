import fs from 'node:fs';
import path from 'node:path';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {AU_VIC_COUNTRY,AU_VIC_AUTHORITY,AU_VIC_SYSTEM,AU_VIC_SOURCE,AU_VIC_TZ,AU_VIC_PDF,AU_VIC_RELEASE,parseFlemingtonApprovedSeason2026_27,buildFlemingtonCMeeting} from './australia-victoria-flemington-2026-27-core.mjs';
const arg=(k,d=null)=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??d;
const today=()=>{let p=new Intl.DateTimeFormat('en-CA',{timeZone:AU_VIC_TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());let z=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return z.year+'-'+z.month+'-'+z.day};
const plus=(s,n)=>{let d=new Date(s+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const start=arg('as-of',today()),days=Number(arg('days','30')),output=arg('output');
if(!output||!/^\d{4}-\d{2}-\d{2}$/.test(start)||!Number.isInteger(days)||days<1||days>120)throw Error('required --output, --as-of=YYYY-MM-DD and --days 1..120');
const at=new Date().toISOString(),end=plus(start,days),source_errors=[],parse_failures=[],source_warnings=[];
let approved=[],pages=0,pdfBytes=0;
try{
 const head={'user-agent':'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)','accept':'text/html,application/pdf;q=0.9'};
 const pub=await fetch(AU_VIC_RELEASE,{headers:head,signal:AbortSignal.timeout(25000)});
 if(!pub.ok)throw Error('Victoria release status '+pub.status);
 if(new URL(pub.url).hostname!=='www.racingvictoria.com.au')throw Error('Victoria release redirect host');
 const html=await pub.text();
 if(!/528 race meetings/i.test(html)||!/2026-27 Victorian Race Dates/i.test(html))throw Error('Victoria approved/public season release fingerprint mismatch');
 const found=html.match(/(?:https:\/\/dxp-cdn\.racing\.com)?\/api\/public\/content\/[^"'<> ]*Victorian_Race_Dates_2026-27_FINAL[^"'<> ]*\.pdf[^"'<> ]*/i)?.[0];
 const link=found?(found.startsWith('https:')?found:'https://dxp-cdn.racing.com'+found.replaceAll('&amp;','&')):AU_VIC_PDF;
 const u=new URL(link);
 if(u.hostname!=='dxp-cdn.racing.com'||!u.pathname.startsWith('/api/public/content/'))throw Error('unreviewed approved fixture PDF destination');
 const r=await fetch(link,{headers:head,signal:AbortSignal.timeout(40000)});
 if(!r.ok)throw Error('Victoria approved fixture PDF HTTP '+r.status);
 const data=new Uint8Array(await r.arrayBuffer());pdfBytes=data.length;
 if(data.length<20000||data.length>3000000||new TextDecoder().decode(data.slice(0,5))!=='%PDF-')throw Error('approved fixture PDF content/size guard');
 const pdf=await getDocument({data,disableWorker:true}).promise;pages=pdf.numPages;
 if(pages<10||pages>30)throw Error('unexpected Victorian 2026-27 PDF page count '+pages);
 const pageTexts=[];for(let i=1;i<=pages;i++){const x=await(await pdf.getPage(i)).getTextContent();pageTexts.push(x.items.map(z=>z.str));}
 approved=parseFlemingtonApprovedSeason2026_27(pageTexts,{url:link});
}catch(e){const s=String(e?.message??e);if(/fingerprint|fixture date|denominator|duplicate|page count|page structure|date\/weekday/i.test(s))parse_failures.push({stage:'rv_approved_flemington_2026_27_parse',error:s});else source_errors.push({stage:'rv_approved_calendar_fetch',error:s})}
if(end>'2027-08-01')source_warnings.push({note:'No extrapolation after July 2027; next season requires independent official fixture'});
const status=source_errors.length?'network_error':parse_failures.length?'parse_error':'success';
const visible=approved.filter(x=>x.date>=start&&x.date<end);
const records=status==='success'?visible.map(row=>buildFlemingtonCMeeting(row,{checkedAt:at})):[];
const artifact={
 schema_version:'australia-victoria-flemington-2026-27-official-v1',
 generated_at:at,country_id:AU_VIC_COUNTRY,authority_id:AU_VIC_AUTHORITY,racing_system_id:AU_VIC_SYSTEM,timezone:AU_VIC_TZ,source_id:AU_VIC_SOURCE,
 collection_target_rank:'best_available',raw_body_retained:false,
 acquisition_attempt:{attempted_at:at,status,source_id:AU_VIC_SOURCE,route_id:'australia-victoria-flemington-2026-27',error_code:status==='success'?null:'au_victoria_'+status},
 discovery:{method:'racing_victoria_approved_2026_27_pdf_venue_date_only',source_url:AU_VIC_RELEASE,document_url:AU_VIC_PDF,season_approved_flemington_dates:approved.length,window_visible_rows:visible.length,pdf_pages:pages,pdf_bytes:pdfBytes,rank_counts:{C:records.length}},
 window:{start_date:start,end_date_exclusive:end,days,coverage_claim:status==='success'?'single_flemington_thoroughbred_approved_dates_only':'acquisition_failed_preserve_verified_state',coverage_note:'Partial Australia: 2026-27 Racing Victoria approved Flemington Thoroughbred dates only; no NSW, QLD, other Victoria venue, harness, greyhound or national coverage claim. Failure is never cancellation.'},
 records,diagnostics:{source_errors,parse_failures,unknown_venues:[],source_warnings}};
fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(path.resolve(output),JSON.stringify(artifact,null,2)+'\n');
console.log('AU_VICTORIA_FLEMINGTON_WINDOW '+JSON.stringify({status,season_approved:approved.length,window:records.length,dates:records.map(x=>x.date),pages,errors:source_errors,parse_failures}));
