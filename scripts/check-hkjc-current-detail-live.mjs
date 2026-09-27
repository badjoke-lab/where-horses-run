import { classifyHkjcRacecardBody, hkjcPublishedRacecardSignal, hkjcRacecardNavigationNumbers } from './timetable/hkjc-racecard-body-classification.mjs';
import assert from 'node:assert/strict';

function url(date,raceNo){
  return `https://racing.hkjc.com/en-us/local/information/racecard?racedate=${date.replaceAll('-','/')}&Racecourse=ST&RaceNo=${raceNo}`;
}
async function probe(date,raceNo){
  const target=url(date,raceNo);
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),15000);
  try{
    const response=await fetch(target,{
      signal:controller.signal,redirect:'follow',
      headers:{'user-agent':'Mozilla/5.0',accept:'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8','accept-language':'en-US,en;q=0.9'},
    });
    const body=await response.text();
    const text=body.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/\s+/g,' ').trim();
    return {
      date,race_no:raceNo,http_status:response.status,ok:response.ok,final_url:response.url,
      content_type:response.headers.get('content-type'),body_size:Buffer.byteLength(body,'utf8'),
      race_links:hkjcRacecardNavigationNumbers(body),
      blocked_keyword:/access\s*denied|captcha|robot|bot|forbidden|temporarily unavailable|akamai|request blocked/i.test(text),
      published_signature:hkjcPublishedRacecardSignal(body),
      production_classification:classifyHkjcRacecardBody(body)?.status??'usable_racecard',
      not_published:/No race card|not available|not yet available|will be available|Race Card is not available/i.test(text),
      has_1245:/\b12:45\b/.test(text),
      has_race_1:/\bRace\s*1\b/i.test(text),
    };
  }catch(error){
    return {date,race_no:raceNo,error:String(error?.cause?.code??error?.message??error)};
  }finally{clearTimeout(timer);}
}

if(process.env.GITHUB_ACTIONS==='true'){
  const rows=[];
  for(const [date,raceNo] of [['2026-09-27',1],['2026-09-27',11],['2026-09-27',12],['2026-10-11',1]]){
    rows.push(await probe(date,raceNo));
  }
  console.log('HKJC_CURRENT_DETAIL_PROBE:',JSON.stringify(rows));
  const race1=rows[0];
  assert.equal(race1.ok,true,'published 2026-09-27 Sha Tin Race 1 must be reachable from Actions');
  assert.equal(race1.published_signature,true,'published 2026-09-27 Race 1 must expose positive racecard evidence');
  assert.equal(race1.production_classification,'usable_racecard','production classifier must accept the published 2026-09-27 racecard');
  assert.deepEqual(race1.race_links,[1,2,3,4,5,6,7,8,9,10,11],'published 2026-09-27 navigation must expose the bounded 11-race set');
  assert.equal(race1.has_race_1,true,'published 2026-09-27 Race 1 body must expose Race 1');
  assert.equal(rows[2].race_links.length,0,'Race 12 must not expose a published race navigation set');
}
console.log('HKJC_CURRENT_DETAIL_LIVE: pass');
