import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const registryPath = path.join(root, 'data/source-registry/major-country-sources.json');
const outputPath = path.join(root, 'data/generated/timetable/live-source-snapshot.json');
const liveFetchEnabled = process.env.WHR_LIVE_FETCH === '1';
const maxSources = Number.parseInt(process.env.WHR_LIVE_FETCH_LIMIT ?? '24', 10);
const timeoutMs = Number.parseInt(process.env.WHR_LIVE_FETCH_TIMEOUT_MS ?? '12000', 10);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function hashText(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'WhereHorsesRunBot/0.1 (+https://github.com/badjoke-lab/where-horses-run)'
      }
    });
    const text = await response.text();
    return {
      fetch_status: response.ok ? 'ok' : 'http_error',
      http_status: response.status,
      final_url: response.url,
      content_type: response.headers.get('content-type') ?? null,
      content_length: text.length,
      content_sha256: hashText(text),
      sample_text: text.replace(/\s+/g, ' ').slice(0, 240)
    };
  } catch (error) {
    return {
      fetch_status: 'fetch_error',
      http_status: null,
      final_url: url,
      content_type: null,
      content_length: 0,
      content_sha256: null,
      sample_text: '',
      error_name: error.name,
      error_message: error.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

const registry = readJson(registryPath);
const activeSources = registry.sources
  .filter((source) => source.status !== 'legacy')
  .slice(0, Number.isFinite(maxSources) ? maxSources : 24);

const checkedAt = new Date().toISOString();
const rows = [];

for (const source of activeSources) {
  const base = {
    country_id: source.country_id,
    group_id: source.group_id,
    source_kind: source.source_kind,
    parser: source.parser,
    target_level: source.target_level,
    refresh_cadence: source.refresh_cadence,
    source_url: source.url,
    checked_at: checkedAt
  };

  if (!liveFetchEnabled) {
    rows.push({
      ...base,
      fetch_status: 'not_run',
      http_status: null,
      final_url: source.url,
      content_type: null,
      content_length: 0,
      content_sha256: null,
      sample_text: ''
    });
    continue;
  }

  rows.push({
    ...base,
    ...(await fetchWithTimeout(source.url))
  });
}

const output = {
  schema_version: 'live-source-snapshot-v0',
  generated_at: checkedAt,
  mode: liveFetchEnabled ? 'live_fetch' : 'dry_run_no_network',
  source_count: rows.length,
  timeout_ms: timeoutMs,
  records: rows
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`[live-source-snapshot] ${output.mode} records=${rows.length}`);
