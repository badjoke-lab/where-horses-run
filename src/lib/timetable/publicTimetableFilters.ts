import {
  getPublicTimetableMeetingRows,
  type PublicTimetableMeetingRow,
} from './publicTimetableViewModel';

export type PublicTimetableRowGroup = {
  readonly date: string;
  readonly records: readonly PublicTimetableMeetingRow[];
};

export type PublicTimetableScope =
  | { readonly type: 'all' }
  | { readonly type: 'date'; readonly date: string }
  | { readonly type: 'country'; readonly country_id: string }
  | { readonly type: 'racecourse'; readonly racecourse_id: string };

const sortRows = (
  rows: readonly PublicTimetableMeetingRow[],
): PublicTimetableMeetingRow[] =>
  [...rows].sort((left, right) =>
    `${left.date}:${left.country_id}:${left.racecourse_id}:${left.first_race_time_local ?? '99:99'}:${left.meeting_id}`.localeCompare(
      `${right.date}:${right.country_id}:${right.racecourse_id}:${right.first_race_time_local ?? '99:99'}:${right.meeting_id}`,
    ),
  );

export function getPublicTimetableRowsForDate(
  date: string,
): readonly PublicTimetableMeetingRow[] {
  return sortRows(
    getPublicTimetableMeetingRows().filter((record) => record.date === date),
  );
}

export function getPublicTimetableRowsByCountry(
  countryId: string,
): readonly PublicTimetableMeetingRow[] {
  return sortRows(
    getPublicTimetableMeetingRows().filter(
      (record) => record.country_id === countryId,
    ),
  );
}

export function getPublicTimetableRowsByRacecourse(
  racecourseId: string,
): readonly PublicTimetableMeetingRow[] {
  return sortRows(
    getPublicTimetableMeetingRows().filter(
      (record) => record.racecourse_id === racecourseId,
    ),
  );
}

export function getPublicTimetableRowsByScope(
  scope: PublicTimetableScope,
): readonly PublicTimetableMeetingRow[] {
  if (scope.type === 'date') return getPublicTimetableRowsForDate(scope.date);
  if (scope.type === 'country') return getPublicTimetableRowsByCountry(scope.country_id);
  if (scope.type === 'racecourse') return getPublicTimetableRowsByRacecourse(scope.racecourse_id);
  return sortRows(getPublicTimetableMeetingRows());
}

export function groupPublicTimetableRowsByDate(
  rows: readonly PublicTimetableMeetingRow[],
): readonly PublicTimetableRowGroup[] {
  const groups = rows.reduce((acc, record) => {
    acc[record.date] ??= [];
    acc[record.date].push(record);
    return acc;
  }, {} as Record<string, PublicTimetableMeetingRow[]>);

  return Object.entries(groups)
    .map(([date, records]) => ({ date, records: sortRows(records) }))
    .sort((left, right) => left.date.localeCompare(right.date));
}
