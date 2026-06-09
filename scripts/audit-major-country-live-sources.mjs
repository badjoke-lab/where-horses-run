import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourcePath = path.join(root, 'data/static/major-country-acquisition-source-groups.json');
const outputPath = path.join(root, 'data/generated/timetable/major-country-live-source-audit.json');
const sourceFields = [
  'annual_fixture_sources',
  'rolling_fixture_sources',
  'meeting_sources',
  'first_race_time_sources',
  'per_race_time_sources',
];

function parseArgs(argv) {
  const args = {};
  for (const arg of argv) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
  }
  return {
    country: args.country ?? null,
    group: args.group ?? null,
    timeoutMs: Number(args['timeout-ms'] ?? 20000),
    maxBytes: Number(args['max-bytes'] ?? 2_000_000),
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function detectBlockPage(sampleText) {
  const checks = [
    ['captcha', /\b(?:captcha|recaptcha|hcaptcha)\b/i],
    ['access_denied', /\baccess denied\b/i],
    ['request_blocked', /\brequest blocked\b/i],
    ['verify_human', /\bverify (?:that )?you are human\b/i],
    ['checking_browser', /\bchecking your browser\b/i],
    ['cloudflare_challenge', /\bcloudflare ray id\b|cf-chl-|challenge-platform/i],
    ['akamai_block', /\bakamai reference\b|reference #\d+\.[a-f0-9]+/i],
    ['security_check', /\bsecurity check required\b|\btemporarily blocked\b/i],
  ];

  for (const [reason, pattern] of checks) {
    if (pattern.test(sampleText)) return reason;
  }
  return null;
}

function classifyResponse({ httpStatus, sampleText, networkError }) {
  if (networkError) return { status: 'network_error', reason: networkError };
  if ([401, 403, 429].includes(httpStatus)) {
    return { status: 'blocked_or_rate_limited', reason: `http_${httpStatus}` };
  }
  if (httpStatus == null) return { status: 'unknown_failure', reason: 'missing_http_status' };
  if (httpStatus < 200 || httpStatus >= 400) {
    return { status: 'http_error', reason: `http_${httpStatus}` };
  }

  const blockReason = detectBlockPage(sampleText);
  if (blockReason) return { status: 'blocked_or_bot_page', reason: blockReason };
  return { status: 'fetchable', reason: 'http_success_no_block_marker' };
}

async function fetchProbe(url, timeoutMs, maxBytes) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response;

  try {
    response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRunSourceAudit/0.1)',
        accept: 'text/html,application/xhtml+xml,application/json,application/pdf;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
      },
    });

    const reader = response.body?.getReader();
    const chunks = [];
    let observedBytes = 0;
    let sampleBytes = 0;
    const sampleLimit = 131072;
    let truncated = false;

    if (reader) {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        observedBytes += value.byteLength;
        if (sampleBytes < sampleLimit) {
          const remaining = sampleLimit - sampleBytes;
          const slice = value.byteLength <= remaining ? value : value.slice(0, remaining);
          chunks.push(slice);
          sampleBytes += slice.byteLength;
        }
        if (observedBytes >= maxBytes) {
          truncated = true;
          await reader.cancel();
          break;
        }
      }
    }

    const sample = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString('utf8');
    const classification = classifyResponse({
      httpStatus: response.status,
      sampleText: sample,
      networkError: null,
    });

    return {
      status: classification.status,
      status_reason: classification.reason,
      http_status: response.status,
      final_url: response.url,
      content_type: response.headers.get('content-type'),
      content_length_header: response.headers.get('content-length'),
      body_size_observed: observedBytes,
      truncated,
      redirect_changed_url: response.url !== url,
      network_error: null,
      network_error_detail: null,
    };
  } catch (error) {
    const detail = String(error?.cause?.message ?? error?.message ?? error);
    const code = String(error?.cause?.code ?? error?.name ?? 'unknown');
    const classification = classifyResponse({ httpStatus: null, sampleText: '', networkError: code });
    return {
      status: classification.status,
      status_reason: classification.reason,
      http_status: null,
      final_url: url,
      content_type: null,
      content_length_header: null,
      body_size_observed: 0,
      truncated: false,
      redirect_changed_url: false,
      network_error: code,
      network_error_detail: detail,
    };
  } finally {
    clearTimeout(timer);
  }
}

function collectSources(dataset, filters) {
  const entries = [];
  for (const country of dataset.countries ?? []) {
    if (filters.country && country.country_id !== filters.country) continue;
    for (const group of country.acquisition_groups ?? []) {
      if (filters.group && group.group_id !== filters.group) continue;
      for (const field of sourceFields) {
        for (const source of group[field] ?? []) {
          entries.push({
            country_id: country.country_id,
            group_id: group.group_id,
            update_model: country.update_model,
            parser_target: group.parser_target,
            source_field: field,
            source_id: source.source_id,
            label: source.label,
            role: source.role,
            official_url: source.url ?? null,
          });
        }
      }
    }
  }
  return entries;
}

function groupByUrl(entries) {
  const urlMap = new Map();
  const withoutUrl = [];

  for (const entry of entries) {
    if (!entry.official_url) {
      withoutUrl.push({ ...entry, status: 'no_concrete_url' });
      continue;
    }
    const existing = urlMap.get(entry.official_url) ?? [];
    existing.push(entry);
    urlMap.set(entry.official_url, existing);
  }

  return { urlMap, withoutUrl };
}

function summarize(results) {
  const byStatus = {};
  const byCountry = {};

  for (const result of results) {
    byStatus[result.status] = (byStatus[result.status] ?? 0) + 1;

    const refsByCountry = new Map();
    for (const ref of result.references ?? []) {
      const refs = refsByCountry.get(ref.country_id) ?? [];
      refs.push(ref);
      refsByCountry.set(ref.country_id, refs);
    }

    for (const [countryId, refs] of refsByCountry.entries()) {
      byCountry[countryId] ??= {
        unique_urls: 0,
        source_references: 0,
        statuses: {},
      };
      byCountry[countryId].unique_urls += 1;
      byCountry[countryId].source_references += refs.length;
      byCountry[countryId].statuses[result.status] = (byCountry[countryId].statuses[result.status] ?? 0) + 1;
    }
  }

  return { by_status: byStatus, by_country: byCountry };
}

const args = parseArgs(process.argv.slice(2));
if (!Number.isFinite(args.timeoutMs) || args.timeoutMs < 1000) throw new Error('--timeout-ms must be at least 1000.');
if (!Number.isFinite(args.maxBytes) || args.maxBytes < 1024) throw new Error('--max-bytes must be at least 1024.');

const dataset = readJson(sourcePath);
const sourceEntries = collectSources(dataset, args);
const { urlMap, withoutUrl } = groupByUrl(sourceEntries);
const results = [];

for (const [url, references] of urlMap.entries()) {
  console.log(`[live-source-audit] ${url}`);
  const probe = await fetchProbe(url, args.timeoutMs, args.maxBytes);
  results.push({
    official_url: url,
    ...probe,
    references,
  });
}

for (const entry of withoutUrl) {
  results.push({
    official_url: null,
    status: 'no_concrete_url',
    status_reason: 'source_entry_has_no_url',
    http_status: null,
    final_url: null,
    content_type: null,
    content_length_header: null,
    body_size_observed: 0,
    truncated: false,
    redirect_changed_url: false,
    network_error: null,
    network_error_detail: null,
    references: [entry],
  });
}

results.sort((left, right) => `${left.references[0]?.country_id}:${left.official_url ?? ''}`.localeCompare(`${right.references[0]?.country_id}:${right.official_url ?? ''}`));

const output = {
  schema_version: 'major-country-live-source-audit-v0',
  generated_at: new Date().toISOString(),
  source_inventory: 'data/static/major-country-acquisition-source-groups.json',
  filters: {
    country: args.country,
    group: args.group,
  },
  policy: {
    raw_response_body_stored: false,
    sample_text_stored: false,
    max_bytes_per_url: args.maxBytes,
    timeout_ms: args.timeoutMs,
  },
  source_reference_count: sourceEntries.length,
  unique_url_count: urlMap.size,
  no_concrete_url_count: withoutUrl.length,
  summary: summarize(results),
  results,
};

writeJson(outputPath, output);
console.log(`[live-source-audit] wrote ${path.relative(root, outputPath)} urls=${urlMap.size} no_url=${withoutUrl.length}`);
