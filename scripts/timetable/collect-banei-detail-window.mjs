import fs from 'node:fs';
import path from 'node:path';
import {
  baneiRaceListUrl,
  completeBaneiAPlusMeeting,
  continuousRaceNumbers,
  discoverBaneiRaceNumbers,
  parseBaneiDebaMetadata,
  parseBaneiRaceList,
} from './banei-detail-core.mjs';
import { validateCoverageObservation } from './coverage-observation-validation.mjs';

const root = process.cwd();
const timeoutMs = 25_000;

function parseArgs(argv) {
  const args = {
    input: null,
    outputRoot: null,
    batchId: null,
    startDate: null,
    endDateExclusive: null,
    meetingIds: [],
    checkedAt: null,
    delayMs: 140,
    dryRun: false,
  };
  for (const value of argv) {
    if (value === '--dry-run') args.dryRun = true;
    else if (value.startsWith('--input=')) args.input = value.slice('--input='.length);
    else if (value.startsWith('--output-root=')) args.outputRoot = value.slice('--output-root='.length);
    else if (value.startsWith('--batch-id=')) args.batchId = value.slice('--batch-id='.length);
    else if (value.startsWith('--start-date=')) args.startDate = value.slice('--start-date='.length);
    else if (value.startsWith('--end-date-exclusive=')) args.endDateExclusive = value.slice('--end-date-exclusive='.length);
    else if (value.startsWith('--meeting-id=')) args.meetingIds.push(value.slice('--meeting-id='.length));
    else if (value.startsWith('--meeting-ids=')) args.meetingIds.push(...value.slice('--meeting-ids='.length).split(',').filter(Boolean));
    else if (value.startsWith('--checked-at=')) args.checkedAt = value.slice('--checked-at='.length);
    else if (value.startsWith('--delay-ms=')) args.delayMs = Number(value.slice('--delay-ms='.length));
    else throw new Error(`Unknown argument: ${value}`);
  }
  if (!args.input) throw new Error('--input=<Banei schedule candidate file> is required');
  if (!args.outputRoot && !args.dryRun) throw new Error('--output-root=<directory> is required unless --dry-run is used');
  if (!args.batchId || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(args.batchId)) throw new Error('--batch-id must use lowercase kebab-case');
  args.meetingIds = [...new Set(args.meetingIds)].sort();
  const selectedMode = args.meetingIds.length > 0;
  const windowMode = args.startDate !== null || args.endDateExclusive !== null;
  if (selectedMode === windowMode) throw new Error('Provide either start/end window or selected meeting IDs');
  if (windowMode) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.startDate ?? '') || !/^\d{4}-\d{2}-\d{2}$/.test(args.endDateExclusive ?? '')) {
      throw new Error('Date-window arguments must use YYYY-MM-DD');
    }
    if (args.startDate >= args.endDateExclusive) throw new Error('end-date-exclusive must be after start-date');
  }
  if (args.checkedAt !== null && Number.isNaN(Date.parse(args.checkedAt))) throw new Error('--checked-at must be ISO date-time');
  if (!Number.isInteger(args.delayMs) || args.delayMs < 0 || args.delayMs > 5_000) throw new Error('--delay-ms must be integer 0..5000');
  return { ...args, selectedMode, windowMode };
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.resolve(root, relativePath), 'utf8'));
}

function writeJson(relativePath, value) {
  const absolute = path.resolve(root, relativePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`);
}

function scheduleMeetings(input) {
  if (input?.schema_version !== 'banei-full-month-candidate-set-v1'
    && input?.schema_version !== 'banei-control-plane-bridge-fixture-v1') {
    throw new Error(`unsupported Banei schedule input schema ${input?.schema_version}`);
  }
  if (!Array.isArray(input.meetings)) throw new Error('Banei schedule input meetings missing');
  return [...input.meetings].sort((left, right) => left.date.localeCompare(right.date));
}

function selectTargets(meetings, args) {
  if (args.windowMode) {
    return meetings.filter((meeting) => args.startDate <= meeting.date && meeting.date < args.endDateExclusive);
  }
  const byId = new Map(meetings.map((meeting) => [meeting.meeting_id, meeting]));
  return args.meetingIds.map((meetingId) => {
    const meeting = byId.get(meetingId);
    if (!meeting) throw new Error(`selected Banei meeting not found in schedule inventory: ${meetingId}`);
    return meeting;
  });
}

async function fetchPage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; review-controlled Banei detail collector)',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'ja,en-US;q=0.8,en;q=0.6',
      },
    });
    const body = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      final_url: response.url,
      body,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      final_url: url,
      body: '',
      error: String(error?.cause?.code ?? error?.message ?? error),
    };
  } finally {
    clearTimeout(timer);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function blocker(meeting, status, reason, listStatus = null) {
  return {
    meeting_id: meeting.meeting_id,
    date: meeting.date,
    status,
    reason,
    list_http_status: listStatus,
  };
}

async function collectMeeting(meeting, checkedAt, delayMs) {
  const listUrl = baneiRaceListUrl(meeting.date);
  const listResponse = await fetchPage(listUrl);
  if (!listResponse.ok) {
    return {
      candidate: null,
      blocker: blocker(meeting, listResponse.error ? 'source_unavailable' : 'http_error', listResponse.error ?? `HTTP ${listResponse.status}`, listResponse.status),
    };
  }
  const expected = discoverBaneiRaceNumbers(listResponse.body);
  const rows = parseBaneiRaceList(listResponse.body, meeting.date);
  if (!continuousRaceNumbers(expected)) {
    return { candidate: null, blocker: blocker(meeting, 'parser_failure', 'race_number_discovery_incomplete', listResponse.status) };
  }
  if (JSON.stringify(rows.map((row) => row.race_number)) !== JSON.stringify(expected)) {
    return { candidate: null, blocker: blocker(meeting, 'parser_failure', 'race_list_parser_incomplete', listResponse.status) };
  }

  const metadataByRace = new Map();
  for (const row of rows) {
    await sleep(delayMs);
    const detailResponse = await fetchPage(row.detail_url);
    if (!detailResponse.ok) {
      return {
        candidate: null,
        blocker: blocker(meeting, detailResponse.error ? 'source_unavailable' : 'http_error', `Race ${row.race_number}: ${detailResponse.error ?? `HTTP ${detailResponse.status}`}`, listResponse.status),
      };
    }
    const metadata = parseBaneiDebaMetadata(detailResponse.body);
    if (!metadata) {
      return { candidate: null, blocker: blocker(meeting, 'parser_failure', `Race ${row.race_number}: Banei DebaTable metadata parser incomplete`, listResponse.status) };
    }
    metadataByRace.set(row.race_number, metadata);
  }

  try {
    return {
      candidate: completeBaneiAPlusMeeting({
        date: meeting.date,
        list_url: listResponse.final_url,
        list_rows: rows,
        detail_metadata_by_race: metadataByRace,
        checked_at: checkedAt,
      }),
      blocker: null,
    };
  } catch (error) {
    return { candidate: null, blocker: blocker(meeting, 'parser_failure', String(error.message ?? error), listResponse.status) };
  }
}

function requestedScope(args) {
  if (args.windowMode) {
    return {
      kind: 'date_window',
      start_date: args.startDate,
      end_date_exclusive: args.endDateExclusive,
      timezone: 'Asia/Tokyo',
    };
  }
  return {
    kind: 'selected_meetings',
    meeting_ids: args.meetingIds,
    timezone: 'Asia/Tokyo',
  };
}

const args = parseArgs(process.argv.slice(2));
const checkedAt = args.checkedAt ?? new Date().toISOString();
const input = readJson(args.input);
const targets = selectTargets(scheduleMeetings(input), args);
if (targets.length === 0) throw new Error('Banei detail scope selected no meetings');

const candidates = [];
const blockers = [];
for (const meeting of targets) {
  console.log(`[banei-detail] ${meeting.meeting_id}`);
  const result = await collectMeeting(meeting, checkedAt, args.delayMs);
  if (result.candidate) candidates.push(result.candidate.records[0]);
  if (result.blocker) blockers.push(result.blocker);
}

const scope = requestedScope(args);
const coverage = {
  schema_version: 'calendar-coverage-observation-v1',
  run_id: args.batchId,
  system_id: 'japan-banei-system',
  source_id: 'nar-banei-race-list-deba-table',
  checked_at: checkedAt,
  requested_scope: scope,
  observed_scope: structuredClone(scope),
  collection_mode: args.windowMode ? 'date_window' : 'selected_meetings',
  records_discovered: targets.length,
  records_updated: candidates.length,
  unresolved_dates: [...new Set(blockers.map((item) => item.date))].sort(),
  unresolved_meeting_ids: blockers.map((item) => item.meeting_id).sort(),
  source_errors: blockers.map((item) => ({
    code: item.status === 'source_unavailable'
      ? 'source_unavailable'
      : item.status === 'parser_failure'
        ? 'parser_failure'
        : 'unexpected_response',
    scope_ref: item.meeting_id,
    message: `Banei detail collection ${item.status}: ${item.reason}`.slice(0, 500),
  })),
  coverage_claim: blockers.length === 0 ? 'source_window_complete' : 'partial',
  completion_audit_ref: null,
};
const coverageValidation = validateCoverageObservation(coverage);
if (!coverageValidation.valid) throw new Error(`Banei detail Coverage invalid: ${coverageValidation.errors.join('; ')}`);

const candidateEnvelope = {
  schema_version: 'timetable-candidate-v1',
  generated_at: checkedAt,
  adapter_id: 'banei-nar-race-list-detail-v1',
  country_id: 'japan',
  authority_id: 'banei-tokachi',
  source_id: 'nar-banei-race-list-deba-table',
  candidate_window: args.windowMode
    ? { start_date: args.startDate, end_date_exclusive: args.endDateExclusive, timezone: 'Asia/Tokyo' }
    : {
        start_date: [...targets].sort((a, b) => a.date.localeCompare(b.date))[0].date,
        end_date_exclusive: addDays([...targets].sort((a, b) => a.date.localeCompare(b.date)).at(-1).date, 1),
        timezone: 'Asia/Tokyo',
      },
  records: candidates.sort((left, right) => left.meeting_id.localeCompare(right.meeting_id)),
  review: {
    status: 'needs_review',
    reviewed_at: null,
    reviewer: null,
    summary: 'Banei detail-window candidate batch. Human review and Promotion Validation remain required.',
    promotion_target: null,
  },
};

const report = {
  schema_version: 'banei-detail-window-collection-report-v1',
  batch_id: args.batchId,
  generated_at: checkedAt,
  work_id: 'WHR-CAL-JAPAN-BANEI-A-PLUS',
  system_id: 'japan-banei-system',
  source_id: 'nar-banei-race-list-deba-table',
  adapter_id: 'banei-nar-race-list-detail-v1',
  collection_mode: coverage.collection_mode,
  requested_scope: scope,
  meetings_targeted: targets.length,
  complete_a_plus_candidates: candidates.length,
  blocked_meetings: blockers.length,
  blockers,
  coverage_claim: coverage.coverage_claim,
  candidate_mode: 'review_only',
  promotion_eligible_candidates: 0,
  publication_effect: 'none',
  canonical_write: 'disabled',
  public_write: 'disabled',
  raw_source_storage: 'disabled',
};

if (args.dryRun) {
  console.log(JSON.stringify({ report, coverage }, null, 2));
} else {
  writeJson(path.join(args.outputRoot, 'candidate.json'), candidateEnvelope);
  writeJson(path.join(args.outputRoot, 'coverage-observation.json'), coverage);
  writeJson(path.join(args.outputRoot, 'collection-report.json'), report);
}

console.log(JSON.stringify({
  batch_id: args.batchId,
  collection_mode: coverage.collection_mode,
  meetings_targeted: targets.length,
  complete_a_plus_candidates: candidates.length,
  blocked_meetings: blockers.length,
  coverage_claim: coverage.coverage_claim,
  publication_effect: 'none',
}, null, 2));

function addDays(date, days) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
