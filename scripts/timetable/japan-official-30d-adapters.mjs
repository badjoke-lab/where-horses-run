import { baneiRaceListUrl, discoverBaneiRaceNumbers, parseBaneiRaceList } from './banei-detail-core.mjs';

const venues = { '札幌': 'sapporo', '函館': 'hakodate', '福島': 'fukushima', '新潟': 'niigata', '東京': 'tokyo', '中山': 'nakayama', '中京': 'chukyo', '京都': 'kyoto', '阪神': 'hanshin', '小倉': 'kokura' };
const narVenues = { '01': 'kitami', '02': 'iwamizawa', '03': 'obihiro', '04': 'mombetsu', '10': 'morioka', '11': 'mizusawa', '18': 'urawa', '19': 'funabashi', '20': 'oi', '21': 'kawasaki', '22': 'kanazawa', '23': 'kasamatsu', '24': 'nagoya', '27': 'sonoda', '28': 'himeji', '31': 'kochi', '32': 'saga' };
const entities = (s) => String(s).replace(/&amp;/gi, '&').replace(/&#x2f;|&#47;/gi, '/').replace(/&quot;/gi, '"');
const plain = (s) => entities(s).replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/[\s\u3000]+/g, ' ');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function get(url) {
  const response = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)', accept: 'text/html', 'accept-language': 'ja,en;q=.7' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  const bytes = await response.arrayBuffer();
  const decoded = ['shift_jis', 'utf-8'].map((encoding) => new TextDecoder(encoding).decode(bytes)).sort((a, b) => (b.match(/[競馬発走開催]/g)?.length ?? 0) - (a.match(/[競馬発走開催]/g)?.length ?? 0))[0];
  return { body: decoded, url: response.url };
}
function months(dates) { return [...new Set(dates.map((date) => date.slice(0, 7)))]; }
function rows(html) {
  const result = [];
  for (const block of html.matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)) {
    const text = plain(block[0]);
    const n = Number(block[0].match(/[?&](?:k_raceNo|race_no)=(\d{1,2})/i)?.[1] ?? text.match(/(?:^|\s)(\d{1,2})\s*R(?:\s|$)/i)?.[1]);
    const time = text.match(/(?:^|\s)(\d{1,2}:\d{2})(?:\s|$)/)?.[1];
    if (!n || !time) continue;
    const course = text.match(/(芝|ダート)?\s*([右左])?\s*(\d{3,4})\s*[mｍ]/);
    result.push({ label: `Race ${n}`, post_time_local: time.padStart(5, '0'), race_name: null, distance_m: course ? Number(course[3]) : null, surface: course?.[1] === '芝' ? 'Turf' : course?.[1] === 'ダート' ? 'Dirt' : null, course_label: course?.[2] === '右' ? 'Right-handed' : course?.[2] === '左' ? 'Left-handed' : null });
  }
  return [...new Map(result.map((row) => [Number(row.label.slice(5)), row])).entries()].sort((a, b) => a[0] - b[0]).map(([, row]) => row);
}
const finish = (meeting, timetableRows, url) => {
  if (!timetableRows.length) return { status: 'scheduled_pending_details', reason: 'official_detail_not_published' };
  const continuous = timetableRows.every((row, index) => row.label === `Race ${index + 1}`);
  if (!continuous) return { status: 'race_number_discovery_incomplete', reason: 'non_continuous_official_race_numbers' };
  const rich = timetableRows.every((row) => row.race_name && row.distance_m && row.surface && row.course_label);
  return { status: 'ok', meeting: { ...meeting, capability_rank: rich ? 'A+' : 'A', timetable_rows: timetableRows, official_source_url: url } };
};

async function discoverJra({ dates }) {
  const found = [];
  for (const date of dates) {
    const [year, month, day] = date.split('-'); const url = `https://jra.jp/keiba/calendar${year}/${year}/${Number(month)}/${month}${day}.html`;
    let page; try { page = await get(url); } catch (error) { if (String(error.message).startsWith('HTTP 404')) continue; throw error; }
    for (const match of plain(page.body).matchAll(/第?\s*\d+\s*回\s*(札幌|函館|福島|新潟|東京|中山|中京|京都|阪神|小倉)\s*(?:競馬)?\s*第?\s*\d+\s*日/g)) {
      const venue = venues[match[1]]; found.push({ meeting_id: `jra-${venue}-racecourse-${date}`, date, authority_id: 'jra', racing_system_id: 'japan-jra-system', racecourse_id: `${venue}-racecourse`, venue_ja: match[1], official_source_url: url, discovery_body: page.body });
    }
    await sleep(80);
  }
  return found;
}
async function discoverNar({ dates }) {
  const allowed = new Set(dates); const found = [];
  for (const month of months(dates)) {
    const [year, mm] = month.split('-'); const url = `https://www.keiba.go.jp/KeibaWeb/MonthlyConveneInfo/MonthlyConveneInfoTop?k_month=${Number(mm)}&k_year=${year}`; const page = await get(url);
    for (const match of page.body.matchAll(/href=["']([^"']*RaceList[^"']*k_babaCode=(\d{1,2})[^"']*k_raceDate=([^&"']+)[^"']*)["']/gi)) {
      const code = match[2].padStart(2, '0'); const date = decodeURIComponent(match[3]).replaceAll('/', '-');
      if (!allowed.has(date) || code === '03') continue; // Banei is always acquired by its explicit adapter.
      const venue = narVenues[code] ?? `venue-${code}`; found.push({ meeting_id: `nar-${venue}-racecourse-${date}`, date, authority_id: 'nar-local-government-racing', racing_system_id: 'japan-nar-system', racecourse_id: `${venue}-racecourse`, venue_code: code, official_source_url: new URL(entities(match[1]), page.url).toString() });
    }
  }
  return [...new Map(found.map((m) => [m.meeting_id, m])).values()];
}
async function discoverBanei({ dates }) {
  const allowed = new Set(dates); const found = [];
  for (const month of months(dates)) {
    const epoch = Math.floor(Date.parse(`${month}-01T00:00:00+09:00`) / 1000); const url = `https://www.banei-keiba.or.jp/race_schedule.php?c=mon&d=${epoch}`; const page = await get(url);
    for (const match of page.body.matchAll(/k_raceDate=(\d{4})[/%-](\d{1,2})[/%-](\d{1,2})/gi)) {
      const date = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`; if (!allowed.has(date)) continue;
      found.push({ meeting_id: `banei-obihiro-racecourse-${date}`, date, authority_id: 'banei-tokachi', racing_system_id: 'japan-banei-system', racecourse_id: 'obihiro-racecourse', official_source_url: url });
    }
  }
  return [...new Map(found.map((m) => [m.meeting_id, m])).values()];
}

export const japanOfficial30dAdapters = {
  jra: { discover: discoverJra, inspect: async (meeting) => {
    const text = meeting.discovery_body; const start = text.search(new RegExp(`第?\\s*\\d+\\s*回\\s*${meeting.venue_ja}`));
    const tail = start < 0 ? text : text.slice(start); const next = tail.slice(1).search(/第?\s*\d+\s*回\s*(札幌|函館|福島|新潟|東京|中山|中京|京都|阪神|小倉)/);
    return finish(meeting, rows(next < 0 ? tail : tail.slice(0, next + 1)), meeting.official_source_url);
  } },
  'nar-standard': { discover: discoverNar, inspect: async (meeting) => { const page = await get(meeting.official_source_url); return finish(meeting, rows(page.body), page.url); } },
  banei: { discover: discoverBanei, inspect: async (meeting) => { const url = baneiRaceListUrl(meeting.date); const page = await get(url); const numbers = discoverBaneiRaceNumbers(page.body); if (!numbers.length) return { status: 'scheduled_pending_details' }; const parsed = parseBaneiRaceList(page.body, meeting.date); if (parsed.length !== numbers.length) return { status: 'race_number_discovery_incomplete' }; return finish(meeting, parsed.map((row) => ({ label: `Race ${row.race_number}`, post_time_local: row.post_time_local, race_name: row.race_name ?? null, distance_m: row.distance_m ?? null, surface: row.surface ?? null, course_label: row.course_label ?? null })), page.url); } },
};
