import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const BAHRAIN_TIMEZONE = 'Asia/Bahrain';
export const BTC_AUTHORITY_ID = 'bahrain-turf-club';
export const BTC_SYSTEM_ID = 'bahrain-turf-club-system';
export const BTC_SCHEDULE_SOURCE_ID = 'btc-race-programme';
export const BTC_DETAIL_SOURCE_ID = 'btc-racecard-route';
export const BTC_SEASON_PROGRAMME_URL = 'https://bahrainturfclub.com/racing/rehc-racing-season-imported';
export const BTC_RACECARD_BASE_URL = 'https://bahrainturfclub.com/racecard';
export const BTC_RACECOURSE_ID = 'rashid-equestrian-and-horseracing-club-racecourse';
export const BTC_RACECOURSE_NAME = 'Rashid Equestrian & Horseracing Club';

const MONTHS = Object.freeze({
  january:1,february:2,march:3,april:4,may:5,june:6,
  july:7,august:8,september:9,october:10,november:11,december:12,
});

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/&#x([0-9a-f]+);/gi,(_,code)=>String.fromCodePoint(Number.parseInt(code,16)))
    .replace(/&#(\d+);/g,(_,code)=>String.fromCodePoint(Number(code)));
}
export function btcVisibleText(html) {
  return decodeHtml(String(html ?? ''))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<br\s*\/?\s*>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function pad(value){return String(value).padStart(2,'0');}
function isoDate(year,month,day){return `${year}-${pad(month)}-${pad(day)}`;}
function monthNumber(value){return MONTHS[String(value??'').trim().toLowerCase()] ?? null;}
function to24Hour(hour,minute,ampm){
  let h=Number(hour); const m=Number(minute);
  if(!Number.isInteger(h)||h<1||h>12||!Number.isInteger(m)||m<0||m>59) return null;
  const marker=String(ampm).toLowerCase();
  if(marker==='pm'&&h!==12) h+=12;
  if(marker==='am'&&h===12) h=0;
  return `${pad(h)}:${pad(m)}`;
}
function parseEnglishDate(day,month,year){
  const m=monthNumber(month);
  if(!m) return null;
  return isoDate(Number(year),m,Number(day));
}

export function parseBtcSeasonProgrammePage(html,{sourceUrl=BTC_SEASON_PROGRAMME_URL}={}) {
  if(typeof html!=='string'||!html.trim()) throw new Error('BTC season programme HTML must be non-empty');
  const text=btcVisibleText(html);
  if(!/Race\s+Programme/i.test(text)||!/Race\s+Meetings/i.test(text)) {
    throw new Error('BTC season programme fingerprint missing');
  }
  const records=[];
  for(const match of text.matchAll(/\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/gi)){
    const date=parseEnglishDate(match[1],match[2],match[3]);
    if(!date) continue;
    records.push({
      date,
      venue_label:BTC_RACECOURSE_NAME,
      racecourse_id:BTC_RACECOURSE_ID,
      source_url:sourceUrl,
    });
  }
  const byDate=new Map();
  for(const row of records) byDate.set(row.date,row);
  return [...byDate.values()].sort((a,b)=>a.date.localeCompare(b.date));
}

export function parseBtcRacecardPage(html,{date=null,sourceUrl=null}={}) {
  if(typeof html!=='string'||!html.trim()) throw new Error('BTC racecard HTML must be non-empty');
  const text=btcVisibleText(html);
  const dateMatch=text.match(/\b(?:Entries|Declarations)\s+for\s+(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/i);
  if(!dateMatch) throw new Error('BTC racecard meeting-date fingerprint missing');
  const observedDate=parseEnglishDate(dateMatch[1],dateMatch[2],dateMatch[3]);
  if(date&&observedDate!==date) throw new Error(`BTC racecard date mismatch: expected ${date}, observed ${observedDate}`);
  const byNumber=new Map();
  for(const match of text.matchAll(/\bRace\s+(\d{1,2})\s+(\d{1,2}):(\d{2})\s*(am|pm)\b/gi)){
    const number=Number(match[1]);
    const post=to24Hour(match[2],match[3],match[4]);
    if(!post||byNumber.has(number)) continue;
    byNumber.set(number,{number,label:`Race ${number}`,post_time_local:post});
  }
  const numbered=[...byNumber.values()].sort((a,b)=>a.number-b.number);
  if(!numbered.length) throw new Error('BTC racecard post-time navigation missing');
  if(numbered.some((row,index)=>row.number!==index+1)) throw new Error('BTC racecard rows are not continuous from Race 1');
  if(numbered.some((row,index)=>index>0&&row.post_time_local<=numbered[index-1].post_time_local)) throw new Error('BTC racecard post times are not strictly increasing');
  return {
    date:observedDate,
    source_url:sourceUrl,
    timetable_rows:numbered.map(({number,...row})=>row),
  };
}

function evidence(sourceId,url,checkedAt){
  return {
    source_id:sourceId,
    official_source_url:url,
    observed_at:checkedAt,
    successfully_verified_at:checkedAt,
    acquisition_method:'automatic',
  };
}
function baseRecord(row,checkedAt){
  const meetingId=`bahrain-${row.racecourse_id}-${row.date}`;
  return {
    candidate_id:meetingId,
    meeting_id:meetingId,
    country_id:'bahrain',
    authority_id:BTC_AUTHORITY_ID,
    racing_system_id:BTC_SYSTEM_ID,
    racecourse_id:row.racecourse_id,
    date:row.date,
    timezone:BAHRAIN_TIMEZONE,
    first_race_time_local:null,
    last_race_time_local:null,
    timetable_rows:[],
    source:{
      source_id:BTC_SCHEDULE_SOURCE_ID,
      official_url:row.source_url,
      checked_at:checkedAt,
      extraction_method:'official_btc_season_programme',
    },
    route_id:'btc-season-programme',
    confidence:'high',
    review_status:'needs_review',
    notes:`Official Bahrain Turf Club season-programme observation at ${BTC_RACECOURSE_NAME}.`,
  };
}
export function buildBtcFixtureRecord(
  row,
  {checkedAt,detailStatus='not_published',attemptStatus='pending_publication',errorCode=null}={}
){
  const record=baseRecord(row,checkedAt);
  record.detail_observation={
    status:detailStatus,
    evaluated_capability_rank:'A',
    race_count:0,
    detail_url:`${BTC_RACECARD_BASE_URL}/${row.date}/1/entries`,
  };
  record.acquisition_attempt={
    attempted_at:checkedAt,
    status:attemptStatus,
    source_id:BTC_DETAIL_SOURCE_ID,
    route_id:'btc-racecard-date-navigation',
    error_code:errorCode,
  };
  const meetingEvidence=evidence(BTC_SCHEDULE_SOURCE_ID,row.source_url,checkedAt);
  record.evidence_support={meeting_identity:meetingEvidence,meeting_date:meetingEvidence};
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion(
    {...record,capability_rank},
    {technical_capability_rank:'A'},
  );
  return {...record,capability_rank};
}
export function buildBtcDetailedRecord(row,detail,{checkedAt}={}){
  if(!Array.isArray(detail?.timetable_rows)||!detail.timetable_rows.length) {
    return buildBtcFixtureRecord(row,{checkedAt,detailStatus:'parser_failure',attemptStatus:'parser_failure',errorCode:'race_times_not_parsed'});
  }
  const record=baseRecord(row,checkedAt);
  record.first_race_time_local=detail.timetable_rows[0].post_time_local;
  record.last_race_time_local=detail.timetable_rows.at(-1).post_time_local;
  record.timetable_rows=detail.timetable_rows;
  record.source={
    source_id:BTC_DETAIL_SOURCE_ID,
    official_url:detail.source_url,
    checked_at:checkedAt,
    extraction_method:'official_btc_racecard_navigation',
  };
  record.route_id='btc-racecard-date-navigation';
  record.detail_observation={
    status:'available',
    evaluated_capability_rank:'A',
    race_count:detail.timetable_rows.length,
    detail_url:detail.source_url,
  };
  record.acquisition_attempt={
    attempted_at:checkedAt,
    status:'success',
    source_id:BTC_DETAIL_SOURCE_ID,
    route_id:'btc-racecard-date-navigation',
    error_code:null,
  };
  const meetingEvidence=evidence(BTC_SCHEDULE_SOURCE_ID,row.source_url,checkedAt);
  const detailEvidence=evidence(BTC_DETAIL_SOURCE_ID,detail.source_url,checkedAt);
  record.evidence_support={
    meeting_identity:meetingEvidence,
    meeting_date:meetingEvidence,
    race_times:detailEvidence,
    timetable:detailEvidence,
  };
  const capability_rank=deriveBestAvailableRank(record,detail.timetable_rows);
  record.acquisition_completion=classifyAcquisitionCompletion(
    {...record,capability_rank},
    {technical_capability_rank:'A'},
  );
  return {...record,capability_rank};
}
