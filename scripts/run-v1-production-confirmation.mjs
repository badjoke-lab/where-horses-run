import fs from 'node:fs';

const contractPath = 'data/static/v1-production-confirmation-v1.json';
const outputPath = 'v1-production-confirmation-report.json';
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const origin = contract.origin;
const timeoutMs = contract.request_contract.timeout_ms;
const requiredHtmlPaths = contract.required_routes.filter((item) => item.kind === 'html').map((item) => item.path);

function normalizeContentType(value) {
  return String(value ?? '').split(';', 1)[0].trim().toLowerCase();
}

function normalizeText(value) {
  return String(value)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalHref(html) {
  const matches = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]);
  for (const tag of matches) {
    if (!/\brel\s*=\s*["'][^"']*\bcanonical\b[^"']*["']/i.test(tag)) continue;
    const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
    if (href) return href;
  }
  return null;
}

function htmlLanguage(html) {
  return html.match(/<html\b[^>]*\blang\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase() ?? null;
}

async function fetchRoute(item) {
  const url = new URL(item.path, origin).href;
  const result = {
    path: item.path,
    kind: item.kind,
    requested_url: url,
    final_url: null,
    status: null,
    content_type: null,
    bytes: 0,
    duration_ms: 0,
    checks: {},
    errors: [],
  };
  const started = Date.now();

  try {
    const response = await fetch(url, {
      method: contract.request_contract.method,
      redirect: contract.request_contract.redirect_mode,
      cache: 'no-store',
      headers: {
        'user-agent': contract.request_contract.user_agent,
        'cache-control': contract.request_contract.cache_control,
        pragma: 'no-cache',
        accept: item.kind === 'html' ? 'text/html,application/xhtml+xml' : item.kind === 'sitemap' ? 'application/xml,text/xml;q=0.9,*/*;q=0.1' : 'text/plain,*/*;q=0.1',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const body = await response.text();
    const contentType = normalizeContentType(response.headers.get('content-type'));
    result.final_url = response.url;
    result.status = response.status;
    result.content_type = contentType;
    result.bytes = Buffer.byteLength(body);
    result.duration_ms = Date.now() - started;

    const finalOrigin = new URL(response.url).origin;
    result.checks.http_status_200 = response.status === contract.response_contract.required_http_status;
    result.checks.redirect_origin_matches = finalOrigin === contract.response_contract.required_origin_after_redirect;
    if (!result.checks.http_status_200) result.errors.push(`HTTP status ${response.status}`);
    if (!result.checks.redirect_origin_matches) result.errors.push(`redirect origin ${finalOrigin}`);

    if (item.kind === 'html') {
      const visibleText = normalizeText(body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '));
      const expectedCanonical = new URL(item.path, origin).href;
      const actualCanonical = canonicalHref(body);
      const actualLanguage = htmlLanguage(body);
      result.checks.content_type_matches = contentType === contract.response_contract.html_content_type_prefix;
      result.checks.language_matches = actualLanguage === item.locale;
      result.checks.canonical_matches = actualCanonical === expectedCanonical;
      result.checks.markers_match = item.markers.every((marker) => visibleText.includes(normalizeText(marker)));
      result.observed_language = actualLanguage;
      result.observed_canonical = actualCanonical;
      result.missing_markers = item.markers.filter((marker) => !visibleText.includes(normalizeText(marker)));
      if (!result.checks.content_type_matches) result.errors.push(`HTML content type ${contentType}`);
      if (!result.checks.language_matches) result.errors.push(`HTML language ${actualLanguage}`);
      if (!result.checks.canonical_matches) result.errors.push(`canonical ${actualCanonical}`);
      if (!result.checks.markers_match) result.errors.push(`missing markers: ${result.missing_markers.join(', ')}`);
    } else if (item.kind === 'sitemap') {
      const allowed = contract.response_contract.sitemap_content_type_allowed;
      const urls = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
      const missingRoutes = requiredHtmlPaths
        .map((path) => new URL(path, origin).href)
        .filter((requiredUrl) => !urls.includes(requiredUrl));
      result.checks.content_type_matches = allowed.includes(contentType);
      result.checks.url_count_matches = urls.length === item.expected_urls;
      result.checks.required_routes_present = missingRoutes.length === 0;
      result.observed_url_count = urls.length;
      result.missing_required_routes = missingRoutes;
      if (!result.checks.content_type_matches) result.errors.push(`sitemap content type ${contentType}`);
      if (!result.checks.url_count_matches) result.errors.push(`sitemap URL count ${urls.length}`);
      if (!result.checks.required_routes_present) result.errors.push(`sitemap missing routes: ${missingRoutes.join(', ')}`);
    } else if (item.kind === 'robots') {
      result.checks.content_type_matches = contentType === contract.response_contract.robots_content_type_prefix;
      result.checks.markers_match = item.markers.every((marker) => body.includes(marker));
      result.missing_markers = item.markers.filter((marker) => !body.includes(marker));
      if (!result.checks.content_type_matches) result.errors.push(`robots content type ${contentType}`);
      if (!result.checks.markers_match) result.errors.push(`robots missing markers: ${result.missing_markers.join(', ')}`);
    }
  } catch (error) {
    result.duration_ms = Date.now() - started;
    result.errors.push(error instanceof Error ? `${error.name}: ${error.message}` : String(error));
  }

  return result;
}

const routes = [];
for (const item of contract.required_routes) routes.push(await fetchRoute(item));

const aggregate = {
  required_route_checks: contract.required_routes.length,
  completed_route_checks: routes.length,
  failed_requests: routes.filter((item) => item.status === null).length,
  non_200_responses: routes.filter((item) => item.status !== null && item.status !== 200).length,
  redirect_origin_errors: routes.filter((item) => item.checks.redirect_origin_matches === false).length,
  content_type_errors: routes.filter((item) => item.checks.content_type_matches === false).length,
  marker_errors: routes.filter((item) => item.checks.markers_match === false).length,
  language_errors: routes.filter((item) => item.checks.language_matches === false).length,
  canonical_errors: routes.filter((item) => item.checks.canonical_matches === false).length,
  sitemap_count_errors: routes.filter((item) => item.kind === 'sitemap' && item.checks.url_count_matches === false).length,
  sitemap_route_errors: routes.filter((item) => item.kind === 'sitemap' && item.checks.required_routes_present === false).length,
  robots_errors: routes.filter((item) => item.kind === 'robots' && item.checks.markers_match === false).length,
  total_route_errors: routes.reduce((sum, item) => sum + item.errors.length, 0),
};

const report = {
  schema_version: 'v1-production-confirmation-report-v1',
  release_id: contract.release_id,
  implementation_unit: contract.implementation_unit,
  release_commit: contract.release_commit,
  origin,
  checked_at: new Date().toISOString(),
  aggregate,
  routes,
};

fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

if (aggregate.total_route_errors > 0) process.exit(1);
