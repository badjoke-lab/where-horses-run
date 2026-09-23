import { resolveNewZealandRacecourseId } from './new-zealand-official-core.mjs';

export const NZTR_NON_RUNNING_SOURCE_ID = 'nztr-news-explicit-non-running';
export const NZTR_NEWS_URL = 'https://nztr.co.nz/news';
export const HRNZ_NON_RUNNING_SOURCE_ID = 'hrnz-news-explicit-non-running';
export const HRNZ_NEWS_URL = 'https://www.hrnz.co.nz/news/';

const MONTHS = Object.freeze({
  january:1,february:2,march:3,april:4,may:5,june:6,
  july:7,august:8,september:9,october:10,november:11,december:12,
});
const WEEKDAYS = Object.freeze({
  sunday:0,monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6,
});
const MONTH_PATTERN=Object.keys(MONTHS).join('|');
const WEEKDAY_PATTERN=Object.keys(WEEKDAYS).join('|');

const HRNZ_VENUE_ALIASES=Object.freeze({
  'cambridge':'cambridge-raceway',
  'cambridge raceway':'cambridge-raceway',
  'alexandra park':'alexandra-park-racecourse',
  'methven':'mt-harding-racecourse',
  'mt harding':'mt-harding-racecourse',
  'mt harding racecourse':'mt-harding-racecourse',
  'ashburton':'ashburton-raceway',
  'ashburton raceway':'ashburton-raceway',
  'addington':'addington-raceway',
  'addington raceway':'addington-raceway',
  'gore':'gore-raceway',
  'gore raceway':'gore-raceway',
  'ascot park':'ascot-park-racecourse',
});

function decodeHtml(value){
  return String(value??'')
    .replace(/&nbsp;|&#160;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&#039;|&apos;|&rsquo;/gi,"'")
    .replace(/&#x([0-9a-f]+);/gi,(_,code)=>String.fromCodePoint(Number.parseInt(code,16)))
    .replace(/&#(\d+);/g,(_,code)=>String.fromCodePoint(Number(code)));
}
function visibleText(value){
  return decodeHtml(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<br\s*\/?\s*>/gi,' ')
    .replace(/<\/(?:p|div|li|article|h\d)>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function fold(value){
  return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[’‘]/g,"'").toLowerCase().replace(/\s+/g,' ').trim();
}
function isoDate(year,month,day){
  const value=String(year)+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0');
  const d=new Date(value+'T00:00:00Z');
  return Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==value?null:value;
}
function plusDays(date,count){
  const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);
}
function inWindow(date,start,end){return (!start||date>=start)&&(!end||date<end);}
function normalizedVenue(value){return fold(value).replace(/[^\w]+/g,' ').replace(/\s+/g,' ').trim();}

function assertNztrUrl(sourceUrl,{index=false}={}){
  const url=new URL(sourceUrl);
  if(url.protocol!=='https:'||url.hostname.toLowerCase()!=='nztr.co.nz') throw new Error('NZTR evidence requires official nztr.co.nz');
  if(index){
    if(url.pathname.replace(/\/+$/,'')!=='/news') throw new Error('NZTR discovery requires official /news');
  }else if(!url.pathname.startsWith('/news/')) throw new Error('NZTR evidence requires an official news article');
}
function assertHrnzUrl(sourceUrl,{index=false}={}){
  const url=new URL(sourceUrl);
  if(url.protocol!=='https:'||!['hrnz.co.nz','www.hrnz.co.nz'].includes(url.hostname.toLowerCase())) throw new Error('HRNZ evidence requires official hrnz.co.nz');
  if(index){
    if(url.pathname.replace(/\/+$/,'')!=='/news') throw new Error('HRNZ discovery requires official /news/');
  }else if(!url.pathname.startsWith('/news/')) throw new Error('HRNZ evidence requires an official news article');
}

function discoverNewsArticles(html,{sourceUrl,authority,maxCandidates=40}){
  if(authority==='nztr') assertNztrUrl(sourceUrl,{index:true}); else assertHrnzUrl(sourceUrl,{index:true});
  const text=fold(visibleText(html));
  if(authority==='nztr'&&!text.includes('nztr')) throw new Error('NZTR news index fingerprint missing');
  if(authority==='hrnz'&&!text.includes('harness racing new zealand')) throw new Error('HRNZ news index fingerprint missing');
  const found=new Map();
  for(const match of String(html??'').matchAll(/href\s*=\s*(["'])([^"']*\/news\/[^"'?#]*)\1/gi)){
    let url;
    try{
      url=new URL(decodeHtml(match[2]),sourceUrl);
      if(authority==='nztr') assertNztrUrl(url.toString()); else assertHrnzUrl(url.toString());
    }catch{continue;}
    if(url.pathname.replace(/\/+$/,'')==='/news') continue;
    const slug=fold(url.pathname);
    const context=fold(visibleText(String(html).slice(Math.max(0,(match.index??0)-900),(match.index??0)+700)));
    if(!/(abandon|postpon|transfer|called-off|cancel|removed)/.test(slug+' '+context)) continue;
    if(!found.has(url.toString())) found.set(url.toString(),context.slice(0,1000));
    if(found.size>=maxCandidates) break;
  }
  return {article_urls:[...found.keys()],candidates:[...found].map(([url,context])=>({url,context}))};
}
export function discoverNztrNonRunningArticles(html,options={}){
  return discoverNewsArticles(html,{sourceUrl:options.sourceUrl??NZTR_NEWS_URL,authority:'nztr',maxCandidates:options.maxCandidates??40});
}
export function discoverHrnzNonRunningArticles(html,options={}){
  return discoverNewsArticles(html,{sourceUrl:options.sourceUrl??HRNZ_NEWS_URL,authority:'hrnz',maxCandidates:options.maxCandidates??40});
}

function publicationDate(text){
  const normalized=fold(text);
  let m=normalized.match(new RegExp('\\b('+MONTH_PATTERN+')\\s+(\\d{1,2}),\\s*(20\\d{2})\\b','i'));
  if(m) return isoDate(Number(m[3]),MONTHS[m[1]],Number(m[2]));
  m=normalized.match(new RegExp('\\b(\\d{1,2})\\s+('+MONTH_PATTERN+')\\s+(20\\d{2})\\s*,?\\s*news\\b','i'));
  if(m) return isoDate(Number(m[3]),MONTHS[m[2]],Number(m[1]));
  return null;
}
function monthDayInWindow(day,monthName,published,start,end){
  const month=MONTHS[fold(monthName)];
  if(!month) return null;
  const years=new Set();
  if(published){
    const y=Number(published.slice(0,4));years.add(y-1);years.add(y);years.add(y+1);
  }
  if(start){const y=Number(start.slice(0,4));years.add(y);years.add(y+1);}
  if(end){const y=Number(end.slice(0,4));years.add(y);years.add(y-1);}
  const values=[...years].map(year=>isoDate(year,month,Number(day))).filter(Boolean)
    .filter(date=>inWindow(date,start,end));
  return values.length===1?values[0]:null;
}
function relativeWeekdayDate(published,weekdayToken,start,end){
  if(!published) return null;
  const target=WEEKDAYS[fold(weekdayToken)];
  if(target===undefined) return null;
  const base=new Date(published+'T00:00:00Z');
  const delta=(target-base.getUTCDay()+7)%7;
  const candidate=plusDays(published,delta);
  return inWindow(candidate,start,end)?candidate:null;
}
function evidencePhrase(text,needles){
  const normalized=fold(text);let pos=-1;
  for(const needle of needles){const i=normalized.indexOf(needle);if(i>=0&&(pos<0||i<pos)) pos=i;}
  return pos<0?text.slice(0,700):text.slice(Math.max(0,pos-150),Math.min(text.length,pos+900)).trim();
}
function nztrRacecourse(label){return resolveNewZealandRacecourseId(String(label??'').trim());}
function hrnzRacecourse(label){
  const key=normalizedVenue(label);
  return HRNZ_VENUE_ALIASES[key]??resolveNewZealandRacecourseId(label);
}

export function parseNztrNonRunningArticle(html,options={}){
  const sourceUrl=options.sourceUrl;
  const start=options.startDate??null;const end=options.endDateExclusive??null;
  if(!sourceUrl) throw new Error('NZTR sourceUrl is required');assertNztrUrl(sourceUrl);
  const text=visibleText(html);const normalized=fold(text);
  if(!normalized.includes('nztr')&&!normalized.includes('new zealand thoroughbred racing')) throw new Error('NZTR article fingerprint missing');
  const published=publicationDate(text);

  if(/following a slip in the first race/.test(normalized)||/abandoned after race\s*1\b/.test(normalized)||/partial abandon/.test(normalized)){
    return {evidence:[],diagnostics:{disposition:'rejected_partial_or_in_progress_abandonment'}};
  }

  let m=normalized.match(new RegExp("\\b([a-z][a-z' -]{2,70}?)\\s+(?:synthetic\\s+)?meeting scheduled for\\s+(?:"+WEEKDAY_PATTERN+"\\s+)?(\\d{1,2})\\s+("+MONTH_PATTERN+")\\s+has been removed from the racing calendar\\b",'i'));
  if(m){
    const date=monthDayInWindow(m[2],m[3],published,start,end);
    if(!date) return {evidence:[],diagnostics:{disposition:'original_meeting_date_unresolved'}};
    const venue=m[1].replace(/^the\s+/,'').trim();
    return {evidence:[{
      authority_id:'new-zealand-thoroughbred-racing',racing_system_id:'new-zealand-thoroughbred-system',
      meeting_prefix:'new-zealand-thoroughbred',date,venue_label:venue,racecourse_id:nztrRacecourse(venue),
      source_id:NZTR_NON_RUNNING_SOURCE_ID,official_source_url:sourceUrl,replacement_date:null,
      evidence_phrase:evidencePhrase(text,['removed from the racing calendar']),
    }],diagnostics:{disposition:'accepted_future_meeting_removal',date,venue_label:venue}};
  }

  m=normalized.match(new RegExp("\\brace meeting scheduled to be held at\\s+(.+?)\\s+on\\s+("+MONTH_PATTERN+")\\s+(\\d{1,2})(?:st|nd|rd|th)?\\s+is moving to\\s+(.+?)(?:\\.|,|\\s+following\\b)",'i'));
  if(m){
    const date=monthDayInWindow(m[3],m[2],published,start,end);
    if(!date) return {evidence:[],diagnostics:{disposition:'original_meeting_date_unresolved'}};
    const venue=m[1].trim();const replacement=m[4].trim();
    return {evidence:[{
      authority_id:'new-zealand-thoroughbred-racing',racing_system_id:'new-zealand-thoroughbred-system',
      meeting_prefix:'new-zealand-thoroughbred',date,venue_label:venue,racecourse_id:nztrRacecourse(venue),
      replacement_venue_label:replacement,replacement_racecourse_id:nztrRacecourse(replacement),replacement_date:date,
      source_id:NZTR_NON_RUNNING_SOURCE_ID,official_source_url:sourceUrl,
      evidence_phrase:evidencePhrase(text,['meeting transferred','is moving to']),
    }],diagnostics:{disposition:'accepted_whole_meeting_transfer',date,venue_label:venue,replacement_venue_label:replacement}};
  }

  return {evidence:[],diagnostics:{disposition:'not_supported_explicit_future_non_running'}};
}

export function parseHrnzNonRunningArticle(html,options={}){
  const sourceUrl=options.sourceUrl;
  const start=options.startDate??null;const end=options.endDateExclusive??null;
  if(!sourceUrl) throw new Error('HRNZ sourceUrl is required');assertHrnzUrl(sourceUrl);
  const text=visibleText(html);const normalized=fold(text);
  if(!normalized.includes('harness racing new zealand')) throw new Error('HRNZ article fingerprint missing');
  const published=publicationDate(text);

  let m=normalized.match(new RegExp("\\b("+WEEKDAY_PATTERN+")'s\\s+([a-z][a-z' -]{2,60}?)\\s+meeting postponed until\\s+("+WEEKDAY_PATTERN+")\\b",'i'));
  if(m){
    const date=relativeWeekdayDate(published,m[1],start,end);
    if(!date) return {evidence:[],diagnostics:{disposition:'original_meeting_date_unresolved'}};
    const replacement=relativeWeekdayDate(date,m[3],null,null);
    const venue=m[2].trim();
    return {evidence:[{
      authority_id:'harness-racing-new-zealand',racing_system_id:'new-zealand-harness-system',
      meeting_prefix:'new-zealand-harness',date,venue_label:venue,racecourse_id:hrnzRacecourse(venue),
      replacement_date:replacement,source_id:HRNZ_NON_RUNNING_SOURCE_ID,official_source_url:sourceUrl,
      evidence_phrase:evidencePhrase(text,['meeting postponed']),
    }],diagnostics:{disposition:'accepted_whole_meeting_postponement',date,venue_label:venue,replacement_date:replacement}};
  }

  m=normalized.match(new RegExp("\\b("+WEEKDAY_PATTERN+")'s scheduled meeting at\\s+(.+?)\\s+will now be held\\s+(?:on\\s+the\\s+.+?\\s+)?at\\s+(.+?)(?:\\.|,|\\s+the decision\\b)",'i'));
  if(m){
    const date=relativeWeekdayDate(published,m[1],start,end);
    if(!date) return {evidence:[],diagnostics:{disposition:'original_meeting_date_unresolved'}};
    const venue=m[2].trim();const replacement=m[3].trim();
    return {evidence:[{
      authority_id:'harness-racing-new-zealand',racing_system_id:'new-zealand-harness-system',
      meeting_prefix:'new-zealand-harness',date,venue_label:venue,racecourse_id:hrnzRacecourse(venue),
      replacement_venue_label:replacement,replacement_racecourse_id:hrnzRacecourse(replacement),replacement_date:date,
      source_id:HRNZ_NON_RUNNING_SOURCE_ID,official_source_url:sourceUrl,
      evidence_phrase:evidencePhrase(text,['meeting transferred','will now be held']),
    }],diagnostics:{disposition:'accepted_whole_meeting_transfer',date,venue_label:venue,replacement_venue_label:replacement}};
  }

  m=normalized.match(new RegExp("\\b([a-z][a-z' -]{2,60}?)'s\\s+("+WEEKDAY_PATTERN+")\\s+meeting called off\\b",'i'));
  if(m&&/\bcancel the meeting\b/.test(normalized)){
    const date=relativeWeekdayDate(published,m[2],start,end);
    if(!date) return {evidence:[],diagnostics:{disposition:'original_meeting_date_unresolved'}};
    const venue=m[1].trim();
    return {evidence:[{
      authority_id:'harness-racing-new-zealand',racing_system_id:'new-zealand-harness-system',
      meeting_prefix:'new-zealand-harness',date,venue_label:venue,racecourse_id:hrnzRacecourse(venue),
      replacement_date:null,source_id:HRNZ_NON_RUNNING_SOURCE_ID,official_source_url:sourceUrl,
      evidence_phrase:evidencePhrase(text,['meeting called off','cancel the meeting']),
    }],diagnostics:{disposition:'accepted_whole_meeting_cancellation',date,venue_label:venue}};
  }

  return {evidence:[],diagnostics:{disposition:'not_supported_explicit_future_non_running'}};
}

function dedupeEvidence(items){
  const map=new Map();
  for(const item of items){
    const key=item.racing_system_id+'/'+item.date+'/'+item.racecourse_id;
    const prev=map.get(key);if(!prev||(!prev.replacement_date&&item.replacement_date)) map.set(key,item);
  }
  return [...map.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.racecourse_id.localeCompare(b.racecourse_id));
}
export function bindNewZealandNonRunningEvidence(options){
  const evidence=options.evidence;const canonicalMeetings=options.canonicalMeetings;
  const checkedAt=options.checkedAt??new Date().toISOString();
  if(!Array.isArray(evidence)||!Array.isArray(canonicalMeetings)) throw new Error('New Zealand evidence and canonicalMeetings must be arrays');
  const checked=new Date(checkedAt);if(Number.isNaN(checked.getTime())) throw new Error('checkedAt must be ISO date-time');
  const meetingPresenceRecords=[];const skipped=[];
  for(const item of dedupeEvidence(evidence)){
    const matches=canonicalMeetings.filter(row=>
      row?.country_id==='new-zealand'&&row?.authority_id===item.authority_id&&row?.racing_system_id===item.racing_system_id
      &&row?.racecourse_id===item.racecourse_id&&row?.date===item.date);
    const unique=[...new Map(matches.map(row=>[row.meeting_id,row])).values()];
    if(unique.length!==1){
      skipped.push({racing_system_id:item.racing_system_id,date:item.date,racecourse_id:item.racecourse_id,
        reason:unique.length===0?'canonical_binding_missing':'canonical_binding_ambiguous',match_count:unique.length});
      continue;
    }
    const meeting=unique[0];
    const expected=item.meeting_prefix+'-'+item.racecourse_id+'-'+item.date;
    if(meeting.meeting_id!==expected){
      skipped.push({racing_system_id:item.racing_system_id,date:item.date,racecourse_id:item.racecourse_id,
        reason:'canonical_meeting_id_mismatch',meeting_id:meeting.meeting_id,expected_meeting_id:expected});
      continue;
    }
    meetingPresenceRecords.push({
      meeting_id:meeting.meeting_id,country_id:'new-zealand',authority_id:item.authority_id,racecourse_id:item.racecourse_id,date:item.date,
      state:'confirmed_non_running',scope:'whole_meeting',evidence_type:'official_explicit_non_running',
      source_id:item.source_id,official_source_url:item.official_source_url,checked_at:checked.toISOString(),evidence_phrase:item.evidence_phrase,
    });
  }
  return {meeting_presence_records:meetingPresenceRecords,diagnostics:{skipped}};
}
