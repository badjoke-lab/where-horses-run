import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const KENYA_TIMEZONE='Africa/Nairobi';
export const KENYA_AUTHORITY_ID='jockey-club-of-kenya';
export const KENYA_SYSTEM_ID='ngong-jck-racing-system';
export const KENYA_SOURCE_ID='jck-upcoming-race-dates';
export const KENYA_SOURCE_URL='https://www.jockeyclub.co.ke/horse-racing/upcoming-race-dates';
export const KENYA_RACECOURSE_ID='kenya--ngong-racecourse';

const MONTHS=Object.freeze({
  january:'01',february:'02',march:'03',april:'04',may:'05',june:'06',
  july:'07',august:'08',september:'09',october:'10',november:'11',december:'12'
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

export function parseJckRaceDatesPage(html,{sourceUrl=KENYA_SOURCE_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('JCK race-date HTML must be non-empty');
  let text=visibleText(html);
  text=text.replace(/\bj\s+anuary\b/gi,'january');
  const start=text.search(/Upcoming Race Dates\s+2026\s*-\s*2027\s+SEASON/i);
  if(start<0) throw new Error('JCK 2026-2027 season fingerprint missing');
  const tail=text.slice(start);
  const end=tail.search(/©\s*2024|bottom of page/i);
  const block=end>0?tail.slice(0,end):tail.slice(0,12000);

  const monthRx=/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(20\d{2})\b/gi;
  const headings=[...block.matchAll(monthRx)];
  const rows=[];
  for(let i=0;i<headings.length;i+=1){
    const h=headings[i];
    const month=MONTHS[h[1].toLowerCase()];
    const year=h[2];
    const segStart=(h.index??0)+h[0].length;
    const segEnd=i+1<headings.length?(headings[i+1].index??block.length):block.length;
    const seg=block.slice(segStart,segEnd);
    const dayRx=/\b(\d{1,2})(?:st|nd|rd|th)?(?:\s+20\d{2})?\s*-\s*/gi;
    for(const m of seg.matchAll(dayRx)){
      const day=Number(m[1]);
      if(day<1||day>31) continue;
      rows.push({
        date:year+'-'+month+'-'+pad(day),
        racecourse_id:KENYA_RACECOURSE_ID,
        venue_name:'Ngong Racecourse',
        source_url:sourceUrl
      });
    }
  }
  const out=[...new Map(rows.map(r=>[r.date,r])).values()].sort((a,b)=>a.date.localeCompare(b.date));
  if(out.length<15) throw new Error('JCK 2026-2027 season parsed fewer than 15 meetings');
  return out;
}

function evidence(url,checkedAt){
  return {source_id:KENYA_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};
}
export function buildKenyaMeetingRecord(row,{checkedAt}={}){
  const meetingId='kenya-ngong-'+row.date;
  const e=evidence(row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'kenya',
    authority_id:KENYA_AUTHORITY_ID,racing_system_id:KENYA_SYSTEM_ID,
    racecourse_id:KENYA_RACECOURSE_ID,date:row.date,timezone:KENYA_TIMEZONE,
    racing_type:'thoroughbred-flat',
    first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:KENYA_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'official_jck_2026_2027_season_dates'},
    route_id:'jck-upcoming-race-dates-official-window',confidence:'high',review_status:'needs_review',
    notes:'The official Jockey Club of Kenya Upcoming Race Dates page confirms the 2026-2027 season meeting date at Ngong Racecourse. Automatic publication remains rank C; named cups are editorial context and race post times are not inferred.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:KENYA_SOURCE_ID,route_id:'jck-upcoming-race-dates-official-window',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e}
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
