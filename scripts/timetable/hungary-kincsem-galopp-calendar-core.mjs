import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const HUNGARY_TIMEZONE='Europe/Budapest';
export const HUNGARY_AUTHORITY_ID='kincsem-park';
export const HUNGARY_SYSTEM_ID='hungary-kincsem-galopp-calendar-system';
export const HUNGARY_SOURCE_ID='kincsem-galopp-calendar';
export const HUNGARY_RACECOURSE_ID='hungary--kincsem-park';
export const HUNGARY_CALENDAR_INDEX_URL='https://kincsempark.hu/galopp-szakma-informaciok/';
export const HUNGARY_ANNUAL_CALENDAR_URL='https://kincsempark.hu/wp-content/uploads/2026/01/gvn261.pdf';
export const HUNGARY_RACING_DAYS_URL='https://mla.kincsempark.hu/racing-days/gallop/';

const MONTHS=Object.freeze({
  januar:'01',februar:'02',marcius:'03',aprilis:'04',majus:'05',junius:'06',
  julius:'07',augusztus:'08',szeptember:'09',oktober:'10',november:'11',december:'12',
});
function decodeHtml(v){return String(v??'').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#x([0-9a-f]+);/gi,(_,c)=>String.fromCodePoint(Number.parseInt(c,16))).replace(/&#(\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));}
function stripHtml(v){return decodeHtml(String(v??'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();}
function normalize(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();}
function absolute(href,base){return new URL(decodeHtml(href),base).toString();}

export function resolveGaloppCalendarCandidates(html,{sourceUrl=HUNGARY_CALENDAR_INDEX_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('Kincsem Galopp calendar index HTML must be non-empty');
  const candidates=[];
  for(const m of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
    const label=stripHtml(m[2]);
    const hit=label.match(/Galopp\s+Versenynapt[aá]r\s+2026\/(\d+)\.?\s*sz[aá]m/i);
    if(!hit) continue;
    const href=absolute(m[1],sourceUrl);
    if(!/\.pdf(?:$|\?)/i.test(href)) continue;
    candidates.push({issue:Number(hit[1]),label,href});
  }
  if(!candidates.length) throw new Error('Current 2026 Galopp calendar PDF link missing');
  return candidates.sort((a,b)=>b.issue-a.issue);
}
export function resolveLatestGaloppCalendar(html,options={}){
  return resolveGaloppCalendarCandidates(html,options)[0];
}

export async function extractPdfText(bytes){
  const copy=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
  const doc=await pdfjsLib.getDocument({data:copy,useSystemFonts:true,disableFontFace:true}).promise;
  let text='';
  for(let i=1;i<=doc.numPages;i++){
    const page=await doc.getPage(i);
    const tc=await page.getTextContent();
    text+=' '+tc.items.map(x=>x.str).join(' ');
  }
  return {pages:doc.numPages,text:text.replace(/\s+/g,' ').trim()};
}

export function parseGaloppCalendarPdfText(text,{sourceUrl}={}){
  if(typeof text!=='string'||!text.trim()) throw new Error('Kincsem Galopp calendar PDF text must be non-empty');
  if(!/GALOPP\s*-\s*VERSENYNAPT[AÁ]R/i.test(text.replace(/\s+/g,' '))) throw new Error('Kincsem Galopp calendar fingerprint missing');
  const rows=[];
  const rx=/(?:^|\s)nap\s*,?\s*2\s*0\s*2\s*6\s*\.\s*([A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű]+)\s*(\d\s+\d|\d{1,2})\s*\./gi;
  for(const m of text.matchAll(rx)){
    const month=MONTHS[normalize(m[1])];
    if(!month) continue;
    const day=Number(String(m[2]).replace(/\s+/g,''));
    rows.push({date:'2026-'+month+'-'+String(day).padStart(2,'0'),racecourse_id:HUNGARY_RACECOURSE_ID,venue_name:'Kincsem Park',racing_type:'thoroughbred-flat',source_url:sourceUrl});
  }
  const headingRx=/2\s*0\s*2\s*6\s*\.\s*([A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű]+)\s*(\d\s+\d|\d{1,2})\s*\.\s*Vas[aá]rnap\b/gi;
  for(const m of text.matchAll(headingRx)){
    const month=MONTHS[normalize(m[1])];
    if(!month) continue;
    const day=Number(String(m[2]).replace(/\s+/g,''));
    rows.push({date:'2026-'+month+'-'+String(day).padStart(2,'0'),racecourse_id:HUNGARY_RACECOURSE_ID,venue_name:'Kincsem Park',racing_type:'thoroughbred-flat',source_url:sourceUrl});
  }
  const out=[...new Map(rows.map(r=>[r.date,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
  if(!out.length) throw new Error('Kincsem Galopp meeting dates missing');
  return out;
}

export function parseGaloppAnnualCalendarPdfText(text,{sourceUrl=HUNGARY_ANNUAL_CALENDAR_URL}={}){
  if(typeof text!=='string'||!text.trim()) throw new Error('Kincsem annual Galopp calendar PDF text must be non-empty');
  const normalized=text.replace(/\s+/g,' ').trim();
  if(!/GALOPP\s*-?\s*VERSENYNAPT[AÁ]R/i.test(normalized)) throw new Error('Kincsem annual Galopp calendar fingerprint missing');
  const marker=normalized.search(/M[aá]rcius\s+29(?:\s+|$)/i);
  if(marker<0) throw new Error('Kincsem annual Galopp meeting table missing');
  const block=normalized.slice(marker);
  const monthPattern='M[aá]rcius|[AÁ]prilis|M[aá]jus|J[uú]nius|J[uú]lius|Augusztus|Szeptember|Okt[oó]ber|November';
  const rx=new RegExp('('+monthPattern+')\\s+([\\s\\S]*?)(?=(?:'+monthPattern+')\\s+|$)','gi');
  const rows=[];
  for(const m of block.matchAll(rx)){
    const month=MONTHS[normalize(m[1])];
    if(!month) continue;
    const nums=[...m[2].matchAll(/\b(\d{1,2})\b/g)].map(x=>Number(x[1]));
    let days=[];
    for(let i=nums.length-1;i>=0;i-=1){
      const count=nums[i];
      if(count>=0&&count<=5&&i===count){days=nums.slice(0,i);break;}
    }
    if(!days.length&&nums.length) days=nums.filter(n=>n>=1&&n<=31);
    for(const day of days){
      if(day<1||day>31) continue;
      rows.push({date:'2026-'+month+'-'+String(day).padStart(2,'0'),racecourse_id:HUNGARY_RACECOURSE_ID,venue_name:'Kincsem Park',racing_type:'thoroughbred-flat',source_url:sourceUrl});
    }
  }
  const out=[...new Map(rows.map(r=>[r.date,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
  if(!out.length) throw new Error('Kincsem annual Galopp meeting dates missing');
  return out;
}

export function parseGaloppRacingDaysHtml(html,{sourceUrl=HUNGARY_RACING_DAYS_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('Kincsem Galopp racing-days HTML must be non-empty');
  const text=stripHtml(html);
  if(!/Galopp\s+Versenynapok|Gallop\s+Racing\s+Days/i.test(text)) throw new Error('Kincsem Galopp racing-days fingerprint missing');
  const dates=[...new Set([...text.matchAll(/\b(2026-\d{2}-\d{2})\b/g)].map(m=>m[1]))].sort();
  if(!dates.length) throw new Error('Kincsem Galopp racing-days dates missing');
  return dates.map(date=>({date,racecourse_id:HUNGARY_RACECOURSE_ID,venue_name:'Kincsem Park',racing_type:'thoroughbred-flat',source_url:sourceUrl}));
}

function evidence(url,checkedAt){return {source_id:HUNGARY_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};}
export function buildHungaryGaloppMeetingRecord(row,{checkedAt}={}){
  const meetingId='hungary-kincsem-galopp-'+row.date;
  const e=evidence(row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'hungary',
    authority_id:HUNGARY_AUTHORITY_ID,racing_system_id:HUNGARY_SYSTEM_ID,
    racecourse_id:HUNGARY_RACECOURSE_ID,date:row.date,timezone:HUNGARY_TIMEZONE,
    racing_type:'thoroughbred-flat',first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:HUNGARY_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'official_galopp_calendar_pdf'},
    route_id:'kincsem-galopp-calendar',confidence:'high',review_status:'needs_review',
    notes:'Official Kincsem Park Galopp calendar confirms the Thoroughbred meeting date and Kincsem Park identity. Harness and greyhound meetings are outside this automatic route. Programme post times are a separate richer source and are not inferred here.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:HUNGARY_SOURCE_ID,route_id:'kincsem-galopp-calendar',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e},
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
