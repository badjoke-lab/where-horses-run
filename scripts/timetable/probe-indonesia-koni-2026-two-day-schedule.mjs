/**
 * Read-only narrow KONI West Java PORPROV XV daily schedule probe.
 * No racecard, site database, article, or page body persisted. No publication.
 * Source publishes sport days, NOT proof of races actually run or day-by-day racecard.
 */
const base='https://porprov.konijabar.or.id';
const targets=[
 {date:'2026-11-07',weekday:'Sabtu',day:7,label:'Hari pertama'},
 {date:'2026-11-08',weekday:'Minggu',day:8,label:'Hari terakhir'}
];
const headers={'user-agent':'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)','accept':'text/html,text/plain;q=0.9'};
const log=(id,rest)=>console.log('INDONESIA_KONI_PROBE '+JSON.stringify({id,...rest}));
const visible=(t)=>t.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
 .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
 .replace(/<[^>]+>/g,' ').replace(/&(?:nbsp|#160);/gi,' ').replace(/\s+/g,' ');
async function read(path){
 const response=await fetch(base+path,{redirect:'manual',signal:AbortSignal.timeout(18000),headers});
 if(response.status!==200)throw Error('source_http_'+response.status+'_'+path);
 if(!/^text\/(?:html|plain)\b/i.test(response.headers.get('content-type')||''))throw Error('source_mime_'+path);
 const size=Number(response.headers.get('content-length')||0);
 if(size>800000)throw Error('source_too_large_'+path);
 const html=await response.text();
 if(html.length>800000)throw Error('source_too_large_'+path);
 return html;
}
function robotsDisallows(text,path){
 let all=false,disallows=[];
 for (const raw of text.split(/\r?\n/)){
  const line=raw.replace(/#.*/,'').trim();
  if(/^user-agent:/i.test(line)){all=/^user-agent:\s*(?:\*|wherehorsesrun(?:\/1\.0)?)\s*$/i.test(line);continue;}
  if(all){
   const dis=line.match(/^disallow:\s*(\S+)/i);
   if(dis?.[1])disallows.push(dis[1]);
  }
 }
 return disallows.some(p=>p==='/'||path.startsWith(p));
}
try{
 let robots;
 try{robots=await read('/robots.txt');}
 catch(e){throw Error('robots_unavailable_'+String(e?.message||e));}
 const requested=['/info','/cabor/berkuda',...targets.map(x=>'/jadwal?tgl='+x.date)];
 const denied=requested.filter(p=>robotsDisallows(robots,p));
 log('robots',{http:200,denied_count:denied.length});
 if(denied.length)throw Error('robots_disallow_requested_scope');
 const terms=visible(await read('/info'));
 const nonCommercial=/non-komersial/i.test(terms);
 const massScrape=/scraping/i.test(terms)&&/izin\s+tertulis/i.test(terms);
 log('terms',{http:200,noncommercial_informative_condition_visible:nonCommercial,
   written_permission_required_for_mass_scraping_visible:massScrape,
   source_usage_decision:'review_required_for_publication'});
 if(!nonCommercial||!massScrape)throw Error('terms_changed_or_not_confirmed');
 const sports=visible(await read('/cabor/berkuda'));
 const sportScope=/Berkuda\s+Pacuan\s+7\s*[-–]\s*8\s+November\s+Pacuan\s+Kuda\s+Legok\s*Jawa/i.test(sports);
 const eightEntries=/Kelas\s+Terbuka\s+2\.000\s*M/i.test(sports)&&/Kelas\s+F\s+1\.000\s*M/i.test(sports);
 log('sport',{http:200,event_source_scope_confirmed:sportScope,eight_race_categories_listed:eightEntries,
   individual_racecard_or_times_present:false});
 if(!sportScope||!eightEntries)throw Error('sport_specific_source_fingerprint_failed');
 for(const day of targets){
  const text=visible(await read('/jadwal?tgl='+day.date));
  const date=new RegExp(day.weekday+',\\s*'+day.day+'\\s+November\\s+2026','i').test(text);
  const row=new RegExp('Berkuda\\s+Berkuda\\s+Pacuan\\s+Pacuan\\s+Kuda\\s+Legok\\s*Jawa,?\\s*Kabupaten\\s+Pangandaran\\s+7\\s*[-–]\\s*8\\s+November\\s+'+day.label,'i').test(text);
  log('daily',{date:day.date,http:200,heading_matches:date,
    source_daily_competition_listing:row,first_or_last_day:day.label,
    race_by_race_confirmation:false,actual_ran_confirmation:false});
  if(!date||!row)throw Error('dated_competition_listing_absent_'+day.date);
 }
 log('end',{source_positive_scheduled_competition_days:2,
  candidate_rank:'C',ready_for_publication:false,
  rights_and_site_scope_review_required:true,meeting_rows_written:0});
}catch(e){
 log('error',{message:String(e?.message||e),status:'probe_failed',meeting_rows_written:0});
 process.exitCode=1;
}
