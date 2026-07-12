import fs from 'node:fs';
import path from 'node:path';
import {
  classifyUaeEraDetailMeeting,
  discoverUaeEraRaceNumbers,
  parseUaeEraPublicSafeRacecardHtml,
} from './uae-era-detail-artifact-core.mjs';
import { buildUaeEraDetailActionsArtifactsV1 } from './uae-era-detail-actions-executor-core.mjs';

const root = process.cwd();
const args = new Map(process.argv.slice(2).map((arg) => {
  const index = arg.indexOf('=');
  return index === -1 ? [arg, true] : [arg.slice(0, index), arg.slice(index + 1)];
}));
const executionPath = args.get('--execution');
if (!executionPath) throw new Error('--execution=<path> is required');
const fixturePath = args.get('--fixture');
const checkOnly = args.has('--check-only');
const execution = JSON.parse(fs.readFileSync(path.resolve(root, executionPath), 'utf8'));

function parseMeetingId(meetingId) {
  const match = String(meetingId ?? '').match(/^uae-(.+)-(\d{4}-\d{2}-\d{2})$/);
  if (!match) throw new Error(`invalid UAE meeting ID ${meetingId}`);
  return { meeting_id: meetingId, racecourse_id: match[1], date: match[2] };
}

async function fetchOfficial(url) {
  const response = await fetch(url, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'WhereHorsesRun/1.0 public timetable research (review-only)',
    },
    redirect: 'follow',
  });
  if (!response.ok) {
    const error = new Error(`ERA detail request failed: ${response.status}`);
    error.code = response.status === 429 ? 'rate_limited' : 'source_unavailable';
    throw error;
  }
  const finalUrl = new URL(response.url);
  if (finalUrl.protocol !== 'https:' || finalUrl.hostname.toLowerCase() !== 'emiratesracing.com') {
    const error = new Error(`ERA detail request left the official hostname: ${response.url}`);
    error.code = 'unexpected_response';
    throw error;
  }
  return await response.text();
}

async function collectMeeting(meetingId) {
  const target = parseMeetingId(meetingId);
  try {
    const firstUrl = `https://emiratesracing.com/racecard/${target.date}/1/declarations`;
    const firstHtml = await fetchOfficial(firstUrl);
    const raceNumbers = discoverUaeEraRaceNumbers(firstHtml, target.date);
    if (raceNumbers.length === 0 || raceNumbers[0] !== 1 || !raceNumbers.every((value, index) => value === index + 1)) {
      const error = new Error('Official ERA race navigation is not source-visible as continuous Race 1-N.');
      error.code = 'parser_failure';
      throw error;
    }
    const observations = [];
    for (const raceNumber of raceNumbers) {
      const sourceUrl = `https://emiratesracing.com/racecard/${target.date}/${raceNumber}/declarations`;
      const html = raceNumber === 1 ? firstHtml : await fetchOfficial(sourceUrl);
      const observation = parseUaeEraPublicSafeRacecardHtml(html, { sourceUrl });
      if (observation.racecourse_id !== target.racecourse_id) {
        const error = new Error(`ERA racecourse identity differs: ${observation.racecourse_id} != ${target.racecourse_id}`);
        error.code = 'parser_failure';
        throw error;
      }
      observations.push(observation);
    }
    const classification = classifyUaeEraDetailMeeting({ observations, meeting_complete: true });
    return { meeting_id: meetingId, classification, source_errors: [] };
  } catch (error) {
    return {
      meeting_id: meetingId,
      classification: {
        rank: 'C',
        first_race_time_local: null,
        last_race_time_local: null,
        timetable_rows: [],
      },
      source_errors: [{
        code: ['source_unavailable', 'parser_failure', 'rate_limited', 'unexpected_response'].includes(error?.code)
          ? error.code
          : 'other',
        message: String(error?.message ?? error).slice(0, 500),
      }],
    };
  }
}

function writeJson(relativePath, value) {
  const absolute = path.resolve(root, relativePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`);
}

let meetingResults;
let checkedAt;
if (fixturePath) {
  const fixture = JSON.parse(fs.readFileSync(path.resolve(root, fixturePath), 'utf8'));
  if (fixture.schema_version !== 'calendar-uae-era-detail-actions-fixture-v1') throw new Error('UAE detail Actions fixture schema mismatch');
  checkedAt = fixture.checked_at;
  meetingResults = fixture.meeting_results;
} else {
  checkedAt = new Date().toISOString();
  meetingResults = [];
  for (const meetingId of execution.requested_scope.meeting_ids) meetingResults.push(await collectMeeting(meetingId));
}

const artifacts = buildUaeEraDetailActionsArtifactsV1({
  execution,
  meeting_results: meetingResults,
  checked_at: checkedAt,
});
const outputRoot = `data/generated/timetable/actions-multi-job/${execution.batch_id}`;
if (!checkOnly) {
  writeJson(`${outputRoot}/candidates.json`, artifacts.candidate);
  writeJson(`${outputRoot}/coverage-observation.json`, artifacts.coverage_observation);
  writeJson(`${outputRoot}/result-manifest.json`, artifacts.result_manifest);
  writeJson(`${outputRoot}/review-queue.json`, artifacts.review_queue);
  writeJson(`${outputRoot}/collection-report.json`, artifacts.collection_report);
}

console.log(JSON.stringify({
  schema_version: 'calendar-uae-era-detail-actions-runner-summary-v1',
  work_id: 'WHR-CAL-UAE-ERA-DETAIL-RECOVERY',
  implementation_unit: 'UAE-DETAIL-RECOVERY-02',
  batch_id: execution.batch_id,
  collection_mode: execution.collection_mode,
  records_discovered: artifacts.result_manifest.records_discovered,
  records_updated: artifacts.result_manifest.records_updated,
  rank_counts: artifacts.result_manifest.rank_counts,
  coverage_claim: artifacts.result_manifest.coverage_claim,
  unresolved_meeting_count: artifacts.result_manifest.unresolved_meeting_ids.length,
  source_error_count: artifacts.result_manifest.source_errors.length,
  review_state: artifacts.review_queue.entries[0]?.review_state ?? null,
  raw_html_stored: false,
  canonical_write: false,
  public_write: false,
  publication_effect: 'none',
  check_only: checkOnly,
}));
