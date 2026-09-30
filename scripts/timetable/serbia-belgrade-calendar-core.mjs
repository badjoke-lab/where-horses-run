import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const SERBIA_TIMEZONE='Europe/Belgrade';
export const SERBIA_AUTHORITY_ID='belgrade-hippodrome';
export const SERBIA_SYSTEM_ID='serbia-belgrade-hippodrome-system';
export const SERBIA_SOURCE_ID='belgrade-current-season';
export const SERBIA_RACECOURSE_ID='serbia--belgrade-hippodrome';
export const SERBIA_CURRENT_SEASON_URL='https://www.hipodrombeograd.rs/en/current-season';
export const SERBIA_SEASON_URL='https://www.hipodrombeograd.rs/en/races/sezona-2026';

function decodeHtml(v){return String(v??'').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#x([0-9a-f]+);/gi,(_,c)=>String.fromCodePoint(Number.parseInt(c,16))).replace(/&#(\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));}
export function visibleText(html){return decodeHtml(String(html??'')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
function pad(v){return String(Number(v)).padStart(2,'0');}

export function parseBelgradeSeasonHtml(html,{sourceUrl=SERBIA_CURRENT_SEASON_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('Belgrade season HTML must be non-empty');
  const text=visibleText(html);
  if(!/(Current season|Sezona 2026)/i.test(text)) throw new Error('Belgrade season fingerprint missing');
  const rows=[];
  const rx=/(\d{1,2})\.(\d{1,2})\.(20\d{2})\s+\d+\.Trkački dan/giu;
  for(const m of text.matchAll(rx)){
    rows.push({
      date:m[3]+'-'+pad(m[2])+'-'+pad(m[1]),
      racecourse_id:SERBIA_RACECOURSE_ID,
      venue_name:'Belgrade Hippodrome',
      racing_type:'thoroughbred-flat',
      source_url:sourceUrl
    });
  }
  const out=[...new Map(rows.map(r=>[r.date,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
  if(!out.length) throw new Error('Belgrade season meeting rows missing');
  return out;
}

function evidence(url,checkedAt){return {source_id:SERBIA_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};}
export function buildSerbiaMeetingRecord(row,{checkedAt}={}){
  const meetingId='serbia-belgrade-'+row.date;
  const e=evidence(row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'serbia',
    authority_id:SERBIA_AUTHORITY_ID,racing_system_id:SERBIA_SYSTEM_ID,
    racecourse_id:SERBIA_RACECOURSE_ID,date:row.date,timezone:SERBIA_TIMEZONE,
    racing_type:'thoroughbred-flat',first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:SERBIA_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'official_belgrade_current_season_html'},
    route_id:'belgrade-current-season',confidence:'high',review_status:'needs_review',
    notes:'Official Belgrade Hippodrome season page confirms the meeting date and physical venue. The automatic route publishes rank C only; reviewed detailed schedules remain a separate richer evidence path.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:SERBIA_SOURCE_ID,route_id:'belgrade-current-season',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e},
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
