import { resolveBhaRacecourseId } from './united-kingdom-bha-core.mjs';

export const BHA_NON_RUNNING_SOURCE_ID='bha-press-release-explicit-non-running';
export const BHA_PRESS_RELEASES_URL='https://www.britishhorseracing.com/press_releases/';

const MONTHS={jan:1,january:1,feb:2,february:2,mar:3,march:3,apr:4,april:4,may:5,jun:6,june:6,jul:7,july:7,aug:8,august:8,sep:9,sept:9,september:9,oct:10,october:10,nov:11,november:11,dec:12,december:12};
const MONTH_PATTERN=Object.keys(MONTHS).join('|');
const WEEKDAYS=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

function decodeHtml(v){return String(v??'')
  .replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"')
  .replace(/&#39;|&apos;|&rsquo;/gi,"'")
  .replace(/&#x([0-9a-f]+);/gi,(_,x)=>String.fromCodePoint(Number.parseInt(x,16)))
  .replace(/&#(\d+);/g,(_,x)=>String.fromCodePoint(Number(x)));}
function textOf(v){return decodeHtml(v).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
function fold(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").toLowerCase().replace(/\s+/g,' ').trim();}
function iso(y,m,d){const s=String(y)+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');const x=new Date(s+'T00:00:00Z');return !Number.isNaN(x.getTime())&&x.toISOString().slice(0,10)===s?s:null;}
function inWindow(date,start,end){return (!start||date>=start)&&(!end||date<end);}
function dateFrom(day,month,year){return iso(Number(year),MONTHS[fold(month)],Number(day));}
function publicationDate(text){
  const rx=new RegExp('\\b(\\d{1,2})\\s+('+MONTH_PATTERN+')\\s+(20\\d{2})\\s+(?:bha|racing\\/fixtures)\\b','i');
  const m=fold(text).match(rx);return m?dateFrom(m[1],m[2],m[3]):null;
}
function nextWeekday(base,weekday){
  if(!base)return null;const target=WEEKDAYS.indexOf(fold(weekday));if(target<0)return null;
  const d=new Date(base+'T00:00:00Z');let delta=(target-d.getUTCDay()+7)%7;if(delta===0)delta=7;d.setUTCDate(d.getUTCDate()+delta);return d.toISOString().slice(0,10);
}
function assertBha(url,{index=false}={}){
  const u=new URL(url);if(u.protocol!=='https:'||u.hostname.toLowerCase()!=='www.britishhorseracing.com')throw new Error('BHA evidence requires official britishhorseracing.com');
  if(index){if(u.pathname.replace(/\/+$/,'')!=='/press_releases')throw new Error('BHA discovery requires press releases index');}
  else if(!u.pathname.startsWith('/press_releases/'))throw new Error('BHA evidence requires press release article');
}
function phrase(text,needle){const n=fold(text),i=n.indexOf(needle);return i<0?text.slice(0,700):text.slice(Math.max(0,i-180),Math.min(text.length,i+1000)).trim();}

export function discoverBhaNonRunningArticles(html,{sourceUrl=BHA_PRESS_RELEASES_URL,maxCandidates=60}={}){
  assertBha(sourceUrl,{index:true});const visible=fold(textOf(html));
  if(!visible.includes('british horseracing authority')&&!visible.includes('press releases'))throw new Error('BHA press releases fingerprint missing');
  const found=new Map();
  for(const m of String(html??'').matchAll(/href\s*=\s*["']([^"']*\/press_releases\/[^"'?#]+)["']/gi)){
    let u;try{u=new URL(decodeHtml(m[1]),sourceUrl);assertBha(u.toString());}catch{continue;}
    const slug=fold(u.pathname);if(!/(abandon|transfer|cancel|postpon)/.test(slug))continue;
    if(!found.has(u.toString()))found.set(u.toString(),textOf(String(html).slice(Math.max(0,(m.index??0)-1000),(m.index??0)+800)).slice(0,1200));
    if(found.size>=maxCandidates)break;
  }
  return {article_urls:[...found.keys()],candidates:[...found].map(([url,context])=>({url,context}))};
}

function partialRaceOnly(n){
  return /\bsteeple chases?\b/.test(n)
    || /\b(?:two|three|four|five|six|\d+)\s+(?:races?|chases?|hurdles?)\b[\s\S]{0,100}\babandoned\b/.test(n)
    || /\bfixture (?:now )?will consist of\b/.test(n);
}
function makeEvidence({date,venue,replacementVenue=null,sourceUrl,text,kind}){
  return {
    authority_id:'british-horseracing-authority',racing_system_id:'united-kingdom-bha-system',meeting_prefix:'bha',
    date,venue_label:venue,racecourse_id:resolveBhaRacecourseId(venue),
    replacement_venue_label:replacementVenue,replacement_racecourse_id:replacementVenue?resolveBhaRacecourseId(replacementVenue):null,
    replacement_date:replacementVenue?date:null,source_id:BHA_NON_RUNNING_SOURCE_ID,official_source_url:sourceUrl,
    evidence_phrase:phrase(text,kind==='transfer'?'transferred':kind==='cancel'?'cancelled':'abandoned'),
  };
}

export function parseBhaNonRunningArticle(html,{sourceUrl,startDate=null,endDateExclusive=null}={}){
  if(!sourceUrl)throw new Error('BHA article sourceUrl required');assertBha(sourceUrl);
  const text=textOf(html),n=fold(text);
  if(!n.includes('british horseracing authority')&&!n.includes('bha'))throw new Error('BHA article authority fingerprint missing');
  if(partialRaceOnly(n))return {evidence:[],diagnostics:{disposition:'rejected_partial_race_scope'}};
  const published=publicationDate(text);

  if(/\babandonment of four fixtures\b/.test(n)&&/\bhave been abandoned\b/.test(n)){
    const venues=['Kempton Park','Salisbury','Worcester','Ffos Las'].filter(v=>n.includes(fold(v)));
    const weekday=n.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)'s fixtures\b/)?.[1];
    const date=weekday?nextWeekday(published,weekday):null;
    if(venues.length===4&&date&&inWindow(date,startDate,endDateExclusive)){
      return {evidence:venues.map(venue=>makeEvidence({date,venue,sourceUrl,text,kind:'abandon'})),
        diagnostics:{disposition:'accepted_whole_fixture_abandonment',date,venue_labels:venues}};
    }
    if(date&&!inWindow(date,startDate,endDateExclusive))return {evidence:[],diagnostics:{disposition:'outside_window',date}};
  }

  if(/\bfixtures scheduled to take place at chelmsford city racecourse\b/.test(n)&&/\bhave been transferred\b/.test(n)){
    const year=published?Number(published.slice(0,4)):null;const rows=[];
    const currentRx=new RegExp("\\bhave been transferred to\\s+([a-z][a-z -]{2,50})[.]?\\s+the fixtures are scheduled for (?:the )?evenings? of\\s+(\\d{1,2})\\s+("+MONTH_PATTERN+")\\s+and\\s+(\\d{1,2})\\s+("+MONTH_PATTERN+")\\s+and will remain on the same date\\b",'i');
    const singleReplacement=n.match(currentRx);
    if(year&&singleReplacement){
      for(const [day,month] of [[singleReplacement[2],singleReplacement[3]],[singleReplacement[4],singleReplacement[5]]]){
        const date=dateFrom(day,month,year);
        if(date&&inWindow(date,startDate,endDateExclusive))rows.push(makeEvidence({date,venue:'Chelmsford City',replacementVenue:singleReplacement[1].trim(),sourceUrl,text,kind:'transfer'}));
      }
    }
    if(year){
      const rx=new RegExp('\\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\\s+(\\d{1,2})\\s+('+MONTH_PATTERN+')\\s+[–—-]\\s+([a-z][a-z -]{2,50}?)(?=\\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\\s+\\d|\\s+the race programmes|$)','gi');
      for(const m of n.matchAll(rx)){
        const date=dateFrom(m[1],m[2],year);if(date&&inWindow(date,startDate,endDateExclusive))rows.push(makeEvidence({date,venue:'Chelmsford City',replacementVenue:m[3].trim(),sourceUrl,text,kind:'transfer'}));
      }
      const cancel=n.match(/\bfixture on (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+will be cancelled and will not be replaced\b/i);
      if(cancel){const date=dateFrom(cancel[1],cancel[2],year);if(date&&inWindow(date,startDate,endDateExclusive))rows.push(makeEvidence({date,venue:'Chelmsford City',sourceUrl,text,kind:'cancel'}));}
    }
    if(rows.length)return {evidence:rows,diagnostics:{disposition:'accepted_whole_fixture_transfer_or_cancel',record_count:rows.length}};
  }

  return {evidence:[],diagnostics:{disposition:'not_supported_explicit_whole_fixture_non_running'}};
}

export function bindBhaNonRunningEvidence({evidence:items,canonicalMeetings,checkedAt=new Date().toISOString()}){
  if(!Array.isArray(items)||!Array.isArray(canonicalMeetings))throw new Error('BHA evidence and canonicalMeetings must be arrays');
  const checked=new Date(checkedAt);if(Number.isNaN(checked.getTime()))throw new Error('BHA checkedAt must be ISO');
  const records=[],skipped=[],seen=new Set();
  for(const item of items){
    const key=item.date+'/'+item.racecourse_id;if(seen.has(key))continue;seen.add(key);
    const matches=canonicalMeetings.filter(r=>r?.country_id==='united-kingdom'&&r?.authority_id==='british-horseracing-authority'&&r?.racing_system_id==='united-kingdom-bha-system'&&r?.racecourse_id===item.racecourse_id&&r?.date===item.date);
    const unique=[...new Map(matches.map(r=>[r.meeting_id,r])).values()];
    if(unique.length!==1){skipped.push({date:item.date,racecourse_id:item.racecourse_id,reason:unique.length?'canonical_binding_ambiguous':'canonical_binding_missing',match_count:unique.length});continue;}
    const expected='bha-'+item.racecourse_id+'-'+item.date;if(unique[0].meeting_id!==expected){skipped.push({date:item.date,racecourse_id:item.racecourse_id,reason:'canonical_meeting_id_mismatch',meeting_id:unique[0].meeting_id,expected_meeting_id:expected});continue;}
    records.push({meeting_id:expected,country_id:'united-kingdom',authority_id:'british-horseracing-authority',racecourse_id:item.racecourse_id,date:item.date,state:'confirmed_non_running',scope:'whole_meeting',evidence_type:'official_explicit_non_running',source_id:item.source_id,official_source_url:item.official_source_url,checked_at:checked.toISOString(),evidence_phrase:item.evidence_phrase});
  }
  return {meeting_presence_records:records,diagnostics:{skipped}};
}
