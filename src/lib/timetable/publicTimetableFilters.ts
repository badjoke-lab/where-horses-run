import {
  getPublicTimetableMeetingRows,
  type PublicTimetableMeetingRow,
} from './publicTimetableViewModel.ts';

export type PublicTimetableDayGroup = {
  readonly date: string;
  readonly rows: readonly PublicTimetableMeetingRow[];
};

export type PublicTimetableScope =
  | { readonly kind: 'all' }
  | { readonly kind: 'date'; readonly date: string }
  | { readonly kind: 'country'; readonly country_id: string }
  | { readonly kind: 'racecourse'; readonly racecourse_id: string };

export function sortPublicTimetableRows(
  rows: readonly PublicTimetableMeetingRow[],
): PublicTimetableMeetingRow[] {
  return [...rows].sort((left, right) =>
    `${left.date}:${left.country_id}:${left.racecourse_id}:${left.first_race_time_local ?? '99:99'}:${left.meeting_id}`.localeCompare(
      `${right.date}:${right.country_id}:${right.racecourse_id}:${right.first_race_time_local ?? '99:99'}:${right.meeting_id}`,
    ),
  );
}

export function getPublicTimetableRowsForDate(
  date: string,
): PublicTimetableMeetingRow[] {
  return sortPublicTimetableRows(
    getPublicTimetableMeetingRows().filter((row) => row.date === date),
  );
}

export function getPublicTimetableRowsByCountry(
  countryId: string,
): PublicTimetableMeetingRow[] {
  return sortPublicTimetableRows(
    getPublicTimetableMeetingRows().filter((row) => row.country_id === countryId),
  );
}

export function getPublicTimetableRowsByRacecourse(
  racecourseId: string,
): PublicTimetableMeetingRow[] {
  return sortPublicTimetableRows(
    getPublicTimetableMeetingRows().filter(
      (row) => row.racecourse_id === racecourseId,
    ),
  );
}

export function getPublicTimetableRowsByDateRange({
  startDate,
  endDate,
}: {
  readonly startDate: string;
  readonly endDate: string;
}): PublicTimetableMeetingRow[] {
  return sortPublicTimetableRows(
    getPublicTimetableMeetingRows().filter(
      (row) => row.date >= startDate && row.date <= endDate,
    ),
  );
}

export function getPublicTimetableRowsForScope(
  scope: PublicTimetableScope,
): PublicTimetableMeetingRow[] {
  if (scope.kind === 'date') return getPublicTimetableRowsForDate(scope.date);
  if (scope.kind === 'country') return getPublicTimetableRowsByCountry(scope.country_id);
  if (scope.kind === 'racecourse') {
    return getPublicTimetableRowsByRacecourse(scope.racecourse_id);
  }
  return sortPublicTimetableRows(getPublicTimetableMeetingRows());
}

export function groupPublicTimetableRowsByDate(
  rows: readonly PublicTimetableMeetingRow[],
): PublicTimetableDayGroup[] {
  const rowsByDate = rows.reduce((groups, row) => {
    groups[row.date] ??= [];
    groups[row.date].push(row);
    return groups;
  }, {} as Record<string, PublicTimetableMeetingRow[]>);

  return Object.entries(rowsByDate)
    .map(([date, dayRows]) => ({
      date,
      rows: sortPublicTimetableRows(dayRows),
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function limitPublicTimetableRows(
  rows: readonly PublicTimetableMeetingRow[],
  limit: number,
): PublicTimetableMeetingRow[] {
  return sortPublicTimetableRows(rows).slice(0, limit);
}
