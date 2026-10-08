import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const TRINIDAD_TIMEZONE='America/Port_of_Spain';
export const TRINIDAD_AUTHORITY_ID='arima-race-club';
export const TRINIDAD_SYSTEM_ID='trinidad-and-tobago-reviewed-system';
export const TRINIDAD_SOURCE_ID='arima-2026-fixture-list';
export const TRINIDAD_DETAIL_SOURCE_ID='arima-programme';
export const TRINIDAD_RACECOURSE_ID='trinidad-and-tobago--santa-rosa-park';
export const TRINIDAD_SOURCE_URL='https://arimaraceclub.com/wp-content/uploads/2026/04/Race-Book-Day-04.pdf';
export const TRINIDAD_PROGRAMME_URL='https://arimaraceclub.com/race-programme/';

const MONTHS=Object.freeze({
  january:'01',february:'02',march:'03',april:'04',may:'05',june:'06',
  july:'07',august:'08',september:'09',october:'10',november:'11',december:'12'
});
const pad=v=>String(Number(v)).padStart(2,'0');

export function parseArimaFixtureText(text,{sourceUrl=TRINIDAD_SOURCE_URL}={}){
  if(typeof text!=='string'||!text.trim()) throw new Error('Arima fixture text must be non-empty');
  const normalized=text.replace(/\s+/g,' ').trim();
  const tableStart=normalized.search(/DATE\s+RACE\s+DAY/i);
  if(tableStart<0){
    throw new Error('Arima fixture-table header missing');
  }
  const fixtureText=normalized.slice(tableStart);
  const rows=[];
  // pdfjs currently splits some glyph runs in the official PDF:
  // "24 TH", race-day "1 2", and even words in the page heading.
  // Fingerprint the stable table structure instead of the decorative heading.
  // The November row contains the publisher typo "SATURDY".
  const rx=/(?:MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SATURDY|SUNDAY)\s+(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+(\d{1,2})\s*(?:ST|ND|RD|TH)?\s+(\d(?:\s*\d)?)(?=\s|ARIMA|$)/gi;
  for(const m of fixtureText.matchAll(rx)){
    const month=MONTHS[m[1].toLowerCase()];
    const raceDay=Number(m[3].replace(/\s+/g,''));
    if(raceDay<1||raceDay>40) continue;
    rows.push({
      date:'2026-'+month+'-'+pad(m[2]),
      race_day:raceDay,
      racecourse_id:TRINIDAD_RACECOURSE_ID,
      venue_name:'Santa Rosa Park',
      source_url:sourceUrl
    });
  }
  if(rows.length<10) throw new Error('Arima fixture table parsed fewer than 10 race days');
  return [...new Map(rows.map(r=>[r.date,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
}

function evidence(url,checkedAt){
  return {source_id:TRINIDAD_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};
}

export function buildTrinidadMeetingRecord(row,{checkedAt}={}){
  const meetingId='trinidad-and-tobago-santa-rosa-park-'+row.date;
  const e=evidence(row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'trinidad-and-tobago',
    authority_id:TRINIDAD_AUTHORITY_ID,racing_system_id:TRINIDAD_SYSTEM_ID,
    racecourse_id:TRINIDAD_RACECOURSE_ID,date:row.date,timezone:TRINIDAD_TIMEZONE,
    racing_type:'thoroughbred-flat',
    first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:TRINIDAD_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'official_arima_2026_fixture_pdf'},
    route_id:'arima-2026-fixture-list-official-window',confidence:'high',review_status:'needs_review',
    notes:'Official Arima Race Club 2026 fixture list confirms Race Day '+row.race_day+' at the fixed Santa Rosa Park venue. Automatic schedule publication is rank C; programme-level post times remain a separate reviewed A-capability source.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:TRINIDAD_SOURCE_ID,route_id:'arima-2026-fixture-list-official-window',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e}
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
