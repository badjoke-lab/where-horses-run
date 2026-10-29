import assert from 'node:assert/strict';
import fs from 'node:fs';

const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const id='malta--malta-equidrome', source='malta-president-cup.json';
const locations=load('data/static/racecourse-locations-v1.json');
const entry=locations.locations.find(x=>x.id===id);
assert(entry,'Malta Equidrome must be mapped before public Calendar promotion');
assert.equal(entry.location.verification_state,'reviewed');
assert(['venue','venue_approximate'].includes(entry.location.precision));
assert.equal(entry.location.latitude,35.87813);
assert.equal(entry.location.longitude,14.48687);
assert.equal(entry.location.evidence.type,'repository_ref');
const evidence=load('data/static/racecourse-location-supplement-evidence-v1.json').entries.find(x=>x.id===id);
assert(evidence,'Malformed Malta location evidence reference');
assert.equal(entry.location.evidence.value,'data/static/racecourse-location-supplement-evidence-v1.json#'+id);
assert.match(evidence.coordinate_source_url,/mapcarta\.com\/32910076/);
assert.match(evidence.address_source_url,/maltaequidrome\.com/);
const full=fs.readFileSync('.github/workflows/calendar-unified-official-refresh.yml','utf8');
const near=fs.readFileSync('.github/workflows/calendar-near-official-refresh.yml','utf8');
for(const [name,code] of [['full',full],['near',near]]){
 assert(code.includes('--artifact=.calendar-unified/'+source),name+': Malta artifact must be applied');
 assert(code.includes('--country-id=malta'),name+': Malta country route required');
}
const audit=fs.readFileSync('scripts/timetable/build-refresh-audit-summary.mjs','utf8');
assert.match(audit,/\{\s*key:\s*'malta-presidents-cup',\s*file:\s*'malta-president-cup\.json',\s*country_id:\s*'malta',\s*authority_id:\s*'malta-racing-club',\s*racing_system_id:\s*'malta-reviewed-system'/);
const dated=load('data/static/calendar-reviewed-malta-presidents-cup-2026.json');
assert.equal(dated.date,'2026-11-08');
assert.equal(dated.racecourse_id,id);
assert.equal(dated.rights_review.status,'USABLE_WITH_CONDITIONS');
assert.equal(dated.rights_review.evidence_level,'E2');
assert.deepEqual(dated.rights_review.published_fields,['meeting_date','physical_racecourse','country_id','racing_system_id']);
assert.equal(dated.rights_review.source_content_reuse_status,'PERMISSION_REQUIRED');
assert.equal(dated.rights_review.automation_allowed,false);
console.log('MALTA_PRODUCTION_LOCATION_AUDIT_INTEGRATION_PASS venue_location=reviewed audit_artifact=registered rights=USABLE_WITH_CONDITIONS_fact_only');
