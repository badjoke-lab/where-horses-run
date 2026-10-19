import {deriveBestAvailableRank} from './best-available-rank.mjs';
import {classifyAcquisitionCompletion} from './acquisition-completion.mjs';
export const ECU_CHC_SOURCE_URL='https://confederacionhipicadelcaribe.org/wp-content/uploads/2026/04/CALENDARIO-CLASICO-CHC-2026-4.pdf';
export const ECU_CHC_COUNTRY='ecuador';
export const ECU_CHC_AUTHORITY='confederacion-hipica-del-caribe';
export const ECU_CHC_SYSTEM='ecuador-chc-2026-selected-classic-fixtures-system';
export const ECU_CHC_SOURCE='chc-ecuador-2026-classic-date-facts';
export const ECU_CHC_ROUTE='ecuador-chc-2026-classic-fixtures';
export const ECU_CHC_VENUE='ecuador--hipodromo-miguel-salem-dibo';
export const ECU_CHC_TIMEZONE='America/Guayaquil';
const monthMap={Ene:1,Feb:2,Mar:3,Abr:4,May:5,Jun:6,Jul:7,Ago:8,Sep:9,Oct:10,Nov:11,Dic:12};
const pad=x=>String(x).padStart(2,'0');
const fingerprint=new Set(['2026-07-05','2026-07-26','2026-08-09','2026-08-30','2026-09-20','2026-09-27','2026-10-11','2026-10-18','2026-11-08','2026-12-27']);
export function parseChcEcuador2026(pages,{sourceUrl=ECU_CHC_SOURCE_URL}={}){
 if(!Array.isArray(pages)||pages.length<3||pages.length>12)throw Error('CHC 2026 PDF page structure invalid');
 const flatten=pages.flat().map(s=>String(s??'').trim()).filter(Boolean);
 const plain=flatten.join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');
 if(!/CALENDARIO\s+CLASICO\s+2026/i.test(plain)||!/CONFEDERACION\s+HIPICA\s+DEL\s+CARIBE/i.test(plain))throw Error('CHC 2026 calendar source fingerprint missing');
 const rows=[];
 for(const page of pages){
  if(!Array.isArray(page))throw Error('CHC 2026 tokens absent');
  const t=page.map(x=>String(x??'').trim()).filter(Boolean);
  for(let i=0;i<t.length;i++){
   if(t[i]!=='ECU')continue;
   if(t[i+1]!=='Miguel Salem D.')throw Error('Unexpected Ecuador venue in CHC source');
   const day=Number(t[i+2]),rawMonth=t[i+3]||'',mo=rawMonth.replace('.','');
   const month=monthMap[mo];
   if(!month||!Number.isInteger(day))throw Error('CHC Ecuador date tokens missing');
   const dt=new Date(Date.UTC(2026,month-1,day));
   if(dt.getUTCFullYear()!==2026||dt.getUTCMonth()!==month-1||dt.getUTCDate()!==day)throw Error('CHC Ecuador date invalid');
   rows.push({date:'2026-'+pad(month)+'-'+pad(day),racecourse_id:ECU_CHC_VENUE,source_url:sourceUrl});
  }
 }
 rows.sort((a,b)=>a.date.localeCompare(b.date));
 const dates=rows.map(x=>x.date);
 if(dates.length!==10||dates.some((x,i)=>dates.indexOf(x)!==i)||dates.some(x=>!fingerprint.has(x)))throw Error('CHC Ecuador selected 2026 classic fixture denominator or date fingerprint drift');
 return rows;
}
export function buildChcEcuadorCMeeting(row,{checkedAt}={}){
 const meetingId='ecuador-chc-2026-classic-'+row.date;
 const evidence={source_id:ECU_CHC_SOURCE,official_source_url:row.source_url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};
 const m={candidate_id:meetingId,meeting_id:meetingId,country_id:ECU_CHC_COUNTRY,authority_id:ECU_CHC_AUTHORITY,racing_system_id:ECU_CHC_SYSTEM,racecourse_id:ECU_CHC_VENUE,date:row.date,timezone:ECU_CHC_TIMEZONE,racing_type:'thoroughbred-flat',
 first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
 source:{source_id:ECU_CHC_SOURCE,official_url:row.source_url,checked_at:checkedAt,extraction_method:'chc_2026_selected_ecuador_classic_date_venue_facts_only'},
 route_id:ECU_CHC_ROUTE,confidence:'medium',review_status:'needs_review',
 notes:'CHC 2026 published classic calendar identifies a selected listed classic at Miguel Salem Dibo on this date. Partial featured-date signal only, not full Ecuador racing schedule; no actual-ran, first post, cancellation or further date inference.',
 detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
 acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:ECU_CHC_SOURCE,route_id:ECU_CHC_ROUTE,error_code:null},
 evidence_support:{meeting_identity:evidence,meeting_date:evidence}};
 const capability_rank=deriveBestAvailableRank(m,[]);
 m.acquisition_completion=classifyAcquisitionCompletion({...m,capability_rank},{technical_capability_rank:'C'});
 return {...m,capability_rank};
}
