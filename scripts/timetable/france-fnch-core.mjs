import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const FRANCE_TIMEZONE = 'Europe/Paris';
export const FRANCE_FNCH_SOURCE_ID = 'fnch-national-calendar-directory';
export const FRANCE_FNCH_CALENDAR_URL = 'https://www.fnch.fr/calendrier';
export const FRANCE_GALOP_AUTHORITY_ID = 'france-galop';
export const FRANCE_GALOP_SYSTEM_ID = 'france-france-galop-system';
export const FRANCE_LETROT_AUTHORITY_ID = 'letrot';
export const FRANCE_LETROT_SYSTEM_ID = 'france-letrot-system';

export const FRANCE_FNCH_REGIONAL_PROGRAMME_URLS = Object.freeze([
  'https://www.fnch.fr/federation-anjou-maine/programme-des-courses',
  'https://www.fnch.fr/federation-basse-normandie/programme-des-courses',
  'https://www.fnch.fr/federation-centre-est/programme-des-courses',
  'https://www.fnch.fr/federation-corse/programme-des-courses',
  'https://www.fnch.fr/federation-est/programme',
  'https://www.fnch.fr/federation-ile-de-france-haute-normandie/programme-des-courses',
  'https://www.fnch.fr/federation-nord/programme-des-courses',
  'https://www.fnch.fr/federation-ouest/programme-des-courses',
  'https://www.fnch.fr/federation-sud-est/programmes-des-courses',
  'https://www.fnch.fr/federation-sud-ouest/programme-des-courses',
]);

const MONTHS = Object.freeze({
  jan:1,janv:1,january:1,
  fev:2,fevr:2,feb:2,february:2,
  mar:3,mars:3,march:3,
  avr:4,apr:4,april:4,
  mai:5,may:5,
  juin:6,jun:6,june:6,
  juil:7,jul:7,july:7,
  aou:8,aout:8,aug:8,august:8,
  sep:9,sept:9,september:9,
  oct:10,october:10,
  nov:11,november:11,
  dec:12,december:12,
});
const VENUE_ID_ALIASES = Object.freeze({
  'angers-ecouflant':'angers-racecourse',
  'la-teste-de-buch':'la-teste-racecourse',
  'sable-sur-sarthe':'sable-sur-sarthe-racecourse',
  'senonnes-pouance':'senonnes-pouance-racecourse',
  'vichy-auvergne':'vichy-racecourse',
});

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/&eacute;/gi,'√©').replace(/&egrave;/gi,'√®').replace(/&ecirc;/gi,'√™')
    .replace(/&agrave;/gi,'√†').replace(/&acirc;/gi,'√¢').replace(/&ocirc;/gi,'√¥')
    .replace(/&ucirc;/gi,'√ª').replace(/&ugrave;/gi,'√π').replace(/&ccedil;/gi,'√ß')
    .replace(/&#x([0-9a-f]+);/gi,(_,code)=>String.fromCodePoint(Number.parseInt(code,16)))
    .replace(/&#(\d+);/g,(_,code)=>String.fromCodePoint(Number(code)));
}
export function fnchVisibleText(html) {
  return decodeHtml(String(html ?? ''))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<br\s*\/?\s*>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function normalize(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
}
function slugify(value) {
  return normalize(value).replace(/[‚Äô']/g,' ').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').replace(/-+/g,'-');
}
export function resolveFranceRacecourseId(label) {
  const slug=slugify(String(label).replace(/^Hippodrome\s+/i,''));
  return VENUE_ID_ALIASES[slug] ?? `${slug}-racecourse`;
}
function pad(value){return String(value).padStart(2,'0');}
function parseMonth(token){return MONTHS[slugify(token).replace(/-/g,'')] ?? null;}
function isoDate(year,month,day){return `${year}-${pad(month)}-${pad(day)}`;}
function absoluteUrl(href,baseUrl){try{return new URL(decodeHtml(href),baseUrl).toString();}catch{return null;}}
function programmeHref(block,baseUrl){
  for(const match of String(block).matchAll(/<a\b[^>]*href\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi)){
    const href=match[1]??match[2]??match[3]??'';
    const label=fnchVisibleText(match[4]);
    if(/t[e√©]l[e√©]charger\s+le\s+programme/i.test(label)||(/programme/i.test(label)&&/\.pdf(?:$|[?#])/i.test(href))){
      return absoluteUrl(href,baseUrl);
    }
  }
  return null;
}
function systemDefsFromDisciplineText(value){
  const normalized=normalize(value);
  const defs=[];
  if(/\btrot\b/.test(normalized)) defs.push({key:'letrot',authority_id:FRANCE_LETROT_AUTHORITY_ID,racing_system_id:FRANCE_LETROT_SYSTEM_ID});
  if(/\b(galop|plat|obstacle)\b/.test(normalized)) defs.push({key:'galop',authority_id:FRANCE_GALOP_AUTHORITY_ID,racing_system_id:FRANCE_GALOP_SYSTEM_ID});
  return defs;
}

export function parseFnchRegionalProgrammePage(html,{sourceUrl}={}){
  if(typeof html!=='string'||!html.trim()) throw new Error('FNCH regional programme HTML must be non-empty');
  if(!/Programme/i.test(fnchVisibleText(html))) throw new Error('FNCH programme fingerprint missing');
  const starts=[...html.matchAll(/<h[1-4]\b[^>]*>[\s\S]*?Hippodrome[\s\S]*?<\/h[1-4]>/gi)];
  const records=[]; const unknown_disciplines=[]; const parse_failures=[];
  for(let i=0;i<starts.length;i+=1){
    const start=starts[i].index??0;
    const end=i+1<starts.length?(starts[i+1].index??html.length):html.length;
    const block=html.slice(start,end);
    const text=fnchVisibleText(block);
    const venue=text.match(/^Hippodrome\s+(.+?)\s+R[e√©]union\b/i)?.[1]?.trim();
    const dateMatch=text.match(/\b(\d{1,2})\s+([A-Za-z√Ä-√ø.]+)\s+(20\d{2})\s+[√ÄA]\s+(\d{1,2})h(\d{2})\b/i);
    if(!venue||!dateMatch){parse_failures.push({code:'meeting_header_unparsed',source_text:text.slice(0,220)});continue;}
    const month=parseMonth(dateMatch[2]);
    if(!month){parse_failures.push({code:'month_unparsed',venue_label:venue,month_token:dateMatch[2]});continue;}
    const disciplineText=(text.match(/Discipline\s+(.+?)(?:T[e√©]l[e√©]charger\s+le\s+programme|$)/i)?.[1]??'').trim();
    const systemDefs=systemDefsFromDisciplineText(disciplineText);
    if(!systemDefs.length){unknown_disciplines.push({venue_label:venue,discipline_text:disciplineText,date:isoDate(Number(dateMatch[3]),month,Number(dateMatch[1]))});continue;}
    const date=isoDate(Number(dateMatch[3]),month,Number(dateMatch[1]));
    const scheduled_start_local=`${pad(dateMatch[4])}:${dateMatch[5]}`;
    const programme_url=programmeHref(block,sourceUrl);
    for(const def of systemDefs){
      records.push({
        system_key:def.key, authority_id:def.authority_id, racing_system_id:def.racing_system_id,
        date, venue_label:venue, racecourse_id:resolveFranceRacecourseId(venue), scheduled_start_local,
        discipline_text:disciplineText, programme_url, source_url:sourceUrl,
      });
    }
  }
  return {records,unknown_disciplines,parse_failures=ÙÏ)Ù()ï·¡Ω…–Åô’πç—•Ω∏Å¡Ö…Õïπç°A…Ωù…ÖµµïQï·–°—ï·–•Ï(ÄÅ•ò°—Â¡ïΩòÅ—ï·–ÑÙÙùÕ—…•πúùÒÖ—ï·–π—…•¥†§§Å—°…Ω‹Åπï‹Å……Ω»†ù9 Å¡…Ωù…ÖµµîÅ—ï·–Åµ’Õ–ÅâîÅπΩ∏µïµ¡—‰ú§Ï(ÄÅçΩπÕ–ÅπΩ…µÖ±•Èïêı—ï·–π…ï¡±Öçî†Ωq‘¿¡Ñ¿Ωú∞úÄú§π…ï¡±Öçî†ΩoäCäGäOäQtΩú∞ú¥ú§Ï(ÄÅçΩπÕ–Å…‡Ùº°qëÏƒ∞…Ù§†¸ÈqÃ®†¸ÈïÒï…Ò…ïÛ°…ïÒïµïÛ°µî§§˝qÃ©Ω’…ÕïqÃ©l∑äOäPÈt˝qÃ©mó•u¡Ö…—qÃ®ÈqÃ®°qëÏƒ∞…Ù•qÃ©°p∏˝qÃ®°qëÏ…Ù§Ωù§Ï(ÄÅçΩπÕ–ÅôΩ’πêımtÏ(ÄÅôΩ»°çΩπÕ–ÅµÖ—ç†ÅΩòÅπΩ…µÖ±•ÈïêπµÖ—ç°±∞°…‡§•Ï(ÄÄÄÅçΩπÕ–Åπ’µâï»ı9’µâï»°µÖ—ç°l≈t§Ï(ÄÄÄÅôΩ’πêπ¡’Õ†°Ìπ’µâï»±±Öâï∞ÈÅIÖçîÄëÌπ’µâï…ıÄ±¡ΩÕ—}—•µï}±ΩçÖ∞ÈÄëÌ¡Öê°µÖ—ç°l…t•ÙËëÌµÖ—ç°lÕuıÅÙ§Ï(ÄÅÙ(ÄÅçΩπÕ–ÅâÂ9’µâï»ıπï‹Å5Ö¿†§Ï(ÄÅôΩ»°çΩπÕ–Å…Ω‹ÅΩòÅôΩ’πê§Å•ò†ÖâÂ9’µâï»π°ÖÃ°…Ω‹ππ’µâï»§§ÅâÂ9’µâï»πÕï–°…Ω‹ππ’µâï»±…Ω‹§Ï(ÄÅçΩπÕ–Å…Ω›Ãıl∏∏πâÂ9’µâï»πŸÖ±’ïÃ†•tπÕΩ…–†°Ñ±à§Ù˘Ñππ’µâï»µàππ’µâï»§Ï(ÄÅ•ò†Ö…Ω›Ãπ±ïπù—†§Å…ï—’…∏ÅmtÏ(ÄÅ•ò°…Ω›ÃπÕΩµî†°…Ω‹±•πëï‡§Ù˘…Ω‹ππ’µâï»ÑÙı•πëï‡¨ƒ§§Å—°…Ω‹Åπï‹Å……Ω»†ù9 Å¡…Ωù…ÖµµîÅ…ÖçîÅ…Ω›ÃÅÖ…îÅπΩ–ÅçΩπ—•π’Ω’ÃÅô…Ω¥ÅIÖçîÄƒú§Ï(ÄÅ•ò°…Ω›ÃπÕΩµî†°…Ω‹±•πëï‡§Ù˘•πëï‡¯¿òô…Ω‹π¡ΩÕ—}—•µï}±ΩçÖ∞ı…Ω›Õm•πëï‡¥≈tπ¡ΩÕ—}—•µï}±ΩçÖ∞§§Å—°…Ω‹Åπï‹Å……Ω»†ù9 Å¡…Ωù…ÖµµîÅ¡ΩÕ–Å—•µïÃÅÖ…îÅπΩ–ÅÕ—…•ç—±‰Å•πç…ïÖÕ•πúú§Ï(ÄÅ…ï—’…∏Å…Ω›ÃπµÖ¿†°Ìπ’µâï»∞∏∏π…Ω›Ù§Ù˘…Ω‹§Ï)Ù()ô’πç—•Ω∏ÅïŸ•ëïπçî°’…∞±ç°ïç≠ïë–•Ì…ï—’…∏ÅÌÕΩ’…çï}•êÈI9}9!}M=UI}%±Ωôô•ç•Ö±}ÕΩ’…çï}’…∞È’…∞±ΩâÕï…Ÿïë}Ö–Èç°ïç≠ïë–±Õ’ççïÕÕô’±±Â}Ÿï…•ô•ïë}Ö–Èç°ïç≠ïë–±Öç≈’•Õ•—•Ωπ}µï—°ΩêËùÖ’—ΩµÖ—•åùÙÌÙ)ô’πç—•Ω∏ÅâÖÕïIïçΩ…ê°…Ω‹±ç°ïç≠ïë–•Ï(ÄÅçΩπÕ–Å¡…ïô•‡ı…Ω‹πÕÂÕ—ïµ}≠ï‰ÙÙÙùùÖ±Ω¿ú¸ùô…ÖπçîµùÖ±Ω¿úËùô…Öπçîµ±ï—…Ω–úÏ(ÄÅçΩπÕ–Åµïï—•πù%êıÄëÌ¡…ïô•·Ù¥ëÌ…Ω‹π…ÖçïçΩ’…Õï}•ëÙ¥ëÌ…Ω‹πëÖ—ïıÄÏ(ÄÅ…ï—’…∏ÅÏ(ÄÄÄÅçÖπë•ëÖ—ï}•êÈµïï—•πù%ê±µïï—•πù}•êÈµïï—•πù%ê±çΩ’π—…Â}•êËùô…Öπçîú±Ö’—°Ω…•—Â}•êÈ…Ω‹πÖ’—°Ω…•—Â}•ê±…Öç•πù}ÕÂÕ—ïµ}•êÈ…Ω‹π…Öç•πù}ÕÂÕ—ïµ}•ê∞(ÄÄÄÅ…ÖçïçΩ’…Õï}•êÈ…Ω‹π…ÖçïçΩ’…Õï}•ê±ëÖ—îÈ…Ω‹πëÖ—î±—•µïÈΩπîÈI9}Q%5i=9±ô•…Õ—}…Öçï}—•µï}±ΩçÖ∞Èπ’±∞±±ÖÕ—}…Öçï}—•µï}±ΩçÖ∞Èπ’±∞±—•µï—Öâ±ï}…Ω›ÃÈmt∞(ÄÄÄÅÕΩ’…çîÈÌÕΩ’…çï}•êÈI9}9!}M=UI}%±Ωôô•ç•Ö±}’…∞È…Ω‹πÕΩ’…çï}’…∞±ç°ïç≠ïë}Ö–Èç°ïç≠ïë–±ï·—…Öç—•Ωπ}µï—°ΩêËùΩôô•ç•Ö±}ôπç°}…ïù•ΩπÖ±}¡…Ωù…Öµµï}•πëï‡ùÙ∞(ÄÄÄÅ…Ω’—ï}•êËùôπç†µ…ïù•ΩπÖ∞µ¡…Ωù…Öµµîµ•πëï‡ú±çΩπô•ëïπçîËù°•ù†ú±…ïŸ•ï›}Õ—Ö—’ÃËùπïïëÕ}…ïŸ•ï‹ú∞(ÄÄÄÅπΩ—ïÃÈÅ=ôô•ç•Ö∞Å9 Å…ïù•ΩπÖ∞Å¡…Ωù…ÖµµîÅΩâÕï…ŸÖ—•Ω∏ÏÅÕΩ’…çîÅŸïπ’îÅ±Öâï∞ËÄëÌ…Ω‹πŸïπ’ï}±Öâï±ÙÏÅë•Õç•¡±•πîËÄëÌ…Ω‹πë•Õç•¡±•πï}—ï·—ÙπÄ∞(ÄÅÙÏ)Ù)ï·¡Ω…–Åô’πç—•Ω∏Åâ’•±ëπç°•·—’…ïIïçΩ…ê°…Ω‹±Ìç°ïç≠ïë–±ëï—Ö•±M—Ö—’ÃÙùπΩ—}¡’â±•Õ°ïêú±Ö——ïµ¡—M—Ö—’ÃÙù¡ïπë•πù}¡’â±•çÖ—•Ω∏ú±ï……Ω…Ωëîıπ’±±ÙıÌÙ•Ï(ÄÅçΩπÕ–Å…ïçΩ…êıâÖÕïIïçΩ…ê°…Ω‹±ç°ïç≠ïë–§Ï(ÄÅ…ïçΩ…êπëï—Ö•±}ΩâÕï…ŸÖ—•Ω∏ıÌÕ—Ö—’ÃÈëï—Ö•±M—Ö—’Ã±ïŸÖ±’Ö—ïë}çÖ¡Öâ•±•—Â}…Öπ¨Ëùú±…Öçï}çΩ’π–Ë¿±¡…Ωù…Öµµï}’…∞È…Ω‹π¡…Ωù…Öµµï}’…±ÙÏ(ÄÅ…ïçΩ…êπÖç≈’•Õ•—•Ωπ}Ö——ïµ¡–ıÌÖ——ïµ¡—ïë}Ö–Èç°ïç≠ïë–±Õ—Ö—’ÃÈÖ——ïµ¡—M—Ö—’Ã±ÕΩ’…çï}•êÈI9}9!}M=UI}%±…Ω’—ï}•êËùôπç†µ…ïù•ΩπÖ∞µ¡…Ωù…Öµµîµ¡ëòú±ï……Ω…}çΩëîÈï……Ω…ΩëïÙÏ(ÄÅçΩπÕ–ÅîıïŸ•ëïπçî°…Ω‹πÕΩ’…çï}’…∞±ç°ïç≠ïë–§ÏÅ…ïçΩ…êπïŸ•ëïπçï}Õ’¡¡Ω…–ıÌµïï—•πù}•ëïπ—•—‰Èî±µïï—•πù}ëÖ—îÈïÙÏ(ÄÅçΩπÕ–ÅçÖ¡Öâ•±•—Â}…Öπ¨ıëï…•Ÿï	ïÕ—ŸÖ•±Öâ±ïIÖπ¨°…ïçΩ…ê±mt§Ï(ÄÅ…ïçΩ…êπÖç≈’•Õ•—•Ωπ}çΩµ¡±ï—•Ω∏ıç±ÖÕÕ•ôÂç≈’•Õ•—•ΩπΩµ¡±ï—•Ω∏°Ï∏∏π…ïçΩ…ê±çÖ¡Öâ•±•—Â}…Öπ≠Ù±Ì—ïç°π•çÖ±}çÖ¡Öâ•±•—Â}…Öπ¨ËùùÙ§Ï(ÄÅ…ï—’…∏ÅÏ∏∏π…ïçΩ…ê±çÖ¡Öâ•±•—Â}…Öπ≠ÙÏ)Ù)ï·¡Ω…–Åô’πç—•Ω∏Åâ’•±ëπç°A…Ωù…ÖµµïIïçΩ…ê°…Ω‹±Ìç°ïç≠ïë–±¡…Ωù…ÖµµïQï·—ÙıÌÙ•Ï(ÄÅçΩπÕ–Å…Ω›Ãı¡Ö…Õïπç°A…Ωù…ÖµµïQï·–°¡…Ωù…ÖµµïQï·–§Ï(ÄÅ•ò†Ö…Ω›Ãπ±ïπù—†§Å…ï—’…∏Åâ’•±ëπç°•·—’…ïIïçΩ…ê°…Ω‹±Ìç°ïç≠ïë–±ëï—Ö•±M—Ö—’ÃËù¡Ö…Õï…}ôÖ•±’…îú±Ö——ïµ¡—M—Ö—’ÃËù¡Ö…Õï…}ôÖ•±’…îú±ï……Ω…ΩëîËù…Öçï}—•µïÕ}πΩ—}¡Ö…ÕïêùÙ§Ï(ÄÅçΩπÕ–Å…ïçΩ…êıâÖÕïIïçΩ…ê°…Ω‹±ç°ïç≠ïë–§Ï(ÄÅ…ïçΩ…êπô•…Õ—}…Öçï}—•µï}±ΩçÖ∞ı…Ω›Õl¡tπ¡ΩÕ—}—•µï}±ΩçÖ∞Ì…ïçΩ…êπ±ÖÕ—}…Öçï}—•µï}±ΩçÖ∞ı…Ω›ÃπÖ–†¥ƒ§π¡ΩÕ—}—•µï}±ΩçÖ∞Ì…ïçΩ…êπ—•µï—Öâ±ï}…Ω›Ãı…Ω›ÃÏ(ÄÅ…ïçΩ…êπÕΩ’…çîıÌÕΩ’…çï}•êÈI9}9!}M=UI}%±Ωôô•ç•Ö±}’…∞È…Ω‹π¡…Ωù…Öµµï}’…∞±ç°ïç≠ïë}Ö–Èç°ïç≠ïë–±ï·—…Öç—•Ωπ}µï—°ΩêËùΩôô•ç•Ö±}ôπç°}¡…Ωù…Öµµï}¡ëòùÙÏ(ÄÅ…ïçΩ…êπ…Ω’—ï}•êÙùôπç†µ…ïù•ΩπÖ∞µ¡…Ωù…Öµµîµ¡ëòúÏ(ÄÅ…ïçΩ…êπëï—Ö•±}ΩâÕï…ŸÖ—•Ω∏ıÌÕ—Ö—’ÃËùÖŸÖ•±Öâ±îú±ïŸÖ±’Ö—ïë}çÖ¡Öâ•±•—Â}…Öπ¨Ëùú±…Öçï}çΩ’π–È…Ω›Ãπ±ïπù—†±¡…Ωù…Öµµï}’…∞È…Ω‹π¡…Ωù…Öµµï}’…±ÙÏ(ÄÅ…ïçΩ…êπÖç≈’•Õ•—•Ωπ}Ö——ïµ¡–ıÌÖ——ïµ¡—ïë}Ö–Èç°ïç≠ïë–±Õ—Ö—’ÃËùÕ’ççïÕÃú±ÕΩ’…çï}•êÈI9}9!}M=UI}%±…Ω’—ï}•êËùôπç†µ…ïù•ΩπÖ∞µ¡…Ωù…Öµµîµ¡ëòú±ï……Ω…}çΩëîÈπ’±±ÙÏ(ÄÅçΩπÕ–Åµïï—•πùŸ•ëïπçîıïŸ•ëïπçî°…Ω‹πÕΩ’…çï}’…∞±ç°ïç≠ïë–§±ëï—Ö•±Ÿ•ëïπçîıïŸ•ëïπçî°…Ω‹π¡…Ωù…Öµµï}’…∞±ç°ïç≠ïë–§Ï(ÄÅ…ïçΩ…êπïŸ•ëïπçï}Õ’¡¡Ω…–ıÌµïï—•πù}•ëïπ—•—‰Èµïï—•πùŸ•ëïπçî±µïï—•πù}ëÖ—îÈµïï—•πùŸ•ëïπçî±…Öçï}—•µïÃÈëï—Ö•±Ÿ•ëïπçî±—•µï—Öâ±îÈëï—Ö•±Ÿ•ëïπçïÙÏ(ÄÅçΩπÕ–ÅçÖ¡Öâ•±•—Â}…Öπ¨ıëï…•Ÿï	ïÕ—ŸÖ•±Öâ±ïIÖπ¨°…ïçΩ…ê±…Ω›Ã§Ï(ÄÅ…ïçΩ…êπÖç≈’•Õ•—•Ωπ}çΩµ¡±ï—•Ω∏ıç±ÖÕÕ•ôÂç≈’•Õ•—•ΩπΩµ¡±ï—•Ω∏°Ï∏∏π…ïçΩ…ê±çÖ¡Öâ•±•—Â}…Öπ≠Ù±Ì—ïç°π•çÖ±}çÖ¡Öâ•±•—Â}…Öπ¨ËùùÙ§Ï(ÄÅ…ï—’…∏ÅÏ∏∏π…ïçΩ…ê±çÖ¡Öâ•±•—Â}…Öπ≠ÙÏ)Ù