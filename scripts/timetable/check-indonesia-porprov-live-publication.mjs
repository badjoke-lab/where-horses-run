import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import puppeteer from 'puppeteer-core';

const data=JSON.parse(fs.readFileSync('data/generated/timetable/public/meeting-list.json','utf8'));
const days=['2026-11-07','2026-11-08'];
assert.ok(Array.isArray(data.meetings));
const rows=[];
for(const date of days){
  const id='indonesia-porprov-legokjawa-'+date;
  const matches=data.meetings.filter(x=>x.meeting_id===id);
  assert.equal(matches.length,1,'Main public must hold exactly one '+id);
  const x=matches[0];
  assert.equal(x.country_id,'indonesia');
  assert.equal(x.racecourse_id,'indonesia--legokjawa-racecourse');
  assert.equal(x.date,date);
  assert.equal(x.timezone,'Asia/Jakarta');
  assert.equal(x.effective_public_rank,'C');
  assert.equal(x.first_race_time_local,null);
  assert.equal(x.last_race_time_local,null);
  assert.equal(x.detail_path,null);
  rows.push({id,date,rank:x.effective_public_rank,source_status:x.source_status});
}
console.log('INDONESIA_MAIN_PUBLIC_2026_C',JSON.stringify({generated_at:data.generated_at,rows}));

const fontList=execFileSync('fc-list',[':lang=ja','family'],{encoding:'utf8'}).trim();
assert.ok(fontList.length>0,'Japanese glyph coverage required for visual screenshots');
const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable',
'/usr/bin/chromium','/usr/bin/chromium-browser'].find(x=>fs.existsSync(x));
if(!chrome)throw Error('Chrome not installed');
const browser=await puppeteer.launch({headless:true,executablePath:chrome,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const result=[];fs.mkdirSync('indonesia-live-qa-20261028',{recursive:true});
try{
  for(const viewport of [{name:'desktop',width:1366,height:900},{name:'mobile',width:390,height:844}]){
    for(const lang of ['en','ja'])for(const date of days){
      const page=await browser.newPage();
      const errs=[];
      page.on('pageerror',e=>errs.push(String(e.message).slice(0,250)));
      await page.setViewport({width:viewport.width,height:viewport.height,deviceScaleFactor:1,isMobile:viewport.name==='mobile'});
      const url='https://whr.badjoke-lab.com/'+(lang==='ja'?'ja/':'')+'calendar/?date='+date+'&view=list';
      const id='indonesia-porprov-legokjawa-'+date;
      try{
        const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
        await new Promise(resolve=>setTimeout(resolve,1800));
        const resultRow=await page.evaluate((meetingId)=>{
          const el=Array.from(document.querySelectorAll('[data-calendar-meeting-row]'))
            .find(e=>e.getAttribute('data-meeting-id')===meetingId);
          const selectedDate=document.querySelector('[data-filter-date]')?.value??null;
          const visible=!!el&&el.getClientRects().length>0&&!el.closest('[hidden]')&&
            getComputedStyle(el).visibility!=='hidden'&&getComputedStyle(el).display!=='none';
          const trackLinked=!!el?.querySelector('a[href*="/tracks/indonesia--legokjawa-racecourse/"]');
          const countryFlag=el?.querySelector('.meeting-row__country-flag')?.textContent?.trim()??null;
          return {idFound:!!el,visible,selectedDate,trackLinked,countryFlag,
            sourceDate:el?.getAttribute('data-source-date')??null,
            horizontalOverflow:document.documentElement.scrollWidth>window.innerWidth+2,
            title:document.title};
        },id);
        const passed=response?.status()===200&&resultRow.idFound&&resultRow.visible&&
          resultRow.selectedDate===date&&resultRow.sourceDate===date&&resultRow.trackLinked&&
          resultRow.countryFlag==='🇮🇩'&&
          !resultRow.horizontalOverflow&&errs.length===0;
        result.push({viewport:viewport.name,lang,date,status:response?.status(),...resultRow,pageErrors:errs,pass:passed});
        // Capture the actual Indonesia meeting row rather than only the page hero.
        await page.evaluate((meetingId)=>document.querySelector('[data-meeting-id="'+meetingId+'"]')?.scrollIntoView({block:'center',inline:'nearest'}),id);
        await new Promise(resolve=>setTimeout(resolve,450));
        await page.screenshot({path:path.join('indonesia-live-qa-20261028',viewport.name+'-'+lang+'-'+date+'.png'),fullPage:false});
      }catch(error){
        result.push({viewport:viewport.name,lang,date,error:String(error?.message??error),pass:false});
      }finally{await page.close();}
    }
  }
}finally{await browser.close();}
console.log('INDONESIA_EN_JA_LIVE_SELECTED_DAY',JSON.stringify(result));
assert.equal(result.length,8);
assert.ok(result.every(x=>x.pass),'Indonesian C meetings not correctly rendered in every selected-day viewport');
