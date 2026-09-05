const RANKS = Object.freeze(['C', 'B', 'B+', 'A', 'A+']);
const VENUE_CODE = '3';
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function decodeEntities(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

export function baneiText(value) {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:tr|td|th|div|section|article|p|li|h[1-6]|a)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t\u3000]+/g, ' ')
    .replace(/\r/g, '')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function compact(value) {
  return baneiText(value).replace(/\s+/g, ' ').trim();
}

function normalizeTime(value) {
  const match = String(value ?? '').match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function realDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function baneiRaceListUrl(date) {
  if (!realDate(date)) throw new Error(`invalid Banei RaceList date ${date}`);
  const params = new URLSearchParams({
    k_babaCode: VENUE_CODE,
    k_raceDate: date.replaceAll('-', '/'),
  });
  return `https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList?${params}`;
}

export function baneiDebaTableUrl(date, raceNumber) {
  if (!realDate(date)) throw new Error(`invalid Banei DebaTable date ${date}`);
  if (!Number.isInteger(raceNumber) || raceNumber < 1 || raceNumber > 30) {
    throw new Error(`invalid Banei race number ${raceNumber}`);
  }
  const params = new URLSearchParams({
    k_babaCode: VENUE_CODE,
    k_raceDate: date.replaceAll('-', '/'),
    k_raceNo: String(raceNumber),
  });
  return `https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/DebaTable?${params}`;
}

function raceNameFromBlock(block, raceNumber) {
  for (const match of block.matchAll(/<a\b[^>]*href=["'][^"']*(?:D[ea]baTable|S_DebaTable)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const value = compact(match[1]);
    if (value && !/(出馬表|詳細|オッズ|結果|映像|成績)/.test(value)) return value;
  }
  const lines = baneiText(block)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) => !new RegExp(`^${raceNumber}\\s*R$`, 'i').test(line))
    .filter((line) => !/^\d{1,2}:\d{2}$/.test(line))
    .filter((line) => !/^直\s*\d{3,4}\s*[mｍＭ]$/.test(line))
    .filter((line) => !/(出馬表|オッズ|結果|払戻|映像|予想|投票|変更情報|頭数)/.test(line));
  return lines.find((line) => line.length >= 2 && line.length <= 120) ?? null;
}

export function parseBaneiRaceList(html, date) {
  if (!realDate(date)) throw new Error(`invalid Banei RaceList date ${date}`);
  const rows = new Map();
  const blocks = [...String(html ?? '').matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)].map((match) => match[0]);
  for (const block of blocks) {
    const plain = compact(block);
    const hrefRace = block.match(/[?&]k_raceNo=(\d{1,2})(?:&|["'])/i);
    const raceMatch = hrefRace ?? plain.match(/(?:^|\s)(\d{1,2})\s*R(?:\s|$)/i);
    const timeMatch = plain.match(/(?:^|\s)(\d{1,2}:\d{2})(?:\s|$)/);
    const straightMatch = plain.match(/直\s*(\d{3,4})\s*[mｍＭ]/);
    if (!raceMatch || !timeMatch || !straightMatch) continue;
    const raceNumber = Number(raceMatch[1]);
    const distance = Number(straightMatch[1]);
    if (raceNumber < 1 || raceNumber > 30 || distance < 100 || distance > 2000) continue;
    const raceName = raceNameFromBlock(block, raceNumber);
    const postTime = normalizeTime(timeMatch[1]);
    if (!raceName || !postTime) continue;
    rows.set(raceNumber, {
      race_number: raceNumber,
      label: `Race ${raceNumber}`,
      post_time_local: postTime,
      race_name: raceName,
      list_distance_m: distance,
      list_course_shape: 'straight',
      detail_url: baneiDebaTableUrl(date, raceNumber),
    });
  }
  return [...rows.values()].sort((left, right) => left.race_number - right.race_number);
}

export function discoverBaneiRaceNumbers(html) {
  const found = new Set();
  for (const match of String(html ?? '').matchAll(/[?&]k_raceNo=(\d{1,2})(?:&|["'])/gi)) {
    const value = Number(match[1]);
    if (value >= 1 && value <= 30) found.add(value);
  }
  for (const match of baneiText(html).matchAll(/(?:^|\s)(\d{1,2})\s*R(?:\s|$)/gi)) {
    const value = Number(match[1]);
    if (value >= 1 && value <= 30) found.add(value);
  }
  return [...found].sort((left, right) => left - right);
}

export function continuousRaceNumbers(numbers) {
  return Array.isArray(numbers)
    && numbers.length >= 1
    && numbers.every((value, index) => value === index + 1);
}

export function parseBaneiDebaMetadata(html) {
  const plain = compact(html);
  const pattern = /ダート\s*(\d{3,4})\s*[mｍＭ]\s*[（(]\s*直\s*[）)]/;
  const match = plain.match(pattern);
  if (!match) return null;
  const distance = Number(match[1]);
  if (!Number.isInteger(distance) || distance < 100 || distance > 2000) return null;
  return {
    surface: 'Dirt',
    distance_m: distance,
    course_label: 'Banei Straight Course',
    course_shape: 'straight',
    source: 'nar_banei_deba_table',
  };
}

export function completeBaneiAPlusMeeting({
  date,
  list_url: listUrl,
  list_rows: listRows,
  detail_metadata_by_race: detailMetadataByRace,
  checked_at: checkedAt,
}) {
  if (!realDate(date)) throw new Error('Banei meeting date invalid');
  if (typeof listUrl !== 'string' || !listUrl.startsWith('https://www.keiba.go.jp/')) {
    throw new Error('Banei RaceList URL must be official NAR HTTPS URL');
  }
  if (!validDateTime(checkedAt)) throw new Error('Banei checked_at invalid');
  const raceNumbers = listRows.map((row) => row.race_number);
  if (!continuousRaceNumbers(raceNumbers)) throw new Error('Banei RaceList race numbers must be continuous from one');
  const rows = [];
  for (const row of listRows) {
    const metadata = detailMetadataByRace.get(row.race_number);
    if (!metadata) throw new Error(`Banei detail metadata missing for Race ${row.race_number}`);
    if (metadata.course_shape !== 'straight') throw new Error(`Banei course shape differs for Race ${row.race_number}`);
    if (metadata.distance_m !== row.list_distance_m) {
      throw new Error(`Banei list/detail distance mismatch for Race ${row.race_number}`);
    }
    rows.push({
      label: row.label,
      post_time_local: row.post_time_local,
      race_name: row.race_name,
      distance_m: metadata.distance_m,
      surface: metadata.surface,
      course_label: metadata.course_label,
    });
  }
  return {
    schema_version: 'timetable-candidate-v1',
    generated_at: checkedAt,
    adapter_id: 'banei-nar-race-list-detail-v1',
    country_id: 'japan',
    authority_id: 'banei-tokachi',
    source_id: 'nar-banei-race-list-deba-table',
    candidate_window: {
      start_date: date,
      end_date_exclusive: addDays(date, 1),
      timezone: 'Asia/Tokyo',
    },
    records: [{
      candidate_id: `candidate-banei-obihiro-racecourse-${date}`,
      meeting_id: `banei-obihiro-racecourse-${date}`,
      country_id: 'japan',
      authority_id: 'banei-tokachi',
      racing_system_id: 'japan-banei-system',
      racecourse_id: 'obihiro-racecourse',
      date,
      timezone: 'Asia/Tokyo',
      capability_rank: 'A+',
      first_race_time_local: rows[0].post_time_local,
      last_race_time_local: rows.at(-1).post_time_local,
      timetable_rows: rows,
      source: {
        source_id: 'nar-banei-race-list-deba-table',
        official_url: listUrl,
        checked_at: checkedAt,
        extraction_method: 'adapter_candidate',
      },
      confidence: 'high',
      review_status: 'needs_review',
      notes: 'Banei-specific A+ candidate derived from official NAR Banei RaceList and per-race DebaTable metadata; no participant, odds, result, payout, prediction, or raw source data retained.',
    }],
    review: {
      status: 'needs_review',
      reviewed_at: null,
      reviewer: null,
      summary: 'Banei-specific A+ candidate. Human review and Promotion Validation remain required.',
      promotion_target: null,
    },
  };
}

function validDateTime(value) {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Date.parse(value));
}

function addDays(date, days) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export const baneiDetailV1Contract = Object.freeze({
  venue_code: VENUE_CODE,
  ranks: RANKS,
  adapter_id: 'banei-nar-race-list-detail-v1',
  source_id: 'nar-banei-race-list-deba-table',
  course_label: 'Banei Straight Course',
});
