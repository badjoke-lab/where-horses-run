import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const SWISS_TIMEZONE='Europe/Zurich';
export const GALOP_SUISSE_AUTHORITY_ID='galop-suisse';
export const GALOP_SUISSE_SYSTEM_ID='switzerland-galop-suisse-system';
export const GALOP_SUISSE_SOURCE_ID='galop-suisse-calendar';
export const GALOP_SUISSE_URL='https://galop-suisse.iena.ch/';
export const IENA_HOME_URL='https://www.iena.ch/';

const VENUES=Object.freeze({
  maienfeld:{racecourse_id:'switzerland--rossriet-maienfeld',venue_name:'Rossriet Maienfeld'},
  'zürich-dielsdorf':{racecourse_id:'switzerland--zurich-dielsdorf',venue_name:'Zürich-Dielsdorf'},
  'zurich-dielsdorf':{racecourse_id:'switzerland--zurich-dielsdorf',venue_name:'Zürich-Dielsdorf'},
  avenches:{racecourse_id:'switzerland--iena-avenches',venue_name:'IENA Avenches'},
});
function decodeHtml(v){return String(v??'').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#x([0-9a-f]+);/gi,(_,c)=>String.fromCodePoint(Number.parseInt(c,16))).replace(/&#(\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));}
export function visibleText(html){return decodeHtml(String(html??'')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
function norm(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();}
function pad(v){return String(Number(v)).padStart(2,'0');}

export function parseGalopSuisseHomepage(html,{sourceUrl=GALOP_SUISSE_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('Galop Suisse HTML must be non-empty');
  const text=visibleText(html);
  if(!/Galop Suisse/i.test(text)) throw new Error('Galop Suisse fingerprint missing');
  const rows=[];
  const rx=/(\d{2})\.(\d{2})\.(20\d{2})\s*\|\s*[A-Za-zÀ-ÿ]+\s*\|\s*(Maienfeld|Zürich-Dielsdorf|Zurich-Dielsdorf|Avenches)\b/g;
  for(const m of text.matchAll(rx)){
    const label=m[4].trim();
    const venue=VENUES[norm(label)];
    if(!venue) continue;
    rows.push({
      date:m[3]+'-'+m[2]+'-'+m[1],
      racecourse_id:venue.racecourse_id,
      venue_name:venue.venue_name,
      source_venue_label:label,
      source_url:sourceUrl
    });
  }
  return [...new Map(rows.map(r=>[r.date+'|'+r.racecourse_id,r])).values()];
}

export function parseIenaGallopHomepage(html,{sourceUrl=IENA_HOME_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('IENA HTML must be non-empty');
  const text=visibleText(html);
  if(!/Institut Équestre National d.?Avenches|Institut Equestre National d.?Avenches|IENA/i.test(text)) throw new Error('IENA fingerprint missing');
  const rows=[];
  const rx=/(\d{2})-(\d{2})-(\d{2})\s+Courses\s+GALOP\s*[–—-]\s*(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(20\d{2})/gi;
  const months={janvier:'01',février:'02',fevrier:'02',mars:'03',avril:'04',mai:'05',juin:'06',juillet:'07',août:'08',aout:'08',septembre:'09',octobre:'10',novembre:'11',décembre:'12',decembre:'12'};
  for(const m of text.matchAll(rx)){
    const month=months[norm(m[5])];
    if(!month) continue;
    rows.push({
      date:m[6]+'-'+month+'-'+pad(m[4]),
      racecourse_id:VENUES.avenches.racecourse_id,
      venue_name:VENUES.avenches.venue_name,
      source_venue_label:'Avenches',
      source_url:sourceUrl
    });
  }
  return [...new Map(rows.map(r=>[r.date+'|'+r.racecourse_id,r])).values()];
}

function evidence(url,checkedAt){return {source_id:GALOP_SUISSE_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};}
export function buildGalopSuisseRecord(row,{checkedAt}={}){
  const meetingId='switzerland-galop-'+row.date+'-'+row.racecourse_id.split('--').pop();
  const e=evidence(row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'switzerland',
    authority_id:GALOP_SUISSE_AUTHORITY_ID,racing_system_id:GALOP_SUISSE_SYSTEM_ID,
    racecourse_id:row.racecourse_id,date:row.date,timezone:SWISS_TIMEZONE,
    racing_type:'thoroughbred-flat',first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:GALOP_SUISSE_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'official_galop_suisse_current_calendar_html'},
    route_id:'galop-suisse-calendar',confidence:'high',review_status:'needs_review',
    notes:'Official Galop Suisse/IENA current pages confirm meeting date and physical venue. Event start context is not promoted to first-race post time.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:GALOP_SUISSE_SOURCE_ID,route_id:'galop-suisse-calendar',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e},
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
