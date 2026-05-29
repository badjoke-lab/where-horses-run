import { readFileSync } from 'node:fs';
import { probeSourceUrl } from './lib/live-fetch-probe.mjs';

const errors = [];

function fail(message) {
  errors.push(message);
}

function requireEqual(actual, expected, label) {
  if (actual !== expected) {
    fail(`${label}: expected ${expected}, got ${actual}`);
  }
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(`${label}: expected non-empty string`);
  }
}

let bodyCancelled = false;
let capturedInit = null;

const mockHeaders = {
  get(name) {
    const values = {
      'content-type': 'text/html; charset=utf-8',
      'content-length': '12345'
    };
    return values[String(name).toLowerCase()] ?? '';
  }
};

const mockFetch = async (url, init) => {
  capturedInit = { url, init };
  return {
    ok: true,
    status: 200,
    url: 'https://example.test/final',
    redirected: true,
    headers: mockHeaders,
    body: {
      cancel() {
        bodyCancelled = true;
        return Promise.resolve();
      }
    }
  };
};

const source = {
  id: 'test-source',
  country_id: 'test-country',
  url: 'https://example.test/start'
};

const result = await probeSourceUrl(source, {
  fetchImpl: mockFetch,
  startedAt: '2026-05-29T00:00:00Z',
  timeoutMs: 1000
});

requireEqual(capturedInit?.init?.method, 'GET', 'probe method');
requireEqual(result.live_network_enabled, true, 'live_network_enabled');
requireEqual(result.probe_only, true, 'probe_only');
requireEqual(result.raw_content_saved, false, 'raw_content_saved');
requireEqual(result.body_read, false, 'body_read');
requireEqual(result.body_bytes_saved, 0, 'body_bytes_saved');
requireEqual(result.generated_files_written, false, 'generated_files_written');
requireEqual(result.status, 'reachable', 'status');
requireEqual(result.http_status, 200, 'http_status');
requireString(result.content_type, 'content_type');

if (!bodyCancelled) {
  fail('response body should be cancelled without reading or saving raw content');
}

const failed = await probeSourceUrl(source, {
  fetchImpl: async () => {
    throw new Error('simulated network failure');
  },
  startedAt: '2026-05-29T00:00:00Z',
  timeoutMs: 1000
});

requireEqual(failed.status, 'network_error', 'network_error status');
requireEqual(failed.raw_content_saved, false, 'network_error raw_content_saved');
requireEqual(failed.generated_files_written, false, 'network_error generated_files_written');

const libText = readFileSync('scripts/lib/live-fetch-probe.mjs', 'utf8');
for (const token of ['.text(', '.json(', '.arrayBuffer(', '.blob(', 'writeFile(', 'writeFileSync(']) {
  if (libText.includes(token)) {
    fail(`live fetch probe lib must not contain ${token}`);
  }
}

if (errors.length) {
  console.error('Live fetch probe contract check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Live fetch probe contract check passed.');
