import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const MEXICO_TIMEZONE = 'America/Mexico_City';
export const MEXICO_AUTHORITY_ID = 'hipodromo-de-las-americas';
export const MEXICO_SYSTEM_ID = 'mexico-hipodromo-las-americas-system';
export const MEXICO_SOURCE_ID = 'hipodromo-programas-oficiales';
export const MEXICO_RACECOURSE_ID = 'mexico--hipodromo-de-las-americas';
export const MEXICO_PROGRAMAS_URL = 'https://www.hipodromo.com.mx/desktop/index.php/carreras/programas';

const MONTHS = Object.freeze({
  enero:1,febrero:2,marzo:3,abril:4,mayo:5,junio:6,julio:7,agosto:8,
  septiembre:9,setiembre:9,octubre:10,noviembre:11,diciembre:12,
});

function decodeHtml(value){
  return String(value??'')
    .replace(/&nbsp;|&#160;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/&#x([0-9a-f]+);/gi,(_,code)=>String.fromCodePoint(Number.parseInt(code,16)))
    .replace(/&#(\d+);/g,(_,code)=>String.fromCodePoint(Number(code)));
}
export function visibleText(html){
  return decodeHtml(String(html??''))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function norm(value){
  return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
}
function iso(day,month,year){
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

export function parseMexicoProgramasPage(html,{sourceUrl=MEXICO_PROGRAMAS_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('Mexico Programas HTML must be non-empty');
  const text=visibleText(html);
  if(!/Programas/i.test(text)||!/Programa\s+de\s+la\s+Funci[oó]n/i.test(text)){
    throw new Error('Mexico official Programas fingerprint missing');
  }
  const rx=/Programa\s+de\s+la\s+Funci[oó]n\s+del\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+\s+(\d{1,2})\s+de\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)(?:\s+del?)?\s+(20\d{2})/giu;
  const rows=[];
  for(const m of text.matchAll(rx)){
    const month=MONTHS[norm(m[2])];
    const day=Number(m[1]);
    const year=Number(m[3]);
    if(!month||!Number.isInteger(day)||day<1||day>31) continue;
    rows.push({
      date:iso(day,month,year),
      racecourse_id:MEXICO_RACECOURSE_ID,
      venue_name:'Hipódromo de las Américas',
      source_title:m[0],
      source_url:sourceUrl,
    });
  }
  const unique=new Map();
  for(const row of rows) unique.set(`${row.date}|${row.racecourse_id}`,row);
  return [...unique.values()].sort((a,b)=>a.date.localeCompare(b.date));
}

function evidence(url,checkedAt){
  return {
    source_id:MEXICO_SOURCE_ID,
    official_source_url:url,
    observed_at:checkedAt,
    successfully_verified_at:checkedAt,
    acquisition_method:'automatic',
  };
}

export function buildMexicoMeetingRecord(row,{checkedAt}={}){
  const meetingId=`mexico-americas-${row.date}`;
  const e=evidence(row.source_url??MEXICO_PROGRAMAS_URL,checkedAt);
  const record={
    candidate_id:meetingId,
    meeting_id:meetingId,
    country_id:'mexico',
    authority_id:MEXICO_AUTHORITY_ID,
    racing_system_id:MEXICO_SYSTEM_ID,
    racecourse_id:MEXICO_RACECOURSE_ID,
    date:row.date,
    timezone:MEXICO_TIMEZONE,
    first_race_time_local:null,
    last_race_time_local:null,
    timetable_rows:[],
    source:{
      source_id:MEXICO_SOURCE_ID,
      official_url:row.source_url??MEXICO_PROGRAMAS_URL,
      checked_at:checkedAt,
      extraction_method:'official_programas_calendar_html',
    },
    route_id:'hipodromo-americas-programas-html',
    confidence:'high',
    review_status:'needs_review',
    notes:'Official Hipódromo de las Américas Programas page confirms a published race meeting date at the single physical racecourse. This rank-C route does not infer first/last post times or future meetings that have not yet received an official programme.',
    detail_observation:{
      status:'not_applicable',
      evaluated_capability_rank:'C',
      race_count:0,
      calendar_url:row.source_url??MEXICO_PROGRAMAS_URL,
    },
    acquisition_attempt:{
      attempted_at:checkedAt,
      status:'success',
      source_id:MEXICO_SOURCE_ID,
      route_id:'hipodromo-americas-programas-html',
      error_code:null,
    },
    evidence_support:{meeting_identity:e,meeting_date:e},
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion(
    {...record,capability_rank},
    {technical_capability_rank:'C'},
  );
  return {...record,capability_rank};
}
