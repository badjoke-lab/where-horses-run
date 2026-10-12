import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

// Source: NJ Racing Commission's state-issued, color-coded 2026 PDF only.
// No access to privately operated racetrack websites.
const arg=(k,def=null)=>process.argv.find(v=>v.startsWith('--'+k+'='))?.slice(k.length+3)??def;
const outputDir=arg('output-dir'),days=Number(arg('days','30'));
const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
const vals=Object.fromEntries(parts.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
const start=arg('as-of',vals.year+'-'+vals.month+'-'+vals.day);
if(!outputDir)throw Error('NJRC --output-dir required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!Number.isInteger(days)||days<1||days>120)throw Error('invalid NJRC window');
const facts=path.resolve(outputDir,'_njrc-source-facts.json');
function run(cmd,args){
 const ret=spawnSync(cmd,args,{stdio:'inherit',timeout:120000,env:process.env});
 if(ret.error||ret.status!==0)throw Error('NJRC source extraction/normalization failed; preserving existing production records: '+String(ret.error??ret.status));
}
fs.mkdirSync(outputDir,{recursive:true});
try {
 run('python3',['scripts/timetable/run-us-njrc-2026-source-facts.py','--output',facts]);
 run('node',['scripts/timetable/build-us-njrc-2026-calendar-candidates.mjs',
  '--input='+facts,'--as-of='+start,'--days='+days,'--output-dir='+outputDir]);
} catch(error) {
 const sourceId='njrc-approved-2026-race-date-calendar';
 const ids={
  monmouth:'us-nj-monmouth-thoroughbred-2026-system',
  meadowlands_turf:'us-nj-meadowlands-thoroughbred-turf-2026-system',
  far_hills_steeplechase:'us-nj-far-hills-steeplechase-2026-system'
 };
 const endObj=new Date(start+'T00:00:00Z');endObj.setUTCDate(endObj.getUTCDate()+days);
 const end=endObj.toISOString().slice(0,10);
 const generatedAt=new Date().toISOString();
 for(const [category,systemId] of Object.entries(ids)){
  const artifact={
   schema_version:'us-njrc-2026-official-window-candidates-v1',
   generated_at:generatedAt,country_id:'united-states',authority_id:'new-jersey-racing-commission',
   racing_system_id:systemId,timezone:'America/New_York',source_id:sourceId,collection_target_rank:'best_available',
   raw_body_retained:false,
   acquisition_attempt:{attempted_at:generatedAt,status:'network_error',source_id:sourceId,route_id:'njrc-approved-2026-'+category,error_code:'njrc_pdf_source_or_parser_unavailable'},
   discovery:{method:'njrc_2026_approved_pdf_color_date',source_visible_rows:0,window_visible_rows:0,rank_counts:{C:0,B:0,'B+':0,A:0,'A+':0}},
   window:{start_date:start,end_date_exclusive:end,days,coverage_claim:'acquisition_failed_preserve_verified_state',coverage_note:'Do not infer non-running, deletion or cancellation from NJRC source failure.'},
   records:[],diagnostics:{source_errors:[{stage:'njrc_pdf_fetch_or_parse',error:String(error.message)}],parse_failures:[],unknown_venues:[],source_warnings:[]}
  };
  fs.writeFileSync(path.join(outputDir,category+'.json'),JSON.stringify(artifact,null,2)+'\n');
 }
 console.error('NJRC 2026 source unavailable: emitted failure diagnostics for all three systems; retaining last verified canonical data.');
} finally {
 try{fs.unlinkSync(facts)}catch{}
}
