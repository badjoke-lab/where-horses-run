/**
 * Bangalore Turf Club official winter 2026-27 fixtures — date/venue only.
 * Experimental isolated C candidate. Not a national India calendar.
 * No race names, racecards, copyrighted source tables, times or 2027-28 guess.
 */
export const BTC_SOURCE_URL='https://www.bangaloreraces.com/Club/Fixtures';
export const BTC_COUNTRY='india';
export const BTC_AUTHORITY='bangalore-turf-club';
export const BTC_SYSTEM='india-bangalore-turf-club-thoroughbred-system';
export const BTC_SOURCE_ID='bangalore-fixtures';
export const BTC_ROUTE='india-bangalore-winter-2026-27';
export const BTC_VENUE='india--bangalore-racecourse';
export const BTC_ZONE='Asia/Kolkata';
const HEADING=/Fixtures\s+for\s+Bangalore\s+Winter\s+Meeting\s+2026[\u2010-\u2015-]27/i;
const DAY=/\b(\d{1,2})(?:st|nd|rd|th)\s+Day\s+(20(?:26|27)-\d{2}-\d{2})\b/g;
const EXPECTED_COUNT=24;
const parseDate=date=>{
 const d=new Date(date+'T00:00:00Z');
 if(Number.isNaN(d.valueOf())||d.toISOString().slice(0,10)!==date)throw Error('BTC invalid fixture date '+date);
 return date;
};
const strip=html=>String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
 .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
 .replace(/<[^>]+>/g,' ')
 .replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&')
 .replace(/\s+/g,' ').trim();

/**
 * Identify one official season section; never treat "intervenue betting" or
 * other clubs' meeting schedules as BTC fixtures.
 */
export function parseBtcWinterFixtures2026(html){
 const text=strip(html);
 const match=HEADING.exec(text);
 if(!match)throw Error('BTC winter 2026-27 heading missing');
 let section=text.slice(match.index+match[0].length);
 const stop=/\b(?:Fixtures\s+for\s+Bangalore\s+(?:Summer|Winter)\s+Meeting\s+\d{4}|DISCLAIMER|Copyright)\b/i.exec(section);
 if(stop)section=section.slice(0,stop.index);
 const matches=[...section.matchAll(DAY)];
 if(matches.length!==EXPECTED_COUNT)throw Error('BTC winter fixture day denominator drift: '+matches.length);
 const rows=matches.map((m,i)=>{
  const day=Number(m[1]); const date=parseDate(m[2]);
  if(day!==i+1)throw Error('BTC expected sequential meeting day '+(i+1));
  if(date<'2026-11-01'||date>'2027-03-13')throw Error('BTC winter fixture date outside source season');
  return {date,racecourse_id:BTC_VENUE,source_url:BTC_SOURCE_URL,source_day_number:day};
 });
 if(rows.some((r,i)=>i>0&&r.date<=rows[i-1].date))throw Error('BTC fixture dates duplicate or out of order');
 if(rows[0]?.date!=='2026-11-01'||rows.at(-1)?.date!=='2027-03-13')
  throw Error('BTC 2026-27 source horizon/fingerprint drift');
 return rows;
}
export function buildBtcCMeeting(row,{checkedAt=new Date().toISOString()}={}){
 const id='india-bangalore-winter-'+row.date;
 const evidence={source_id:BTC_SOURCE_ID,official_source_url:BTC_SOURCE_URL,
  observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};
 return {
  candidate_id:id,meeting_id:id,country_id:BTC_COUNTRY,authority_id:BTC_AUTHORITY,
  racing_system_id:BTC_SYSTEM,racecourse_id:BTC_VENUE,date:row.date,
  timezone:BTC_ZONE,racing_type:'thoroughbred-flat',capability_rank:'C',
  first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
  source:{source_id:BTC_SOURCE_ID,official_url:BTC_SOURCE_URL,checked_at:checkedAt,
    extraction_method:'btc_winter_2026_27_venue_date_facts_only'},
  route_id:BTC_ROUTE,confidence:'medium',review_status:'needs_review',
  notes:'Official Bangalore Turf Club 2026-27 winter fixtures, single venue only; no other Indian clubs, race times, completed racing or non-running inferred.',
  detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:BTC_SOURCE_URL},
  acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:BTC_SOURCE_ID,route_id:BTC_ROUTE,error_code:null},
  evidence_support:{meeting_identity:evidence,meeting_date:evidence}
 };
}
