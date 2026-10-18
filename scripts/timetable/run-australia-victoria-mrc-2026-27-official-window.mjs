import fs from 'node:fs';
import path from 'node:path';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {AU_VIC_COUNTRY,AU_VIC_TZ,AU_VIC_PDF,AU_VIC_RELEASE,AU_MRC_AUTHORITY,AU_MRC_SYSTEM,AU_MRC_SOURCE,AU_MRC_ROUTE,parseVictoriaMrc2026_27,buildVictoriaMrcCMeeting} from './australia-victoria-mrc-2026-27-core.mjs';
const arg=(k,d=null)=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??d;
const localDate=()=>{const p=new Intl.DateTimeFormat('en-CA',{timeZone:AU_VIC_TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const v=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return v.year+'-'+v.month+'-'+v.day};
const plus=(s,n)=>{const d=new Date(s+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const output=arg('output'),start=arg('as-of',localDate()),days=Number(arg('days','30'));
if(!output||!/^\d{4}-\d{2}-\d{2}$/.test(start)||!Number.isInteger(days)||days<1||days>120)throw Error('expected --output, --as-of YYYY-MM-DD, --days 1..120');
const at=new Date().toISOString(),end=plus(start,days),source_errors=[],parse_failures=[],source_warnings=[];
let rows=[],counts={},pages=0,pdfBytes=0;
try{
 const headers={'user-agent':'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)','accept':'text/html,application/pdf;q=0.9'};
 const pub=await fetch(AU_VIC_RELEASE,{headers,signal:AbortSignal.timeout(25000)});
 if(!pub.ok||new URL(pub.url).hostname!=='www.racingvictoria.com.au')throw Error('Racing Victoria official release '+pub.status);
 const html=await pub.text();
 if(!/528 race meetings/i.test(html)||!/2026-27 Victorian Race Dates/i.test(html))throw Error('Racing Victoria season release fingerprint');
 const found=html.match(/(?:https:\/\/dxp-cdn\.racing\.com)?\/api\/public\/content\/[^"'<> ]*Victorian_Race_Dates_2026-27_FINAL[^"'<> ]*\.pdf[^"'<> ]*/i)?.[0];
 const url=found?(found.startsWith('https:')?found:'https://dxp-cdn.racing.com'+found.replaceAll('&amp;','&')):AU_VIC_PDF;
 const check=new URL(url);if(check.hostname!=='dxp-cdn.racing.com'||!check.pathname.startsWith('/api/public/content/'))throw Error('unreviewed Racing Victoria PDF host');
 const res=await fetch(url,{headers,signal:AbortSignal.timeout(40000)});if(!res.ok)throw Error('approved Racing Victoria PDF status '+res.status);
 const data=new Uint8Array(await res.arrayBuffer());pdfBytes=data.length;
 if(data.length<20000||data.length>3000000||new TextDecoder().decode(data.slice(0,5))!=='%PDF-')throw Error('approved RV PDF type/size');
 const pdf=await getDocument({data,disableWorker:true}).promise;pages=pdf.numPages;
 if(pages<10||pages>30)throw Error('Racing Victoria PDF page count');
 const tokens=[];for(let i=1;i<=pages;i++){const x=await(await pdf.getPage(i)).getTextContent();tokens.push(x.items.map(z=>z.str));}
 const p=parseVictoriaMrc2026_27(tokens,{url});rows=p.rows;counts=p.counts;
}catch(e){const s=String(e?.message??e);if(/denominator|date\/week|out-of-season|duplicate|venue count|season release fingerprint|page count|page structure/.test(s))parse_failures.push({stage:'racing_victoria_mrc_2026_27_parse',error:s});else source_errors.push({stage:'rv_2026_27_fixture_fetch',error:s});}
if(end>'2027-08-01')source_warnings.push({note:'Do not extrapolate beyond RV 2026-27 published season'});
const status=source_errors.length?'network_error':parse_failures.length?'parse_error':'success';
const visible=rows.filter(r=>r.date>=start&&r.date<end);
const records=status==='success'?visible.map(row=>buildVictoriaMrcCMeeting(row,{checkedAt:at})):[];
const artifact={
 schema_version:'australia-victoria-mrc-2026-27-approved-v1',generated_at:at,country_id:AU_VIC_COUNTRY,authority_id:AU_MRC_AUTHORITY,racing_system_id:AU_MRC_SYSTEM,timezone:AU_VIC_TZ,source_id:AU_MRC_SOURCE,collection_target_rank:'best_available',raw_body_retained:false,
 acquisition_attempt:{attempted_at:at,status,source_id:AU_MRC_SOURCE,route_id:AU_MRC_ROUTE,error_code:status==='success'?null:'au_victoria_mrc_'+status},
 discovery:{method:'racing_victoria_published_2026_27_pdf_mrc_date_physical_venue_only',source_url:AU_VIC_RELEASE,document_url:AU_VIC_PDF,approved_mrc_season_rows:rows.length,venue_breakdown:counts,physical_venues:[...new Set(rows.map(x=>x.racecourse_id))].sort(),window_visible_rows:visible.length,pdf_pages:pages,pdf_bytes:pdfBytes,rank_counts:{C:records.length}},
 window:{start_date:start,end_date_exclusive:end,days,coverage_claim:status==='success'?'racing_victoria_2026_27_mrc_only':'source_failure_preserve_verified_state',coverage_note:'Partial Australia/Victoria: MRC 2026-27 physical venues Caulfield, Sportsbet Sandown, Mornington. Caulfield Heath normalized as Caulfield site. Existing Flemington belongs to distinct route, no Moonee Valley racing and no statewide/other code coverage claim.'},
 records,diagnostics:{source_errors,parse_failures,unknown_venues:[],source_warnings}};
fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(path.resolve(output),JSON.stringify(artifact,null,2)+'\n');
console.log('AU_VICTORIA_MRC_WINDOW '+JSON.stringify({status,total:rows.length,breakdown:counts,window:records.length,dates:records.map(x=>x.date+':'+x.racecourse_id),pages,source_errors,parse_failures}));
