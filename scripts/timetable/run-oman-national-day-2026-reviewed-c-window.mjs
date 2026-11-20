/** Manual-reviewed, immutable one-event C candidate. No external network access. */
import fs from 'node:fs';
import path from 'node:path';
import {OMAN_REVIEW,verifyManualEvidence,buildC} from './oman-national-day-2026-reviewed-c-core.mjs';
const arg=(k,v)=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??v;
const localDay=()=>new Intl.DateTimeFormat('en-CA',{timeZone:OMAN_REVIEW.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const asOf=arg('as-of',localDay()),days=Number(arg('days','30')),output=arg('output',null);
if(!output||!/^20\d\d-\d\d-\d\d$/.test(asOf)||!Number.isInteger(days)||days<1||days>120)throw Error('invalid as-of, days or output');
const dt=new Date(asOf+'T00:00:00Z');
if(Number.isNaN(dt.valueOf())||dt.toISOString().slice(0,10)!==asOf)throw Error('bad date');
dt.setUTCDate(dt.getUTCDate()+days);const until=dt.toISOString().slice(0,10);
const checkedAt=new Date().toISOString();
const ev=JSON.parse(fs.readFileSync('data/static/calendar-reviewed-oman-national-day-2026.json','utf8'));
const daysVerified=verifyManualEvidence(ev);
const visible=daysVerified.filter(d=>d>=asOf&&d<until);
const records=visible.map(date=>buildC(date,{checkedAt}));
const report={schema_version:'oman-2026-one-date-manual-c-v1',
 generated_at:checkedAt,country_id:OMAN_REVIEW.country_id,authority_id:OMAN_REVIEW.authority_id,
 racing_system_id:OMAN_REVIEW.racing_system_id,timezone:OMAN_REVIEW.timezone,
 source_id:OMAN_REVIEW.source_id,collection_target_rank:'best_available',
 raw_body_retained:false,source_access:'reviewed_no_network',
 acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:OMAN_REVIEW.source_id,
  route_id:OMAN_REVIEW.route_id,error_code:null},
 discovery:{method:'one_time_ona_announcement_date_and_physical_track_fact',
  source_url:OMAN_REVIEW.organiser_calendar,source_visible_rows:1,
  window_visible_rows:visible.length,rank_counts:{C:records.length}},
 window:{start_date:asOf,end_date_exclusive:until,days,
  coverage_claim:'Only Nov 21 2026 National Day racing day at Al Rahba, manually reviewed',
  coverage_note:'One Al Rahba race day/date, not Oman-wide 25-meeting season. No recurring source fetch, post times, results, actual-running or LIVE.'},
 rights_status:ev.rights_review.status,reviewed_source_method:ev.method,
 production_routing:false,canonical_writes:false,public_writes:false,
 records,diagnostics:{source_errors:[],parse_failures:[],unknown_venues:[],
  source_warnings:[{note:'One-time reviewed date is not live source monitoring; rights limited to E2 C fact pair'}]}};
fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log('OMAN_NATIONAL_DAY_REVIEWED_C '+JSON.stringify({status:'success',asOf,days,
  dates:records.map(x=>x.date),rank:records.map(x=>x.capability_rank),
  source_method:'manual_no_network',rights_status:report.rights_status,production_routing:false}));
