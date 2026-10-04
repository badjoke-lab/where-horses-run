import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const PUERTO_RICO_TIMEZONE='America/Puerto_Rico';
export const PUERTO_RICO_AUTHORITY_ID='hipodromo-camarero';
export const PUERTO_RICO_SYSTEM_ID='puerto-rico-reviewed-system';
export const PUERTO_RICO_SOURCE_ID='camarero-inscripciones';
export const PUERTO_RICO_DETAIL_SOURCE_ID='camarero-programmes';
export const PUERTO_RICO_RACECOURSE_ID='puerto-rico--hipodromo-camarero';
export const PUERTO_RICO_SOURCE_URL='https://www.hipodromo-camarero.com/carreras/inscripciones';
export const PUERTO_RICO_PROGRAMMES_URL='https://www.hipodromo-camarero.com/carreras/programas';

const MONTHS=Object.freeze({enero:'01',febrero:'02',marzo:'03',abril:'04',mayo:'05',junio:'06',julio:'07',agosto:'08',septiembre:'09',octubre:'10',noviembre:'11',diciembre:'12'});
function decodeHtml(v){return String(v??'').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&aacute;/gi,'á').replace(/&eacute;/gi,'é').replace(/&iacute;/gi,'í').replace(/&oacute;/gi,'ó').replace(/&uacute;/gi,'ú').replace(/&ntilde;/gi,'ñ').replace(/&#x([0-9a-f]+);/gi,(_,c)=>String.fromCodePoint(Number.parseInt(c,16))).replace(/&#(\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));}
export function visibleText(html){return decodeHtml(String(html??'')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
const pad=v=>String(Number(v)).padStart(2,'0');

export function parseCamareroInscripcionesPage(html,{sourceUrl=PUERTO_RICO_SOURCE_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('Camarero inscriptions HTML must be non-empty');
  const text=visibleText(html);
  if(!/Inscripciones\s+Oficiales/i.test(text)) throw new Error('Camarero official inscriptions fingerprint missing');
  const rows=[];
  const rx=/Inscripci(?:ó|o)n\s+(?:lunes|martes|mi(?:é|e)rcoles|jueves|viernes|s(?:á|a)bado|domingo),\s*(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(20\d{2})/giu;
  for(const m of text.matchAll(rx)){
    rows.push({date:m[3]+'-'+MONTHS[m[2].toLowerCase()]+'-'+pad(m[1]),racecourse_id:PUERTO_RICO_RACECOURSE_ID,venue_name:'Hipódromo Camarero',source_url:sourceUrl});
  }
  return [...new Map(rows.map(r=>[r.date,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
}
function evidence(url,checkedAt){return {source_id:PUERTO_RICO_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};}
export function buildPuertoRicoMeetingRecord(row,{checkedAt}={}){
  const meetingId='puerto-rico-camarero-'+row.date,e=evidence(row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'puerto-rico',
    authority_id:PUERTO_RICO_AUTHORITY_ID,racing_system_id:PUERTO_RICO_SYSTEM_ID,
    racecourse_id:PUERTO_RICO_RACECOURSE_ID,date:row.date,timezone:PUERTO_RICO_TIMEZONE,
    racing_type:'thoroughbred-flat',first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:PUERTO_RICO_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'official_camarero_inscripciones'},
    route_id:'camarero-inscripciones-official-window',confidence:'high',review_status:'needs_review',
    notes:'Official Hipódromo Camarero inscriptions page confirms a source-visible local meeting date at the fixed physical venue. Automatic publication remains rank C; programme-level post times are a separate reviewed capability and are not inferred here.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:PUERTO_RICO_SOURCE_ID,route_id:'camarero-inscripciones-official-window',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e}
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
