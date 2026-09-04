import fs from 'node:fs';
import path from 'node:path';
import { runJapanZeroBased30d } from './japan-zero-based-30d-core.mjs';
import { japanOfficial30dAdapters } from './japan-official-30d-adapters.mjs';
import { discoverJraOfficial30dWithCompleteness } from './jra-official-30d-discovery.mjs';
import { discoverBaneiOfficial30d } from './banei-official-30d-discovery.mjs';
import { discoverNankankeibaOfficial30d } from './nankankeiba-official-30d-discovery.mjs';
import { discoverIwatekeibaOfficial30d } from './iwatekeiba-official-30d-discovery.mjs';
import { discoverHyogoOfficial30d } from './hyogo-official-30d-discovery.mjs';
import { discoverTokaiOfficial30d, TOKAI_OFFICIAL_PDF_URL } from './tokai-official-30d-discovery.mjs';
import { withSagaOfficialStartFallback } from './saga-official-start-fallback.mjs';
import {
  assessMotherSetCompleteness,
  canReconcileMeetingAbsence,
  mergeOfficialPositiveEvidence,
  REQUIRED_JAPAN_MOTHER_SET_SOURCES,
  selectPublicAbsenceReconciliation,
} from './japan-mother-set-safety.mjs';

function japanToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function normalizeNarMeetingId(meeting) {
  if (meeting.racecourse_id !== 'mombetsu-racecourse' && !meeting.meeting_id?.startsWith('nar-mombetsu-racecourse-')) return meeting;
  return {
    ...meeting,
    meeting_id: meeting.meeting_id.replace('nar-mombetsu-racecourse-', 'nar-monbetsu-racecourse-'),
    racecourse_id: 'monbetsu-racecourse',
  };
}

function isInvalidMombetsuAlias(row) {
  return row?.racecourse_id === 'mombetsu-racecourse' || row?.meeting_id?.startsWith('nar-mombetsu-racecourse-');
}

function dateRange(start, days) {
  const cursor = new Date(`${start}T00:00:00Z`);
  return Array.from({ length: days }, () => {
    const value = cursor.toISOString().slice(0, 10);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    return value;
  });
}

function exclusiveEnd(dates) {
  const cursor = new Date(`${dates.at(-1)}T00:00:00Z`);
  cursor.setUTCDate(cursor.getUTCDate() + 1);
  return cursor.toISOString().slice(0, 10);
}

function boundedDiscovery(discover, allowedDates) {
  const dates = [...allowedDates].sort();
  const boundedContext = {
    start: dates[0],
    end_exclusive: exclusiveEnd(dates),
    dates,
  };
  return async (context) => (await discover({ ...context, ...boundedContext })).filter((row) => allowedDates.has(row.date));
}

const args = new Map(process.argv.slice(2).map((value) => value.split(/=(.*)/s).slice(0, 2)));
const executionDate = args.get('--execution-date') ?? japanToday();
const scope = args.get('--scope') ?? 'full';
if (!['full', 'near'].includes(scope)) throw new Error(`unsupported Japan refresh scope: ${scope}`);
const requestedDays = scope === 'near' ? 3 : 30;
const selectedDateList = dateRange(executionDate, requestedDays);
const selectedDates = new Set(selectedDateList);
const selectedRange = {
  start: selectedDateList[0],
  end_exclusive: exclusiveEnd(selectedDateList),
  dates: selectedDateList,
};
const output = args.get('--output') ?? `data/generated/timetable/japan-zero-based-${scope === 'near' ? '3d' : '30d'}-reconciliation.json`;
const canonicalPath = 'data/generated/timetable/canonical/meetings.json';
const detailsPath = 'data/generated/timetable/canonical/meeting-details.json';
const publicPath = 'data/generated/timetable/public/meeting-list.json';
const publicDetailsPath = 'data/generated/timetable/public/meeting-details.json';
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const narStandardAdapter = japanOfficial30dAdapters['nar-standard'];
const sourceCompleteness = new Map();
const sourceObservations = new Map();

function recordSourceObservations(meetings, sourceId) {
  for (const meeting of meetings) {
    const observations = sourceObservations.get(meeting.meeting_id) ?? [];
    const observation = {
      source_id: meeting.source_id ?? sourceId,
      role: 'mother_set',
      source_label: meeting.source_label ?? null,
      official_source_url: meeting.official_source_url ?? null,
    };
    const key = `${observation.source_id}|${observation.official_source_url ?? ''}`;
    if (!observations.some((row) => `${row.source_id}|${row.official_source_url ?? ''}` === key)) observations.push(observation);
    sourceObservations.set(meeting.meeting_id, observations);
  }
}

function sourceState({ sourceId, sourceUrl, startedAt, endedAt, status, count = 0, failures = [] }) {
  return {
    source_id: sourceId,
    role: 'mother_set',
    requested_window: selectedRange,
    fetch_started_at: startedAt,
    fetch_ended_at: endedAt,
    result: status,
    completeness: status,
    parsed_meeting_count: count,
    parsed_detail_count: 0,
    pending_count: 0,
    failure_count: failures.length,
    source_visible_horizon: status === 'complete' ? selectedDateList.at(-1) : null,
    source_urls: sourceUrl ? [sourceUrl] : [],
    failures,
  };
}

async function guardedDiscovery({ sourceId, sourceUrl, discover, context }) {
  const startedAt = new Date().toISOString();
  try {
    const meetings = await discover(context);
    if (!Array.isArray(meetings)) throw new Error('discovery did not return an array');
    recordSourceObservations(meetings, sourceId);
    sourceCompleteness.set(sourceId, sourceState({
      sourceId,
      sourceUrl,
      startedAt,
      endedAt: new Date().toISOString(),
      status: 'complete',
      count: meetings.length,
    }));
    return meetings;
  } catch (error) {
    sourceCompleteness.set(sourceId, sourceState({
      sourceId,
      sourceUrl,
      startedAt,
      endedAt: new Date().toISOString(),
      status: 'failed',
      failures: [{ source_url: sourceUrl, reason: String(error?.message ?? error) }],
    }));
    return [];
  }
}

async function discoverJraOfficialWithCompleteness(context) {
  const startedAt = new Date().toISOString();
  try {
    const result = await discoverJraOfficial30dWithCompleteness(context);
    if (!Array.isArray(result?.meetings) || !result?.completeness) throw new Error('JRA discovery completeness result is invalid');
    recordSourceObservations(result.meetings, 'jra-racing-calendar-programme');
    sourceCompleteness.set('jra-racing-calendar-programme', {
      ...result.completeness,
      requested_window: selectedRange,
      fetch_started_at: startedAt,
      fetch_ended_at: new Date().toISOString(),
    });
    return result.meetings;
  } catch (error) {
    sourceCompleteness.set('jra-racing-calendar-programme', sourceState({
      sourceId: 'jra-racing-calendar-programme',
      sourceUrl: 'https://www.jra.go.jp/keiba/calendar/',
      startedAt,
      endedAt: new Date().toISOString(),
      status: 'failed',
      failures: [{ source_url: 'https://www.jra.go.jp/keiba/calendar/', reason: String(error?.message ?? error) }],
    }));
    return [];
  }
}

async function discoverNarOfficialUnion(context) {
  const narMeetings = await guardedDiscovery({
    sourceId: 'nar-monthly-convene-info',
    sourceUrl: 'https://www.keiba.go.jp/KeibaWeb/MonthlyConveneInfo/MonthlyConveneInfoTop',
    discover: async (value) => (await narStandardAdapter.discover(value)).map(normalizeNarMeetingId),
    context,
  });

  let southKanto = { meetings: [], completeness: null };
  const southKantoStartedAt = new Date().toISOString();
  try {
    southKanto = await discoverNankankeibaOfficial30d(context);
    sourceCompleteness.set('nankankeiba-south-kanto-calendar', {
      ...southKanto.completeness,
      requested_window: selectedRange,
      fetch_started_at: southKantoStartedAt,
      fetch_ended_at: new Date().toISOString(),
    });
    recordSourceObservations(southKanto.meetings, 'nankankeiba-south-kanto-calendar');
  } catch (error) {
    sourceCompleteness.set('nankankeiba-south-kanto-calendar', sourceState({
      sourceId: 'nankankeiba-south-kanto-calendar',
      sourceUrl: 'https://www.nankankeiba.com/calendar/',
      startedAt: southKantoStartedAt,
      endedAt: new Date().toISOString(),
      status: 'failed',
      failures: [{ source_url: 'https://www.nankankeiba.com/calendar/', reason: String(error?.message ?? error) }],
    }));
  }

  let iwate = { meetings: [], completeness: null };
  const iwateStartedAt = new Date().toISOString();
  try {
    iwate = await discoverIwatekeibaOfficial30d(context);
    sourceCompleteness.set('iwatekeiba-official-calendar', {
      ...iwate.completeness,
      requested_window: selectedRange,
      fetch_started_at: iwateStartedAt,
      fetch_ended_at: new Date().toISOString(),
    });
    recordSourceObservations(iwate.meetings, 'iwatekeiba-official-calendar');
  } catch (error) {
    sourceCompleteness.set('iwatekeiba-official-calendar', sourceState({
      sourceId: 'iwatekeiba-official-calendar',
      sourceUrl: 'https://www.iwatekeiba.or.jp/calendar/',
      startedAt: iwateStartedAt,
      endedAt: new Date().toISOString(),
      status: 'failed',
      failures: [{ source_url: 'https://www.iwatekeiba.or.jp/calendar/', reason: String(error?.message ?? error) }],
    }));
  }

  let hyogo = { meetings: [], completeness: null };
  const hyogoStartedAt = new Date().toISOString();
  try {
    hyogo = await discoverHyogoOfficial30d(context);
    sourceCompleteness.set('hyogo-urban-keiba-official-calendar', {
      ...hyogo.completeness,
      requested_window: selectedRange,
      fetch_started_at: hyogoStartedAt,
      fetch_ended_at: new Date().toISOString(),
    });
    recordSourceObservations(hyogo.meetings, 'hyogo-urban-keiba-official-calendar');
  } catch (error) {
    sourceCompleteness.set('hyogo-urban-keiba-official-calendar', sourceState({
      sourceId: 'hyogo-urban-keiba-official-calendar',
      sourceUrl: 'https://www.sonoda-himeji.jp/schedule/',
      startedAt: hyogoStartedAt,
      endedAt: new Date().toISOString(),
      status: 'failed',
      failures: [{ source_url: 'https://www.sonoda-himeji.jp/schedule/', reason: String(error?.message ?? error) }],
    }));
  }

  let tokai = { meetings: [], completeness: null };
  const tokaiStartedAt = new Date().toISOString();
  try {
    tokai = await discoverTokaiOfficial30d(context);
    sourceCompleteness.set('tokai-region-joint-official-calendar', {
      ...tokai.completeness,
      requested_window: selectedRange,
      fetch_started_at: tokaiStartedAt,
      fetch_ended_at: new Date().toISOString(),
    });
    recordSourceObservations(tokai.meetings, 'tokai-region-joint-official-calendar');
  } catch (error) {
    sourceCompleteness.set('tokai-region-joint-official-calendar', sourceState({
      sourceId: 'tokai-region-joint-official-calendar',
      sourceUrl: TOKAI_OFFICIAL_PDF_URL,
      startedAt: tokaiStartedAt,
      endedAt: new Date().toISOString(),
      status: 'failed',
      failures: [{ source_url: TOKAI_OFFICIAL_PDF_URL, reason: String(error?.message ?? error) }],
    }));
  }

  return mergeOfficialPositiveEvidence(
    narMeetings,
    southKanto.meetings ?? [],
    iwate.meetings ?? [],
    hyogo.meetings ?? [],
    tokai.meetings ?? [],
  );
}

const baseAdapters = {
  ...japanOfficial30dAdapters,
  jra: {
    ...japanOfficial30dAdapters.jra,
    discover: discoverJraOfficialWithCompleteness,
  },
  'nar-standard': {
    ...narStandardAdapter,
    discover: discoverNarOfficialUnion,
    inspect: withSagaOfficialStartFallback(narStandardAdapter.inspect),
  },
  banei: {
    ...japanOfficial30dAdapters.banei,
    discover: (context) => guardedDiscovery({
      sourceId: 'banei-official-schedule',
      sourceUrl: 'https://www.banei-keiba.or.jp/race_schedule.php',
      discover: discoverBaneiOfficial30d,
      context,
    }),
  },
};
const adapters = scope === 'full'
  ? baseAdapters
  : Object.fromEntries(Object.entries(baseAdapters).map(([group, adapter]) => [group, {
      ...adapter,
      discover: boundedDiscovery(adapter.discover, selectedDates),
    }]));

const result = await runJapanZeroBased30d({
  executionDate,
  adapters,
  loadExisting: () => ({
    canonical: read(canonicalPath).meetings,
    details: read(detailsPath).details,
    public: read(publicPath).meetings,
    publicDetails: read(publicDetailsPath).details,
  }),
});

const completenessRows = REQUIRED_JAPAN_MOTHER_SET_SOURCES.map((sourceId) => sourceCompleteness.get(sourceId) ?? sourceState({
  sourceId,
  sourceUrl: null,
  startedAt: result.checked_at,
  endedAt: result.checked_at,
  status: 'failed',
  failures: [{ source_url: null, reason: 'missing_source_completeness_record' }],
}));
const motherSetAssessment = assessMotherSetCompleteness(completenessRows);
const motherSetComplete = motherSetAssessment.complete;
const runComplete = result.complete === true && motherSetComplete;
const officialIds = new Set(result.reconciliations.map((row) => row.meeting_id));
const rangeDates = scope === 'near' ? selectedDates : new Set(result.range.dates);
const isAbsentPublicMeeting = (row) => row?.country_id === 'japan'
  && rangeDates.has(row.date)
  && !officialIds.has(row.meeting_id);
const absenceSelection = selectPublicAbsenceReconciliation({
  publicMeetings: result.public,
  officialMeetingIds: officialIds,
  rangeDates,
  sourceCompletenessRows: completenessRows,
});
const removedStalePublic = absenceSelection.removed_meeting_ids;
const preservedStalePublic = absenceSelection.preserved_meeting_ids;
const removedStaleSet = new Set(removedStalePublic);
const absenceFamilyStatus = {
  jra: assessMotherSetCompleteness(completenessRows, ['jra-racing-calendar-programme']).complete,
  banei: assessMotherSetCompleteness(completenessRows, ['banei-official-schedule']).complete,
  south_kanto: assessMotherSetCompleteness(completenessRows, [
    'nar-monthly-convene-info',
    'nankankeiba-south-kanto-calendar',
  ]).complete,
  iwate: assessMotherSetCompleteness(completenessRows, [
    'nar-monthly-convene-info',
    'iwatekeiba-official-calendar',
  ]).complete,
  hyogo: assessMotherSetCompleteness(completenessRows, [
    'nar-monthly-convene-info',
    'hyogo-urban-keiba-official-calendar',
  ]).complete,
  tokai: assessMotherSetCompleteness(completenessRows, [
    'nar-monthly-convene-info',
    'tokai-region-joint-official-calendar',
  ]).complete,
  other_nar: false,
};
const absenceReconciliationApplied = Object.values(absenceFamilyStatus).some(Boolean);
const attachObservations = (row) => {
  const observations = sourceObservations.get(row.meeting_id);
  if (!observations?.length) return row;
  return {
    ...row,
    source_trace: {
      ...(row.source_trace ?? {}),
      source_observations: observations,
    },
  };
};
const canonical = result.canonical.filter((row) => !isInvalidMombetsuAlias(row)).map(attachObservations);
const details = result.details.filter((row) => !isInvalidMombetsuAlias(row));
const publicMeetings = result.public.filter((row) => !isInvalidMombetsuAlias(row) && !removedStaleSet.has(row.meeting_id));
const publicDetails = result.publicDetails.filter((row) => !isInvalidMombetsuAlias(row) && !removedStaleSet.has(row.meeting_id));
const remainingReconcilablePublic = publicMeetings.filter((row) => isAbsentPublicMeeting(row) && canReconcileMeetingAbsence(row, completenessRows));
if (remainingReconcilablePublic.length) {
  throw new Error(`Japan public mother set retains reconcilable absent ${scope} meetings: ${remainingReconcilablePublic.map((row) => row.meeting_id).join(', ')}`);
}
const missingOfficialPublic = [...officialIds].filter((meetingId) => !publicMeetings.some((row) => row.meeting_id === meetingId));
if (missingOfficialPublic.length) {
  throw new Error(`Japan public mother set is missing official meetings: ${missingOfficialPublic.join(', ')}`);
}
const removedInvalidAliases = result.canonical.filter(isInvalidMombetsuAlias).map((row) => row.meeting_id);
const visibleStaleAudit = result.stale_audit.filter((row) => rangeDates.has(row.date));
const reconciliations = result.reconciliations.map((row) => ({
  ...row,
  source_observations: sourceObservations.get(row.meeting_id) ?? [],
}));

const write = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
};
write(canonicalPath, { ...read(canonicalPath), generated_at: result.checked_at, meetings: canonical });
write(detailsPath, { ...read(detailsPath), generated_at: result.checked_at, details });
write(publicPath, { ...read(publicPath), generated_at: result.checked_at, meetings: publicMeetings });
write(publicDetailsPath, { ...read(publicDetailsPath), generated_at: result.checked_at, details: publicDetails });
write(output, {
  ...result,
  scope,
  requested_days: requestedDays,
  range: scope === 'near' ? selectedRange : result.range,
  selected_dates: selectedDateList,
  reconciliations,
  source_completeness: completenessRows,
  mother_set_complete: motherSetComplete,
  mother_set_completeness_assessment: motherSetAssessment,
  absence_reconciliation_mode: 'per_family',
  absence_reconciliation_families: absenceFamilyStatus,
  absence_reconciliation_applied: absenceReconciliationApplied,
  complete: runComplete,
  canonical: undefined,
  public: undefined,
  details: undefined,
  publicDetails: undefined,
  stale_audit: visibleStaleAudit.map((row) => ({
    ...row,
    audit: removedStaleSet.has(row.meeting_id)
      ? 'canonical_only_public_removed'
      : isAbsentPublicMeeting(row) ? 'public_preserved_incomplete_mother_set' : row.audit,
  })),
  removed_invalid_aliases: removedInvalidAliases,
  removed_stale_public: removedStalePublic,
  preserved_stale_public: preservedStalePublic,
});
const outcomes = Object.fromEntries(reconciliations.map((row) => row.outcome).reduce((map, outcome) => map.set(outcome, (map.get(outcome) ?? 0) + 1), new Map()));
console.log(JSON.stringify({
  scope,
  requested_days: requestedDays,
  range: scope === 'near' ? selectedRange : result.range,
  official_counts: result.official_counts,
  official_meeting_count: result.official_meeting_count,
  source_completeness: Object.fromEntries(completenessRows.map((row) => [row.source_id, row.completeness])),
  mother_set_complete: motherSetComplete,
  mother_set_completeness_assessment: motherSetAssessment,
  absence_reconciliation_mode: 'per_family',
  absence_reconciliation_families: absenceFamilyStatus,
  absence_reconciliation_applied: absenceReconciliationApplied,
  outcomes,
  removed_invalid_aliases: removedInvalidAliases.length,
  removed_stale_public: removedStalePublic.length,
  preserved_stale_public: preservedStalePublic.length,
  complete: runComplete,
  public_rank_lower_than_official: result.public_rank_lower_than_official,
}));
