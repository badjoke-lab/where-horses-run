import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';
export const BRAZIL_SOURCE_ID = 'jcb-current-meetings';
export const BRAZIL_SOURCE_URL = 'https://site.jcb.com.br/conteudo/Reunioes?cn=BNL&cp=BNL_site';
export const BRAZIL_RACEDAY_URL = (date) => `https://apostas.jcb.com.br/pt-br/raceday?dia=${date}`;

export const BRAZIL_SYSTEMS = Object.freeze({
  gavea: {
    authority_id: 'jockey-club-brasileiro',
    source_id: 'jcb-current-meetings-gavea',
    detail_source_id: 'jcb-raceday-gavea',
    racing_system_id: 'brazil-gavea-system',
    racecourse_id: 'brazil--hipodromo-da-gavea',
    venue_name: 'Hipódromo da Gávea',
    source_venue_tokens: ['Gavea', 'Gávea'],
  },
  cristal: {
    authority_id: 'jockey-club-do-rio-grande-do-sul',
    source_id: 'jcb-current-meetings-cristal',
    detail_source_id: 'jcb-raceday-cristal',
    racing_system_id: 'brazil-cristal-system',
    racecourse_id: 'brazil--hipodromo-do-cristal',
    venue_name: 'Hipódromo do Cristal',
    source_venue_tokens: ['Cristal RS', 'Cristal'],
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

export function visibleText(value) {
  return decodeHtml(String(value ?? ''))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pad(value) { return String(value).padStart(2, '0'); }

function isoDateFromBr(value) {
  const match=String(value ?? '').match(/\b(\d{2})\/(\d{2})\/(20\d{2})\b/);
  if(!match) return null;
  return `${match[3]}-${pad(match[2])}-${pad(match[1])}`;
}

function normalize(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
}

export function resolveBrazilJcbVenue(value) {
  const text=normalize(value);
  if(/\bgavea\b/.test(text)) return {key:'gavea',...BRAZIL_SYSTEMS.gavea};
  if(/\bcristal(?:\s+rs)?\b/.test(text)) return {key:'cristal',...BRAZIL_SYSTEMS.cristal};
  if(/cidade\s+jardim/.test(text)) return {key:'unrouted',source_venue:'Cidade Jardim'};
  if(/sorocaba/.test(text)) return {key:'unrouted',source_venue:'Sorocaba'};
  if(/taruma/.test(text)) return {key:'unrouted',source_venue:'Tarumã'};
  return null;
}

function extractRows(html) {
  const source=String(html ?? '');
  const rows=[];
  for(const match of source.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
    const text=visibleText(match[1]);
    if(/\b\d{2}\/\d{2}\/20\d{2}\b/.test(text)) rows.push(text);
  }
  if(rows.length) return rows;

  const text=visibleText(source);
  const starts=[...text.matchAll(/\b\d{2}\/\d{2}\/20\d{2}\b/g)].map(m=>m.index);
  return starts.map((start,index)=>text.slice(start,starts[index+1] ?? Math.min(text.length,start+300)));
}

export function parseBrazilJcbCurrentMeetings(html,{sourceUrl=BRAZIL_SOURCE_URL}={}) {
  if(typeof html!=='string'||!html.trim()) throw new Error('Brazil JCB current meetings HTML must be non-empty');
  const pageText=visibleText(html);
  if(!/REUNI[ÕO]ES/i.test(pageText)) throw new Error('Brazil JCB meetings fingerprint missing');

  const records=[];
  const source_warnings=[];
  for(const rowText of extractRows(html)){
    const date=isoDateFromBr(rowText);
    if(!date) continue;
    const resolved=resolveBrazilJcbVenue(rowText);
    if(!resolved) {
      source_warnings.push({code:'unresolved_source_venue',date,row_text:rowText.slice(0,220)});
      continue;
    }
    const withoutDate=rowText.replace(/\b\d{2}\/\d{2}\/20\d{2}\b/,' ');
    const meetingNo=(withoutDate.match(/\b\d{3,4}\b/)||[])[0] ?? null;
    if(resolved.key==='unrouted'){
      source_warnings.push({code:'recognized_but_unrouted_venue',date,source_venue:resolved.source_venue,meeting_no:meetingNo});
      continue;
    }
    records.push({
      date,
      system_key:resolved.key,
      authority_id:resolved.authority_id,
      source_id:resolved.source_id,
      racing_system_id:resolved.racing_system_id,
      racecourse_id:resolved.racecourse_id,
      venue_name:resolved.venue_name,
      meeting_no:meetingNo,
      source_url:sourceUrl,
    });
  }
  const unique=new Map();
  for(const row of records) unique.set(`${row.date}|${row.racing_system_id}|${row.racecourse_id}`,row);
  return {
    records:[...unique.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.racecourse_id.localeCompare(b.racecourse_id)),
    source_warnings,
  };
}


function stripRaceTypeSuffix(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/\s+(?:Normal\b|Não\s+Disponível\b|Claiming\b|Grupo\s+[123]\b|Listed\b|Prova\s+Especial\b)/i)[0]
    .trim();
}

export function parseBrazilJcbRaceday(html, { expectedSystemKey, expectedDate, sourceUrl } = {}) {
  if (typeof html !== 'string' || !html.trim()) {
    return { status: 'source_error', rows: [], detail_url: sourceUrl ?? null, reason: 'empty_html' };
  }
  const text = visibleText(html);
  const heading = text.match(/Reuni[aã]o\s+(\d{3,4})\s*-\s*([^\-]+?)\s*-\s*(\d{2}\/\d{2}\/20\d{2})/i);
  if (!heading) {
    return { status: 'not_published', rows: [], detail_url: sourceUrl ?? null, reason: 'meeting_heading_missing' };
  }

  const resolved = resolveBrazilJcbVenue(heading[2]);
  const headingDate = isoDateFromBr(heading[3]);
  if (!resolved || resolved.key === 'unrouted' || resolved.key !== expectedSystemKey || (expectedDate && headingDate !== expectedDate)) {
    return {
      status: 'not_published',
      rows: [],
      detail_url: sourceUrl ?? null,
      reason: 'meeting_identity_mismatch',
      observed_venue: heading[2].trim(),
      observed_date: headingDate,
    };
  }

  const rows = [];
  const raceRegex = /P[aá]reo\s+(\d{1,2})\s+(\d{2}:\d{2})\s+([\s\S]*?)\s+(\d{1,2}(?:\.\d{3})?)m\s+(Areia|Grama)\s+([A-Za-zÀ-ÿ]+)/giu;
  for (const match of text.matchAll(raceRegex)) {
    const number = Number(match[1]);
    const distance = Number(match[4].replace('.', ''));
    if (!Number.isInteger(number) || !Number.isInteger(distance) || distance <= 0) continue;
    const raceName = stripRaceTypeSuffix(match[3]) || `Páreo ${number}`;
    rows.push({
      label: `Race ${number}`,
      race_number: number,
      post_time_local: match[2],
      race_name: raceName,
      distance_m: distance,
      surface: normalize(match[5]) === 'areia' ? 'dirt' : 'turf',
      course_label: match[6],
    });
  }
  rows.sort((a, b) => a.race_number - b.race_number);
  if (!rows.length) {
    return {
      status: 'parser_failure',
      rows: [],
      detail_url: sourceUrl ?? null,
      reason: 'race_rows_missing',
      meeting_no: heading[1],
    };
  }
  const continuous = rows.every((row, index) => row.race_number === index + 1);
  if (!continuous) {
    return {
      status: 'parser_failure',
      rows: [],
      detail_url: sourceUrl ?? null,
      reason: 'race_rows_non_contiguous',
      meeting_no: heading[1],
    };
  }
  return {
    status: 'available',
    rows,
    detail_url: sourceUrl ?? null,
    meeting_no: heading[1],
    evaluated_capability_rank: 'A+',
  };
}

function evidence(sourceId,url,checkedAt){
  return {
    source_id:sourceId,
    official_source_url:url,
    observed_at:checkedAt,
    successfully_verified_at:checkedAt,
    acquisition_method:'automatic',
  };
}

export function buildBrazilJcbMeetingRecord(row,{checkedAt,detail=null}={}){
  if(!['gavea','cristal'].includes(row.system_key)) throw new Error(`Unsupported Brazil JCB system key: ${row.system_key}`);
  const e=evidence(row.source_id,row.source_url ?? BRAZIL_SOURCE_URL,checkedAt);
  const detailUrl=detail?.detail_url ?? BRAZIL_RACEDAY_URL(row.date);
  const detailEvidence=evidence(BRAZIL_SYSTEMS[row.system_key].detail_source_id,detailUrl,checkedAt);
  const timetableRows=detail?.status==='available' ? detail.rows : [];
  const meetingId=`brazil-${row.system_key}-${row.date}`;
  const record={
    candidate_id:meetingId,
    meeting_id:meetingId,
    country_id:'brazil',
    authority_id:row.authority_id,
    racing_system_id:row.racing_system_id,
    racecourse_id:row.racecourse_id,
    date:row.date,
    timezone:BRAZIL_TIMEZONE,
    first_race_time_local:timetableRows[0]?.post_time_local ?? null,
    last_race_time_local:timetableRows.at(-1)?.post_time_local ?? null,
    timetable_rows:timetableRows,
    source:{
      source_id:row.source_id,
      official_url:row.source_url ?? BRAZIL_SOURCE_URL,
      checked_at:checkedAt,
      extraction_method:'official_jcb_current_meetings_html',
    },
    route_id:'jcb-current-meetings-html',
    confidence:'high',
    review_status:'needs_review',
    notes:`Official Jockey Club Brasileiro current-meetings observation for ${row.venue_name}. When the matching JCB Raceday page is available, race times and normalized race metadata are acquired from that official detail page; otherwise the meeting remains at the safe schedule rank.`,
    detail_observation:{
      status:detail?.status ?? 'not_published',
      evaluated_capability_rank:detail?.evaluated_capability_rank ?? 'A+',
      race_count:timetableRows.length,
      meeting_no:detail?.meeting_no ?? row.meeting_no,
      detail_url:detailUrl,
      source_visible_horizon:true,
    },
    acquisition_attempt:{
      attempted_at:checkedAt,
      status:'success',
      source_id:row.source_id,
      route_id:'jcb-current-meetings-html',
      error_code:null,
    },
    evidence_support:{
      meeting_identity:e,
      meeting_date:e,
      ...(timetableRows.length ? {
        race_times:detailEvidence,
        timetable:detailEvidence,
        race_names:detailEvidence,
        distances:detailEvidence,
        surfaces:detailEvidence,
        courses:detailEvidence,
      } : {}),
    },
  };
  const capability_rank=deriveBestAvailableRank(record,timetableRows);
  record.acquisition_completion=classifyAcquisitionCompletion(
    {...record,capability_rank},
    {technical_capability_rank:'A+'},
  );
  return {...record,capability_rank};
}
