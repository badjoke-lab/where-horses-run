import fs from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  NEW_ZEALAND_TIMEZONE,
  NZTR_AUTHORITY_ID,NZTR_SYSTEM_ID,NZTR_RPG_SOURCE_ID,NZTR_RPG_LANDING_URL,
  LOVERACING_SOURCE_ID,LOVERACING_INDEX_URL,
  HRNZ_AUTHORITY_ID,HRNZ_SYSTEM_ID,HRNZ_SOURCE_ID,HRNZ_INDEX_URL,
  parseNztrRpgLandingPage,parseNztrRpgProgrammeText,parseLoveracingIndex,parseLoveracingMeetingPage,
  parseHrnzIndex,parseHrnzMonthPage,parseHrnzProgrammePage,
  buildNztrFixtureRecord,buildLoveracingDetailedRecord,buildHrnzRecord,
} from './new-zealand-official-core.mjs';

function arg(name,fallback=null){const v=process.argv.find(x=>x.startsWith(`--${name}=`));return v?v.slice(name.length+3):fallback;}
function plusDays(date,count){const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function localDate(now=new Date()){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:NEW_ZEALAND_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const v=Object.fromEntries(parts.filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
  return `${v.year}-${v.month}-${v.day}`;
}
function inWindow(date,start,end){return date>=start&&date<end;}
async function getHtml(url){
  const response=await fetch(url,{redirect:'follow',headers:{
    'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
    accept:'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5','accept-language':'en-NZ,en;q=0.9'
  },signal:AbortSignal.timeout(25000)});
  if(!response.ok) throw new Error(`HTTP ${response.status}`);
  return {html:await response.text(),url:response.url||url};
}
async function getPdfText(url){
  const response=await fetch(url,{redirect:'follow',headers:{
    'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
    accept:'application/pdf,*/*;q=0.8','accept-language':'en-NZ,en;q=0.9'
  },signal:AbortSignal.timeout(30000)});
  if(!response.ok) throw new Error(`HTTP ${response.status}`);
  const bytes=new Uint8Array(await response.arrayBuffer());
  if(bytes.length<4||String.fromCharCode(...bytes.slice(0,4))!=='%PDF') throw new Error('NZTR RPG response is not PDF');
  const pdf=await getDocument({data:bytes,disableWorker:true}).promise;
  const lines=[];
  for(let pageNumber=1;pageNumber<=pdf.numPages;pageNumber+=1){
    const page=await pdf.getPage(pageNumber);
    const content=await page.getTextContent();
    let line='';
    for(const item of content.items){
      if(!('str' in item)) continue;
      const value=item.str.replace(/\s+/g,' ').trim();
      if(value) line+=`${line?' ':''}${value}`;
      if(item.hasEOL&&line){lines.push(line);line='';}
    }
    if(line) lines.push(line);
  }
  return lines.join('\n');
}
function write(file,value){const target=path.resolve(file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,`${JSON.stringify(value,null,2)}\n`);}
function rankCounts(records){return Object.fromEntries(['C','B','B+','A','A+'].map(rank=>[rank,records.filter(r=>r.capability_rank===rank).length]));}
function detailCounts(records){return Object.fromEntries(['available','not_published','source_error','parser_failure'].map(status=>[status,records.filter(r=>r.detail_observation?.status===status).length]));}

const thoroughbredOutput=arg('thoroughbred-output');
const harnessOutput=arg('harness-output');
const days=Number(arg('days','30'));
const start=arg('as-of',localDate());
if(!thoroughbredOutput||!harnessOutput) throw new Error('--thoroughbred-output=<path> and --harness-output=<path> are required');
if(!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('--as-of must be YYYY-MM-DD');
if(!Number.isInteger(days)||days<1||days>62) throw new Error('--days must be 1..62');
const end=plusDays(start,days);
const generatedAt=new Date().toISOString();

// Thoroughbred mother set: current NZTR Racing Programme Guide.
const tbDiagnostics={source_errors:[],parse_failures:[],unknown_venues:[]};
let rpgProgrammeUrl=null;
let thoroughbredRows=[];
try{
  const landing=await getHtml(NZTR_RPG_LANDING_URL);
  const parsedLanding=parseNztrRpgLandingPage(landing.html,{sourceUrl:landing.url});
  rpgProgrammeUrl=parsedLanding.programme_url;
  const programmeText=await getPdfText(rpgProgrammeUrl);
  thoroughbredRows=parseNztrRpgProgrammeText(programmeText).filter(row=>inWindow(row.date,start,end));
}catch(error){
  tbDiagnostics.source_errors.push({stage:'nztr_rpg',source_url:rpgProgrammeUrl??NZTR_RPG_LANDING_URL,error:String(error?.message??error)});
}

// Current LOVERACING detail links can promote source-visible upcoming meetings to A.
const loveracingDetails=new Map();
try{
  const index=await getHtml(LOVERACING_INDEX_URL);
  const detailUrls=parseLoveracingIndex(index.html,{sourceUrl:index.url});
  for(const url of detailUrls){
    try{
      const fetched=await getHtml(url);
      const detail=parseLoveracingMeetingPage(fetched.html,{sourceUrl:fetched.url});
      if(!inWindow(detail.date,start,end)) continue;
      loveracingDetails.set(`${detail.date}/${detail.racecourse_id}`,detail);
    }catch(error){
      tbDiagnostics.source_errors.push({stage:'loveracing_meeting',source_url:url,error:String(error?.message??error)});
    }
  }
}catch(error){
  tbDiagnostics.source_errors.push({stage:'loveracing_index',source_url:LOVERACING_INDEX_URL,error:String(error?.message??error)});
}

const thoroughbredRecords=thoroughbredRows.map(row=>{
  const detail=loveracingDetails.get(`${row.date}/${row.racecourse_id}`);
  if(detail?.timetable_rows?.length){
    return buildLoveracingDetailedRecord(row,detail,{checkedAt:generatedAt,programmeUrl:rpgProgrammeUrl});
  }
  return buildNztrFixtureRecord(row,{checkedAt:generatedAt,programmeUrl:rpgProgrammeUrl});
});

// Harness: current HRNZ season index -> month pages -> programme pages.
const harnessDiagnostics={source_errors:[],parse_failures:[],unknown_venues:[]};
const harnessRecords=[];
const seenHarness=new Set();
try{
  const index=await getHtml(HRNZ_INDEX_URL);
  const monthUrls=parseHrnzIndex(index.html,{sourceUrl:index.url});
  for(const monthUrl of monthUrls){
    let rows=[];
    try{
      const month=await getHtml(monthUrl);
      rows=parseHrnzMonthPage(month.html,{sourceUrl:month.url}).filter(row=>inWindow(row.date,start,end));
    }catch(error){
      harnessDiagnostics.source_errors.push({stage:'hrnz_month',source_url:monthUrl,error:String(error?.message??error)});
      continue;
    }
    for(const row of rows){
      const preliminaryKey=`${row.date}/${row.programme_url}`;
      if(seenHarness.has(preliminaryKey)) continue;
      seenHarness.add(preliminaryKey);
      try{
        const programme=await getHtml(row.programme_url);
        const detail=parseHrnzProgrammePage(programme.html,{date:row.date,clubLabel:row.club_label,sourceUrl:programme.url});
        const record=buildHrnzRecord(detail,{
          checkedAt:generatedAt,calendarUrl:row.source_url,
          detailStatus:detail.first_race_time_local?'available':'not_published',
          attemptStatus:detail.first_race_time_local?'success':'pending_publication',
          errorCode:null,
        });
        harnessRecords.push(record);
      }catch(error){
        harnessDiagnostics.source_errors.push({stage:'hrnz_programme',date:row.date,club_label:row.club_label,source_url:row.programme_url,error:String(error?.message??error)});
      }
    }
  }
}catch(error){
  harnessDiagnostics.source_errors.push({stage:'hrnz_index',source_url:HRNZ_INDEX_URL,error:String(error?.message??error)});
}

thoroughbredRecords.sort((a,b)=>a.date.localeCompare(b.date)||a.racecourse_id.localeCompare(b.racecourse_id));
harnessRecords.sort((a,b)=>a.date.localeCompare(b.date)||a.racecourse_id.localeCompare(b.racecourse_id));

const thoroughbred={
  schema_version:'new-zealand-thoroughbred-official-window-candidates-v1',
  generated_at:generatedAt,country_id:'new-zealand',authority_id:NZTR_AUTHORITY_ID,racing_system_id:NZTR_SYSTEM_ID,timezone:NEW_ZEALAND_TIMEZONE,
  source_id:NZTR_RPG_SOURCE_ID,detail_source_id:LOVERACING_SOURCE_ID,collection_target_rank:'best_available',raw_body_retained:false,
  acquisition_attempt:{attempted_at:generatedAt,status:rpgProgrammeUrl?'success':'network_error',source_id:NZTR_RPG_SOURCE_ID,route_id:'nztr-rpg-current-programmes',error_code:rpgProgrammeUrl?null:'fetch_error'},
  discovery:{method:'nztr_rpg_plus_current_loveracing_meeting_details',schedule_source_url:rpgProgrammeUrl??NZTR_RPG_LANDING_URL,detail_source_url:LOVERACING_INDEX_URL,rank_counts:rankCounts(thoroughbredRecords),detail_status_counts:detailCounts(thoroughbredRecords)},
  window:{start_date:start,end_date_exclusive:end,days,coverage_claim:tbDiagnostics.source_errors.some(x=>x.stage==='nztr_rpg')?'partial_source_visible_horizon':'official_programme_guide_horizon',coverage_note:'The latest NZTR Racing Programme Guide is the Thoroughbred mother set for the requested window. Current LOVERACING meeting pages promote published complete race-time rows through rank A. Detail not yet published remains C/pending. Source absence or acquisition failure never confirms non-running.'},
  records:thoroughbredRecords,diagnostics:tbDiagnostics,
};
const harness={
  schema_version:'new-zealand-hrnz-official-window-candidates-v1',
  generated_at:generatedAt,country_id:'new-zealand',authority_id:HRNZ_AUTHORITY_ID,racing_system_id:HRNZ_SYSTEM_ID,timezone:NEW_ZEALAND_TIMEZONE,
  source_id:HRNZ_SOURCE_ID,detail_source_id:HRNZ_SOURCE_ID,collection_target_rank:'best_available',raw_body_retained:false,
  acquisition_attempt:{attempted_at:generatedAt,status:harnessDiagnostics.source_errors.some(x=>x.stage==='hrnz_index')?'network_error':'success',source_id:HRNZ_SOURCE_ID,route_id:'hrnz-racing-dates',error_code:harnessDiagnostics.source_errors.some(x=>x.stage==='hrnz_index')?'fetch_error':null},
  discovery:{method:'hrnz_racing_dates_plus_programme_pages',schedule_source_url:HRNZ_INDEX_URL,detail_source_url:HRNZ_INDEX_URL,rank_counts:rankCounts(harnessRecords),detail_status_counts:detailCounts(harnessRecords)},
  window:{start_date:start,end_date_exclusive:end,days,coverage_claim:harnessDiagnostics.source_errors.some(x=>x.stage==='hrnz_index')?'partial_source_visible_horizon':'official_hrnz_calendar_horizon',coverage_note:'Official HRNZ Racing Dates month pages provide the harness meeting mother set. Linked official programme pages resolve the physical venue and may provide the first-race start time through rank B. Missing or failed programme retrieval is a retry state and never negative evidence.'},
  records:harnessRecords,diagnostics:harnessDiagnostics,
};
write(thoroughbredOutput,thoroughbred);
write(harnessOutput,harness);
console.log(JSON.stringify({
  start_date:start,end_date_exclusive:end,
  thoroughbred:{output:thoroughbredOutput,meetings:thoroughbredRecords.length,rank_counts:thoroughbred.discovery.rank_counts,detail_status_counts:thoroughbred.discovery.detail_status_counts,source_errors:tbDiagnostics.source_errors.length},
  harness:{output:harnessOutput,meetings:harnessRecords.length,rank_counts:harness.discovery.rank_counts,detail_status_counts:harness.discovery.detail_status_counts,source_errors:harnessDiagnostics.source_errors.length},
  raw_body_retained:false,
}));
