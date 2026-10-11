import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

// Source: NJ Racing Commission's state-issued, color-coded 2026 PDF only.
// No access to privately operated racetrack websites.
const arg=(k,def=null)=>process.argv.find(v=>v.startsWith('--'+k+'='))?.slice(k.length+3)??def;
const outputDir=arg('output-dir'),days=Number(arg('days','30'));
const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
const vals=Object.fromEntries(parts.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
const start=arg('as-of',vals.year+'-'+vals.month+'-'+vals.day);
if(!outputDir)throw Error('NJRC --output-dir required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!Number.isInteger(days)||days<1||days>120)throw Error('invalid NJRC window');
const facts=path.resolve(outputDir,'_njrc-source-facts.json');
function run(cmd,args){
 const ret=spawnSync(cmd,args,{stdio:'inherit',timeout:120000,env:process.env});
 if(ret.error||ret.status!==0)throw Error('NJRC source extraction/normalization failed; preserving existing production records: '+String(ret.error??ret.status));
}
fs.mkdirSync(outputDir,{recursive:true});
try {
 run('python3',['scripts/timetable/run-us-njrc-2026-source-facts.py','--output',facts]);
 run('node',['scripts/timetable/build-us-njrc-2026-calendar-candidates.mjs',
  '--input='+facts,'--as-of='+start,'--days='+days,'--output-dir='+outputDir]);
} finally {
 try{fs.unlinkSync(facts)}catch{}
}
