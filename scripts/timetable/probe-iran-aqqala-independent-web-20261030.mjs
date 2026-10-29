/**
 * Iranian Aqqala 1405 week 5: alternative NON-Telegram discovery probe.
 * Narrow, robots-aware GET of exactly two news/association pages; no stored
 * source bodies, racecard access, login, scraping pagination or public writes.
 * Rights: E1 / REVIEW_REQUIRED. HTTP 200 NEVER means publication permission.
 */
const UA='WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)';
const SOURCES=[
 {id:'golestan-provincial-news',url:'https://golestan-horse.ir/news/7723'},
 {id:'golestan-independent-news',url:'https://tashbihnwes.ir/?p=106451'},
 {id:'asbdavani-public-racecards',url:'https://asbdavani.app/racecards'}
];
const EXPECTED=[
 {jalali:'1405/08/06',iso:'2026-10-28'},
 {jalali:'1405/08/07',iso:'2026-10-29'},
 {jalali:'1405/08/08',iso:'2026-10-30'}
];
function normalize(input){
 const p='۰۱۲۳۴۵۶۷۸۹',a='٠١٢٣٤٥٦٧٨٩';
 return String(input).replace(/[۰-۹]/g,x=>String(p.indexOf(x)))
  .replace(/[٠-٩]/g,x=>String(a.indexOf(x)))
  .replace(/[\u200c\u200d\u200e\u200f]/g,'')
  .replace(/آق[\s-]*قلا/g,'آق قلا');
}
function plain(html){
 return normalize(String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
  .replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ')
  .replace(/&#(\d+);/g,(_,d)=>String.fromCharCode(Number(d)))
  .replace(/&amp;/gi,'&').replace(/\s+/g,' '));
}
function extractSignals(html){
 const t=plain(html),local=/(?:آق\s*قلا|آق قلا)/i.test(t);
 const week5=/(?:هفته\s*(?:پنجم|5)|کورس\s*پاییزه\s*1405)/i.test(t);
 const racing=/(?:اسبدوانی|کورس|سوارکاری)/.test(t);
 const dates=EXPECTED.filter(d=>{
  const day=Number(d.jalali.slice(-2));
  return new RegExp('(?:1405[./]0?8[./]0?'+day+'|'+day+'\\s*آبان)').test(t);
 }).map(d=>d.iso);
 return {aq_qala:local,racing,week5,date_signals:local&&racing&&week5?dates:[],source_body_retained:false};
}
function robotsAllowed(robots,target){
 const pathname=new URL(target).pathname;
 const groups=[];let current={agents:[],rules:[]};let sawRules=false;
 function push(){if(current.agents.length)groups.push(current);current={agents:[],rules:[]};sawRules=false;}
 for(const line of String(robots).split(/\r?\n/)){
  const s=line.replace(/#.*$/,'').trim();
  if(!s)continue;
  const a=s.match(/^User-agent:\s*(.+)$/i);
  if(a){if(sawRules)push();current.agents.push(a[1].trim().toLowerCase());continue;}
  const r=s.match(/^(Allow|Disallow):\s*(.*)$/i);
  if(r&&current.agents.length){sawRules=true;current.rules.push({kind:r[1].toLowerCase(),path:r[2].trim()});}
 }
 push();
 const matches=groups.filter(g=>g.agents.some(a=>a==='*'||a==='wherehorsesrun'||UA.toLowerCase().startsWith(a))).flatMap(g=>g.rules)
  .filter(r=>r.path&&pathname.startsWith(r.path))
  .sort((a,b)=>b.path.length-a.path.length||(a.kind==='disallow'?-1:1));
 return !matches.length||matches[0].kind==='allow';
}
async function get(url,max){
 const r=await fetch(url,{redirect:'manual',headers:{'User-Agent':UA,'Accept':'text/html,text/plain;q=0.8'},signal:AbortSignal.timeout(12000)});
 if([301,302,307,308].includes(r.status))return {status:'redirect',location:r.headers.get('location')};
 if(r.status!==200)return {status:'http_'+r.status};
 if(new URL(r.url).origin!==new URL(url).origin)return {status:'redirect_blocked'};
 if(!/^text\/(?:html|plain)\b/i.test(r.headers.get('content-type')||''))return {status:'not_html'};
 const length=Number(r.headers.get('content-length')||'0');
 if(length>max)return {status:'too_large'};
 const body=await r.text();if(body.length>max)return {status:'too_large'};
 return {status:'ok',body};
}
function canonicalSamePublisher(location,original,robotsOnly=false){
 if(!location)return null;
 try {
  const old=new URL(original),next=new URL(location,old);
  const host=v=>v.replace(/^www\./,'').toLowerCase();
  if(next.protocol!=='https:'||next.username||next.password||next.port)return null;
  if(host(next.hostname)!==host(old.hostname))return null;
  if(robotsOnly&&next.pathname!=='/robots.txt')return null;
  if(!robotsOnly&&(next.pathname!==old.pathname||next.search!==old.search))return null;
  return next.toString();
 }catch{return null;}
}
async function runSource(s){
 const origin=new URL(s.url).origin;
 try {
  const robotsUrl=origin+'/robots.txt';
  let robots=await get(robotsUrl,150000);
  if(robots.status==='redirect'){
   const canonical=canonicalSamePublisher(robots.location,robotsUrl,true);
   if(!canonical)return {id:s.id,status:'robots_redirect_blocked',source_url:s.url};
   robots=await get(canonical,150000);
  }
  if(robots.status!=='ok')return {id:s.id,status:'robots_'+robots.status,source_url:s.url};
  if(!robotsAllowed(robots.body,s.url))return {id:s.id,status:'robots_disallow',source_url:s.url};
  let page=await get(s.url,500000);
  if(page.status==='redirect'){
   const canonical=canonicalSamePublisher(page.location,s.url,false);
   if(!canonical||!robotsAllowed(robots.body,canonical))return {id:s.id,status:'page_redirect_blocked',source_url:s.url};
   page=await get(canonical,500000);
  }
  if(page.status!=='ok')return {id:s.id,status:page.status,source_url:s.url};
  return {id:s.id,status:'ok',source_url:s.url,...extractSignals(page.body)};
 }catch(e){return {id:s.id,status:'request_error',error_name:String(e?.name||'Error').slice(0,40),source_url:s.url};}
}
function selfTest(){
 const sample='<article>پنجمین هفته مسابقات اسبدوانی کورس پاییزه ۱۴۰۵ آق‌قلا چهارشنبه ۶ آبان (۱۴۰۵/۰۸/۰۶) پنجشنبه ۷ آبان (۱۴۰۵/۰۸/۰۷) جمعه ۸ آبان (۱۴۰۵/۰۸/۰۸)</article>';
 const p=extractSignals(sample);
 if(p.date_signals.length!==3||p.date_signals[2]!=='2026-10-30')throw Error('3-day Persian-date parsing failure');
 if(extractSignals(sample.replace('آق‌قلا','تهران')).date_signals.length)throw Error('venue guard failure');
 if(extractSignals(sample.replace('پنجمین هفته مسابقات اسبدوانی کورس پاییزه ۱۴۰۵','نمایشگاه')).date_signals.length)throw Error('racing guard failure');
 if(robotsAllowed('User-agent: *\nDisallow: /news/',SOURCES[0].url))throw Error('robots denial failure');
 if(!robotsAllowed('User-agent: *\nDisallow: /private/',SOURCES[0].url))throw Error('robots allow failure');
 if(robotsAllowed('User-agent: *\nDisallow: /\nAllow: /news/7723',SOURCES[0].url)===false)throw Error('robots specificity failure');
 if(canonicalSamePublisher('https://www.tashbihnwes.ir/robots.txt','https://tashbihnwes.ir/robots.txt',true)!=='https://www.tashbihnwes.ir/robots.txt')throw Error('safe canonical robots failed');
 if(canonicalSamePublisher('https://evil.example/robots.txt','https://tashbihnwes.ir/robots.txt',true)!==null)throw Error('cross-site robots redirect guard failed');
 if(canonicalSamePublisher('https://www.tashbihnwes.ir/other','https://tashbihnwes.ir/?p=106451',false)!==null)throw Error('page path substitution guard failed');
 console.log('IRAN_AQQALA_ALTERNATIVE_WEB_SELF_TEST_PASS');
}
if(process.argv.includes('--self-test'))selfTest();
else {
 const sources=[];
 for(const s of SOURCES)sources.push(await runSource(s));
 console.log('IRAN_AQQALA_ALTERNATIVE_WEB_PROBE '+JSON.stringify({
  checked_at:new Date().toISOString(),sources,source_rights:'E1_REVIEW_REQUIRED',
  telegram_automated_access:false,public_meetings:[],canonical_meetings:[],
  approved_for_publication:false,routed:false,
  future_week6_to_week10_dates_inferred:false,
  live_page_discovery_only:['https://asbdavani.app/live','https://www.aparat.com/Asbdavani_app/live'],
  free_live_access_confirmed:false
 }));
}