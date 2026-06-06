import juneCalendar from '../../data/generated/timetable/june-2026-calendar.json';
import manualCanadaStandardbred from '../../data/generated/timetable/manual-june-2026-standardbred-canada.json';
import manualCanadaWoodbine from '../../data/generated/timetable/manual-june-2026-woodbine-thoroughbred.json';
import manualNzLoveracing from '../../data/generated/timetable/manual-june-2026-loveracing-thoroughbred.json';
import manualQueensland from '../../data/generated/timetable/manual-june-2026-racing-queensland-thoroughbred.json';
import manualRacingNsw from '../../data/generated/timetable/manual-june-2026-racing-nsw-thoroughbred.json';
import manualSouthAfrica from '../../data/generated/timetable/manual-june-2026-gold-circle.json';
import manualUkArabian from '../../data/generated/timetable/manual-june-2026-uk-purebred-arabian.json';
import manualUkPointToPoint from '../../data/generated/timetable/manual-june-2026-uk-point-to-point.json';
import hkjcNormalizedTimetableSample from '../../data/generated/timetable/hkjc-normalized-timetable.sample.json';
import { getNormalizedTimetableMeetingDetail } from './normalizedTimetableMeetingDetails';
import {
  createNormalizedTimetableMeetingDetailPath,
  normalizedTimetableCalendarPreviewRecords,
} from './normalizedTimetableCalendarPreview';

export type CalendarRank = 'C' | 'B' | 'B+' | 'A';

export type TimetableMeetingRow = {
  meeting_id: string;
  date: string;
  country_id: string;
  country_label: string;
  authority_id: string;
  authority_label: string;
  racecourse_id: string;
  racecourse_name: string;
  capability_rank: CalendarRank;
  first_race_time_local: string | null;
  last_race_time_local: string | null;
  official_source_url: string;
  detail_path: string;
  can_view_race_timetable: boolean;
  rank_weight: number;
  source_status?: string;
  last_checked_date?: string | null;
};

export type TimetableMeetingDayGroup = {
  date: string;
  records: TimetableMeetingRow[];
};

type GeneratedRecordSet = {
  country_id: string;
  country_label: string;
  group_id: string;
  group_label: string;
  data_level?: CalendarRank;
  source_trace?: {
    source_url?: string;
    source_capture_date?: string;
    last_checked?: string;
  };
  meetings?: [string, string][];
};

type NormalizedRecordInput = {
  meeting_id: string;
  date: string;
  country_id: string;
  authority_id: string;
  racecourse_id: string;
  capability_rank: CalendarRank;
  first_race_time_local: string | null;
  last_race_time_local: string | null;
  official_source_url: string;
  detail_path?: string;
  source_status?: string;
  last_checked_date?: string | null;
};

const monthStart = '2026-06-01';
const monthEnd = '2026-07-01';

const manualRecordSets = [
  manualCanadaStandardbred.record_set,
  manualCanadaWoodbine.record_set,
  manualNzLoveracing.record_set,
  manualQueensland.record_set,
  manualRacingNsw.record_set,
  manualSouthAfrica.record_set,
  manualUkArabian.record_set,
  manualUkPointToPoint.record_set,
].filter(Boolean) as GeneratedRecordSet[];

const rankWeight: Record<CalendarRank, number> = {
  C: 0,
  B: 1,
  'B+': 2,
  A: 3,
};

const racecourseNameById: Record<string, string> = {
  'tokyo-racecourse': 'Tokyo Racecourse',
  'obihiro-racecourse': 'Obihiro Racecourse',
  'sha-tin-racecourse': 'Sha Tin Racecourse',
  'happy-valley-racecourse': 'Happy Valley Racecourse',
};

const authorityLabelById: Record<string, string> = {
  jra: 'JRA',
  hkjc: 'HKJC',
  'nar-local-government-racing': 'NAR',
};

const countryLabelById: Record<string, string> = {
  japan: 'Japan',
  'hong-kong': 'Hong Kong',
};

const titleCaseId = (value: string) =>
  value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const slug = (value: string) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const normalizeRacecourseKey = (value: string) => slug(value).replace(/-racecourse$/, '');
const displayRacecourse = (racecourseId: string) => racecourseNameById[racecourseId] ?? titleCaseId(racecourseId);
const displayAuthority = (authorityId: string) => authorityLabelById[authorityId] ?? titleCaseId(authorityId);
const displayCountry = (countryId: string) => countryLabelById[countryId] ?? titleCaseId(countryId);
const hasRaceByRaceTimetable = (meetingId: string) =>
  (getNormalizedTimetableMeetingDetail(meetingId)?.timetable_rows.length ?? 0) > 0;

function cloneSet(set: GeneratedRecordSet): GeneratedRecordSet {
  return { ...set, meetings: [...(set.meetings ?? [])] };
}

function mergeRecordSets(data: { record_sets?: GeneratedRecordSet[] }) {
  const byGroup = new Map((data.record_sets ?? []).map((set) => [`${set.country_id}::${set.group_id}`, cloneSet(set)]));
  for (const manual of manualRecordSets) {
    const key = `${manual.country_id}::${manual.group_id}`;
    if (!byGroup.has(key)) byGroup.set(key, { ...manual, meetings: [] });
    const target = byGroup.get(key);
    if (!target) continue;
    target.source_trace = manual.source_trace;
    target.data_level = manual.data_level;
    for (const meeting of manual.meetings ?? []) {
      const meetingKey = `${meeting[0]}::${meeting[1]}`;
      const exists = target.meetings?.some((item) => `${item[0]}::${item[1]}` === meetingKey);
      if (!exists) target.meetings = [...(target.meetings ?? []), meeting];
    }
  }
  return [...byGroup.values()];
}

function toGeneratedRows(recordSets: GeneratedRecordSet[]): TimetableMeetingRow[] {
  return recordSets.flatMap((set) =>
    (set.meetings ?? [])
      .filter(([meetingDate]) => meetingDate >= monthStart && meetingDate < monthEnd)
      .map(([meetingDate, racecourse]) => {
        const capabilityRank = (set.data_level ?? 'C') as CalendarRank;
        const racecourseId = slug(racecourse);
        return {
          meeting_id: `generated-${meetingDate}-${set.country_id}-${set.group_id}-${racecourseId}`,
          date: meetingDate,
          country_id: set.country_id,
          country_label: set.country_label,
          authority_id: set.group_id,
          authority_label: set.group_label,
          racecourse_id: racecourseId,
          racecourse_name: racecourse,
          capability_rank: capabilityRank,
          first_race_time_local: null,
          last_race_time_local: null,
          official_source_url: set.source_trace?.source_url ?? '#',
          detail_path: '',
          can_view_race_timetable: false,
          rank_weight: rankWeight[capabilityRank] ?? 0,
          source_status: 'generated',
          last_checked_date: set.source_trace?.last_checked ?? null,
        };
      }),
  );
}

function toNormalizedRows(): TimetableMeetingRow[] {
  const normalizedRecordInputs = [
    ...normalizedTimetableCalendarPreviewRecords,
    ...(hkjcNormalizedTimetableSample.records as NormalizedRecordInput[]),
  ] as NormalizedRecordInput[];

  return normalizedRecordInputs
    .filter((record) => record.date >= monthStart && record.date < monthEnd)
    .map((record) => {
      const capabilityRank = record.capability_rank as CalendarRank;
      const canViewRaceTimetable = capabilityRank === 'A' && hasRaceByRaceTimetable(record.meeting_id);
      return {
        meeting_id: record.meeting_id,
        date: record.date,
        country_id: record.country_id,
        country_label: displayCountry(record.country_id),
        authority_id: record.authority_id,
        authority_label: displayAuthority(record.authority_id),
        racecourse_id: record.racecourse_id,
        racecourse_name: displayRacecourse(record.racecourse_id),
        capability_rank: capabilityRank,
        first_race_time_local: record.first_race_time_local,
        last_race_time_local: record.last_race_time_local,
        official_source_url: record.official_source_url,
        detail_path: canViewRaceTimetable
          ? (record.detail_path ?? createNormalizedTimetableMeetingDetailPath(record.meeting_id))
          : '',
        can_view_race_timetable: canViewRaceTimetable,
        rank_weight: rankWeight[capabilityRank],
        source_status: record.source_status,
        last_checked_date: record.last_checked_date ?? null,
      };
    });
}

export function getTimetableMeetingRows(): TimetableMeetingRow[] {
  const generatedRows = toGeneratedRows(mergeRecordSets(juneCalendar as { record_sets?: GeneratedRecordSet[] }));
  const normalizedRows = toNormalizedRows();
  const rowsByMeeting = new Map<string, TimetableMeetingRow>();

  for (const record of [...generatedRows, ...normalizedRows]) {
    const meetingKey = `${record.date}::${record.country_id}::${normalizeRacecourseKey(record.racecourse_id)}`;
    const existing = rowsByMeeting.get(meetingKey);
    if (!existing || record.rank_weight > existing.rank_weight) rowsByMeeting.set(meetingKey, record);
  }

  return [...rowsByMeeting.values()].sort((left, right) =>
    `${left.date}:${left.country_id}:${left.racecourse_name}:${left.first_race_time_local ?? '99:99'}:${left.meeting_id}`.localeCompare(
      `${right.date}:${right.country_id}:${right.racecourse_name}:${right.first_race_time_local ?? '99:99'}:${right.meeting_id}`,
    ),
  );
}

export function getTimetableMeetingRowsForDate(date: string): TimetableMeetingRow[] {
  return getTimetableMeetingRows().filter((record) => record.date === date);
}

export function getGroupedTimetableMeetingRows(records = getTimetableMeetingRows()): TimetableMeetingDayGroup[] {
  const recordsByDate = records.reduce((groups, record) => {
    groups[record.date] ??= [];
    groups[record.date].push(record);
    return groups;
  }, {} as Record<string, TimetableMeetingRow[]>);

  return Object.entries(recordsByDate)
    .map(([date, dayRecords]) => ({
      date,
      records: dayRecords.sort((left, right) =>
        `${left.country_id}:${left.racecourse_name}:${left.first_race_time_local ?? '99:99'}:${left.meeting_id}`.localeCompare(
          `${right.country_id}:${right.racecourse_name}:${right.first_race_time_local ?? '99:99'}:${right.meeting_id}`,
        ),
      ),
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function getCurrentTimetableDate() {
  const buildDate = new Date().toISOString().slice(0, 10);
  return buildDate.startsWith('2026-06-') ? buildDate : '2026-06-03';
}

export function getTomorrowTimetableDate() {
  const tomorrowDate = new Date(`${getCurrentTimetableDate()}T00:00:00.000Z`);
  tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
  return tomorrowDate.toISOString().slice(0, 10);
}
