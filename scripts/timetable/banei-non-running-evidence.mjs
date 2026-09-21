const plain = (value) => String(value ?? '')
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

function assertOfficialSource(sourceUrl) {
  const url = new URL(sourceUrl);
  if (url.protocol !== 'https:' || !['www.banei-keiba.or.jp', 'banei-keiba.or.jp'].includes(url.hostname) || url.pathname !== '/tp_detail.php') {
    throw new Error('Banei non-running evidence requires an official tp_detail.php article');
  }
}

function isoDate(year, month, day) {
  const value = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const parsed = new Date(`${value}T00:00:00Z`);
  return parsed.toISOString().slice(0, 10) === value ? value : null;
}

function eventYear(publicationDate, month) {
  const year = Number(publicationDate.slice(0, 4));
  const publicationMonth = Number(publicationDate.slice(5, 7));
  if (publicationMonth === 12 && month === 1) return year + 1;
  if (publicationMonth === 1 && month === 12) return year - 1;
  return year;
}

function datesInclusive(start, end) {
  const out = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (cursor <= last) {
    out.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

function record(date, sourceUrl, checkedAt, evidencePhrase) {
  return {
    meeting_id: `banei-obihiro-racecourse-${date}`,
    country_id: 'japan',
    authority_id: 'banei-tokachi',
    racecourse_id: 'obihiro-racecourse',
    date,
    state: 'confirmed_non_running',
    scope: 'whole_meeting',
    evidence_type: 'official_explicit_non_running',
    source_id: 'banei-topics-explicit-non-running',
    official_source_url: sourceUrl,
    checked_at: checkedAt,
    evidence_phrase: evidencePhrase,
  };
}

export function parseBaneiConfirmedNonRunningHtml(html, { sourceUrl, checkedAt = new Date().toISOString() }) {
  assertOfficialSource(sourceUrl);
  const text = plain(html);
  const title = plain(String(html).match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '');
  const publicationDate = text.match(/(20\d{2}-\d{2}-\d{2})/)?.[1];
  if (!publicationDate) throw new Error('Banei TOPICS article publication date not found');

  const found = [];
  const range = text.match(/ばんえい競馬[^。]{0,240}?(\d{1,2})月(\d{1,2})日[^。]{0,40}?[～~-]\s*(?:(\d{1,2})月)?(\d{1,2})日[^。]{0,160}?(開催予定[^。]{0,80}?)?(中止|開催取り止め|開催を取り止め)/);
  if (range) {
    const startMonth = Number(range[1]);
    const startDay = Number(range[2]);
    const endMonth = Number(range[3] || range[1]);
    const endDay = Number(range[4]);
    const start = isoDate(eventYear(publicationDate, startMonth), startMonth, startDay);
    const end = isoDate(eventYear(publicationDate, endMonth), endMonth, endDay);
    if (start && end) {
      for (const date of datesInclusive(start, end)) found.push(record(date, sourceUrl, checkedAt, range[6]));
    }
  }

  const externalRacing = /(JRA|中央競馬|札幌競馬|函館競馬|福島競馬|新潟競馬|東京競馬|中山競馬|中京競馬|京都競馬|阪神競馬|小倉競馬|浦和競馬|船橋競馬|大井競馬|川崎競馬|門別競馬|盛岡競馬|水沢競馬|金沢競馬|笠松競馬|名古屋競馬|園田競馬|姫路競馬|高知競馬|佐賀競馬)/;
  const genericTitle = title.match(/^(?:【[^】]+】\s*)?(?:(\d{1,2})月(\d{1,2})日|(?:\d{1,2})\/(\d{1,2}))[^競走レースR]{0,24}?(開催取り止め|開催を取り止め|開催中止|開催を中止)(?:について)?$/);
  if (genericTitle && !externalRacing.test(title)) {
    const month = Number(genericTitle[1] ?? publicationDate.slice(5, 7));
    const day = Number(genericTitle[2] ?? genericTitle[3]);
    const date = isoDate(eventYear(publicationDate, month), month, day);
    if (date) found.push(record(date, sourceUrl, checkedAt, genericTitle[4]));
  }

  const wholeDay = /(\d{1,2})月(\d{1,2})日[^。]{0,120}?(?:ばんえい競馬|ばんえい十勝)[^。]{0,160}?(開催取り止め|開催を取り止め|開催を中止|開催が中止)|(?:ばんえい競馬|ばんえい十勝)[^。]{0,160}?(\d{1,2})月(\d{1,2})日[^。]{0,120}?(開催取り止め|開催を取り止め|開催を中止|開催が中止)/g;
  for (const match of text.matchAll(wholeDay)) {
    const segment = match[0];
    if (/第\d+(?:競走|レース|R)以降/.test(segment)) continue;
    const month = Number(match[1] || match[4]);
    const day = Number(match[2] || match[5]);
    const phrase = match[3] || match[6];
    const date = isoDate(eventYear(publicationDate, month), month, day);
    if (date) found.push(record(date, sourceUrl, checkedAt, phrase));
  }

  return [...new Map(found.map((row) => [row.meeting_id, row])).values()]
    .sort((a, b) => a.date.localeCompare(b.date));
}
