const months = ['2026-07', '2026-08', '2026-09'];
const timeoutMs = 15000;

function fixtureUrl(token) {
  const [year, month] = token.split('-');
  return `https://racing.hkjc.com/en-us/local/information/fixture?CalMonth=${month}&CalYear=${year}`;
}

function normalizeUrl(raw, base) {
  try {
    const url = new URL(raw.replaceAll('&amp;', '&'), base);
    if (!['racing.hkjc.com', 'www.hkjc.com', 'corporate.hkjc.com', 'racingnews.hkjc.com'].includes(url.hostname.toLowerCase())) return null;
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

async function probeMonth(token) {
  const url = fixtureUrl(token);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'user-agent': 'WhereHorsesRun/1.0 (+public calendar research; official-link-summary-only)',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
      },
    });
    const html = await response.text();
    const rawLinks = [
      ...[...html.matchAll(/\bhref=["']([^"']+)["']/gi)].map((match) => match[1]),
      ...[...html.matchAll(/\bsrc=["']([^"']+)["']/gi)].map((match) => match[1]),
    ];
    const normalized = [...new Set(rawLinks.map((value) => normalizeUrl(value, response.url)).filter(Boolean))];
    const routeCandidates = normalized
      .filter((value) => /fixture|calendar|race.?day|season|schedule/i.test(value))
      .slice(0, 80);
    const queryKeys = [...new Set(routeCandidates.flatMap((value) => [...new URL(value).searchParams.keys()]))].sort();
    return {
      requested_month: token,
      http_status: response.status,
      final_url: response.url,
      official_route_candidate_count: routeCandidates.length,
      official_route_candidates: routeCandidates,
      candidate_query_keys: queryKeys,
      raw_body_stored: false,
    };
  } finally {
    clearTimeout(timer);
  }
}

const results = [];
for (const token of months) results.push(await probeMonth(token));
console.log(JSON.stringify({
  schema_version: 'calendar-hkjc-fixture-route-link-probe-v1',
  work_id: 'WHR-CAL-HONG-KONG-HKJC',
  implementation_unit: 'HKJC-PILOT-04',
  generated_at: new Date().toISOString(),
  results,
  raw_body_stored: false,
}, null, 2));
