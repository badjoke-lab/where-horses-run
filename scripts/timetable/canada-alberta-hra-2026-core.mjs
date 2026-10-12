import {deriveBestAvailableRank} from './best-available-rank.mjs';
import {classifyAcquisitionCompletion} from './acquisition-completion.mjs';

export const HRA_AUTHORITY_ID='horse-racing-alberta';
export const HRA_SOURCE_ID='hra-century-mile-standardbred-2026-calendar';
export const HRA_SYSTEM_ID='canada-alberta-century-mile-standardbred-system';
export const HRA_RACECOURSE_ID='canada--century-mile';
export const HRA_TIMEZONE='America/Edmonton';
export const HRA_BASE_URL='https://www.thehorses.com/racetracks/race-calendar';
export const HRA_ROUTE_ID='hra-century-mile-2026-official-calendar';

const MONTH_CELL=/<td\b[^>]*\bclass=["'][^"']*\bcal_days(?:hasevents|noevents)\b[^"']*["'][^>]*>([\s\S]*?)<\/td>/gi;
const DAY_LINK=/\/racetracks\/race-calendar\/eventsbyday\/(\d{4})\/(\d{1,2})\/(\d{1,2})\/-/i;
const CM_EVENT=/\/racetracks\/race-calendar\/eventdetail\/\d+\/-\/cm-standardbred-2026\b/i;

export function parseHraCenturyMileMonth(html,{year,month,sourceUrl}={}){
  if(typeof html!=='string'||html.length<10000) throw Error('HRA calendar missing HTML body');
  if(!Number.isInteger(year)||year!==2026||!Number.isInteger(month)||month<1||month>12)throw Error('HRA calendar supports source-published 2026 only');
  if(!/Horse Racing Alberta|Alberta Racing Calendar/i.test(html)||!/race-calendar/i.test(html))throw Error('HRA source fingerprint missing');
  const rows=[],seen=new Set(),days=new Set();
  for(const match of html.matchAll(MONTH_CELL)){
    const block=match[1],d=block.match(DAY_LINK);
    if(!d)continue;
    const yy=Number(d[1]),mm=Number(d[2]),dd=Number(d[3]);
    if(yy!==year||mm!==month)continue;
    const date=new Date(Date.UTC(yy,mm-1,dd));
    if(date.getUTCFullYear()!==yy||date.getUTCMonth()!==mm-1||date.getUTCDate()!==dd) throw Error('HRA invalid day-cell date');
    days.add(dd);
    if(!CM_EVENT.test(block))continue;
    const iso=String(yy)+'-'+String(mm).padStart(2,'0')+'-'+String(dd).padStart(2,'0');
    if(seen.has(iso))throw Error('HRA repeated Century Mile day-cell: '+iso);
    seen.add(iso);
    rows.push({date:iso,racecourse_id:HRA_RACECOURSE_ID,source_url:sourceUrl});
  }
  if(days.size<20)throw Error('HRA calendar month day-cell structure incomplete: '+days.size);
  rows.sort((a,b)=>a.date.localeCompare(b.date));
  return {rows,calendarDays:days.size};
}

export function buildHraCenturyMileRecord(row,{checkedAt}={}){
  const meetingId='canada-hra-century-mile-standardbred-'+row.date;
  const ev={source_id:HRA_SOURCE_ID,official_source_url:row.source_url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'canada',
    authority_id:HRA_AUTHORITY_ID,racing_system_id:HRA_SYSTEM_ID,
    racecourse_id:HRA_RACECOURSE_ID,date:row.date,timezone:HRA_TIMEZONE,
    racing_type:'harness-racing',first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:HRA_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'horse_racing_alberta_jevents_official_2026_calendar'},
    route_id:HRA_ROUTE_ID,confidence:'high',review_status:'needs_review',
    notes:'HRA official current 2026 calendar identifies a Century Mile Standardbred race meeting for this exact date. Rank C shows the date and verified physical track only. Calendar event display times are not promoted to first-race times.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:HRA_SOURCE_ID,route_id:HRA_ROUTE_ID,error_code:null},
    evidence_support:{meeting_identity:ev,meeting_date:ev}
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
