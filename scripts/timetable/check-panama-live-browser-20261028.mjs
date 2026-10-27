// Read-only Chromium runtime QA of deployed Calendar and Panama track pages.
// This does NOT force past C-only meetings into the rolling future Calendar.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { execFileSync } from 'node:child_process';

// The DOM may contain Japanese text even when the CI browser draws empty tofu
// squares. A successful DOM/horizontal-overflow check is not visual QA without
// Japanese glyph coverage in the headless fontconfig environment.
const japaneseFonts=execFileSync('fc-list',[':lang=ja','family'],{encoding:'utf8'}).trim();
assert.ok(japaneseFonts.length>0,'Japanese fontconfig glyph coverage is required for visual QA');
console.log('PANAMA_JA_RENDER_FONT',japaneseFonts.split('\n').slice(0,4).join(' | '));

const binary=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable',
  '/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>fs.existsSync(p));
if(!binary)throw new Error('Chrome/Chromium is not installed on the Actions runner');
const browser=await puppeteer.launch({headless:true,executablePath:binary,
  args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const targets=[
  {key:'en-calendar',url:'https://whr.badjoke-lab.com/calendar/',text:'Global horse racing calendar'},
  {key:'ja-calendar',url:'https://whr.badjoke-lab.com/ja/calendar/',text:'世界の競馬開催カレンダー'},
  {key:'en-track',url:'https://whr.badjoke-lab.com/tracks/panama--hipodromo-presidente-remon/',text:'Presidente'},
  {key:'ja-track',url:'https://whr.badjoke-lab.com/ja/tracks/panama--hipodromo-presidente-remon/',text:'Presidente'},
];
const widths=[{name:'desktop',width:1366,height:900},{name:'mobile',width:390,height:844}];
fs.mkdirSync('panama-live-browser-qa',{recursive:true});
const results=[];
try{
  for(const size of widths)for(const target of targets){
    const page=await browser.newPage();
    const pageErrors=[];
    page.on('pageerror',e=>pageErrors.push(String(e.message).slice(0,350)));
    await page.setViewport({width:size.width,height:size.height,deviceScaleFactor:1,isMobile:size.name==='mobile'});
    try{
      const response=await page.goto(target.url,{waitUntil:'domcontentloaded',timeout:30000});
      await new Promise(resolve=>setTimeout(resolve,1200));
      const actual=await page.evaluate(()=>({
        title:document.title,
        h1:document.querySelector('h1')?.textContent?.trim()??'',
        innerWidth:window.innerWidth,
        scrollWidth:document.documentElement.scrollWidth,
        bodyWidth:document.body.scrollWidth,
        mainVisible:!!document.querySelector('main')&&
          getComputedStyle(document.querySelector('main')).display!=='none'
      }));
      const overflow=Math.max(actual.scrollWidth,actual.bodyWidth)>actual.innerWidth+2;
      const passed=(response?.status()===200)&&actual.h1.includes(target.text)&&
        actual.mainVisible&&!overflow&&pageErrors.length===0;
      const item={key:target.key,viewport:size.name,http:response?.status(),...actual,
        overflow,page_errors:pageErrors,pass:passed};
      results.push(item);
      await page.screenshot({path:path.join('panama-live-browser-qa',size.name+'-'+target.key+'.png'),fullPage:false});
    }catch(error){
      results.push({key:target.key,viewport:size.name,error:String(error?.message??error),pass:false});
    }finally{await page.close();}
  }
}finally{await browser.close();}
console.log('PANAMA_EN_JA_CHROME_RENDERED_QA',JSON.stringify(results));
assert.equal(results.length,8,'All four EN/JA pages must be checked in both viewports');
assert.ok(results.every(x=>x.pass),'At least one live rendered page failed');
