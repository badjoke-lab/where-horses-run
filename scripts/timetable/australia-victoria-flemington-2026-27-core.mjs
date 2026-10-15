import {deriveBestAvailableRank} from './best-available-rank.mjs';
import {classifyAcquisitionCompletion} from './acquisition-completion.mjs';
export const AU_VIC_COUNTRY='australia';
export const AU_VIC_AUTHORITY='racing-victoria';
export const AU_VIC_SYSTEM='australia-victoria-flemington-thoroughbred-system';
export const AU_VIC_SOURCE='racing-victoria-flemington-2026-27-approved-race-dates';
export const AU_VIC_VENUE='australia--flemington-racecourse';
export const AU_VIC_TZ='Australia/Melbourne';
export const AU_VIC_RELEASE='https://www.racingvictoria.com.au/news/2026/04/30/track-enhancements-and-strategic-initiatives-shape-2026-27-victorian-race-dates';
export const AU_VIC_PDF='https://dxp-cdn.racing.com/api/public/content/Victorian_Race_Dates_2026-27_FINAL-%28EMBARGOED%29-8668576.pdf?v=073e67fe';
const MONTHS={Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12};
const WEEKDAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const pad=x=>String(x).padStart(2,'0');

export function parseFlemingtonApprovedSeason2026_27(pages,{url=AU_VIC_PDF}={}){
 if(!Array.isArray(pages)||pages.length<10||pages.length>30)throw Error('Victoria approved season PDF page structure invalid');
 const rows=[];
 for(const tokens of pages){
  if(!Array.isArray(tokens))throw Error('Victoria PDF text tokens absent');
  // Page textual order in the published PDF is DATE | DAY | VENUE | TIMESLOT.
  // Do not parse arbitrary occurrences of Flemington (e.g. feature race titles).
  const line=tokens.map(x=>String(x||'').trim()).filter(Boolean).join(' | ');
  const re=/\b(\d{2})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(26|27)\s*\|\s*(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\s*\|\s*Flemington\s*\|/gi;
  for(const match of line.matchAll(re)){
   const day=Number(match[1]),month=MONTHS[match[2].slice(0,1).toUpperCase()+match[2].slice(1,3).toLowerCase()],year=2000+Number(match[3]);
   const d=new Date(Date.UTC(year,month-1,day));
   if(d.getUTCFullYear()!==year||d.getUTCMonth()+1!==month||d.getUTCDate()!==day||WEEKDAYS[d.getUTCDay()].toLowerCase()!==match[4].toLowerCase())throw Error('Victoria approved fixture date/weekday mismatch');
   if(year===2026&&month<8||year===2027&&month>7)throw Error('Victoria schedule outside source 2026-27 season');
   rows.push({date:year+'-'+pad(month)+'-'+pad(day),racecourse_id:AU_VIC_VENUE,source_url:url});
  }
 }
 rows.sort((a,b)=>a.date.localeCompare(b.date));
 if(rows.length!==21)throw Error('Victoria 2026-27 approved Flemington venue denominator mismatch: '+rows.length+' (expected 21)');
 if(new Set(rows.map(x=>x.date)).size!==rows.length)throw Error('Victoria approved duplicate Flemington date');
 return rows;
}
export function buildFlemingtonCMeeting(row,{checkedAt}={}){
 const meetingId='australia-victoria-flemington-2026-27-'+row.date;
 const ev={source_id:AU_VIC_SOURCE,official_source_url:row.source_url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};
 const m={candidate_id:meetingId,meeting_id:meetingId,country_id:AU_VIC_COUNTRY,authority_id:AU_VIC_AUTHORITY,
 racing_system_id:AU_VIC_SYSTEM,racecourse_id:AU_VIC_VENUE,date:row.date,timezone:AU_VIC_TZ,racing_type:'thoroughbred-flat',
 first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
 source:{source_id:AU_VIC_SOURCE,official_url:row.source_url,checked_at:checkedAt,extraction_method:'rv_published_2026_27_approved_venue_date_facts_only'},
 route_id:'australia-victoria-flemington-2026-27',confidence:'high',review_status:'needs_review',
 notes:'Racing Victoria published its approved 2026-27 racing dates on 30 April 2026. Flemington meeting date and physical venue only. 21 Flemington fixtures within Victoria 528 total. C grade; no inferred time, race details, actual running or cancellation.',
 detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:AU_VIC_RELEASE},
 acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:AU_VIC_SOURCE,route_id:'australia-victoria-flemington-2026-27',error_code:null},
 evidence_support:{meeting_identity:ev,meeting_date:ev}};
 const capability_rank=deriveBestAvailableRank(m,[]);
 m.acquisition_completion=classifyAcquisitionCompletion({...m,capability_rank},{technical_capability_rank:'C'});
 return {...m,capability_rank};
}
