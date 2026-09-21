const VENUES = {
  '札幌': 'sapporo', '函館': 'hakodate', '福島': 'fukushima', '新潟': 'niigata', '東京': 'tokyo',
  '中山': 'nakayama', '中京': 'chukyo', '京都': 'kyoto', '阪神': 'hanshin', '小倉': 'kokura',
};

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

function sourceInfo(sourceUrl) {
  const url = new URL(sourceUrl);
  if (url.protocol !== 'https:' || url.hostname !== 'www.jra.go.jp') {
    throw new Error('JRA non-running evidence requires official www.jra.go.jp source');
  }
  const match = url.pathname.match(/^\/news\/(20\d{2})(\d{2})\/\d{6}\.html$/);
  if (!match) throw new Error('JRA non-running evidence requires a bounded JRA News article URL');
  return { year: Number(match[1]), publicationMonth: Number(match[2]) };
}

function eventYear(publicationYear, publicationMonth, eventMonth) {
  if (publicationMonth === 12 && eventMonth === 1) return publicationYear + 1;
  if (publicationMonth === 1 && eventMonth === 12) return publicationYear - 1;
  return publicationYear;
}

function isoDate(year, month, day) {
  const value = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const parsed = new Date(`${value}T00:00:00Z`);
  return parsed.toISOString().slice(0, 10) === value ? value : null;
}

function record(venueJa, date, sourceUrl, checkedAt, evidencePhrase) {
  const venue = VENUES[venueJa];
  if (!venue) return null;
  return {
    meeting_id: `jra-${venue}-racecourse-${date}`,
    country_id: 'japan',
    authority_id: 'jra',
    racecourse_id: `${venue}-racecourse`,
    date,
    state: 'confirmed_non_running',
    scope: 'whole_meeting',
    evidence_type: 'official_explicit_non_running',
    source_id: 'jra-news-explicit-non-running',
    official_source_url: sourceUrl,
    checked_at: checkedAt,
    evidence_phrase: evidencePhrase,
  };
}

export function parseJraConfirmedNonRunningHtml(html, { sourceUrl, checkedAt = new Date().toISOString() }) {
  const { year, publicationMonth } = sourceInfo(sourceUrl);
  const text = plain(html);
  const found = [];

  const structured = /第\d+回(札幌|函館|福島|新潟|東京|中山|中京|京都|阪神|小倉)(?:競馬)?第\d+日[（(](\d{1,2})月(\d{1,2})日[^）)]*[）)][\s\S]{0,220}?(開催を中止(?:いたします|します)?|開催が中止(?:となりました)?|開催中止)/g;
  for (const match of text.matchAll(structured)) {
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = isoDate(eventYear(year, publicationMonth, month), month, day);
    if (!date) continue;
    const row = record(match[1], date, sourceUrl, checkedAt, match[4]);
    if (row) found.push(row);
  }

  const plainMeeting = /(\d{1,2})月(\d{1,2})日[^。]{0,80}?(札幌|函館|福島|新潟|東京|中山|中京|京都|阪神|小倉)競馬[^。]{0,120}?(開催を中止(?:いたします|します)?|開催が中止(?:となりました)?|開催中止)/g;
  for (const match of text.matchAll(plainMeeting)) {
    const segment = match[0];
    if (/第\d+(?:競走|レース|R)\s*(?:以降)?[^。]{0,40}(?:中止|取り止め)/.test(segment)) continue;
    const month = Number(match[1]);
    const day = Number(match[2]);
    const date = isoDate(eventYear(year, publicationMonth, month), month, day);
    if (!date) continue;
    const row = record(match[3], date, sourceUrl, checkedAt, match[4]);
    if (row) found.push(row);
  }

  return [...new Map(found.map((row) => [row.meeting_id, row])).values()]
    .sort((a, b) => a.date.localeCompare(b.date) || a.meeting_id.localeCompare(b.meeting_id));
}
