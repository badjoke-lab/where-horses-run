import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';
import { visibleText, parseBerkudaPacuEventWindow } from './indonesia-porprov-2026-source-core.mjs';

export const PORPROV_IDENTITY = Object.freeze({
 country:'indonesia',
 authority:'porprov-xv-jabar-organizer',
 system:'indonesia-porprov-xv-jabar-2026-pacuan-system',
 source:'porprov-jabar-2026-koni-sport-days',
 route:'indonesia-porprov-legokjawa-2026-c',
 racecourse:'indonesia--legokjawa-racecourse',
 timezone:'Asia/Jakarta',
 organizer:'https://porprovbekasikota2026.id/cabang-olahraga/berkuda-pacu',
 koniBase:'https://porprov.konijabar.or.id'
});
export const PORPROV_DAYS=Object.freeze([
 {date:'2026-11-07',dayName:'Sabtu',n:7,firstOrLast:'Hari pertama'},
 {date:'2026-11-08',dayName:'Minggu',n:8,firstOrLast:'Hari terakhir'}
]);
export function parseKoniDay(html,day){
 const t=visibleText(html);
 const heading=new RegExp(day.dayName+',\\s*'+day.n+'\\s+November\\s+2026','i').test(t);
 const row=new RegExp('Berkuda\\s+Berkuda\\s+Pacuan\\s+Pacuan\\s+Kuda\\s+Legok\\s*Jawa,?\\s*Kabupaten\\s+Pangandaran\\s+7\\s*[-–]\\s*8\\s+November\\s+'+day.firstOrLast,'i').test(t);
 if(!heading||!row)throw Error('KONI day-specific racing schedule fingerprint absent '+day.date);
 return {date:day.date,venue_id:PORPROV_IDENTITY.racecourse,
  daily_programme:true,actual_race_occurred:false,first_race_time_local:null};
}
export function parseKoniDiscipline(html){
 const t=visibleText(html);
 if(!/Berkuda\s+Pacuan\s+7\s*[-–]\s*8\s+November\s+Pacuan\s+Kuda\s+Legok\s*Jawa/i.test(t))
  throw Error('KONI race discipline and venue fingerprint absent');
 if(!/Kelas\s+Terbuka\s+2\.000\s*M/i.test(t))
  throw Error('KONI 2026 racing classes fingerprint absent');
 return true;
}
export function parseOrganizer(html){
 const p=parseBerkudaPacuEventWindow(html);
 if(!p.sourceScopeConfirmed)throw Error('PORPROV organizer bounded event fingerprint absent');
 return p;
}
export function buildC(row,{checkedAt='2026-10-28T00:00:00Z'}={}){
 const c=PORPROV_IDENTITY,id='indonesia-porprov-legokjawa-'+row.date;
 const url=c.koniBase+'/jadwal?tgl='+row.date;
 const evidence={source_id:c.source,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};
 const record={
  candidate_id:id,meeting_id:id,country_id:c.country,authority_id:c.authority,
  racing_system_id:c.system,racecourse_id:c.racecourse,date:row.date,timezone:c.timezone,
  racing_type:'thoroughbred-flat',first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
  source:{source_id:c.source,official_url:url,checked_at:checkedAt,
    extraction_method:'bounded_koni_daily_competition_day_crosschecked_organizer'},
  route_id:c.route,confidence:'medium',review_status:'needs_review',
  notes:'2026 PORPROV XV Berkuda Pacuan competition day at Legokjawa, source-limited. No race-by-race card, actual running, time, national coverage or 2027 extrapolation.',
  detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:url},
  acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:c.source,route_id:c.route,error_code:null},
  evidence_support:{meeting_identity:evidence,meeting_date:evidence}
 };
 const rank=deriveBestAvailableRank(record,[]);
 return {...record,capability_rank:rank,
  acquisition_completion:classifyAcquisitionCompletion({...record,capability_rank:rank},{technical_capability_rank:'C'})};
}
