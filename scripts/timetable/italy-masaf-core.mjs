import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const ITALY_TIMEZONE = 'Europe/Rome';
export const ITALY_AUTHORITY_ID = 'masaf';
export const ITALY_SOURCE_ID = 'masaf-calendar-2026';
export const ITALY_GALLOP_SYSTEM_ID = 'italy-masaf-gallop-system';
export const ITALY_TROT_SYSTEM_ID = 'italy-masaf-trot-system';
export const ITALY_NORMATIVA_URL = 'https://www.masaf.gov.it/flex/cm/pages/ServeBLOB.php/L/IT/IDPagina/6174?YY=2026';

const MONTHS = Object.freeze({
  GENNAIO:1,FEBBRAIO:2,MARZO:3,APRILE:4,MAGGIO:5,GIUGNO:6,
  LUGLIO:7,AGOSTO:8,SETTEMBRE:9,OTTOBRE:10,NOVEMBRE:11,DICEMBRE:12,
});

export const ITALY_VENUES = Object.freeze([
  ['PADOVA','italy--ippodromo-breda','Ippodromo Breda'],
  ['AVERSA','italy--ippodromo-cirigliano','Ippodromo Cirigliano'],
  ['SASSARI','italy--ippodromo-don-meloni','Ippodromo Don Meloni'],
  ['CASARANO','italy--ippodromo-euroitalia','Ippodromo Euroitalia'],
  ['LIVORNO','italy--ippodromo-federico-caprilli','Ippodromo Federico Caprilli'],
  ['PALERMO','italy--ippodromo-la-favorita','Ippodromo La Favorita'],
  ['MODENA','italy--ippodromo-la-ghirlandina','Ippodromo La Ghirlandina'],
  ['VARESE','italy--ippodromo-le-bettole','Ippodromo Le Bettole'],
  ['CORRIDONIA','italy--ippodromo-martini','Ippodromo Martini'],
  ['TRIESTE','italy--ippodromo-montebello','Ippodromo Montebello'],
  ['TARANTO','italy--ippodromo-paolo-sesto','Ippodromo Paolo Sesto'],
  ['CHILIVANI','italy--ippodromo-pinna','Ippodromo Pinna'],
  ['TREVISO','italy--ippodromo-s-artemio','Ippodromo S. Artemio'],
  ['MONTEGIORGIO','italy--ippodromo-s-paolo','Ippodromo S. Paolo'],
  ['PISA','italy--ippodromo-san-rossore','Ippodromo San Rossore'],
  ['MILANO','italy--ippodromo-san-siro','Ippodromo San Siro'],
  ['MONTECATINI','italy--ippodromo-sesana','Ippodromo Sesana'],
  ['TORINO','italy--ippodromo-stupinigi','Ippodromo Stupinigi'],
  ['PONTECAGNANO','italy--ippodromo-valentinia','Ippodromo Valentinia'],
  ['ALBENGA','italy--ippodromo-dei-fiori','Ippodromo dei Fiori'],
  ['AVEZZANO','italy--ippodromo-dei-marsi','Ippodromo dei Marsi'],
  ['FOLLONICA','italy--ippodromo-dei-pini','Ippodromo dei Pini'],
  ['CASTELLUCCIO','italy--ippodromo-dei-sauri','Ippodromo dei Sauri'],
  ['GARIGLIANO','italy--ippodromo-del-garigliano','Ippodromo del Garigliano'],
  ['SIRACUSA','italy--ippodromo-del-mediterraneo','Ippodromo del Mediterraneo'],
  ['CESENA','italy--ippodromo-del-savio','Ippodromo del Savio'],
  ['FIRENZE','italy--ippodromo-del-visarno','Ippodromo del Visarno'],
  ['BOLOGNA','italy--ippodromo-dell-arcoveggio','Ippodromo dell’Arcoveggio'],
  ['NAPOLI','italy--ippodromo-di-agnano','Ippodromo di Agnano'],
  ['MERANO','italy--ippodromo-di-maia','Ippodromo di Maia'],
  ['ROMA','italy--ippodromo-di-roma-capannelle','Ippodromo di Roma Capannelle'],
]);

function norm(value){
  return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,'').replace(/\s+/g,' ').trim().toUpperCase();
}
function pad(value){return String(value).padStart(2,'0');}
function nearestDay(x, dayColumns){
  let best=null;
  for(const col of dayColumns){
    const d=Math.abs(col.x-x);
    if(!best||d<best.distance)best={...col,distance:d};
  }
  return best&&best.distance<=9?best.day:null;
}
export function classifyMasafCode(value){
  const code=norm(value).replace(/[^A-Z+]/g,'');
  if(!code||code.length>5)return null;
  if(/^T[A-Z]*$/.test(code))return 'trot';
  if(/^G[A-Z]*$/.test(code)||/^(O|OST|SIEPI)$/.test(code))return 'gallop';
  return null;
}
function decodeHtml(value){return String(value??'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&#x([0-9a-f]+);/gi,(_,c)=>String.fromCodePoint(Number.parseInt(c,16))).replace(/&#(\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));}
function absoluteMasafUrl(href,base){return new URL(decodeHtml(href),base).href;}
export function findLatestMasafCalendarDetailUrl(html,baseUrl=ITALY_NORMATIVA_URL){
  const anchors=[...String(html).matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map(m=>({href:m[1],text:m[2].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()}));
  const hit=anchors.find(a=>/modifica del calendario delle corse ippiche per l.?anno 2026/i.test(a.text));
  if(!hit)throw new Error('MASAF current calendar modification detail link not found');
  return absoluteMasafUrl(hit.href,baseUrl);
}
export function findMasafCalendarPdfUrl(html,baseUrl){
  const anchors=[...String(html).matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map(m=>({href:m[1],text:m[2].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()}));
  const hit=anchors.find(a=>/ALLEGATO\\s*n\\.?\\s*1/i.test(a.text)&&/Calendario corse ippiche/i.test(a.text));
  if(!hit)throw new Error('MASAF ALLEGATO n. 1 calendar PDF link not found');
  return absoluteMasafUrl(hit.href,baseUrl);
}
function findVenue(text){
  const n=norm(text);
  const hit=ITALY_VENUES.find(([label])=>n===label||n.startsWith(label+' ')||n.includes(' '+label+' '));
  return hit?{label:hit[0],racecourse_id:hit[1],venue_name:hit[2]}:null;
}
function groupRows(items,tolerance=2.5){
  const sorted=[...items].filter(x=>String(x.str??'').trim()).sort((a,b)=>(b.y-a.y)||(a.x-b.x));
  const rows=[];
  for(const item of sorted){
    let row=rows.find(r=>Math.abs(r.y-item.y)<=tolerance);
    if(!row){row={y:item.y,items:[]};rows.push(row);}
    row.items.push(item);
  }
  for(const row of rows)row.items.sort((a,b)=>a.x-b.x);
  return rows.sort((a,b)=>b.y-a.y);
}
export function parseMasafCalendarPages(pages,{year=2026,sourceUrl=ITALY_NORMATIVA_URL}={}){
  const records=[]; const parse_failures=[]; const unknown_venues=[];
  for(const page of pages){
    const items=(page.items??[]).map(x=>({str:String(x.str??'').trim(),x:Number(x.x),y:Number(x.y)})).filter(x=>x.str);
    const pageText=norm(items.map(x=>x.str).join(' '));
    const monthName=Object.keys(MONTHS).find(m=>pageText.includes(m));
    if(!monthName)continue;
    const month=MONTHS[monthName];
    const rows=groupRows(items);
    let dayColumns=[];
    for(const row of rows){
      const cols=row.items.map(x=>({day:/^(?:[1-9]|[12]\d|3[01])$/.test(x.str)?Number(x.str):null,x:x.x})).filter(x=>x.day);
      if(cols.length>dayColumns.length)dayColumns=cols;
    }
    if(dayColumns.length<7){parse_failures.push({code:'day_header_not_found',page:page.page_number,month:monthName,day_columns:dayColumns.length});continue;}
    for(const row of rows){
      const rowText=row.items.map(x=>x.str).join(' ');
      const venue=findVenue(rowText);
      if(!venue)continue;
      for(const item of row.items){
        const system=classifyMasafCode(item.str);
        if(!system)continue;
        const day=nearestDay(item.x,dayColumns);
        if(!day){parse_failures.push({code:'code_without_day_column',page:page.page_number,month:monthName,venue:venue.label,code:item.str,x:item.x});continue;}
        records.push({
          date:`${year}-${pad(month)}-${pad(day)}`,
          venue_label:venue.label,venue_name:venue.venue_name,racecourse_id:venue.racecourse_id,
          system,calendar_code:norm(item.str),source_url:sourceUrl,
        });
      }
    }
    for(const row of rows){
      const left=row.items.find(x=>x.x<180);
      if(!left)continue;
      const n=norm(left.str);
      if(/^[A-Z][A-Z .'-]{3,}$/.test(n)&&!findVenue(n)&&row.items.some(x=>classifyMasafCode(x.str))){
        unknown_venues.push({page:page.page_number,month:monthName,label:left.str});
      }
    }
  }
  const unique=new Map();
  for(const row of records)unique.set(`${row.system}|${row.racecourse_id}|${row.date}`,row);
  return {records:[...unique.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.racecourse_id.localeCompare(b.racecourse_id)||a.system.localeCompare(b.system)),parse_failures,unknown_venues};
}
function evidence(url,checkedAt){return {source_id:ITALY_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};}
export function buildMasafMeetingRecord(scheduleRow,{checkedAt}={}){
  const isTrot=scheduleRow.system==='trot';
  const systemId=isTrot?ITALY_TROT_SYSTEM_ID:ITALY_GALLOP_SYSTEM_ID;
  const meetingId=`italy-masaf-${scheduleRow.system}-${scheduleRow.racecourse_id.replace(/^italy--/,'')}-${scheduleRow.date}`;
  const ev=evidence(scheduleRow.source_url??ITALY_NORMATIVA_URL,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'italy',authority_id:ITALY_AUTHORITY_ID,racing_system_id:systemId,
    racecourse_id:scheduleRow.racecourse_id,date:scheduleRow.date,timezone:ITALY_TIMEZONE,first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:ITALY_SOURCE_ID,official_url:scheduleRow.source_url??ITALY_NORMATIVA_URL,checked_at:checkedAt,extraction_method:'official_masaf_current_calendar_pdf'},
    route_id:'masaf-current-calendar-pdf',confidence:'high',review_status:'needs_review',
    notes:`Official MASAF 2026 national ${isTrot?'trot':'gallop'} calendar observation; meeting date and physical racecourse only. Race times are not inferred.`,
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:ITALY_SOURCE_ID,route_id:'masaf-current-calendar-pdf',error_code:null},
    evidence_support:{meeting_identity:ev,meeting_date:ev},
  };
  const capability_rank=deriveBestAvailableRank(record,record.timetable_rows);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
