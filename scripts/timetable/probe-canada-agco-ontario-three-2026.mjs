// Three additional Ontario tracks (not Canada nationwide).
// Read-only source discovery, source PDF remains in memory; no Calendar rows published.
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
const sources=[
  {code:'woodbine-thoroughbred',count:128,venue:'Woodbine Racetrack',kind:'thoroughbred-flat',url:'https://www.agco.ca/sites/default/files/2026-03/WDB%20-%20Approved%202026%20Race%20Date%20Calendar_E_17%20Mar%202026.pdf'},
  {code:'fort-erie-thoroughbred',count:34,venue:'Fort Erie Race Track',kind:'thoroughbred-flat',url:'https://www.agco.ca/sites/default/files/2026-03/FT%20ERIE%20-%20Approved%202026%20Race%20Date%20Calendar_E_17%20Mar%202026.pdf'},
  {code:'ajax-quarter-horse',count:22,venue:'Ajax Downs',kind:'quarter-horse',url:'https://www.agco.ca/sites/default/files/2026-03/AJX%20-%20Approved%202026%20Race%20Date%20Calendar_E_17%20Mar%202026.pdf'}
];
const observed=[];
for(const src of sources){
  try{
    const r=await fetch(src.url,{redirect:'follow',headers:{'user-agent':'WhereHorsesRun/1.0 (+https://github.com/badjoke-lab/where-horses-run)','accept':'application/pdf'},signal:AbortSignal.timeout(45000)});
    if(!r.ok)throw Error('HTTP '+r.status);
    if(!['www.agco.ca','agco.ca'].includes(new URL(r.url).hostname))throw Error('AGCO unexpected host');
    const bytes=new Uint8Array(await r.arrayBuffer());const size=bytes.length;
    if(size<5000||size>8000000||String.fromCharCode(...bytes.slice(0,5))!=='%PDF-')throw Error('AGCO PDF unexpected body');
    const pdf=await getDocument({data:bytes,disableWorker:true}).promise;
    if(pdf.numPages<1||pdf.numPages>3)throw Error('AGCO page count changed');
    const monthBoxes=[
      {month:1,x0:185,x1:312,y0:520,y1:606},
      {month:2,x0:312,x1:439,y0:520,y1:606},
      {month:3,x0:439,x1:570,y0:520,y1:606},
      {month:4,x0:185,x1:312,y0:365,y1:465},
      {month:5,x0:312,x1:439,y0:365,y1:465},
      {month:6,x0:439,x1:570,y0:365,y1:465},
      {month:7,x0:185,x1:312,y0:225,y1:324},
      {month:8,x0:312,x1:439,y0:225,y1:324},
      {month:9,x0:439,x1:570,y0:225,y1:324},
      {month:10,x0:185,x1:312,y0:95,y1:180},
      {month:11,x0:312,x1:439,y0:95,y1:180},
      {month:12,x0:439,x1:570,y0:95,y1:180}
    ];
    const monthDays=Object.fromEntries(monthBoxes.map(x=>[String(x.month).padStart(2,'0'),[]]));
    let text='',items=0;
    for(let p=1;p<=pdf.numPages;p++){
      const c=await (await pdf.getPage(p)).getTextContent();items+=c.items.length;
      text+=c.items.map(x=>String(x.str??'')).join(' ')+' ';
      for (const x of c.items) {
        const txt=String(x.str??'').trim(),day=Number(txt),xx=Number(x.transform?.[4]),yy=Number(x.transform?.[5]);
        if(!/^\d{1,2}$/.test(txt)||!Number.isInteger(day)||day<1||day>31)continue;
        const b=monthBoxes.find(b=>xx>=b.x0&&xx<b.x1&&yy>=b.y0&&yy<=b.y1);
        if(b)monthDays[String(b.month).padStart(2,'0')].push(day);
      }
    }
    const okYear=/2026/.test(text),okDate=/Race Dates/i.test(text);
    const monthCount=Object.fromEntries(Object.entries(monthDays).map(([m,a])=>[m,[...new Set(a)].length]));
    const geometryTotal=Object.values(monthCount).reduce((a,b)=>a+b,0);
    const fullDates=Object.entries(monthDays).flatMap(([month,days])=>[...new Set(days)].map(day=>{
      const d=new Date(Date.UTC(2026,Number(month)-1,day));
      if(d.getUTCMonth()!==Number(month)-1||d.getUTCDate()!==day)throw Error('invalid approved day '+month+'/'+day);
      return '2026-'+month+'-'+String(day).padStart(2,'0');
    })).sort();
    if(fullDates.length!==geometryTotal||new Set(fullDates).size!==fullDates.length)throw Error('date mismatch or duplicate');
    const forward=fullDates.filter(d=>d>='2026-10-12');
    observed.push({geometry_total_source_visible:geometryTotal,month_counts:monthCount,geometry_matches_printed_total:geometryTotal===src.count,forward_date_count:forward.length,forward_dates:forward,code:src.code,venue:src.venue,racing_type:src.kind,expected_2026_dates:src.count,source_reachable:true,pdf_bytes:size,pages:pdf.numPages,text_chars:text.length,text_items:items,has_2026_calendar_heading:okYear&&okDate,expected_total_number_visible:new RegExp('\\b'+src.count+'\\b').test(text),body_retained:false,production_ready:false});
  }catch(e){observed.push({code:src.code,source_reachable:false,error:String(e?.message??e),production_ready:false});}
}
console.log('ONTARIO_THREE_AGCO_2026_PROBES '+JSON.stringify({checked_at:new Date().toISOString(),observed,meetings_emitted:0,public_calendar_changed:false}));
if(observed.some(o=>!o.source_reachable||!o.has_2026_calendar_heading))throw Error('An additional Ontario AGCO source is unavailable or not recognizably 2026');
