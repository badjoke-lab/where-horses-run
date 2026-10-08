import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const MAURITIUS_TIMEZONE='Indian/Mauritius';
export const MAURITIUS_AUTHORITY_ID='automatic-systems-ltd-supertote';
export const MAURITIUS_SYSTEM_ID='mauritius-champ-de-mars-system';
export const MAURITIUS_SOURCE_ID='supertote-calendar-2026';
export const MAURITIUS_RACECOURSE_ID='mauritius--champ-de-mars';
export const MAURITIUS_CALENDAR_URL='https://supertote.mu/calendar';
export const MAURITIUS_GRA_URL='https://gra.govmu.org/gra/';

const MONTHS=Object.freeze({
  april:'04',may:'05',june:'06',july:'07',august:'08',september:'09',
  october:'10',november:'11',december:'12'
});
function decodeHtml(v){
  return String(v??'')
    .replace(/&nbsp;|&#160;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/&#x([0-9a-f]+);/gi,(_,c)=>String.fromCodePoint(Number.parseInt(c,16)))
    .replace(/&#(\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));
}
export function visibleText(html){
  return decodeHtml(String(html??''))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
const pad=v=>String(Number(v)).padStart(2,'0');

export function validateGraContext(html){
  const text=visibleText(html);
  if(!/Gambling Regulatory Authority/i.test(text)) throw new Error('GRA authority fingerprint missing');
  if(!/Horseracing|Horse Racing/i.test(text)) throw new Error('GRA horseracing context missing');
  return true;
}

export function parseSupertoteCalendarHtml(html,{sourceUrl=MAURITIUS_CALENDAR_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('Supertote calendar HTML must be non-empty');
  const text=visibleText(html);
  if(!/Racing Calendar/i.test(text)||!/Champ de Mars/i.test(text)||!/2026/.test(text)){
    throw new Error('Supertote 2026 calendar fingerprint missing');
  }
  const start=text.search(/\b2026\b/);
  const end=text.search(/Where to\?/i);
  const segment=text.slice(start,end>start?end:Math.min(text.length,start+8000));
  const tokens=segment.split(/\s+/);
  let month=null;
  const rows=[];
  for(let i=0;i<tokens.length;i+=1){
    const t=tokens[i];
    const m=MONTHS[t.toLowerCase()];
    if(m){month=m;continue;}
    if(!month) continue;
    if(/^(SAT|SUN|MON|TUE|WED|THU|FRI)$/i.test(t)){
      const d=tokens[i+1];
      if(/^\d{1,2}$/.test(d)){
        const n=Number(d);
        if(n>=1&&n<=31){
          rows.push({
            date:'2026-'+month+'-'+pad(n),
            racecourse_id:MAURITIUS_RACECOURSE_ID,
            venue_name:'Champ de Mars',
            source_url:sourceUrl
          });
          i+=1;
        }
      }
    }
  }
  const out=[...new Map(rows.map(r=>[r.date,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
  if(out.length<20) throw new Error('Supertote 2026 calendar parsed fewer than 20 meetings');
  return out;
}

function evidence(url,checkedAt){
  return {source_id:MAURITIUS_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};
}
export function buildMauritiusMeetingRecord(row,{checkedAt}={}){
  const meetingId='mauritius-champ-de-mars-'+row.date;
  const e=evidence(row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'mauritius',
    authority_id:MAURITIUS_AUTHORITY_ID,racing_system_id:MAURITIUS_SYSTEM_ID,
    racecourse_id:MAURITIUS_RACECOURSE_ID,date:row.date,timezone:MAURITIUS_TIMEZONE,
    racing_type:'thoroughbred-flat',
    first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:MAURITIUS_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'licensed_supertote_2026_calendar_with_gra_context_check'},
    route_id:'supertote-calendar-2026-official-window',confidence:'high',review_status:'needs_review',
    notes:'Automatic Systems Ltd / Supertote publishes the 2026 Champ de Mars racing calendar and states that it is licensed to offer betting activities under GRA jurisdiction. The collector separately verifies the live GRA horseracing context. Automatic publication remains rank C and does not infer race post times.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:MAURITIUS_SOURCE_ID,route_id:'supertote-calendar-2026-official-window',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e}
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
