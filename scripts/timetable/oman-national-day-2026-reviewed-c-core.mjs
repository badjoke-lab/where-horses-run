/** One 2026-11-21 ONA-announced National Day horse-racing C date/physical-venue fact only.
 * NO recurring web access; no article text, compiled fixtures, times or broadcast assertions.
 */
import assert from 'node:assert/strict';
import {deriveBestAvailableRank} from './best-available-rank.mjs';
import {classifyAcquisitionCompletion} from './acquisition-completion.mjs';
export const OMAN_REVIEW=Object.freeze({
 country_id:'oman',authority_id:'oman-racing-evidence-network',
 racing_system_id:'oman-source-led-racing-system',racecourse_id:'al-rahba-racecourse',
 source_id:'oman-2026-national-day-ona-reviewed',
 route_id:'oman-national-day-2026-one-date-manual',
 date:'2026-11-21',timezone:'Asia/Muscat',
 dated_source:'https://alwatan.om/article/46361/25-%D8%B3%D8%A8%D8%A7%D9%82%D8%A7-%D8%AA%D8%AA%D8%B6%D9%85%D9%86%D9%87%D8%A7-%D8%A3%D8%AC%D9%86%D8%AF%D8%A9-%D9%85%D8%AA%D9%83%D8%A7%D9%85%D9%84%D8%A9-%D9%86%D8%A7%D8%AF%D9%8A-%D8%B3%D8%A8%D8%A7%D9%82-%D8%A7%D9%84%D8%AE%D9%8A%D9%84-%D8%A7%D9%84%D8%B9%D9%85%D8%A7%D9%86%D9%8A-%D9%8A%D8%B9%D9%84%D9%86-%D8%B9%D9%86-%D8%A8%D8%B1%D9%86%D8%A7%D9%85%D8%AC-%D8%B3%D8%A8%D8%A7%D9%82%D8%A7%D8%AA-%D8%A7%D9%84%D8%AE%D9%8A%D9%84-%D9%84%D9%84%D9%85%D9%88%D8%B3%D9%85-20262027%D9%85'
});
export function verifyManualEvidence(e){
 assert.equal(e?.date,OMAN_REVIEW.date,'Oman date changed');
 assert.equal(e?.racecourse_id,OMAN_REVIEW.racecourse_id,'Oman racecourse mismatch');
 assert.equal(e?.method,'human_reviewed_ona_announcement_fact','Oman method mismatch');
 assert.equal(e?.competition,'Oman National Day Race 2026','Oman event identity mismatch');
 assert.equal(e?.venue_verified_from_existing_project,true,'Oman course not verified');
 assert.equal(e?.organizer_announcement_origin_verified,true,'Oman announcement origin not verified');
 assert.equal(e?.source_content_retained,false,'Oman publisher content retained');
 assert.equal(e?.rights_review?.status,'USABLE_WITH_CONDITIONS','Oman rights not scoped');
 assert.equal(e?.rights_review?.evidence_level,'E2','Oman E2 review missing');
 assert.equal(e?.rights_review?.automation_allowed,false,'Oman unauthorized automation');
 assert.deepEqual(e?.rights_review?.published_fields,['meeting_date','physical_racecourse','country_id','racing_system_id']);
 assert.equal(e?.reviewed_at,'2026-11-21','Oman review date mismatch');
 assert.equal(e?.reviewed_sources?.[0]?.url,OMAN_REVIEW.dated_source,'Oman dated report mismatch');
 return [OMAN_REVIEW.date];
}
export function buildC(date,{checkedAt}){
 if(date!==OMAN_REVIEW.date)throw Error('Unreviewed Oman meeting date');
 const reviewedAt='2026-11-21T00:00:00Z',id='oman-al-rahba-national-day-2026-11-21';
 const evidence={source_id:OMAN_REVIEW.source_id,official_source_url:OMAN_REVIEW.dated_source,
  observed_at:reviewedAt,successfully_verified_at:reviewedAt,acquisition_method:'reviewed',
  review:{reviewed_at:reviewedAt,reviewer:'WHR Calendar Expansion AI-assisted manual fact check',
   evidence_reference:'docs/timetable-source-tests/11-oman/national-day-2026-one-day-manual-source.json'}};
 const row={candidate_id:id,meeting_id:id,country_id:OMAN_REVIEW.country_id,
  authority_id:OMAN_REVIEW.authority_id,racing_system_id:OMAN_REVIEW.racing_system_id,
  racecourse_id:OMAN_REVIEW.racecourse_id,date,timezone:OMAN_REVIEW.timezone,racing_type:'flat',
  first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
  source:{source_id:OMAN_REVIEW.source_id,official_url:OMAN_REVIEW.dated_source,
   checked_at:checkedAt,extraction_method:'human_reviewed_ona_one_date_track_fact'},
  source_label:'One Oman News Agency announcement fact relayed by Al Watan (not a current club live fixture)',
  route_id:OMAN_REVIEW.route_id,confidence:'medium',review_status:'needs_review',
  notes:'Only Nov 21 2026 Oman National Day meeting at Al Rahba. No other 2026/27 dates or venue inferred. No race times, actual-running status, results or LIVE verified.',
  detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:OMAN_REVIEW.dated_source},
  acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:OMAN_REVIEW.source_id,route_id:OMAN_REVIEW.route_id,error_code:null},
  evidence_support:{meeting_identity:evidence,meeting_date:evidence}};
 const capability_rank=deriveBestAvailableRank(row,[]);
 return {...row,capability_rank,acquisition_completion:classifyAcquisitionCompletion({...row,capability_rank},{technical_capability_rank:'C'})};
}
