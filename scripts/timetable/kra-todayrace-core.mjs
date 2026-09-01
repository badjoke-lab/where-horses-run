const RANKS = Object.freeze(['C', 'B', 'B+', 'A', 'A+']);

const HTML_ENTITIES = Object.freeze({
  '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
});

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&(nbsp|amp|lt|gt|quot);|&#39;/gi, (match) => HTML_ENTITIES[match.toLowerCase()] ?? match)
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function textFromHtml(value) {
  return decodeHtml(String(value ?? ''))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\t\r ]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim();
}

function normalizeDistance(value) {
  const match = String(value ?? '').match(/([1-9]\d{2,3}(?:,\d{3})?)\s*[mM]\b/);
  if (!match) return null;
  const parsed = Number(match[1].replace(/,/g, ''));
  return Number.isInteger(parsed) && parsed >= 600 && parsed <= 5000 ? parsed : null;
}

function normalizeTime(value) {
  const colon = String(value ?? '').match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (colon) return `${colon[1].padStart(2, '0')}:${colon[2]}`;
  const korean = String(value ?? '').match(/\b([01]?\d|2[0-3])\s*시\s*([0-5]\d)\s*분\b/);
  if (korean) return `${korean[1].padStart(2, '0')}:${korean[2]}`;
  return null;
}

function raceNumberFromBlock(raw, text) {
  const patterns = [
    /\brcNo\b[^0-9]{0,40}["']?(\d{1,2})\b/i,
    /\brcno\b[^0-9]{0,40}["']?(\d{1,2})\b/i,
    /제\s*(\d{1,2})\s*경주/,
    /(?:^|\s)(\d{1,2})\s*경주(?:\s|$)/,
    /(?:^|\s)(\d{1,2})\s*[rR](?:\s|$)/,
  ];
  for (const pattern of patterns) {
    const match = String(raw ?? '').match(pattern) ?? String(text ?? '').match(pattern);
    if (match) {
      const parsed = Number(match[1]);
      if (parsed >= 1 && parsed <= 30) return parsed;
    }
  }
  return null;
}

function compactDescription(text, raceNumber, postTime, distanceM) {
  let value = String(text ?? '')
    .replace(new RegExp(`제\\s*${raceNumber}\\s*경주`, 'g'), ' ')
    .replace(new RegExp(`(?:^|\\s)${raceNumber}\\s*경주(?:\\s|$)`, 'g'), ' ')
    .replace(postTime ? new RegExp(postTime.replace(':', '\\:'), 'g') : /$^/, ' ')
    .replace(distanceM ? new RegExp(`${distanceM.toLocaleString('en-US').replace(',', ',?')}\\s*[mM]`, 'g') : /$^/, ' ')
    .replace(/내용보기|내용닫기|선택됨|선택되지 않음/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (value.length > 180) value = value.slice(0, 180).trim();
  if (!value || /^\d+$/.test(value)) return null;
  return value;
}

function candidateBlocks(html) {
  const source = String(html ?? '');
  const blocks = [];
  for (const tag of ['tr', 'li']) {
    const pattern = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
    for (const match of source.matchAll(pattern)) blocks.push({ index: match.index ?? 0, raw: match[0] });
  }
  blocks.sort((a, b) => a.index - b.index);
  return blocks;
}

function extractRowsFromBlocks(html, sourceLabel) {
  const rows = new Map();
  for (const block of candidateBlocks(html)) {
    const text = textFromHtml(block.raw);
    const raceNumber = raceNumberFromBlock(block.raw, text);
    if (!raceNumber) continue;
    const postTimeLocal = normalizeTime(text);
    const distanceM = normalizeDistance(text);
    if (!postTimeLocal && !distanceM) continue;
    const prior = rows.get(raceNumber) ?? { race_number: raceNumber, sources: [] };
    const next = {
      ...prior,
      ...(postTimeLocal ? { post_time_local: postTimeLocal } : {}),
      ...(distanceM ? { distance_m: distanceM } : {}),
      sources: [...new Set([...(prior.sources ?? []), sourceLabel])],
    };
    const description = compactDescription(text, raceNumber, postTimeLocal, distanceM);
    if (description && !next.race_description) next.race_description = description;
    rows.set(raceNumber, next);
  }
  return rows;
}

function sequentialTimeRows(html, sourceLabel) {
  const text = textFromHtml(html);
  const explicit = [...text.matchAll(/(?:제\s*)?(\d{1,2})\s*경주[\s\S]{0,180}?\b([01]?\d|2[0-3]):([0-5]\d)\b/g)];
  const rows = new Map();
  for (const match of explicit) {
    const raceNumber = Number(match[1]);
    if (raceNumber < 1 || raceNumber > 30) continue;
    rows.set(raceNumber, {
      race_number: raceNumber,
      post_time_local: `${match[2].padStart(2, '0')}:${match[3]}`,
      sources: [sourceLabel],
    });
  }
  return rows;
}

function orderedVisibleTimeRows(html, blockRows, sourceLabel) {
  const raceNumbers = [...blockRows.keys()].sort((a, b) => a - b);
  if (raceNumbers.length < 2 || !raceNumbers.every((value, index) => value === index + 1)) return new Map();

  const text = textFromHtml(html);
  let times = [...text.matchAll(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g)]
    .map((match) => `${match[1].padStart(2, '0')}:${match[2]}`);
  if (times.length !== raceNumbers.length) {
    times = [...text.matchAll(/\b([01]?\d|2[0-3])\s*시\s*([0-5]\d)\s*분\b/g)]
      .map((match) => `${match[1].padStart(2, '0')}:${match[2]}`);
  }
  if (times.length !== raceNumbers.length) return new Map();

  return new Map(raceNumbers.map((raceNumber, index) => [raceNumber, {
    race_number: raceNumber,
    post_time_local: times[index],
    sources: [sourceLabel],
  }]));
}

function orderedCrossPageTimeRows(pages, rows) {
  if (rows.length < 2 || !contiguous(rows)) return new Map();

  const seenHtml = new Set();
  const uniquePages = [];
  for (const page of pages) {
    const html = String(page.html ?? '');
    if (!html || seenHtml.has(html)) continue;
    seenHtml.add(html);
    uniquePages.push(page);
  }

  let entries = [];
  for (const page of uniquePages) {
    const text = textFromHtml(page.html);
    for (const match of text.matchAll(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g)) {
      entries.push({
        time: `${match[1].padStart(2, '0')}:${match[2]}`,
        source: page.source,
      });
    }
  }

  if (entries.length !== rows.length) {
    entries = [];
    for (const page of uniquePages) {
      const text = textFromHtml(page.html);
      for (const match of text.matchAll(/\b([01]?\d|2[0-3])\s*시\s*([0-5]\d)\s*분\b/g)) {
        entries.push({
          time: `${match[1].padStart(2, '0')}:${match[2]}`,
          source: page.source,
        });
      }
    }
  }

  if (entries.length !== rows.length) return new Map();

  return new Map(rows.map((row, index) => [row.race_number, {
    race_number: row.race_number,
    post_time_local: entries[index].time,
    sources: [entries[index].source],
  }]));
}

function mergeRows(target, incoming) {
  for (const [raceNumber, row] of incoming) {
    const prior = target.get(raceNumber) ?? { race_number: raceNumber, sources: [] };
    target.set(raceNumber, {
      ...prior,
      ...Object.fromEntries(Object.entries(row).filter(([key, value]) => key !== 'sources' && value != null)),
      sources: [...new Set([...(prior.sources ?? []), ...(row.sources ?? [])])],
    });
  }
}

function contiguous(rows) {
  if (!rows.length) return false;
  return rows.every((row, index) => row.race_number === index + 1);
}

export function parseKraTodayRacePages(pages) {
  const merged = new Map();
  for (const page of pages) {
    const blockRows = extractRowsFromBlocks(page.html, page.source);
    mergeRows(merged, blockRows);
    mergeRows(merged, sequentialTimeRows(page.html, page.source));
    mergeRows(merged, orderedVisibleTimeRows(page.html, blockRows, page.source));
  }

  let rows = [...merged.values()].sort((a, b) => a.race_number - b.race_number);
  if (!rows.some((row) => row.post_time_local)) {
    mergeRows(merged, orderedCrossPageTimeRows(pages, rows));
    rows = [...merged.values()].sort((a, b) => a.race_number - b.race_number);
  }
  return rows;
}

export function classifyKraObservation(rows) {
  const ordered = [...rows].sort((a, b) => a.race_number - b.race_number);
  const timed = ordered.filter((row) => row.post_time_local);
  const completeTimes = ordered.length >= 2 && contiguous(ordered) && timed.length === ordered.length;
  const completeDistances = completeTimes && ordered.every((row) => Number.isInteger(row.distance_m));
  const completeDescriptions = completeDistances && ordered.every((row) => typeof row.race_description === 'string' && row.race_description.trim());
  let rank = 'C';
  if (timed.length === 1) rank = 'B';
  else if (timed.length >= 2) rank = completeTimes ? 'A' : 'B+';
  if (completeTimes && completeDistances && completeDescriptions) rank = 'A+';
  return {
    rank,
    race_count: ordered.length,
    time_count: timed.length,
    distance_count: ordered.filter((row) => Number.isInteger(row.distance_m)).length,
    description_count: ordered.filter((row) => typeof row.race_description === 'string' && row.race_description.trim()).length,
    contiguous_complete_times: completeTimes,
    complete_distances: completeDistances,
    complete_descriptions: completeDescriptions,
  };
}

export function buildKraMeetingObservation({ meetingId, date, racecourseId, meetCode, rows, checkedAt, sourceStatuses }) {
  const classification = classifyKraObservation(rows);
  const first = rows.find((row) => row.post_time_local)?.post_time_local ?? null;
  const last = [...rows].reverse().find((row) => row.post_time_local)?.post_time_local ?? null;
  const timetableRows = ['A', 'A+'].includes(classification.rank)
    ? rows.filter((row) => row.post_time_local).map((row) => ({
        label: `Race ${row.race_number}`,
        post_time_local: row.post_time_local,
        ...(classification.rank === 'A+' && row.distance_m ? { distance_m: row.distance_m } : {}),
        ...(classification.rank === 'A+' && row.race_description ? { race_name: row.race_description } : {}),
      }))
    : [];
  return {
    schema_version: 'kra-today-race-observation-v1',
    meeting_id: meetingId,
    country_id: 'south-korea',
    authority_id: 'korea-racing-authority',
    racing_system_id: 'kra-national-racing-system',
    racecourse_id: racecourseId,
    date,
    timezone: 'Asia/Seoul',
    meet_code: String(meetCode),
    capability_rank: classification.rank,
    first_race_time_local: first,
    last_race_time_local: classification.rank === 'B' ? null : last,
    timetable_rows: timetableRows,
    classifier: classification,
    source_statuses: sourceStatuses,
    source: {
      source_id: 'kra-today-race',
      official_url: 'https://todayrace.kra.co.kr/main.do',
      checked_at: checkedAt,
      extraction_method: 'live_public_safe',
    },
    raw_html_stored: false,
  };
}

export { RANKS };
