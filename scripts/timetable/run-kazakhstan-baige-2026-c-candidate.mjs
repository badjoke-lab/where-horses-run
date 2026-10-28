/** Read-only Kazakhstan C candidate. No registry/public writes; no past event promotion. */
import fs from 'node:fs';
import path from 'node:path';
import {KZ,checkFederation,checkCity,buildCandidate} from './kazakhstan-baige-2026-c-source-core.mjs';
const arg=(name,defaultValue)=>process.argv.find(v=>v.startsWith('--'+name+'='))?.slice(name.length+3)??defaultValue;
const current=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Almaty',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const start=arg('as-of',current()),days=Number(arg('days','30')),output=arg('output','/tmp/kazakhstan-baige-2026-c-candidate.json');
if(!/^20\d{2}-\d{2}-\d{2}$/.test(start)||!Number.isInteger(days)||days<1||days>120)throw Error('bad window');
const checkedAt=new Date().toISOString();
const ua='WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)';
async function get(u,cap=1200000){
 const r=await fetch(u,{redirect:'manual',signal:AbortSignal.timeout(18000),headers:{'User-Agent':ua,'Accept':'text/html,text/plain;q=0.9'}});
 if(r.status!==200)throw Error('http_'+r.status+'_'+new URL(u).hostname);
 if(new URL(r.url).origin!==new URL(u).origin)throw Error('off_origin');
 if(!/^text\/(?:html|plain)\b/i.test(r.headers.get('content-type')||''))throw Error('unexpected_type');
 if(Number(r.headers.get('content-length')||0)>cap)throw Error('too_large');
 const body=await r.text();if(body.length>cap)throw Error('too_large');return body;
}
function isDenied(robots,u){
 const target=new URL(u).pathname, groups=[];let agents=[],rules=[];
 const flush=()=>{if(agents.length)groups.push({agents,rules});agents=[];rules=[]};
 for(const raw of robots.split(/\r?\n/)){
  const line=raw.replace(/#.*/,'').trim();if(!line)continue;
  let m=line.match(/^User-agent:\s*(.+)$/i);
  if(m){if(rules.length)flush();agents.push(m[1].trim().toLowerCase());continue}
  m=line.match(/^(Allow|Disallow):\s*(.*)$/i);
  if(m&&agents.length)rules.push({kind:m[1].toLowerCase(),path:m[2].trim()});
 }flush();
 const match=groups.filter(g=>g.agents.some(a=>a==='*'||a==='wherehorsesrun'))
  .flatMap(g=>g.rules).filter(r=>r.path&&(r.path==='/'||target.startsWith(r.path)))
  .sort((a,b)=>b.path.length-a.path.length||(a.kind==='disallow'?-1:1));
 return match.length>0&&match[0].kind==='disallow';
}
async function scopeFetch(url){
 const robots=await get(new URL(url).origin+'/robots.txt',150000);
 if(isDenied(robots,url))throw Error('robots_disallow_'+new URL(url).hostname);
 return get(url);
}
let status='success',error=null,records=[],sourceDate=KZ.date;
try{
 const a=checkFederation(await scopeFetch(KZ.federation));
 const b=checkCity(await scopeFetch(KZ.city));
 records=buildCandidate(a,b,{start,days,checkedAt}).records;
}catch(e){error=String(e.message||e).slice(0,160);status=/fingerprint|conflict/i.test(error)?'parse_error':'network_error'}
const report={schema_version:'kazakhstan-baige-2026-almaty-c-candidate-v1',
 country_id:KZ.country_id,source_id:KZ.source_id,generated_at:checkedAt,
 acquisition_attempt:{attempted_at:checkedAt,status,error_code:error},
 window:{start_date:start,days,source_date:sourceDate,
  coverage_claim:'2026 Almaty Baige final only. Completed-season empty current window is not a cancellation or next-year inference.'},
 records,diagnostics:{source_errors:error?[error]:[],review_state:'rights_review_required'},
 production_routing:false,canonical_writes:false,public_writes:false};
fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log('KAZAKHSTAN_BAIGE_2026_C_CANDIDATE '+JSON.stringify({status,sourceDate,start,days,rows:records.length,error,production_routing:false}));
