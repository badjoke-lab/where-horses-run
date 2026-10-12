// Read-only verification of actual main data and deployed web Calendar.
// Distinguishes registered source route, published JSON, and end-user HTML.
// No service tokens, no filesystem writes, no publication.
const base = 'https://raw.githubusercontent.com/badjoke-lab/where-horses-run/main/';
const sources = [
  ['main_public_json',base+'data/generated/timetable/public/meeting-list.json'],
  ['calendar_en','https://whr.badjoke-lab.com/calendar/?date=2026-10-16'],
  ['calendar_ja','https://whr.badjoke-lab.com/ja/calendar/?date=2026-10-17'],
];
const observations=[];
const expected=[
  {date:'2026-10-16',country:'united-states',venue:'united-states--meadowlands-racetrack',system:'us-nj-meadowlands-thoroughbred-turf-2026-system'},
  {date:'2026-10-17',country:'united-states',venue:'united-states--far-hills-moorland-farm',system:'us-nj-far-hills-steeplechase-2026-system'},
];
for (const [id,url] of sources) {
  try {
    const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'WhereHorsesRun/1.0 live-publication-diagnostic (+https://github.com/badjoke-lab/where-horses-run)','accept':'application/json,text/html;q=0.9'},signal:AbortSignal.timeout(25000)});
    if(!r.ok)throw Error('HTTP '+r.status);
    const data=await r.text();
    if(data.length>16_000_000)throw Error('response exceeded diagnostic cap');
    if(id==='main_public_json'){
      const json=JSON.parse(data);
      const meetings=Array.isArray(json.meetings)?json.meetings:[];
      const us=meetings.filter(x=>x.country_id==='united-states');
      const hit=expected.map(x=>({date:x.date,venue:x.venue,match:us.some(m=>m.date===x.date&&m.racecourse_id===x.venue),matching_ids:us.filter(m=>m.date===x.date&&m.racecourse_id===x.venue).map(m=>m.meeting_id)}));
      observations.push({id,status:'reachable',http:r.status,generated_at:json.generated_at??null,meeting_count:meetings.length,us_meeting_count:us.length,expected:hit,main_data_published:hit.every(x=>x.match)});
    }else {
      const matchIds=[...data.matchAll(/us-njrc-(?:meadowlands_turf|far_hills_steeplechase)-2026-10-(?:16|17)/g)].map(x=>x[0]);
      observations.push({id,status:'reachable',http:r.status,html_bytes:data.length,has_calendar_title:/horse racing calendar|競馬カレンダー/i.test(data),has_oct16: data.includes('2026-10-16'),has_oct17:data.includes('2026-10-17'),us_nj_ids:[...new Set(matchIds)].slice(0,10),nj_live_html_visible:matchIds.length>0});
    }
  }catch(e){observations.push({id,status:'unavailable_or_unparseable',error:String(e.message||e),main_data_published:false});}
}
console.log('WHR_NJRC_LIVE_PUBLICATION_DIAGNOSTIC '+JSON.stringify({checked_at:new Date().toISOString(),expected,observations}));
const data=observations.find(x=>x.id==='main_public_json');
if(data?.status!=='reachable')throw Error('Unable to inspect actual main public meeting-list.json');
if(!data.main_data_published)throw Error('New Jersey source registered but main public JSON lacks one or both upcoming NJRC 2026 meeting records');
if(observations.filter(x=>x.id!=='main_public_json').some(x=>x.status!=='reachable'))throw Error('At least one deployed Calendar language route not reachable from GitHub Actions');
if(observations.filter(x=>x.id!=='main_public_json').some(x=>!x.nj_live_html_visible))throw Error('Main public JSON contains NJRC dates but deployed Calendar page does not show NJRC meeting IDs');
console.log('WHR_NJRC_LIVE_PUBLICATION_CHECK: PASS');
