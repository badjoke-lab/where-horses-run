import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const UNITED_KINGDOM_TIMEZONE = 'Europe/London';
export const BHA_AUTHORITY_ID = 'british-horseracing-authority';
export const BHA_SYSTEM_ID = 'united-kingdom-bha-system';
export const BHA_SOURCE_ID = 'bha-fixtures';
export const BHA_FULL_YEAR_URL = 'https://www.britishhorseracing.com/racing/fixtures/full-year/';
export const BHA_2026_FIXTURE_PDF_URL = 'https://media.britishhorseracing.com/bha/Fixture_List/2026_Fixture_List.pdf';

const MONTHS = Object.freeze({
  jan:1,january:1,feb:2,february:2,mar:3,march:3,apr:4,april:4,may:5,
  jun:6,june:6,jul:7,july:7,aug:8,august:8,sep:9,sept:9,september:9,
  oct:10,october:10,nov:11,november:11,dec:12,december:12,
});

const WEEKDAYS = new Set(['monday','tuesday','wednesday','thursday','friday','saturday','sunday']);
const NON_VENUE = new Set([
  'racecourse','premier raceday','evening','floodlit','flat','jump',
  '2026 fixture list','fixture list',
]);

const VENUE_ALIASES = Object.freeze({
  'bangor-on-dee':'bangor-on-dee-racecourse',
  'catterick-bridge':'catterick-racecourse',
  'chelmsford-city':'chelmsford-city-racecourse',
  'epsom-downs':'epsom-downs-racecourse',
  'ffos-las':'ffos-las-racecourse',
  'fontwell-park':'fontwell-park-racecourse',
  'hamilton-park':'hamilton-park-racecourse',
  'haydock-park':'haydock-park-racecourse',
  'kempton-park':'kempton-park-racecourse',
  'lingfield-park':'lingfield-park-racecourse',
  'newmarket':'newmarket-racecourse',
  'newcastle':'newcastle-racecourse',
  'newton-abbot':'newton-abbot-racecourse',
  'sandown-park':'sandown-park-racecourse',
  'stratford-on-avon':'stratford-upon-avon-racecourse',
  'southwell':'southwell-racecourse',
  'wolverhampton':'wolverhampton-racecourse',
});

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/&#x([0-9a-f]+);/gi,(_,code)=>String.fromCodePoint(Number.parseInt(code,16)))
    .replace(/&#(\d+);/g,(_,code)=>String.fromCodePoint(Number(code)));
}

function visibleText(value) {
  return decodeHtml(String(value ?? ''))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/\s+/g,' ')
    .trim();
}

function slugify(value) {
  return normalize(value)
    .replace(/[\u2018\u2019']/g,' ')
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-|-$/g,'')
    .replace(/-+/g,'-');
}

function pad(value){return String(value).padStart(2,'0');}
function isoDate(year,month,day){return `${year}-${pad(month)}-${pad(day)}`;}
function absoluteUrl(href,baseUrl){try{return new URL(decodeHtml(href),baseUrl).toString();}catch{return null;}}

export function resolveBhaRacecourseId(label) {
  const cleaned=String(label ?? '')
    .replace(/\s+\((?:E|F)\)\s*$/i,'')
    .replace(/\s+/g,' ')
    .trim();
  const slug=slugify(cleaned);
  return VENUE_ALIASES[slug] ?? `${slug}-racecourse`;
}

export function parseBhaFullYearPage(html,{year,sourceUrl=BHA_FULL_YEAR_URL}={}) {
  if(typeof html!=='string'||!html.trim()) throw new Error('BHA full-year HTML must be non-empty');
  if(!/Fixture List/i.test(visibleText(html))) throw new Error('BHA full-year fixture-list fingerprint missing');
  const target=String(year);
  const pdfs=[];
  for(const match of html.matchAll(/<a\b[^>]*href\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi)){
    const href=match[1]??match[2]??match[3]??'';
    const label=visibleText(match[4]);
    const url=absoluteUrl(href,sourceUrl);
    if(!url||!/[.]pdf(?:$|[?#])/i.test(url)) continue;
    if(label.includes(target)||url.includes(`/${target}_Fixture_List.pdf`)||url.includes(`${target}_Fixture_List.pdf`)){
      pdfs.push({url,label});
    }
  }
  if(!pdfs.length) return null;
  const exact=pdfs.find(row=>new RegExp(`\\b${target}\\b.*Fixture List`,'i').test(row.label));
  return (exact??pdfs[0]).url;
}

function dateFromToken(token,year){
  const match=String(token??'').trim().match(/^(\d{1,2})-([A-Za-z]{3,9})$/);
  if(!match) return null;
  const month=MONTHS[slugify(match[2]).replace(/-/g,'')];
  if(!month) return null;
  return isoDate(year,month,Number(match[1]));
}

function cleanVenueCell(value){
  const text=String(value??'').replace(/\s+/g,' ').trim();
  if(!text) return null;
  const lower=normalize(text);
  if(WEEKDAYS.has(lower)||MONTHS[slugify(text).replace(/-/g,'')]||NON_VENUE.has(lower)) return null;
  if(/^\d{1,2}-[A-Za-z]{3,9}$/.test(text)) return null;
  if(/^20\d{2}\s+fixture list$/i.test(text)) return null;
  const cleaned=text.replace(/\s+\((?:E|F)\)\s*$/i,'').trim();
  if(!/[A-Za-z]/.test(cleaned)) return null;
  return cleaned;
}

export function parseBhaFixturePdfItems(items,{year,sourceUrl}={}) {
  if(!Array.isArray(items)||!items.length) throw new Error('BHA fixture PDF items must be non-empty');
  if(!Number.isInteger(year)||year<2000||year>2100) throw new Error('BHA fixture year must be valid');
  const normalizedItems=items
    .map(item=>({
      page:Number(item.page??1),
      x:Number(item.x),
      y:Number(item.y),
      str:String(item.str??'').replace(/\s+/g,' ').trim(),
    }))
    .filter(item=>item.str&&Number.isFinite(item.page)&&Number.isFinite(item.x)&&Number.isFinite(item.y));

  const rows=[];
  const pages=[...new Set(normalizedItems.map(item=>item.page))].sort((a,b)=>a-b);
  for(const page of pages){
    const pageItems=normalizedItems.filter(item=>item.page===page).sort((a,b)=>b.y-a.y||a.x-b.x);
    const groups=[];
    for(const item of pageItems){
      let group=groups.find(row=>Math.abs(row.y-item.y)<=2.25);
      if(!group){group={y:item.y,items:[]};groups.push(group);}
      group.items.push(item);
    }
    for(const group of groups){
      const cells=group.items.sort((a,b)=>a.x-b.x).map(item=>item.str);
      const dateIndex=cells.findIndex(cell=>dateFromToken(cell,year));
      if(dateIndex<0) continue;
      const date=dateFromToken(cells[dateIndex],year);
      const venueLabels=cells.slice(dateIndex+1)
        .map(cleanVenueCell)
        .filter(Boolean);
      if(!venueLabels.length) continue;
      for(const venue_label of venueLabels){
        rows.push({
          date,
          venue_label,
          racecourse_id:resolveBhaRacecourseId(venue_label),
          source_url:sourceUrl,
          source_kind:'annual_fixture_pdf',
        });
      }
    }
  }
  const deduped=new Map();
  for(const row of rows) deduped.set(`${row.date}/${row.racecourse_id}`,row);
  return [...deduped.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.racecourse_id.localeCompare(b.racecourse_id));
}

export function applyReviewedBhaSupplement(rows,supplement) {
  if(!supplement||!Array.isArray(supplement.fixtures)) return rows;
  const byDate=new Map();
  for(const fixture of supplement.fixtures){
    if(!fixture?.date||!Array.isArray(fixture.racecourse_ids)) continue;
    byDate.set(fixture.date,fixture.racecourse_ids);
  }
  const kept=rows.filter(row=>!byDate.has(row.date));
  const overrides=supplement.source_overrides??{};
  for(const [date,racecourseIds] of byDate){
    for(const racecourse_id of racecourseIds){
      const meetingId=`bha-${racecourse_id}-${date}`;
      kept.push({
        date,
        venue_label:null,
        racecourse_id,
        source_url:overrides[meetingId]??supplement.annual_source_url??BHA_2026_FIXTURE_PDF_URL,
        source_kind:overrides[meetingId]?'reviewed_bha_transfer_override':'reviewed_bha_fixture_snapshot',
      });
    }
  }
  return kept.sort((a,b)=>a.date.localeCompare(b.date)||a.racecourse_id.localeCompare(b.racecourse_id));
}

function evidence(url,checkedAt){
  return {
    source_id:BHA_SOURCE_ID,
    official_source_url:url,
    observed_at:checkedAt,
    successfully_verified_at:checkedAt,
    acquisition_method:'automatic',
  };
}

export function buildBhaFixtureRecord(row,{checkedAt}={}) {
  const meetingId=`bha-${row.racecourse_id}-${row.date}`;
  const sourceUrl=row.source_url??BHA_2026_FIXTURE_PDF_URL;
  const e=evidence(sourceUrl,checkedAt);
  const record={
    candidate_id:meetingId,
    meeting_id:meetingId,
    country_id:'united-kingdom',
    authority_id:BHA_AUTHORITY_ID,
    racing_system_id:BHA_SYSTEM_ID,
    racecourse_id:row.racecourse_id,
    date:row.date,
    timezone:UNITED_KINGDOM_TIMEZONE,
    first_race_time_local:null,
    last_race_time_local:null,
    timetable_rows:[],
    source:{
      source_id:BHA_SOURCE_ID,
      official_url:sourceUrl,
      checked_at:checkedAt,
      extraction_method:row.source_kind==='reviewed_bha_transfer_override'?'reviewed_bha_transfer_override':'official_bha_fixture_pdf',
    },
    route_id:row.source_kind==='reviewed_bha_transfer_override'?'bha-reviewed-transfer-override':'bha-annual-fixture-pdf',
    confidence:'high',
    review_status:'needs_review',
    notes:'Official BHA national fixture observation at meeting-date/racecourse level only; no race times claimed.',
    detail_observation:{
      status:'available',
      evaluated_capability_rank:'C',
      race_count:0,
      fixture_source_url:sourceUrl,
    },
    acquisition_attempt:{
      attempted_at:checkedAt,
      status:'success',
      source_id:BHA_SOURCE_ID,
      route_id:row.source_kind==='reviewed_bha_transfer_override'?'bha-reviewed-transfer-override':'bha-annual-fixture-pdf',
      error_code:null,
    },
    evidence_support:{meeting_identity:e,meeting_date:e},
  };
  const capability_rank=deriveBestAvailableRank(record,[]);
  record.acquisition_completion=classifyAcquisitionCompletion(
    {...record,capability_rank},
    {technical_capability_rank:'C'},
  );
  return {...record,capability_rank};
}
