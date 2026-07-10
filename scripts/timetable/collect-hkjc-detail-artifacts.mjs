import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildHkjcDetailArtifacts,
  parseHkjcPublicSafeRacecardHtml,
} from './hkjc-detail-artifact-core.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const fixturePath = path.join(root, 'data/fixtures/calendar-hkjc-detail-artifact-core-fixtures-v1.json');
const timeoutMs = 15000;
const defaultDelayMs = 140;

function parseArgs(argv) {
  const options = {
    spec: null,
    outputDir: null,
    writeArtifacts: false,
    fixtureScenario: null,
    delayMs: defaultDelayMs,
  };
  for (const arg of argv) {
    if (arg.startsWith('--spec=')) options.spec = arg.slice('--spec='.length);
    else if (arg.startsWith('--output-dir=')) options.outputDir = arg.slice('--output-dir='.length);
    else if (arg === '--write-artifacts') options.writeArtifacts = true;
    else if (arg.startsWith('--fixture-scenario=')) options.fixtureScenario = arg.slice('--fixture-scenario='.length);
    else if (arg.startsWith('--delay-ms=')) options.delayMs = Number(arg.slice('--delay-ms='.length));
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!Number.isInteger(options.delayMs) || options.delayMs < 0 || options.delayMs > 5000) throw new Error('--delay-ms must be an integer from 0 through 5000');
  if (options.writeArtifacts && !options.outputDir) throw new Error('--write-artifacts requires --output-dir');
  if (!options.fixtureScenario && !options.spec) throw new Error('provide --spec for live collection or --fixture-scenario for fixture validation');
  if (options.fixtureScenario && options.spec) throw new Error('--spec and --fixture-scenario are mutually exclusive');
  return options;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function resolveInputPath(value) {
  return path.isAbsolute(value) ? value : path.resolve(root, value);
}

function assertExternalOutputDir(outputDir) {
  const absolute = path.resolve(outputDir);
  const relative = path.relative(root, absolute);
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
    throw new Error('HKJC detail artifact output directory must be outside the repository');
  }
  return absolute;
}

function racecourseCode(meeting) {
  if (meeting.racecourse_code === 'ST' || meeting.racecourse_code === 'HV') return meeting.racecourse_code;
  if (meeting.racecourse_id === 'sha-tin-racecourse') return 'ST';
  if (meeting.racecourse_id === 'happy-valley-racecourse') return 'HV';
  throw new Error(`unsupported HKJC racecourse: ${meeting.racecourse_id}`);
}

function racecardUrl(meeting, raceNumber) {
  const params = new URLSearchParams({
    racedate: meeting.date,
    Racecourse: racecourseCode(meeting),
    RaceNo: String(raceNumber),
  });
  return `https://racing.hkjc.com/en-us/local/information/racecard?${params}`;
}

function noPublicSafeFields(observation) {
  return !observation.post_time_local
    && !observation.race_name
    && observation.distance_m == null
    && !observation.surface
    && !observation.course_label;
}

function classifyResponseBody(body) {
  const text = String(body ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return { code: 'unexpected_response', message: 'HKJC racecard response body was empty.' };
  if (/access\s*denied|captcha|robot|bot|forbidden|temporarily unavailable|akamai|request blocked/i.test(text)) {
    return { code: 'source_unavailable', message: 'HKJC response appears to be an access-control or bot-protection page.' };
  }
  if (/No race card|not available|not yet available|will be available|Race Card is not available/i.test(text)) {
    return { code: 'other', message: 'HKJC racecard page indicates that the racecard is not available.' };
  }
  return null;
}

async function fetchPage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'user-agent': 'WhereHorsesRun/1.0 (+public timetable research; review-artifacts-only)',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
      },
    });
    const body = await response.text();
    const finalHost = new URL(response.url).hostname.toLowerCase();
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        final_url: response.url,
        error_code: response.status === 429 ? 'rate_limited' : response.status === 403 ? 'source_unavailable' : 'unexpected_response',
        error_message: `HKJC racecard source returned HTTP ${response.status}.`,
      };
    }
    if (finalHost !== 'racing.hkjc.com') {
      return {
        ok: false,
        status: response.status,
        final_url: response.url,
        error_code: 'unexpected_response',
        error_message: `HKJC racecard request redirected to unexpected host ${finalHost}.`,
      };
    }
    const classification = classifyResponseBody(body);
    if (classification) {
      return {
        ok: false,
        status: response.status,
        final_url: response.url,
        error_code: classification.code,
        error_message: classification.message,
      };
    }
    return { ok: true, status: response.status, final_url: response.url, body };
  } catch (error) {
    return {
      ok: false,
      status: null,
      final_url: url,
      error_code: 'source_unavailable',
      error_message: `HKJC racecard network error: ${String(error?.cause?.code ?? error?.message ?? error)}`,
    };
  } finally {
    clearTimeout(timer);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function collectMeeting(meeting, delayMs) {
  const maxRaceNumber = Number.isInteger(meeting.max_race_number) ? meeting.max_race_number : 14;
  if (maxRaceNumber < 1 || maxRaceNumber > 30) throw new Error(`invalid max_race_number for ${meeting.meeting_id}`);
  const pageResults = [];
  let meetingComplete = false;
  let observedRaceCount = 0;

  for (let raceNumber = 1; raceNumber <= maxRaceNumber; raceNumber += 1) {
    const requestedUrl = racecardUrl(meeting, raceNumber);
    const result = await fetchPage(requestedUrl);
    if (!result.ok) {
      pageResults.push({ race_number: raceNumber, requested_url: requestedUrl, ...result });
      break;
    }

    const observation = parseHkjcPublicSafeRacecardHtml(result.body, {
      raceNumber,
      sourceUrl: result.final_url,
    });
    if (noPublicSafeFields(observation)) {
      if (observedRaceCount > 0) meetingComplete = true;
      else {
        pageResults.push({
          race_number: raceNumber,
          requested_url: requestedUrl,
          ok: false,
          status: result.status,
          final_url: result.final_url,
          error_code: 'parser_failure',
          error_message: 'Race 1 returned no public-safe HKJC timetable fields; detail observation remains unresolved.',
        });
      }
      break;
    }

    pageResults.push({ race_number: raceNumber, requested_url: requestedUrl, ...result });
    observedRaceCount += 1;
    if (raceNumber < maxRaceNumber && delayMs > 0) await sleep(delayMs);
  }

  return {
    meeting: {
      meeting_id: meeting.meeting_id,
      racecourse_id: meeting.racecourse_id,
      date: meeting.date,
    },
    meeting_complete: meetingComplete,
    page_results: pageResults,
  };
}

function fixtureScenario(id) {
  const fixtures = readJson(fixturePath);
  const scenario = fixtures.scenarios.find((entry) => entry.id === id);
  if (!scenario) throw new Error(`fixture scenario not found: ${id}`);
  return {
    startDate: scenario.start_date,
    endDateExclusive: scenario.end_date_exclusive,
    generatedAt: scenario.generated_at,
    batchId: scenario.batch_id,
    campaignId: scenario.campaign_id,
    jobId: scenario.job_id,
    meetingInputs: scenario.meeting_inputs,
    runnerUsed: 'github_actions',
  };
}

async function liveScenario(spec, delayMs) {
  if (spec.schema_version !== 'calendar-hkjc-detail-live-spec-v1') throw new Error('live spec schema_version differs');
  if (!Array.isArray(spec.meetings) || spec.meetings.length === 0 || spec.meetings.length > 3) throw new Error('live spec must contain 1 through 3 bounded meetings');
  const meetingInputs = [];
  for (const meeting of spec.meetings) meetingInputs.push(await collectMeeting(meeting, delayMs));
  return {
    startDate: spec.start_date,
    endDateExclusive: spec.end_date_exclusive,
    generatedAt: spec.generated_at ?? new Date().toISOString(),
    batchId: spec.batch_id,
    campaignId: spec.campaign_id,
    jobId: spec.job_id,
    meetingInputs,
    runnerUsed: 'github_actions',
  };
}

function writeArtifacts(outputDir, artifacts) {
  fs.mkdirSync(outputDir, { recursive: true });
  const files = {
    'candidates.json': artifacts.candidate,
    'coverage-observation.json': artifacts.coverage,
    'result-manifest.json': artifacts.manifest,
    'collection-report.json': artifacts.report,
  };
  for (const [name, value] of Object.entries(files)) fs.writeFileSync(path.join(outputDir, name), `${JSON.stringify(value, null, 2)}\n`);
}

const options = parseArgs(process.argv.slice(2));
const externalOutputDir = options.writeArtifacts ? assertExternalOutputDir(options.outputDir) : null;
const scenario = options.fixtureScenario
  ? fixtureScenario(options.fixtureScenario)
  : await liveScenario(readJson(resolveInputPath(options.spec)), options.delayMs);
const artifacts = buildHkjcDetailArtifacts(scenario);

if (options.writeArtifacts) writeArtifacts(externalOutputDir, artifacts);

console.log(JSON.stringify({
  schema_version: 'calendar-hkjc-detail-collector-summary-v1',
  work_id: 'WHR-CAL-HONG-KONG-HKJC',
  implementation_unit: 'HKJC-PILOT-05',
  batch_id: artifacts.manifest.batch_id,
  records_discovered: artifacts.manifest.records_discovered,
  records_updated: artifacts.manifest.records_updated,
  rank_counts: artifacts.manifest.rank_counts,
  coverage_claim: artifacts.coverage.coverage_claim,
  unresolved_meeting_count: artifacts.coverage.unresolved_meeting_ids.length,
  source_error_count: artifacts.coverage.source_errors.length,
  write_artifacts: options.writeArtifacts,
  artifact_output: options.writeArtifacts ? path.resolve(options.outputDir) : null,
  raw_source_storage: 'disabled',
  canonical_write: 'disabled',
  public_write: 'disabled',
  publication_effect: 'none',
}, null, 2));
