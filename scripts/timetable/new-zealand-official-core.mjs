import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const NEW_ZEALAND_TIMEZONE = 'Pacific/Auckland';

export const NZTR_AUTHORITY_ID = 'new-zealand-thoroughbred-racing';
export const NZTR_SYSTEM_ID = 'new-zealand-thoroughbred-system';
export const NZTR_RPG_SOURCE_ID = 'nztr-racing-programme-guide';
export const NZTR_RPG_LANDING_URL = 'https://nztr.co.nz/racing-programme-guide';
export const LOVERACING_SOURCE_ID = 'loveracing-race-info';
export const LOVERACING_INDEX_URL = 'https://loveracing.nz/RaceInfo.aspx';

export const HRNZ_AUTHORITY_ID = 'harness-racing-new-zealand';
export const HRNZ_SYSTEM_ID = 'new-zealand-harness-system';
export const HRNZ_SOURCE_ID = 'hrnz-raceday-calendar';
export const HRNZ_INDEX_URL = 'https://infohorse.hrnz.co.nz/datahrs/calendar/raceday/dates_index.htm';
export const HRNZ_FINAL_CALENDAR_URL = 'https://www.hrnz.co.nz/assets/2026.27-Final-Racing-Calendar-TAB-NZ-v1.1.pdf';

const MONTHS = Object.freeze({
  jan:1,january:1,feb:2,february:2,mar:3,march:3,apr:4,april:4,may:5,
  jun:6,june:6,jul:7,july:7,aug:8,august:8,sep:9,sept:9,september:9,
  oct:10,october:10,nov:11,november:11,dec:12,december:12,
});

const VENUE_ALIASES = Object.freeze({
  'arawa-park':'arawa-park-racecourse',
  'ascot-park':'ascot-park-racecourse',
  'ashburton':'ashburton-racecourse',
  'cambridge':'cambridge-racecourse',
  'cambridge-raceway':'cambridge-raceway',
  'cambridge-synthetic':'cambridge-synthetic-racecourse',
  'addington-raceway':'addington-raceway',
  'alexandra-park':'alexandra-park-racecourse',
  'ascot-park-raceway':'ascot-park-racecourse',
  'gore-raceway':'gore-raceway',
  'mt-harding-racecourse':'mt-harding-racecourse',
  'oamaru-racecourse':'oamaru-racecourse',
  'motukarara-raceway':'motukarara-raceway',
  'rangiora-raceway':'rangiora-raceway',
  'ashburton-raceway':'ashburton-raceway',
  'central-southland-raceway':'central-southland-raceway',
  'ellerslie':'ellerslie-racecourse',
  'hastings':'hastings-racecourse',
  'hawera':'hawera-racecourse',
  'lauriston-park':'lauriston-park-racecourse',
  'matamata':'matamata-racecourse',
  'methven':'methven-racecourse',
  'new-plymouth-raceway':'new-plymouth-raceway',
  'orari':'orari-racecourse',
  'otaki':'otaki-racecourse',
  'phar-lap-raceway':'phar-lap-raceway',
  'riccarton':'riccarton-park-racecourse',
  'riccarton-park':'riccarton-park-racecourse',
  'ruakaka':'ruakaka-racecourse',
  'taupo':'taupo-racecourse',
  'tauranga':'tauranga-racecourse',
  'te-aroha':'te-aroha-racecourse',
  'te-rapa':'te-rapa-racecourse',
  'trentham':'trentham-racecourse',
  'waverley':'waverley-racecourse',
  'wingatui':'wingatui-racecourse',
});

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/&#x([0-9a-f]+);/gi,(_,code)=>String.fromCodePoint(Number.parseInt(code,16)))
    .replace(/&#(\d+);/g,(_,code)=>String.fromCodePoint(Number(code)));
}

export function nzVisibleText(html) {
  return decodeHtml(String(html ?? ''))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<br\s*\/?\s*>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase();
}
function slugify(value) {
  return normalize(value)
    .replace(/[\u2018\u2019']/g,' ')
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-|-$/g,'')
    .replace(/-+/g,'-');
}
function pad(value){return String(value).padStart(2,'0');}
function absoluteUrl(href,baseUrl){try{return new URL(decodeHtml(href),baseUrl).toString();}catch{return null;}}
function monthNumber(value){return MONTHS[slugify(value).replace(/-/g,'')] ?? null;}
function isoDate(year,month,day){return `${year}-${pad(month)}-${pad(day)}`;}

export function resolveNewZealandRacecourseId(label) {
  const slug=slugify(
    String(label ?? '')
      .replace(/^Hippodrome\s+/i,'')
      .replace(/\s+racecourse$/i,'')
      .trim()
  );
  return VENUE_ALIASES[slug] ?? `${slug}-racecourse`;
}

export function parseNztrRpgLandingPage(html,{sourceUrl=NZTR_RPG_LANDING_URL}={}) {
  if(typeof html!=='string'||!html.trim()) throw new Error('NZTR RPG landing HTML must be non-empty');
  const lower=nzVisibleText(html).toLowerCase();
  if(!lower.includes('racing programme guide')) throw new Error('NZTR RPG landing fingerprint missing');
  const anchors=[...html.matchAll(/<a\b[^>]*href\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi)]
    .map(match=>({
      href:absoluteUrl(match[1]??match[2]??match[3]??'',sourceUrl),
      label:nzVisibleText(match[4]),
      index:match.index??0,
    }))
    .filter(row=>row.href&&/\.pdf(?:$|[?#])/i.test(row.href));
  if(!anchors.length) throw new Error('NZTR RPG latest programme PDF link missing');
  const latestMarker=html.search(/Latest\s+Issue\s*\(Full\s+Programmes\)/i);
  const afterLatest=latestMarker>=0?anchors.find(row=>row.index>latestMarker):null;
  return { programme_url:(afterLatest??anchors[0]).href };
}

export function parseNztrRpgProgrammeText(text) {
  if(typeof text!=='string'||!text.trim()) throw new Error('NZTR RPG text must be non-empty');
  const flat=String(text)
    .replace(/\u00a0/g,' ')
    .replace(/[\r\n]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
  const rx=/TO\s+BE\s+HELD\s+AT\s+(.+?),\s+ON\s+(?:MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)\s+(\d{1,2})\s+([A-Z]+)\s+(20\d{2})/gi;
  const records=[];
  for(const match of flat.matchAll(rx)){
    const month=monthNumber(match[3]);
    if(!month) continue;
    const venue_label=match[1].replace(/\s+/g,' ').trim();
    records.push({
      date:isoDate(Number(match[4]),month,Number(match[2])),
      venue_label,
      racecourse_id:resolveNewZealandRacecourseId(venue_label),
    });
  }
  const deduped=new Map();
  for(const row of records) deduped.set(`${row.date}/${row.racecourse_id}`,row);
  return [...deduped.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.racecourse_id.localeCompare(b.racecourse_id));
}

export function parseLoveracingIndex(html,{sourceUrl=LOVERACING_INDEX_URL}={}) {
  if(typeof html!=='string'||!html.trim()) throw new Error('LOVERACING index HTML must be non-empty');
  if(!/RaceInfo/i.test(nzVisibleText(html))) throw new Error('LOVERACING RaceInfo fingerprint missing');
  const urls=new Set();
  for(const match of html.matchAll(/href\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi)){
    const href=match[1]??match[2]??match[3]??'';
    if(!/\/RaceInfo\/\d+\/Meeting-Overview\.aspx/i.test(href)) continue;
    const absolute=absoluteUrl(href,sourceUrl);
    if(absolute) urls.add(absolute);
  }
  return [...urls];
}

function to24Hour(hour,minute,ampm){
  let h=Number(hour);
  const m=Number(minute);
  if(!Number.isInteger(h)||h<1||h>12||!Number.isInteger(m)||m<0||m>59) return null;
  const marker=String(ampm).toLowerCase();
  if(marker==='pm'&&h!==12) h+=12;
  if(marker==='am'&&h===12) h=0;
  return `${pad(h)}:${pad(m)}`;
}

export function parseLoveracingMeetingPage(html,{sourceUrl=null}={}) {
  if(typeof html!=='string'||!html.trim()) throw new Error('LOVERACING meeting HTML must be non-empty');
  const title=decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]??'').replace(/\s+/g,' ').trim();
  const match=title.match(/Race\s+Meeting\s+for\s+(.+?)\s+at\s+(.+?)\s+on\s+(\d{1,2})\s+([A-Z]{3,9})\s+(20\d{2})\s*\|/i);
  if(!match) throw new Error('LOVERACING meeting title fingerprint missing');
  const month=monthNumber(match[4]);
  if(!month) throw new Error('LOVERACING meeting month unparsed');
  const text=nzVisibleText(html);
  const byNumber=new Map();
  for(const race of text.matchAll(/Race\s+(\d{1,2}):\s*(\d{1,2}):(\d{2})\s*(am|pm)\b/gi)){
    const number=Number(race[1]);
    const post=to24Hour(race[2],race[3],race[4]);
    if(!post||byNumber.has(number)) continue;
    byNumber.set(number,{number,label:`Race ${number}`,post_time_local:post});
  }
  const numbered=[...byNumber.values()].sort((a,b)=>a.number-b.number);
  const rows=numbered.length&&numbered.every((row,index)=>row.number===index+1)
    ? numbered.map(({number,...row})=>row)
    : [];
  return {
    date:isoDate(Number(match[5]),month,Number(match[3])),
    club_label:match[1].trim(),
    venue_label:match[2].trim(),
    racecourse_id:resolveNewZealandRacecourseId(match[2]),
    source_url:sourceUrl,
    timetable_rows:rows,
  };
}


const HRNZ_FALLBACK_CLUB_VENUES = Object.freeze({
  'waikato-bop-harness':'Cambridge Raceway',
  'auckland-tc':'Alexandra Park',
  'nz-metro-tc':'Addington Raceway',
  'nz-metro-tc-p':'Addington Raceway',
  'timaru-hrc':'Phar Lap Raceway',
  'gore-hrc':'Gore Raceway',
  'methven-tc':'Mt Harding Racecourse',
  'northern-southland-tc':'Ascot Park Raceway',
  'invercargill-hrc':'Ascot Park Raceway',
  'oamaru-hrc':'Oamaru Racecourse',
  'ashburton-tc':'Ashburton Raceway',
  'winton-hrc':'Central Southland Raceway',
  'rangiora-hrc':'Rangiora Raceway',
  'banks-pen-tc':'Motukarara Raceway',
});

const HRNZ_FALLBACK_DATE_VENUES = Object.freeze({
  '2026-10-01/wyndham-hrc':'Gore Raceway',
  '2026-10-11/akaroa-tc':'Mt Harding Racecourse',
});

const HRNZ_EXPLICIT_VENUES = Object.freeze({
  'ascot-park':'Ascot Park Raceway',
  'timaru':'Phar Lap Raceway',
  'gore':'Gore Raceway',
  'methven':'Mt Harding Racecourse',
  'cambridge':'Cambridge Raceway',
  'addington':'Addington Raceway',
});

function hrnzCalendarIsoDate(token,seasonStartYear){
  const match=String(token??'').trim().match(/^(\d{1,2})-([A-Za-z]+)$/);
  if(!match) return null;
  const month=monthNumber(match[2]);
  if(!month) return null;
  const year=month>=7?seasonStartYear:seasonStartYear+1;
  return isoDate(year,month,Number(match[1]));
}

function hrnzFallbackVenue(clubLabel,date,explicitVenue){
  if(explicitVenue){
    const explicit=HRNZ_EXPLICIT_VENUES[slugify(explicitVenue)];
    if(explicit) return explicit;
  }
  const clubKey=slugify(clubLabel).replace(/-p$/,'');
  return HRNZ_FALLBACK_DATE_VENUES[`${date}/${clubKey}`] ?? HRNZ_FALLBACK_CLUB_VENUES[clubKey] ?? null;
}

export function parseHrnzFinalCalendarItems(items,{seasonStartYear=2026,sourceUrl=HRNZ_FINAL_CALENDAR_URL}={}){
  if(!Array.isArray(items)||!items.length) throw new Error('HRNZ final calendar PDF items must be non-empty');
  const normalized=items
    .map(item=>({
      page:Number(item.page??1),
      page_width:Number(item.page_width??1190.52),
      str:String(item.str??'').replace(/\s+/g,' ').trim(),
      x:Number(item.x),
      y:Number(item.y),
    }))
    .filter(item=>item.str&&Number.isFinite(item.x)&&Number.isFinite(item.y)&&Number.isFinite(item.page_width)&&item.page_width>0);

  const dateHeaders=normalized
    .map(item=>({...item,date:hrnzCalendarIsoDate(item.str,seasonStartYear)}))
    .filter(item=>item.date)
    .map(item=>({...item,column:Math.max(0,Math.min(6,Math.floor(item.x/(item.page_width/7))))}));

  const records=[];
  const unknown_venues=[];
  for(const item of normalized){
    const match=item.str.match(/^(.+?)\(x(\d+)\)\s+(\d{1,2}):(\d{2})(am|pm)$/i);
    if(!match) continue;
    const rawClub=match[1].trim();
    if(!(/\bHarness\b/i.test(rawClub)||/\bHRC\b/i.test(rawClub)||/\bTC(?:\(P\))?(?:@|$)/i.test(rawClub))) continue;

    const column=Math.max(0,Math.min(6,Math.floor(item.x/(item.page_width/7))));
    const header=dateHeaders
      .filter(row=>row.page===item.page&&row.column===column&&row.y>item.y)
      .map(row=>({...row,delta:row.y-item.y}))
      .filter(row=>row.delta<105)
      .sort((a,b)=>a.delta-b.delta)[0];
    if(!header) continue;

    let club_label=rawClub.replace(/\(P\)$/i,'').trim();
    let explicitVenue=null;
    const at=club_label.match(/^(.+?)@(.+)$/);
    if(at){
      club_label=at[1].trim();
      explicitVenue=at[2].trim();
    }
    const venue_label=hrnzFallbackVenue(club_label,header.date,explicitVenue);
    if(!venue_label){
      unknown_venues.push({date:header.date,club_label,source_text:item.str});
      continue;
    }
    const first_race_time_local=to24Hour(match[3],match[4],match[5]);
    records.push({
      date:header.date,
      club_label,
      venue_label,
      racecourse_id:resolveNewZealandRacecourseId(venue_label),
      first_race_time_local,
      source_url:sourceUrl,
      source_kind:'final_calendar_pdf',
    });
  }

  const deduped=new Map();
  for(const row of records) deduped.set(`${row.date}/${row.racecourse_id}`,row);
  return {
    records:[...deduped.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.racecourse_id.localeCompare(b.racecourse_id)),
    unknown_venues,
  };
}

export function parseHrnzIndex(html,{sourceUrl=HRNZ_INDEX_URL}={}) {
  if(typeof html!=='string'||!html.trim()) throw new Error('HRNZ racing dates index HTML must be non-empty');
  if(!/Racing\s+Dates/i.test(nzVisibleText(html))) throw new Error('HRNZ racing dates fingerprint missing');
  const urls=new Set();
  for(const match of html.matchAll(/href\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi)){
    const href=match[1]??match[2]??match[3]??'';
    if(!/dates_[a-z]+\d+\.htm/i.test(href)) continue;
    const absolute=absoluteUrl(href,sourceUrl);
    if(absolute) urls.add(absolute);
  }
  return [...urls];
}

export function parseHrnzMonthPage(html,{sourceUrl=null}={}) {
  if(typeof html!=='string'||!html.trim()) throw new Error('HRNZ month HTML must be non-empty');
  const heading=nzVisibleText(html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/i)?.[0]??'');
  const headingMatch=heading.match(/([A-Za-z]+)\s+(20\d{2})/);
  if(!headingMatch) throw new Error('HRNZ month heading missing');
  const month=monthNumber(headingMatch[1]);
  const year=Number(headingMatch[2]);
  if(!month) throw new Error('HRNZ month unparsed');
  const records=[];
  for(const tr of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
    const block=tr[1];
    const text=nzVisibleText(block);
    const dayMatch=text.match(/^\s*(\d{1,2})\b/);
    if(!dayMatch) continue;
    const anchor=[...block.matchAll(/<a\b[^>]*href\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi)]
      .map(match=>({href:absoluteUrl(match[1]??match[2]??match[3]??'',sourceUrl),label:nzVisibleText(match[4])}))
      .find(row=>row.href&&/\/datahrs\/programmes\//i.test(row.href));
    if(!anchor) continue;
    records.push({
      date:isoDate(year,month,Number(dayMatch[1])),
      club_label:anchor.label,
      programme_url:anchor.href,
      source_url:sourceUrl,
    });
  }
  return records;
}

export function parseHrnzProgrammePage(html,{date,clubLabel,sourceUrl=null}={}) {
  if(typeof html!=='string'||!html.trim()) throw new Error('HRNZ programme HTML must be non-empty');
  const text=nzVisibleText(html);
  const meetingBlock=text.match(/Meeting:\s*(.+?)\s+Last\s+updated/i)?.[1]?.trim();
  const meeting=meetingBlock?.match(/^(.+)\s+at\s+(.+)$/i);
  if(!meeting) throw new Error('HRNZ programme meeting fingerprint missing');
  const first=text.match(/First\s+Race\s+Starts\s+(\d{1,2}):(\d{2})\s*(am|pm)\b/i);
  const first_race_time_local=first?to24Hour(first[1],first[2],first[3]):null;
  const venue_label=meeting[2].trim();
  return {
    date,
    club_label:clubLabel,
    meeting_label:meeting[1].trim(),
    venue_label,
    racecourse_id:resolveNewZealandRacecourseId(venue_label),
    first_race_time_local,
    source_url:sourceUrl,
  };
}

function evidence(sourceId,url,checkedAt){
  return {source_id:sourceId,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};
}

function thoroughbredBase(row,checkedAt,programmeUrl){
  const meetingId=`new-zealand-thoroughbred-${row.racecourse_id}-${row.date}`;
  return {
    candidate_id:meetingId,meeting_id:meetingId,country_id:'new-zealand',
    authority_id:NZTR_AUTHORITY_ID,racing_system_id:NZTR_SYSTEM_ID,racecourse_id:row.racecourse_id,
    date:row.date,timezone:NEW_ZEALAND_TIMEZONE,first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:NZTR_RPG_SOURCE_ID,official_url:programmeUrl,checked_at:checkedAt,extraction_method:'official_nztr_rpg_pdf'},
    route_id:'nztr-rpg-current-programmes',confidence:'high',review_status:'needs_review',
    notes:`Official NZTR Racing Programme Guide observation; venue: ${row.venue_label}.`,
  };
}

export function buildNztrFixtureRecord(row,{checkedAt,programmeUrl}={}) {
  const record=thoroughbredBase(row,checkedAt,programmeUrl);
  record.detail_observation={status:'not_published',evaluated_capability_rank:'A',race_count:0,detail_url:null};
  record.acquisition_attempt={attempted_at:checkedAt,status:'pending_publication',source_id:LOVERACING_SOURCE_ID,route_id:'loveracing-meeting-overview',error_code:null};
  const meetingEvidence=evidence(NZTR_RPG_SOURCE_ID,programmeUrl,checkedAt);
  record.evidence_support={meeting_identity:meetingEvidence,meeting_date:meetingEvidence};
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'A'});
  return {...record,capability_rank};
}

export function buildLoveracingDetailedRecord(scheduleRow,detail,{checkedAt,programmeUrl}={}) {
  if(!Array.isArray(detail?.timetable_rows)||!detail.timetable_rows.length) {
    return buildNztrFixtureRecord(scheduleRow,{checkedAt,programmeUrl});
  }
  const record=thoroughbredBase(scheduleRow,checkedAt,programmeUrl);
  record.first_race_time_local=detail.timetable_rows[0].post_time_local;
  record.last_race_time_local=detail.timetable_rows.at(-1).post_time_local;
  record.timetable_rows=detail.timetable_rows;
  record.source={source_id:LOVERACING_SOURCE_ID,official_url:detail.source_url,checked_at:checkedAt,extraction_method:'official_loveracing_meeting_overview'};
  record.route_id='loveracing-meeting-overview';
  record.detail_observation={status:'available',evaluated_capability_rank:'A',race_count:detail.timetable_rows.length,detail_url:detail.source_url};
  record.acquisition_attempt={attempted_at:checkedAt,status:'success',source_id:LOVERACING_SOURCE_ID,route_id:'loveracing-meeting-overview',error_code:null};
  const meetingEvidence=evidence(NZTR_RPG_SOURCE_ID,programmeUrl,checkedAt);
  const detailEvidence=evidence(LOVERACING_SOURCE_ID,detail.source_url,checkedAt);
  record.evidence_support={meeting_identity:meetingEvidence,meeting_date:meetingEvidence,race_times:detailEvidence,timetable:detailEvidence};
  const capability_rank=deriveBestAvailableRank(record,detail.timetable_rows);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'A'});
  return {...record,capability_rank};
}

export function buildHrnzRecord(row,{checkedAt,calendarUrl,detailStatus='available',attemptStatus='success',errorCode=null}={}) {
  const meetingId=`new-zealand-harness-${row.racecourse_id}-${row.date}`;
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'new-zealand',
    authority_id:HRNZ_AUTHORITY_ID,racing_system_id:HRNZ_SYSTEM_ID,racecourse_id:row.racecourse_id,
    date:row.date,timezone:NEW_ZEALAND_TIMEZONE,first_race_time_local:row.first_race_time_local??null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:HRNZ_SOURCE_ID,official_url:row.source_url??calendarUrl,checked_at:checkedAt,extraction_method:row.source_url?'official_hrnz_programme':'official_hrnz_racing_dates'},
    route_id:row.source_url?'hrnz-programme':'hrnz-racing-dates',confidence:'high',review_status:'needs_review',
    notes:`Official HRNZ observation; club: ${row.club_label??'unknown'}; venue: ${row.venue_label??'pending programme'}.`,
  };
  record.detail_observation={status:detailStatus,evaluated_capability_rank:'B',race_count:0,detail_url:row.source_url??null};
  record.acquisition_attempt={attempted_at:checkedAt,status:attemptStatus,source_id:HRNZ_SOURCE_ID,route_id:'hrnz-programme',error_code:errorCode};
  const calendarEvidence=evidence(HRNZ_SOURCE_ID,calendarUrl,checkedAt);
  record.evidence_support={meeting_date:calendarEvidence,meeting_identity:calendarEvidence};
  if(row.source_url&&row.first_race_time_local) record.evidence_support.race_times=evidence(HRNZ_SOURCE_ID,row.source_url,checkedAt);
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'B'});
  return {...record,capability_rank};
}
