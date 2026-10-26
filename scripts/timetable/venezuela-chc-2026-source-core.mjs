/**
 * Venezuela / La Rinconada read-only discovery of CHC's selected 2026 classics.
 * No production route, meeting publication, inference of national fixtures, or
 * raw CHC data redistribution. Independent E2 review is required for Venezuela.
 */
export const VEN_CHC_URL='https://confederacionhipicadelcaribe.org/wp-content/uploads/2026/04/CALENDARIO-CLASICO-CHC-2026-4.pdf';
export const VEN_CHC_VENUE='venezuela--hipodromo-la-rinconada';
const months={Ene:1,Feb:2,Mar:3,Abr:4,May:5,Jun:6,Jul:7,Ago:8,Sep:9,Oct:10,Nov:11,Dic:12};
const date=(day,m)=>{
 const mm=months[String(m).replace(/[.\s]/g,'').slice(0,3)];
 const dd=Number(day);
 const d=mm&&new Date(Date.UTC(2026,mm-1,dd));
 if(!d||!Number.isInteger(dd)||dd<1||d.getUTCMonth()!==mm-1||d.getUTCDate()!==dd)
  throw Error('CHC Venezuela invalid date');
 return '2026-'+String(mm).padStart(2,'0')+'-'+String(dd).padStart(2,'0');
};
export function parseChcVenezuela2026(pages){
 if(!Array.isArray(pages)||pages.length<3||pages.length>12)throw Error('CHC Venezuela PDF page count drift');
 const txt=pages.flat().map(x=>String(x??'').trim()).join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');
 if(!/CALENDARIO\s+CLASICO\s+2026/i.test(txt)||!/CONFEDERACION\s+HIPICA\s+DEL\s+CARIBE/i.test(txt))
  throw Error('CHC Venezuela PDF official source fingerprint missing');
 const meetings=new Map();let occurrences=0;
 for(const page of pages){
  if(!Array.isArray(page))throw Error('CHC Venezuela tokens invalid');
  const tokens=page.map(x=>String(x??'').trim()).filter(Boolean);
  for(let i=0;i<tokens.length;i++){
   if(tokens[i]!=='VEN')continue;
   if(tokens[i+1]!=='La Rinconada')throw Error('CHC Venezuela unreviewed venue');
   const meetingDate=date(tokens[i+2],tokens[i+3]);
   meetings.set(meetingDate,(meetings.get(meetingDate)||0)+1);
   occurrences++;
  }
 }
 const days=[...meetings].map(([date,races_listed])=>({date,races_listed,venue_id:VEN_CHC_VENUE})).sort((a,b)=>a.date.localeCompare(b.date));
 if(days.length<8||days.length>60||occurrences<days.length)throw Error('CHC Venezuela selected day denominator drift');
 if(!days.some(x=>x.date==='2026-11-15')||!days.some(x=>x.date==='2026-11-22')||!days.some(x=>x.date==='2026-12-13'))
  throw Error('CHC Venezuela expected late 2026 selected-day fingerprint drift');
 return {days,source_classic_rows:occurrences};
}
