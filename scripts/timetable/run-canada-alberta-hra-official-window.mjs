import fs from 'node:fs';
import path from 'node:path';
import {HRA_AUTHORITY_ID,HRA_SOURCE_ID,HRA_SYSTEM_ID,HRA_TIMEZONE,HRA_BASE_URL,HRA_ROUTE_ID,parseHraCenturyMileMonth,buildHraCenturyMileRecord} from './canada-alberta-hra-2026-core.mjs';
const arg=(name,fallback=null)=>process.argv.find(a=>a.startsWith('--'+name+'='))?.slice(name.length+3)??fallback;
const plusDays=(date,n)=>{const d=new Date(date+'T00:00:00.000Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
function localDate(){return new Intl.DateTimeFormat('en-CA',{timeZone:HRA_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
function monthKeys(start,end){
  const keys=[];let [y,m]=start.slice(0,7).split('-').map(Number);
  while(y*12+m<=Number(end.slice(0,4))*12+Number(end.slice(5,7))){keys.push([y,m]);m++;if(m===13){m=1;y++}}return keys;
}
const output=arg('output'),start=arg('as-of',localDate()),days=Number(arg('days','30'));
if(!output||!/^\d{4}-\d\d-\d\d$/.test(start)||!Number.isInteger(days)||days<1||days>120) throw Error('required --output and valid --as-of/--days');
const end=plusDays(start,days),stamp=new Date().toISOString();
const all=[],source_errors=[],parse_failures=[],source_warnings=[];
let inspectedDays=0;
for(const [year,month] of monthKeys(start,plusDays(end,-1))){
  if(year!==2026){source_warnings.push({year,month,note:'2027 not officially confirmed; never extrapolate'});continue;}
  const url=HRA_BASE_URL+'/monthcalendar/'+year+'/'+month+'/-';
  try{
    const res=await fetch(url,{redirect:'follow',headers:{'user-agent':'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)','accept':'text/html','accept-language':'en-CA,en;q=0.9'},signal:AbortSignal.timeout(25000)});
    if(!['www.thehorses.com','thehorses.com'].includes(new URL(res.url).hostname))throw Error('unexpected redirect host');
    if(!res.ok)throw Error('HRA HTTP '+res.status);
    const html=await res.text();if(html.length>3500000)throw Error('HRA page size guard');
    try{const x=parseHraCenturyMileMonth(html,{year,month,sourceUrl:url});all.push(...x.rows);inspectedDays+=x.calendarDays;}
    catch(e){parse_failures.push({url,error:String(e?.message??e)});}
  }catch(e){source_errors.push({url,error:String(e?.message??e)});}
}
const status=source_errors.length?'network_error':parse_failures.length?'parse_error':'success';
const visible=all.filter(x=>x.date>=start&&x.date<end);
const records=status==='success'?visible.map(x=>buildHraCenturyMileRecord(x,{checkedAt:stamp})):[];
const ranks=Object.fromEntries(['C','B','B+','A','A+'].map(k=>[k,records.filter(r=>r.capability_rank===k).length]));
const completion=Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map(k=>[k,records.filter(r=>r.acquisition_completion?.disposition===k).length]));
const artifact={
 schema_version:'canada-alberta-hra-century-mile-2026-candidates-v1',generated_at:stamp,
 country_id:'canada',authority_id:HRA_AUTHORITY_ID,racing_system_id:HRA_SYSTEM_ID,timezone:HRA_TIMEZONE,source_id:HRA_SOURCE_ID,
 collection_target_rank:'best_available',raw_body_retained:false,
 acquisition_attempt:{attempted_at:stamp,status,source_id:HRA_SOURCE_ID,route_id:HRA_ROUTE_ID,error_code:status==='success'?null:'hra_calendar_'+status},
 discovery:{method:'hra_2026_official_calendar_month_day_cell',source_url:HRA_BASE_URL,source_visible_rows:all.length,window_visible_rows:visible.length,inspected_calendar_days:inspectedDays,rank_counts:ranks,completion_counts:completion},
 window:{start_date:start,end_date_exclusive:end,days,coverage_claim:status==='success'?'century_mile_2026_standardbred_source_visible_dates_only':'acquisition_failed_preserve_verified_state',coverage_note:'Partial Canada: Century Mile Standardbred only. No CD Thoroughbred/Quarter Horse, Lethbridge Runners or other venues are inferred. Failure is not cancellation/non-running evidence.'},
 records,diagnostics:{source_errors,parse_failures,unknown_venues:[],source_warnings}
};
fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});
fs.writeFileSync(path.resolve(output),JSON.stringify(artifact,null,2)+'\n');
console.log('HRA_WINDOW_RESULT '+JSON.stringify({status,source_visible_rows:all.length,window_rows:visible.length,records:records.length,dates:records.map(r=>r.date),source_errors,parse_failures,source_warnings}));
