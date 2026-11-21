/**
 * READ ONLY: Iranian Aqqala local horse-racing board (week 5 of autumn 1405).
 * One public bulletin page + one independent venue-owner description.
 * No cards, bet data, login, Telegram API, source-body persistence, or meetings.
 */
const UA='WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)';
const SOURCES=[
 {id:'aqqala-board',url:'https://t.me/s/savarkariaqqala'},
 {id:'aqqala-venue-owner',url:'https://eqc.ir/subsidiaries/aboutus/default.aspx?qs=9804025'}
];
const DAYS=Object.freeze([
 {jalali:'1405.08.06',iso:'2026-10-28',name:'Wednesday'},
 {jalali:'1405.08.07',iso:'2026-10-29',name:'Thursday'},
 {jalali:'1405.08.08',iso:'2026-10-30',name:'Friday'}
]);
function normalize(v){
 const p='۰۱۲۳۴۵۶۷۸۹',a='٠١٢٣٤٥٦٧٨٩';
 return String(v).replace(/[۰-۹]/g,x=>String(p.indexOf(x))).replace(/[٠-٩]/g,x=>String(a.indexOf(x)))
  .replace(/[\u200c\u200f\u200e]/g,'').replace(/آق\s*[-‌]?\s*قلا/g,'آق قلا');
}
function plain(v){
 return normalize(String(v).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ')
  .replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&')
  .replace(/&#(\d+);/g,(_,d)=>String.fromCharCode(+d)).replace(/\s+/g,' '));
}
function extract(html){
 const blocks=[...String(html).matchAll(/<div\b[^>]*class="[^"]*tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/gi)].map(x=>plain(x[1]));
 const seen=new Map();
 for(const s of blocks){
  if(!/آق قلا/.test(s)||!/(?:هفته\s*5|هفته\s*پنجم)/i.test(s)||!/(?:کورس|اسبدوانی)/i.test(s))continue;
  for(const d of DAYS){
   const short=d.jalali.replace('1405.08.','');
   const re=new RegExp('(?:1405[./]0?8[./]0?'+Number(short)+'|(?:'+Number(short)+')\\s*آبان)');
   if(!re.test(s))continue;
   const v={date:d.iso,official_post_signal:true,final_card:/جدول\s*نهایی/.test(s),
    provisional_card:/جدول\s*اولیه/.test(s)};
   const old=seen.get(d.iso);
   seen.set(d.iso,{date:d.iso,official_post_signal:true,final_card:!!(old?.final_card||v.final_card),
    provisional_card:!!(old?.provisional_card||v.provisional_card)});
  }
 }
 return {posts_examined:blocks.length,week5_days:[...seen.values()].sort((a,b)=>a.date.localeCompare(b.date)),
  source_body_retained:false};
}
function permitted(robots,target){
 const pathname=new URL(target).pathname;
 // Conservative scope-aware robots processing. A specific disallow wins ties.
 const groups=[];let group={agents:[],rules:[]};
 const save=()=>{if(group.agents.length)groups.push(group);group={agents:[],rules:[]};};
 for(const raw of robots.split(/\r?\n/)){
  const s=raw.replace(/#.*$/,'').trim();if(!s)continue;
  const agent=s.match(/^User-agent:\s*(.+)$/i);
  if(agent){if(group.rules.length)save();group.agents.push(agent[1].trim().toLowerCase());continue;}
  const rule=s.match(/^(Allow|Disallow):\s*(.*)$/i);
  if(rule&&group.agents.length)group.rules.push({kind:rule[1].toLowerCase(),path:rule[2].trim()});
 }
 save();
 const rules=groups.filter(g=>g.agents.some(a=>a==='*'||UA.toLowerCase().includes(a)))
  .flatMap(g=>g.rules).filter(r=>r.path&&pathname.startsWith(r.path))
  .sort((a,b)=>b.path.length-a.path.length||(a.kind==='disallow'?-1:1));
 return !rules.length||rules[0].kind==='allow';
}
async function get(url,max=1500000){
 const r=await fetch(url,{redirect:'manual',headers:{'user-agent':UA,accept:'text/html,text/plain;q=0.9'},signal:AbortSignal.timeout(14000)});
 if(r.status!==200)return {status:'http_'+r.status};
 if(new URL(r.url).origin!==new URL(url).origin)return {status:'redirect'};
 if(!/^text\/(?:html|plain)\b/i.test(r.headers.get('content-type')||''))return {status:'nontext'};
 if(Number(r.headers.get('content-length')||0)>max)return {status:'too_large'};
 const body=await r.text();if(body.length>max)return {status:'too_large'};
 return {status:'ok',body};
}
async function check(s){
 // Telegram Content Licensing ToS limits third-party collection/reuse.
 // Keep the public board as a manual discovery link only. Never fetch its
 // content through an automated Calendar collector/probe without a new
 // explicit source/method/field permission review.
 if(s.id==='aqqala-board') return {id:s.id,status:'method_change_required',source_access:'link_only',terms:'https://telegram.org/tos/content-licensing'};
 const u=new URL(s.url);
 try{
  const robots=await get(u.origin+'/robots.txt',150000);
  if(robots.status!=='ok')return {id:s.id,status:'robots_'+robots.status};
  if(!permitted(robots.body,s.url))return {id:s.id,status:'robots_disallow'};
  const page=await get(s.url);
  if(page.status!=='ok')return {id:s.id,status:page.status};
  if(s.id==='aqqala-board')return {id:s.id,status:'ok',...extract(page.body)};
  const t=plain(page.body);
  return {id:s.id,status:'ok',physical_racecourse:/مجموعه\s*سوارکاری\s*آق قلا/.test(t),
   racing_use:/مسابقات\s*کورس/.test(t)};
 }catch(e){return {id:s.id,status:'request_error',error_name:String(e?.name||'Error').slice(0,40)};}
}
function selfTest(){
 const sample=[
  '<div class="tgme_widget_message_text">📋 جدول نهایی مسابقات اسبدوانی #هفته5کورس‌پاییزه1405آق‌قلا روز دوم پنجشنبه ۷ آبان (1405.08.07)</div>',
  '<div class="tgme_widget_message_text">جدول اولیه مسابقات اسبدوانی #هفته5کورس‌پاییزه1405آق‌قلا روز سوم جمعه ۸ آبان (1405.08.08)</div>',
  '<div class="tgme_widget_message_text">جدول نهایی هفته4 کورس آق قلا 1405.08.01</div>'
 ].join('\n');
 const d=extract(sample);
 if(d.week5_days.length!==2||d.week5_days[0].date!=='2026-10-29'||!d.week5_days[0].final_card||d.week5_days[1].date!=='2026-10-30')throw Error('date parser self-test');
 if(permitted('User-agent: *\nDisallow: /s/',SOURCES[0].url))throw Error('robots disallow self-test');
 if(!permitted('User-agent: *\nDisallow: /secret/',SOURCES[0].url))throw Error('robots allow self-test');
 console.log('IRAN_AQQALA_WEEK5_SELF_TEST_PASS');
}
if(process.argv.includes('--self-test'))selfTest();
else{
 const out=[];for(const s of SOURCES)out.push(await check(s));
 const board=out.find(x=>x.id==='aqqala-board'),venue=out.find(x=>x.id==='aqqala-venue-owner');
 console.log('IRAN_AQQALA_WEEK5_PROBE '+JSON.stringify({
  checked_at:new Date().toISOString(),sources:out,
  c_source_positive:board?.status==='ok'&&board.week5_days?.length>0,
  physical_venue_independently_confirmed:venue?.status==='ok'&&venue.physical_racecourse&&venue.racing_use,
  status:'DISCOVERY_ONLY',rights_status:'REVIEW_REQUIRED',
  production_routing:false,canonical_writes:false,public_writes:false,
  coverage_claim:'Aqqala local 1405 autumn week 5 only; no Iran-wide or next-week inferred dates'
 }));
}