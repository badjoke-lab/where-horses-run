import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const PUERTO_RICO_TIMEZONE='America/Puerto_Rico';
export const PUERTO_RICO_AUTHORITY_ID='hipodromo-camarero';
export const PUERTO_RICO_SYSTEM_ID='puerto-rico-camarero-entries-system';
export const PUERTO_RICO_SOURCE_ID='camarero-inscripciones';
export const PUERTO_RICO_SOURCE_URL='https://www.hipodromo-camarero.com/carreras/inscripciones';
export const PUERTO_RICO_RACECOURSE_ID='puerto-rico--hipodromo-camarero';

const MONTHS=Object.freeze({
  enero:1,febrero:2,marzo:3,abril:4,mayo:5,junio:6,julio:7,agosto:8,
  septiembre:9,setiembre:9,octubre:10,noviembre:11,diciembre:12
});

function decodeHtml(v){
  return String(v??'')
    .replace(/&nbsp;|&#160;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/&#x([0-9a-f]+);/gi,(_,c)=>String.fromCodePoint(Number.parseInt(c,16)))
    .replace(/&#(\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));
}
export function visibleText(html){
  return decodeHtml(String(html??''))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function pad(v){return String(Number(v)).padStart(2,'0');}

export function parseCamareroEntriesPage(html,{sourceUrl=PUERTO_RICO_SOURCE_URL,allowEmpty=false}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('Camarero entries HTML must be non-empty');
  const text=visibleText(html);
  if(!/Inscripciones\s+Oficiales/i.test(text)||!/Hip[oó]dromo\s+Camarero/i.test(text)){
    throw new Error('Camarero entries page fingerprint missing');
  }
  const rx=/Inscripci[oó]n\s+(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo),\s*(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+de\s+(20\d{2})/giu;
  const rows=[];
  for(const m of text.matchAll(rx)){
    const month=MONTHS[m[2].toLocaleLowerCase('es-PR')];
    if(!month) continue;
    rows.push({
      date:m[3]+'-'+pad(month)+'-'+pad(m[1]),
      racecourse_id:PUERTO_RICO_RACECOURSE_ID,
      venue_name:'Hipódromo Camarero',
      source_url:sourceUrl
    });
  }
  const out=[...new Map(rows.map(r=>[r.date+'|'+r.racecourse_id,r])).values()]
    .sort((a,b)=>a.date.localeCompare(b.date));
  if(!out.length&&!allowEmpty) throw new Error('Camarero official entry dates missing');
  return out;
}

function evidence(url,checkedAt){
  return {
    source_id:PUERTO_RICO_SOURCE_ID,
    official_source_url:url,
    observed_at:checkedAt,
    successfully_verified_at:checkedAt,
    acquisition_method:'automatic'
  };
}

export function buildCamareroMeetingRecord(row,{checkedAt}={}){
  const meetingId='puerto-rico-camarero-'+row.date;
  const e=evidence(row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,
    meeting_id:meetingId,
    country_id:'puerto-rico',
    authority_id:PUERTO_RICO_AUTHORITY_ID,
    racing_system_id:PUERTO_RICO_SYSTEM_ID,
    racecourse_id:PUERTO_RICO_RACECOURSE_ID,
    date:row.date,
    timezone:PUERTO_RICO_TIMEZONE,
    racing_type:'thoroughbred-flat',
    first_race_time_local:null,
    last_race_time_local:null,
    timetable_rows:[],
    source:{
      source_id:PUERTO_RICO_SOURCE_ID,
      official_url:row.source_url,
      checked_at:checkedAt,
      extraction_method:'official_camarero_entries'
    },
    route_id:'puerto-rico-camarero-inscripciones',
    confidence:'high',
    review_status:'needs_review',
    notes:'Official Hipódromo Camarero Inscripciones confirms a forthcoming local race day at the mapped physical venue. The automatic route publishes meeting date plus venue only at C. Reviewed A-capability programme evidence remains separate; programme PDFs mix local and simulcast post times and are not automatically promoted here.',
    detail_observation:{
      status:'not_applicable',
      evaluated_capability_rank:'C',
      race_count:0,
      calendar_url:row.source_url
    },
    acquisition_attempt:{
      attempted_at:checkedAt,
      status:'success',
      source_id:PUERTO_RICO_SOURCE_ID,
      route_id:'puerto-rico-camarero-inscripciones',
      error_code:null
    },
    evidence_support:{
      meeting_identity:e,
      meeting_date:e
    }
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
