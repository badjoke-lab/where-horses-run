const entities = (value) => String(value ?? '')
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>');

const plain = (value) => entities(value)
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<br\s*\/?>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/[\s\u3000]+/g, ' ')
  .trim();

function meeting(date, sourceUrl) {
  return {
    meeting_id: `banei-obihiro-racecourse-${date}`,
    date,
    authority_id: 'banei-tokachi',
    racing_system_id: 'japan-banei-system',
    racecourse_id: 'obihiro-racecourse',
    source_id: 'banei-official-monthly-schedule-nar-detail',
    source_label: 'ばんえい十勝',
    official_source_url: sourceUrl,
  };
}

function isoDate(year, month, day) {
  return `${year}-${String(Number(month)).padStart(2, '0')}-${String(Number(day)).padStart(2, '0')}`;
}

function cells(rowHtml) {
  return [...String(rowHtml).matchAll(/<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi)].map((match) => plain(match[1]));
}

export function parseBaneiOfficialMonthlySchedule(html, dates, sourceUrl) {
  const allowed = new Set(dates);
  const pageText = plain(html);
  const monthMatch = pageText.match(/(20\d{2})\s*年\s*(\d{1,2})\s*月/);
  if (!monthMatch) throw new Error(`banei official monthly schedule month not found: ${sourceUrl}`);
  const [, year, month] = monthMatch;
  const found = [];

  // The official page exposes the nearest race days as explicit dated headings.
  for (const match of pageText.matchAll(/(?:■\s*)?(20\d{2})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/g)) {
    const date = isoDate(match[1], match[2], match[3]);
    if (allowed.has(date)) found.push(meeting(date, sourceUrl));
  }

  // The full month is in a calendar table. A date row is followed by a
  // "ばんえい開催" row whose cell contains "帯広競馬場" only on race days.
  let dayCells = null;
  for (const rowMatch of String(html).matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)) {
    const rowCells = cells(rowMatch[0]);
    if (!rowCells.length) continue;
    if (/^日付$/.test(rowCells[0])) {
      dayCells = rowCells.slice(1).map((value) => Number(value.match(/\b([1-9]|[12]\d|3[01])\b/)?.[1] ?? 0));
      continue;
    }
    if (!dayCells || !/^ばんえい開催/.test(rowCells[0])) continue;
    const scheduleCells = rowCells.slice(1);
    const width = Math.min(dayCells.length, scheduleCells.length);
    for (let index = 0; index < width; index += 1) {
      const day = dayCells[index];
      if (!day || !/帯広競馬場/.test(scheduleCells[index])) continue;
      const date = isoDate(year, month, day);
      if (allowed.has(date)) found.push(meeting(date, sourceUrl));
    }
    dayCells = null;
  }

  return [...new Map(found.map((row) => [row.meeting_id, row])).values()].sort((a, b) => a.date.localeCompare(b.date));
}

function months(dates) {
  return [...new Set(dates.map((date) => date.slice(0, 7)))];
}

async function fetchPage(url, fetchImpl) {
  const response = await fetchImpl(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)',
      accept: 'text/html',
      'accept-language': 'ja,en;q=.7',
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return { body: await response.text(), url: response.url || url };
}

export async function discoverBaneiOfficial30d({ dates }, { fetchImpl = fetch } = {}) {
  const found = [];
  for (const monthKey of months(dates)) {
    const epoch = Math.floor(Date.parse(`${monthKey}-01T00:00:00+09:00`) / 1000);
    const url = `https://www.banei-keiba.or.jp/race_schedule.php?c=mon&d=${epoch}`;
    const page = await fetchPage(url, fetchImpl);
    const monthDates = dates.filter((date) => date.startsWith(`${monthKey}-`));
    const parsed = parseBaneiOfficialMonthlySchedule(page.body, monthDates, page.url);
    found.push(...parsed);
  }
  return [...new Map(found.map((row) => [row.meeting_id, row])).values()].sort((a, b) => a.date.localeCompare(b.date));
}
