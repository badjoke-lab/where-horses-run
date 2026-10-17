import {deriveBestAvailableRank} from './best-available-rank.mjs';
import {classifyAcquisitionCompletion} from './acquisition-completion.mjs';

export const AU_NSW_COUNTRY='australia';
export const AU_NSW_AUTHORITY='australian-turf-club';
export const AU_NSW_SYSTEM='australia-nsw-atc-thoroughbred-system';
export const AU_NSW_SOURCE='australian-turf-club-2026-27-official-fixture-card';
export const AU_NSW_PDF='https://cdn.australianturfclub.com.au/app/uploads/2026/07/2026-27-Australian-Turf-Club-Fixture-Card.pdf';
export const AU_NSW_RELEASE='https://www.australianturfclub.com.au/races/';
export const AU_NSW_TZ='Australia/Sydney';
export const AU_NSW_ROUTE='australia-nsw-atc-2026-27';
const MONTHS={JAN:1,FEB:2,MAR:3,APR:4,MAY:5,JUN:6,JUL:7,AUG:8,SEP:9,OCT:10,NOV:11,DEC:12};
const WEEKDAYS={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
const VENUES={
 'Royal Randwick':'australia--royal-randwick-racecourse',
 'Kensington':'australia--royal-randwick-racecourse',
 'Rosehill Gardens':'australia--rosehill-gardens-racecourse',
 'Canterbury Park':'australia--canterbury-park-racecourse',
 'Warwick Farm':'australia--warwick-farm-racecourse'
};
const SKIP_VENUES=new Set(['Hawkesbury','Wyong']);
const pad=x=>String(x).padStart(2,'0');

/**
 * Only accept dated fixture rows within the 2026-27 PDF month sections.
 * A marketing banner or 2027 year label by itself must never create a meeting.
 * Kensington is a COURSE of physical Royal Randwick, not a fifth site.
 */
export function parseAtc2026_27FixtureTokens(pages,{url=AU_NSW_PDF}={}){
 if(!Array.isArray(pages)||pages.length!==2||!Array.isArray(pages[0]))throw Error('ATC official 2026-27 PDF expected two pages');
 const t=pages[0].map(s=>String(s??'').trim()).filter(Boolean);
 if(!t.some(z=>z==='FIXTURE CARD 2026-27')||!t.some(z=>/Kensington located at Royal Randwick/i.test(z)))throw Error('ATC 2026-27 PDF identity or Kensington location statement missing');
 const found=new Map(),rows=[],byMonth={};let month=null,year=null,sourceMonthSet=new Set();
 for(let i=0;i<t.length;i++){
  const a=t[i];
  const m=a.match(/^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(2026|2027)$/i);
  if(m){month=MONTHS[m[1].toUpperCase()];year=Number(m[2]);sourceMonthSet.add(year+'-'+pad(month));continue;}
  const dd=a.match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(\d{1,2})$/);
  if(!dd||month===null)continue;
  const day=Number(dd[2]),date=new Date(Date.UTC(year,month-1,day));
  if(date.getUTCDate()!==day||date.getUTCMonth()!==month-1||date.getUTCFullYear()!==year||date.getUTCDay()!==WEEKDAYS[dd[1]])throw Error('ATC fixture date weekday mismatch '+a);
  const iso=year+'-'+pad(month)+'-'+pad(day);
  if(iso<'2026-08-01'||iso>='2027-08-01')throw Error('ATC fixture outside released 2026-27 season '+iso);
  let venue=null;
  for(let n=i+1;n<Math.min(t.length,i+8);n++){
   if(/^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(2026|2027)$/i.test(t[n])||/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+\d{1,2}$/.test(t[n]))break;
   if(Object.hasOwn(VENUES,t[n])||SKIP_VENUES.has(t[n])){venue=t[n];break}
  }
  if(!venue)throw Error('ATC date missing physical racecourse '+iso);
  if(found.has(iso))throw Error('ATC duplicate fixture date '+iso);
  found.set(iso,venue);
  byMonth[iso.slice(0,7)]=(byMonth[iso.slice(0,7)]||0)+1;
  if(SKIP_VENUES.has(venue))continue; // Explicit provincial, no ATC physical venue claim.
  const course_variant=venue==='Kensington'?'Kensington':null;
  rows.push({date:iso,racecourse_id:VENUES[venue],course_variant,venue_label:venue,source_url:url});
 }
 const months=['2026-08','2026-09','2026-10','2026-11','2026-12','2027-01','2027-02','2027-03','2027-04','2027-05','2027-06','2027-07'];
 for(const m of months){if(!sourceMonthSet.has(m)||!byMonth[m]||byMonth[m]<5||byMonth[m]>15)throw Error('ATC missing/incomplete fixture month '+m);}
 if(byMonth['2026-10']!==10||byMonth['2026-11']!==7)throw Error('ATC October/November 2026 approved fixture denominator drift');
 if(rows.length<90||rows.length>140)throw Error('ATC full-season scope size unexpected: '+rows.length);
 rows.sort((a,b)=>a.date.localeCompare(b.date));
 return {rows,byMonth,allSourceDates:found.size,physicalVenueIds:[...new Set(rows.map(x=>x.racecourse_id))].sort()};
}
export function buildAtcCMeeting(row,{checkedAt}={}){
 const meetingId='australia-nsw-atc-2026-27-'+row.date+'-'+row.racecourse_id;
 const ev={source_id:AU_NSW_SOURCE,official_source_url:row.source_url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};
 const m={
 candidate_id:meetingId,meeting_id:meetingId,country_id:AU_NSW_COUNTRY,authority_id:AU_NSW_AUTHORITY,
 racing_system_id:AU_NSW_SYSTEM,racecourse_id:row.racecourse_id,date:row.date,timezone:AU_NSW_TZ,racing_type:'thoroughbred-flat',
 first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
 source:{source_id:AU_NSW_SOURCE,official_url:row.source_url,checked_at:checkedAt,extraction_method:'atc_2026_27_official_fixture_card_physical_venue_date_facts_only'},
 route_id:AU_NSW_ROUTE,confidence:'high',review_status:'needs_review',
 notes:'Australian Turf Club official 2026-27 approved Sydney fixture date and physical racecourse only. '+(row.course_variant?'Kensington is a course at Royal Randwick, not a separate physical venue. ':'')+'Subject to Racing NSW changes. C-grade; no inferred first post, racebook, or cancellation.',
 detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:AU_NSW_RELEASE},
 acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:AU_NSW_SOURCE,route_id:AU_NSW_ROUTE,error_code:null},
 evidence_support:{meeting_identity:ev,meeting_date:ev}
 };
 const capability_rank=deriveBestAvailableRank(m,[]);
 m.acquisition_completion=classifyAcquisitionCompletion({...m,capability_rank},{technical_capability_rank:'C'});
 return {...m,capability_rank};
}
