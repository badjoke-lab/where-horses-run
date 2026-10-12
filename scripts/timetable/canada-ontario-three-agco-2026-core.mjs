import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const ONTARIO_THREE_TIMEZONE='America/Toronto';
export const ONTARIO_THREE_AUTHORITY='ontario-racing';
export const ONTARIO_THREE_YEAR=2026;
export const ONTARIO_THREE_SOURCES=Object.freeze([
  {key:'woodbine_thoroughbred',source_id:'ontario-agco-woodbine-thoroughbred-2026-calendar',system_id:'canada-ontario-woodbine-thoroughbred-system',racecourse_id:'canada--woodbine-racetrack',name:'Woodbine Racetrack',racing_type:'thoroughbred-flat',expected:128,url:'https://www.agco.ca/sites/default/files/2026-03/WDB%20-%20Approved%202026%20Race%20Date%20Calendar_E_17%20Mar%202026.pdf'},
  {key:'fort_erie_thoroughbred',source_id:'ontario-agco-fort-erie-thoroughbred-2026-calendar',system_id:'canada-ontario-fort-erie-thoroughbred-system',racecourse_id:'canada--fort-erie-race-track',name:'Fort Erie Race Track',racing_type:'thoroughbred-flat',expected:34,url:'https://www.agco.ca/sites/default/files/2026-03/FT%20ERIE%20-%20Approved%202026%20Race%20Date%20Calendar_E_17%20Mar%202026.pdf'},
  {key:'ajax_quarter_horse',source_id:'ontario-agco-ajax-quarter-horse-2026-calendar',system_id:'canada-ontario-ajax-quarter-horse-system',racecourse_id:'canada--ajax-downs',name:'Ajax Downs',racing_type:'quarter-horse',expected:22,url:'https://www.agco.ca/sites/default/files/2026-03/AJX%20-%20Approved%202026%20Race%20Date%20Calendar_E_17%20Mar%202026.pdf'}
]);
const boxes=Object.freeze([
 [1,185,312,520,606],[2,312,439,520,606],[3,439,570,520,606],
 [4,185,312,365,465],[5,312,439,365,465],[6,439,570,365,465],
 [7,185,312,225,324],[8,312,439,225,324],[9,439,570,225,324],
 [10,185,312,95,180],[11,312,439,95,180],[12,439,570,95,180]
]);
const pad=n=>String(n).padStart(2,'0');
export function parseOntarioThreePdfItems(items,source){
  if(!Array.isArray(items)||!items.length)throw Error('AGCO source items missing');
  if(!ONTARIO_THREE_SOURCES.some(x=>x.key===source?.key))throw Error('unreviewed AGCO calendar');
  const str=items.map(x=>String(x.text??'').trim()).join(' ');
  if(!/Approved\s+2026\s+Race\s+Date\s+Calendar/i.test(str)||!/Total\s+2026\s+Race\s+Dates/i.test(str))
    throw Error('approved 2026 AGCO calendar marker missing');
  if(!items.some(x=>String(x.text??'').trim()===String(source.expected)))
    throw Error('expected AGCO approved total not printed');
  const monthSeen=new Set();
  const out=[];
  for(const [mo,x0,x1,y0,y1] of boxes){
    const days=new Set();
    for(const item of items){
      const t=String(item.text??'').trim(),n=Number(t),x=Number(item.x),y=Number(item.y);
      if(!/^\d{1,2}$/.test(t)||!Number.isInteger(n)||n<1||n>31||!Number.isFinite(x)||!Number.isFinite(y))continue;
      if(x>=x0&&x<x1&&y>=y0&&y<=y1)days.add(n);
    }
    if(days.size)monthSeen.add(mo);
    for(const n of days){
      const d=new Date(Date.UTC(2026,mo-1,n));
      if(d.getUTCMonth()!==mo-1||d.getUTCDate()!==n)throw Error('invalid date '+mo+'/'+n);
      out.push({date:'2026-'+pad(mo)+'-'+pad(n),racecourse_id:source.racecourse_id,
        venue_name:source.name,source_url:source.url,racing_system_id:source.system_id,racing_type:source.racing_type});
    }
  }
  out.sort((a,b)=>a.date.localeCompare(b.date));
  if(out.length!==source.expected||new Set(out.map(x=>x.date)).size!==out.length)
    throw Error('AGCO '+source.key+' denominator/duplicates expected '+source.expected+' got '+out.length);
  if(!monthSeen.size)throw Error('AGCO season empty');
  return out;
}
export function buildOntarioThreeMeeting(row,source,checkedAt){
  if(row.racecourse_id!==source.racecourse_id||row.racing_system_id!==source.system_id||row.racing_type!==source.racing_type)
    throw Error('Ontario source venue/code mismatch');
  const id='canada-agco-'+source.key+'-'+row.date;
  const evidence={source_id:source.source_id,official_source_url:source.url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};
  const rec={candidate_id:id,meeting_id:id,country_id:'canada',authority_id:ONTARIO_THREE_AUTHORITY,
    racing_system_id:source.system_id,racecourse_id:source.racecourse_id,
    date:row.date,timezone:ONTARIO_THREE_TIMEZONE,racing_type:source.racing_type,
    first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:source.source_id,official_url:source.url,checked_at:checkedAt,extraction_method:'agco_2026_approved_calendar_date_geometry'},
    route_id:'agco-2026-'+source.key,confidence:'high',review_status:'needs_review',
    notes:'AGCO Ontario 2026 approved date and physical venue only. No individual race post-time, racecard, or cancellation evidence inferred. C only; no national completeness claim.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:source.url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:source.source_id,route_id:'agco-2026-'+source.key,error_code:null},
    evidence_support:{meeting_identity:evidence,meeting_date:evidence}};
  const capability_rank=deriveBestAvailableRank(rec,[]);
  if(capability_rank!=='C')throw Error('Ontario three unexpected rank '+capability_rank);
  rec.acquisition_completion=classifyAcquisitionCompletion({...rec,capability_rank},{technical_capability_rank:'C'});
  return {...rec,capability_rank};
}
