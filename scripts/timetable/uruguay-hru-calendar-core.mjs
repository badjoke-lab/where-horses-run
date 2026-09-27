import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const URUGUAY_TIMEZONE = 'America/Montevideo';
export const URUGUAY_AUTHORITY_ID = 'hru';
export const URUGUAY_SYSTEM_ID = 'uruguay-hru-system';
export const URUGUAY_SOURCE_ID = 'hru-calendar';
export const URUGUAY_CALENDAR_URL = 'https://www.maronas.com.uy/hipodromos/agencias-hipicas/calendario';
export const URUGUAY_RACECOURSES = Object.freeze({
  maronas: { racecourse_id:'uruguay--hipodromo-nacional-de-maronas', venue_name:'Hipódromo Nacional de Maroñas' },
  'las piedras': { racecourse_id:'uruguay--hipodromo-las-piedras', venue_name:'Hipódromo Las Piedras' },
});

const MONTHS = Object.freeze({
  enero:1,febrero:2,marzo:3,abril:4,mayo:5,junio:6,julio:7,agosto:8,
  septiembre:9,setiembre:9,octubre:10,noviembre:11,diciembre:12,
});
const MONTH_NAMES = Object.freeze(['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']);

function normalize(value){
  return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
}
function decodeHtml(value){
  return String(value??'').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&nbsp;|&#160;/gi,' ');
}
function stripHtml(value){return decodeHtml(String(value??'').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();}
function absolute(href,base){return new URL(decodeHtml(href),base).toString();}
function pad(value){return String(value).padStart(2,'0');}
function point(item){return {str:String(item?.str??'').replace(/\s+/g,' ').trim(),x:Number(item?.x??item?.transform?.[4]),y:Number(item?.y??item?.transform?.[5])};}

export function calendarPageUrl(year,month){
  const u=new URL(URUGUAY_CALENDAR_URL);
  u.searchParams.set('m',String(month));
  u.searchParams.set('a',String(year));
  return u.toString();
}

export function discoverUruguayMonthlyPdf(html,{pageUrl=URUGUAY_CALENDAR_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('Uruguay calendar HTML must be non-empty');
  for(const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
    const text=normalize(stripHtml(match[2]));
    const href=absolute(match[1],pageUrl);
    if(text.includes('calendario mensual')&&/\.pdf(?:$|\?)/i.test(href)) return href;
  }
  return null;
}

export function parseUruguayMonthlyCalendarItems(items,{year,month,sourceUrl}={}){
  if(!Number.isInteger(year)||!Number.isInteger(month)||month<1||month>12) throw new Error('Uruguay calendar year/month required');
  const pts=(items??[]).map(point).filter(p=>p.str&&Number.isFinite(p.x)&&Number.isFinite(p.y));
  const joined=normalize(pts.map(p=>p.str).join(' '));
  const monthName=MONTH_NAMES[month-1];
  if(!joined.includes(monthName)||!joined.includes(String(year))) throw new Error('Uruguay monthly calendar fingerprint missing');

  const days=pts.filter(p=>/^(?:[1-9]|[12]\d|3[01])$/.test(p.str)).map(p=>({...p,day:Number(p.str)}));
  if(!days.length) throw new Error('Uruguay calendar day grid missing');

  const venues=pts.map(p=>({...p,key:normalize(p.str)})).filter(p=>URUGUAY_RACECOURSES[p.key]);
  const records=[]; const parse_failures=[];
  for(const venue of venues){
    const above=days.map(day=>({...day,dy:day.y-venue.y,dx:Math.abs(day.x-venue.x)})).filter(day=>day.dy>0&&day.dy<=115);
    if(!above.length){
      parse_failures.push({code:'local_venue_without_day_row',source_text:venue.str,x:venue.x,y:venue.y});
      continue;
    }
    const minDy=Math.min(...above.map(day=>day.dy));
    const row=above.filter(day=>day.dy<=minDy+4).sort((a,b)=>a.dx-b.dx||a.dy-b.dy);
    const day=row[0];
    if(!day||day.dx>55){
      parse_failures.push({code:'local_venue_without_day_column',source_text:venue.str,x:venue.x,y:venue.y});
      continue;
    }
    const resolved=URUGUAY_RACECOURSES[venue.key];
    records.push({
      date:String(year)+'-'+pad(month)+'-'+pad(day.day),
      racecourse_id:resolved.racecourse_id,
      venue_name:resolved.venue_name,
      source_venue_label:venue.str,
      source_url:sourceUrl,
    });
  }
  const unique=new Map(records.map(row=>[row.date+'|'+row.racecourse_id,row]));
  return {records:[...unique.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.racecourse_id.localeCompare(b.racecourse_id)),parse_failures};
}

function evidence(url,checkedAt){
  return {source_id:URUGUAY_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};
}
export function buildUruguayMeetingRecord(row,{checkedAt}={}){
  const suffix=row.racecourse_id.replace(/^uruguay--/,'');
  const meetingId='uruguay-hru-'+suffix+'-'+row.date;
  const e=evidence(row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'uruguay',authority_id:URUGUAY_AUTHORITY_ID,racing_system_id:URUGUAY_SYSTEM_ID,
    racecourse_id:row.racecourse_id,date:row.date,timezone:URUGUAY_TIMEZONE,first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:URUGUAY_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'official_monthly_calendar_pdf_local_venue_grid'},
    route_id:'hru-monthly-calendar-pdf',confidence:'high',review_status:'needs_review',
    notes:'Official HRU/Maroñas monthly calendar observation for '+row.venue_name+'. Only exact local venue labels Maroñas and Las Piedras are admitted; overseas simulcast entries in the same PDF are excluded. This rank-C route does not infer race post times.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:URUGUAY_SOURCE_ID,route_id:'hru-monthly-calendar-pdf',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e},
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
