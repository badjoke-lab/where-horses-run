const SAGA_OFFICIAL_START_URL = 'https://www.sagakeiba.net/raceinfo/start/';
const MONBETSU_OFFICIAL_RACEINFO_URL = 'https://www.hokkaidokeiba.net/raceinfo/';

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

const plain = (value) => lined(value).replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();

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

export function parseMonbetsuOfficialRaceInfoPage(html, date) {
  const text = lined(html);
  const [year, month, day] = date.split('-');
  if (!new RegExp(`${year}年\\s*${Number(month)}月\\s*${Number(day)}日`).test(text)) return [];

  const rows = [];
  for (const match of String(html).matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...match[1].matchAll(/<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi)]
      .map((cell) => plain(cell[1]));
    if (cells.length < 6 || !/^\d{1,2}$/.test(cells[0]) || !/^\d{1,2}:\d{2}$/.test(cells[1])) continue;
    const raceNumber = Number(cells[0]);
    const distance = cells[5].match(/(\d{3,4})\s*[mｍＭ]/i);
    rows.push({
      label: `Race ${raceNumber}`,
      post_time_local: cells[1],
      race_name: cells[3] || null,
      distance_m: distance ? Number(distance[1]) : null,
      surface: null,
      course_label: null,
    });
  }
  const unique = [...new Map(rows.map((row) => [row.label, row])).values()]
    .sort((left, right) => Number(left.label.slice(5)) - Number(right.label.slice(5)));
  if (!unique.length || !unique.every((row, index) => row.label === `Race ${index + 1}`)) return [];
  return unique;
}

async function decodePage(response, preferred = ['utf-8', 'shift_jis']) {
  const bytes = await response.arrayBuffer();
  return preferred
    .map((encoding) => new TextDecoder(encoding).decode(bytes))
    .sort((a, b) => (b.match(/[競馬発走]/g)?.length ?? 0) - (a.match(/[競馬発走]/g)?.length ?? 0))[0];
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
  return { body: await decodePage(response), url: response.url || SAGA_OFFICIAL_START_URL };
}

async function fetchMonbetsuRaceInfoPage(fetchImpl, date) {
  const url = new URL(MONBETSU_OFFICIAL_RACEINFO_URL);
  url.searchParams.set('p_day', date.replaceAll('-', ''));
  const response = await fetchImpl(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)',
      accept: 'text/html',
      'accept-language': 'ja,en;q=.7',
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return { body: await decodePage(response), url: response.url || url.toString() };
}

function canFallback(primary) {
  return ['race_number_discovery_incomplete', 'scheduled_pending_details'].includes(primary.status);
}

export function withSagaOfficialStartFallback(baseInspect, fetchImpl = fetch) {
  return async (meeting) => {
    const primary = await baseInspect(meeting);
    if (!canFallback(primary)) return primary;

    if (meeting.venue_code === '32') {
      try {
        const page = await fetchSagaStartPage(fetchImpl);
        const rows = parseSagaOfficialStartPage(page.body, meeting.date);
        if (rows.length) {
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
        }
      } catch {
        return primary;
      }
    }

    if (meeting.venue_code === '04') {
      try {
        const page = await fetchMonbetsuRaceInfoPage(fetchImpl, meeting.date);
        const rows = parseMonbetsuOfficialRaceInfoPage(page.body, meeting.date);
        if (rows.length) {
          return {
            status: 'ok',
            meeting: {
              ...meeting,
              source_id: 'monbetsu-official-raceinfo-fallback',
              source_label: 'ホッカイドウ競馬',
              capability_rank: 'A',
              timetable_rows: rows,
              official_source_url: page.url,
            },
          };
        }
      } catch {
        return primary;
      }
    }

    return primary;
  };
}

export { SAGA_OFFICIAL_START_URL, MONBETSU_OFFICIAL_RACEINFO_URL };
