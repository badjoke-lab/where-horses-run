import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const BRAZIL_SOROCABA_TIMEZONE = 'America/Sao_Paulo';
export const BRAZIL_SOROCABA_AUTHORITY_ID = 'jockey-club-de-sorocaba';
export const BRAZIL_SOROCABA_SYSTEM_ID = 'brazil-sorocaba-system';
export const BRAZIL_SOROCABA_SOURCE_ID = 'sorocaba-calendar-2026';
export const BRAZIL_SOROCABA_RACECOURSE_ID = 'brazil--jockey-club-de-sorocaba';
export const BRAZIL_SOROCABA_CALENDAR_URL = 'https://jcsorocaba.com.br/wp-content/uploads/2025/12/CALENDARIO-JCS-2026.pdf';

const MONTHS = Object.freeze({
  janeiro:1, fevereiro:2, marco:3, março:3, abril:4, maio:5, junho:6,
  julho:7, agosto:8, setembro:9, outubro:10, novembro:11, dezembro:12,
});
const MONTH_NAMES = Object.keys(MONTHS).sort((a,b)=>b.length-a.length);
function normalize(value){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();}
function pad(value){return String(value).padStart(2,'0');}

export function parseSorocabaCalendarText(text,{year=2026,sourceUrl=BRAZIL_SOROCABA_CALENDAR_URL}={}){
  const clean=String(text??'').replace(/\s+/g,' ').trim();
  if(!/CALEND[ÁA]RIO\s+2026/i.test(clean)) throw new Error('Sorocaba 2026 calendar fingerprint missing');
  const normalized=normalize(clean);
  const records=[];
  for(let i=0;i<MONTH_NAMES.length;i+=1){
    const monthName=MONTH_NAMES[i];
    const needle=normalize(monthName);
    let start=normalized.indexOf(needle);
    if(start<0) continue;
    let end=normalized.length;
    for(const other of MONTH_NAMES){
      const pos=normalized.indexOf(normalize(other),start+needle.length);
      if(pos>=0&&pos<end) end=pos;
    }
    const segment=normalized.slice(start,end);
    const weekdayPattern='(?:segunda(?:-feira)?|terca(?:-feira)?|quarta(?:-feira)?|quinta(?:-feira)?|sexta(?:-feira)?|sabado|domingo)';
    const rx=new RegExp('(?:^|\\s)([1-9]|[12]\\d|3[01])\\s+'+weekdayPattern+'\\b','g');
    for(const match of segment.matchAll(rx)){
      const day=Number(match[1]);
      records.push({
        date:`${year}-${pad(MONTHS[monthName])}-${pad(day)}`,
        racecourse_id:BRAZIL_SOROCABA_RACECOURSE_ID,
        venue_name:'Jockey Club de Sorocaba',
        source_url:sourceUrl,
      });
    }
  }
  const unique=new Map(records.map(row=>[`${row.date}|${row.racecourse_id}`,row]));
  return [...unique.values()].sort((a,b)=>a.date.localeCompare(b.date));
}

function evidence(url,checkedAt){return {source_id:BRAZIL_SOROCABA_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};}
export function buildSorocabaMeetingRecord(row,{checkedAt}={}){
  const meetingId=`brazil-sorocaba-${row.date}`;
  const e=evidence(row.source_url??BRAZIL_SOROCABA_CALENDAR_URL,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'brazil',
    authority_id:BRAZIL_SOROCABA_AUTHORITY_ID,racing_system_id:BRAZIL_SOROCABA_SYSTEM_ID,racecourse_id:BRAZIL_SOROCABA_RACECOURSE_ID,
    date:row.date,timezone:BRAZIL_SOROCABA_TIMEZONE,first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:BRAZIL_SOROCABA_SOURCE_ID,official_url:row.source_url??BRAZIL_SOROCABA_CALENDAR_URL,checked_at:checkedAt,extraction_method:'official_annual_calendar_pdf'},
    route_id:'sorocaba-calendar-2026-pdf',confidence:'high',review_status:'needs_review',
    notes:'Official Jockey Club de Sorocaba annual calendar observation. This route establishes meeting date and the Sorocaba physical racecourse only. Race times from separate programme material are not inferred by this rank-C route.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url??BRAZIL_SOROCABA_CALENDAR_URL},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:BRAZIL_SOROCABA_SOURCE_ID,route_id:'sorocaba-calendar-2026-pdf',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e},
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
