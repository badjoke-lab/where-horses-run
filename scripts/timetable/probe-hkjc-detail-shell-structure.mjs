const targetUrl = 'https://racing.hkjc.com/en-us/local/information/racecard?racedate=2026/06/10&Racecourse=HV&RaceNo=1';
const timeoutMs = 15000;

function normalizeOfficialUrl(raw, base) {
  try {
    const decoded = String(raw).replaceAll('&amp;', '&');
    const url = new URL(decoded, base);
    if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'racing.hkjc.com') return null;
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function safePathCandidates(html, base) {
  const literalUrls = [
    ...[...html.matchAll(/(?:https?:\\\/\\\/|https?:\/\/)[^"'<>\\s]+/gi)].map((match) => match[0].replaceAll('\\/', '/')),
    ...[...html.matchAll(/["'](\/[^"']*(?:api|racecard|race-card|raceinfo|race-info|graphql|json|data)[^"']*)["']/gi)].map((match) => match[1]),
  ];
  return unique(literalUrls.map((value) => normalizeOfficialUrl(value, base)))
    .filter((value) => /api|racecard|race-card|raceinfo|race-info|graphql|json|data/i.test(value))
    .slice(0, 100);
}

const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), timeoutMs);
let summary;
try {
  const response = await fetch(targetUrl, {
    signal: controller.signal,
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'en-US,en;q=0.9',
    },
  });
  const html = await response.text();
  const scriptSources = unique(
    [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)]
      .map((match) => normalizeOfficialUrl(match[1], response.url)),
  );
  const linkTargets = unique(
    [...html.matchAll(/<link\b[^>]*\bhref=["']([^"']+)["']/gi)]
      .map((match) => normalizeOfficialUrl(match[1], response.url)),
  );
  const markerNames = [
    '__NEXT_DATA__',
    '__NUXT__',
    'graphql',
    'apollo',
    'racecard',
    'RaceCard',
    'racedate',
    'RaceDate',
    'RaceNo',
    'raceInfo',
    'race-info',
    '/api/',
    '.json',
  ];
  const markerPresence = Object.fromEntries(markerNames.map((marker) => [marker, html.includes(marker)]));
  const markerCounts = Object.fromEntries(markerNames.map((marker) => [marker, html.split(marker).length - 1]));
  summary = {
    schema_version: 'calendar-hkjc-detail-shell-structure-probe-v1',
    work_id: 'WHR-CAL-HONG-KONG-HKJC',
    implementation_unit: 'HKJC-PILOT-05',
    target_url: targetUrl,
    http_status: response.status,
    response_ok: response.ok,
    final_url: response.url,
    response_bytes: Buffer.byteLength(html),
    script_source_count: scriptSources.length,
    script_sources: scriptSources.slice(0, 100),
    link_target_count: linkTargets.length,
    link_targets: linkTargets.slice(0, 100),
    candidate_endpoint_count: safePathCandidates(html, response.url).length,
    candidate_endpoints: safePathCandidates(html, response.url),
    marker_presence: markerPresence,
    marker_counts: markerCounts,
    inline_script_count: [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>/gi)].length,
    raw_body_stored: false,
    public_safe_probe_only: true,
  };
} finally {
  clearTimeout(timer);
}

console.log(JSON.stringify(summary, null, 2));
