import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const SOUTH_AFRICA_TIMEZONE = 'Africa/Johannesburg';
export const FOUR_RACING_AUTHORITY_ID = 'four-racing';
export const FOUR_RACING_SYSTEM_ID = 'south-africa-4racing-system';
export const FOUR_RACING_SOURCE_ID = 'sa-horseracing-national-fixtures-2026';
export const FOUR_RACING_FIXTURE_PDF_URL = 'https://www.sahorseracing.co.za/Programs/FX/Jan%20to%20Dec%202026.pdf';

const MONTHS = Object.freeze({
  JANUARY:1,FEBRUARY:2,MARCH:3,APRIL:4,MAY:5,JUNE:6,
  JULY:7,AUGUST:8,SEPTEMBER:9,OCTOBER:10,NOVEMBER:11,DECEMBER:12,
});
const VENUES = Object.freeze({
  'TURF(I)': { racecourse_id:'south-africa--turffontein', venue_name:'Turffontein', course_context:'inside' },
  'TURF(S)': { racecourse_id:'south-africa--turffontein', venue_name:'Turffontein', course_context:'standside' },
  'VAAL': { racecourse_id:'south-africa--vaal', venue_name:'Vaal', course_context:null },
  'VAAL(CL)': { racecourse_id:'south-africa--vaal', venue_name:'Vaal', course_context:'classic' },
  'FAIR(P)': { racecourse_id:'south-africa--fairview', venue_name:'Fairview', course_context:'poly' },
  'FAIR(T)': { racecourse_id:'south-africa--fairview', venue_name:'Fairview', course_context:'turf' },
  'FAIR(T/P)': { racecourse_id:'south-africa--fairview', venue_name:'Fairview', course_context:'turf/poly' },
});
function pad(value){return String(value).padStart(2,'0');}
function point(item){return {str:String(item?.str??'').replace(/\s+/g,' ').trim(),x:Number(item?.x??item?.transform?.[4]),y:Number(item?.y??item?.transform?.[5])};}
function normalizedToken(value){return String(value??'').replace(/\s+/g,'').toUpperCase();}
function monthFromItems(items){
  for(const item of items){
    const m=item.str.toUpperCase().match(/^(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+2026$/);
    if(m) return MONTHS[m[1]];
  }
  return null;
}
function sameRow(a,b,tolerance=2.5){return Math.abs(a.y-b.y)<=tolerance;}
function revisionOnlyToken(item,items){
  const left=items.filter(other=>sameRow(item,other)&&other.x<item.x&&item.x-other.x<95).map(other=>other.str).join(' ');
  const nearby=items.filter(other=>sameRow(item,other)&&Math.abs(other.x-item.x)<160).map(other=>other.str).join(' ');
  if(/\b(?:PREV|PREVIOUS)\b/i.test(left)) return true;
  if(/\b(?:CANCELLED|CANCELED|ABANDONED)\b/i.test(nearby)) return true;
  return false;
}
export function resolveFourRacingVenue(label){
  const token=normalizedToken(label);
  const venue=VENUES[token];
  if(!venue) throw new Error(`Unknown 4Racing national fixture venue: ${label}`);
  return {source_venue_label:token,...venue};
}
export function discoverNationalFixtureVersion(pages){
  const matches=[];
  for(const page of pages??[]){
    for(const item of page.items??[]){
      const m=String(item?.str??'').match(/Version\s+(\d+)\s*\(([^)]+2026)\)/i);
      if(m) matches.push({version:Number(m[1]),label:m[2],page_number:page.page_number});
    }
  }
  matches.sort((a,b)=>b.version-a.version);
  return matches[0]??null;
}
export function parseFourRacingNationalFixturePages(pages,{year=2026,sourceUrl=FOUR_RACING_FIXTURE_PDF_URL}={}){
  const records=[];const parse_failures=[];const unknown_venues=[];
  for(const page of pages??[]){
    const items=(page.items??[]).map(point).filter(item=>item.str&&Number.isFinite(item.x)&&Number.isFinite(item.y));
    if(!items.some(item=>/HIGHVELD/i.test(item.str))||!items.some(item=>/EASTERN CAPE/i.test(item.str))) continue;
    const month=monthFromItems(items);
    if(!month) continue;
    const dateHeader=items.find(item=>/^DATE$/i.test(item.str));
    if(!dateHeader){parse_failures.push({code:'date_header_missing',page_number:page.page_number,month});continue;}
    const dates=items.filter(item=>/^(?:[1-9]|[12]\d|3[01])$/.test(item.str)&&Math.abs(item.x-dateHeader.x)<45)
      .map(item=>({...item,day:Number(item.str)}));
    if(!dates.length){parse_failures.push({code:'date_rows_missing',page_number:page.page_number,month});continue;}
    for(const item of items){
      const token=normalizedToken(item.str);
      if(!VENUES[token]) continue;
      if(revisionOnlyToken(item,items)) continue;
      const date=[...dates].sort((a,b)=>Math.abs(a.y-item.y)-Math.abs(b.y-item.y))[0];
      if(!date||Math.abs(date.y-item.y)>4.5){
        parse_failures.push({code:'venue_without_date_row',page_number:page.page_number,month,source_text:item.str});
        continue;
      }
      let venue;
      try{venue=resolveFourRacingVenue(item.str);}catch(error){unknown_venues.push({code:'unknown_venue',source_text:item.str});continue;}
      records.push({
        date:`${year}-${pad(month)}-${pad(date.day)}`,
        source_venue_label:venue.source_venue_label,
        racecourse_id:venue.racecourse_id,
        venue_name:venue.venue_name,
        course_context:venue.course_context,
        source_url:sourceUrl,
        page_number:page.page_number,
      });
    }
  }
  const unique=new Map();
  for(const row of records) unique.set(`${row.date}|${row.racecourse_id}`,row);
  return {records:[...unique.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.racecourse_id.localeCompare(b.racecourse_id)),parse_failures,unknown_venues};
}
function evidence(url,checkedAt){return {source_id:FOUR_RACING_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};}
export function buildFourRacingMeetingRecord(row,{checkedAt}={}){
  const meetingId=`south-africa-four-racing-${row.racecourse_id.replace(/^south-africa--/,'')}-${row.date}`;
  const e=evidence(row.source_url??FOUR_RACING_FIXTURE_PDF_URL,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'south-africa',authority_id:FOUR_RACING_AUTHORITY_ID,racing_system_id:FOUR_RACING_SYSTEM_ID,
    racecourse_id:row.racecourse_id,date:row.date,timezone:SOUTH_AFRICA_TIMEZONE,first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:FOUR_RACING_SOURCE_ID,official_url:row.source_url??FOUR_RACING_FIXTURE_PDF_URL,checked_at:checkedAt,extraction_method:'joint_national_fixture_pdf'},
    route_id:'sa-horseracing-national-fixtures-pdf',confidence:'high',review_status:'needs_review',
    notes:`Joint 4Racing/Race Coast 2026 National Fixtures observation for the 4Racing operator scope; source venue code: ${row.source_venue_label}${row.course_context?`; course context: ${row.course_context}`:''}. Meeting date and physical racecourse only; race times are not inferred.`,
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,fixture_pdf_url:FOUR_RACING_FIXTURE_PDF_URL},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:FOUR_RACING_SOURCE_ID,route_id:'sa-horseracing-national-fixtures-pdf',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e},
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
