// Temporary read-only actual production verification, never used as calendar ingestion.
const userAgent='WhereHorsesRun/1.0 live-verification (+https://github.com/badjoke-lab/where-horses-run)';
const targets=[
 {id:'argentina',date:'2026-10-15',country:'argentina',venue:'argentina--hipodromo-de-la-plata',meeting:'argentina-la-plata-2026-2026-10-15'},
 {id:'canada',date:'2026-10-14',country:'canada',venue:'canada--century-mile',meeting:'canada-hra-century-mile-standardbred-2026-10-14'}
];
const sources=[
 {id:'raw-main-json',url:'https://raw.githubusercontent.com/badjoke-lab/where-horses-run/main/data/generated/timetable/public/meeting-list.json'},
 ...targets.flatMap(t=>[
   {id:'english-'+t.id,url:'https://whr.badjoke-lab.com/calendar/?date='+t.date,meeting:t.meeting},
   {id:'japanese-'+t.id,url:'https://whr.badjoke-lab.com/ja/calendar/?date='+t.date,meeting:t.meeting}
 ])
];
const observed=[];
for(const s of sources){
 try{
  const r=await fetch(s.url,{redirect:'follow',headers:{'user-agent':userAgent,'accept':'text/html,application/json'},signal:AbortSignal.timeout(26000)});
  if(!r.ok)throw Error('HTTP '+r.status);
  const body=await r.text();if(body.length>19000000)throw Error('HTML/JSON body too large');
  if(s.id==='raw-main-json'){
   const j=JSON.parse(body),a=j.meetings??[];
   const match=targets.map(t=>({id:t.id,date:t.date,found:a.some(x=>x.meeting_id===t.meeting&&x.country_id===t.country&&x.racecourse_id===t.venue&&x.date===t.date)}));
   const argentina=a.filter(x=>x.country_id==='argentina'),canada=a.filter(x=>x.country_id==='canada');
   observed.push({id:s.id,http:r.status,generated_at:j.generated_at,total:a.length,argentina:argentina.length,canada:canada.length,targets:match});
  }else observed.push({id:s.id,http:r.status,bytes:body.length,meeting_id_present:body.includes(s.meeting)});
 }catch(e){observed.push({id:s.id,error:String(e?.message??e)});}
}
console.log('ARGENTINA_LAPLATA_LIVE_PUBLICATION '+JSON.stringify({checked_at:new Date().toISOString(),observed}));
for(const o of observed){
 if(o.error)throw Error('Live production endpoint error '+o.id+' '+o.error);
 if(o.id==='raw-main-json'){
  if(o.targets.some(t=>!t.found)||o.argentina<12||o.canada<48)throw Error('Main public projection lacks Argentina La Plata or existing Canada meetings');
 }else if(!o.meeting_id_present)throw Error('Bilingual production HTML lacks '+o.id+' meeting ID');
}
console.log('ARGENTINA_LAPLATA_AND_CANADA_REAL_PRODUCTION: PASS');
