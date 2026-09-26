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
  // Text-only fallback is retained for deterministic adapter tests. The live
  // PDF route uses parseSorocabaCalendarItems because PDF extraction emits
  // table columns out of reading order.
  const normalized=normalize(clean);
  const records=[];
  for(const monthName of MONTH_NAMES){
    const needle=normalize(monthName);
    const start=normalized.indexOf(needle);
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
      records.push({date:`${year}-${pad(MONTHS[monthName])}-${pad(day)}`,racecourse_id:BRAZIL_SOROCABA_RACECOURSE_ID,venue_name:'Jockey Club de Sorocaba',source_url:sourceUrl});
    }
  }
  return [...new Map(records.map(row=>[`${row.date}|${row.racecourse_id}`,row])).values()].sort((a,b)=>a.date.localeCompare(b.date));
}

function point(item){
  return {str:String(item?.str??'').replace(/\s+/g,' ').trim(),x:Number(item?.x??item?.transform?.[4]),y:Number(item?.y??item?.transform?.[5])};
}
export function parseSorocabaCalendarItems(items,{year=2026,sourceUrl=BRAZIL_SOROCABA_CALENDAR_URL}={}){
  const pts=(items??[]).map(point).filter(p=>p.str&&Number.isFinite(p.x)&&Number.isFinite(p.y));
  if(!pts.some(p=>/CALEND[ÁA]RIO/i.test(p.str))||!pts.some(p=>/JOCKEY CLUB DE SOROCABA/i.test(p.str))) throw new Error('Sorocaba 2026 calendar fingerprint missing');

  const months=pts.map(p=>({...p,key:normalize(p.str)})).filter(p=>MONTHS[p.key]);
  if(months.length<2) throw new Error('Sorocaba calendar month column missing');

  const weekdays=pts.filter(p=>/^(?:S[ÁA]BADO|DOMINGO|SEGUNDA(?:-FEIRA)?|TER[ÇC]A(?:-FEIRA)?|QUARTA(?:-FEIRA)?|QUINTA(?:-FEIRA)?|SEXTA(?:-FEIRA)?)$/i.test(p.str));
  const dayCandidates=pts.filter(p=>/^(?:0?[1-9]|[12]\d|3[01])$/.test(p.str));

  // A real race-date row has a weekday at essentially the same y coordinate.
  // This excludes distance/purse numbers elsewhere in the one-page table.
  const dated=dayCandidates.filter(day=>weekdays.some(w=>Math.abs(w.y-day.y)<=3.5));

  // Month names occupy merged cells centered vertically over their blocks.
  // Assign each dated row to the nearest month-cell center. For the current
  // PDF this reconstructs the table without depending on text extraction order.
  const records=[];
  for(const day of dated){
    const month=[...months].sort((a,b)=>Math.abs(a.y-day.y)-Math.abs(b.y-day.y))[0];
    if(!month) continue;
    const d=Number(day.str);
    records.push({
      date:`${year}-${pad(MONTHS[month.key])}-${pad(d)}`,
      racecourse_id:BRAZIL_SOROCABA_RACECOURSE_ID,
      venue_name:'Jockey Club de Sorocaba',
      source_url:sourceUrl,
    });
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
