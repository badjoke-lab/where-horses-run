import fs from 'node:fs';
import path from 'node:path';
import {deriveBestAvailableRank} from './best-available-rank.mjs';
import {classifyAcquisitionCompletion} from './acquisition-completion.mjs';

// Pure transform of verified state-issued NJRC facts into bounded rank-C Calendar artifacts.
// No operator site requests and no additional data inferred.
const SOURCE_ID='njrc-approved-2026-race-date-calendar';
const SOURCE_URL='https://www.njoag.gov/wp-content/uploads/2026/04/Monmouth-race-dates-2026.pdf';
const AUTHORITY_ID='new-jersey-racing-commission';
const TIMEZONE='America/New_York';
const SYSTEMS={
 monmouth:{system:'us-nj-monmouth-thoroughbred-2026-system',venue:'united-states--monmouth-park',type:'thoroughbred-flat'},
 meadowlands_turf:{system:'us-nj-meadowlands-thoroughbred-turf-2026-system',venue:'united-states--meadowlands-racetrack',type:'thoroughbred-flat'},
 far_hills_steeplechase:{system:'us-nj-far-hills-steeplechase-2026-system',venue:'united-states--far-hills-moorland-farm',type:'steeplechase'}
};
const expected={monmouth:50,meadowlands_turf:9,far_hills_steeplechase:1};
const arg=(k,def=null)=>process.argv.find(v=>v.startsWith('--'+k+'='))?.slice(k.length+3)??def;
const input=arg('input'),outputDir=arg('output-dir'),start=arg('as-of','2026-10-12'),days=Number(arg('days','90'));
if(!input||!outputDir)throw Error('required --input= and --output-dir=');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!Number.isInteger(days)||days<1||days>120)throw Error('bad date window');
const endAt=new Date(start+'T00:00:00Z');endAt.setUTCDate(endAt.getUTCDate()+days);
const end=endAt.toISOString().slice(0,10),checkedAt=new Date().toISOString();
const parsed=JSON.parse(fs.readFileSync(input,'utf8'));
if(parsed.schema_version!=='njrc-approved-2026-exact-date-facts-v1'||parsed.source?.source_url!==SOURCE_URL||!Array.isArray(parsed.rows))throw Error('NJRC source proof mismatch');
if(parsed.rows.length!==60)throw Error('NJRC source fact count changed');
const counts=Object.fromEntries(Object.keys(SYSTEMS).map(k=>[k,parsed.rows.filter(x=>x.category===k).length]));
if(JSON.stringify(counts)!==JSON.stringify(expected))throw Error('NJRC source/venue denominator changed: '+JSON.stringify(counts));
if(new Set(parsed.rows.map(x=>x.category+'|'+x.date)).size!==60)throw Error('duplicate date+code');
const ranks=recs=>({C:recs.length,B:0,'B+':0,A:0,'A+':0});
const comps=recs=>Object.fromEntries(['promoted','complete_current_best_available','pending_publication','retry_required','implementation_gap','not_applicable'].map(k=>[k,recs.filter(x=>x.acquisition_completion?.disposition===k).length]));
const outputs=[];
for(const [category,ref] of Object.entries(SYSTEMS)){
 const rows=parsed.rows.filter(x=>x.category===category);
 for(const row of rows){
  if(row.racing_system_id!==ref.system||row.racecourse_id!==ref.venue||row.racing_type!==ref.type||row.source_url!==SOURCE_URL||!/2026-\d\d-\d\d/.test(row.date))throw Error('NJRC row identity/proof mismatch');
 }
 const visible=rows.filter(x=>x.date>=start&&x.date<end);
 const records=visible.map(row=>{
  const meetingId='us-njrc-'+category+'-'+row.date;
  const ev={source_id:SOURCE_ID,official_source_url:SOURCE_URL,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};
  const rec={
   candidate_id:meetingId,meeting_id:meetingId,country_id:'united-states',authority_id:AUTHORITY_ID,
   racing_system_id:ref.system,racecourse_id:ref.venue,date:row.date,timezone:TIMEZONE,
   racing_type:ref.type,first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
   source:{source_id:SOURCE_ID,official_url:SOURCE_URL,checked_at:checkedAt,extraction_method:'njrc_2026_approved_pdf_color_date'},
   route_id:'njrc-approved-2026-'+category,confidence:'high',review_status:'needs_review',
   notes:'NJRC government-published approved 2026 racing day at the coded physical venue. Rank C only. No operator website scraping. An approved date is not proof of non-cancellation; no cancellation inferred from future source changes.',
   detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:SOURCE_URL},
   acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:SOURCE_ID,route_id:'njrc-approved-2026-'+category,error_code:null},
   evidence_support:{meeting_identity:ev,meeting_date:ev}
  };
  const rank=deriveBestAvailableRank(rec,[]);
  if(rank!=='C')throw Error('NJRC candidate unexpectedly not rank C');
  rec.acquisition_completion=classifyAcquisitionCompletion({...rec,capability_rank:rank},{technical_capability_rank:'C'});
  return {...rec,capability_rank:rank};
 });
 const artifact={
  schema_version:'us-njrc-2026-official-window-candidates-v1',generated_at:checkedAt,country_id:'united-states',
  authority_id:AUTHORITY_ID,racing_system_id:ref.system,timezone:TIMEZONE,source_id:SOURCE_ID,
  collection_target_rank:'best_available',raw_body_retained:false,
  acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:SOURCE_ID,route_id:'njrc-approved-2026-'+category,error_code:null},
  discovery:{method:'njrc_2026_approved_pdf_color_date',source_url:SOURCE_URL,source_visible_rows:rows.length,window_visible_rows:records.length,rank_counts:ranks(records),completion_counts:comps(records),approved_pdf_sha256:parsed.source.pdf_sha256},
  window:{start_date:start,end_date_exclusive:end,days,coverage_claim:'njrc_approved_2026_specific_venue_only',coverage_note:'Scope NJ 2026 approved dates at one venue and racing code only; not all US, not any unapproved season. Source failure is not cancellation or non-running evidence.'},
  records,diagnostics:{source_errors:[],parse_failures:[],unknown_venues:[],source_warnings:[]}
 };
 fs.mkdirSync(outputDir,{recursive:true});
 const file=path.join(outputDir,category+'.json');
 fs.writeFileSync(file,JSON.stringify(artifact,null,2)+'\n');
 outputs.push({category,rows:rows.length,window_rows:records.length,dates:records.map(x=>x.date),output:file});
}
console.log('NJRC_2026_C_CANDIDATES '+JSON.stringify({outputs,production_calendar_changed:false}));
