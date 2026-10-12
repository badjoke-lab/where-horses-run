import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const CANADA_TIMEZONE='America/Toronto';
export const CANADA_AUTHORITY_ID='ontario-racing';
export const CANADA_SYSTEM_ID='canada-ontario-racing-system';
export const CANADA_SOURCE_ID='ontario-agco-mohawk-2026-calendar';
export const CANADA_SOURCE_URL='https://www.agco.ca/sites/default/files/2026-03/MOHS%20-%20Approved%202026%20Race%20Date%20Calendar_E_17%20Mar%202026.pdf';
export const CANADA_RACECOURSE_ID='canada--woodbine-mohawk-park';

const MONTH_BOXES=Object.freeze([
  {month:1,name:'January',x0:185,x1:312,y0:520,y1:606},
  {month:2,name:'February',x0:312,x1:439,y0:520,y1:606},
  {month:3,name:'March',x0:439,x1:570,y0:520,y1:606},
  {month:4,name:'April',x0:185,x1:312,y0:365,y1:465},
  {month:5,name:'May',x0:312,x1:439,y0:365,y1:465},
  {month:6,name:'June',x0:439,x1:570,y0:365,y1:465},
  {month:7,name:'July',x0:185,x1:312,y0:225,y1:324},
  {month:8,name:'August',x0:312,x1:439,y0:225,y1:324},
  {month:9,name:'September',x0:439,x1:570,y0:225,y1:324},
  {month:10,name:'October',x0:185,x1:312,y0:95,y1:180},
  {month:11,name:'November',x0:312,x1:439,y0:95,y1:180},
  {month:12,name:'December',x0:439,x1:570,y0:95,y1:180},
]);

const pad=v=>String(Number(v)).padStart(2,'0');

function itemText(items){
  return items.map(x=>String(x?.text??'').trim()).filter(Boolean).join(' ');
}

export function parseAgcoMohawkCalendarItems(items,{sourceUrl=CANADA_SOURCE_URL}={}){
  if(!Array.isArray(items)||!items.length) throw new Error('AGCO Mohawk PDF items must be non-empty');
  const full=itemText(items);
  if(!/Approved\s+2026\s+Race\s+Date\s+Calendar/i.test(full)) throw new Error('AGCO approved-2026 calendar fingerprint missing');
  if(!/Mohawk\s+Park/i.test(full)||!/Standardbred/i.test(full)) throw new Error('AGCO Mohawk Park Standardbred fingerprint missing');
  if(!/Total\s+2026\s+Race\s+Dates/i.test(full)) throw new Error('AGCO total-race-dates fingerprint missing');

  for(const b of MONTH_BOXES){
    if(!items.some(x=>String(x?.text??'').trim().toLowerCase()===b.name.toLowerCase())){
      throw new Error('AGCO month heading missing: '+b.name);
    }
  }

  const rows=[];
  for(const box of MONTH_BOXES){
    const days=items
      .filter(x=>{
        const t=String(x?.text??'').trim();
        const n=Number(t);
        const xx=Number(x?.x), yy=Number(x?.y);
        return /^\d{1,2}$/.test(t)&&Number.isInteger(n)&&n>=1&&n<=31&&
          Number.isFinite(xx)&&Number.isFinite(yy)&&
          xx>=box.x0&&xx<box.x1&&yy>=box.y0&&yy<=box.y1;
      })
      .map(x=>Number(String(x.text).trim()));
    const unique=[...new Set(days)].sort((a,b)=>a-b);
    if(!unique.length) throw new Error('AGCO month parsed zero race dates: '+box.name);
    for(const day of unique){
      const d=new Date(Date.UTC(2026,box.month-1,day));
      if(d.getUTCMonth()!==box.month-1||d.getUTCDate()!==day) throw new Error('AGCO invalid date '+box.name+' '+day);
      rows.push({
        date:'2026-'+pad(box.month)+'-'+pad(day),
        racecourse_id:CANADA_RACECOURSE_ID,
        venue_name:'Woodbine Mohawk Park',
        source_url:sourceUrl
      });
    }
  }

  rows.sort((a,b)=>a.date.localeCompare(b.date));
  if(rows.length!==222) throw new Error('AGCO Mohawk calendar expected 222 race dates, parsed '+rows.length);
  if(!items.some(x=>String(x?.text??'').trim()==='222')) throw new Error('AGCO printed total 222 missing');
  return rows;
}

function evidence(url,checkedAt){
  return {
    source_id:CANADA_SOURCE_ID,
    official_source_url:url,
    observed_at:checkedAt,
    successfully_verified_at:checkedAt,
    acquisition_method:'automatic'
  };
}

export function buildCanadaMohawkMeetingRecord(row,{checkedAt}={}){
  const meetingId='canada-mohawk-'+row.date;
  const e=evidence(row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'canada',
    authority_id:CANADA_AUTHORITY_ID,racing_system_id:CANADA_SYSTEM_ID,
    racecourse_id:CANADA_RACECOURSE_ID,date:row.date,timezone:CANADA_TIMEZONE,
    racing_type:'harness-racing',
    first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{
      source_id:CANADA_SOURCE_ID,
      official_url:row.source_url,
      checked_at:checkedAt,
      extraction_method:'agco_approved_2026_calendar_pdf_geometry'
    },
    route_id:'agco-mohawk-approved-2026-calendar',confidence:'high',review_status:'needs_review',
    notes:'AGCO approved 2026 Race Date Calendar confirms the meeting date at fixed Woodbine Mohawk Park. The PDF also publishes general post-time guidance, but automatic public output remains rank C and does not infer meeting-specific post times.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:CANADA_SOURCE_ID,route_id:'agco-mohawk-approved-2026-calendar',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e}
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
