/** First-party federation + city-government date/physical venue facts only. */
export const KZ=Object.freeze({
 country_id:'kazakhstan',system_id:'kazakhstan-baige-2026-championship',
 authority_id:'almaty-city-sports-office',
 source_id:'kazakhstan-almaty-city-government-final-2026',
 racecourse_id:'kazakhstan--almaty-hippodrome',timezone:'Asia/Almaty',
 date:'2026-10-10',
 federation:'https://baigefederation.kz/kz/horse-racing',
 city:'https://www.gov.kz/org/almaty/press/news/details/1308419'
});
const text=s=>String(s).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
 .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ')
 .replace(/&(?:nbsp|#160);/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ');
export function checkFederation(html){
 const t=text(html);
 if(!(/2026/.test(t)&&/(?:Қазан|Октябрь|October)/i.test(t)
 &&/(?:VIII|8\s*(?:кезең|этап))/i.test(t)&&/10[./]10/.test(t)))
 throw Error('federation 2026-10-10 stage fingerprint absent');
 return {date:KZ.date}
}
export function checkCity(html){
 const t=text(html);
 if(!(/2026/.test(t)&&/(?:Қазақстан\s+чемпионатының\s+финалы|финал\s+чемпионата\s+Казахстана)/i.test(t)
 &&/(?:10\s+қазан(?:да|ы)?|10\s+октября)/i.test(t)
 &&/(?:Алматы\s+ипподромында|Алматинском\s+ипподроме)/i.test(t)
 &&/Омаров/i.test(t)&&/10\s*А/i.test(t)))
 throw Error('city final date physical track fingerprint absent');
 return {date:KZ.date,racecourse_id:KZ.racecourse_id}
}
export function buildCandidate(b,{start,days,checkedAt}){
 const x=new Date(start+'T00:00:00Z');x.setUTCDate(x.getUTCDate()+days);const end=x.toISOString().slice(0,10);
 return {end,records:KZ.date>=start&&KZ.date<end?[{
  candidate_id:'kazakhstan-baige-almaty-final-2026-10-10',
  meeting_id:'kazakhstan-baige-almaty-final-2026-10-10',
  country_id:KZ.country_id,authority_id:KZ.authority_id,
  racing_system_id:KZ.system_id,racecourse_id:KZ.racecourse_id,
  date:KZ.date,timezone:KZ.timezone,racing_type:'horse-racing',
  capability_rank:'C',first_race_time_local:null,last_race_time_local:null,
  timetable_rows:[],review_status:'needs_review',confidence:'high',
  source:{source_id:KZ.source_id,official_url:KZ.city,checked_at:checkedAt,
   extraction_method:'single_specific_city_sports_office_venue_date_notice'},
  acquisition_attempt:{attempted_at:checkedAt,status:'success',source_id:KZ.source_id},
  notes:'The Almaty 2026 Baige final only; no national or later-season inferred schedule'
 }]:[]}
}
