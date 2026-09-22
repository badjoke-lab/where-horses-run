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
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\s\u3000]+/g, ' ')
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
  if (!/^\/TR\/(?:YarisSever|Yar|Kurumsal|map)\/News\/(?:Data|Page)\/\d+$/i.test(url.pathname)) {
    throw new Error('TJK non-running evidence requires an official TJK News article URL');
  }
}

function isoDate(year, month, day) {
  const value = String(year) + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
  const parsed = new Date(value + 'T00:00:00Z');
  return parsed.toISOString().slice(0, 10) === value ? value : null;
}

function publicationDate(text) {
  const match = text.match(/Tarih\s*:?\s*(\d{1,2})[.\/-](\d{1,2})[.\/-](20\d{2})/i);
  return match ? isoDate(Number(match[3]), Number(match[2]), Number(match[1])) : null;
}

function yearForMonth(publication, month) {
  const year = Number(publication.slice(0, 4));
  const publicationMonth = Number(publication.slice(5, 7));
  if (publicationMonth === 12 && month === 1) return year + 1;
  if (publicationMonth === 1 && month === 12) return year - 1;
  return year;
}

function firstExplicitDate(text, publication) {
  const dotted = text.match(/\b(\d{1,2})[.\/-](\d{1,2})[.\/-](20\d{2})\b/);
  if (dotted) return isoDate(Number(dotted[3]), Number(dotted[2]), Number(dotted[1]));

  if (!publication) return null;
  const natural = text.match(/\b(\d{1,2})\s+(Ocak|Şubat|Subat|Mart|Nisan|Mayıs|Mayis|Haziran|Temmuz|Ağustos|Agustos|Eylül|Eylul|Ekim|Kasım|Kasim|Aralık|Aralik)\b/i);
  if (!natural) return null;
  const month = MONTHS[normalizeTurkish(natural[2])];
  return month ? isoDate(yearForMonth(publication, month), month, Number(natural[1])) : null;
}

function headingTexts(html) {
  return [...String(html).matchAll(/<h[1-4]\b[^>]*>([\s\S]*?)<\/h[1-4]>/gi)].map((match) => plain(match[1]));
}

function venueFromText(text) {
  for (const [label, racecourseId] of Object.entries(VENUES)) {
    if (text.includes(label)) return { label, racecourseId };
  }
  return null;
}

function titleCandidate(headings) {
  return headings.find((heading) =>
    venueFromText(heading)
    && /yarışları/i.test(heading)
    && /(ertelendi|iptal edildi|iptal edilmiştir)/i.test(normalizeTurkish(heading)),
  ) ?? null;
}

function explicitWholeMeetingBody(text, venueLabel) {
  const venueIndex = text.indexOf(venueLabel);
  if (venueIndex < 0) return null;
  const start = Math.max(0, venueIndex - 280);
  const segment = text.slice(start, venueIndex + 900);
  const normalized = normalizeTurkish(segment);
  if (!/tüm koşular/i.test(normalized)) return null;
  if (!/(tehir edilmesine|ertelenmesine|ertelendi|iptal edilmesine|iptal edilmiştir|iptal edildi)/i.test(normalized)) return null;
  return segment;
}

export function parseTjkConfirmedNonRunningHtml(html, {
  sourceUrl,
  checkedAt = new Date().toISOString(),
} = {}) {
  assertOfficialSource(sourceUrl);
  const text = plain(html);
  const headings = headingTexts(html);
  const title = titleCandidate(headings);
  const venue = venueFromText(title ?? text);
  if (!venue) return [];

  const wholeBody = explicitWholeMeetingBody(text, venue.label);
  if (!wholeBody) return [];

  const published = publicationDate(text);
  const originalDate = firstExplicitDate(wholeBody, published)
    ?? firstExplicitDate(title ?? '', published);
  if (!originalDate) return [];

  return [{
    meeting_id: 'tjk-' + venue.racecourseId + '-' + originalDate,
    country_id: 'turkey',
    authority_id: 'turkiye-jokey-kulubu',
    racecourse_id: venue.racecourseId,
    date: originalDate,
    state: 'confirmed_non_running',
    scope: 'whole_meeting',
    evidence_type: 'official_explicit_non_running',
    source_id: 'tjk-news-explicit-non-running',
    official_source_url: sourceUrl,
    checked_at: checkedAt,
    evidence_phrase: title ?? plain(wholeBody).slice(0, 280),
  }];
}
