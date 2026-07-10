const target = {
  date: '2026-07-08',
  racecourse_code: 'HV',
  race_number: 1,
};
const racecardUrl = `https://racing.hkjc.com/en-us/local/information/racecard?racedate=${target.date.replaceAll('-', '/')}&Racecourse=${target.racecourse_code}&RaceNo=${target.race_number}`;
const fixtureUrl = 'https://racing.hkjc.com/en-us/local/information/fixture?CalMonth=07&CalYear=2026';
const racecardBaseUrl = 'https://racing.hkjc.com/en-us/local/information/racecard';
const timeoutMs = 15000;

const browserHeaders = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9',
  'cache-control': 'no-cache',
  pragma: 'no-cache',
  'sec-ch-ua': '"Chromium";v="126", "Not.A/Brand";v="24"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'upgrade-insecure-requests': '1',
};

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

function pageSummary(body, response, strategy) {
  const text = stripHtml(body);
  return {
    strategy,
    http_status: response.status,
    response_ok: response.ok,
    final_url: response.url,
    response_bytes: Buffer.byteLength(body),
    visible_text_chars: text.length,
    blocked_marker: /access\s*denied|captcha|robot|bot|forbidden|temporarily unavailable|akamai|request blocked/i.test(text),
    target_meeting_marker: /08\s+Jul\s+-\s+Happy Valley|July\s+08,\s+2026,\s+Happy Valley/i.test(text),
    post_time_shape: /Wednesday,\s+July\s+08,\s+2026,\s+Happy Valley,\s+\d{1,2}:\d{2}/i.test(text),
    race_name_shape: /Race\s*1\s*[-–—:]/i.test(text),
    distance_shape: /\b\d{3,4}M\b/i.test(text),
    surface_shape: /\b(?:Turf|All Weather Track|All Weather|Dirt)\b/i.test(text),
    raw_body_stored: false,
  };
}

async function fetchWithTimeout(url, headers) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: 'follow', headers });
    const body = await response.text();
    return { response, body };
  } finally {
    clearTimeout(timer);
  }
}

function cookieHeader(response) {
  const values = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie')].filter(Boolean);
  return values.map((value) => value.split(';', 1)[0]).filter(Boolean).join('; ');
}

async function direct() {
  const { response, body } = await fetchWithTimeout(racecardUrl, browserHeaders);
  return pageSummary(body, response, 'direct-browser-headers');
}

async function warmed(strategy, warmUrl) {
  const warm = await fetchWithTimeout(warmUrl, browserHeaders);
  const cookies = cookieHeader(warm.response);
  const headers = {
    ...browserHeaders,
    referer: warm.response.url,
    'sec-fetch-site': 'same-origin',
    ...(cookies ? { cookie: cookies } : {}),
  };
  const targetResult = await fetchWithTimeout(racecardUrl, headers);
  return {
    ...pageSummary(targetResult.body, targetResult.response, strategy),
    warm_status: warm.response.status,
    warm_final_url: warm.response.url,
    cookie_pair_count: cookies ? cookies.split('; ').length : 0,
  };
}

const results = [];
for (const operation of [
  () => direct(),
  () => warmed('fixture-warmup-cookie', fixtureUrl),
  () => warmed('racecard-base-warmup-cookie', racecardBaseUrl),
]) {
  try {
    results.push(await operation());
  } catch (error) {
    results.push({ strategy: `failed-${results.length + 1}`, network_error: String(error?.cause?.code ?? error?.message ?? error), raw_body_stored: false });
  }
}

console.log(JSON.stringify({
  schema_version: 'calendar-hkjc-detail-session-strategy-probe-v1',
  work_id: 'WHR-CAL-HONG-KONG-HKJC',
  implementation_unit: 'HKJC-PILOT-05',
  target,
  results,
  raw_body_stored: false,
  public_safe_probe_only: true,
}, null, 2));
