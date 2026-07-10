const meeting = {
  date: '2026-06-10',
  racecourse_code: 'HV',
  race_number: 1,
};

const slashDate = meeting.date.replaceAll('-', '/');
const candidates = [
  {
    id: 'local-slash-date',
    url: `https://racing.hkjc.com/en-us/local/information/racecard?racedate=${slashDate}&Racecourse=${meeting.racecourse_code}&RaceNo=${meeting.race_number}`,
  },
  {
    id: 'local-hyphen-date',
    url: `https://racing.hkjc.com/en-us/local/information/racecard?racedate=${meeting.date}&Racecourse=${meeting.racecourse_code}&RaceNo=${meeting.race_number}`,
  },
  {
    id: 'legacy-aspx',
    url: `https://racing.hkjc.com/racing/information/English/Racing/RaceCard.aspx?RaceDate=${encodeURIComponent(slashDate)}&Racecourse=${meeting.racecourse_code}&RaceNo=${meeting.race_number}`,
  },
];

const timeoutMs = 15000;

function stripHtml(value) {
  return String(value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeSummary(body, response, id, requestedUrl) {
  const text = stripHtml(body);
  return {
    id,
    requested_url: requestedUrl,
    http_status: response.status,
    response_ok: response.ok,
    final_url: response.url,
    final_host: new URL(response.url).hostname.toLowerCase(),
    content_type: response.headers.get('content-type'),
    response_bytes: Buffer.byteLength(body),
    visible_text_chars: text.length,
    blocked_marker: /access\s*denied|captcha|robot|bot|forbidden|temporarily unavailable|akamai|request blocked/i.test(text),
    unavailable_marker: /No race card|not available|not yet available|will be available|Race Card is not available/i.test(text),
    post_time_shape: /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+[A-Za-z]+\s+\d{1,2},\s+\d{4},\s+[^,]+,\s+\d{1,2}:\d{2}/i.test(text),
    race_name_shape: /Race\s*1\s*[-–—:]/i.test(text),
    distance_shape: /\b\d{3,4}M\b/i.test(text),
    surface_shape: /\b(?:Turf|All Weather Track|All Weather|Dirt)\b/i.test(text),
    raw_body_stored: false,
  };
}

async function probe(candidate) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(candidate.url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'user-agent': 'Mozilla/5.0',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
      },
    });
    const body = await response.text();
    return safeSummary(body, response, candidate.id, candidate.url);
  } catch (error) {
    return {
      id: candidate.id,
      requested_url: candidate.url,
      network_error: String(error?.cause?.code ?? error?.message ?? error),
      raw_body_stored: false,
    };
  } finally {
    clearTimeout(timer);
  }
}

const results = [];
for (const candidate of candidates) results.push(await probe(candidate));

console.log(JSON.stringify({
  schema_version: 'calendar-hkjc-detail-route-candidate-probe-v1',
  work_id: 'WHR-CAL-HONG-KONG-HKJC',
  implementation_unit: 'HKJC-PILOT-05',
  target: {
    date: meeting.date,
    racecourse_code: meeting.racecourse_code,
    race_number: meeting.race_number,
  },
  results,
  raw_body_stored: false,
}, null, 2));
