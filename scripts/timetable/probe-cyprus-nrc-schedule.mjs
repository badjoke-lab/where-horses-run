import {execFileSync} from 'node:child_process';

const URL='https://www.nicosiaraceclub.com.cy/schedule.aspx';

function decode(v){
  return String(v??'')
    .replace(/&nbsp;|&#160;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/&#x([0-9a-f]+);/gi,(_,c)=>String.fromCodePoint(Number.parseInt(c,16)))
    .replace(/&#(\d+);/g,(_,c)=>String.fromCodePoint(Number(c)));
}
function visibleText(html){
  return decode(String(html??''))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
async function fetchHtml(url){
  let fetchError=null;
  try{
    const r=await fetch(url,{
      redirect:'follow',
      headers:{
        'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
        'accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
        'accept-language':'en-US,en;q=0.9,el;q=0.7'
      },
      signal:AbortSignal.timeout(20000)
    });
    if(!r.ok) throw new Error('HTTP '+r.status+' '+url);
    return {html:await r.text(),url:r.url||url,method:'fetch'};
  }catch(e){fetchError=e;}
  try{
    const html=execFileSync('curl',[
      '-L','--fail','--silent','--show-error','--max-time','20',
      '--user-agent','Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
      '--header','Accept-Language: en-US,en;q=0.9,el;q=0.7',
      url
    ],{encoding:'utf8',maxBuffer:8*1024*1024});
    if(!html.trim()) throw new Error('curl returned empty body');
    return {html,url,method:'curl'};
  }catch(e){
    throw new Error('fetch failed: '+String(fetchError?.message??fetchError)+'; curl failed: '+String(e?.message??e));
  }
}

const page=await fetchHtml(URL);

async function probePdf(name){
  const url=new URL('html_pages/'+name,URL).href;
  const r=await fetch(url,{
    redirect:'follow',
    headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)'},
    signal:AbortSignal.timeout(20000)
  });
  if(!r.ok) throw new Error('PDF HTTP '+r.status+' '+url);
  const buf=Buffer.from(await r.arrayBuffer());
  let text='';
  try{
    text=execFileSync('pdftotext',['-layout','-','-'],{input:buf,encoding:'utf8',maxBuffer:8*1024*1024});
  }catch(e){
    text='PDFTOTEXT_ERROR '+String(e?.message??e);
  }
  return {
    url,
    bytes:buf.length,
    prefix:visibleText(text).slice(0,5000),
    date_tokens:[...text.matchAll(/\b(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](20\d{2}|\d{2}))?\b/g)].map(m=>m[0]).slice(0,120)
  };
}
const monthlyPdfs=[];
for(const name of ['schedule_oct.pdf','schedule_nov.pdf','schedule_dec.pdf']){
  monthlyPdfs.push(await probePdf(name));
}

const text=visibleText(page.html);
const anchors=[];
for(const m of page.html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
  const href=decode(m[1]).trim();
  const label=visibleText(m[2]);
  if(!href) continue;
  if(/january|february|march|april|may|june|july|august|september|october|november|december|schedule|race|meeting|pdf/i.test(label+' '+href)){
    const openTag=m[0].slice(0,m[0].indexOf('>')+1);
    const onclick=(openTag.match(/onclick=[\"']([^\"']*)[\"']/i)||[])[1]??null;
    const id=(openTag.match(/id=[\"']([^\"']*)[\"']/i)||[])[1]??null;
    anchors.push({label,href,onclick,id,open_tag:openTag});
  }
}
const forms=[...page.html.matchAll(/<form\b[^>]*action=["']?([^"' >]+)?/gi)].map(m=>m[1]??'');
const inputs=[...page.html.matchAll(/<input\b[^>]*name=["']([^"']+)["'][^>]*value=["']?([^"' >]*)/gi)].map(m=>({name:m[1],value:m[2]}));

console.log(JSON.stringify({
  url:page.url,
  method:page.method,
  html_bytes:Buffer.byteLength(page.html),
  has_schedule:/Race Meetings\s*Schedule/i.test(text),
  month_labels:['January','February','March','April','May','June','July','August','September','October','November','December'].filter(m=>new RegExp(m,'i').test(text)),
  anchor_hits:[...new Map(anchors.map(x=>[x.label+'|'+x.href,x])).values()].slice(0,80),
  forms:forms.slice(0,10),
  inputs:inputs.slice(0,40),
  october_context:(()=>{const i=page.html.toLowerCase().indexOf('october'); return i>=0?page.html.slice(Math.max(0,i-1200),Math.min(page.html.length,i+1800)):null;})(),
  postback_tokens:[...page.html.matchAll(/__doPostBack\\(([^)]*)\\)/gi)].map(m=>m[1]).slice(0,80),
  monthly_pdfs:monthlyPdfs
},null,2));

if(!/Race Meetings\s*Schedule/i.test(text)) process.exitCode=1;
if(!/October/i.test(text)) process.exitCode=1;
