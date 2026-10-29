import assert from 'node:assert/strict';
import fs from 'node:fs';

const record=JSON.parse(fs.readFileSync('data/static/calendar-botswana-premier-cup-2026-candidate.json','utf8'));
const target='2026-12-12';
function isoDate(s) {
  assert.match(s,/^\d{4}-\d{2}-\d{2}$/,'ISO date required');
  const d=new Date(s+'T00:00:00Z');
  assert(!Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===s,'invalid ISO date');
  return d;
}
function inWindow(asOf,days) {
  const start=isoDate(asOf);
  assert(Number.isInteger(days)&&days>=1&&days<=120,'days must be 1..120');
  const end=new Date(start.getTime()+days*86400000).toISOString().slice(0,10);
  return record.event_date>=asOf&&record.event_date<end;
}
function contract(){
  assert.equal(record.schema_version,'botswana-premier-champions-cup-2026-candidate-v1');
  assert.equal(record.country_id,'botswana');
  assert.equal(record.event_date,target);
  isoDate(record.event_date);
  assert.equal(record.event_city,'Maun');
  assert.equal(record.physical_racecourse_id,null);
  assert.equal(record.event_organizer_2026,null);
  assert.equal(record.local_post_time,null);
  assert.equal(record.source_evidence.original_2026_pdf_access_verified,false);
  assert.equal(record.source_evidence.first_party_organizer_event_confirmation,false);
  assert.equal(record.source_evidence.first_party_2026_physical_venue_confirmation,false);
  assert.match(record.distinct_historical_context.restriction,/NOT be imputed/);
  assert.equal(record.rights.decision,'REVIEW_REQUIRED');
  assert.equal(record.rights.evidence_level,'E1');
  assert.equal(record.rights.automated_calendar_source_access_approved,false);
  assert.equal(record.rights.public_date_venue_fact_use_approved,false);
  assert.equal(record.production.state,'candidate_only');
  assert.equal(record.production.apply_to_registry,false);
  assert.equal(record.production.apply_to_canonical,false);
  assert.equal(record.production.apply_to_public,false);
}
function output(asOf,days) {
  contract();
  return {
    candidate_id:record.candidate_id,as_of:asOf,days,
    source_access:'reviewed_metadata_only_no_network',
    date_city_signal:inWindow(asOf,days)?{
      date:record.event_date,city:record.event_city,source_kind:record.source_type
    }:null,
    blockers:{
      physical_racecourse_unconfirmed:true,
      organizer_2026_unconfirmed:true,
      source_method_field_rights_review_required:true,
      original_pdf_not_directly_verified:true
    },
    publication_eligible:false,
    production_routed:false,
    canonical_meetings:[],
    public_meetings:[]
  };
}
function selfTest(){
  assert.equal(output('2026-10-30',30).date_city_signal,null);
  assert.equal(output('2026-10-30',60).date_city_signal.date,target);
  assert.equal(output('2026-11-12',30).date_city_signal.date,target);
  assert.equal(output('2026-12-12',1).date_city_signal.date,target);
  assert.equal(output('2026-12-13',30).date_city_signal,null);
  assert.equal(output('2027-12-12',30).date_city_signal,null);
  assert.deepEqual(output('2026-11-12',30).public_meetings,[]);
  assert.deepEqual(output('2026-11-12',30).canonical_meetings,[]);
  assert.equal(output('2026-11-12',30).publication_eligible,false);
  console.log('BOTSWANA_PREMIER_CUP_2026_CANDIDATE_CONTRACT_PASS');
}
const opts=new Map(process.argv.slice(2).filter(s=>s.startsWith('--')).map(s=>{
 const [k,...v]=s.slice(2).split('=');return [k,v.join('=')];
}));
if(opts.has('self-test')) selfTest();
else console.log(JSON.stringify(output(opts.get('as-of')||'2026-10-30',Number(opts.get('days')||60)),null,2));
