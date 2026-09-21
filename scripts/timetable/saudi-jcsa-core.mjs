import { deriveBestAvailableRank } from './best-available-rank.mjs';

export const SAUDI_JCSA_SOURCE_ID = 'jcsa-races';
export const SAUDI_JCSA_AUTHORITY_ID = 'jockey-club-of-saudi-arabia';
export const SAUDI_JCSA_SYSTEM_ID = 'saudi-arabia-jcsa-system';
export const SAUDI_JCSA_TIMEZONE = 'Asia/Riyadh';
export const SAUDI_JCSA_RACES_BASE = 'https://www.jcsa.sa/en/races/';
export const SAUDI_JCSA_TAIF_VENUE_URL = 'https://www.jcsa.sa/en/venues/our-racecourses-taif/';
export const SAUDI_JCSA_RIYADH_VENUE_URL = 'https://www.jcsa.sa/en/venues/our-racecourses-riyadh/';

export const SAUDI_JCSA_VENUES = Object.freeze([
  {
    racecourse_id: 'king-khalid-racecourse',
    name: 'King Khalid Racecourse',
    city: 'Taif',
    season_key: 'taif',
  },
  {
    racecourse_id: 'king-abdulaziz-racecourse',
    name: 'King Abdulaziz Racecourse',
    city: 'Riyadh',
    season_key: 'riyadh',
  },
]);

const MONTHS = Object.freeze({
  january:1,february:2,march:3,april:4,may:5,june:6,
  july:7,august:8,september:9,october:10,november:11,december:12,
});
const MONTH_RX = Object.keys(MONTHS).join('|');

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/&#x([0-9a-f]+);/gi,(_,code)=>String.fromCodePoint(Number.parseInt(code,16)))
    .replace(/&#(\d+);/g,(_,code)=>String.fromCodePoint(Number(code)));
}
export function jcsaVisibleText(html) {
  return decodeHtml(String(html ?? ''))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<br\s*\/?\s*>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function pad(n){ return String(n).padStart(2,'0'); }
function isoDate(year,month,day){ return year+'-'+pad(month)+'-'+pad(day); }

function parseEnglishDate(text) {
  const rx=new RegExp('(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\s+('+MONTH_RX+')\\s+(20\\d{2})','i');
  const m=String(text).match(rx);
  return m ? isoDate(Number(m[3]),MONTHS[m[2].toLowerCase()],Number(m[1])) : null;
}

export function parseJcsaVenueSeason(html,{venueKey}={}) {
  const text=jcsaVisibleText(html);
  const venue=SAUDI_JCSA_VENUES.find(v=>v.season_key===venueKey);
  if(!venue) throw new Error('Unknown JCSA venue key '+venueKey);
  if(!new RegExp(venue.name,'i').test(text)) throw new Error('JCSA '+venueKey+' venue fingerprint missing');

  const range=text.match(new RegExp('(\\d{1,2})\\s+('+MONTH_RX+')(?:\\s+(20\\d{2}))?\\s*(?:-|–|—|to)\\s*(\\d{1,2})\\s+('+MONTH_RX+')\\s+(20\\d{2})','i'));
  if(!range) throw new Error('JCSA '+venueKey+' season range could not be parsed');
  const endYear=Number(range[6]);
  const startMonth=MONTHS[range[2].toLowerCase()];
  const endMonth=MONTHS[range[5].toLowerCase()];
  const startYear=range[3] ? Number(range[3]) : (startMonth>endMonth ? endYear-1 : endYear);
  return {
    ...venue,
    start_date:isoDate(startYear,startMonth,Number(range[1])),
    end_date:isoDate(endYear,endMonth,Number(range[4])),
  };
}

export function parseJcsaVenueFixtures(html,{venueKey}={}) {
  const text=jcsaVisibleText(html);
  const venue=SAUDI_JCSA_VENUES.find(v=>v.season_key===venueKey);
  if(!venue) throw new Error('Unknown JCSA venue key '+venueKey);
  if(!new RegExp(venue.name,'i').test(text)) throw new Error('JCSA '+venueKey+' venue fingerprint missing');

  const fixtures=[];
  const meetingRx=/Meeting\s+(\d+)/gi;
  const matches=[...text.matchAll(meetingRx)];
  for(let i=0;i<matches.length;i+=1){
    const start=matches[i].index ?? 0;
    const end=i+1<matches.length ? (matches[i+1].index ?? text.length) : Math.min(text.length,start+500);
    const segment=text.slice(start,Math.min(end,start+500));
    const date=parseEnglishDate(segment);
    if(!date) continue;
    fixtures.push({
      meeting_no:Number(matches[i][1]),
      date,
      racecourse_id:venue.racecourse_id,
      venue_key:venueKey,
      title:segment.slice(0,180).trim(),
    });
  }
  const unique=new Map();
  for(const fixture of fixtures) unique.set(fixture.date,fixture);
  return [...unique.values()].sort((a,b)=>a.date.localeCompare(b.date));
}

function parseTime(value){
  const m=String(value).trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if(!m) return null;
  let h=Number(m[1])%12;
  if(m[3].toLowerCase()==='pm') h+=12;
  return pad(h)+':'+m[2];
}

export function parseJcsaRacePage(html,{expectedDate=null,venue=null}={}) {
  if(typeof html!=='string'||!html.trim()) throw new Error('JCSA race page HTML must be non-empty');
  const text=jcsaVisibleText(html);
  const meeting=text.match(/Season\s+[^·|]+[·|]\s*Meeting\s+(\d+)/i) ?? text.match(/Meeting\s+(\d+)/i);
  if(!meeting) return {status:'absent_unconfirmed',reason:'meeting_fingerprint_missing'};

  const date=parseEnglishDate(text);
  if(!date) throw new Error('JCSA meeting date could not be parsed');
  if(expectedDate&&date!==expectedDate) throw new Error('JCSA meeting date mismatch: expected '+expectedDate+', found '+date);
  if(!venue?.racecourse_id) throw new Error('JCSA venue resolution missing for '+date);

  const rows=[];
  const rx=/\bR(\d{1,2})\s+(.{1,180}?)\s+(\d{1,2}:\d{2}\s*(?:am|pm))\b/gi;
  for(const m of text.matchAll(rx)){
    const number=Number(m[1]);
    const time=parseTime(m[3]);
    let name=String(m[2]).replace(/^Results\s+/i,'').trim();
    name=name.replace(/\s+SAR\s+[\d,]+.*$/i,'').trim();
    if(!time||!name) continue;
    rows.push({number,label:'Race '+number,post_time_local:time,race_name:name});
  }
  const byNumber=new Map();
  for(const row of rows) if(!byNumber.has(row.number)) byNumber.set(row.number,row);
  const timetable=[...byNumber.values()].sort((a,b)=>a.number-b.number);
  if(timetable.length&&timetable.some((r,i)=>r.number!==i+1)) throw new Error('JCSA race rows are not continuous from Race 1');
  if(timetable.some((r,i)=>i>0&&r.post_time_local<=timetable[i-1].post_time_local)) throw new Error('JCSA race post times are not strictly increasing');

  return {
    status:'present',
    meeting_no:Number(meeting[1]),
    meeting_date:date,
    racecourse_id:venue.racecourse_id,
    timetable_rows:timetable.map(({number,...row})=>row),
  };
}

function evidence(url,checkedAt){
  return {
    source_id:SAUDI_JCSA_SOURCE_ID,
    official_source_url:url,
    observed_at:checkedAt,
    successfully_verified_at:checkedAt,
    acquisition_method:'automatic',
  };
}

export function buildJcsaMeetingRecord({date,venue,raceHtml,checkedAt}) {
  const officialUrl=SAUDI_JCSA_RACES_BASE+date.replaceAll('-','');
  const parsed=parseJcsaRacePage(raceHtml,{expectedDate:date,venue});
  if(parsed.status!=='present') return null;
  const rows=parsed.timetable_rows;
  const record={
    candidate_id:'saudi-arabia-'+venue.racecourse_id+'-'+date,
    meeting_id:'saudi-arabia-'+venue.racecourse_id+'-'+date,
    country_id:'saudi-arabia',
    authority_id:SAUDI_JCSA_AUTHORITY_ID,
    racing_system_id:SAUDI_JCSA_SYSTEM_ID,
    racecourse_id:venue.racecourse_id,
    date,
    timezone:SAUDI_JCSA_TIMEZONE,
    first_race_time_local:rows[0]?.post_time_local??null,
    last_race_time_local:rows.at(-1)?.post_time_local??null,
    timetable_rows:rows,
    source:{source_id:SAUDI_JCSA_SOURCE_ID,official_url:officialUrl,checked_at:checkedAt,extraction_method:'official_jcsa_race_page'},
    route_id:'jcsa-date-race-page',
    confidence:'high',
    review_status:'needs_review',
    detail_observation:{
      status:rows.length?'available':'not_published',
      evaluated_capability_rank:'A',
      race_count:rows.length,
      programme_url:officialUrl,
    },
    acquisition_attempt:{
      attempted_at:checkedAt,
      status:'success',
      source_id:SAUDI_JCSA_SOURCE_ID,
      route_id:'jcsa-date-race-page',
      error_code:null,
    },
  };
  const e=evidence(officialUrl,checkedAt);
  record.evidence_support={meeting_identity:e,meeting_date:e};
  if(rows.length){
    record.evidence_support.race_times=e;
    record.evidence_support.timetable=e;
  }
  const capability_rank=deriveBestAvailableRank(record,rows);
  record.acquisition_completion={
    disposition:capability_rank==='A'?'complete_current_best_available':'pending_publication',
    evaluated_rank:capability_rank,
    technical_capability_rank:'A',
  };
  return {...record,capability_rank};
}


export function buildJcsaFixtureRecord({date,venue,meetingNo,checkedAt,officialUrl}) {
  const record={
    candidate_id:'saudi-arabia-'+venue.racecourse_id+'-'+date,
    meeting_id:'saudi-arabia-'+venue.racecourse_id+'-'+date,
    country_id:'saudi-arabia',
    authority_id:SAUDI_JCSA_AUTHORITY_ID,
    racing_system_id:SAUDI_JCSA_SYSTEM_ID,
    racecourse_id:venue.racecourse_id,
    date,
    timezone:SAUDI_JCSA_TIMEZONE,
    first_race_time_local:null,
    last_race_time_local:null,
    timetable_rows:[],
    source:{source_id:SAUDI_JCSA_SOURCE_ID,official_url:officialUrl,checked_at:checkedAt,extraction_method:'official_jcsa_venue_fixture'},
    route_id:'jcsa-venue-fixture-to-date-race-page',
    confidence:'high',
    review_status:'needs_review',
    detail_observation:{
      status:'not_published',
      evaluated_capability_rank:'A',
      race_count:0,
      programme_url:SAUDI_JCSA_RACES_BASE+date.replaceAll('-',''),
      meeting_no:meetingNo,
    },
    acquisition_attempt:{
      attempted_at:checkedAt,
      status:'pending_publication',
      source_id:SAUDI_JCSA_SOURCE_ID,
      route_id:'jcsa-venue-fixture-to-date-race-page',
      error_code:null,
    },
  };
  const e=evidence(officialUrl,checkedAt);
  record.evidence_support={meeting_identity:e,meeting_date:e};
  return {...record,capability_rank:deriveBestAvailableRank(record,[])};
}

export function resolveJcsaVenueForDate(date,seasons){
  const matches=seasons.filter(s=>date>=s.start_date&&date<=s.end_date);
  if(matches.length>1) throw new Error('JCSA date overlaps multiple venue seasons: '+date);
  return matches[0]??null;
}
