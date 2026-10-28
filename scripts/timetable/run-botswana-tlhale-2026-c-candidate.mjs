/**
 * Botswana Tlhale 2026 public event notice: scoped C discovery candidate.
 * Read only minimal metadata from the event's ticketing page.
 * Never treat it as the organiser or a verified physical racecourse.
 * No racecard/ticket/private transaction access. No canonical/public writes.
 */
import fs from 'node:fs';
import path from 'node:path';
const EVENT_URL='https://tickito.thevoicebw.com/events/tlhale-horse-racing-competition/';
const UA='WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)';
const EVENT_DATE='2026-10-31';
function strip(html){
 return String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
  .replace(/<[^>]*>/g,' ').replace(/&(?:nbsp|#160);/gi,' ')
  .replace(/&#0*39;|&#8217;|&#x2019;|&rsquo;|&apos;/gi,"'")
  .replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();
}
function signals(html,indexHtml='',asOf='2026-10-29'){
 const visible=strip(html),index=strip(indexHtml);
 const named=/Tlhale\s+Horse\s+Racing\s+Competition/i.test(visible);
 const farm=/Nyelex[\s'’\u2019]*Farm/i.test(visible);
 const bodyYear=/(?:2026-10-31|2026\/10\/31|Oct(?:ober)?\s+31,?\s*2026|31\s+Oct(?:ober)?\s+2026)/i.test(html);
 const summaryDay=/Oct(?:ober)?\s+31/i.test(visible);
 // The event detail omits the year in display text. Resolve it only from a
 // SAME-PUBLISHER current "Upcoming Events" index plus Saturday/day/venue.
 // This is a contextual year resolution, never an "explicit" source year.
 const indexMatched=/Tlhale\s+Horse\s+Racing\s+Competition/i.test(index)
  &&/Nyelex[\s'’\u2019]*Farm/i.test(index)
  &&/Saturday\s+31\s+Oct/i.test(index);
 const contextYear=!bodyYear&&indexMatched&&asOf>='2026-10-28'&&asOf<='2026-10-31';
 const promoterMissing=/Promoter\s+Not\s+provided/i.test(visible);
 return {event_title_match:named,venue_label_match:farm,
  year_explicit_in_event_page:bodyYear,year_resolved_from_same_publisher_index:contextYear,
  index_event_match:indexMatched,day_label_match:summaryDay,
  promoter_missing:promoterMissing,
  date:(bodyYear||contextYear)&&summaryDay&&named&&farm?EVENT_DATE:null,
  venue_label:farm?"Nyelex' Farm":null};
}
function denied(robots,url){
 const target=new URL(url).pathname;let groups=[],group={agents:[],rules:[]};
 const flush=()=>{if(group.agents.length)groups.push(group);group={agents:[],rules:[]};};
 for(const raw of robots.split(/\r?\n/)){
  const s=raw.replace(/#.*$/,'').trim();if(!s)continue;
  let m=s.match(/^User-agent:\s*(.+)$/i);
  if(m){if(group.rules.length)flush();group.agents.push(m[1].trim().toLowerCase());continue;}
  m=s.match(/^(Allow|Disallow):\s*(.*)$/i);
  if(m&&group.agents.length)group.rules.push({kind:m[1].toLowerCase(),value:m[2].trim()});
 }
 flush();
 const matched=groups.filter(g=>g.agents.some(a=>a==='*'||UA.toLowerCase().includes(a)))
  .flatMap(g=>g.rules).filter(x=>x.value&&target.startsWith(x.value))
  .sort((a,b)=>b.value.length-a.value.length||(a.kind==='disallow'?-1:1));
 return matched.length>0&&matched[0].kind==='disallow';
}
async function read(url,max=900000){
 const res=await fetch(url,{redirect:'manual',headers:{'user-agent':UA,'accept':'text/html,text/plain;q=0.9'},signal:AbortSignal.timeout(15000)});
 if(res.status!==200)return {status:'http_'+res.status};
 if(new URL(res.url).origin!==new URL(url).origin)return {status:'unexpected_redirect'};
 if(!/^text\/(?:html|plain)\b/i.test(res.headers.get('content-type')||''))return {status:'non_html'};
 if(Number(res.headers.get('content-length')||0)>max)return {status:'size_exceeded'};
 const body=await res.text();
 if(body.length>max)return {status:'size_exceeded'};
 return {status:'ok',body};
}
function horizon(asOf,days){
 const d=new Date(asOf+'T00:00:00Z');
 if(!Number.isInteger(days)||days<1||days>120||Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==asOf)throw Error('invalid horizon');
 d.setUTCDate(d.getUTCDate()+days);
 return EVENT_DATE>=asOf&&EVENT_DATE<d.toISOString().slice(0,10);
}
function selfTest(){
 const good='<h1>Tlhale Horse Racing Competition</h1><p>Start Oct 31 at 8:00 am</p><p>Venue Nyelex’ Farm</p><script type="application/ld+json">{"startDate":"2026-10-31T08:00:00+02:00"}</script><p>Promoter Not provided</p>';
 const s=signals(good);
 if(!s.date||!s.promoter_missing||!s.venue_label_match)throw Error('positive');
 if(signals(good.replace('2026-10-31','2025-10-31')).date)throw Error('year guard');
 if(signals(good.replace('Nyelex’ Farm','Unknown Venue')).date)throw Error('venue guard');
 if(!denied('User-agent: *\nDisallow: /events/','https://tickito.thevoicebw.com/events/example'))throw Error('robots deny');
 if(denied('User-agent: *\nDisallow: /private/','https://tickito.thevoicebw.com/events/example'))throw Error('robots allow');
 const inferred=signals(good.replace('2026-10-31','year-hidden'),
  '<h2>Upcoming Events</h2><p>Saturday 31 Oct Nyelex&#8217; Farm Tlhale Horse Racing Competition</p>','2026-10-29');
 if(!inferred.date||!inferred.year_resolved_from_same_publisher_index)throw Error('upcoming index year resolution');
 if(signals(good.replace('2026-10-31','year-hidden'),'', '2026-10-29').date)throw Error('unconfirmed year');
 if(signals(good.replace('2026-10-31','year-hidden'),'<p>Saturday 31 Oct Nyelex Farm Tlhale Horse Racing Competition</p>','2027-10-29').date)throw Error('wrong year');
 if(!horizon('2026-10-29',3)||horizon('2026-11-01',30))throw Error('no stale/future inference');
 console.log('BOTSWANA_TLHALE_C_CANDIDATE_TEST_PASS');
}
if(process.argv.includes('--self-test'))selfTest();
else {
 const asOf=process.argv.find(x=>x.startsWith('--as-of='))?.split('=')[1]||
  new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Gaborone',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const days=Number(process.argv.find(x=>x.startsWith('--days='))?.split('=')[1]||'30');
 const inWindow=horizon(asOf,days);
 let source_status='not_checked',robot_status='not_checked',data=null,reason=null;
 try{
  const robot=await read('https://tickito.thevoicebw.com/robots.txt',170000);
  robot_status=robot.status;
  if(robot.status!=='ok'&&robot.status!=='http_404')throw Error('robots_'+robot.status);
  if(robot.status==='ok'&&denied(robot.body,EVENT_URL))throw Error('robots_disallow');
  const page=await read(EVENT_URL);
  source_status=page.status;
  if(page.status!=='ok')throw Error('event_'+page.status);
  const listing=await read('https://tickito.thevoicebw.com/',650000);
  if(listing.status!=='ok')throw Error('listing_'+listing.status);
  data=signals(page.body,listing.body,asOf);
  if(!data.date)reason='date_venue_title_or_year_not_source_confirmed';
 }catch(e){reason=String(e.message||e).slice(0,130);source_status='not_usable';}
 const report={
  checked_at:new Date().toISOString(),country_id:'botswana',source_url:EVENT_URL,
  source_type:'independent_ticketing_notice_not_organiser',
  source_status,robots_status:robot_status,
  scope:'One Tlhale horse-racing event only. Not Kokotsha / Botswana nationwide.',
  date:EVENT_DATE,source_evidence:data,event_in_requested_window:inWindow,
  source_positive:!!data?.date,
  candidate_date_venue:inWindow&&data?.date?{date:data.date,venue_label:data.venue_label}:null,
  promoter_identity_verified:false,physical_racecourse_id_verified:false,
  rights_status:'REVIEW_REQUIRED',
  potential_publish_fields:['date','physical_venue_only_after_normalisation'],
  release_ready:false,production_routing:false,canonical_writes:false,public_writes:false,
  raw_source_retained:false,blocker:reason||'promoter, physical venue identity and source-specific publication rights not verified'
 };
 const dest=process.argv.find(x=>x.startsWith('--output='))?.slice('--output='.length);
 if(dest){fs.mkdirSync(path.dirname(path.resolve(dest)),{recursive:true});fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');}
 console.log('BOTSWANA_TLHALE_C_CANDIDATE '+JSON.stringify(report));
 if(source_status!=='ok'||!data?.date)process.exitCode=2;
}
