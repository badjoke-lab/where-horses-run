import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const CYPRUS_TIMEZONE='Europe/Nicosia';
export const CYPRUS_AUTHORITY_ID='nicosia-race-club';
export const CYPRUS_SYSTEM_ID='nicosia-national-racing-system';
export const CYPRUS_SOURCE_ID='nrc-meetings-schedule';
export const CYPRUS_RACECOURSE_ID='cyprus--nicosia-racecourse';
export const CYPRUS_SCHEDULE_URL='https://www.nicosiaraceclub.com.cy/schedule.aspx';

const MONTH_NUMBER=Object.freeze({jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12});

function decodeHtml(v){return String(v??'').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#x([0-9a-f]+);/gi,(_,c)=>String.fromCodePoint(Number.parseInt(c,16))).replace(/&#(\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));}
export function visibleText(html){return decodeHtml(String(html??'')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
function pad(v){return String(Number(v)).padStart(2,'0');}

export function parseNrcSchedulePage(html,{sourceUrl=CYPRUS_SCHEDULE_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('NRC schedule HTML must be non-empty');
  const text=visibleText(html);
  if(!/Meetings\s*Schedule|Race\s*Meetings\s*Schedule/i.test(text)) throw new Error('NRC schedule page fingerprint missing');
  const rows=[];
  const rx=/MM_openBrWindow\('([^']*schedule_([a-z]{3})\.pdf)'[\s\S]{0,360}?>(January|February|March|April|May|June|July|August|September|October|November|December)<\/a>/giu;
  for(const m of html.matchAll(rx)){
    const month=MONTH_NUMBER[String(m[2]).toLowerCase()];
    if(!month) continue;
    rows.push({month,label:m[3],url:new URL(m[1],sourceUrl).href});
  }
  const out=[...new Map(rows.map(r=>[r.month,r])).values()].sort((a,b)=>a.month-b.month);
  if(!out.length) throw new Error('NRC monthly schedule PDF links missing');
  return out;
}

export function parseNrcSchedulePdfText(text,{sourceUrl}={}){
  if(typeof text!=='string'||!text.trim()) throw new Error('NRC schedule PDF text must be non-empty');
  if(!/Performance\s+Date\s+Day\s+Start\s+Time/i.test(text)) throw new Error('NRC monthly schedule PDF fingerprint missing');
  const rows=[];
  for(const m of text.matchAll(/\b(\d{1,2})\/(\d{1,2})\/(\d{2})\b/g)){
    const year=2000+Number(m[3]);
    const month=Number(m[2]);
    const day=Number(m[1]);
    const date=String(year)+'-'+pad(month)+'-'+pad(day);
    rows.push({date,racecourse_id:CYPRUS_RACECOURSE_ID,venue_name:'Nicosia Racecourse',source_url:sourceUrl});
  }
  const out=[...new Map(rows.map(r=>[r.date,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
  if(!out.length) throw new Error('NRC monthly schedule meeting dates missing');
  return out;
}

function evidence(url,checkedAt){return {source_id:CYPRUS_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};}

export function buildCyprusMeetingRecord(row,{checkedAt}={}){
  const meetingId='cyprus-nicosia-'+row.date;
  const e=evidence(row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'cyprus',
    authority_id:CYPRUS_AUTHORITY_ID,racing_system_id:CYPRUS_SYSTEM_ID,
    racecourse_id:CYPRUS_RACECOURSE_ID,date:row.date,timezone:CYPRUS_TIMEZONE,
    racing_type:'thoroughbred-flat',first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:CYPRUS_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'official_nrc_monthly_schedule_pdf'},
    route_id:'nrc-meetings-schedule',confidence:'high',review_status:'needs_review',
    notes:'Official Nicosia Race Club monthly schedule confirms the meeting date and Nicosia Racecourse physical identity. Performance Start Time is not interpreted as race post time; automatic publication remains rank C.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:CYPRUS_SOURCE_ID,route_id:'nrc-meetings-schedule',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e}
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
