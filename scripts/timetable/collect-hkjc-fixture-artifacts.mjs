import fs from 'node:fs';
import path from 'node:path';
import {
  buildHkjcFixtureArtifacts,
  enumerateHkjcFixtureMonths,
} from './hkjc-fixture-artifact-bridge-core.mjs';
import { validateCoverageObservation } from './coverage-observation-validation.mjs';
import { validateCollectionResultManifestV1 } from './collection-result-manifest-validation.mjs';

const root = process.cwd();
const timeoutMs = 15000;

function parseArgs(argv) {
  const values = {};
  for (const arg of argv) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) values[match[1]] = match[2];
  }
  const required = ['from', 'to-exclusive', 'output-dir', 'batch-id', 'campaign-id', 'job-id'];
  for (const key of required) {
    if (!values[key]) throw new Error(`--${key}=... is required`);
  }
  return values;
}

function assertExternalOutputDirectory(outputDir) {
  const resolved = path.resolve(outputDir);
  const relative = path.relative(root, resolved);
  const insideRepository = relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
  if (insideRepository) {
    throw new Error(`HKJC live fixture artifacts must be written outside the repository: ${resolved}`);
  }
  return resolved;
}

async function fetchOfficialFixture(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'user-agent': 'WhereHorsesRun/1.0 (+public calendar research; artifact-only review path)',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
      },
    });
    const finalUrl = response.url;
    const finalHost = (() => {
      try { return new URL(finalUrl).hostname.toLowerCase(); } catch { return ''; }
    })();
    const body = await response.text();

    if (response.status === 429) {
      return { ok: false, status: response.status, final_url: finalUrl, error_code: 'rate_limited', error_message: 'HKJC official fixture source returned HTTP 429.' };
    }
    if (!response.ok) {
      return { ok: false, status: response.status, final_url: finalUrl, error_code: response.status === 401 || response.status === 403 ? 'source_unavailable' : 'unexpected_response', error_message: `HKJC official fixture source returned HTTP ${response.status}.` };
    }
    if (finalHost !== 'racing.hkjc.com') {
      return { ok: false, status: response.status, final_url: finalUrl, error_code: 'unexpected_response', error_message: `HKJC fixture request redirected to unexpected host ${finalHost || 'unknown'}.` };
    }
    if (/access\s*denied|captcha|robot|request blocked/i.test(body)) {
      return { ok: false, status: response.status, final_url: finalUrl, error_code: 'source_unavailable', error_message: 'HKJC fixture response appears to be an access-control page.' };
    }

    return { ok: true, status: response.status, final_url: finalUrl, body };
  } catch (error) {
    return {
      ok: false,
      status: null,
      final_url: url,
      error_code: 'source_unavailable',
      error_message: `Network error while requesting HKJC official fixture page: ${String(error?.cause?.code ?? error?.message ?? error).slice(0, 300)}`,
    };
  } finally {
    clearTimeout(timer);
  }
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

const args = parseArgs(process.argv.slice(2));
const outputDir = assertExternalOutputDirectory(args['output-dir']);
const generatedAt = new Date().toISOString();
const months = enumerateHkjcFixtureMonths(args.from, args['to-exclusive']);
const monthResults = [];

for (const month of months) {
  const result = await fetchOfficialFixture(month.url);
  monthResults.push({ year: month.year, month: month.month, ...result });
}

const artifacts = buildHkjcFixtureArtifacts({
  startDate: args.from,
  endDateExclusive: args['to-exclusive'],
  generatedAt,
  batchId: args['batch-id'],
  campaignId: args['campaign-id'],
  jobId: args['job-id'],
  monthResults,
  runnerUsed: 'github_actions',
});

const coverageValidation = validateCoverageObservation(artifacts.coverage);
if (!coverageValidation.valid) throw new Error(`HKJC live fixture Coverage invalid: ${coverageValidation.errors.join('; ')}`);
const manifestErrors = validateCollectionResultManifestV1(artifacts.manifest);
if (manifestErrors.length) throw new Error(`HKJC live fixture Manifest invalid: ${manifestErrors.join('; ')}`);

fs.mkdirSync(outputDir, { recursive: true });
for (const [filename, value] of [
  ['candidates.json', artifacts.candidate],
  ['coverage-observation.json', artifacts.coverage],
  ['result-manifest.json', artifacts.manifest],
  ['collection-report.json', artifacts.report],
]) {
  writeJson(path.join(outputDir, filename), value);
}

console.log(JSON.stringify({
  work_id: 'WHR-CAL-HONG-KONG-HKJC',
  implementation_unit: 'HKJC-PILOT-02',
  batch_id: args['batch-id'],
  requested_window: { start_date: args.from, end_date_exclusive: args['to-exclusive'] },
  records_discovered: artifacts.candidate.records.length,
  coverage_claim: artifacts.coverage.coverage_claim,
  source_error_count: artifacts.coverage.source_errors.length,
  output_dir: outputDir,
  repository_write: false,
  publication_effect: 'none',
}, null, 2));
