const SAGA_OFFICIAL_START_URL = 'https://www.sagakeiba.net/raceinfo/start/';

const entities = (value) => String(value ?? '')
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>');

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

function dateSection(text, date) {
  const [year, month, day] = date.split('-');
  const pattern = new RegExp(`${year}年\\s*${Number(month)}月\\s*${Number(day)}日`);
  const match = pattern.exec(text);
  if (!match) return null;
  const afterStart = match.index + match[0].length;
  const remainder = text.slice(afterStart);
  const next = /\d{4}年\s*\d{1,2}月\s*\d{1,2}日/.exec(remainder);
  return text.slice(match.index, next ? afterStart + next.index : text.length);
}

export function parseSagaOfficialStartPage(html, date) {
  const section = dateSection(lined(html), date);
  if (!section) return [];
  const lines = section.split('\n').map((line) => line.trim()).filter(Boolean);
  const raceHeader = lines.findIndex((line) => line === 'R');
  const postHeader = lines.findIndex((line, index) => index > raceHeader && line === '発走');
  if (raceHeader < 0 || postHeader < 0) return [];

  const columns = lines
    .slice(raceHeader + 1, postHeader)
    .filter((line) => line === 'JRA' || /^\d{1,2}$/.test(line));
  if (!columns.length) return [];

  const times = lines
    .slice(postHeader + 1)
    .filter((line) => /^\d{1,2}:\d{2}$/.test(line))
    .slice(0, columns.length);
  if (times.length !== columns.length) return [];

  const rows = [];
  for (let index = 0; index < columns.length; index += 1) {
    if (!/^\d{1,2}$/.test(columns[index])) continue;
    const raceNumber = Number(columns[index]);
    rows.push({
      label: `Race ${raceNumber}`,
      post_time_local: times[index],
      race_name: null,
      distance_m: null,
      surface: null,
      course_label: null,
    });
  }
  if (!rows.length || !rows.every((row, index) => row.label === `Race ${index + 1}`)) return [];
  return rows;
}

async function fetchSagaStartPage(fetchImpl) {
  const response = await fetchImpl(SAGA_OFFICIAL_START_URL, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)',
      accept: 'text/html',
      'accept-language': 'ja,en;q=.7',
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${SAGA_OFFICIAL_START_URL}`);
  const bytes = await response.arrayBuffer();
  const decoded = ['utf-8', 'shift_jis']
    .map((encoding) => new TextDecoder(encoding).decode(bytes))
    .sort((a, b) => (b.match(/[佐賀競馬発走]/g)?.length ?? 0) - (a.match(/[佐賀競馬発走]/g)?.length ?? 0))[0];
  return { body: decoded, url: response.url || SAGA_OFFICIAL_START_URL };
}

export function withSagaOfficialStartFallback(baseInspect, fetchImpl = fetch) {
  return async (meeting) => {
    const primary = await baseInspect(meeting);
    if (meeting.venue_code !== '32') return primary;
    if (!['race_number_discovery_incomplete', 'scheduled_pending_details'].includes(primary.status)) return primary;

    try {
      const page = await fetchSagaStartPage(fetchImpl);
      const rows = parseSagaOfficialStartPage(page.body, meeting.date);
      if (!rows.length) return primary;
      return {
        status: 'ok',
        meeting: {
          ...meeting,
          source_id: 'saga-official-start-times-fallback',
          source_label: '佐賀競馬',
          capability_rank: 'A',
          timetable_rows: rows,
          official_source_url: page.url,
        },
      };
    } catch {
      return primary;
    }
  };
}

export { SAGA_OFFICIAL_START_URL };
