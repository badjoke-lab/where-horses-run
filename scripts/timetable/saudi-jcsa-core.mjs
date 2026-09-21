import { deriveBestAvailableRank } from './best-available-rank.mjs';

export const SAUDI_JCSA_SOURCE_ID = 'jcsa-races';
export const SAUDI_JCSA_AUTHORITY_ID = 'jockey-club-of-saudi-arabia';
export const SAUDI_JCSA_SYSTEM_ID = 'saudi-arabia-jcsa-system';
export const SAUDI_JCSA_TIMEZONE = 'Asia/Riyadh';
export const SAUDI_JCSA_RACES_PREFIX = 'https://jcsa.sa/en/races/';
export const SAUDI_RACECOURSES = Object.freeze({
  taif: {
    id: 'king-khalid-racecourse-taif',
    name: 'King Khalid Racecourse',
    city: 'Taif',
    start: '2026-07-24',
    end: '2026-09-26',
    official_url: 'https://jcsa.sa/en/venues/our-racecourses-taif/',
  },
  riyadh: {
    id: 'king-abdulaziz-racecourse-riyadh',
    name: 'King Abdulaziz Racecourse',
    city: 'Riyadh',
    start: '2026-10-16',
    end: '2027-04-17',
    official_url: 'https://jcsa.sa/en/venues/our-racecourses-riyadh/',
  },
});

const MONTHS = Object.freeze({
  january:1,february:2,march:3,april:4,may:5,june:6,
  july:7,august:8,september:9,october:10,november:11,december:12,
});

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}
export function visibleText(value) {
  return decodeHtml(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function pad(n){return String(n).padStart(2,'0');}
function to24(hour, minute, meridiem) {
  let h=Number(hour);
  const m=Number(minute);
  const ap=String(meridiem).toLowerCase();
  if(ap==='pm' && h!==12) h+=12;
  if(ap==='am' && h===12) h=0;
  return pad(h)+':'+pad(m);
}
function parseDate(text) {
  const m=text.match(/(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})/i);
  if(!m) return null;
  return m[3]+'-'+pad(MONTHS[m[2].toLowerCase()])+'-'+pad(Number(m[1]));
}
export function resolveSaudiRacecourse(date) {
  for (const venue of Object.values(SAUDI_RACECOURSES)) {
    if (date >= venue.start && date <= venue.end) return venue;
  }
  return null;
}
function parseRaceRows(text) {
  const byNumber=new Map();
  const re=/\bR(\d{1,2})\s+(.{1,220}?)\s+(\d{1,2}):(\d{2})(am|pm)\b/gi;
  for(const m of text.matchAll(re)){
    const number=Number(m[1]);
    if(number<1||number>30) continue;
    const time=to24(m[3],m[4],m[5]);
    byNumber.set(number,{number,label:'Race '+number,post_time_local:time});
  }
  const rows=[...byNumber.values()].sort((a,b)=>a.number-b.number);
  if(!rows.length) return [];
  if(rows.some((row,index)=>row.number!==index+1)) throw new Error('JCSA race numbers are not contiguous from Race 1');
  if(rows.some((row,index)=>index>0 && row.post_time_local<=rows[index-1].post_time_local)) throw new Error('JCSA post times are not strictly increasing');
  return rows.map(({number,...row})=>row);
}
export function parseJcsaMeetingHtml(html,{expectedDate=null}={}) {
  if(typeof html!=='string'||!html.trim()) throw new Error('JCSA meeting HTML must be non-empty');
  const text=visibleText(html);
  const meetingMatch=text.match(/Season\s+\d+\s*[·•]?\s*Meeting\s+(\d+)/i);
  if(!meetingMatch) return {status:'no_meeting'};
  const date=parseDate(text);
  if(!date) throw new Error('JCSA meeting date could not be parsed');
  if(expectedDate&&date!==expectedDate) throw new Error('JCSA meeting date mismatch: expected '+expectedDate+', found '+date);
  const venue=resolveSaudiRacecourse(date);
  if(!venue) throw new Error('JCSA meeting falls outside reviewed racecourse season windows: '+date);
  const rows=parseRaceRows(text);
  return {
    status:'meeting',
    meeting_number:Number(meetingMatch[1]),
    meeting_date:date,
    racecourse:venue,
    timetable_rows:rows,
  };
}
function evidence(url,checkedAt){
  return {source_id:SAUDI_JCSA_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};
}
export function buildJcsaMeetingRecord({date,html,checkedAt}) {
  const url=SAUDI_JCSA_RACES_PREFIX+date.replaceAll('-','');
  const parsed=parseJcsaMeetingHtml(html,{expectedDate:date});
  if(parsed.status!=='meeting') return null;
  const rows=parsed.timetable_rows;
  const record={
    candidate_id:'saudi-arabia-'+parsed.racecourse.id+'-'+date,
    meeting_id:'saudi-arabia-'+parsed.racecourse.id+'-'+date,
    country_id:'saudi-arabia',
    authority_id:SAUDI_JCSA_AUTHORITY_ID,
    racing_system_id:SAUDI_JCSA_SYSTEM_ID,
    racecourse_id:parsed.racecourse.id,
    date,
    timezone:SAUDI_JCSA_TIMEZONE,
    first_race_time_local:rows[0]?.post_time_local??null,
    last_race_time_local:rows.at(-1)?.post_time_local??null,
    timetable_rows:rows,
    source:{source_id:SAUDI_JCSA_SOURCE_ID,official_url:url,checked_at:checkedAt,extraction_method:'official_jcsa_meeting_html'},
    route_id:'jcsa-date-meeting-best-available-v1',
    confidence:'high',
    review_status:'needs_review',
    detail_observation:{
      status:rows.length?'available':'not_published',
      evaluated_capability_rank:rows.length?'A':'C',
      race_count:rows.length,
      meeting_number:parsed.meeting_number,
      meeting_url:url,
    },
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:SAUDI_JCSA_SOURCE_ID,route_id:'jcsa-date-meeting-best-available-v1',error_code:null},
  };
  const e=evidence(url,checkedAt);
  record.evidence_support={
    meeting_identity:e,
    meeting_date:e,
    ...(rows.length?{race_times:e,timetable:e}:{}),
  };
  return {...record,capability_rank:deriveBestAvailableRank(record,rows)};
}
