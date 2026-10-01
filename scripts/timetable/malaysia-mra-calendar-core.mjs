import {OPS} from 'pdfjs-dist/legacy/build/pdf.mjs';
import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const MALAYSIA_TIMEZONE='Asia/Kuala_Lumpur';
export const MALAYSIA_AUTHORITY_ID='mra';
export const MALAYSIA_SYSTEM_ID='malaysia-mra-system';
export const MALAYSIA_SOURCE_ID='mra-fixtures';
export const MALAYSIA_FIXTURE_URL='https://malayanracing.com/pdf/MRA-Racing-Fixture-2026.pdf';

export const MALAYSIA_RACECOURSES=Object.freeze({
  selangor:{racecourse_id:'malaysia--selangor-turf-club',venue_name:'Selangor Turf Club'},
  perak:{racecourse_id:'malaysia--perak-turf-club',venue_name:'Perak Turf Club'},
});

const MONTHS=Object.freeze({JANUARY:'01',FEBRUARY:'02',MARCH:'03',APRIL:'04',MAY:'05',JUNE:'06',JULY:'07',AUGUST:'08',SEPTEMBER:'09',OCTOBER:'10',NOVEMBER:'11',DECEMBER:'12'});
const COLORS=Object.freeze({
  '255,255,0':'selangor',
  '146,208,80':'perak'
});

function rectChunks(args){
  const nums=args?.[1]??[];
  const out=[];
  for(let i=0;i+7<nums.length;i+=8){
    const xs=[nums[i],nums[i+2],nums[i+4],nums[i+6]].map(Number);
    const ys=[nums[i+1],nums[i+3],nums[i+5],nums[i+7]].map(Number);
    out.push({x1:Math.min(...xs),x2:Math.max(...xs),y1:Math.min(...ys),y2:Math.max(...ys)});
  }
  return out;
}

export function decodeMraFixtureLayout({items,fnArray,argsArray,year=2026}){
  if(!Array.isArray(items)||!Array.isArray(fnArray)||!Array.isArray(argsArray)) throw new Error('MRA fixture layout inputs are required');
  const normalized=items.map(x=>({str:String(x.str??'').trim(),x:Number(x.x??x.transform?.[4]??0),y:Number(x.y??x.transform?.[5]??0),w:Number(x.w??x.width??0)}));
  const monthRows=new Map();
  for(const item of normalized){
    const month=MONTHS[item.str.toUpperCase()];
    if(!month) continue;
    monthRows.set(Number(month),normalized.filter(x=>/^\d{1,2}$/.test(x.str)&&Math.abs(x.y-item.y)<0.2));
  }
  if(monthRows.size!==12) throw new Error('MRA fixture month rows incomplete: '+monthRows.size);

  const fixtures=[],ignoredDecorativeRects=[];
  let fillColor=null;
  for(let n=0;n<fnArray.length;n++){
    const fn=fnArray[n],args=argsArray[n];
    if(fn===OPS.setFillRGBColor){
      fillColor=Array.from(args??[]).map(Number);
      continue;
    }
    if(fn!==OPS.constructPath||!fillColor) continue;
    const club=COLORS[fillColor.join(',')];
    if(!club) continue;
    for(const rect of rectChunks(args)){
      const month=Math.round((rect.y1-90.080002)/43.84)+1;
      if(month<1||month>12){ignoredDecorativeRects.push({rect,fillColor});continue;}
      const expectedRowY=90.080002+((month-1)*43.84);
      if(Math.abs(rect.y1-expectedRowY)>1){ignoredDecorativeRects.push({rect,fillColor});continue;}
      const x1=rect.x1*0.75,x2=rect.x2*0.75;
      const candidates=(monthRows.get(month)??[]).filter(item=>{
        const cx=item.x+(item.w/2);
        return cx>=x1-0.5&&cx<=x2+0.5;
      });
      for(const item of candidates){
        const meta=MALAYSIA_RACECOURSES[club];
        fixtures.push({
          date:String(year)+'-'+String(month).padStart(2,'0')+'-'+String(Number(item.str)).padStart(2,'0'),
          club,
          racecourse_id:meta.racecourse_id,
          venue_name:meta.venue_name,
          source_url:MALAYSIA_FIXTURE_URL,
        });
      }
    }
  }
  const unique=[...new Map(fixtures.map(x=>[x.date+'|'+x.club,x])).values()].sort((a,b)=>a.date.localeCompare(b.date)||a.club.localeCompare(b.club));
  const totals={selangor:unique.filter(x=>x.club==='selangor').length,perak:unique.filter(x=>x.club==='perak').length,total:unique.length};
  return {fixtures:unique,totals,ignoredDecorativeRects};
}

export async function parseMraFixturePage(page,{year=2026}={}){
  const tc=await page.getTextContent();
  const items=tc.items.map(x=>({str:String(x.str??'').trim(),x:Number(x.transform?.[4]??0),y:Number(x.transform?.[5]??0),w:Number(x.width??0)}));
  const opList=await page.getOperatorList();
  return decodeMraFixtureLayout({items,fnArray:opList.fnArray,argsArray:opList.argsArray,year});
}

function evidence(url,checkedAt){return {source_id:MALAYSIA_SOURCE_ID,official_source_url:url,observed_at:checkedAt,successfully_verified_at:checkedAt,acquisition_method:'automatic'};}
export function buildMalaysiaMeetingRecord(row,{checkedAt}={}){
  const meetingId='malaysia-'+row.date+'-'+row.club;
  const e=evidence(row.source_url,checkedAt);
  const record={
    candidate_id:meetingId,meeting_id:meetingId,country_id:'malaysia',
    authority_id:MALAYSIA_AUTHORITY_ID,racing_system_id:MALAYSIA_SYSTEM_ID,
    racecourse_id:row.racecourse_id,date:row.date,timezone:MALAYSIA_TIMEZONE,
    racing_type:'thoroughbred-flat',first_race_time_local:null,last_race_time_local:null,timetable_rows:[],
    source:{source_id:MALAYSIA_SOURCE_ID,official_url:row.source_url,checked_at:checkedAt,extraction_method:'official_mra_2026_fixture_pdf_color_cells'},
    route_id:'mra-fixtures',confidence:'high',review_status:'needs_review',
    notes:'Official MRA 2026 fixture confirms meeting date and physical racecourse. Yellow fixture cells map to Selangor Turf Club and green cells map to Perak Turf Club. Race post times are not inferred.',
    detail_observation:{status:'not_applicable',evaluated_capability_rank:'C',race_count:0,calendar_url:row.source_url},
    acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:MALAYSIA_SOURCE_ID,route_id:'mra-fixtures',error_code:null},
    evidence_support:{meeting_identity:e,meeting_date:e},
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion({...record,capability_rank},{technical_capability_rank:'C'});
  return {...record,capability_rank};
}
