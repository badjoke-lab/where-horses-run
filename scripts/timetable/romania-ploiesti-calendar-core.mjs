import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const ROMANIA_TIMEZONE='Europe/Bucharest';
export const ROMANIA_AUTHORITY_ID='csm-ploiesti';
export const ROMANIA_SYSTEM_ID='romania-ploiesti-system';
export const ROMANIA_SOURCE_ID='ploiesti-racing-notices';
export const ROMANIA_RACECOURSE_ID='romania--hipodromul-ploiesti';
export const ROMANIA_CATEGORY_URL='https://www.csmploiesti.ro/category/curse-hipodrom/';

const MONTHS=Object.freeze({
  ianuarie:'01',februarie:'02',martie:'03',aprilie:'04',mai:'05',iunie:'06',
  iulie:'07',august:'08',septembrie:'09',octombrie:'10',noiembrie:'11',decembrie:'12'
});
function decodeHtml(v){return String(v??'').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#x([0-9a-f]+);/gi,(_,c)=>String.fromCodePoint(Number.parseInt(c,16))).replace(/&#(\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));}
export function visibleText(html){return decodeHtml(String(html??'')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
function normalize(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function pad(v){return String(Number(v)).padStart(2,'0');}

export function extractPloiestiArticleLinks(html){
  const links=[];
  const rx=/href=["'](https?:\/\/www\.csmploiesti\.ro\/20\d{2}\/\d{2}\/\d{2}\/[^"'#?]+\/?)["']/gi;
  for(const m of String(html??'').matchAll(rx)) links.push(m[1]);
  return [...new Set(links)];
}

function articleYear(url){
  const m=String(url??'').match(/\/(20\d{2})\/\d{2}\/\d{2}\//);
  return m?m[1]:null;
}
function dateFromParts(day,monthName,year){
  const month=MONTHS[normalize(monthName)];
  if(!month||!year) return null;
  return year+'-'+month+'-'+pad(day);
}
export function parsePloiestiArticleHtml(html,{sourceUrl}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('Ploiesti article HTML must be non-empty');
  const text=visibleText(html);
  const year=articleYear(sourceUrl);
  if(!year) throw new Error('Ploiesti article year missing from source URL');
  const rows=[];

  const nextRx=/Urm[aă]torul eveniment hipic[^.]{0,180}?(\d{1,2})\s+(ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie)/giu;
  for(const m of text.matchAll(nextRx)){
    const date=dateFromParts(m[1],m[2],year);
    if(date) rows.push({date,source_url:sourceUrl,evidence_kind:'next_event_statement'});
  }

  const upcomingRx=/Duminic[aă],\s*(\d{1,2})\s+(ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie)[^.]*(?:Hipodromul Ploie[sș]ti|reuniune hipic[aă])/giu;
  for(const m of text.matchAll(upcomingRx)){
    const date=dateFromParts(m[1],m[2],year);
    if(date) rows.push({date,source_url:sourceUrl,evidence_kind:'upcoming_meeting_notice'});
  }

  return [...new Map(rows.map(r=>[r.date,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
}

function evidence(url,checkedAt){return {source_id:ROMANIA_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};}
export function buildRomaniaPloiestiMeetingRecord(row,{checkedAt}={}){
  const meetingId='romania-ploiesti-'+row.date;
  const e=evidence(row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'romania',
    authority_id:ROMANIA_AUTHORITY_ID,racing_system_id:ROMANIA_SYSTEM_ID,
    racecourse_id:ROMANIA_RACECOURSE_ID,date:row.date,timezone:ROMANIA_TIMEZONE,
    racing_type:'mixed',first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:ROMANIA_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'official_csm_ploiesti_notice_html'},
    route_id:'ploiesti-racing-notices',confidence:'high',review_status:'needs_review',
    notes:'Official CSM Ploiesti notice confirms the meeting date and Hipodromul Ploiesti identity. Automatic publication remains rank C; reviewed first-race-time evidence remains a separate richer B-capability path.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:ROMANIA_SOURCE_ID,route_id:'ploiesti-racing-notices',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e},
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
