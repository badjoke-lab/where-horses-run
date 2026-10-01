import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const SWISS_TIMEZONE='Europe/Zurich';
export const SUISSE_TROT_AUTHORITY_ID='suisse-trot';
export const SUISSE_TROT_SYSTEM_ID='switzerland-suisse-trot-system';
export const SUISSE_TROT_SOURCE_ID='suisse-trot-calendar';
export const SUISSE_TROT_URL='https://suisse-trot.ch/calendrier/';

const VENUES=Object.freeze({
  avenches:{racecourse_id:'switzerland--iena-avenches',venue_name:'IENA Avenches'},
  maienfeld:{racecourse_id:'switzerland--rossriet-maienfeld',venue_name:'Rossriet Maienfeld'},
  'zürich-dielsdorf':{racecourse_id:'switzerland--zurich-dielsdorf',venue_name:'Zürich-Dielsdorf'},
  zurich:{racecourse_id:'switzerland--zurich-dielsdorf',venue_name:'Zürich-Dielsdorf'},
});
const MONTHS=Object.freeze({
  janvier:'01',février:'02',fevrier:'02',mars:'03',avril:'04',mai:'05',juin:'06',juillet:'07',août:'08',aout:'08',
  septembre:'09',octobre:'10',novembre:'11',décembre:'12',decembre:'12'
});
function decodeHtml(v){return String(v??'').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#x([0-9a-f]+);/gi,(_,c)=>String.fromCodePoint(Number.parseInt(c,16))).replace(/&#(\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));}
export function visibleText(html){return decodeHtml(String(html??'')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
function norm(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();}
function pad(v){return String(Number(v)).padStart(2,'0');}

export function parseSuisseTrotCalendarHtml(html,{sourceUrl=SUISSE_TROT_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('Suisse Trot calendar HTML must be non-empty');
  const text=visibleText(html);
  if(!/CALENDRIER 2026|CALENDRIER\s+2026/i.test(text)) throw new Error('Suisse Trot 2026 calendar fingerprint missing');
  const rows=[];
  const rx=/([A-Za-zÀ-ÿ' -]+)\s*[–—-]\s*(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(20\d{2})/g;
  for(const m of text.matchAll(rx)){
    const venueLabel=m[1].trim().replace(/^#+\s*/,'');
    const key=norm(venueLabel).replace('zurich-dielsdorf','zürich-dielsdorf');
    const venue=VENUES[key]??VENUES[norm(venueLabel)];
    const month=MONTHS[norm(m[3])];
    if(!month||!venue) continue;
    rows.push({
      date:m[4]+'-'+month+'-'+pad(m[2]),
      racecourse_id:venue.racecourse_id,
      venue_name:venue.venue_name,
      source_venue_label:venueLabel,
      source_url:sourceUrl
    });
  }
  const out=[...new Map(rows.map(r=>[r.date+'|'+r.racecourse_id,r])).values()].sort((a,b)=>a.date.localeCompare(b.date)||a.racecourse_id.localeCompare(b.racecourse_id));
  if(!out.length) throw new Error('Suisse Trot meeting rows missing');
  return out;
}

function evidence(url,checkedAt){return {source_id:SUISSE_TROT_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};}
export function buildSuisseTrotRecord(row,{checkedAt}={}){
  const meetingId='switzerland-trot-'+row.date+'-'+row.racecourse_id.split('--').pop();
  const e=evidence(row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'switzerland',
    authority_id:SUISSE_TROT_AUTHORITY_ID,racing_system_id:SUISSE_TROT_SYSTEM_ID,
    racecourse_id:row.racecourse_id,date:row.date,timezone:SWISS_TIMEZONE,
    racing_type:'harness-racing',first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:SUISSE_TROT_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'official_suisse_trot_calendar_html'},
    route_id:'suisse-trot-calendar',confidence:'high',review_status:'needs_review',
    notes:'Official Suisse Trot calendar confirms meeting date and physical venue. Published event start context is not promoted to first-race post time.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:SUISSE_TROT_SOURCE_ID,route_id:'suisse-trot-calendar',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e},
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
