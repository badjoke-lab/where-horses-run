const JRA_VENUES = {
  '札幌': 'sapporo', '函館': 'hakodate', '福島': 'fukushima', '新潟': 'niigata', '東京': 'tokyo',
  '中山': 'nakayama', '中京': 'chukyo', '京都': 'kyoto', '阪神': 'hanshin', '小倉': 'kokura',
};

const entities = (value) => String(value ?? '')
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&#x2f;|&#47;/gi, '/');

const lined = (value) => entities(value)
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/(?:tr|td|th|div|section|article|p|li|h[1-6]|table)>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/[\t\u3000 ]+/g, ' ')
  .replace(/\r/g, '')
  .replace(/\n\s+/g, '\n')
  .replace(/\n{2,}/g, '\n')
  .trim();

function normalizeTime(hour, minute) {
  return `${String(Number(hour)).padStart(2, '0')}:${String(Number(minute)).padStart(2, '0')}`;
}

function surfaceLabel(token) {
  if (/^芝/.test(token)) return 'Turf';
  if (/^(?:ダ|ダート)$/.test(token)) return 'Dirt';
  return null;
}

function courseLabel(surfaceToken) {
  if (/^芝/.test(surfaceToken)) return surfaceToken === '芝・外' ? 'Turf Outer' : 'Turf';
  if (/^(?:ダ|ダート)$/.test(surfaceToken)) return 'Dirt';
  return null;
}

function parseRaceSegment(segment) {
  const compact = segment.replace(/\s+/g, ' ').trim();
  const markers = [...compact.matchAll(/(?:^|\s)(\d{1,2})\s*レース(?:\s|$)/g)];
  const rows = [];
  for (let index = 0; index < markers.length; index += 1) {
    const raceNumber = Number(markers[index][1]);
    const start = markers[index].index + markers[index][0].length;
    const end = markers[index + 1]?.index ?? compact.length;
    const chunk = compact.slice(start, end).trim();
    const time = chunk.match(/(\d{1,2})\s*時\s*(\d{2})\s*分/);
    if (!time) continue;
    const course = chunk.match(/(\d{1,2}(?:,\d{3})?|\d{3,4})\s*[（(]\s*(芝(?:・外)?|ダ)\s*[）)]/);
    const beforeTime = chunk.slice(0, time.index).trim();
    const raceName = course ? beforeTime.slice(0, beforeTime.indexOf(course[0])).trim() : beforeTime;
    rows.push({
      race_number: raceNumber,
      label: `Race ${raceNumber}`,
      post_time_local: normalizeTime(time[1], time[2]),
      race_name: raceName || null,
      distance_m: course ? Number(course[1].replace(',', '')) : null,
      surface: course ? surfaceLabel(course[2]) : null,
      course_label: course ? courseLabel(course[2]) : null,
    });
  }
  return rows.sort((a, b) => a.race_number - b.race_number);
}

export function parseJraProgrammePage(html, date, sourceUrl) {
  const text = lined(html);
  // A meeting heading contains both the meeting number (`回`) before the venue and
  // the meeting day (`日`) after it. Race titles such as `第61回 札幌2歳ステークス`
  // and `第28回 阪神ジャンプステークス` intentionally do not match this pattern.
  const venuePattern = new RegExp(
    `第?\\s*\\d+\\s*回\\s*(${Object.keys(JRA_VENUES).join('|')})(?:競馬)?\\s*第?\\s*\\d+\\s*日`,
    'g',
  );
  const headings = [...text.matchAll(venuePattern)].map((match) => ({
    index: match.index,
    venueJa: match[1],
  }));

  const meetings = [];
  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    const end = headings[index + 1]?.index ?? text.length;
    const timetableRows = parseRaceSegment(text.slice(heading.index, end));
    const venue = JRA_VENUES[heading.venueJa];
    meetings.push({
      meeting_id: `jra-${venue}-racecourse-${date}`,
      date,
      authority_id: 'jra',
      racing_system_id: 'japan-jra-system',
      racecourse_id: `${venue}-racecourse`,
      venue_ja: heading.venueJa,
      source_id: 'jra-racing-calendar-programme',
      source_label: 'Japan Racing Association',
      official_source_url: sourceUrl,
      programme_rows: timetableRows,
    });
  }

  return meetings;
}
