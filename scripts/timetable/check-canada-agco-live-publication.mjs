// Read-only real production audit: main JSON vs deployed EN/JA Calendar.
// One-time probe anchored to 2026-10-16 and 2026-10-17, not a recurring permanent test.
const pages=[
 ['main-json','https://raw.githubusercontent.com/badjoke-lab/where-horses-run/main/data/generated/timetable/public/meeting-list.json'],
 ['en','https://whr.badjoke-lab.com/calendar/?date=2026-10-16'],
 ['ja','https://whr.badjoke-lab.com/ja/calendar/?date=2026-10-17'],
];
const need=[
 {country_id:'canada',date:'2026-10-16',racecourse_id:'canada--woodbine-mohawk-park',meeting_id:'canada-mohawk-2026-10-16'},
 {country_id:'canada',date:'2026-10-17',racecourse_id:'canada--woodbine-mohawk-park',meeting_id:'canada-mohawk-2026-10-17'},
 {country_id:'united-states',date:'2026-10-16',racecourse_id:'united-states--meadowlands-racetrack',meeting_id:'us-njrc-meadowlands_turf-2026-10-16'},
 {country_id:'united-states',date:'2026-10-17',racecourse_id:'united-states--far-hills-moorland-farm',meeting_id:'us-njrc-far_hills_steeplechase-2026-10-17'}
];
const observed=[];
for(const [id,url] of pages){
  try{
    const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'WhereHorsesRun/1.0 verify-owned-calendar (+https://github.com/badjoke-lab/where-horses-run)','accept':'text/html,application/json'},signal:AbortSignal.timeout(25000)});
    if(!r.ok)throw Error('HTTP '+r.status);
    const txt=await r.text();if(txt.length>18_000_000)throw Error('body cap reached');
    if(id==='main-json'){
      const p=JSON.parse(txt),rows=Array.isArray(p.meetings)?p.meetings:[];
      const matches=need.map(n=>({id:n.meeting_id,found:rows.some(x=>x.meeting_id===n.meeting_id&&x.country_id===n.country_id&&x.racecourse_id===n.racecourse_id&&x.date===n.date)}));
      observed.push({id,http:r.status,generated_at:p.generated_at,total:rows.length,canada:rows.filter(x=>x.country_id==='canada').length,us:rows.filter(x=>x.country_id==='united-states').length,matches});
    }else{
      observed.push({id,http:r.status,bytes:txt.length,found_ids:need.filter(n=>txt.includes(n.meeting_id)).map(n=>n.meeting_id)});
    }
  }catch(e){observed.push({id,error:String(e?.message??e)});}
}
console.log('CANADA_AGCO_LIVE_PUBLICATION_DIAGNOSTICS '+JSON.stringify({checked_at:new Date().toISOString(),observed}));
for(const o of observed){
  if(o.error)throw Error('Production verification could not reach '+o.id+': '+o.error);
  if(o.id==='main-json'){
    if(o.matches.some(x=>!x.found))throw Error('Public main JSON is missing Canada AGCO or previous US NJRC meeting');
  }else if(o.found_ids.length!==need.length)throw Error('Live deployed '+o.id+' Calendar does not contain all Canada/US meeting IDs yet');
}
console.log('CANADA_AGCO_MAIN_AND_LIVE_CALENDAR: PASS');
