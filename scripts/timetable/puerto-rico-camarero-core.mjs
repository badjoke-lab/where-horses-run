import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const PR_TIMEZONE='America/Puerto_Rico';
export const PR_AUTHORITY_ID='hipodromo-camarero';
export const PR_SYSTEM_ID='puerto-rico-camarero-inscripciones-system';
export const PR_SOURCE_ID='camarero-inscripciones';
export const PR_RACECOURSE_ID='puerto-rico--hipodromo-camarero';
export const PR_INSCRIPCIONES_URL='https://www.hipodromo-camarero.com/carreras/inscripciones';

const MONTHS=Object.freeze({
  enero:'01',febrero:'02',marzo:'03',abril:'04',mayo:'05',junio:'06',
  julio:'07',agosto:'08',septiembre:'09',setiembre:'09',octubre:'10',noviembre:'11',diciembre:'12'
});
function decodeHtml(v){return String(v??'').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#x([0-9a-f]+);/gi,(_,c)=>String.fromCodePoint(Number.parseInt(c,16))).replace(/&#(\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));}
export function visibleText(html){return decodeHtml(String(html??'')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
function normalize(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();}
function pad(v){return String(Number(v)).padStart(2,'0');}

export function parseCamareroInscripcionesHtml(html,{sourceUrl=PR_INSCRIPCIONES_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('Camarero inscripciones HTML must be non-empty');
  const text=visibleText(html);
  if(!/Inscripciones\s+Oficiales/i.test(text)) throw new Error('Camarero inscripciones fingerprint missing');
  const rows=[];
  const rx=/(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo),?\s+(\d{1,2})\s+de\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)\s+de\s+(20\d{2})/giu;
  for(const m of text.matchAll(rx)){
    const month=MONTHS[normalize(m[2])];
    if(!month) continue;
    rows.push({
      date:m[3]+'-'+month+'-'+pad(m[1]),
      racecourse_id:PR_RACECOURSE_ID,
      venue_name:'Hipódromo Camarero',
      source_url:sourceUrl
    });
  }
  const out=[...new Map(rows.map(r=>[r.date,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
  if(!out.length) throw new Error('Camarero official registration dates missing');
  return out;
}

function evidence(url,checkedAt){return {source_id:PR_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};}
export function buildCamareroMeetingRecord(row,{checkedAt}={}){
  const meetingId='puerto-rico-camarero-'+row.date;
  const e=evidence(row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'puerto-rico',
    authority_id:PR_AUTHORITY_ID,racing_system_id:PR_SYSTEM_ID,
    racecourse_id:PR_RACECOURSE_ID,date:row.date,timezone:PR_TIMEZONE,
    racing_type:'horse-racing',first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:PR_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'official_camarero_inscripciones_html'},
    route_id:'camarero-inscripciones',confidence:'high',review_status:'needs_review',
    notes:'Official Camarero Inscripciones page confirms a source-visible upcoming race-day date at Hipódromo Camarero. Registrations are preliminary and subject to change, so this automatic route publishes date plus venue at rank C only. Separate official race programmes retain richer reviewed A-capability post-time evidence.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:PR_SOURCE_ID,route_id:'camarero-inscripciones',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e}
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
