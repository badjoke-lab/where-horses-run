// Read-only current MAIN and deployed Calendar publication check for AGCO 2026.
// This is a dated one-shot release diagnostic, not a permanent scheduled requirement.
const origin='https://raw.githubusercontent.com/badjoke-lab/where-horses-run/main/data/generated/timetable/public/meeting-list.json';
const pages=[
 ['en','https://whr.badjoke-lab.com/calendar/?date=2026-10-19'],
 ['ja','https://whr.badjoke-lab.com/ja/calendar/?date=2026-10-21'],
];
const sourceSystems=[
 {key:'woodbine_thoroughbred',system_id:'canada-ontario-woodbine-thoroughbred-system',venue_id:'canada--woodbine-racetrack'},
 {key:'fort_erie_thoroughbred',system_id:'canada-ontario-fort-erie-thoroughbred-system',venue_id:'canada--fort-erie-race-track'},
 {key:'ajax_quarter_horse',system_id:'canada-ontario-ajax-quarter-horse-system',venue_id:'canada--ajax-downs'},
];
async function fetchText(url,accept){
 const r=await fetch(url,{headers:{'user-agent':'WhereHorsesRun/1.0 own-site-publication-check (+https://github.com/badjoke-lab/where-horses-run)','accept':accept},redirect:'follow',signal:AbortSignal.timeout(25000)});
 if(!r.ok)throw Error('HTTP '+r.status+' '+url);
 return {body:await r.text(),http:r.status,url:r.url};
}
const diagnostics={checked_at:new Date().toISOString(),source:'current main + deployed site',main:null,deployed:[],overall:'unverified'};
try{
 const file=await fetchText(origin,'application/json');
 const json=JSON.parse(file.body),rows=Array.isArray(json.meetings)?json.meetings:[];
 const ontario=sourceSystems.map(s=>{
   const matched=rows.filter(m=>m.country_id==='canada'&&m.racing_system_id===s.system_id&&m.racecourse_id===s.venue_id);
   return {key:s.key,system_id:s.system_id,venue_id:s.venue_id,published_count:matched.length,
     future_dates:matched.filter(m=>m.date>='2026-10-12').map(m=>m.date).sort().slice(0,55),
     example_ids:matched.map(m=>m.meeting_id).slice(0,4)};
 });
 diagnostics.main={http:file.http,generated_at:json.generated_at,total_meetings:rows.length,canada_meetings:rows.filter(m=>m.country_id==='canada').length,ontario};
 for(const [lang,url] of pages){
   const x=await fetchText(url,'text/html');
   diagnostics.deployed.push({lang,http:x.http,html_size:x.body.length,by_source:sourceSystems.map(s=>{
     const token='canada-agco-'+s.key+'-';
     return {key:s.key,id_visible:x.body.includes(token)};
   })});
 }
 diagnostics.overall=ontario.every(x=>x.published_count>0)&&diagnostics.deployed.every(x=>x.by_source.every(y=>y.id_visible))?'published':'not_yet_confirmed';
}catch(e){diagnostics.error=String(e?.message??e);diagnostics.overall='probe_error';}
console.log('CANADA_ONTARIO_THREE_MAIN_LIVE_CHECK '+JSON.stringify(diagnostics));
if(diagnostics.overall!=='published')process.exitCode=1;
