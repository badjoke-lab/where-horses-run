import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const BRAZIL_CJ_TIMEZONE = 'America/Sao_Paulo';
export const BRAZIL_CJ_AUTHORITY_ID = 'jockey-club-de-sao-paulo';
export const BRAZIL_CJ_SYSTEM_ID = 'brazil-cidade-jardim-system';
export const BRAZIL_CJ_SOURCE_ID = 'cidade-jardim-projeto-inscricoes';
export const BRAZIL_CJ_RACECOURSE_ID = 'brazil--hipodromo-de-cidade-jardim';
export const BRAZIL_CJ_INDEX_URL = 'https://www.jockeysp.com.br/corridas/projetodeinscricoes.asp';

const MONTHS = Object.freeze({
  janeiro:1, fevereiro:2, marco:3, março:3, abril:4, maio:5, junho:6,
  julho:7, agosto:8, setembro:9, outubro:10, novembro:11, dezembro:12,
});

function decodeHtml(v){return String(v??'').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&nbsp;|&#160;/gi,' ').replace(/&#x([0-9a-f]+);/gi,(_,c)=>String.fromCodePoint(Number.parseInt(c,16))).replace(/&#(\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));}
function visibleText(v){return decodeHtml(String(v??'').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();}
function normalize(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
function absolute(href,base=BRAZIL_CJ_INDEX_URL){return new URL(decodeHtml(href),base).toString();}
function pad(n){return String(n).padStart(2,'0');}

export function parseCidadeJardimProjectIndex(html,{baseUrl=BRAZIL_CJ_INDEX_URL}={}){
  const out=[];
  for(const m of String(html??'').matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
    const text=visibleText(m[2]);
    const d=text.match(/PROJETO DE INSCRI(?:Ç|C)[ÕO]ES PARA O M[ÊE]S DE ([A-ZÁÉÍÓÚÃÕÇ]+)(?: \([^)]*\))? DE (20\d{2})/i);
    if(!d) continue;
    const month=MONTHS[normalize(d[1])];
    if(!month) continue;
    out.push({year:Number(d[2]),month,url:absolute(m[1],baseUrl),label:text});
  }
  const dedup=[...new Map(out.map(x=>[`${x.year}-${x.month}`,x])).values()];
  return dedup.sort((a,b)=>a.year-b.year||a.month-b.month);
}

export function parseCidadeJardimProjectText(text,{sourceUrl=null}={}){
  const clean=String(text??'').replace(/\s+/g,' ').trim();
  const header=clean.match(/Projeto de Inscri(?:ç|c)[õo]es para o m[êe]s de ([A-Za-zÁÉÍÓÚÃÕÇáéíóúãõç]+) de (20\d{2})/i);
  if(!header) throw new Error('Cidade Jardim project month/year fingerprint missing');
  const month=MONTHS[normalize(header[1])];
  const year=Number(header[2]);
  if(!month) throw new Error(`Unknown Cidade Jardim month: ${header[1]}`);

  // The official monthly project places the race-day columns immediately after
  // the month/year heading (e.g. "3 10 17 31"). Extract only that header row.
  const after=clean.slice((header.index??0)+header[0].length);
  const dayMatch=after.match(/^\s*((?:\d{1,2}\s+){1,8}\d{1,2})\b/);
  if(!dayMatch) throw new Error('Cidade Jardim project race-day header missing');
  const days=[...new Set(dayMatch[1].trim().split(/\s+/).map(Number).filter(d=>d>=1&&d<=31))];
  if(!days.length) throw new Error('Cidade Jardim project contains no race days');

  return days.sort((a,b)=>a-b).map(day=>({
    date:`${year}-${pad(month)}-${pad(day)}`,
    racecourse_id:BRAZIL_CJ_RACECOURSE_ID,
    venue_name:'Hipódromo de Cidade Jardim',
    source_url:sourceUrl,
  }));
}

function evidence(url,checkedAt){return {source_id:BRAZIL_CJ_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};}

export function buildCidadeJardimMeetingRecord(row,{checkedAt}={}){
  const meetingId=`brazil-cidade-jardim-${row.date}`;
  const e=evidence(row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'brazil',
    authority_id:BRAZIL_CJ_AUTHORITY_ID,racing_system_id:BRAZIL_CJ_SYSTEM_ID,racecourse_id:BRAZIL_CJ_RACECOURSE_ID,
    date:row.date,timezone:BRAZIL_CJ_TIMEZONE,first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:BRAZIL_CJ_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'jcsp_monthly_projeto_inscricoes_pdf'},
    route_id:'jcsp-projeto-inscricoes-pdf',confidence:'high',review_status:'needs_review',
    notes:'Official Jockey Club de São Paulo monthly Projeto de Inscrições observation. This route establishes meeting date and Hipódromo de Cidade Jardim only. It does not infer post times from race conditions, news, or other programme material.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:BRAZIL_CJ_SOURCE_ID,route_id:'jcsp-projeto-inscricoes-pdf',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e},
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
