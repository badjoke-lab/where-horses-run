import fs from 'node:fs';
import path from 'node:path';
import {PORPROV_IDENTITY as ID,PORPROV_DAYS,parseKoniDay,parseKoniDiscipline,parseOrganizer,buildC} from './indonesia-porprov-2026-c-source-core.mjs';
const arg=(key,defaultValue)=>process.argv.find(x=>x.startsWith('--'+key+'='))?.slice(key.length+3)??defaultValue;
const nowJakarta=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const start=arg('as-of',nowJakarta()),days=Number(arg('days','30')),output=arg('output',null);
if(!output||!/^20\d\d-\d\d-\d\d$/.test(start)||!Number.isInteger(days)||days<1||days>120)
 throw Error('output, valid as-of, and days 1..120 required');
const addDays=(s,n)=>{const d=new Date(s+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const end=addDays(start,days),checkedAt=new Date().toISOString();
const source_errors=[],parse_failures=[],source_warnings=[];
const headers={'user-agent':'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)','accept':'text/html,text/plain;q=0.9'};
const get=async(host,p)=>{
 const response=await fetch(host+p,{headers,redirect:'manual',signal:AbortSignal.timeout(18000)});
 if(response.status!==200)throw Error('http_'+response.status+'_'+host+p);
 if(!/^text\/(?:html|plain)\b/i.test(response.headers.get('content-type')||''))throw Error('not_html');
 if(Number(response.headers.get('content-length')||0)>800000)throw Error('source_too_large');
 const body=await response.text();if(body.length>800000)throw Error('source_too_large');
 return body;
};
function disallowed(raw,p){
 let applies=false;const denied=[];
 for(const lineRaw of raw.split(/\r?\n/)){
  const line=lineRaw.replace(/#.*/,'').trim();
  if(/^user-agent:/i.test(line)){applies=/^user-agent:\s*(?:\*|wherehorsesrun(?:\/1\.0)?)\s*$/i.test(line);continue;}
  if(applies){const d=line.match(/^disallow:\s*(\S+)/i);if(d?.[1])denied.push(d[1]);}
 }
 return denied.some(x=>x==='/'||p.startsWith(x));
}
async function sourceScope(host,paths){
 const robots=await get(host,'/robots.txt');
 for(const p of paths)if(disallowed(robots,p))throw Error('robots_disallows_'+host+p);
}
let rows=[],status='success';
try{
 // Each scheduled run makes exactly two dated-competition requests and a
 // discipline check, not any calendar crawl / third-party fixture harvesting.
 const paths=['/info','/cabor/berkuda',...PORPROV_DAYS.map(x=>'/jadwal?tgl='+x.date)];
 await sourceScope(ID.koniBase,paths);
 const terms=await get(ID.koniBase,'/info');
 const termsText=terms.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
 if(!/non-komersial/i.test(termsText)||!/scraping/i.test(termsText)||!/izin\s+tertulis/i.test(termsText))
  throw Error('KONI terms conditions fingerprint changed');
 parseKoniDiscipline(await get(ID.koniBase,'/cabor/berkuda'));
 const daily=[];
 for(const day of PORPROV_DAYS)daily.push(parseKoniDay(await get(ID.koniBase,'/jadwal?tgl='+day.date),day));
 const organizer='https://porprovbekasikota2026.id';
 await sourceScope(organizer,['/cabang-olahraga/berkuda-pacu']);
 parseOrganizer(await get(organizer,'/cabang-olahraga/berkuda-pacu'));
 rows=daily;
}catch(e){
 const error=String(e?.message||e);
 if(/fingerprint|absent/.test(error))parse_failures.push({stage:'indonesia_koni_scoped_c_parser',error});
 else source_errors.push({stage:'indonesia_koni_first_party_source',error});
 status=source_errors.length?'network_error':'parse_error';
}
const visible=status==='success'?rows.filter(x=>x.date>=start&&x.date<end):[];
const records=visible.map(x=>buildC(x,{checkedAt}));
if(end>'2026-11-08')source_warnings.push({note:'Only the one 2026 PORPROV competition, no later-year or Indonesia-wide meeting inference'});
const artifact={
 schema_version:'indonesia-porprov-2026-legokjawa-c-v1',generated_at:checkedAt,
 country_id:ID.country,authority_id:ID.authority,racing_system_id:ID.system,timezone:ID.timezone,source_id:ID.source,
 collection_target_rank:'best_available',raw_body_retained:false,
 acquisition_attempt:{attempted_at:checkedAt,status,source_id:ID.source,route_id:ID.route,error_code:status==='success'?null:'indonesia_porprov_'+status},
 discovery:{method:'source_scoped_koni_sport_days_crosschecked_organizer',source_url:ID.koniBase+'/cabor/berkuda',
   source_visible_rows:rows.length,window_visible_rows:visible.length,rank_counts:{C:records.length}},
 window:{start_date:start,end_date_exclusive:end,days,
   coverage_claim:status==='success'?'2026 PORPROV Legokjawa horse-racing competition scheduled 7 and 8 November only':'source_failure_keep_last_verified',
   coverage_note:'Only two scheduled dates at one physical venue. No racecard, times, results, actual-ran inference, or national 2026 coverage.'},
 records,diagnostics:{source_errors,parse_failures,unknown_venues:[],source_warnings}
};
fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(path.resolve(output),JSON.stringify(artifact,null,2)+'\n');
console.log('INDONESIA_PORPROV_C_WINDOW '+JSON.stringify({status,source_visible_rows:rows.length,window_rows:records.length,
 dates:records.map(x=>x.date),source_errors,parse_failures,source_warnings}));
