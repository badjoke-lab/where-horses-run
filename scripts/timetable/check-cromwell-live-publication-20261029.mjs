import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import puppeteer from 'puppeteer-core';

const id='new-zealand-thoroughbred-cromwell-racecourse-2026-11-27';
const date='2026-11-27';
const venue='cromwell-racecourse';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const publicList=read('data/generated/timetable/public/meeting-list.json');
const canonical=read('data/generated/timetable/canonical/meetings.json');
const loc=read('data/static/racecourse-locations-v1.json');
const venueData=read('data/static/racecourses-public-timetable-identities-v1.json');
for(const [name,data] of [['canonical',canonical],['public',publicList]]){
  const matches=data.meetings.filter(x=>x.meeting_id===id);
  assert.equal(matches.length,1,name+' must hold exactly one Cromwell November 27 meeting');
  const row=matches[0];
  assert.equal(row.date,date); assert.equal(row.racecourse_id,venue);
  assert.equal(row.country_id,'new-zealand'); assert.equal(row.capability_rank,'C');
  assert.equal(row.first_race_time_local,null); assert.equal(row.last_race_time_local,null);
  if(name==='public'){
    assert.equal(row.effective_public_rank,'C');
    assert.equal(row.detail_path,null);
    assert.deepEqual(row.live_media??[],[],'C-only fact must not fabricate live streams');
  }
}
assert.equal(venueData.filter(x=>x.id===venue).length,1);
const venuePin=loc.locations.filter(x=>x.id===venue);
assert.equal(venuePin.length,1);
assert.equal(venuePin[0].location.precision,'venue_approximate');
console.log('CROMWELL_PERSISTENCE_AND_LOCATION',JSON.stringify({canonical:canonical.generated_at,public:publicList.generated_at,id,date,venue,pinPrecision:venuePin[0].location.precision}));

const fonts=execFileSync('fc-list',[':lang=ja','family'],{encoding:'utf8'}).trim();
assert.ok(fonts,'Japanese glyphs missing in browser runner');
const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>fs.existsSync(p));
if(!chrome)throw Error('Chromium required');
const browser=await puppeteer.launch({headless:true,executablePath:chrome,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const results=[];const dir='cromwell-live-qa-20261029';fs.mkdirSync(dir,{recursive:true});
try{
  for(const vp of [{name:'desktop',width:1366,height:900},{name:'mobile',width:390,height:844}])
    for(const lang of ['en','ja']){
      const page=await browser.newPage();
      const errors=[];
      page.on('pageerror',e=>errors.push(String(e.message).slice(0,300)));
      await page.setViewport({width:vp.width,height:vp.height,deviceScaleFactor:1,isMobile:vp.name==='mobile'});
      const base='https://whr.badjoke-lab.com/'+(lang==='ja'?'ja/':'');
      // Explicit Asia/Tokyo is required: on Oct 28 UTC, Nov 27 falls outside a 30-day UTC window,
      // while it falls inside the Oct 29 JST through Nov 27 JST window.
      const url=base+'calendar/?date='+date+'&view=list&tz=Asia%2FTokyo';
      try{
        const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
        await new Promise(res=>setTimeout(res,1500));
        const state=await page.evaluate((id,venue)=>{
          const row=Array.from(document.querySelectorAll('[data-calendar-meeting-row]')).find(el=>el.getAttribute('data-meeting-id')===id);
          const selected=document.querySelector('[data-filter-date]')?.value??null;
          const runtime=window.__WHR_CALENDAR_RUNTIME__??null;
          const styles=row?getComputedStyle(row):null;
          const visible=!!row&&row.getClientRects().length>0&&!row.closest('[hidden]')&&styles.display!=='none'&&styles.visibility!=='hidden';
          const venueLink=row?.querySelector('a[href*="/tracks/'+venue+'/"]')??null;
          const flag=row?.querySelector('.meeting-row__country-flag')?.textContent?.trim()??null;
          const mapText=document.querySelector('[data-calendar-map-meeting-map]')?.textContent??'';
          let markerRecord=null;
          try{markerRecord=JSON.parse(mapText).find(x=>x.meetingId===id)??null;}catch{}
          return {
            selected,runtimeTimeZone:runtime?.timeZone??null,runtimeStart:runtime?.windowStart??null,runtimeEnd:runtime?.windowEndInclusive??null,
            found:!!row,visible,flag,
            sourceDate:row?.dataset.sourceDate??null,
            firstTime:row?.dataset.firstRaceTime??null,
            lastTime:row?.dataset.lastRaceTime??null,
            venueHref:venueLink?.getAttribute('href')??null,
            mapRecord:markerRecord,
            overflow:document.documentElement.scrollWidth>window.innerWidth+2
          };
        },id,venue);
        const expectedHref=(lang==='ja'?'/ja':'')+'/tracks/cromwell-racecourse/';
        const expectedMap={meetingId:id,racecourseId:venue,racecourseSlug:venue,hasReviewedLocation:true};
        const route=new URL(state.venueHref??'/',base);
        const listPass=response?.status()===200&&state.selected===date&&state.runtimeTimeZone==='Asia/Tokyo'&&
          state.runtimeStart<=date&&state.runtimeEnd>=date&&state.found&&state.visible&&
          state.flag==='🇳🇿'&&state.sourceDate===date&&state.firstTime===''&&state.lastTime===''&&
          route.pathname===expectedHref&&route.searchParams.get('tz')==='Asia/Tokyo'&&
          JSON.stringify(state.mapRecord)===JSON.stringify(expectedMap)&&
          !state.overflow&&errors.length===0;
        if(state.found){
          await page.evaluate(id=>document.querySelector('[data-meeting-id="'+id+'"]')?.scrollIntoView({block:'center'}),id);
          await new Promise(res=>setTimeout(res,350));
        }
        await page.screenshot({path:path.join(dir,vp.name+'-'+lang+'-list.png'),fullPage:false});
        const trackResp=await page.goto(base+'tracks/cromwell-racecourse/',{waitUntil:'domcontentloaded',timeout:30000});
        await new Promise(res=>setTimeout(res,450));
        const track=await page.evaluate(()=>({h1:document.querySelector('h1')?.textContent?.trim()??'',hasMain:!!document.querySelector('main'),overflow:document.documentElement.scrollWidth>window.innerWidth+2}));
        await page.screenshot({path:path.join(dir,vp.name+'-'+lang+'-track.png'),fullPage:false});
        const trackPass=trackResp?.status()===200&&track.hasMain&&/Cromwell|クロムウェル/i.test(track.h1)&&!track.overflow;
        const item={viewport:vp.name,lang,http:response?.status(),...state,trackStatus:trackResp?.status(),track,errors,pass:listPass&&trackPass};
        console.log('CROMWELL_BROWSER_CASE',JSON.stringify(item));results.push(item);
      }catch(e){results.push({viewport:vp.name,lang,error:String(e.message??e),pass:false});}
      finally{await page.close();}
    }
}finally{await browser.close();}
assert.equal(results.length,4);
assert.ok(results.every(r=>r.pass),'Cromwell EN/JA desktop/mobile publication, map registration or track page FAILED');
console.log('CROMWELL_DEPLOYED_ENJA_4_OF_4_PASS');
