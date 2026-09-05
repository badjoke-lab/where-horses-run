import { baneiText } from './banei-detail-core.mjs';

export const BANEI_PROGRAM_INDEX_URL = 'https://www.banei-keiba.or.jp/race_program.php';

function decodeHref(value) {
  return String(value ?? '')
    .replace(/&amp;/gi, '&')
    .replace(/&#38;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

function targetEpoch(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) return null;
  const value = Date.parse(`${date}T00:00:00Z`);
  return Number.isNaN(value) ? null : value;
}

function seasonDateEpoch(seasonYear, month, day) {
  const calendarYear = month <= 3 ? seasonYear + 1 : seasonYear;
  return Date.UTC(calendarYear, month - 1, day);
}

function detailHrefFromBlock(block) {
  for (const anchor of String(block ?? '').matchAll(/<a\b([^>]*)>/gi)) {
    const hrefMatch = anchor[1].match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const href = decodeHref(hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3] ?? '');
    if (/race_program_detail\.php\?/i.test(href)) return href;
  }
  return null;
}

export function findBaneiProgramDetailUrl(indexHtml, date, baseUrl = BANEI_PROGRAM_INDEX_URL) {
  const target = targetEpoch(date);
  if (target == null) throw new Error(`invalid Banei program target date ${date}`);

  for (const rowMatch of String(indexHtml ?? '').matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)) {
    const block = rowMatch[0];
    const href = detailHrefFromBlock(block);
    if (!href) continue;
    const detailUrl = new URL(href, baseUrl);
    const seasonYear = Number(detailUrl.searchParams.get('d'));
    if (!Number.isInteger(seasonYear) || seasonYear < 2000 || seasonYear > 2200) continue;

    const dates = [...baneiText(block).matchAll(/(\d{1,2})\s*月\s*(\d{1,2})\s*日/g)]
      .map((match) => ({ month: Number(match[1]), day: Number(match[2]) }));
    if (dates.length < 2) continue;
    const start = seasonDateEpoch(seasonYear, dates[0].month, dates[0].day);
    const end = seasonDateEpoch(seasonYear, dates[1].month, dates[1].day);
    if (target >= Math.min(start, end) && target <= Math.max(start, end)) return detailUrl.toString();
  }
  return null;
}

function targetDaySegment(html, date) {
  const [, monthToken, dayToken] = String(date).match(/^\d{4}-(\d{2})-(\d{2})$/) ?? [];
  if (!monthToken || !dayToken) throw new Error(`invalid Banei program target date ${date}`);
  const month = Number(monthToken);
  const day = Number(dayToken);
  const text = baneiText(html);
  const heading = new RegExp(`第\\s*\\d+\\s*回\\s*\\d+\\s*日目\\s*${month}\\s*月\\s*${day}\\s*日`, 'u');
  const match = heading.exec(text);
  if (!match) return '';
  const tail = text.slice(match.index + match[0].length);
  const next = /第\s*\d+\s*回\s*\d+\s*日目\s*\d+\s*月\s*\d+\s*日/u.exec(tail);
  return tail.slice(0, next?.index ?? tail.length);
}

function normalizeRaceName(lines) {
  const parts = [];
  for (const raw of lines) {
    const line = raw.replace(/\s+/g, ' ').trim();
    if (!line) continue;
    if (/^(?:競走名|格付|編成順位|備考)/.test(line)) continue;
    if (/^\d+\s*万円(?:未満|以上)?/.test(line)) break;
    if (/^[―ー-]\s*\d+/.test(line)) break;
    if (/^他主催者/.test(line)) break;
    parts.push(line);
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim() || null;
}

export function parseBaneiOfficialProgramRows(html, date) {
  const segment = targetDaySegment(html, date);
  if (!segment) return [];
  const markers = [...segment.matchAll(/(?:^|\n)\s*(\d{1,2})\s*\n\s*(\d{1,2}):(\d{2})(?=\n|$)/g)];
  const rows = [];
  for (let index = 0; index < markers.length; index += 1) {
    const marker = markers[index];
    const raceNumber = Number(marker[1]);
    if (!Number.isInteger(raceNumber) || raceNumber < 1 || raceNumber > 30) continue;
    const start = marker.index + marker[0].length;
    const end = markers[index + 1]?.index ?? segment.length;
    const raceName = normalizeRaceName(segment.slice(start, end).split('\n'));
    rows.push({
      race_number: raceNumber,
      label: `Race ${raceNumber}`,
      post_time_local: `${String(Number(marker[2])).padStart(2, '0')}:${marker[3]}`,
      race_name: raceName,
      distance_m: null,
      surface: null,
      course_label: null,
    });
  }
  return rows.sort((left, right) => left.race_number - right.race_number);
}

export async function fetchBaneiOfficialProgramRows(meeting, fetchPage) {
  if (!meeting?.date) throw new Error('Banei meeting date is required for official program fallback');
  if (typeof fetchPage !== 'function') throw new Error('Banei official program fallback requires fetchPage');
  const index = await fetchPage(BANEI_PROGRAM_INDEX_URL);
  const detailUrl = findBaneiProgramDetailUrl(index.body, meeting.date, index.url ?? BANEI_PROGRAM_INDEX_URL);
  if (!detailUrl) return null;
  const detail = await fetchPage(detailUrl);
  const rows = parseBaneiOfficialProgramRows(detail.body, meeting.date);
  if (!rows.length) return null;
  if (!rows.every((row, index) => row.race_number === index + 1)) {
    return { status: 'race_number_discovery_incomplete', reason: 'banei_official_program_non_continuous_races' };
  }
  return { status: 'ok', rows, url: detail.url ?? detailUrl };
}
