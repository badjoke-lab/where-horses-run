/**
 * Malta 2026-11-08 President's Cup C reviewed one-off.
 *
 * Review inputs are two separately authored news reports of the event
 * press conference (Oct 26 and 27), the Malta Equidrome venue-owner
 * address and physical racetrack pages, and the MRC season calendar
 * context. They are NOT a scraped/redistributed calendar.
 *
 * Date is not official-operator-direct-confirmed from a runner: the
 * MRC source returns 403 to GitHub runners. Publication rights review
 * remains distinct. Only minimal date/physical venue facts are stored.
 */
import {deriveBestAvailableRank} from './best-available-rank.mjs';
import {classifyAcquisitionCompletion} from './acquisition-completion.mjs';
export const MALTA_REVIEW=Object.freeze({
 country_id:'malta',
 authority_id:'malta-racing-club',
 racing_system_id:'malta-reviewed-system',
 racecourse_id:'malta--malta-equidrome',
 source_id:'malta-2026-presidents-cup-press-reviewed',
 route_id:'malta-2026-presidents-cup-manual-one-date',
 date:'2026-11-08',timezone:'Europe/Malta',
 organiser_calendar:'https://www.maltaracingclub.com/',
 venue_page:'https://www.maltaequidrome.com/racetrack/',
 address_page:'https://www.maltaequidrome.com/practical-information/',
 dates:[
  'https://maltasport.mt/other-sports/horse-racing/twelve-horses-to-compete-for-26th-equestrimalta-presidents-cup/',
  'https://www.maltatrotracing.com/news/twelve-finalists-set-for-26th-equestrimalta-president-s-cup-final'
 ]
});
export function verifyManualEvidence(evidence){
 if(evidence?.date!==MALTA_REVIEW.date)throw Error('Malta manually reviewed date changed');
 if(evidence?.racecourse_id!==MALTA_REVIEW.racecourse_id)throw Error('Malta physical venue mismatch');
 if(evidence?.method!=='human_reviewed_press_conference_fact')throw Error('Malta method mismatch');
 if(evidence?.competition!=='26th EquestriMalta Presidents Cup Final')throw Error('Malta event identity mismatch');
 if(evidence?.venue_owner_verified!==true)throw Error('Malta operator physical venue not verified');
 if(evidence?.independent_report_date_crosscheck!==true)throw Error('Malta press reports not cross-checked');
 if(evidence?.reviewed_at!=='2026-10-29')throw Error('Malta reviewed evidence date mismatch');
 if(evidence?.source_content_retained!==false)throw Error('Malta source content retained');
 return [MALTA_REVIEW.date];
}
export function buildC(date,{checkedAt}){
 if(date!==MALTA_REVIEW.date)throw Error('Unreviewed Malta meeting');
 const id='malta-marsa-presidents-cup-2026-11-08';
 const evidence={source_id:MALTA_REVIEW.source_id,official_source_url:MALTA_REVIEW.venue_page,
  observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'manual_reviewed'};
 const row={
  candidate_id:id,meeting_id:id,
  country_id:MALTA_REVIEW.country_id,authority_id:MALTA_REVIEW.authority_id,
  racing_system_id:MALTA_REVIEW.racing_system_id,racecourse_id:MALTA_REVIEW.racecourse_id,
  date,timezone:MALTA_REVIEW.timezone,racing_type:'trotting',
  first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
  source:{source_id:MALTA_REVIEW.source_id,
   official_url:MALTA_REVIEW.organiser_calendar,checked_at:checkedAt,
   extraction_method:'human_reviewed_single_press_conference_date_venue_fact'},
  route_id:MALTA_REVIEW.route_id,confidence:'medium',review_status:'needs_review',
  notes:'Only the announced 2026-11-08 President’s Cup race day at Malta Equidrome, not the whole 2026 timetable. Date cross-checked in independent press accounts; racecourse independently verified by venue owner. No post time, racecard, status/actual-ran, or free LIVE inferred.',
  detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:MALTA_REVIEW.organiser_calendar},
  acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:MALTA_REVIEW.source_id,route_id:MALTA_REVIEW.route_id,error_code:null},
  evidence_support:{meeting_identity:evidence,meeting_date:evidence}
 };
 const capability_rank=deriveBestAvailableRank(row,[]);
 return {...row,capability_rank,acquisition_completion:classifyAcquisitionCompletion({...row,capability_rank},{technical_capability_rank:'C'})};
}
