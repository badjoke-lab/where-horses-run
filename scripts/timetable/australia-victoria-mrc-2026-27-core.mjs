import {deriveBestAvailableRank} from './best-available-rank.mjs';
import {classifyAcquisitionCompletion} from './acquisition-completion.mjs';
import {AU_VIC_PDF,AU_VIC_RELEASE,AU_VIC_COUNTRY,AU_VIC_TZ} from './australia-victoria-flemington-2026-27-core.mjs';
export {AU_VIC_PDF,AU_VIC_RELEASE,AU_VIC_COUNTRY,AU_VIC_TZ};
export const AU_MRC_AUTHORITY='racing-victoria';
export const AU_MRC_SYSTEM='australia-victoria-mrc-thoroughbred-system';
export const AU_MRC_SOURCE='racing-victoria-mrc-2026-27-approved-race-dates';
export const AU_MRC_ROUTE='australia-victoria-mrc-2026-27';
const EXPECTED={'Caulfield':19,'Caulfield Heath':14,'Sportsbet Sandown':28,'Mornington':17};
const PHYSICAL={'Caulfield':'australia--caulfield-racecourse','Caulfield Heath':'australia--caulfield-racecourse','Sportsbet Sandown':'australia--sandown-racecourse','Mornington':'australia--mornington-racecourse'};
const MONTHS={Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12};
const DOW=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const pad=x=>String(x).padStart(2,'0');
export function parseVictoriaMrc2026_27(pages,{url=AU_VIC_PDF}={}){
 if(!Array.isArray(pages)||pages.length<10||pages.length>30)throw Error('Racing Victoria approved 2026-27 PDF page structure invalid');
 const rows=[],counts=Object.fromEntries(Object.keys(EXPECTED).map(x=>[x,0]));
 const re=/\b(\d{2})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(26|27)\s*\|\s*(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\s*\|\s*([^|]+)\s*\|/gi;
 for(const page of pages){
  if(!Array.isArray(page))throw Error('Racing Victoria 2026-27 PDF tokens absent');
  const text=page.map(x=>String(x||'').trim()).filter(Boolean).join(' | ');
  for(const m of text.matchAll(re)){
   const venue=m[5].trim();
   if(!Object.hasOwn(EXPECTED,venue))continue;
   const day=Number(m[1]),mon=MONTHS[m[2].slice(0,1).toUpperCase()+m[2].slice(1,3).toLowerCase()],year=2000+Number(m[3]),dt=new Date(Date.UTC(year,mon-1,day));
   if(dt.getUTCFullYear()!==year||dt.getUTCMonth()+1!==mon||dt.getUTCDate()!==day||DOW[dt.getUTCDay()].toLowerCase()!==m[4].toLowerCase())throw Error('Racing Victoria MRC source date/week mismatch');
   const date=year+'-'+pad(mon)+'-'+pad(day);
   if(date<'2026-08-01'||date>='2027-08-01')throw Error('Racing Victoria MRC source out-of-season date');
   rows.push({date,racecourse_id:PHYSICAL[venue],source_venue_label:venue,course_variant:venue==='Caulfield Heath'?'Caulfield Heath':null,source_url:url});
   counts[venue]++;
  }
 }
 for(const [key,total] of Object.entries(EXPECTED))if(counts[key]!==total)throw Error('Racing Victoria 2026-27 MRC venue denominator mismatch '+key+' expected '+total+' got '+counts[key]);
 rows.sort((a,b)=>a.date.localeCompare(b.date)||a.racecourse_id.localeCompare(b.racecourse_id));
 if(rows.length!==78)throw Error('Racing Victoria MRC total expected 78, got '+rows.length);
 if(new Set(rows.map(x=>x.date+'|'+x.racecourse_id)).size!==rows.length)throw Error('Racing Victoria MRC duplicate physical site date');
 if(new Set(rows.map(x=>x.racecourse_id)).size!==3)throw Error('Racing Victoria MRC wrong physical venue count');
 return {rows,counts};
}
export function buildVictoriaMrcCMeeting(row,{checkedAt}={}){
 const meetingId='australia-victoria-mrc-2026-27-'+row.date+'-'+row.racecourse_id;
 const ev={source_id:AU_MRC_SOURCE,official_source_url:row.source_url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};
 const m={candidate_id:meetingId,meeting_id:meetingId,country_id:AU_VIC_COUNTRY,authority_id:AU_MRC_AUTHORITY,
 racing_system_id:AU_MRC_SYSTEM,racecourse_id:row.racecourse_id,date:row.date,timezone:AU_VIC_TZ,racing_type:'thoroughbred-flat',
 first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
 source:{source_id:AU_MRC_SOURCE,official_url:row.source_url,checked_at:checkedAt,extraction_method:'rv_published_2026_27_mrc_physical_venue_date_facts_only'},
 route_id:AU_MRC_ROUTE,confidence:'high',review_status:'needs_review',
 notes:'Racing Victoria 2026–27 approved dates: physical venue/date facts only. '+(row.course_variant?'Caulfield Heath is a course variant at Caulfield, not a fourth physical site. ':'')+'Grade C; no inferred first post, actual racing or cancellation.',
 detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:AU_VIC_RELEASE},
 acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:AU_MRC_SOURCE,route_id:AU_MRC_ROUTE,error_code:null},
 evidence_support:{meeting_identity:ev,meeting_date:ev}};
 const capability_rank=deriveBestAvailableRank(m,[]);
 m.acquisition_completion=classifyAcquisitionCompletion({...m,capability_rank},{technical_capability_rank:'C'});
 return {...m,capability_rank};
}
