const VENUES = Object.freeze({
  'Adana': 'adana-racecourse',
  'İzmir': 'izmir-racecourse',
  'İstanbul': 'istanbul-racecourse',
  'Istanbul': 'istanbul-racecourse',
  'Bursa': 'bursa-racecourse',
  'Ankara': 'ankara-racecourse',
  'Şanlıurfa': 'sanliurfa-racecourse',
  'Sanliurfa': 'sanliurfa-racecourse',
  'Elazığ': 'elazig-racecourse',
  'Elazig': 'elazig-racecourse',
  'Diyarbakır': 'diyarbakir-racecourse',
  'Diyarbakir': 'diyarbakir-racecourse',
  'Kocaeli': 'kocaeli-racecourse',
});

const MONTHS = Object.freeze({
  ocak: 1, subat: 2, şubat: 2, mart: 3, nisan: 4, mayis: 5, mayıs: 5,
  haziran: 6, temmuz: 7, agustos: 8, ağustos: 8, eylul: 9, eylül: 9,
  ekim: 10, kasim: 11, kasım: 11, aralik: 12, aralık: 12,
});

function plain(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/<script[\\s\\S]*?<\\/script>/gi, ' ')
    .replace(/<style[\\s\\S]*?<\\/style>/gi, ' ')
    .replace(/<br\\s*\\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\\s\\u3000]+/g, ' ')
    .trim();
}

function normalizeTurkish(value) {
  return String(value ?? '').normalize('NFKC').toLocaleLowerCase('tr-TR');
}

function assertOfficialSource(sourceUrl) {
  const url = new URL(sourceUrl);
  if (url.protocol !== 'https:' || url.hostname !== 'www.tjk.org') {
    throw new Error('TJK non-running evidence requires official www.tjk.org source');
  }
  if (!/^\\/TR\\/(?:YarisSever|Yar|Kurumsal|map)\\/News\\/(?:Data|Page)\\/\\d+$/i.test(url.pathname)) {
    throw new Error('TJK non-running evidence requires an official TJK News article URL');
  }
}

function isoDate(year, month, day) {
  const value = String(year) + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
  const parsed = new Date(value + 'T00:00:00Z');
  return parsed.toISOString().slice(0, 10) === value ? value : null;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^$()|[\\]\\\\]/g, '\\$&');
}

function venueFromText(text) {
  for (const [label, racecourseId] of Object.entries(VENUES)) {
    if (text.includes(label)) return { label, racecourseId };
  }
  return null;
}

function publicationDate(text) {
  const match = text.match(/Tarih\\s*:?\\s*(\\d{1,2})[.\\/-](\\d{1,2})[.\\/-](20\\d{2})/i)
    ?? text.match(/\\b(\\d{1,2})[.\\/-](\\d{1,2})[.\\/-](20\\d{2})\\b/);
  if (!match) return null;
  return isoDate(Number(match[3]), Number(match[2]), Number(match[1]));
}

function yearForMonth(publication, month) {
  const year = Number(publication.slice(0, 4));
  const publicationMonth = Number(publication.slice(5, 7));
  if (publicationMonth === 12 && month === 1) return year + 1;
  if (publicationMonth === 1 && month === 12) return year - 1;
  return year;
}

function explicitDottedDate(text, venueLabel) {
  const venue = escapeRegExp(venueLabel);
  const patterns = [
    new RegExp('(\\\\d{1,2})[.\\\\/-](\\\\d{1,2})[.\\\\/-](20\\\\d{2})[^.]{0,180}' + venue + '[^.]{0,260}(?:tüm koşular|yarışlar)[^.]{0,260}(?:tehir edilmesine|ertelenmesine|iptal edilmesine|iptal edilmiştir)', 'i'),
    new RegExp(venue + '[^.]{0,180}(\\\\d{1,2})[.\\\\/-](\\\\d{1,2})[.\\\\/-](20\\\\d{2})[^.]{0,260}(?:tüm koşular|yarışlar)[^.]{0,260}(?:tehir edilmesine|ertelenmesine|iptal edilmesine|iptal edilmiştir)', 'i'),
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const date = isoDate(Number(match[3]), Number(match[2]), Number(match[1]));
    if (date) return date;
  }
  return null;
}

function explicitNaturalDate(text, venueLabel, publication) {
  if (!publication) return null;
  const venue = escapeRegExp(venueLabel);
  const pattern = new RegExp('(\\\\d{1,2})\\\\s+(Ocak|Şubat|Subat|Mart|Nisan|Mayıs|Mayis|Haziran|Temmuz|Ağustos|Agustos|Eylül|Eylul|Ekim|Kasım|Kasim|Aralık|Aralik)[^.]{0,120}' + venue + '[^.]{0,260}(?:tüm koşular|yarışlar)[^.]{0,260}(?:tehir edilmesine|ertelenmesine|iptal edilmesine|iptal edilmiştir)', 'i');
  const match = text.match(pattern);
  if (!match) return null;
  const month = MONTHS[normalizeTurkish(match[2])];
  if (!month) return null;
  return isoDate(yearForMonth(publication, month), month, Number(match[1]));
}

export function parseTjkConfirmedNonRunningHtml(html, {
  sourceUrl,
  checkedAt = new Date().toISOString(),
} = {}) {
  assertOfficialSource(sourceUrl);
  const text = plain(html);
  const normalized = normalizeTurkish(text);
  if (!/(ertelendi|tehir edilmesine|iptal edildi|iptal edilmiştir|iptal edilmesine)/i.test(normalized)) return [];
  if (!/(tüm koşular|yarışları|yarışlar)/i.test(normalized)) return [];
  if (/(\\b\\d+\\s*(?:ve|,)?\\s*\\d*\\.?\\s*koşu(?:lar)?\\b|\\b\\d+\\.\\s*koşu\\b)/i.test(normalized)
      && !/tüm koşular/i.test(normalized)) return [];

  const venue = venueFromText(text);
  if (!venue) return [];
  const pubDate = publicationDate(text);
  const date = explicitDottedDate(text, venue.label) ?? explicitNaturalDate(text, venue.label, pubDate);
  if (!date) return [];

  return [{
    meeting_id: 'tjk-' + venue.racecourseId + '-' + date,
    country_id: 'turkey',
    authority_id: 'turkiye-jokey-kulubu',
    racecourse_id: venue.racecourseId,
    date,
    state: 'confirmed_non_running',
    scope: 'whole_meeting',
    evidence_type: 'official_explicit_non_running',
    source_id: 'tjk-news-explicit-non-running',
    official_source_url: sourceUrl,
    checked_at: checkedAt,
    evidence_phrase: text.match(/(?:tüm koşular[^.]{0,220}(?:tehir edilmesine|ertelenmesine|iptal edilmesine)|yarışları[^.]{0,120}(?:ertelendi|iptal edildi))/i)?.[0]
      ?? 'explicit TJK whole-meeting non-running notice',
  }];
}
