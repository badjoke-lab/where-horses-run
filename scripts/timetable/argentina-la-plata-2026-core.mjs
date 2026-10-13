import {deriveBestAvailableRank} from './best-available-rank.mjs';
import {classifyAcquisitionCompletion} from './acquisition-completion.mjs';
export const ARG_LP_AUTHORITY_ID='hipodromo-la-plata';
export const ARG_LP_SOURCE_ID='la-plata-2026-official-resolution-calendar';
export const ARG_LP_SYSTEM_ID='argentina-la-plata-thoroughbred-system';
export const ARG_LP_VENUE_ID='argentina--hipodromo-de-la-plata';
export const ARG_LP_TIMEZONE='America/Argentina/Buenos_Aires';
export const ARG_LP_SOURCE_URL='https://www.hipodromolaplata.gba.gov.ar/hplp/ih_carreraspdf/10_resoluciones/2025-11-27_resolucion.pdf';
export const ARG_LP_ROUTE_ID='argentina-la-plata-2026-approved-calendar';
const MONTHS=['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
const DOW=/(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s+(\d{1,2})\b/gi;
const pad=(x)=>String(x).padStart(2,'0');

export function parseLaPlataApproved2026(text,{sourceUrl=ARG_LP_SOURCE_URL}={}){
 if(typeof text!=='string'||text.length<1000)throw Error('La Plata 2026 resolution text missing');
 const normalized=text.replace(/\s+/g,' ');
 const start=normalized.indexOf('CALENDARIO HIPICO 2026');
 if(start<0||!/Res\.?\s*1024/.test(normalized.slice(start,start+1300))||!/Hip[oó]dromo de La Plata/i.test(normalized))throw Error('La Plata Res.1024 2026 authority fingerprint missing');
 const tail=normalized.slice(start,start+20000),rows=[],monthly={};
 for(let i=0;i<MONTHS.length;i++){
  const a=tail.indexOf(MONTHS[i]+':');
  const b=i<11?tail.indexOf(MONTHS[i+1]+':',Math.max(0,a+1)):-1;
  if(a<0||(i<11&&b<a))throw Error('La Plata approved calendar missing month '+MONTHS[i]);
  const slice=tail.slice(a+MONTHS[i].length+1,b>=0?b:a+850);
  const tokens=[...slice.matchAll(DOW)].map(m=>Number(m[1]));
  const days=[...new Set(tokens)];
  if(days.length!==tokens.length||!days.length||days.length>15)throw Error('La Plata invalid or duplicate approved days '+MONTHS[i]);
  for(const day of days){
   const dt=new Date(Date.UTC(2026,i,day));
   if(dt.getUTCFullYear()!==2026||dt.getUTCMonth()!==i||dt.getUTCDate()!==day)throw Error('La Plata invalid approved calendar date '+MONTHS[i]+day);
   rows.push({date:'2026-'+pad(i+1)+'-'+pad(day),racecourse_id:ARG_LP_VENUE_ID,source_url:sourceUrl});
  }
  monthly[MONTHS[i]]=days.length;
 }
 rows.sort((a,b)=>a.date.localeCompare(b.date));
 if(rows.length!==121)throw Error('La Plata Resolution 1024 expected 121 distinct 2026 days, got '+rows.length);
 if(new Set(rows.map(r=>r.date)).size!==rows.length)throw Error('La Plata duplicate ISO dates');
 return {rows,monthly};
}

export function buildLaPlataMeetingRecord(row,{checkedAt}={}){
 const meetingId='argentina-la-plata-2026-'+row.date;
 const ev={source_id:ARG_LP_SOURCE_ID,official_source_url:row.source_url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};
 const record={
  candidate_id:meetingId,meeting_id:meetingId,country_id:'argentina',authority_id:ARG_LP_AUTHORITY_ID,racing_system_id:ARG_LP_SYSTEM_ID,racecourse_id:ARG_LP_VENUE_ID,
  date:row.date,timezone:ARG_LP_TIMEZONE,racing_type:'thoroughbred-flat',first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
  source:{source_id:ARG_LP_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'la_plata_2026_official_racing_commission_resolution_1024'},
  route_id:ARG_LP_ROUTE_ID,confidence:'high',review_status:'needs_review',
  notes:'The Hipódromo de La Plata official 2026 Racing Commission Resolution 1024 approves this date for La Plata. This C-grade source supplies date and physical venue only. Approved schedule is not proof of completed racing or absence of cancellation.',
  detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
  acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:ARG_LP_SOURCE_ID,route_id:ARG_LP_ROUTE_ID,error_code:null},
  evidence_support:{meeting_identity:ev,meeting_date:ev}
 };
 const capability_rank=deriveBestAvailableRank(record,[]);
 record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
 return {...record,capability_rank};
}
