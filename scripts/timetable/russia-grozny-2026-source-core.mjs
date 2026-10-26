import {deriveBestAvailableRank} from './best-available-rank.mjs';
import {classifyAcquisitionCompletion} from './acquisition-completion.mjs';
export const GROZNY_URL='https://grozny-hippodrom.ru/docs';
export const GROZNY_COUNTRY='russia';
export const GROZNY_AUTHORITY='grozny-hippodrome-operator';
export const GROZNY_SYSTEM='russia-grozny-thoroughbred-system';
export const GROZNY_SOURCE='grozny-hippodrome-2026-day-11-notice';
export const GROZNY_ROUTE='russia-grozny-2026-day-11';
export const GROZNY_VENUE='russia--grozny-hippodrome';
export const GROZNY_TIMEZONE='Europe/Moscow';
const normalize=(html)=>String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
 .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ')
 .replace(/&nbsp;|&#160;/gi,' ').replace(/\s+/g,' ');
/** Exactly one independently announced operator meeting, never extrapolate a season. */
export function parseGrozny2026Date(html){
 const text=normalize(html);
 if(!/Грозненск.{0,45}ипподром/iu.test(text))throw Error('Grozny official venue fingerprint absent');
 const anchor=text.search(/(?:11[-\s]*(?:го|й)\s*скакового\s*дня|11[-\s]*(?:й|го)\s*скаковой\s*день)/iu);
 if(anchor<0)throw Error('Grozny day-11 notice fingerprint absent');
 const segment=text.slice(Math.max(0,anchor-200),anchor+650);
 if(!/(?:30\s*[.]10[.]2026|30\s*октября\s*2026)/iu.test(segment))throw Error('Grozny source 2026 closing date fingerprint absent');
 if(!/закрыти.{0,35}скакового\s*сезона/iu.test(segment))throw Error('Grozny 2026 closing notice not established');
 return [{date:'2026-10-30',venue_id:GROZNY_VENUE}];
}
export function buildGroznyCMeeting(row,{checkedAt=new Date().toISOString()}={}){
 const id='russia-grozny-2026-'+row.date;
 const evidence={source_id:GROZNY_SOURCE,official_source_url:GROZNY_URL,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};
 const record={
  candidate_id:id,meeting_id:id,country_id:GROZNY_COUNTRY,authority_id:GROZNY_AUTHORITY,
  racing_system_id:GROZNY_SYSTEM,racecourse_id:GROZNY_VENUE,date:row.date,
  timezone:GROZNY_TIMEZONE,racing_type:'thoroughbred-flat',first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
  source:{source_id:GROZNY_SOURCE,official_url:GROZNY_URL,checked_at:checkedAt,extraction_method:'first_party_2026_single_day_date_venue_fact'},
  route_id:GROZNY_ROUTE,confidence:'medium',review_status:'needs_review',
  notes:'Operator 2026 day-11 closing meeting notice at Grozny only. No national season or unlisted 2027 dates; event occurrence and cancellation unverified.',
  detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:GROZNY_URL},
  acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:GROZNY_SOURCE,route_id:GROZNY_ROUTE,error_code:null},
  evidence_support:{meeting_identity:evidence,meeting_date:evidence}
 };
 const capability_rank=deriveBestAvailableRank(record,[]);
 return {...record,capability_rank,acquisition_completion:classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'})};
}
