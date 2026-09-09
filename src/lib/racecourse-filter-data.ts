import { getCurrentCalendarWindowMeetingRows } from '../data/timetableMeetingRows';
import {
  getCalendarAuthorityDisplayName,
  getCalendarCountryDisplayName,
  getCalendarRacecourseDisplayName,
  getCalendarRacecourseDisplayNames,
} from './calendarDisplayNames';
import { getCountries, getRacecourses, type Racecourse } from './data';
import { isPublicActiveRacecourse } from './racecoursePublicSupport';
import { getRacingTypeById } from './racingTypes';

export type RacecourseDirectoryLocale = 'en' | 'ja';

export interface RacecourseFilterReference {
  id: string;
  label: string;
  href: string;
}

export interface RacecourseFilterMeetingContext {
  date: string;
  firstRaceTimeLocal: string | null;
  lastRaceTimeLocal: string | null;
  rank: string;
  href: string;
}

export interface RacecourseFilterRecord {
  id: string;
  slug: string;
  href: string;
  name: string;
  alternateName: string;
  localName: string;
  countryId: string;
  countryName: string;
  countryHref: string;
  city: string;
  region: string;
  racingTypes: RacecourseFilterReference[];
  authorities: RacecourseFilterReference[];
  surfaces: string[];
  direction: string;
  status: string;
  scheduleStatus: string;
  courseProfileStatus: string;
  calendarMeeting: RacecourseFilterMeetingContext | null;
  searchText: string;
}

export interface RacecourseFilterOptions {
  countries: RacecourseFilterReference[];
  authorities: RacecourseFilterReference[];
  racingTypes: RacecourseFilterReference[];
  surfaces: string[];
}

type FilterableRacecourse = Racecourse & {
  name_local?: string;
  city?: string;
  region?: string;
  racing_types?: readonly string[];
  surfaces?: readonly string[];
  direction?: string;
  status?: string;
  schedule_summary?: { status?: string };
  data_status?: { course_profile?: string };
};

export function normalizeRacecourseFilterText(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function nonempty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(nonempty))].sort((left, right) => left.localeCompare(right, 'en'));
}

function humanize(value: string): string {
  return value
    .split('-')
    .map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : part)
    .join(' ');
}

export function getRacecourseFilterRecords(locale: RacecourseDirectoryLocale): RacecourseFilterRecord[] {
  const isJapanese = locale === 'ja';
  const countries = getCountries();
  const countryById = new Map(countries.map((country) => [country.id, country]));
  const meetingsByRacecourseId = new Map<string, ReturnType<typeof getCurrentCalendarWindowMeetingRows>>();

  for (const meeting of getCurrentCalendarWindowMeetingRows()) {
    const bucket = meetingsByRacecourseId.get(meeting.racecourse_id) ?? [];
    bucket.push(meeting);
    meetingsByRacecourseId.set(meeting.racecourse_id, bucket);
  }

  for (const bucket of meetingsByRacecourseId.values()) {
    bucket.sort((left, right) =>
      `${left.date}:${left.first_race_time_local ?? '99:99'}:${left.meeting_id}`.localeCompare(
        `${right.date}:${right.first_race_time_local ?? '99:99'}:${right.meeting_id}`,
      ),
    );
  }

  return getRacecourses()
    .filter((racecourse) => isPublicActiveRacecourse(racecourse))
    .map((sourceRacecourse) => {
      const racecourse = sourceRacecourse as unknown as FilterableRacecourse;
      const country = countryById.get(racecourse.country_id);
      const fallbackEnglish = racecourse.name_en;
      const reviewedNames = getCalendarRacecourseDisplayNames(racecourse.id, fallbackEnglish);
      const name = getCalendarRacecourseDisplayName(racecourse.id, fallbackEnglish, locale);
      const alternateName = isJapanese
        ? reviewedNames.nameEn
        : reviewedNames.nameJa ?? reviewedNames.nameLocal ?? '';
      const localName = reviewedNames.nameLocal ?? '';
      const countryFallback = country?.name_en ?? racecourse.country_id;
      const countryName = getCalendarCountryDisplayName(racecourse.country_id, countryFallback, locale);
      const countryHref = country
        ? isJapanese ? `/ja/countries/${country.slug}/` : `/countries/${country.slug}/`
        : '';
      const racingTypes = uniqueStrings([...(racecourse.racing_types ?? [])]).map((id) => {
        const type = getRacingTypeById(id);
        return {
          id,
          label: type ? isJapanese ? type.name_ja : type.name_en : humanize(id),
          href: type ? isJapanese ? `/ja/types/${type.slug}/` : `/types/${type.slug}/` : '',
        };
      });
      const surfaces = uniqueStrings([...(racecourse.surfaces ?? [])]);
      const city = nonempty(racecourse.city) ? racecourse.city : '';
      const region = nonempty(racecourse.region) ? racecourse.region : '';
      const direction = nonempty(racecourse.direction) ? racecourse.direction : 'unknown';
      const status = nonempty(racecourse.status) ? racecourse.status : 'unknown';
      const scheduleStatus = nonempty(racecourse.schedule_summary?.status)
        ? racecourse.schedule_summary.status
        : 'official-link-only';
      const courseProfileStatus = nonempty(racecourse.data_status?.course_profile)
        ? racecourse.data_status.course_profile
        : 'partial';
      const href = isJapanese ? `/ja/tracks/${racecourse.slug}/` : `/tracks/${racecourse.slug}/`;
      const currentWindowMeetings = meetingsByRacecourseId.get(racecourse.id) ?? [];
      const authorityById = new Map<string, RacecourseFilterReference>();

      for (const meeting of currentWindowMeetings) {
        if (authorityById.has(meeting.authority_id)) continue;
        authorityById.set(meeting.authority_id, {
          id: meeting.authority_id,
          label: getCalendarAuthorityDisplayName(meeting.authority_id, meeting.authority_label, locale),
          href: '',
        });
      }

      const authorities = [...authorityById.values()].sort((left, right) => left.label.localeCompare(right.label));
      const firstMeeting = currentWindowMeetings[0] ?? null;
      const calendarMeeting = firstMeeting
        ? {
            date: firstMeeting.date,
            firstRaceTimeLocal: firstMeeting.first_race_time_local,
            lastRaceTimeLocal: firstMeeting.last_race_time_local,
            rank: firstMeeting.capability_rank,
            href: `${isJapanese ? '/ja/calendar/' : '/calendar/'}?date=${encodeURIComponent(firstMeeting.date)}`,
          }
        : null;
      const searchText = normalizeRacecourseFilterText([
        racecourse.id,
        racecourse.slug,
        ...reviewedNames.aliases,
        country?.name_en,
        country?.name_ja,
        countryName,
        city,
        region,
        direction,
        status,
        scheduleStatus,
        courseProfileStatus,
        ...authorities.flatMap((authority) => [authority.id, authority.label]),
        ...racingTypes.flatMap((type) => [type.id, type.label]),
        ...surfaces,
      ].filter(nonempty).join(' '));

      return {
        id: racecourse.id,
        slug: racecourse.slug,
        href,
        name,
        alternateName,
        localName,
        countryId: racecourse.country_id,
        countryName,
        countryHref,
        city,
        region,
        racingTypes,
        authorities,
        surfaces,
        direction,
        status,
        scheduleStatus,
        courseProfileStatus,
        calendarMeeting,
        searchText,
      };
    });
}

export function getRacecourseFilterOptions(records: RacecourseFilterRecord[]): RacecourseFilterOptions {
  const countryById = new Map<string, RacecourseFilterReference>();
  const authorityById = new Map<string, RacecourseFilterReference>();
  const racingTypeById = new Map<string, RacecourseFilterReference>();

  for (const record of records) {
    if (!countryById.has(record.countryId)) {
      countryById.set(record.countryId, {
        id: record.countryId,
        label: record.countryName,
        href: record.countryHref,
      });
    }
    for (const authority of record.authorities) {
      if (!authorityById.has(authority.id)) authorityById.set(authority.id, authority);
    }
    for (const type of record.racingTypes) {
      if (!racingTypeById.has(type.id)) racingTypeById.set(type.id, type);
    }
  }

  return {
    countries: [...countryById.values()].sort((left, right) => left.label.localeCompare(right.label)),
    authorities: [...authorityById.values()].sort((left, right) => left.label.localeCompare(right.label)),
    racingTypes: [...racingTypeById.values()].sort((left, right) => left.label.localeCompare(right.label)),
    surfaces: uniqueStrings(records.flatMap((record) => record.surfaces)),
  };
}
