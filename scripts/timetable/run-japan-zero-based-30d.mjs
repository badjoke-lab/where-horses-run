import fs from 'node:fs';
import path from 'node:path';
import { runJapanZeroBased30d } from './japan-zero-based-30d-core.mjs';
import { japanOfficial30dAdapters } from './japan-official-30d-adapters.mjs';
import { discoverJraOfficial30d } from './jra-official-30d-discovery.mjs';
import { discoverBaneiOfficial30d } from './banei-official-30d-discovery.mjs';

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

function keepOutsideCurrentUnofficialJapan(row, officialIds, rangeDates) {
  return !(row?.country_id === 'japan' && rangeDates.has(row.date) && !officialIds.has(row.meeting_id));
}

const args = new Map(process.argv.slice(2).map((value) => value.split(/=(.*)/s).slice(0, 2)));
const executionDate = args.get('--execution-date') ?? japanToday();
const output = args.get('--output') ?? 'data/generated/timetable/japan-zero-based-30d-reconciliation.json';
const canonicalPath = 'data/generated/timetable/canonical/meetings.json';
const detailsPath = 'data/generated/timetable/canonical/meeting-details.json';
const publicPath = 'data/generated/timetable/public/meeting-list.json';
const publicDetailsPath = 'data/generated/timetable/public/meeting-details.json';
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const narStandardAdapter = japanOfficial30dAdapters['nar-standard'];
const adapters = {
  ...japanOfficial30dAdapters,
  jra: {
    ...japanOfficial30dAdapters.jra,
    discover: discoverJraOfficial30d,
  },
  'nar-standard': {
    ...narStandardAdapter,
    discover: async (context) => (await narStandardAdapter.discover(context)).map(normalizeNarMeetingId),
  },
  banei: {
    ...japanOfficial30dAdapters.banei,
    discover: discoverBaneiOfficial30d,
  },
};
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

const officialIds = new Set(result.reconciliations.map((row) => row.meeting_id));
const rangeDates = new Set(result.range.dates);
const canonical = result.canonical.filter((row) => !isInvalidMombetsuAlias(row));
const details = result.details.filter((row) => !isInvalidMombetsuAlias(row));
const publicMeetings = result.public.filter((row) => !isInvalidMombetsuAlias(row) && keepOutsideCurrentUnofficialJapan(row, officialIds, rangeDates));
const publicDetails = result.publicDetails.filter((row) => !isInvalidMombetsuAlias(row) && keepOutsideCurrentUnofficialJapan(row, officialIds, rangeDates));
const remainingUnexpectedPublic = publicMeetings.filter((row) => row.country_id === 'japan' && rangeDates.has(row.date) && !officialIds.has(row.meeting_id));
if (remainingUnexpectedPublic.length) {
  throw new Error(`Japan public mother set contains non-official current-window meetings: ${remainingUnexpectedPublic.map((row) => row.meeting_id).join(', ')}`);
}
const missingOfficialPublic = [...officialIds].filter((meetingId) => !publicMeetings.some((row) => row.meeting_id === meetingId));
if (missingOfficialPublic.length) {
  throw new Error(`Japan public mother set is missing official meetings: ${missingOfficialPublic.join(', ')}`);
}
const removedInvalidAliases = result.canonical.filter(isInvalidMombetsuAlias).map((row) => row.meeting_id);
const removedStalePublic = result.public
  .filter((row) => row.country_id === 'japan' && rangeDates.has(row.date) && !officialIds.has(row.meeting_id))
  .map((row) => row.meeting_id);

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
  canonical: undefined,
  public: undefined,
  details: undefined,
  publicDetails: undefined,
  stale_audit: result.stale_audit.map((row) => ({
    ...row,
    audit: removedStalePublic.includes(row.meeting_id) ? 'canonical_only_public_removed' : row.audit,
  })),
  removed_invalid_aliases: removedInvalidAliases,
  removed_stale_public: removedStalePublic,
});
const outcomes = Object.fromEntries(result.reconciliations.map((row) => row.outcome).reduce((map, outcome) => map.set(outcome, (map.get(outcome) ?? 0) + 1), new Map()));
console.log(JSON.stringify({
  range: result.range,
  official_counts: result.official_counts,
  official_meeting_count: result.official_meeting_count,
  outcomes,
  removed_invalid_aliases: removedInvalidAliases.length,
  removed_stale_public: removedStalePublic.length,
  complete: result.complete,
  public_rank_lower_than_official: result.public_rank_lower_than_official,
}));
