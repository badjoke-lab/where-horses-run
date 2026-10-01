import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const POLAND_TIMEZONE='Europe/Warsaw';
export const POLAND_AUTHORITY_ID='pkwk';
export const POLAND_SYSTEM_ID='poland-pkwk-national-plan-system';
export const POLAND_SOURCE_ID='pkwk-2026-plan';
export const WARSAW_PDF_URL='https://pkwk.org/wp-content/uploads/2026/01/Warszawa-plan-gonitw-2026.pdf';
export const PKWK_INFO_URL='https://pkwk.org/informacje-wyscigowe/informacje-wyscigowe-2026/';
export const SOPOT_2026_URL='https://pkwk.org/wyscigi-w-sopocie-2026/';

export const POLAND_RACECOURSES=Object.freeze({
  warsaw:{racecourse_id:'poland--sluzewiec-warsaw',venue_name:'Tor Służewiec Warszawa'},
  wroclaw:{racecourse_id:'poland--wroclaw-partynice',venue_name:'Wrocław-Partynice'},
  sopot:{racecourse_id:'poland--hipodrom-sopot',venue_name:'Hipodrom Sopot'},
});

const MONTHS=Object.freeze({
  kwietnia:'04',maja:'05',czerwca:'06',lipca:'07',sierpnia:'08',
  wrzesnia:'09',pazdziernika:'10',listopada:'11',grudnia:'12'
});
function decodeHtml(v){return String(v??'').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#x([0-9a-f]+);/gi,(_,c)=>String.fromCodePoint(Number.parseInt(c,16))).replace(/&#(\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));}
export function visibleText(html){return decodeHtml(String(html??'')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
function norm(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();}
function pad(v){return String(Number(v)).padStart(2,'0');}

function weekdayNumber(word){
  const w=norm(word);
  if(w.startsWith('sobot')) return 6;
  if(w.startsWith('niedziel')) return 0;
  if(w.startsWith('piat')) return 5;
  if(w.startsWith('czwart')) return 4;
  if(w.startsWith('srod')) return 3;
  return null;
}
function dayVariants(raw){
  const chars=String(raw).split('');
  const out=[''];
  for(const ch of chars){
    const choices=ch==='7'?['7','1']:[ch];
    const next=[]; for(const prefix of out) for(const c of choices) next.push(prefix+c);
    out.splice(0,out.length,...next);
  }
  return [...new Set(out.map(Number).filter(n=>Number.isInteger(n)&&n>=1&&n<=31))];
}
export function resolvePolishOcrDay(raw,{year=2026,month,weekdayWord}){
  const monthNumber=Number(month), expected=weekdayNumber(weekdayWord);
  const candidates=dayVariants(raw);
  const matching=candidates.filter(day=>new Date(Date.UTC(year,monthNumber-1,day)).getUTCDay()===expected);
  if(matching.length===1) return matching[0];
  const direct=Number(raw);
  if(candidates.includes(direct)&&expected!==null&&new Date(Date.UTC(year,monthNumber-1,direct)).getUTCDay()===expected) return direct;
  if(candidates.length===1) return candidates[0];
  throw new Error('ambiguous OCR day '+raw+' for '+weekdayWord+' month '+month);
}

export function parseWarsawPlanPages(pages,{sourceUrl=WARSAW_PDF_URL}={}){
  if(!Array.isArray(pages)||!pages.length) throw new Error('Warsaw PDF pages required');
  const rows=[];
  for(const page of pages){
    const text=String(page.text??'').replace(/\s+/g,' ').trim();
    if(!/PLAN GONITW 2026/i.test(text)) continue;
    const m=text.match(/Dzie\S{0,3}\s+\d+\s*[-–—]\s*([A-Za-zÀ-ÿ]+),\s*(\d{1,2})\s+([A-Za-zÀ-ÿ]+)/i);
    if(!m) continue;
    const month=MONTHS[norm(m[3])];
    if(!month) continue;
    const day=resolvePolishOcrDay(m[2],{year:2026,month,weekdayWord:m[1]});
    rows.push({date:'2026-'+month+'-'+pad(day),racecourse_id:POLAND_RACECOURSES.warsaw.racecourse_id,venue_name:POLAND_RACECOURSES.warsaw.venue_name,source_url:sourceUrl});
  }
  const out=[...new Map(rows.map(r=>[r.date+'|'+r.racecourse_id,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
  if(!out.length) throw new Error('Warsaw meeting headings missing');
  return out;
}

export function parseWroclawInfoHtml(html,{sourceUrl=PKWK_INFO_URL}={}){
  const text=visibleText(html);
  if(!/Informacje wyścigowe|Informacje wyscigowe/i.test(text)) throw new Error('PKWK information-page fingerprint missing');
  const start=text.search(/Wrocław\s+Plan Gonitw dla Wrocław-Partynice/i);
  if(start<0) throw new Error('Wrocław section missing');
  const tail=text.slice(start);
  const end=tail.search(/\sSopot\s+Plan Gonitw dla Hipodrom Sopot/i);
  const section=end>=0?tail.slice(0,end):tail;
  const dates=new Set();
  for(const m of section.matchAll(/(\d{1,2})\s*dzie[nń]\s+wy[sś]cigowy\s*\((\d{1,2})\.(\d{1,2})\.(2026)\)/gi)){
    dates.add(m[4]+'-'+pad(m[3])+'-'+pad(m[2]));
  }
  const list=section.match(/Gonitwy dodatkowe WTWK-Partynice\s*\(([^)]+)\)/i);
  if(list){
    for(const m of list[1].matchAll(/(\d{1,2})\.(\d{1,2})(?:\.(2026))?/g)) dates.add((m[3]||'2026')+'-'+pad(m[2])+'-'+pad(m[1]));
  }
  const out=[...dates].sort().map(date=>({date,racecourse_id:POLAND_RACECOURSES.wroclaw.racecourse_id,venue_name:POLAND_RACECOURSES.wroclaw.venue_name,source_url:sourceUrl}));
  if(!out.length) throw new Error('Wrocław meeting dates missing');
  return out;
}

export function parseSopot2026Html(html,{sourceUrl=SOPOT_2026_URL}={}){
  const text=visibleText(html);
  if(!/Sopot/i.test(text)||!/2026/.test(text)) throw new Error('Sopot 2026 fingerprint missing');
  const dates=new Set();
  for(const m of text.matchAll(/(\d{1,2})\s*[–—-]\s*(\d{1,2})\s+lipca\s+2026/gi)){
    const start=Number(m[1]), end=Number(m[2]);
    for(let d=start;d<=end;d++) dates.add('2026-07-'+pad(d));
  }
  const out=[...dates].sort().map(date=>({date,racecourse_id:POLAND_RACECOURSES.sopot.racecourse_id,venue_name:POLAND_RACECOURSES.sopot.venue_name,source_url:sourceUrl}));
  if(!out.length) throw new Error('Sopot 2026 meeting dates missing');
  return out;
}

function evidence(url,checkedAt){return {source_id:POLAND_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};}
export function buildPolandMeetingRecord(row,{checkedAt}={}){
  const meetingId='poland-'+row.date+'-'+row.racecourse_id.split('--').pop();
  const e=evidence(row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'poland',
    authority_id:POLAND_AUTHORITY_ID,racing_system_id:POLAND_SYSTEM_ID,
    racecourse_id:row.racecourse_id,date:row.date,timezone:POLAND_TIMEZONE,
    racing_type:'thoroughbred-flat',first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:POLAND_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'official_pkwk_2026_plan'},
    route_id:'pkwk-2026-plan',confidence:'high',review_status:'needs_review',
    notes:'Official PKWK 2026 material confirms meeting date and physical racecourse. Race post times are not inferred.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:POLAND_SOURCE_ID,route_id:'pkwk-2026-plan',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e},
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
