const NANKAN_VENUES = {
  '18': { racecourse_id: 'urawa-racecourse', course_label: 'Dirt Left-handed' },
  '19': { racecourse_id: 'funabashi-racecourse', course_label: 'Dirt Left-handed' },
  '20': { racecourse_id: 'oi-racecourse', course_label: 'Dirt Right-handed' },
  '21': { racecourse_id: 'kawasaki-racecourse', course_label: 'Dirt Left-handed' },
};

const MENU_URL = 'https://www.nankankeiba.com/bangumi_menu/bangumi.do';

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)));
}

function textify(html) {
  return decodeHtml(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '\n')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:div|li|p|tr|td|th|h1|h2|h3|h4|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\r/g, '')
    .replace(/[\t\u3000 ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

async function get(url, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)',
      accept: 'text/html',
      'accept-language': 'ja,en;q=.7',
    },
  });
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}: ${url}`);
    error.status = response.status;
    throw error;
  }
  const bytes = await response.arrayBuffer();
  const candidates = ['utf-8', 'shift_jis'].map((encoding) => ({
    encoding,
    text: new TextDecoder(encoding).decode(bytes),
  }));
  candidates.sort((a, b) => (b.text.match(/[競馬発走開催番組]/g)?.length ?? 0) - (a.text.match(/[競馬発走開催番組]/g)?.length ?? 0));
  return { body: candidates[0].text, url: response.url };
}

export function parseNankanProgrammeRows(html) {
  const lines = textify(html).split('\n').map((value) => value.trim()).filter(Boolean);
  const rows = [];
  for (let index = 0; index < lines.length; index += 1) {
    const race = lines[index].match(/^(\d{1,2})R$/i);
    if (!race) continue;
    const raceNumber = Number(race[1]);
    let postTime = null;
    let distanceM = null;
    let raceName = null;
    for (let cursor = index + 1; cursor < Math.min(lines.length, index + 16); cursor += 1) {
      if (/^\d{1,2}R$/i.test(lines[cursor])) break;
      const combined = lines[cursor].match(/(\d{1,2}:\d{2})\s+(\d{3,4})\s*[mｍＭ]/i);
      if (combined) {
        postTime = combined[1].padStart(5, '0');
        distanceM = Number(combined[2]);
        continue;
      }
      const time = lines[cursor].match(/^(\d{1,2}:\d{2})$/);
      if (time && !postTime) {
        postTime = time[1].padStart(5, '0');
        continue;
      }
      const distance = lines[cursor].match(/^(\d{3,4})\s*[mｍＭ]$/i);
      if (distance && !distanceM) {
        distanceM = Number(distance[1]);
        continue;
      }
      if (
        !raceName
        && postTime
        && distanceM
        && !/^(?:TOPICS|分析|変更|オッズ|着順速報|払戻金一覧|本日の騎乗一覧|SPAT4LOTO|出走表|結果|リプレイ)/.test(lines[cursor])
      ) {
        raceName = lines[cursor].replace(/\s+/g, ' ').trim();
      }
    }
    if (postTime && distanceM && raceName) {
      rows.push({
        race_number: raceNumber,
        label: `Race ${raceNumber}`,
        post_time_local: postTime,
        race_name: raceName,
        distance_m: distanceM,
      });
    }
  }
  return [...new Map(rows.map((row) => [row.race_number, row])).values()].sort((a, b) => a.race_number - b.race_number);
}

function venueCode(meeting) {
  return Object.entries(NANKAN_VENUES).find(([, value]) => value.racecourse_id === meeting.racecourse_id)?.[0] ?? null;
}

export function parseNankanMeetingNumber(menuHtml, year, code) {
  const pattern = new RegExp(`(?:href=["'][^"']*)?bangumi\\/${year}${code}(\\d{2})\\.do`, 'gi');
  const matches = [...String(menuHtml).matchAll(pattern)].map((match) => match[1]);
  return matches.at(-1) ?? null;
}

export function parseNankanMeetingDates(bangumiHtml, year) {
  const lines = textify(bangumiHtml).split('\n').map((value) => value.trim()).filter(Boolean);
  const dates = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(\d{1,2})月\s*(\d{1,2})日(?:（[^）]+）|\([^)]*\))?$/);
    if (!match) continue;
    const nearby = lines.slice(index + 1, index + 4).join(' ');
    if (!/\d{1,2}R/.test(nearby)) continue;
    const date = `${year}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
    if (!dates.includes(date)) dates.push(date);
  }
  return dates;
}

export async function fetchNankanOfficialProgramme(meeting, { fetchImpl = fetch } = {}) {
  const code = venueCode(meeting);
  if (!code) return null;
  const year = meeting.date.slice(0, 4);
  const menu = await get(MENU_URL, fetchImpl);
  const meetingNumber = parseNankanMeetingNumber(menu.body, year, code);
  if (!meetingNumber) return null;

  const bangumiUrl = `https://www.nankankeiba.com/bangumi/${year}${code}${meetingNumber}.do`;
  const bangumi = await get(bangumiUrl, fetchImpl);
  const dates = parseNankanMeetingDates(bangumi.body, year);
  const dayIndex = dates.indexOf(meeting.date);
  if (dayIndex < 0) return null;

  const dayNumber = String(dayIndex + 1).padStart(2, '0');
  const programUrl = `https://www.nankankeiba.com/program/${meeting.date.replaceAll('-', '')}${code}${meetingNumber}${dayNumber}.do`;
  let programme;
  try {
    programme = await get(programUrl, fetchImpl);
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
  const rows = parseNankanProgrammeRows(programme.body);
  if (!rows.length || !rows.every((row, index) => row.race_number === index + 1)) return null;
  const course = NANKAN_VENUES[code].course_label;
  return {
    status: 'ok',
    meeting: {
      ...meeting,
      capability_rank: 'A+',
      timetable_rows: rows.map(({ race_number, ...row }) => ({
        ...row,
        surface: 'Dirt',
        course_label: course,
      })),
      source_id: 'nankan-official-programme',
      source_label: '南関東4競馬場',
      official_source_url: programme.url,
    },
  };
}

export function withNankanOfficialProgrammeFallback(baseInspect) {
  return async (meeting, context) => {
    const primary = await baseInspect(meeting, context);
    if (!['scheduled_pending_details', 'details_pending'].includes(primary?.status)) return primary;
    if (!venueCode(meeting)) return primary;
    try {
      return (await fetchNankanOfficialProgramme(meeting)) ?? primary;
    } catch {
      return primary;
    }
  };
}
