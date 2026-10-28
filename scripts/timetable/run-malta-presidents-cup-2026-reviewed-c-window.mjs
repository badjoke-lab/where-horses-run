/** Manual-reviewed, immutable one-event C candidate. No external network access. */
import fs from 'node:fs';
import path from 'node:path';
import {MALTA_REVIEW,verifyManualEvidence,buildC} from './malta-presidents-cup-2026-reviewed-c-core.mjs';
const arg=(k,v)=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??v;
const localDay=()=>new Intl.DateTimeFormat('en-CA',{timeZone:MALTA_REVIEW.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const asOf=arg('as-of',localDay()),days=Number(arg('days','30')),output=arg('output',null);
if(!output||!/^20\d\d-\d\d-\d\d$/.test(asOf)||!Number.isInteger(days)||days<1||days>120)throw Error('invalid as-of, days or output');
const dt=new Date(asOf+'T00:00:00Z');
if(Number.isNaN(dt.valueOf())||dt.toISOString().slice(0,10)!==asOf)throw Error('bad date');
dt.setUTCDate(dt.getUTCDate()+days);const until=dt.toISOString().slice(0,10);
const checkedAt=new Date().toISOString();
const ev=JSON.parse(fs.readFileSync('data/static/calendar-reviewed-malta-presidents-cup-2026.json','utf8'));
const daysVerified=verifyManualEvidence(ev);
const visible=daysVerified.filter(d=>d>=asOf&&d<until);
const records=visible.map(date=>buildC(date,{checkedAt}));
const report={schema_version:'malta-2026-one-date-manual-c-v1',
 generated_at:checkedAt,country_id:MALTA_REVIEW.country_id,authority_id:MALTA_REVIEW.authority_id,
 racing_system_id:MALTA_REVIEW.racing_system_id,timezone:MALTA_REVIEW.timezone,
 source_id:MALTA_REVIEW.source_id,collection_target_rank:'best_available',
 raw_body_retained:false,source_access:'human_reviewed_no_network',
 acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:MALTA_REVIEW.source_id,
  route_id:MALTA_REVIEW.route_id,error_code:null},
 discovery:{method:'one_time_press_conference_fact_crosscheck_and_independent_venue_owner',
  source_url:MALTA_REVIEW.organiser_calendar,source_visible_rows:1,
  window_visible_rows:visible.length,rank_counts:{C:records.length}},
 window:{start_date:asOf,end_date_exclusive:until,days,
  coverage_claim:'Only Nov 8 2026 President’s Cup racing day at Malta Equidrome, manually reviewed',
  coverage_note:'One named physical venue, one date, not nationwide Malta meeting programme. No recurring source fetch, post times, result or actual-running.'},
 rights_status:ev.rights_review.status,reviewed_source_method:ev.method,
 production_routing:false,canonical_writes:false,public_writes:false,
 records,diagnostics:{source_errors:[],parse_failures:[],unknown_venues:[],
  source_warnings:[{note:'Human-reviewed date is not live source monitoring; source-specific rights review required before production'}]}};
fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log('MALTA_PRESIDENTS_CUP_REVIEWED_C '+JSON.stringify({status:'success',asOf,days,
  dates:records.map(x=>x.date),rank:records.map(x=>x.capability_rank),
  source_method:'manual_no_network',rights_status:report.rights_status,production_routing:false}));
