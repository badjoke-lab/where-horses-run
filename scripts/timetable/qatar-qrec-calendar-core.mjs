import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const QATAR_TIMEZONE='Asia/Qatar';
export const QATAR_AUTHORITY_ID='qatar-racing-and-equestrian-club';
export const QATAR_SYSTEM_ID='qatar-qrec-calendar-system';
export const QATAR_SOURCE_ID='qrec-season-calendar';
export const QATAR_SOURCE_URL='https://qrec.gov.qa/race-calendar';
export const QATAR_RACECOURSES=Object.freeze({
  'al-rayyan':{id:'qatar--al-rayyan-racecourse',name:'Al Rayyan Racecourse'},
  'al-uqda':{id:'qatar--al-uqda-racecourse',name:'Al Uqda Racecourse'},
});

export function resolveQrecRacecourse(meetingName){
  const value=String(meetingName??'');
  if(/\bAl\s+Rayyan\b/i.test(value)) return QATAR_RACECOURSES['al-rayyan'];
  if(/\bAl\s+Uqda\b/i.test(value)) return QATAR_RACECOURSES['al-uqda'];
  return null;
}

export function normalizeQrecPostTime(value){
  const v=String(value??'').trim();
  if(!/^\d{2}:\d{2}$/.test(v) || v==='00:00') return null;
  const [h,m]=v.split(':').map(Number);
  if(h>23||m>59) return null;
  return v;
}

function evidence(url,checkedAt){
  return {source_id:QATAR_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};
}

export function buildQatarMeetingRecord(meeting,{checkedAt,sourceUrl=QATAR_SOURCE_URL}={}){
  const racecourse=resolveQrecRacecourse(meeting?.meetingName);
  if(!racecourse) throw new Error('unknown QREC venue: '+String(meeting?.meetingName??''));
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(meeting?.date??''))) throw new Error('invalid QREC meeting date');
  const races=Array.isArray(meeting?.races)?meeting.races:[];
  const rows=races.map((race,index)=>({
    label:'Race '+(index+1),
    post_time_local:normalizeQrecPostTime(race?.postTime),
    race_name:typeof race?.name==='string'&&race.name.trim()?race.name.trim():null,
    distance_m:Number.isInteger(Number(race?.distance))&&Number(race.distance)>0?Number(race.distance):null,
  }));
  const validTimes=rows.map(row=>row.post_time_local).filter(Boolean);
  const meetingId='qatar-qrec-'+racecourse.id.replace(/^qatar--/,'')+'-'+meeting.date;
  const e=evidence(sourceUrl,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'qatar',
    authority_id:QATAR_AUTHORITY_ID,racing_system_id:QATAR_SYSTEM_ID,
    racecourse_id:racecourse.id,date:meeting.date,timezone:QATAR_TIMEZONE,
    racing_type:'thoroughbred-and-arabian-flat',
    first_race_time_local:validTimes[0]??null,
    last_race_time_local:validTimes.at(-1)??null,
    timetable_rows:rows,
    source:{source_id:QATAR_SOURCE_ID,official_url:sourceUrl,checked_at:checkedAt,extraction_method:'official_qrec_public_api'},
    route_id:'qrec-public-api-official-window',confidence:'high',review_status:'needs_review',
    notes:'Official QREC public frontend API confirms the meeting. A 00:00 postTime is treated as unpublished and never exposed as a real post time. Rank upgrades occur only from source-visible valid post times.',
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:QATAR_SOURCE_ID,route_id:'qrec-public-api-official-window',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e},
    qrec_source_metadata:{meetid:meeting?.meetid??null,meeting_name:meeting?.meetingName??null,race_count:races.length},
  };
  const capability_rank=deriveBestAvailableRank(record,rows);
  record.detail_observation={
    status:capability_rank==='A'?'complete_current_best_available':'not_applicable',
    evaluated_capability_rank:capability_rank,
    race_count:races.length,
    calendar_url:sourceUrl,
  };
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'A'});
  return {...record,capability_rank};
}
