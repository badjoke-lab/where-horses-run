import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';
export const BRAZIL_JCB_REUNIOES_URL = 'https://site.jcb.com.br/conteudo/Reunioes';
export const BRAZIL_JCB_SOURCE_ID = 'jcb-reunioes-weekly';

export const BRAZIL_VENUES = Object.freeze({
  gavea: {
    labels: ['gavea', 'gávea'],
    racecourse_id: 'brazil--hipodromo-da-gavea',
    authority_id: 'jockey-club-brasileiro',
    racing_system_id: 'brazil-gavea-system',
    venue_name: 'Hipódromo da Gávea',
  },
  cristal: {
    labels: ['cristal rs', 'cristal'],
    racecourse_id: 'brazil--hipodromo-do-cristal',
    authority_id: 'jockey-club-do-rio-grande-do-sul',
    racing_system_id: 'brazil-cristal-system',
    venue_name: 'Hipódromo do Cristal',
  },
});

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}
export function visibleText(html) {
  return decodeHtml(String(html ?? ''))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function norm(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}
function iso(d,m,y){ return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }

export function parseJcbReunioes(html,{sourceUrl=BRAZIL_JCB_REUNIOES_URL}={}) {
  if(typeof html!=='string'||!html.trim()) throw new Error('Brazil JCB reunioes HTML must be non-empty');
  const text=visibleText(html);
  if(!/REUNI[ÕO]ES/i.test(text)||!/Hip[oó]dromo/i.test(text)) throw new Error('Brazil JCB reunioes fingerprint missing');
  const rx=/(\d{2})\/(\d{2})\/(20\d{2})\s+[^\d]{2,40}\s+(\d{3,5})\s+([A-Za-zÁÉÍÓÚÃÕÇáéíóúãõç ]{3,40}?)(?=\s+(?:-|Baixar|Ver Reunião))/giu;
  const rows=[];
  for(const m of text.matchAll(rx)){
    const venueRaw=m[5].replace(/\s+/g,' ').trim();
    const nv=norm(venueRaw);
    const venue=Object.values(BRAZIL_VENUES).find(v=>v.labels.some(label=>nv===norm(label)));
    if(!venue) continue;
    rows.push({
      date:iso(Number(m[1]),Number(m[2]),Number(m[3])),
      meeting_number:m[4],
      venue_raw:venueRaw,
      source_url:sourceUrl,
      ...venue,
    });
  }
  const unique=new Map();
  for(const row of rows) unique.set(`${row.date}|${row.racecourse_id}`,row);
  return [...unique.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.racecourse_id.localeCompare(b.racecourse_id));
}

function evidence(url,checkedAt){
  return {source_id:BRAZIL_JCB_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};
}
export function buildBrazilJcbMeetingRecord(row,{checkedAt}={}){
  const slug=row.racecourse_id==='brazil--hipodromo-da-gavea'?'gavea':'cristal';
  const meetingId=`brazil-${slug}-${row.date}`;
  const e=evidence(row.source_url??BRAZIL_JCB_REUNIOES_URL,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'brazil',
    authority_id:row.authority_id,racing_system_id:row.racing_system_id,racecourse_id:row.racecourse_id,
    date:row.date,timezone:BRAZIL_TIMEZONE,first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:BRAZIL_JCB_SOURCE_ID,official_url:row.source_url??BRAZIL_JCB_REUNIOES_URL,checked_at:checkedAt,extraction_method:'jcb_reunioes_weekly_html'},
    route_id:'jcb-reunioes-weekly-html',confidence:'high',review_status:'needs_review',
    notes:'Jockey Club Brasileiro Reuniões page confirms meeting date and physical racecourse. JCB acts as the publication/distribution source; operator/authority identity remains venue-specific. Programme-derived race times are not inferred by this rank-C route.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url??BRAZIL_JCB_REUNIOES_URL},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:BRAZIL_JCB_SOURCE_ID,route_id:'jcb-reunioes-weekly-html',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e},
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
