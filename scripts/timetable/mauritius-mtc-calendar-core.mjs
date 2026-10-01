import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const MAURITIUS_TIMEZONE='Indian/Mauritius';
export const MAURITIUS_AUTHORITY_ID='mtc-jockey-club';
export const MAURITIUS_SYSTEM_ID='mauritius-champ-de-mars-system';
export const MAURITIUS_SOURCE_ID='mtc-fixtures-2026';
export const MAURITIUS_RACECOURSE_ID='mauritius--champ-de-mars';
export const MAURITIUS_FIXTURES_URL='https://www.mtcjockeyclub.com/form-guide/fixtures';

const MONTHS=Object.freeze({january:'01',february:'02',march:'03',april:'04',may:'05',june:'06',july:'07',august:'08',september:'09',october:'10',november:'11',december:'12'});
function decodeHtml(v){return String(v??'').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#x([0-9a-f]+);/gi,(_,c)=>String.fromCodePoint(Number.parseInt(c,16))).replace(/&#(\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));}
export function visibleText(html){return decodeHtml(String(html??'')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
function pad(v){return String(Number(v)).padStart(2,'0');}
function parseDate(day,month,year){const mm=MONTHS[String(month??'').toLowerCase()];return mm?String(year)+'-'+mm+'-'+pad(day):null;}

export function parseMtcFixturesHtml(html,{sourceUrl=MAURITIUS_FIXTURES_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('MTC fixtures HTML must be non-empty');
  const text=visibleText(html);
  if(!/2026 Race Season/i.test(text)||!/Champ de Mars/i.test(text)) throw new Error('MTC 2026 fixture fingerprint missing');
  const rows=[];
  const next=text.match(/Next Race[\s\S]{0,240}?(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})/i);
  if(next){
    const date=parseDate(next[1],next[2],next[3]);
    if(date) rows.push({date,racecourse_id:MAURITIUS_RACECOURSE_ID,venue_name:'Champ de Mars',source_url:sourceUrl,evidence_kind:'next_race'});
  }
  const upcomingStart=text.search(/Upcoming Meetings/i);
  const majorStart=text.search(/Major Races Season 2026/i);
  if(upcomingStart>=0){
    const segment=text.slice(upcomingStart,majorStart>upcomingStart?majorStart:Math.min(text.length,upcomingStart+5000));
    const rx=/(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})/gi;
    for(const m of segment.matchAll(rx)){
      const date=parseDate(m[1],m[2],m[3]);
      if(date) rows.push({date,racecourse_id:MAURITIUS_RACECOURSE_ID,venue_name:'Champ de Mars',source_url:sourceUrl,evidence_kind:'upcoming_meeting'});
    }
  }
  const out=[...new Map(rows.map(r=>[r.date,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
  if(!out.length) throw new Error('MTC source-visible meeting rows missing');
  return out;
}

function evidence(url,checkedAt){return {source_id:MAURITIUS_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};}
export function buildMauritiusMeetingRecord(row,{checkedAt}={}){
  const meetingId='mauritius-champ-de-mars-'+row.date;
  const e=evidence(row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'mauritius',
    authority_id:MAURITIUS_AUTHORITY_ID,racing_system_id:MAURITIUS_SYSTEM_ID,
    racecourse_id:MAURITIUS_RACECOURSE_ID,date:row.date,timezone:MAURITIUS_TIMEZONE,
    racing_type:'thoroughbred-flat',first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:MAURITIUS_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'official_mtc_fixtures_html'},
    route_id:'mtc-fixtures-2026',confidence:'high',review_status:'needs_review',
    notes:'Official MTCJC Fixtures confirms the meeting date and Champ de Mars physical identity. Automatic publication remains rank C; race times are not inferred.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:MAURITIUS_SOURCE_ID,route_id:'mtc-fixtures-2026',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e},
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
