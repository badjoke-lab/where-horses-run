const VENUES = {
  '門別': 'monbetsu-racecourse',
  '盛岡': 'morioka-racecourse',
  '水沢': 'mizusawa-racecourse',
  '浦和': 'urawa-racecourse',
  '船橋': 'funabashi-racecourse',
  '大井': 'oi-racecourse',
  '川崎': 'kawasaki-racecourse',
  '金沢': 'kanazawa-racecourse',
  '笠松': 'kasamatsu-racecourse',
  '名古屋': 'nagoya-racecourse',
  '園田': 'sonoda-racecourse',
  '姫路': 'himeji-racecourse',
  '高知': 'kochi-racecourse',
  '佐賀': 'saga-racecourse',
};

const VENUE_PATTERN = Object.keys(VENUES).join('|');

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
  if (url.protocol !== 'https:' || url.hostname !== 'www.keiba.go.jp') {
    throw new Error('NAR non-running evidence requires official www.keiba.go.jp source');
  }
  if (!/^\/jranet\/topics\/20\d{2}\/n\d+\.html$/.test(url.pathname)) {
    throw new Error('NAR non-running evidence requires a bounded JRA-net topic article URL');
  }
}

function md(date) {
  return `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
}

function datesFromExpression(expression, allowedDates) {
  const allowed = [...new Set(allowedDates)].sort();
  const wanted = new Set();

  for (const match of String(expression).matchAll(/(\d{1,2})\/(\d{1,2})/g)) {
    wanted.add(`${Number(match[1])}/${Number(match[2])}`);
  }

  for (const match of String(expression).matchAll(/(\d{1,2})\/(\d{1,2})\s*[〜～~-]\s*(?:(\d{1,2})\/)?(\d{1,2})/g)) {
    const startMonth = Number(match[1]);
    const startDay = Number(match[2]);
    const endMonth = Number(match[3] ?? match[1]);
    const endDay = Number(match[4]);
    if (startMonth !== endMonth || endDay < startDay || endDay - startDay > 10) continue;
    for (let day = startDay; day <= endDay; day += 1) wanted.add(`${startMonth}/${day}`);
  }

  return allowed.filter((date) => wanted.has(md(date)));
}

function record(venueJa, date, sourceUrl, checkedAt, evidencePhrase) {
  const racecourseId = VENUES[venueJa];
  return {
    meeting_id: `nar-${racecourseId}-${date}`,
    country_id: 'japan',
    authority_id: 'nar-local-government-racing',
    racecourse_id: racecourseId,
    date,
    state: 'confirmed_non_running',
    scope: 'whole_meeting',
    evidence_type: 'official_explicit_non_running',
    source_id: 'nar-jranet-explicit-non-running',
    official_source_url: sourceUrl,
    checked_at: checkedAt,
    evidence_phrase: evidencePhrase,
  };
}

export function parseNarConfirmedNonRunningHtml(html, {
  sourceUrl,
  allowedDates,
  checkedAt = new Date().toISOString(),
}) {
  assertOfficialSource(sourceUrl);
  if (!Array.isArray(allowedDates) || !allowedDates.length) {
    throw new Error('NAR non-running parser requires allowedDates');
  }

  const title = plain(String(html).match(/<h[123]\b[^>]*>([\s\S]*?)<\/h[123]>/i)?.[1] ?? '');
  const text = plain(html);
  const wholeMeeting = title.match(new RegExp(`^(${VENUE_PATTERN})競馬の開催(取り止め|中止)(?:について)?[（(]([^）)]+)[）)]`));
  if (!wholeMeeting) return [];
  if (/第\d+(?:競走|R)|第\d+競走以降|競走取り止め/.test(title)) return [];

  const venueJa = wholeMeeting[1];
  const evidencePhrase = `開催${wholeMeeting[2]}`;
  const venueBodyPattern = new RegExp(`${venueJa}競馬[^。]{0,220}?(?:開催(?:を)?(?:取り止め|中止)|取り止め(?:となりました|になりました)|中止(?:となりました|します|いたします))`);
  if (!venueBodyPattern.test(text)) return [];

  return datesFromExpression(wholeMeeting[3], allowedDates)
    .map((date) => record(venueJa, date, sourceUrl, checkedAt, evidencePhrase))
    .sort((a, b) => a.date.localeCompare(b.date));
}
