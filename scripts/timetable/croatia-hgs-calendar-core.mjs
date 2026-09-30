import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const CROATIA_TIMEZONE='Europe/Zagreb';
export const CROATIA_AUTHORITY_ID='hrvatski-galopski-savez';
export const CROATIA_SYSTEM_ID='croatian-gallop-system';
export const CROATIA_SOURCE_ID='hgs-current-season';
export const CROATIA_RACECOURSE_ID='croatia--hipodrom-zagreb';
export const CROATIA_CURRENT_SEASON_URL='https://crogallop.com.hr/aktualna-sezona/';
export const CROATIA_CALENDAR_FALLBACK_URL='https://crogallop.com.hr/kalendar/';

function decodeHtml(v){return String(v??'').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#x([0-9a-f]+);/gi,(_,c)=>String.fromCodePoint(Number.parseInt(c,16))).replace(/&#(\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));}
export function visibleText(html){return decodeHtml(String(html??'')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
function pad(v){return String(Number(v)).padStart(2,'0');}
function row(date,sourceUrl){return {date,racecourse_id:CROATIA_RACECOURSE_ID,venue_name:'Hipodrom Zagreb',racing_type:'thoroughbred-flat',source_url:sourceUrl};}

export function parseCroatiaCurrentSeasonHtml(html,{sourceUrl=CROATIA_CURRENT_SEASON_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('Croatia current-season HTML must be non-empty');
  const text=visibleText(html);
  if(!/Aktualna sezona/i.test(text)) throw new Error('Croatia current-season fingerprint missing');
  const rows=[];
  const rx=/Zagreb\s*[–—-]\s*(\d{1,2})\.(\d{1,2})\.(20\d{2})\.?/gi;
  for(const m of text.matchAll(rx)) rows.push(row(m[3]+'-'+pad(m[2])+'-'+pad(m[1]),sourceUrl));
  const out=[...new Map(rows.map(r=>[r.date,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
  if(!out.length) throw new Error('Croatia current-season meeting rows missing');
  return out;
}

export function parseCroatiaCalendarHtml(html,{sourceUrl=CROATIA_CALENDAR_FALLBACK_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('Croatia calendar HTML must be non-empty');
  const text=visibleText(html);
  if(!/Kalendar/i.test(text)) throw new Error('Croatia calendar fingerprint missing');
  const rows=[];
  const rx=/Hipodrom Zagreb,\s*(\d{1,2})\.(\d{1,2})\.(20\d{2})\.?/gi;
  for(const m of text.matchAll(rx)) rows.push(row(m[3]+'-'+pad(m[2])+'-'+pad(m[1]),sourceUrl));
  const out=[...new Map(rows.map(r=>[r.date,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
  if(!out.length) throw new Error('Croatia calendar meeting rows missing');
  return out;
}

function evidence(url,checkedAt){return {source_id:CROATIA_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};}
export function buildCroatiaMeetingRecord(r,{checkedAt}={}){
  const meetingId='croatia-zagreb-'+r.date;
  const e=evidence(r.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'croatia',
    authority_id:CROATIA_AUTHORITY_ID,racing_system_id:CROATIA_SYSTEM_ID,
    racecourse_id:CROATIA_RACECOURSE_ID,date:r.date,timezone:CROATIA_TIMEZONE,
    racing_type:'thoroughbred-flat',first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:CROATIA_SOURCE_ID,official_url:r.source_url,checked_at:checkedAt,extraction_method:'official_hgs_current_season_html'},
    route_id:'hgs-current-season',confidence:'high',review_status:'needs_review',
    notes:'Official Hrvatski Galopski Savez source confirms the meeting date and Hipodrom Zagreb identity. Race post times are not inferred. The current-season page outranks the older season calendar when dates differ.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:r.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:CROATIA_SOURCE_ID,route_id:'hgs-current-season',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e},
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
