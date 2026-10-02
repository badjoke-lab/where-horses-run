import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const BELGIUM_TIMEZONE='Europe/Brussels';
export const BELGIUM_AUTHORITY_ID='belgian-federation-horse-racing';
export const BELGIUM_SYSTEM_ID='belgian-trotting-programme-system';
export const BELGIUM_SOURCE_ID='belgium-trotting-public-races';
export const BELGIUM_SOURCE_URL='https://public.trotting.be/races';

const VENUES=Object.freeze({
  mons:{racecourse_id:'belgium--hippodrome-de-wallonie',venue_name:'Hippodrome de Wallonie'},
  waregem:{racecourse_id:'belgium--gaverbeekhippodroom',venue_name:'Gaverbeekhippodroom'},
  tongeren:{racecourse_id:'belgium--jeker-hippodroom',venue_name:'Jeker Hippodroom'}
});

function decodeHtml(v){return String(v??'').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#x([0-9a-f]+);/gi,(_,c)=>String.fromCodePoint(Number.parseInt(c,16))).replace(/&#(\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));}
export function visibleText(html){return decodeHtml(String(html??'')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
function pad(v){return String(Number(v)).padStart(2,'0');}

export function parseBelgiumTrottingPage(html,{sourceUrl=BELGIUM_SOURCE_URL}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('Belgium trotting HTML must be non-empty');
  const text=visibleText(html);
  if(!/Trotting\s+BE/i.test(text)||!/Datum\s+van\s+het\s+einde\s+van\s+de\s+aangifte/i.test(text)) throw new Error('Belgium trotting page fingerprint missing');
  const rows=[];
  const unknown=[];
  const rx=/\b(\d{2})-(\d{2})-(20\d{2})\s+Programma\s+([\p{L}][\p{L}\s'.()/-]{0,80}?)\s+Toestand\s+Tijd\s+Naam\s+Prijzengeld\b/giu;
  for(const m of text.matchAll(rx)){
    const label=m[4].trim().replace(/\s+/g,' ');
    const key=label.toLocaleLowerCase('en-US');
    const venue=VENUES[key];
    if(!venue){unknown.push(label);continue;}
    rows.push({
      date:m[3]+'-'+pad(m[2])+'-'+pad(m[1]),
      source_venue_label:label,
      racecourse_id:venue.racecourse_id,
      venue_name:venue.venue_name,
      source_url:sourceUrl
    });
  }
  if(unknown.length) throw new Error('Unknown Belgian trotting venue labels: '+[...new Set(unknown)].join(', '));
  const out=[...new Map(rows.map(r=>[r.date+'|'+r.racecourse_id,r])).values()].sort((a,b)=>a.date.localeCompare(b.date)||a.racecourse_id.localeCompare(b.racecourse_id));
  if(!out.length) throw new Error('Belgium trotting meeting blocks missing');
  return out;
}

function evidence(url,checkedAt){return {source_id:BELGIUM_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};}

export function buildBelgiumMeetingRecord(row,{checkedAt}={}){
  const meetingId='belgium-trotting-'+row.date+'-'+row.racecourse_id.split('--')[1];
  const e=evidence(row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'belgium',
    authority_id:BELGIUM_AUTHORITY_ID,racing_system_id:BELGIUM_SYSTEM_ID,
    racecourse_id:row.racecourse_id,date:row.date,timezone:BELGIUM_TIMEZONE,
    racing_type:'harness-racing',first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:BELGIUM_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'official_belgian_federation_trotting_programme'},
    route_id:'belgium-trotting-public-races',confidence:'high',review_status:'needs_review',
    notes:'Official Belgian federation trotting programme confirms the meeting date and mapped physical venue. Race-level Tijd values, minitrotter/test rows and entry deadlines are not promoted by this automatic C route; separate reviewed national A-capability evidence remains preserved.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:BELGIUM_SOURCE_ID,route_id:'belgium-trotting-public-races',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e}
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
