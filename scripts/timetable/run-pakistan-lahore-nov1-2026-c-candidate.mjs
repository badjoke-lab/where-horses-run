/** Pakistan 2026-11-01 Lahore meeting: bounded date/physical-venue review candidate.
 * NOT an automated collector. All article content and racecards remain external.
 * No canonical, public or registry data output while rights/evidence are E1.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
const record=JSON.parse(fs.readFileSync('data/static/calendar-pakistan-lahore-2026-11-01-c-candidate.json','utf8'));
const dt=s=>{
 assert.match(s,/^20\d\d-\d\d-\d\d$/,'ISO date required');
 const x=new Date(s+'T00:00:00Z');assert(!Number.isNaN(x.valueOf())&&x.toISOString().slice(0,10)===s,'invalid date');return x;
};
function contract(){
 assert.equal(record.schema_version,'pakistan-lahore-2026-nov1-press-candidate-v1');
 assert.equal(record.country_id,'pakistan');
 assert.equal(record.racing_system_id,'lahore-race-club-system');
 assert.equal(record.event_date,'2026-11-01');
 dt(record.event_date);
 assert.equal(record.physical_racecourse_id,'pakistan--lahore-race-club');
 assert.equal(record.venue_identity.owner_address_confirmed,true);
 assert.equal(record.venue_identity.mapped_venue_confirmed,true);
 assert.equal(record.venue_identity.exclude_historical_jail_road_site,true);
 assert.equal(record.source_evidence.source_author,'Asher Butt');
 assert.equal(record.source_evidence.publication_date,'2026-10-29');
 assert.equal(record.source_evidence.first_party_current_date_confirmation,false);
 assert.equal(record.source_evidence.independent_date_confirmations_count,1);
 assert.equal(record.source_evidence.official_2026_season_current_racing_context.includes('thenews.pk'),true);
 assert.equal(record.source_evidence.actual_2026_11_01_racing_completed,null);
 assert.equal(record.source_evidence.official_weekly_schedule_current_2026_verified,false);
 assert.equal(record.rights_review.decision,'REVIEW_REQUIRED');
 assert.equal(record.rights_review.evidence_level,'E1');
 assert.equal(record.rights_review.one_date_venue_fact_publication_approved,false);
 assert.equal(record.rights_review.automated_source_access_approved,false);
 assert.equal(record.rights_review.source_expression_reuse_allowed,false);
 assert.equal(record.rights_review.source_terms_applicability_verified,false);
 assert.equal(record.production.publication_eligible,false);
 assert.equal(record.production.apply_to_registry,false);
 assert.equal(record.production.apply_to_canonical,false);
 assert.equal(record.production.apply_to_public,false);
 assert.equal(record.production.no_future_sunday_inference,true);
 assert.equal(record.production.free_live_status,'not_confirmed_do_not_show');
 assert.equal(record.local_post_time,null);
}
function build(asOf,days){
 contract();dt(asOf);
 assert(Number.isInteger(days)&&days>=1&&days<=120,'days=1..120');
 const until=new Date(dt(asOf).valueOf()+days*86400000).toISOString().slice(0,10);
 const visible=record.event_date>=asOf&&record.event_date<until;
 return {schema_version:'pakistan-lahore-2026-one-date-candidate-v1',
  as_of:asOf,days,source_access:'reviewed_no_network',country_id:record.country_id,
  physical_racecourse_id:record.physical_racecourse_id,
  date_venue_candidate:visible?{date:record.event_date,racecourse_id:record.physical_racecourse_id,rank_if_approved:'C'}:null,
  original_article_bodies_retained:false,rights_status:'REVIEW_REQUIRED',evidence_level:'E1',
  blockers:{publication_rights_not_approved:true,independent_day_confirmation_missing:true,
   current_venue_owner_date_notice_missing:true,free_live_not_verified:true},
  production_routing:false,publication_eligible:false,canonical_meetings:[],public_meetings:[]};
}
function selfTest(){
 assert.equal(build('2026-10-31',1).date_venue_candidate,null);
 assert.equal(build('2026-10-31',2).date_venue_candidate.date,'2026-11-01');
 assert.equal(build('2026-11-01',1).date_venue_candidate.date,'2026-11-01');
 assert.equal(build('2026-11-02',30).date_venue_candidate,null);
 assert.equal(build('2027-11-01',30).date_venue_candidate,null);
 assert.deepEqual(build('2026-10-31',30).canonical_meetings,[]);
 assert.deepEqual(build('2026-10-31',30).public_meetings,[]);
 assert.equal(build('2026-10-31',30).production_routing,false);
 assert.throws(()=>build('2026-02-30',30),/invalid date/);
 assert.throws(()=>build('2026-10-31',121),/days=1..120/);
 console.log('PAKISTAN_LAHORE_2026_ONE_DATE_C_CANDIDATE_PASS');
}
const opts=new Map(process.argv.slice(2).filter(s=>s.startsWith('--')).map(s=>{
 const [key,...vals]=s.slice(2).split('=');return [key,vals.join('=')];
}));
if(opts.has('self-test'))selfTest();
else console.log(JSON.stringify(build(opts.get('as-of')||'2026-10-31',Number(opts.get('days')||30)),null,2));
