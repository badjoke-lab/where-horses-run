import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const NETHERLANDS_TIMEZONE='Europe/Amsterdam';
export const NETHERLANDS_AUTHORITY_ID='ndr';
export const NETHERLANDS_SYSTEM_ID='netherlands-ndr-racing-calendar-system';
export const NETHERLANDS_SOURCE_ID='ndr-current-upcoming';
export const NETHERLANDS_UPCOMING_URL='https://ndr.nl/selectieproeven/';

export const NDR_VENUES=Object.freeze({
  'wolvega':{racecourse_id:'netherlands--victoria-park-wolvega',venue_name:'Victoria Park Wolvega',venue_kind:'permanent'},
  'alkmaar':{racecourse_id:'netherlands--drafcentrum-alkmaar',venue_name:'Drafcentrum Alkmaar',venue_kind:'permanent'},
  'zandvoort':{racecourse_id:'netherlands--kortebaan-zandvoort',venue_name:'Kortebaan Zandvoort',venue_kind:'temporary_street'},
  't zand':{racecourse_id:'netherlands--kortebaan-t-zand',venue_name:"Kortebaan 't Zand",venue_kind:'temporary_street'},
  "'t zand":{racecourse_id:'netherlands--kortebaan-t-zand',venue_name:"Kortebaan 't Zand",venue_kind:'temporary_street'},
  '’t zand':{racecourse_id:'netherlands--kortebaan-t-zand',venue_name:"Kortebaan 't Zand",venue_kind:'temporary_street'}
});

function decodeHtml(v){return String(v??'').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#x([0-9a-f]+);/gi,(_,c)=>String.fromCodePoint(Number.parseInt(c,16))).replace(/&#(\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));}
export function visibleText(html){return decodeHtml(String(html??'')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
function key(v){return String(v??'').toLowerCase().replace(/’/g,"'").trim().replace(/\s+/g,' ');}
function pad(v){return String(Number(v)).padStart(2,'0');}

export function parseNdrUpcomingHtml(html,{sourceUrl=NETHERLANDS_UPCOMING_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('NDR upcoming HTML must be non-empty');
  const text=visibleText(html);
  const start=text.search(/Komende dagen/i);
  if(start<0) throw new Error('NDR upcoming section fingerprint missing');
  const rest=text.slice(start);
  const endMatch=rest.search(/Koersprogramma(?:'|’)?s/i);
  const section=endMatch>=0?rest.slice(0,endMatch):rest;
  const matches=[...section.matchAll(/(\d{2})-(\d{2})-(\d{2})\s+(.+?)(?=\s+\d{2}-\d{2}-\d{2}\s+|$)/g)];
  if(!matches.length) throw new Error('NDR upcoming rows missing');
  const rows=[],unknown_venues=[];
  for(const m of matches){
    const label=String(m[4]).replace(/\s+/g,' ').trim();
    const venue=NDR_VENUES[key(label)]??null;
    const date='20'+m[3]+'-'+pad(m[2])+'-'+pad(m[1]);
    if(!venue){unknown_venues.push({date,venue_label:label});continue;}
    rows.push({date,source_venue_label:label,...venue,racing_type:'harness-racing',source_url:sourceUrl});
  }
  const deduped=[...new Map(rows.map(r=>[r.date+'|'+r.racecourse_id,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
  return {rows:deduped,unknown_venues};
}

function evidence(url,checkedAt){return {source_id:NETHERLANDS_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};}
export function buildNetherlandsMeetingRecord(row,{checkedAt}={}){
  const meetingId='netherlands-ndr-'+row.date+'-'+row.racecourse_id.replace(/^netherlands--/,'');
  const e=evidence(row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'netherlands',
    authority_id:NETHERLANDS_AUTHORITY_ID,racing_system_id:NETHERLANDS_SYSTEM_ID,
    racecourse_id:row.racecourse_id,date:row.date,timezone:NETHERLANDS_TIMEZONE,
    racing_type:row.racing_type,first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:NETHERLANDS_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'official_ndr_current_upcoming_html'},
    route_id:'ndr-current-upcoming',confidence:'high',review_status:'needs_review',
    notes:'Official NDR current upcoming list confirms meeting date and venue. Automatic output remains rank C; no race post time is inferred. Temporary kortebaan street venues are kept distinct from permanent racecourses.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:NETHERLANDS_SOURCE_ID,route_id:'ndr-current-upcoming',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e},
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
